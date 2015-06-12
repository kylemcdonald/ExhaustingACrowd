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
    Clock.prototype.blink = function (elm) {
        if (elm.css('opacity') == '1') {
            elm.css('opacity', '0');
        }
        else {
            elm.css('opacity', '1');
        }
    };
    Clock.prototype.updateClock = function () {
        var date = this.clockTime;
        date.setSeconds(date.getSeconds() + 1);
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        var minutesString = minutes < 10 ? '0' + String(minutes) : String(minutes);
        hours = hours % 12;
        var hoursString = hours < 1 ? '12' : String(hours);
        this.blink(this.colon);
        $('#hour').html(hoursString.replace(/0/g, 'O'));
        $('#minute').html(minutesString.replace(/0/g, 'O') + ' ' + ampm);
    };
    Clock.prototype.frameUpdate = function (ytplayer) {
        this.clockTime = new Date(Clock.startTime);
        this.clockTime.setSeconds(this.clockTime.getSeconds() + ytplayer.currentTime / 1000.0);
    };
    Clock.startTime = "April 15, 2015 15:00:00";
    return Clock;
})();
