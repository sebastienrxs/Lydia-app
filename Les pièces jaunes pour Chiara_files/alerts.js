$(document).ready(function() {
    $(".lyd-alert .lyd-close").click(function() {
        $(this).parent().fadeTo(500, 0, function(){
            $(this).css("visibility", "hidden");
            var m = $(this).outerHeight(true);
            $(this).animate({
                marginTop: '-='+m+"px"
            }, 400);
        });
    });
});
