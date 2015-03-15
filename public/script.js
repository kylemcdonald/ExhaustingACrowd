var ytaspect = 16.0/9.0;
var ytplayer;

var loading = true;

var videoZoom = 1;
var videoPos = {x:0, y:0};
var paused = false;
var mousePos;

$(document).ready(function(){
  $("#overlay").click(function(e){
    if(videoZoom == 1){
      zoom(clientToVideoCoord(e.clientX, e.clientY));
    } else {
      resetZoom();
    }
  })
    .mousemove(function( event ) {
      mousePos = clientToVideoCoord(event.pageX, event.pageY);
    });

  // Update player on window resize
  $(window).resize(updatePlayerSize);
});



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
  var player = $('#ytplayer');

  var size = calculatePlayerSize();

  player.css({
    left: size.left,
    top: size.top-50,
    width: size.width,
    height: size.height+100
  });


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

setInterval(fetchNotes, 2000);
setInterval(updateNotes, 1000);

//
// Youtube video
//
var onPlayerReady = function(){
  // ytplayer.setPlaybackQuality('highres');
  updatePlayerSize();
};

var onPlayerStateChange = function(){
  if(loading && ytplayer.getPlayerState() == 1){
    setTimeout(transitionLoadComplete, 300);
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
}