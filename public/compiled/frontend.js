/// <reference path="../typings/tsd.d.ts" />
/// <reference path="api.ts" />
/// <reference path="VideoPlayer.ts" />
/// <reference path="interface.ts" />
/// <reference path="global.ts" />
/// <reference path="drawingCanvas.ts" />
/// <reference path="clock.ts" />
// Add new locations here.
var sites = {
    london: {
        id: 0,
        playlist: 'PLscUku2aaZnFE-7wKovrbi76b26VKxIT-',
        videoDurations: [7650, 4941, 7424, 7264, 6835, 7128],
        startTime: "April 15, 2015 15:00:00",
        modulusHours: 12
    },
    netherlands: {
        id: 1,
        playlist: 'PLscUku2aaZnEISIU_BFatpXUd91DFyRVA',
        videoDurations: [(1 * 60 * 60) + (2 * 60) + 15],
        startTime: "April 15, 2015 12:00:00",
        modulusHours: 1
    },
    birmingham: {
        id: 2,
        playlist: 'PLscUku2aaZnGRbIOS1LGUt9GeDBX159yY',
        videoDurations: [(1 * 60 * 60) + (0 * 60) + 1],
        startTime: "April 15, 2015 12:00:00",
        modulusHours: 1
    },
    gwangju: {
        id: 3,
        playlist: 'PLscUku2aaZnE7jj8SNk1nxWTTSXlOYLpP',
        videoDurations: [(1 * 60 * 60) + (0 * 60) + 1],
        startTime: "April 15, 2015 12:00:00",
        modulusHours: 1
    }
};
var site = location.pathname.replace("/", '');
// Fetch every 15sec, fetch 20sec of data
var api = new NotesApi(sites[site].id);
api.startFetching(15000, 20000);
var drawingCanvas;
var ui;
var video;
var clock;
Clock.startTime = sites[site].startTime;
// Wait for a go from youtube api
var onYouTubePlayerAPIReady = function () {
    video = new VideoPlayer(sites[site].playlist, sites[site].videoDurations, sites[site].modulusHours, {
        onLoadComplete: function () {
            video.setTime(moment(), function () {
                setTimeout(function () {
                    ui.hideLoadingScreen();
                }, 300);
            });
        },
        onNewFrame: function (player) {
            api.currentTime = player.currentTime;
            drawingCanvas.updateNotes(api.notes);
            drawingCanvas.updateAnimation();
            clock.frameUpdate(video);
            updateVideoLoop();
        }
    });
    $(document).ready(function () {
        ui = new Interface({
            onResize: function () {
                video.updatePlayerSize();
            }
        });
        drawingCanvas = new DrawingCanvas();
        drawingCanvas.api = api;
        drawingCanvas.video = video;
        drawingCanvas.events.onDrawingComplete = gotoEditor;
        clock = new Clock();
        window.onhashchange = function () {
            video.seek(parseInt(location.hash.substring(1)));
        };
        $('.' + site).show();
        $('#back').click(function () {
            gotoVideo(video.currentTime);
        });
        $('#logoHeader').click(ui.showCredits);
        $('#infoHeader').click(ui.showCredits);
        $('#credits').click(ui.hideCredits);
        // Rewind button
        $('#rewind').click(function () {
            ui.hideVideo(function () {
                video.seek(video.currentTime - (10 * 1000), function () {
                    ui.showVideo();
                });
            });
        });
    });
};
function gotoEditor(path) {
    ui.hideVideo(function () {
        GLOBAL.MODE = "EDITOR";
        video.zoom = 4;
        // Seek to the path start time
        video.seek(path.points[0].time, function () {
            ui.showVideo();
        });
        // Set the video zoom position
        video.zoomPos = { x: path.points[0].x, y: path.points[0].y };
        video.updatePlayerSize();
        // Update the interface
        $('#notes').hide();
        $('#linedrawing').hide();
        $('#logoHeader').hide();
        $('#timeAndDate').hide();
        $('#addNoteInterface').show();
        $('#note-text').val('').focus();
        $('#rewind').hide();
        $('#back').show();
    });
    var trySubmit = function () {
        var text = $('#note-text').val();
        if (text) {
            var note = new Note([]);
            note.path = path;
            note.text = text;
            // Submit the path to the API
            api.submitNote(note);
            // GOTO video mode again
            gotoVideo(path.points[0].time - 5000);
        }
        else {
            $('#note-text').attr('placeholder', 'Please write something').focus();
            $('#submitButton').unbind('click').click(trySubmit);
        }
    };
    $('#submitButton').unbind('click').click(trySubmit);
    var keypress = function (e) {
        if (e.which == 13) {
            trySubmit();
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
        var textElm = $('#note-text');
        if (textElm.val().length >= 140) {
            //textElm.val(textElm.val().substring(0,140));
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    };
    $('#note-text').unbind('keypress').keypress(keypress);
}
function gotoVideo(seekTime) {
    ui.hideVideo(function () {
        GLOBAL.MODE = "PLAYER";
        video.zoom = 1;
        video.updatePlayerSize();
        drawingCanvas.clearMouseTrail();
        // Seek to the path start time
        video.seek(seekTime, function () {
            ui.showVideo();
        });
        $('#notes').show();
        $('#addNoteInterface').hide();
        $('#linedrawing').show();
        $('#timeAndDate').show();
        $('#rewind').show();
        $('#back').hide();
        $('#logoHeader').show();
    });
}
function updateVideoLoop() {
    if (GLOBAL.MODE == "EDITOR") {
        var time = drawingCanvas.mousePath.last().time;
        var diff = time - drawingCanvas.mousePath.points[0].time;
        if (diff < 3000) {
            time += 3000 - diff;
        }
        if (video.currentTime > time) {
            this.video.seek(drawingCanvas.mousePath.points[0].time, undefined, true);
        }
    }
}
