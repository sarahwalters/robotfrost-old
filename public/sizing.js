var SIZING = {
	size: function() {
		var lines = $('div#poem p');

		// size #main & subdivs
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

		// size #poem
		$('div#poem').height(height);

		// center button
		var button = $('#regenerate');
		var buttonMargin = (widest+1-button.width())/2;
		button.css('margin-left', buttonMargin);
	}
}