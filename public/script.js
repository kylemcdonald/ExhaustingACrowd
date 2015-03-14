var ytaspect = 16.0/9.0;
var animationEnabled = false;
var ytplayer;


var videoZoom = 1;
var videoPos = {x:0, y:0};
var paused = false;

$(document).ready(function(){
  $("#ytblock").click(function(e){
    if(videoZoom == 1){
      zoom(clientToVideoCoord(e.clientX, e.clientY));
    } else {
      resetZoom();
    }
  });

  // Update player on window resize
  $(window).resize(updatePlayerSize);
});



var clientToVideoCoord = function(clientX, clientY){
  var ret = {
    x: clientX / $(window).width(),
    y: clientY / $(window).height()
  };

  if($(window).width() / $(window).height() >  ytaspect){
    t = $(window).height() * ytaspect;
    ret.x -= (1-(t/$(window).width()))*0.5;
    ret.x *=  $(window).width() / t;
  } else {
    t = $(window).width() / ytaspect;
    ret.y -= (1-(t/$(window).height()))*0.5;
    ret.y *=  $(window).height() / t;
  }
  return ret;
};

var videoToClientCoord = function(videoX, videoY){
  var ret = {
    x: videoX,
    y: videoY
  };

  if($(window).width() / $(window).height() >  ytaspect){
    t = $(window).height() * ytaspect;
    ret.x /=  $(window).width() / t;
    ret.x += (1-(t/$(window).width()))*0.5;
  } else {
    t = $(window).width() / ytaspect;
    ret.y /=  $(window).height() / t;
    ret.y += (1-(t/$(window).height()))*0.5;
  }

  ret.x *= $(window).width();
  ret.y *= $(window).height();
  return ret;
};

var zoom = function(pos){
  videoZoom = 4;
  paused = true;
  videoPos = pos;
  updatePlayerSize();
};

var resetZoom = function(){
  videoZoom = 1;
  paused = false;
  updatePlayerSize();
};

var updatePlayerSize = function(){
  var player = $('#ytplayer');

  var left = 0;
  var top = 0;
  var width = $( window ).width()*videoZoom;
  var height = $( window ).height()*videoZoom;


  if(videoZoom == 1){
    // No Zoom
  } else {
    // Zoom
    var windowZoomPos = videoToClientCoord(videoPos.x, videoPos.y);
    windowZoomPos.x *= videoZoom;
    windowZoomPos.y *= videoZoom;

    var diff = {
      x: $(window).width() * 0.5 - windowZoomPos.x,
      y: $(window).height() * 0.5 - windowZoomPos.y
    };

    if(diff.x > 0) diff.x = 0;
    if(diff.y > 0) diff.y = 0;
    if(diff.x < -($(window).width()*videoZoom-$(window).width()))
      diff.x = -($(window).width()*videoZoom-$(window).width());
    if(diff.y < -($(window).height()*videoZoom-$(window).height()))
      diff.y = -($(window).height()*videoZoom-$(window).height());

    left= diff.x;
    top = diff.y;
  }

  if(animationEnabled) {
    player.animate({
      left: left,
      top: top,
      width: width,
      height: height
    });
  } else {
    player.css({
      left: left,
      top: top,
      width: width,
      height: height
    })
  }

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
// Youtube video
//
var onPlayerReady = function(){
 // ytplayer.setPlaybackQuality('highres');
  updatePlayerSize();
};

var onPlayerStateChange = function(){
};

var onPlayerPlaybackQualityChange = function(){
  console.log("Youtube play quality: ",ytplayer.getPlaybackQuality());

}

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