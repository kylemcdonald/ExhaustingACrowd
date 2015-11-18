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
        $('#initial-spinner').animate({
            opacity: '0'
        }, 250);
        $('#loading').animate({
            opacity: "0"
        }, 1000, function () {
            $('#transition').hide();
            $('#loading').hide();
            $('#persistent').show();
        });
    };
    Interface.prototype.hideVideo = function (cb) {
        var e = $('#persistent-spinner');
        e.show();
        e.animate({ opacity: "1" }, 250, function () {
            $('#videocontainer').addClass('blur');
            setTimeout(cb, 250);
        });
    };
    Interface.prototype.showVideo = function (cb) {
        var e = $('#persistent-spinner');
        e.animate({ opacity: "0" }, 250, function () {
            e.hide();
            $('#videocontainer').removeClass('blur');
            setTimeout(cb, 250);
        });
    };
    Interface.prototype.showCredits = function () {
        $('#overlay').animate({ opacity: "0" }, 250);
        $('#linedrawing').animate({ opacity: "0" }, 250);
        $('#credits').show().animate({ opacity: "1" }, 500);
    };
    Interface.prototype.hideCredits = function () {
        var e = $('#credits');
        e.animate({ opacity: "0" }, 500, function () {
            $('#credits').hide();
        });
        $('#overlay').animate({ opacity: "1" }, 500);
        $('#linedrawing').animate({ opacity: "1" }, 500);
    };
    return Interface;
})();
