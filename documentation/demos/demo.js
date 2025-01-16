$(document).ready(function(){
		$('.gallery')._TMS({
			show:0,
			pauseOnHover:true,
			prevBu:'.prev',
			nextBu:'.next',
			playBu:'.play',
			duration:10000,
			preset:'zoomer',
			pagination:$('.img-pags').uCarousel({show:10,shift:0}),
			pagNums:false,
			slideshow:7000,
			numStatus:true,
			banners:'fromRight',// fromLeft, fromRight, fromTop, fromBottom
			waitBannerAnimation:false,
			progressBar:'<div class="progbar"></div>'
		})		
 })