/// <reference path="../typings/tsd.d.ts" />
/// <reference path="global.ts" />
/// <reference path="api.ts" />
/// <reference path="note.ts" />



interface IDrawingCallback {
    onDrawingComplete?: (path: Path) => void;
}


class DrawingCanvas {
    public api : NotesApi;
    public video : VideoPlayer;
    public events : IDrawingCallback = {};

    public mousePath : Path;

    drawing : svgjs.Element;
    mousePolyline : svgjs.Element;
    circle: svgjs.Element;

    lastMouseTime : number;
    isDragging : boolean = false;




    constructor(){
        // Setup the drawing canvas
        this.drawing = SVG('drawing');


        $("#clickArea")
            .mousedown((event)=>{

                if(GLOBAL.playerMode()) {
                    // Reset the mousePath
                    this.mousePath = new Path([]);

                    // Calculate the % position clicked
                    var mousePos = this.video.clientToVideoCoord(event.pageX, event.pageY);

                    // Add the position to the mousePath
                    this.mousePath.push(new PathPoint(mousePos.x, mousePos.y, this.video.currentTime));
                    this.lastMouseTime = 0;

                    // Listen for mouse drag
                    $("#clickArea").mousemove((event)=>{
                        if (event.which == 0) {
                            // Stop dragging
                            this.isDragging = false;
                            $("#clickArea").unbind("mousemove");
                        } else {

                            // Add the mouse position to the path, if the time has changed
                            this.isDragging = true;
                            var mousePos = this.video.clientToVideoCoord(event.pageX, event.pageY);
                            var mouseTime = this.video.currentTime;

                            if (this.lastMouseTime != mouseTime) {
                                this.lastMouseTime = mouseTime;
                                this.mousePath.push(new PathPoint(mousePos.x, mousePos.y, mouseTime));
                                this.updateMouseTrail();
                            }
                        }
                    });
                }
            })
            .mouseup((event)=>{

                if(GLOBAL.playerMode()) {
                    // Listen for mouseUp events
                    var wasDragging = this.isDragging;
                    this.isDragging = false;
                    $("#clickArea").unbind("mousemove");
                    //   if (wasDragging) {
                    // Simplify the mouse trail
                    this.mousePath.simplify();

                    // Calculate the % position clicked
                    var mousePos = this.video.clientToVideoCoord(event.pageX, event.pageY);

                    // Add the position to the mousePath
                    this.mousePath.push(new PathPoint(mousePos.x, mousePos.y, this.video.currentTime));

                    // And go to the editor mode
                    //gotoEditor();
                    if(this.events.onDrawingComplete) this.events.onDrawingComplete(this.mousePath);
                }
            });
    }

    updateMouseTrail(){

        if(!this.mousePolyline){
            this.mousePolyline = this.drawing.polyline([]).fill('none').stroke({ width: 5,  color: '#f06' })
        }

        var c = $('#drawing')

        var scaleX = c.width();
        var scaleY = c.height()


        var p = [];
        for(var i=0;i<this.mousePath.points.length;i++){
            p.push([this.mousePath.points[i].x*scaleX, this.mousePath.points[i].y*scaleY]);
        }

        var casted : any = this.mousePolyline;
        casted.plot(p);
    }


    updateAnimation(){
        if(GLOBAL.editorMode()){
            var p = this.mousePath.getPosAtTime(this.video.currentTime);
            //<mousePath.log(p);
            if(p) {
                var c = $('#drawing')

                var scaleX = c.width();
                var scaleY = c.height()

                if (!this.circle) {
                    this.circle = this.drawing.circle(50).attr({fill: '#f06'})
                }
                this.circle.move(p.x * scaleX - 25, p.y * scaleY - 25);

                this.video.zoomPos.x = p.x;
                this.video.zoomPos.y = p.y;
                this.video.updatePlayerSize();

            }
        } else {
            /* if(circle){
             circle.remove();
             }*/
        }


    }


    clearMouseTrail(){
        var casted : any = this.mousePolyline;
        casted.plot([]);
    }



    updateNotes(notes){
        for(var i=0;i<notes.length;i++){
            var note : Note = notes[i];

            var p = note.path.getPosAtTime(video.currentTime);

            if(p) {
                if(!note.elm){
                    note.elm = $('<div class="note">');
                    //  note.elm.append('<div class="note-white">');
                    note.elm.append('<div class="note-text">'+note.text+'</div>');
                    $('#notes').append(note.elm);
                    note.elm.attr('id', note.id);

                    note.line = this.drawing.polyline([]).fill('none').stroke({ width: 2,  color: 'rgba(0,0,0,0.5)' })

                }


                this.updateNoteElm(note, p);
            } else if(note.elm && note.path.last().time+100 < video.currentTime){
                // Remove old notes
                this.removeNote(note);
                notes.splice(i,1);
                i--;
            }
        }
    }




    // Update a specific notes visual elements position
    updateNoteElm(note :Note, p:any){
        if(p) {

            var pos = video.videoToClientCoord(p.x, p.y);
          //  console.log(p,pos);
            if(pos != note.curPos) {
                if(!note.curPos){
                    note.curPos = pos;
                }
                 var dirVec = {x: (pos.x - note.curPos.x),
                    y: (pos.y - note.curPos.y)};

                var length = Math.sqrt(dirVec.x*dirVec.x + dirVec.y*dirVec.y);
                if(length > 0) {
                    var dirUnitVec = {
                        x: dirVec.x / length,
                        y: dirVec.y / length
                    };

                    var dist = 40;

                    var goalDir = {
                        x: dirVec.x - dirUnitVec.x * dist,
                        y: dirVec.y - dirUnitVec.y * dist
                    };

                    note.curPos.x += goalDir.x * 0.1;
                    note.curPos.y += goalDir.y * 0.1;
                }


                var offset = {x:0, y:0};
                if(dirUnitVec.x > 0.1){
                    offset.x = -note.elm.children(".note-text").outerWidth()+4;
                }

                if(dirUnitVec.y > 0.5){
                    offset.y = -note.elm.children(".note-text").outerHeight()+4;
                }
                //console.log(offset);
                note.elm.css({
                    top: note.curPos.y + offset.y,
                    left: note.curPos.x + offset.x
                });

               /* console.log({
                    top: note.curPos.y,
                        left: note.curPos.x
                })*/

                var c = $('#drawing');
                var scaleX = c.width();
                var scaleY = c.height();

                var p2 = video.clientToVideoCoord(note.curPos.x, note.curPos.y);


                note.line.plot([[ p2.x*scaleX+2.0 , p2.y*scaleY+2],
                 [ p.x*scaleX ,  p.y*scaleY]])
            }
        }
    }


    removeNote(note : Note){
        console.log("Remove ", note);
        note.elm.remove();
        note.line.plot([]);
        delete note.line;
    }




}