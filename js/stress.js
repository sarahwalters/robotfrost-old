exports.getStresses = function(syls) {
	res = '';

	if (syls == null || syls.length == 0) {
		return null;
	}

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