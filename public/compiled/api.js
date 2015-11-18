/// <reference path="../typings/tsd.d.ts" />
/// <reference path="note.ts" />
var NotesApi = (function () {
    function NotesApi(site) {
        var _this = this;
        this.notes = [];
        this.currentTime = 0;
        this.submitNoteThrottle = _.throttle(function (note) {
            //console.log("Submit ", note.path.points, note.text);
            ga('send', 'event', 'API', 'SubmitNote', 'submit');
            $.ajax({
                type: "POST",
                dataType: "json",
                url: "/api/notes",
                data: JSON.stringify({ path: note.path.points, text: note.text, site: _this.siteId }),
                contentType: "application/json; charset=utf-8",
                success: function () {
                    setTimeout(function () {
                        _this.fetchNotes();
                    }, 300);
                }
            });
        }, 5000);
        this.siteId = site;
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
    NotesApi.prototype.fetchNotes = function (_currentTime) {
        var _this = this;
        if (_currentTime) {
            this.currentTime = _currentTime;
        }
        //console.log("Fetch",this.fetchWindowSize,this.currentTime);
        $.ajax({
            dataType: "json",
            url: "/api/notes",
            data: {
                timeframeStart: this.currentTime - 2000,
                timeframeEnd: this.currentTime + this.fetchWindowSize,
                site: this.siteId
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
            }
        });
    };
    NotesApi.prototype.submitNote = function (note) {
        this.submitNoteThrottle(note);
    };
    return NotesApi;
})();
