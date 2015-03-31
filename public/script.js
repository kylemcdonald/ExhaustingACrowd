var ytaspect = 16.0/9.0;
var ytplayer;

var loading = true;

var videoZoom = 1;
var videoPos = {x:0, y:0};
var paused = false;

var mousePos;
var isDragging = false;
var mousePath = [];
var lastMouseTime;
var mode = "PLAYER";
var current_time_msec = 0;

var drawing;

$(document).ready(function(){

  $(document).keyup(function(e) {

    // escape key maps to keycode `27`
    if (e.keyCode == 27) {
      if(mode=="EDITOR"){
        gotoVideo();
      }
    }
  });

  $('#rewind').click(function(){
    seekVideo(current_time_msec-30000);
  });

  $("#clickArea")
    .mousedown(function(e){

      if(mode == "PLAYER") {
        // Reset the mousePath
        mousePath = [];

        // Calculate the % position clicked
        mousePos = clientToVideoCoord(event.pageX, event.pageY);
        mousePos.time = current_time_msec;

        // Add the position to the mousePath
        mousePath.push(mousePos);
        lastMouseTime = 0;

        // Listen for mouse drag
        $("#clickArea").mousemove(function (e) {
          if (event.which == 0) {
            // Stop dragging
            isDragging = false;
            $("#clickArea").unbind("mousemove");
          } else {

            // Add the mouse position to the path, if the time has changed
            isDragging = true;
            mousePos = clientToVideoCoord(event.pageX, event.pageY);
            mousePos.time = current_time_msec;
            if (lastMouseTime != mousePos.time) {
              lastMouseTime = mousePos.time;
              mousePath.push(mousePos);
              updateMouseTrail();
            }
          }
        });
      }
    })
    .mouseup(function() {

      if(mode == "PLAYER") {
        // Listen for mouseUp events
        var wasDragging = isDragging;
        isDragging = false;
        $("#clickArea").unbind("mousemove");
        //   if (wasDragging) {
        // Simplify the mouse trail
        simplifyMouseTrail();

        // Calculate the % position clicked
        mousePos = clientToVideoCoord(event.pageX, event.pageY);
        mousePos.time = current_time_msec;

        // Add the position to the mousePath
        mousePath.push(mousePos);

        // And go to the editor mode
        gotoEditor();
        //  }
      }
    });


  // Update player on window resize
  $(window).resize(updatePlayerSize);

  // Setup the drawing canvas
  drawing = SVG('drawing');
});


var gotoEditor = function(){
  hideVideo(function(){
    mode = "EDITOR";
    videoZoom = 4;

    // Seek to the path start time
    seekVideo(mousePath[0].time, function(){
      showVideo();
    });

    // Set the video zoom position
    videoPos = {x: mousePath[0].x, y:mousePath[0].y};
    updatePlayerSize();

    // Update the interface
    $('#notes').hide();
    $('#addNoteInterface').show();

    $('#note-text').val('').focus();
  });

  var trySubmit = function(){
    var text = $('#note-text').val();
    if(text) {
      // Submit the path to the API
      submitNote(mousePath, text);

      // GOTO video mode again
      gotoVideo();
    } else {
      $('#note-text').attr('placeholder', 'Please write something').focus();
      $('#submitButton').unbind('click').click(trySubmit)
    }
  };


  $('#submitButton').unbind('click').click(trySubmit)
};

var gotoVideo = function(){

  hideVideo(function(){
    mode = "PLAYER";
    videoZoom = 1;

    updatePlayerSize();
    clearMouseTrail();

    // Seek to the path start time
    seekVideo(mousePath[0].time-5000, function(){
      showVideo();
    });

    $('#notes').show();
    $('#addNoteInterface').hide();
  })
};

var getPosAtTimeFromPath = function(time, path){
  if(path.length == 0){
    return;
  }

  if(time < path[0].time){
    return undefined;
  }

  for(var i=0;i<path.length;i++){
    if(path[i].time >= time ){
      if(i == 0){
        return path[i];
      }

      var p = path[i-1];
      var n = path[i];

      var pct = (time - p.time) / (n.time - p.time);

      return {
        x: p.x * (1-pct) + n.x*pct,
        y: p.y * (1-pct) + n.y*pct,
        time: time
      };
    }
  }
}

