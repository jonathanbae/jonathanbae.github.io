////////////////////////
///// Main JS file /////
////////////////////////

var images;

/**
 * Open the Link
 */
function openResult(link) {
  location.href = link;
}

/**
 * Toggle the toggle menu
 */
function toggleToggler() {
  $('#navbar-main-collapse').toggleClass('collapse');
}
/**
 * Closes the toggle button
 */
function closeToggler() {
  if (!$('#navbar-main-collapse').hasClass('collapse')) {
    $('#navbar-main-collapse').addClass('collapse');
  }
}

/**
 * open the ID selected from navigation bar
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
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
  // main not in view
  if ($('#main').isInViewport()) {
    $('#topNav').removeClass('bottom-shadow');
    $('#topNav').removeClass('dark-color-bg');
    $('#topNav').addClass('transparent-bg');
  } else {
    $('#topNav').addClass('bottom-shadow');
    $('#topNav').removeClass('transparent-bg');
    $('#topNav').addClass('dark-color-bg');
  }
});

/**
 * set background image randomly
 */
function setBackgroundImage() {
  var randomGroup = Math.floor(Math.random() * Object.keys(images).length),
    num = 0;
  for (var key in images) {
    if (num == randomGroup && images.hasOwnProperty(key)) {
      var val = images[key],
        randomImage = Math.floor(Math.random() * val.length);
      for (var i in val) {
        if( randomImage == i ){
          document.getElementById('main').style.backgroundImage = "url(" + val[i] + ")";
          break;
        }
      }
      break;
    }
    num++;
  }
}

// setInterval("setBackgroundImage();", 5000);

function initialize() {
  images = imagesFolders;
  setBackgroundImage();
}

initialize();
