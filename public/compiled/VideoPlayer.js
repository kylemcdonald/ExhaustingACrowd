/// <reference path="../typings/tsd.d.ts" />
var VideoPlayer = (function () {
    function VideoPlayer(playlist, durations, modulusHours, events) {
        var _this = this;
        this.aspect = 16.0 / 9.0;
        this.zoom = 1.0;
        this.zoomPos = { x: 0, y: 0 };
        this.loading = true;
        this.startTimes = [];
        this.durations = [];
        this.modulusHours = 1;
        this.totalDur = 0;
        /** Current time in millis **/
        this.currentTime = 0;
        // onStateChange callback
        this.stateChangeCallback = function (state) {
        };
        this.durations = durations;
        this.modulusHours = modulusHours;
        // Populate the startTimes array
        var _dur = 0;
        for (var i = 0; i < this.durations.length; i++) {
            this.startTimes.push(_dur);
            _dur += this.durations[i] * 1000;
        }
        this.startTimes.push(_dur);
        this.totalDur = _dur;
        this.events = events;
        this.ytplayer = new YT.Player('ytplayer', {
            height: 390,
            width: 640,
            // videoId: '',
            playerVars: {
                autoplay: 1,
                controls: 0,
                disablekb: 1,
                enablejsapi: 1,
                fs: 0,
                modestbranding: 1,
                origin: 'localhost',
                rel: 0,
                showinfo: 0,
                list: playlist,
                listType: 'playlist',
                start: 0
            },
            events: {
                'onReady': function () {
                    _this.onPlayerReady();
                },
                'onStateChange': function () {
                    _this.onPlayerStateChange();
                }
            }
        });
    }
    VideoPlayer.prototype.updatePlayerSize = function () {
        var player = $('#videocontainer');
        var size = this.calculatePlayerSize();
        player.css({
            left: size.left,
            top: size.top - 50,
            width: size.width,
            height: size.height + 100
        });
        //updateMouseTrail();
    };
    VideoPlayer.prototype.clientToVideoCoord = function (clientX, clientY) {
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
    };
    VideoPlayer.prototype.videoToClientCoord = function (videoX, videoY) {
        var playerSize = this.calculatePlayerSize();
        var ret = {
            x: videoX,
            y: videoY
        };
        ret.x *= playerSize.width;
        ret.y *= playerSize.height;
        ret.x += playerSize.left;
        ret.y += playerSize.top;
        return ret;
    };
    VideoPlayer.prototype.calculatePlayerSize = function () {
        var left = 0;
        var top = 0;
        if ($(window).width() / $(window).height() > this.aspect) {
            var width = $(window).width();
            var height = $(window).width() / this.aspect;
            top = -(height - $(window).height()) / 2;
        }
        else {
            var width = $(window).height() * this.aspect;
            var height = $(window).height();
            left = -(width - $(window).width()) / 2;
        }
        if (this.zoom != 1) {
            width *= this.zoom;
            height *= this.zoom;
            left = -this.zoomPos.x * width + $(window).width() * 0.25;
            top = -this.zoomPos.y * height + $(window).height() * 0.5;
        }
        return { left: left, top: top, width: width, height: height };
    };
    VideoPlayer.prototype.frameUpdate = function () {
        var time_update = this.ytplayer.getCurrentTime() * 1000;
        var playing = this.ytplayer.getPlayerState();
        if (playing == 1) {
            if (this._last_time_update == time_update) {
                this.currentTime += 10;
            }
            if (this._last_time_update != time_update) {
                this.currentTime = time_update;
                //console.log(time_update);
                if (this.startTimes[this.ytplayer.getPlaylistIndex()]) {
                    this.currentTime += this.startTimes[this.ytplayer.getPlaylistIndex()];
                }
            }
        }
        this._last_time_update = time_update;
        if (this.events.onNewFrame)
            this.events.onNewFrame(this);
        /*        updateAnimation();
         updateNotes();
         updateVideoLoop();*/
    };
    VideoPlayer.prototype.seek = function (ms, cb, dontFetchApi) {
        var _this = this;
        //console.log('seek: ' + ms);
        if (ms > this.totalDur) {
            ms %= this.totalDur; // loops back around to 3:00 - 3:27
        }
        var relativeMs;
        for (var i = 0; i < this.startTimes.length - 1; i++) {
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
        var interval = setInterval(function () {
            if (_this.ytplayer.getPlayerState() == 1) {
                clearInterval(interval);
                if (dontFetchApi != true) {
                    api.fetchNotes(ms);
                }
                if (cb)
                    cb();
            }
        }, 100);
    };
    VideoPlayer.prototype.onPlayerReady = function () {
        this.updatePlayerSize();
    };
    VideoPlayer.prototype.onPlayerStateChange = function () {
        var _this = this;
        if (this.stateChangeCallback)
            this.stateChangeCallback(this.ytplayer.getPlayerState());
        this.ytplayer.mute();
        if (this.ytplayer.getPlayerState() == 0) {
            this.seek(0);
        }
        if (this.loading && this.ytplayer.getPlayerState() == 1) {
            this.loading = false;
            if (this.events.onLoadComplete) {
                this.events.onLoadComplete(this);
            }
            setInterval(function () {
                _this.frameUpdate();
            }, 10);
        }
    };
    // use this from the frontend for testing
    VideoPlayer.prototype.setClock = function (time, cb) {
        this.setTime(moment(time, ['H:mm', 'HH:mm', 'HH:mm:ss', 'H:mm:ss']));
    };
    // use this from the backend to avoid time parsing problems
    VideoPlayer.prototype.setTime = function (time, cb) {
        // use the startTime data
        var target = moment(Clock.startTime);
        // use the time hours, minutes, seconds
        target.hour(time.hour());
        target.minute(time.minute());
        target.second(time.second());
        // If the target is before the start clock of the video (its in the morning)
        if (target.isBefore(moment(Clock.startTime))) {
            target = target.add(24, 'hours');
        }
        var hourMillis = 60 * 60 * 1000;
        var diff = target.diff(moment(Clock.startTime));
        // modulus with the number of hours specified
        diff %= this.modulusHours * hourMillis;
        // Handle the case where the time is longer then the playlist, then pick a random hour
        if (diff > this.totalDur) {
            diff -= Math.floor(Math.random() * this.modulusHours) * hourMillis;
        }
        console.log(moment(Clock.startTime).add(diff, 'milliseconds').format());
        video.seek(diff, cb);
    };
    return VideoPlayer;
})();
