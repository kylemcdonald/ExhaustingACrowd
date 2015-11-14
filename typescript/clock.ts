/// <reference path="../typings/tsd.d.ts" />
/// <reference path="VideoPlayer" />


class Clock {

    static startTime;
    private colon : JQuery;
    public clockTime : Date;

    constructor(){
        this.clockTime = new Date(Clock.startTime);
        this.colon = $('#colon');

        setInterval(()=>{this.updateClock()}, 1000);
    }

    blink(elm) {
        if (elm.css('opacity') == '1') {
            elm.css('opacity', '0');
        } else {
            elm.css('opacity', '1');
        }
    }

    updateClock(){
        var date = this.clockTime;
        date.setSeconds(date.getSeconds() + 1);

        var hours = date.getHours();
        var minutes = date.getMinutes();

        var language = (navigator.language || navigator.browserLanguage).split('-')[0];
        var minutesString, hoursString;
        var dateString = date.toLocaleString(language);

        if (dateString.match(/am|pm/i) || date.toString().match(/am|pm/i) )
        {
            //12 hour clock
            var ampm = hours >= 12 ? 'PM' : 'AM';
             minutesString = minutes < 10 ? '0' + String(minutes) : String(minutes);
            minutesString += ' ' + ampm;
            hours = hours % 12;
             hoursString = hours < 1 ? '12' : String(hours);
        }
        else
        {
            //24 hour clock
            minutesString = minutes < 10 ? '0' + String(minutes) : String(minutes);
             hoursString =  String(hours);
        }

        this.blink(this.colon);
        $('#hour').html(hoursString.replace(/0/g, 'O'));
        $('#minute').html(minutesString.replace(/0/g, 'O') );
    }


    frameUpdate(ytplayer : VideoPlayer) {
        this.clockTime = new Date(Clock.startTime);
        this.clockTime.setSeconds(this.clockTime.getSeconds()+ ytplayer.currentTime/1000.0)
    }


}