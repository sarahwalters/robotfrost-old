$(document).ready(function() {
	var lines = $('div#poem p');

	var widest = 0;
	var height = 0;
	for (var i=0; i < lines.length; i++) {
		var line = $(lines[i]);
		var width = line.width();
		if (width > widest) {
			widest = width;
		}
		height = height + line.outerHeight(true);
	}
	$('div').width(widest+1);
	$('div#poem').height(height);
});