// ...checking for rhyme
exports.isRhyme = function (syls1, syls2, n) {
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

exports.rhymePart = function(syls, n) {
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