var circle;
var updateAnimation = function(){
  if(mode == "EDITOR"){
    var p = getPosAtTimeFromPath(current_time_msec, mousePath);
    //<mousePath.log(p);

    if(p) {
      var c = $('#drawing')

      var scaleX = c.width();
      var scaleY = c.height()

      if (!circle) {
        circle = drawing.circle(50).attr({fill: '#f06'})
      }
      circle.move(p.x * scaleX - 25, p.y * scaleY - 25);

      videoPos.x = p.x;
      videoPos.y = p.y;
      updatePlayerPosition();
    }
  } else {
    /* if(circle){
     circle.remove();
     }*/
  }


}


var polyline;
var updateMouseTrail = function(){

  if(!polyline){
    polyline = drawing.polyline([]).fill('none').stroke({ width: 5,  color: '#f06' })
  }

  var c = $('#drawing')

  var scaleX = c.width();
  var scaleY = c.height()


  var p = [];
  for(var i=0;i<mousePath.length;i++){
    p.push([mousePath[i].x*scaleX, mousePath[i].y*scaleY]);
  }
  polyline.plot(p)
};

var clearMouseTrail = function(){
  polyline.plot([]);
}

var simplifyMouseTrail = function(){
  console.log("Mouse path length before simplification: "+mousePath.length);
  mousePath = simplify(mousePath, 0.002);
  console.log("Mouse path length after simplification: "+mousePath.length);
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

var updatePlayerPosition = function(){
  var player = $('#videocontainer');

  var size = calculatePlayerSize();

  player.css({
    left: size.left,
    top: size.top-50
  });
}

var updatePlayerSize = function(){
  var player = $('#videocontainer');

  var size = calculatePlayerSize();

  player.css({
    left: size.left,
    top: size.top-50,
    width: size.width,
    height: size.height+100
  });

  updateMouseTrail();
};

var seekVideo = function(ms, cb){
  console.log("Seek to " + ms / 1000);
  ytplayer.seekTo(ms/1000);
  current_time_msec = ms;

  // Wait for the video having seeked
  var stateChange = function(e){
    if(e.data == 1) {
      ytplayer.removeEventListener("onStateChange", stateChange);
      if(cb)cb();
    }
  };
  ytplayer.addEventListener("onStateChange", stateChange)
}


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
// Time
//
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
    setInterval(frameUpdate, 10);
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

var _last_time_update;

// frame update, called every 10ms, updates the current time,
// and calls other update functions
function frameUpdate() {

  var time_update = (ytplayer.getCurrentTime()*1000)

  var playing=ytplayer.getPlayerState();

  if (playing==1) {

    if (_last_time_update == time_update) {
      current_time_msec += 10;
    }

    if (_last_time_update != time_update) {
      current_time_msec = time_update;
    }

  }

  _last_time_update = time_update;

  updateAnimation();
  updateNotes();
}

//
// Notes
//

// Update notes is called in every "frame" to update notes position
var updateNotes = function(){
  for(var i=0;i<notes.length;i++){
    var note = notes[i];

    var p = getPosAtTimeFromPath(current_time_msec, note.path);

    if(p) {
      if(!note.elm){
        console.log("ADD NOTE");
        note.elm = $('<div class="note">');
        note.elm.append('<div class="note-white">');
        note.elm.append('<div class="note-text">'+note.note+'</div>');
        $('#notes').append(note.elm);
        note.elm.attr('id', note.id);
      }

      updateNoteElm(note, p);
    } else if(note.elm && note.path[note.path.length-1].time+100 < current_time_msec){
      removeNote(note);
      notes.splice(i,1);
      i--;
    }
  }
};

// Update a specific notes visual elements position
var updateNoteElm = function(note, p){
  if(p) {
    var pos = videoToClientCoord(p.x, p.y);
    if(pos != note._lastPos) {
      note._lastPos = pos;

      note.elm.css({
        top: pos.y,
        left: pos.x
      })
    }
  }
};

// Called from the api controller, adding a new note
var addNote = function(note){
  console.log("Add note ", note);
  notes.push(note);
};

// Called from the api controller, removing notes
var removeNote = function(note){
  console.log("Remove ", note);
  note.elm.remove();
};
