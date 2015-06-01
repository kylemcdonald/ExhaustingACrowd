/// <reference path="../typings/tsd.d.ts" />
/// <reference path="VideoPlayer" />


class Clock {

    static startTime  = "June 1, 2015 12:00:00 EDT";
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
        var ampm = hours >= 12 ? 'PM' : 'AM';
        var minutesString = minutes < 10 ? '0' + String(minutes) : String(minutes);
        hours = hours % 12;
        var hoursString = hours < 1 ? '12' : String(hours);

        this.blink(this.colon);
        $('#hour').html(hoursString.replace(/0/g, 'O'));
        $('#minute').html(minutesString.replace(/0/g, 'O') + ' ' + ampm);
    }


    frameUpdate(ytplayer : VideoPlayer) {
        //console.log(ytplayer.currentTime);
        //console.log(ytplayer.currentTime);
        this.clockTime = new Date(Clock.startTime);
        this.clockTime.setSeconds(this.clockTime.getSeconds()+ ytplayer.currentTime/1000.0)

    }


}