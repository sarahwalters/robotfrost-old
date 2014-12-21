exports.overlap = function(list1, list2) {
	var overlap = [];
	for (var i=0; i < list1.length; i++) {
		var item = list1[i];
		if (list2.indexOf(item) != -1) {
			overlap.push(item);
		}
	}
	return overlap;
}