/// <reference path="../typings/tsd.d.ts" />
/// <reference path="api.ts" />
/// <reference path="VideoPlayer.ts" />
/// <reference path="interface.ts" />
/// <reference path="global.ts" />
/// <reference path="drawingCanvas.ts" />
/// <reference path="clock.ts" />
// Fetch every 15sec, fetch 20sec of data
var api = new NotesApi();
api.startFetching(15000, 20000);
var drawingCanvas;
var ui;
var video;
var clock;
// Wait for a go from youtube api
var onYouTubePlayerAPIReady = function () {
    video = new VideoPlayer({
        onLoadComplete: function () {
            video.setClock(moment().format('H:mm'), function () {
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
        $('#back').click(function () {
            gotoVideo(video.currentTime);
        });
        $('#vaHeader').click(ui.showCredits);
        $('#infoHeader').click(ui.showCredits);
        $('#credits').click(ui.hideCredits);
        // Rewind button
        $('#rewind').click(function () {
            ui.hideVideo(function () {
                video.seek(video.currentTime - 30000, function () {
                    api.fetchNotes();
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
        $('#vaHeader').hide();
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
    var watchForEnter = function (e) {
        if (e.which == 13) {
            trySubmit();
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    };
    $('#note-text').keypress(watchForEnter);
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
        $('#vaHeader').show();
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
            this.video.seek(drawingCanvas.mousePath.points[0].time);
        }
    }
}
//# sourceMappingURL=frontend.js.map