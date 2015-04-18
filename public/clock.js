
var clockTime = new Date();

$(document).ready(function() {

  function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    minutes = minutes < 10 ? '0'+minutes : minutes;
    return minutes + ' ' + ampm;
  }

  var blink = function (elm) {
    if (elm.css('opacity') == '1') {
      elm.css('opacity', '0');
    } else {
      elm.css('opacity', '1');
    }
  }

  var colon = $('#colon');
  var updateClock = function () {

    clockTime.setSeconds(clockTime.getSeconds() + 1);

    blink(colon);

    $('#hour').html(clockTime.getHours() % 12);
    $('#minute').html(formatAMPM(clockTime));

  };

  setInterval(updateClock, 1000);
});