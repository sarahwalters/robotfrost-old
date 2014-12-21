/* TODO:
-> multiple js files
-> strip punctuation
-> run db locally
-> subarray method
*/


/* REQUIRE STATEMENTS */
var express = require('express');
var app = express();
var pg = require('pg');
var fs = require('fs');
var cmu = require('cmudict').CMUDict;


/* INITIALIZATIONS */
var c = new cmu();


/* APP ROUTING */
app.set('port', 5000) //(process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
	//result = isRhyme('prosaic', 'mosaic', 1);
	//result = rhymePart('prosaic', 2);
	//response.send(result);

	pipeline = [read, process, markov];
	console.log('Starting pipeline');
	advancePipeline('text/twoCities.txt', response, pipeline);
	//response.send(overlap(['a', 'b', 'c'], ['b', 'd']));
})

app.get('/db', function(request, response) {
	//response.send(process.env.DATABASE_URL);
	pg.connect(process.env.DATABASE_URL, function(err, client, done) {
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


/* PIPELINE HANDLING */
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

/* PIPELINE STAGES */
function read(filename, response, pipeline) {
	fs.readFile(filename, 'ascii', function(err, data) {
		console.log('Starting process');
		advancePipeline(data, response, pipeline);
	});
}

function process(data, response, pipeline) {
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
		rp = rhymePart(w,1);
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
			s = getStresses(w);
			if (s in stress) {
				if (stress[s].indexOf(w) < 0) {
					stress[s].push(w);
				}
			} else {
				stress[s] = [w];
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
				patternList = concatenate(patternList, stress[subPattern])
			}
		}

		// pick one which fits w/ both & use it
		chooseFrom = overlap(postList, patternList);
		seed = chooseFrom[randint(chooseFrom.length)];
		out += ' ' + seed;
		removeLength = getStresses(seed).length;
		stressPattern = stressPattern.substring(removeLength);
	}

	console.log('Done');
	advancePipeline(out, response, pipeline);
}



/* UTILITIES */
/* ...extracting stress pattern */
function getStresses(word) {
	syls = syllables(word);
	res = '';
	for (var i=0; i < syls.length; i++) {
		syl = syls[i];
		if (syl.indexOf('0') != -1) {
			res += '0';
		} else {
			res += '1';
		}
	}
	return res;
}

/* ...checking for rhyme */
function isRhyme(word1, word2, n) {
	syls1 = syllables(word1);
	syls2 = syllables(word2);

	if (syls1 == null || syls2 == null) {
		return false;
	}

	for (i = syls1.length-1; i > syls1.length-1-n; i--) {
		if (syls1[i] != syls2[i]) {
			return false;
		}
	}

	return true;
}

function rhymePart(word, n) {
	syls = syllables(word);
	res = '';

	// return null OR put together appropriate # of syllables
	if (syls == null || syls.length < 1) {
		return null;
	} else {
		for (var i=syls.length-1; i > syls.length-1-n; i--) {
			res = syls[i] + res;
		}
	}

	// take off leading consonants
	stripped = false;
	vowels = 'AEIOU';
	while (!stripped) {
		leading = res.substring(0,1);
		if (vowels.indexOf(leading) < 0) { 
			res = res.substring(1); // leading consonant - strip
		} else { 
			return res; // found vowel - return
		}
	}
	return res;
}


/* ...syllable splitting */
function syllables(word) {
	try {
		var phonemes = c.get(word).split(' '); // array

		// parse syllables
		cur = '';

		// ...handle each phoneme at a time
		vowelIndices = findVowels(phonemes);
		numSyls = vowelIndices.length;

		syls = [];
		i = 0;
		while (i < phonemes.length) {
			// phoneme components
			p = phonemes[i];
			next = phonemes[i+1];

			// always add the current one
			cur += p;
			isVowel = vowelIndices.indexOf(i); // whether p represents vowel
			i++;

			// handle special vowel cases
			if (isVowel != -1) {
				// not last syl & followed by >=2 consonants? add the next phoneme
				n = syls.length;
				if (n < numSyls - 1) {
					if (vowelIndices[n+1] - vowelIndices[n] > 2) {
						cur += next;
						i++;
					}
				}

				// last syl?
				if (syls.length == numSyls-1) {
					while (i < phonemes.length) {
						cur += phonemes[i];
						i++;
					}
				}

				// push the syllable
				syls.push(cur);
				cur = '';
			}
		}
		return syls;
	} catch (err) {
		return null;
	}
}

function findVowels(phonemes) {
	indices = [];
	for (var i=0; i < phonemes.length; i++) {
		p = phonemes[i];
		isVowel = (p.indexOf('2') != -1) || (p.indexOf('1') != -1) || (p.indexOf('0') != -1);
		if (isVowel) {
			indices.push(i);
		}
	}
	return indices;
}

/* ...random numbers */
function randint(resolution) {
	rand = Math.random();
	return Math.floor(rand*resolution);
}

/* ...list management */
function overlap(list1, list2) {
	var overlap = [];
	for (var i=0; i < list1.length; i++) {
		var item = list1[i];
		if (list2.indexOf(item) != -1) {
			overlap.push(item);
		}
	}
	return overlap;
}

function concatenate(list1, list2) {
	for (var i=0; i < list2.length; i++) {
		list1.push(list2[i]);
	}
	return list1;
}