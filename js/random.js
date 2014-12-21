// ...random numbers
exports.randint = function(resolution) {
	rand = Math.random();
	return Math.floor(rand*resolution);
}