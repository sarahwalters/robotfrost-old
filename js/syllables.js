exports.getSyllables = function(word, c) {
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

// only needed in this file -> don't export
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