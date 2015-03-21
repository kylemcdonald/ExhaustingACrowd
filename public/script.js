var ytaspect = 16.0/9.0;
var ytplayer;
var retinaSvg = true;

var loading = true;

var videoZoom = 1;
var videoPos = {x:0, y:0};
var paused = false;

var mousePos;
var isDragging = false;
var mousePath = [];
var lastMouseTime;
var mode = "PLAYER";

var canvasScaleFactor;
var drawing;

$(document).ready(function(){
  $("#overlay").mousedown(function(e){
    /* if(videoZoom == 1){
     zoom(clientToVideoCoord(e.clientX, e.clientY));
     } else {
     resetZoom();
     }*/
    mousePath = [];


    $("#overlay").mousemove(function(e) {
      if(event.which == 0){
        isDragging = false;
        $("#overlay").unbind("mousemove");
      } else {
        isDragging = true;
        mousePos = clientToVideoCoord(event.pageX, event.pageY);
        mousePos.time = current_time_msec;
        if(lastMouseTime != mousePos.time) {
          lastMouseTime = mousePos.time;
          console.log(mousePos.time);
          mousePath.push(mousePos);
          updateMouseTrail();
        }
      }
    });
  })
    .mouseup(function() {
      var wasDragging = isDragging;
      isDragging = false;
      $("#overlay").unbind("mousemove");

      if(wasDragging){
        simplifyMouseTrail();
        gotoEditor();
      }
    });


  // Update player on window resize
  $(window).resize(updatePlayerSize);

  drawing = SVG('drawing')


});


var gotoEditor = function(){
  hideVideo(function(){
    mode = "EDITOR";
    videoZoom = 4;
    ytplayer.seekTo(mousePath[0].time/1000);
    console.log("Seek to " + mousePath[0].time / 1000);

    // Wait for the video having seeked
    var stateChange = function(e){
      if(e.data == 1) {
        ytplayer.removeEventListener("onStateChange", stateChange);
        showVideo();
      }
    };
    ytplayer.addEventListener("onStateChange", stateChange)
    videoPos = mousePath[0];
    updatePlayerSize();

   // $('#notes').hide();
   // $('#addNoteInterface').show();
  })
};

var getPosAtTimeFromPath = function(time, path){
  console.log(time,path[0].time);
  for(var i=0;i<path.length;i++){
    if(path[i].time <= time ){
      return path[i];
    }
  }
}

var circle;
var updateAnimation = function(){
  if(mode == "EDITOR"){
  /*  var p = getPosAtTimeFromPath(current_time_msec, mousePath);
    console.log(p);

    var c = $('#videoCanvas');
    var scaleX = c.attr('width');
    var scaleY = c.attr('height');

    if(!circle){
      circle = new paper.Path.Circle(new paper.Point(0,0), 50);
    }

    circle.position = new paper.Point(p.x*scaleX, p.y*scaleY);
/*
    var canvas = document.getElementById('videoCanvas');
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
*/
    //paper.view.draw();

  } else {
   /* if(circle){
      circle.remove();
    }*/
  }


}

// Mouse trail
var lastDrawnIndex = 0;
var path;
var resetCanvas = function(){


  if(path){
    path.remove();
  }
  path = new paper.Path();

  path.strokeColor = new paper.Color(0.8,0,0,0.5);
  path.strokeWidth = 4*(retinaSvg?2:1);

  lastDrawnIndex = -1;

  updateMouseTrail();
};

var polyline;
var updateMouseTrail = function(){

  if(!polyline){
    polyline = drawing.polyline([]).fill('none').stroke({ width: 5,  color: '#f06' })
  }

  var c = $('#drawing')

  var scaleX = c.width();
  var scaleY = c.height()


  var p = [];
  for(var i=lastDrawnIndex+1;i<mousePath.length;i++){
    p.push([mousePath[i].x*scaleX, mousePath[i].y*scaleY]);
  }
  polyline.plot(p)
};

var simplifyMouseTrail = function(){
  console.log("Mouse path length before simplification: "+mousePath.length);
  mousePath = simplify(mousePath, 0.002);
  console.log("Mouse path length after simplification: "+mousePath.length);

 // resetCanvas();
}

var redrawCanvas = function(){
 // resetCanvas();
  updateMouseTrail();
}


