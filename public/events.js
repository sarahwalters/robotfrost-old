var EVENTS = {
	register: function() {
		$('#regenerate').on('click', function() {
			var mainHeight = $('#main').height();
			$('#main').css('display','none');
			$('#blockui').css('display', 'block');
			$('#blockui p').css('margin-top', mainHeight/2 + 'px');
			
			$.ajax('/test', {
				type: 'POST',
				data: JSON.stringify({test:'hello'}),
				success: function(data) {
					$('div').attr({'background-color':'white'});
					$('body').html(data);
				},
				error: function() {
					console.log('error');
				}
			})
		})
	}
}