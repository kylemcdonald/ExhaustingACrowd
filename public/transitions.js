var transitionLoadComplete = function(){
  $('#transition').animate({
    //left: "100%",
    opacity: "0"
  }, {
    complete: function(){
      console.log("POKAPSODK");

      $('#loading').hide()
    }
  },200);
};


$(document).ready(function(){
  $('#transition').show();
});


var transitionToZoom = function(cb){
  var e = $('#transition');

  e.css({
    opacity:100,
    display:"none",
    left: "100%",
    top:0
  });
  e.show();

  e.animate({ left: "0" }, { complete: cb },1000)
    .delay(100)
    .animate({  opacity: "0"})
}