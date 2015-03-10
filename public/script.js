var ytplayer;
function onYouTubePlayerAPIReady() {
  ytplayer = new YT.Player('ytplayer', {
    height: '390',
    width: '640',
    videoId: 'SxWKffqBjMM',
    playerVars: {
      autoplay: 1,    //< Play on start
      controls: 0,    //< Hide controls
      disablekb: 1,   //< Disable keyboard controls
      enablejsapi: 1, //< Enable js api
      fs: 0,          // Disable fullscreen
      modestbranding: 1, //< Thank you youtube, but no thanks
      origin:'localhost', // Should be set for security
      rel: 0,          //< Dont show related videos
      showinfo: 0    //< Hide info
    }
  });
}

var videoZoom = 1;
var videoPosX = 0;
var videoPosY = 0;
var paused = false;

$(document).ready(function(){

  var updatePlayerSize = function(){
    var player = $('#ytplayer');
    player.width($( window ).width()*videoZoom);
    player.height($( window ).height()*videoZoom);

    if(ytplayer && ytplayer.pauseVideo) {
      if (paused) {
        ytplayer.pauseVideo();
        console.log("Pause");

      } else {
        ytplayer.playVideo();
      }
    }
  };

  // Update player on window resize
  $(window).resize(updatePlayerSize);
  updatePlayerSize();

  $("#ytblock").click(function(){
    if(videoZoom == 1){
      videoZoom = 2;
      paused = true;
    } else {
      videoZoom = 1;
      paused = false;
    }

    //player.pauseVideo();
    updatePlayerSize();
  })
});