var clientToVideoCoord = function(clientX, clientY){
  var playerSize = calculatePlayerSize();

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

var videoToClientCoord = function(videoX, videoY){
  var playerSize = calculatePlayerSize();

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

var zoom = function(pos){
  transitionToZoom(function(){

    videoZoom = 4;
    paused = true;
    videoPos = pos;
    updatePlayerSize();

    $('#notes').hide();
    $('#addNoteInterface').show();
  })


};

var resetZoom = function(){
  videoZoom = 1;
  paused = false;
  $('#notes').show();
  $('#addNoteInterface').hide();
  updatePlayerSize();
};

var calculatePlayerSize = function(){
  var left = 0;
  var top = 0;

  if($(window).width() / $(window).height() >  ytaspect){
    var width = $(window).width() ;
    var height = $(window).width() / ytaspect;
    top = -(height - $(window).height())/2;

  } else {
    var width = $(window).height() * ytaspect;
    var height = $(window).height();
    left = -(width - $(window).width())/2;
  }

  if(videoZoom != 1){
    width *= videoZoom;
    height*= videoZoom;

    left = -videoPos.x * width + $(window).width() * 0.25;
    top = -videoPos.y * height + $(window).height() * 0.5;
  }

  return {left: left, top: top, width:width, height:height};
};

var updatePlayerSize = function(){
  var player = $('#videocontainer');

  var size = calculatePlayerSize();

  player.css({
    left: size.left,
    top: size.top-50,
    width: size.width,
    height: size.height+100
  });

 /* $('#videoCanvas')
    .attr('width', size.width*(retinaSvg?2:1))
    .attr('height', size.height*(retinaSvg?2:1))
    .css({
      width: size.width,
      height: size.height
    })
  */
  redrawCanvas();

  if(ytplayer && ytplayer.pauseVideo) {
    if (paused) {
      ytplayer.pauseVideo();
    } else {
      ytplayer.playVideo();
    }
  }
};


// Continuous test the playstate
setInterval(function(){
  if(ytplayer.playVideo) {
    if (paused && ytplayer.getPlayerState() != 2) {
      ytplayer.pauseVideo();
    } else if (!paused) {
      ytplayer.playVideo();
    }
  }
},100);

//
// API fetching
//
var notes = [];

var fetchNotes = function(){
  $.ajax({
    dataType: "json",
    url: "/api/notes",
    data: {},
    success: function(data){
      for(var i=0;i<data.length;i++) {
        var note = data[i];
        var existingNote = _.where(notes, {id: note.id});
        if (existingNote.length == 0) {
          addNote(note);
        }
      }

      updateNotes();
    }
  });
};

var addNote = function(note){
  var elm = $('<div class="note">');

  $('#notes').append(elm);
  elm.attr('id', note.id);

  //note.elm = elm;
  notes.push(note);

  console.log("Add note ", note);
};

var remoteNote = function(note){

}

var updateNotes = function(){
  for(var i=0;i<notes.length;i++){
    var note = notes[i];

    var pos = videoToClientCoord(note.position.x, note.position.y);
    $('#'+note.id).css({
      top: pos.y,
      left: pos.x
    })
  }
};

var blink = function(elm) {
  if(elm.css('opacity') == '1') {
    elm.css('opacity', '0');
  } else {
    elm.css('opacity', '1');
  }
}

var colon = $('#colon');
var flashColon = function() {
  blink(colon);
}

setInterval(fetchNotes, 2000);
setInterval(flashColon, 1000);

//
// Youtube video
//
var onPlayerReady = function(){
  // ytplayer.setPlaybackQuality('highres');
  updatePlayerSize();
};

var onPlayerStateChange = function(){
  if(loading && ytplayer.getPlayerState() == 1){
    loading = false;
    setTimeout(transitionLoadComplete, 300);
    setInterval(tween_time, 50);
  }
};

var onPlayerPlaybackQualityChange = function(){
  console.log("Youtube play quality: ",ytplayer.getPlaybackQuality());

};

var onYouTubePlayerAPIReady = function(){
  ytplayer = new YT.Player('ytplayer', {
    height: '390',
    width: '640',
    videoId: 'qY_TWhJe-Qk',
    playerVars: {
      autoplay: 1,    //< Play on start
      controls: 0,    //< Hide controls
      disablekb: 1,   //< Disable keyboard controls
      enablejsapi: 1, //< Enable js api
      fs: 0,          // Disable fullscreen
      modestbranding: 1, //< Thank you youtube for the offer of branding, but no thanks
      origin:'localhost', // Should be set for security
      rel: 0,          //< Dont show related videos
      showinfo: 0    //< Hide info
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange,
      'onPlaybackQualityChange': onPlayerPlaybackQualityChange
    }
  });


};

var current_time_msec;
var last_time_update;

function tween_time() {

  var time_update = (ytplayer.getCurrentTime()*1000)

  var playing=ytplayer.getPlayerState();

  if (playing==1) {

    if (last_time_update == time_update) {
      current_time_msec += 50;
    }

    if (last_time_update != time_update) {
      current_time_msec = time_update;
    }

  }

  last_time_update = time_update;

  updateAnimation();
}