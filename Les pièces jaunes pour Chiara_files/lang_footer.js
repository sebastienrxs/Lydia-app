$(document).ready(function() {
    var number_li = $(".web-footer-dropdown li").length;
    $(".web-footer-dropdown").css("top", "-" + number_li * $(".web-footer-dropdown-item").height() + "px");

    // Make dynamic counter
    var counter = Number($('.counter').text().replace(/\s/g, ''));
    var timeNext = Math.floor(Math.random() * 2000) + 1000
    var numberToAdd = Math.floor(Math.random() * 4) + 1

    setInterval((function() {
        timeNext = Math.floor(Math.random() * 2000) + 1000
        numberToAdd = Math.floor(Math.random() * 4) + 1
        counter = counter + numberToAdd;
        $('.counter').text(addSpaces(counter));
    }), timeNext);

});

$(window).click(function(e) {
    if ($('.web-footer-dropdown-container').has(e.target).length === 0) {
        $('.web-footer-dropdown-container').removeClass('web-footer-dropdown-container-open');
        $('.web-footer-dropdown-container').attr("is_closable", false);
    }
});

$('.web-footer-dropdown-container').click(function() {
    if ($(this).attr('is_closable') == "true") {
        $('.web-footer-dropdown-container').removeClass('web-footer-dropdown-container-open');
        $('.web-footer-dropdown-container').attr("is_closable", false);
    }
    else {
        $(this).addClass("web-footer-dropdown-container-open");
        $(this).attr("is_closable", true);
    }
});

// footer dropdown
$('.site-footer-title').on('click', function() {
    var title = $(this);
    var isOpen = title.hasClass('site-footer-title-open');
    var titleOpen = $('.site-footer-title-open');
    var duration = 0;

    if (titleOpen.length > 0) {
      titleOpen.removeClass('site-footer-title-open');
      titleOpen.next('.site-footer-list').removeClass('site-footer-list-open');
      duration = 500;
    }
    
    if (!isOpen) {
      setTimeout(function() {
        title.addClass('site-footer-title-open');
        title.next('.site-footer-list').addClass('site-footer-list-open');

        $("html,body").animate(
            { scrollTop: $(title).offset().top - 32 },
            500, function () {
              if ($('.fixed-header').hasClass('visible')) {
                $('.fixed-header').removeClass('visible')
              }
            }
          );
      }, duration);
    }
  });

function addSpaces(nStr) {
    nStr = nStr.toString();
    var remainder = nStr.length % 3;
    return (nStr.substr(0, remainder) + nStr.substr(remainder).replace(/(\d{3})/g, ' $1')).trim();
}
