var before = "
			<!DOCTYPE html>
			<head>
				<title>Test</title>
			</head>

			<body>
			"

var after = "
			</body>
			"

exports.html = function(text) {
	return before + text + after;
}