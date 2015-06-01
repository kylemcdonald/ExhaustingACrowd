/// <reference path="../typings/tsd.d.ts" />
/// <reference path="note.ts" />


class NotesApi {
    public notes:Note[] = [];
    public currentTime:number = 0;

    fetchRate:number;
    fetchWindowSize:number;

    constructor() {

    }

    startFetching(fetchRate:number, fetchWindowSize:number){
        this.fetchRate = fetchRate;
        this.fetchWindowSize = fetchWindowSize;

        setInterval(()=>{this.fetchNotes()}, 15000);
        this.fetchNotes();
    }

    fetchNotes(){
        console.log("Fetch",this.fetchWindowSize);
        $.ajax({
            dataType: "json",
            url: "/api/notes",
            data: {
                timeframeStart: this.currentTime,
                timeframeEnd: this.currentTime+this.fetchWindowSize
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

                //Remove old notes
                this.removeOldNotes();

                //updateNotes();
            }
        });
    }

    removeOldNotes(){
        for(var i=0;i<this.notes.length;i++){
            var note = this.notes[i];
            if(note.path.last().time+100 < this.currentTime){
                // Remove old notes
                //removeNote(note);
                console.log("Remove "+i);
                this.notes.splice(i,1);
                i--;
            }
        }
    }


    submitNote(note:Note) {
        console.log("Submit ", note.path.points, note.text);

        ga('send', 'event', 'API', 'SubmitNote', 'submit');
        $.ajax({
            type: "POST",
            dataType: "json",
            url: "/api/notes",
            data: JSON.stringify({path: note.path.points, text: note.text}),
            contentType: "application/json; charset=utf-8",
            success: () => {
                setTimeout(()=>{
                    this.fetchNotes();
                },300);

            }
        });
    }
}
