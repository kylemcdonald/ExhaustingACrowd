/// <reference path="../typings/tsd.d.ts" />
/// <reference path="VideoPlayer" />
var Clock = (function () {
    function Clock() {
        var _this = this;
        this.clockTime = new Date(Clock.startTime);
        this.colon = $('#colon');
        setInterval(function () {
            _this.updateClock();
        }, 1000);
    }
    Clock.prototype.formatAMPM = function (date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return minutes + ' ' + ampm;
    };
    Clock.prototype.blink = function (elm) {
        if (elm.css('opacity') == '1') {
            elm.css('opacity', '0');
        }
        else {
            elm.css('opacity', '1');
        }
    };
    Clock.prototype.updateClock = function () {
        this.clockTime.setSeconds(this.clockTime.getSeconds() + 1);
        this.blink(this.colon);
        $('#hour').html(("" + (this.clockTime.getHours() % 12)).replace(/0/g, 'O'));
        $('#minute').html(this.formatAMPM(this.clockTime).replace(/0/g, 'O'));
    };
    Clock.prototype.frameUpdate = function (ytplayer) {
        //console.log(ytplayer.currentTime);
        //console.log(ytplayer.currentTime);
        this.clockTime = new Date(Clock.startTime);
        this.clockTime.setSeconds(this.clockTime.getSeconds() + ytplayer.currentTime / 1000.0);
    };
    Clock.startTime = "April 15, 2015 15:00:00";
    return Clock;
})();
//# sourceMappingURL=clock.js.map