/// <reference path="../typings/tsd.d.ts" />
/// <reference path="global.ts" />
var Interface = (function () {
    function Interface(events) {
        var _this = this;
        this.events = events;
        $(window).resize(function () {
            if (_this.events.onResize)
                _this.events.onResize();
        });
    }
    Interface.prototype.hideLoadingScreen = function () {
        $('#transition').animate({
            opacity: "0"
        }, 200, function () {
            $('#transition').hide();
            $('#loading').hide();
        });
    };
    Interface.prototype.hideVideo = function (cb) {
        console.log("Hide video");
        var e = $('#videocontainer');
        e.addClass('blur');
        /*e.show();

        e.animate({ opacity: "1" }, 1000, ()=>{
            if(cb) cb();
        })*/
        setTimeout(cb, 300);
    };
    Interface.prototype.showVideo = function (cb) {
        console.log("show video");
        var e = $('#videocontainer'); /*
        e.animate({ opacity: "0" }, 1000, ()=>{
            $('#transition').hide();
            if(cb) cb();
        })*/
        e.removeClass('blur');
        setTimeout(cb, 300);
    };
    Interface.prototype.showCredits = function () {
        $('#overlay').animate({ opacity: "0" }, 200);
        $('#credits').show().animate({ opacity: "1" }, 500);
    };
    Interface.prototype.hideCredits = function () {
        var e = $('#credits');
        e.animate({ opacity: "0" }, 500, function () {
            $('#credits').hide();
        });
        $('#overlay').animate({ opacity: "1" }, 500);
    };
    return Interface;
})();
//# sourceMappingURL=interface.js.map