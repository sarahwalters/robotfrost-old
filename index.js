/* TODO:
-> strip punctuation
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
	pipeline = [read, digest, markov, render];
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
	wordsRaw = data.split(/\W/) // at non-alpha characters (only words)
	
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

	console.log('Starting Markov');
	advancePipeline([rhyme, stress, prev, post], response, remPipeline);
}

function markov(dicts, response, pipeline) {
	// make the stress pattern
	stressPattern = '';
	numIambs = 10;
	for (var i=0; i < numIambs; i++) {
		stressPattern += '01';
	}

	stress = dicts[1];
	post = dicts[3];

	out = '';

	seed = 'the';
	out += seed;
	stressPattern = stressPattern.substring(1);

	while (stressPattern.length > 5) {
		// which words fit Markov pattern?
		postList = post[seed];

		// which words fit stress pattern?
		patternList = []
		for (var i=1; i < stressPattern.length; i++) {
			subPattern = stressPattern.substring(0,i);
			if (subPattern in stress) {
				patternList = patternList.concat(stress[subPattern])
			}
		}

		// pick one which fits w/ both & use it
		chooseFrom = UTILS.lists.overlap(postList, patternList);
		if (chooseFrom.length == 0) {
			chooseFrom = ['was', 'the'];
		}
		seed = chooseFrom[UTILS.random.randint(chooseFrom.length)];
		seedSyls = UTILS.syls.getSyllables(seed, c);
		seedStress = UTILS.stress.getStresses(seedSyls);
		while (seedStress == null || seedStress.length == 0) {
			seed = chooseFrom[UTILS.random.randint(chooseFrom.length)];
			seedStress = UTILS.stress.getStresses(seedSyls);
		}

		out += ' ' + seed;
		removeLength = seedStress.length;
		stressPattern = stressPattern.substring(removeLength);
	}

	console.log('Done');
	advancePipeline(out, response, pipeline);
}

function render(data, response, pipeline) {
	response.render('layout.jade', {
		poem: data + '</br>' + 
	});
}