/* TODO:
-> run db locally
-> subarray method
*/


// REQUIRE STATEMENTS
var NPM = {
	express: require('express'),
	pg: require('pg'),
	fs: require('fs'),
	cmu: require('cmudict').CMUDict,
	jade: require('jade')
}

var UTILS = {
	rhyme: require('./js/rhyme.js'),
	stress: require('./js/stress.js'),
	syls: require('./js/syllables.js'),
	lists: require('./js/lists.js'),
	random: require('./js/random.js'),
}


// INITIALIZATIONS
var c = new NPM.cmu();
var app = NPM.express();


// APP ROUTING
app.configure(function() {
	app.set('port', process.env.PORT || 5000)
	app.set('view engine', 'jade');
})

app.use(NPM.express.static(__dirname + '/public'))

app.get('/', function(request, response) {
	pipeline = [read, digest, generate, render];
	console.log('Starting pipeline');
	advancePipeline('text/twoCities.txt', response, pipeline);
})

app.get('/db', function(request, response) {
	//response.send(process.env.DATABASE_URL);
	NPM.pg.connect(process.env.DATABASE_URL, function(err, client, done) {
		client.query('SELECT * FROM test_table', function(err, result) {
			done();
			if (err) {
				console.error(err);
				response.send("Error " + err);
			} else {
				response.send(result.rows);
			}
		});
	});
})

app.listen(app.get('port'), function() {
	console.log("Node app is running at localhost:" + app.get('port'))
})


//PIPELINE HANDLING 
function advancePipeline(data, response, pipeline) {
	if (pipeline.length > 0) {
		callback = pipeline[0];

		// replace with subarray method
		remPipeline = [];
		for (i=1; i < pipeline.length; i++) {
			remPipeline.push(pipeline[i]);
		}

		callback(data, response, remPipeline);
	} else {
		response.send(data);
	}
}


// PIPELINE STAGES 
function read(filename, response, pipeline) {
	NPM.fs.readFile(filename, 'ascii', function(err, data) {
		console.log('Starting process');
		advancePipeline(data, response, pipeline);
	});
}

function digest(data, response, pipeline) {
	// get words
	wordsRaw = data.split(/(?!')\W/) // at non-alpha characters (only words)
	
	// strip empty words
	words = [];
	for (var i=0; i < wordsRaw.length; i++) {
		word = wordsRaw[i];
		if (word.length > 0) {
			words.push(word);
		}
	}

	// build lookups for rhyme, markov, & stress
	var rhyme = {};
	var stress = {};
	var prev = {};
	var post = {};
	for (var i=0; i < words.length; i++) {
		w = words[i].toLowerCase();
		s = UTILS.syls.getSyllables(w, c);
		rp = UTILS.rhyme.rhymePart(s,1);
		if (rp != null) { // ie word can be broken into phonemes
			// preceding word
			if (i > 0) {
				prevWord = words[i-1].toLowerCase();
				if (w in prev) {
					prev[w].push(prevWord);
				} else {
					prev[w] = [prevWord];
				}
			}

			// following word
			if (i < words.length-1) {
				postWord = words[i+1].toLowerCase();
				if (w in post) {
					post[w].push(postWord);
				} else {
					post[w] = [postWord];
				}
			}

			// rhyme part
			if (rp in rhyme) {
				if (rhyme[rp].indexOf(w) < 0) {
					rhyme[rp].push(w);
				}
			} else {
				rhyme[rp] = [w];
			}

			// stress pattern
			p = UTILS.stress.getStresses(s);
			if (p in stress) {
				if (stress[p].indexOf(w) < 0) {
					stress[p].push(w);
				}
			} else {
				stress[p] = [w];
			}
		}
	}

	console.log('Starting generate');
	advancePipeline([rhyme, stress, prev, post], response, remPipeline);
}

function generate(dicts, response, pipeline) {
	// unpack
	rhyme = dicts[0];
	stress = dicts[1];
	post = dicts[3];

	// make the stress pattern
	stressPattern = '';
	numIambs = 5;
	for (var i=0; i < numIambs; i++) {
		stressPattern += '01';
	}

	rhymePattern = '01012323454566';

	// choose the end rhymes
	var endRhymes = [];
	while (endRhymes.length < 7) {
		var key = UTILS.random.randChoice(rhyme);
		var words = rhyme[key];

		var usableWords = [];
		for (var i=0; i<words.length; i++) {
			var word = words[i];
			var syls = UTILS.syls.getSyllables(word, c);
			var sp = UTILS.stress.getStresses(syls);

			// fits stress pattern?
			var usable = true;
			for (var j=0; j<sp.length; j++) {
				if (sp[sp.length-j-1] != stressPattern[stressPattern.length-j-1]) {
					usable = false;
				}
			}

			if (usable) {
				usableWords.push(word);
			}
		}

		if (usableWords.length > 2) {
			endRhymes.push(usableWords);
		}
	}

	// generate poem
	var out = '';
	var poem = [];

	// initial end rhyme
	for (var i=0; i < rhymePattern.length; i++) {
		var rhymesIndex = parseInt(rhymePattern.substring(i,i+1));
		var rhymes = endRhymes[rhymesIndex];

		var choiceIndex = UTILS.random.randint(rhymes.length);
		var choice = rhymes[choiceIndex];
		endRhymes[rhymesIndex].splice(choiceIndex,1); // don't reuse words

		// update stress pattern for line
		var choiceSyls = UTILS.syls.getSyllables(choice, c);
		var choiceStress = UTILS.stress.getStresses(choiceSyls);
		var updatedsp = stressPattern.substring(0, stressPattern.length-choiceStress.length);

		// push line and stress pattern to poem
		var line = choice;

		poem.push([line, updatedsp]);
	}

	// rest of pattern
	for (var i=0; i < poem.length; i++) {
		var line = poem[i];

		while (line[1].length > 0) {
			// possible words
			var patternList = []
			for (var j=line[1].length-1; j >= 0; j--) {
				subPattern = line[1].substring(j);
				if (subPattern in stress) {
					patternList = patternList.concat(stress[subPattern]);
				}
			}

			// choose one
			var choiceIndex = UTILS.random.randint(patternList.length);
			var choice = patternList[choiceIndex];

			var choiceSyls = UTILS.syls.getSyllables(choice, c);
			var choiceStress = UTILS.stress.getStresses(choiceSyls);
			line[1] = line[1].substring(0, line[1].length-choiceStress.length);
			line[0] = choice + ' ' + line[0];
		}
	}

	console.log('Done');
	advancePipeline(poem, response, pipeline);
}

function render(data, response, pipeline) {
	poem = [];
	for (var i=0; i < data.length; i++) {
		var line = data[i];
		poem.push(line[0]);
	}

	var words = poem.join(' ').split(' ');

	var titleLength = UTILS.random.randint(2)+1;
	var title = '';
	for (var i=0; i < titleLength; i++) {
		var choice = words[UTILS.random.randint(words.length)];
		title = title + ' ' + choice;
	}

	response.render('layout.jade', {
		poem: poem,
		title: title,
		author: 'Robot Frost'
	});
}