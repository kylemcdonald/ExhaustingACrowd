var transitionLoadComplete = function(){
  $('#transition').animate({
    opacity: "0"
  }, {
    complete: function(){
      $('#transition').hide();
      $('#loading').hide()
    }
  },200);
};


$(document).ready(function(){
  $('#transition').show();
});


var hideVideo = function(cb){
  var e = $('#transition');

  e.show();

  e.animate({ opacity: "100" }, { complete: function(){
    if(cb)
      cb()
  } },1000)
};

var showVideo = function(cb){
  var e = $('#transition');
  e.animate({ opacity: "0" }, { complete: function(){
    $('#transition').hide();
    if(cb)
      cb();
  } },1000)
};