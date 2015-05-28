/// <reference path="../typings/tsd.d.ts" />
/// <reference path="note.ts" />
var NotesApi = (function () {
    function NotesApi() {
        this.notes = [];
        this.currentTime = 0;
    }
    NotesApi.prototype.startFetching = function (fetchRate, fetchWindowSize) {
        var _this = this;
        this.fetchRate = fetchRate;
        this.fetchWindowSize = fetchWindowSize;
        setInterval(function () {
            _this.fetchNotes();
        }, 15000);
        this.fetchNotes();
    };
    NotesApi.prototype.fetchNotes = function () {
        var _this = this;
        console.log("Fetch", this.fetchWindowSize);
        $.ajax({
            dataType: "json",
            url: "/api/notes",
            data: {
                timeframeStart: this.currentTime,
                timeframeEnd: this.currentTime + this.fetchWindowSize
            },
            success: function (data) {
                for (var i = 0; i < data.length; i++) {
                    var existingNote = _.where(_this.notes, { id: data[i].id });
                    if (existingNote.length == 0) {
                        //console.log("Add note");
                        var note = new Note(data[i]);
                        _this.notes.push(note);
                    }
                }
                //Remove old notes
                _this.removeOldNotes();
                //updateNotes();
            }
        });
    };
    NotesApi.prototype.removeOldNotes = function () {
        for (var i = 0; i < this.notes.length; i++) {
            var note = this.notes[i];
            if (note.path.last().time + 100 < this.currentTime) {
                // Remove old notes
                //removeNote(note);
                console.log("Remove " + i);
                this.notes.splice(i, 1);
                i--;
            }
        }
    };
    NotesApi.prototype.submitNote = function (note) {
        var _this = this;
        console.log("Submit ", note.path.points, note.text);
        $.ajax({
            type: "POST",
            dataType: "json",
            url: "/api/notes",
            data: JSON.stringify({ path: note.path.points, text: note.text }),
            contentType: "application/json; charset=utf-8",
            success: function () {
                _this.fetchNotes();
            }
        });
    };
    return NotesApi;
})();
//# sourceMappingURL=api.js.map