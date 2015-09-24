var SIZING = {
	size: function() {
		var lines = $('div#poem p');
		console.log(lines.length);
		console.log($('div#introText'));

		// size #main & subdivs
		var divWidth;
		if (lines.length) {
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
			divWidth = widest + 1;
		} else {
			divWidth = 400;
		}

		$('div').width(divWidth);

		// size #poem
		$('div#poem').height(height);

		// center button
		var button = $('#generate');
		var buttonMargin = (divWidth-button.outerWidth())/2;
		button.css('margin-left', buttonMargin);
	}
}
