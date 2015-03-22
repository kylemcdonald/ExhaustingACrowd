
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

var submitNote = function(path){
  console.log("Submit ", path);

  $.ajax({
    type: "POST",
    dataType: "json",
    url: "/api/notes",
    data: JSON.stringify({ path: path }),
    contentType: "application/json; charset=utf-8",
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
