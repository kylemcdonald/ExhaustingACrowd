/// <reference path="../typings/tsd.d.ts" />
/// <reference path="note.ts" />


class NotesApi {
    public notes:Note[] = [];
    public currentTime:number = 0;

    fetchRate:number;
    fetchWindowSize:number;

    siteId:number;

    constructor(site:number) {
        this.siteId = site;
    }

    startFetching(fetchRate:number, fetchWindowSize:number){
        this.fetchRate = fetchRate;
        this.fetchWindowSize = fetchWindowSize;

        setInterval(()=>{this.fetchNotes()}, 15000);

        this.fetchNotes();
    }

    fetchNotes(_currentTime?:number){
        if(_currentTime){
            this.currentTime = _currentTime;
        }
        //console.log("Fetch",this.fetchWindowSize,this.currentTime);
        $.ajax({
            dataType: "json",
            url: "/api/notes",
            data: {
                timeframeStart: this.currentTime-2000,
                timeframeEnd: this.currentTime+this.fetchWindowSize,
                site: this.siteId
            },
            success: (data:any)=>{
                for(var i=0;i<data.length;i++) {
                    var existingNote = _.where(this.notes, {id: data[i].id});
                    if (existingNote.length == 0) {
                        //console.log("Add note");
                        var note:Note = new Note(data[i]);
                        this.notes.push(note);
                        //addNote(note);
                    }
                }
            }
        });
    }

    private submitNoteThrottle = _.throttle((note:Note) =>{
            //console.log("Submit ", note.path.points, note.text);

            ga('send', 'event', 'API', 'SubmitNote', 'submit');
            $.ajax({
                type: "POST",
                dataType: "json",
                url: "/api/notes",
                data: JSON.stringify({path: note.path.points, text: note.text, site:this.siteId}),
                contentType: "application/json; charset=utf-8",
                success: () => {
                    setTimeout(()=>{
                        this.fetchNotes();
                    },300);

                }
            });
    }, 5000);

    submitNote(note:Note){
        this.submitNoteThrottle(note);
    }
}
