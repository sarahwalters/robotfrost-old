var express = require('express');
var app = express();
var cool = require('cool-ascii-faces');
var pg = require('pg');
var fs = require('fs');
var cmu = require('cmudict').CMUDict;
var c = new cmu();

var text = ''

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
	var result = ''
	var times = process.env.TIMES || 5
	for (i=0; i<times; i++) {
		//result += cool()
	}

	//result += isRhyme('prosaic', 'mosaic', 1);
	result = read('text/twoCities.txt', response);
	//response.send(result);
})

app.get('/db', function(request, response) {
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

/* TEXT INPUT */
function read(filename, response) {
	fs.readFile(filename, 'ascii', function(err, data) {
		response.send(data);
	});
}

/* CHECKING FOR RHYME */
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


/* SYLLABLE SPLITTING */
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
	for (i=0; i < phonemes.length; i++) {
		p = phonemes[i];
		isVowel = (p.indexOf('2') != -1) || (p.indexOf('1') != -1) || (p.indexOf('0') != -1);
		if (isVowel) {
			indices.push(i);
		}
	}
	return indices;
}