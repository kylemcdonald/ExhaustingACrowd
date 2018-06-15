/// <reference path="../typings/tsd.d.ts" />
declare var bowser:any;

interface EventHandler {
    (player: VideoPlayer): void;
}


interface IVideoPlayerCallbacks {
    onLoadComplete?: EventHandler;
    onNewFrame?: EventHandler;
}

class VideoPlayer {
    ytplayer:YT.Player;

    aspect = 16.0/9.0;
    zoom = 1.0;
    zoomPos = {x:0, y:0};
    loading = true;
    startTimes = [];
    durations = [];
    modulusHours = 1;
    public totalDur  = 0;
    /** Current time in millis **/
    currentTime: number = 0;

    // Events
    events:IVideoPlayerCallbacks;

    // onStateChange callback
    stateChangeCallback = (state)=>{};

    constructor(playlist : string,
                durations: number[],
                modulusHours: number,
                events : IVideoPlayerCallbacks){

        this.durations = durations;
        this.modulusHours = modulusHours;
        // Populate the startTimes array
        var _dur=0;
        for(var i=0;i<this.durations.length;i++){
            this.startTimes.push(_dur);
            _dur += this.durations[i]*1000;
        }
        this.startTimes.push(_dur);

        this.totalDur = _dur;

        this.events = events;
        this.ytplayer = new YT.Player('ytplayer', {
            height: 390,
            width: 640,
            // videoId: '',
            playerVars: {
                autoplay: 1,    //< Play on start
                controls: 0,    //< Hide controls
                disablekb: 1,   //< Disable keyboard controls
                enablejsapi: 1, //< Enable js api
                fs: 0,          // Disable fullscreen
                modestbranding: 1, //< Thank you youtube for the offer of branding, but no thanks
                origin:'localhost', // Should be set for security
                rel: 0,          //< Dont show related videos
                showinfo: 0,    //< Hide info
                list: playlist,
                listType: 'playlist',
                start:0
            },
            events: {
                'onReady': () => {this.onPlayerReady()},
                'onStateChange': () => {this.onPlayerStateChange()},
                //'onPlaybackQualityChange': onPlayerPlaybackQualityChange
            }
        });

    }





    updatePlayerSize(){
        var player = $('#videocontainer');

        var size = this.calculatePlayerSize();

        player.css({
            left: size.left,
            top: size.top-50,
            width: size.width,
            height: size.height+100
        });

        //updateMouseTrail();
    }

    clientToVideoCoord(clientX:number, clientY:number){
        var playerSize = this.calculatePlayerSize();

        var ret = {
            x: clientX,
            y: clientY
        };

        ret.x -= playerSize.left;
        ret.y -= playerSize.top;
        ret.x /= playerSize.width;
        ret.y /= playerSize.height;

        return ret;
    }

    videoToClientCoord(videoX:number, videoY:number){
        var playerSize =this.calculatePlayerSize();

        var ret = {
            x: videoX,
            y: videoY
        };

        ret.x *= playerSize.width;
        ret.y *= playerSize.height;
        ret.x += playerSize.left;
        ret.y += playerSize.top;

        return ret;
    }

    calculatePlayerSize(){
        var left = 0;
        var top = 0;

        if($(window).width() / $(window).height() >  this.aspect){
            var width = $(window).width() ;
            var height = $(window).width() / this.aspect;
            top = -(height - $(window).height())/2;

        } else {
            var width = $(window).height() * this.aspect;
            var height = $(window).height();
            left = -(width - $(window).width())/2;
        }

        if(this.zoom != 1){
            width *= this.zoom;
            height*= this.zoom;

            left = -this.zoomPos.x * width + $(window).width() * 0.25;
            top = -this.zoomPos.y * height + $(window).height() * 0.5;
        }

        return {left: left, top: top, width:width, height:height};
    }


    private _last_time_update:number;
    frameUpdate(){
        var time_update = this.ytplayer.getCurrentTime()*1000;
        var playing = this.ytplayer.getPlayerState();

        if (playing==1) {

            if (this._last_time_update == time_update) {
                this.currentTime += 10;
            }

            if (this._last_time_update != time_update) {
                this.currentTime = time_update;
                //console.log(time_update);
                if(this.startTimes[this.ytplayer.getPlaylistIndex()]){
                    this.currentTime += this.startTimes[this.ytplayer.getPlaylistIndex()];
                }

                //clockTime = new Date("April 15, 2015 11:13:00");
                //clockTime.setSeconds(clockTime.getSeconds()+ time_update/1000)
            }

        }

        this._last_time_update = time_update;


        if(this.events.onNewFrame) this.events.onNewFrame(this);
        /*        updateAnimation();
         updateNotes();
         updateVideoLoop();*/


    }

    seek(ms: number, cb?: (() => void), dontFetchApi?: boolean) {
        //console.log('seek: ' + ms);
        if (ms > this.totalDur) { // this is possible between 2:27 - 3:00
            ms %= this.totalDur; // loops back around to 3:00 - 3:27
        }
        var relativeMs;
        for(var i=0;i<this.startTimes.length-1;i++){
            if (ms < this.startTimes[i + 1]) {
                if (this.ytplayer.getPlaylistIndex() != i) {
                    this.ytplayer.playVideoAt(i);
                }
                relativeMs = ms - this.startTimes[i];
                this.ytplayer.seekTo(relativeMs / 1000, true);
                break;
            }
        }
        this.currentTime = ms;

        // Start an interval and wait for the video to play again
        var interval = setInterval(()=>{
            if(this.ytplayer.getPlayerState() == 1){
                clearInterval(interval);
                if(dontFetchApi != true) {
                    api.fetchNotes(ms);
                }
                if(cb) cb();
            }
        },100);
    }

    onPlayerReady(){
        this.updatePlayerSize();
    }

    onPlayerStateChange(){

        if(this.stateChangeCallback) this.stateChangeCallback(this.ytplayer.getPlayerState());

        this.ytplayer.mute();

        if(this.ytplayer.getPlayerState() == 0){
            this.seek(0);
        }

        if(this.loading && this.ytplayer.getPlayerState() == 1){
            this.loading = false;

            if(this.events.onLoadComplete){
                this.events.onLoadComplete(this);
            }
            setInterval(()=>{this.frameUpdate()}, 10);
        }
    }

    // use this from the frontend for testing
    setClock(time: string, cb?: (() => void)){
	    this.setTime(moment(time, ['H:mm', 'HH:mm', 'HH:mm:ss', 'H:mm:ss']));
    }

    // use this from the backend to avoid time parsing problems
    setTime(time: any, cb?: (() => void)){
        // use the startTime data
        var target = moment(Clock.startTime);
        // use the time hours, minutes, seconds
        target.hour(time.hour());
        target.minute(time.minute());
        target.second(time.second());

        // If the target is before the start clock of the video (its in the morning)
        if(target.isBefore(moment(Clock.startTime))){
            target = target.add(24, 'hours');
        }

        var hourMillis = 60*60*1000;
        var diff = target.diff(moment(Clock.startTime));

        // modulus with the number of hours specified
        diff %= this.modulusHours * hourMillis;

        // Handle the case where the time is longer then the playlist, then pick a random hour
        if(diff > this.totalDur){
            diff -= Math.floor(Math.random() * this.modulusHours)*hourMillis;
        }
        console.log(moment(Clock.startTime).add(diff,'milliseconds').format());

        video.seek(diff, cb);
    }
}

