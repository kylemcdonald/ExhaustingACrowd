var transitionLoadComplete = function(){
  $('#transition').animate({
    //left: "100%",
    opacity: "0"
  }, {
    complete: function(){
      $('#loading').hide()
    }
  },200);
};


$(document).ready(function(){
  $('#transition').show();
});


var hideVideo = function(cb){
  var e = $('#transition');

  e.css({
    opacity:0,
    display:"none",
    left: "0",
    top:0
  });
  e.show();

  e.animate({ opacity: "100" }, { complete: cb },1000)
    //.delay(100)
    //.animate({  opacity: "0"})
}

var showVideo = function(cb){
  var e = $('#transition');
  e.animate({ opacity: "0" }, { complete: cb },1000)
}