/// <reference path="../typings/tsd.d.ts" />
/// <reference path="VideoPlayer" />


class Clock {

    private colon : JQuery;
    public clockTime : Date;

    constructor(){
        this.clockTime = new Date("April 15, 2015 11:13:00");
        this.colon = $('#colon');

        setInterval(()=>{this.updateClock()}, 1000);


    }
    formatAMPM(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        minutes = minutes < 10 ? '0'+minutes : minutes;
        return minutes + ' ' + ampm;
    }

    blink(elm) {
        if (elm.css('opacity') == '1') {
            elm.css('opacity', '0');
        } else {
            elm.css('opacity', '1');
        }
    }

    updateClock(){

        this.clockTime.setSeconds(this.clockTime.getSeconds() + 1);

        this.blink(this.colon);

        $('#hour').html(""+(this.clockTime.getHours() % 12));
        $('#minute').html(this.formatAMPM(this.clockTime));

    }


    frameUpdate(ytplayer : VideoPlayer) {
        this.clockTime = new Date("April 15, 2015 11:13:00");
        this.clockTime.setSeconds(this.clockTime.getSeconds()+ ytplayer.currentTime/1000.0)

    }


}