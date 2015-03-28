
//
// API fetching
//
var notes = [];

var fetchNotes = function(){
  if(!current_time_msec) return;

  $.ajax({
    dataType: "json",
    url: "/api/notes",
    data: {
      timeframeStart: current_time_msec,
      timeframeEnd: current_time_msec+10000
    },
    success: function(data){
      /*  for(var i=0;i<notes.length;i++){
       notes[i]._alive = false;
       }
       */
      for(var i=0;i<data.length;i++) {
        var note = data[i];
        var existingNote = _.where(notes, {id: note.id});
        if (existingNote.length == 0) {
          addNote(note);
        }
        // note._alive = true;
      }

      /*  for(var i=0;i<notes.length;i++){
       if(!notes[i]._alive){
       removeNote(notes[i]);
       }
       }*/

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
    contentType: "application/json; charset=utf-8"
  });
};


setInterval(fetchNotes, 2000);
