

/**
* Open the Link
*/
function openResult(link){
	location.href=link;
}

/**
* Closes Open/close the toggle button
*/
function closeToggler(){
	$('#navbar-main-collapse').toggleClass('collapse');
}

/**
* open the ID selected from navigation bar
*/
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth',
						block: 'start',
						inline: 'nearest'
        });
    });
});

/**
* Check what div by ID is in view
*/
$.fn.isInViewport = function() {
  var elementTop = $(this).offset().top;
  var elementBottom = elementTop + $(this).outerHeight();

  var viewportTop = $(window).scrollTop();
  var viewportBottom = viewportTop + $(window).height();

  return elementBottom > viewportTop && elementTop < viewportBottom;
};
/**
* if main (name) is in view, do not show bottom shadow border
*/
$(window).on('resize scroll', function() {
	if($('#main').isInViewport()){
		$('#topNav').removeClass('bottom-shadow');
	} else{
		$('#topNav').addClass('bottom-shadow');
	}
});
