/// <reference path="../typings/tsd.d.ts" />
var VideoPlayer = (function () {
    function VideoPlayer(events) {
        var _this = this;
        this.aspect = 16.0 / 9.0;
        this.zoom = 1.0;
        this.zoomPos = { x: 0, y: 0 };
        this.loading = true;
        this.startTimes = [0, 60 * 60 * 2 * 1000, 60 * 60 * 4 * 1000, 60 * 60 * 6 * 1000];
        /** Current time in millis **/
        this.currentTime = 0;
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
                list: 'PLscUku2aaZnFE-7wKovrbi76b26VKxIT-',
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
        //console.log(time_update);
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
    VideoPlayer.prototype.seek = function (ms, cb) {
        var _this = this;
        for (var i = 0; i < this.startTimes.length - 1; i++) {
            if (ms < this.startTimes[i + 1]) {
                if (this.ytplayer.getPlaylistIndex() != i) {
                    this.ytplayer.playVideoAt(i);
                }
                if (this.startTimes[i]) {
                    ms -= this.startTimes[i];
                }
                break;
            }
        }
        if (ms < 0) {
            ms = 0;
        }
        // Wait for the video having seeked
        var stateChange = function (e) {
            if (e.data == 1) {
                var removeCast = _this.ytplayer;
                removeCast.removeEventListener("onStateChange", stateChange);
                if (cb)
                    cb();
            }
        };
        // In safari, seekTo doesn't trigger a state change, so we just callback
        if (bowser.safari) {
            if (cb)
                cb();
        }
        else {
            this.ytplayer.addEventListener("onStateChange", stateChange);
        }
        this.ytplayer.seekTo(ms / 1000, true);
        this.currentTime = ms;
        if (this.startTimes[this.ytplayer.getPlaylistIndex()]) {
            this.currentTime += this.startTimes[this.ytplayer.getPlaylistIndex()];
        }
    };
    VideoPlayer.prototype.onPlayerReady = function () {
        //    this.seek(0, ()=>{});
        this.updatePlayerSize();
    };
    VideoPlayer.prototype.onPlayerStateChange = function () {
        var _this = this;
        this.ytplayer.mute();
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
    return VideoPlayer;
})();
//# sourceMappingURL=VideoPlayer.js.map