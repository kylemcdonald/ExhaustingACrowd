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
            $('#persistent').show();
        });
    };
    Interface.prototype.hideVideo = function (cb) {
        console.log("Hide video");
        var e = $('#transition');
        e.show();
        e.animate({ opacity: "1" }, 1000, function () {
            if (cb)
                cb();
        });
    };
    Interface.prototype.showVideo = function (cb) {
        console.log("show video");
        var e = $('#transition');
        e.animate({ opacity: "0" }, 1000, function () {
            $('#transition').hide();
            if (cb)
                cb();
        });
    };
    Interface.prototype.showCredits = function () {
        $('#overlay').animate({ opacity: "0" }, 200);
        $('#credits')
            .show()
            .animate({ opacity: "1" }, 500);
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