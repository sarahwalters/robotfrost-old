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
	advancePipeline('text/twoCities.txt', response, pipeline);
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
		advancePipeline(data, response, pipeline);
	});
}

function process(data, response, pipeline) {
	// get words
	wordsRaw = data.split(/\s/);
	
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
		}
	}

	advancePipeline(post, response, remPipeline);
}

function markov(wordMap, response, pipeline) {
	count = 0;
	endCount = 8;
	res = '';

	seed = 'war';
	res += seed;

	while (count < endCount) {
		chooseFrom = wordMap[seed];
		seed = chooseFrom[chooseFrom.length-1];
		res += ' ' + seed;
		count++;
	}

	advancePipeline(res, response, pipeline);
}



/* UTILITIES */
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
	if (syls == null || syls.length < 1) {
		return null;
	} else {
		for (var i=syls.length-1; i > syls.length-1-n; i--) {
			res = syls[i] + res;
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