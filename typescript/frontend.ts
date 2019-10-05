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
        videoDurations: [(1*60*60)+(2*60)+15],
        startTime: "April 15, 2015 12:00:00",
        modulusHours: 1
    },
    birmingham: {
        id: 2,
        playlist: 'PLscUku2aaZnGRbIOS1LGUt9GeDBX159yY',
        videoDurations: [(1*60*60)+(0*60)+1],
        startTime: "April 15, 2015 12:00:00",
        modulusHours: 1
    },
    gwangju: {
        id: 3,
        playlist: 'PLscUku2aaZnE7jj8SNk1nxWTTSXlOYLpP',
        videoDurations: [(1*60*60)+(0*60)+1],
        startTime: "April 15, 2015 12:00:00",
        modulusHours: 1
    },
    beijing: {
        id: 4,
        playlist: 'PLscUku2aaZnFTPxiEpcZHVCqhCFb_x4az',
        videoDurations: [(1*60*60)+(0*60)+1],
        startTime: "April 15, 2015 12:00:00",
        modulusHours: 1
    }
};

var recording = false;
var site = location.pathname.replace("/",'');

// Fetch every 15sec, fetch 20sec of data
var api = new NotesApi(sites[site].id);
api.startFetching(15000, 20000);

var timeUntilReload = 20 * 60 * 1000; // reload every 20 minutes
function createMovementTimeout() {
	return setTimeout(function () {
        if (!recording) {
            location.reload();
        }
	}, timeUntilReload);
}

var drawingCanvas : DrawingCanvas;
var ui : Interface;
var video : VideoPlayer;
var clock : Clock;

Clock.startTime = sites[site].startTime;

// Wait for a go from youtube api
var onYouTubePlayerAPIReady = () => {
    video = new VideoPlayer(
        sites[site].playlist,
        sites[site].videoDurations,
        sites[site].modulusHours,
        {
        onLoadComplete : () => {
	    video.setTime(moment(), () => {
                setTimeout(()=>{
                    ui.hideLoadingScreen();
                }, 300);
            })
        },
        onNewFrame:(player:VideoPlayer) => {
            api.currentTime = player.currentTime;

            drawingCanvas.updateNotes(api.notes);
            drawingCanvas.updateAnimation();

            clock.frameUpdate(video);
            updateVideoLoop();
        }
    });

    $(document).ready(()=>{

        ui = new Interface({
            onResize: () => {
                video.updatePlayerSize();
            }
        });

        drawingCanvas = new DrawingCanvas();
        drawingCanvas.api = api;
        drawingCanvas.video = video;

        drawingCanvas.events.onDrawingComplete = gotoEditor;

        clock = new Clock();

        window.onhashchange = () => {
            video.seek(parseInt(location.hash.substring(1)));
            var lastCharacter = location.hash.substring(location.hash.length-1);
            if (lastCharacter == '-') {
                recording = true;
                $("img[src='rewind.png']").remove();
                $("#locationHeader").remove();
                $("#logoHeader").remove();
                $('#clickArea').css('cursor', 'none');
            }
        };

        $('.' + site).show();

        $('#back').click(function(){
            gotoVideo(video.currentTime - 1000);
        });

        $('#logoHeader').click(ui.showCredits);
        $('#infoHeader').click(ui.showCredits);
        $('#credits').click(ui.hideCredits);

        // Rewind button
        $('#rewind').click(()=>{
            ui.hideVideo(() => {
                video.seek(video.currentTime - (10 * 1000), ()=>{
                    ui.showVideo();
                });
            })
        })

        // reload the page every so often if the visitor doesn't move their mouse
        var movementTimeout = createMovementTimeout();
        document.onmousemove = function() {
            clearTimeout(movementTimeout);
            movementTimeout = createMovementTimeout();
        }

    });
};




function gotoEditor(path: Path){
    ui.hideVideo(() => {
        GLOBAL.MODE = "EDITOR";
        video.zoom = 4;

        // Seek to the path start time
        video.seek(path.points[0].time, () => {
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

    var trySubmit = ()=>{
        var text = $('#note-text').val();
        if(text) {
            var note = new Note([]);
            note.path = path;
            note.text = text;
            // Submit the path to the API
            api.submitNote(note);

            // GOTO video mode again
            gotoVideo(path.points[0].time-5000);
        } else {
            $('#note-text').attr('placeholder', 'Please write something').focus();
            $('#submitButton').unbind('click').click(trySubmit)
        }
    };

    $('#submitButton').unbind('click').click(trySubmit)


    var keypress = (e)=> {
        if (e.which == 13) {
            trySubmit();
            e.preventDefault();
            e.stopPropagation();
            return false;
        }

        var textElm = $('#note-text');
        if(textElm.val().length >= 140){
            //textElm.val(textElm.val().substring(0,140));
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    };

    $('#note-text').unbind('keypress').keypress(keypress);
}


function gotoVideo(seekTime :number){
    ui.hideVideo(()=>{
        GLOBAL.MODE = "PLAYER";
        video.zoom = 1;

        video.updatePlayerSize();
        drawingCanvas.clearMouseTrail();

        // Seek to the path start time
        video.seek(seekTime, () => {
            ui.showVideo();
        });

        $('#notes').show();
        $('#addNoteInterface').hide();
        $('#linedrawing').show();
        $('#timeAndDate').show();

        $('#rewind').show();
        $('#back').hide();
        $('#logoHeader').show();
    })
}

function updateVideoLoop(){
    if(GLOBAL.MODE == "EDITOR"){
        var time = drawingCanvas.mousePath.last().time;

        var diff = time- drawingCanvas.mousePath.points[0].time;
        if(diff < 3000){
            time += 3000 - diff;
        }

        if(video.currentTime > time){
            this.video.seek(drawingCanvas.mousePath.points[0].time, undefined, true);
        }
    }
}

