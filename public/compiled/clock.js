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
        var language = (navigator.language || navigator.browserLanguage).split('-')[0];
        var minutesString, hoursString;
        var dateString = date.toLocaleString(language);
        if (dateString.match(/am|pm/i) || date.toString().match(/am|pm/i)) {
            //12 hour clock
            var ampm = hours >= 12 ? 'PM' : 'AM';
            minutesString = minutes < 10 ? '0' + String(minutes) : String(minutes);
            minutesString += ' ' + ampm;
            hours = hours % 12;
            hoursString = hours < 1 ? '12' : String(hours);
        }
        else {
            //24 hour clock
            minutesString = minutes < 10 ? '0' + String(minutes) : String(minutes);
            hoursString = String(hours);
        }
        this.blink(this.colon);
        $('#hour').html(hoursString.replace(/0/g, 'O'));
        $('#minute').html(minutesString.replace(/0/g, 'O'));
    };
    Clock.prototype.frameUpdate = function (ytplayer) {
        this.clockTime = new Date(Clock.startTime);
        this.clockTime.setSeconds(this.clockTime.getSeconds() + ytplayer.currentTime / 1000.0);
    };
    return Clock;
})();
