// ...random numbers
exports.randint = function(resolution) {
	rand = Math.random();
	return Math.floor(rand*resolution);
}

// http://stackoverflow.com/questions/2532218/pick-random-property-from-a-javascript-object
exports.randChoice = function(obj) {
	var result;
	var count = 0;
	for (var prop in obj) {
		if (Math.random() < 1/++count) {
			result = prop;
		}
	}
	return result;
}