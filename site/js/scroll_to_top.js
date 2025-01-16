$(document).ready(function(){	
	$(window).scroll(function () {
		if ($(this).scrollTop() > 20) {
			$('#back-top').stop(true).css({"display":"block"}).animate({"opacity": 1}, 400);
		} else {
			$('#back-top').stop(true).animate({"opacity": 0}, 400, function(){$(this).css({"display":"none"})});
		}
	});
	$('#back-top').click(function () {
		$('body, html').stop(true).animate({scrollTop: 0}, 600);
		return false;
	});
})