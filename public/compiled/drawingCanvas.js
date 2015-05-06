/// <reference path="../typings/tsd.d.ts" />
/// <reference path="global.ts" />
/// <reference path="api.ts" />
/// <reference path="note.ts" />
var DrawingCanvas = (function () {
    function DrawingCanvas() {
        var _this = this;
        this.events = {};
        this.isDragging = false;
        // Setup the drawing canvas
        this.drawing = SVG('drawing');
        $("#clickArea").mousedown(function (event) {
            if (GLOBAL.playerMode()) {
                // Reset the mousePath
                _this.mousePath = new Path([]);
                // Calculate the % position clicked
                var mousePos = _this.video.clientToVideoCoord(event.pageX, event.pageY);
                // Add the position to the mousePath
                _this.mousePath.push(new PathPoint(mousePos.x, mousePos.y, _this.video.currentTime));
                _this.lastMouseTime = 0;
                // Listen for mouse drag
                $("#clickArea").mousemove(function (event) {
                    if (event.which == 0) {
                        // Stop dragging
                        _this.isDragging = false;
                        $("#clickArea").unbind("mousemove");
                    }
                    else {
                        // Add the mouse position to the path, if the time has changed
                        _this.isDragging = true;
                        var mousePos = _this.video.clientToVideoCoord(event.pageX, event.pageY);
                        var mouseTime = _this.video.currentTime;
                        if (_this.lastMouseTime != mouseTime) {
                            _this.lastMouseTime = mouseTime;
                            _this.mousePath.push(new PathPoint(mousePos.x, mousePos.y, mouseTime));
                            _this.updateMouseTrail();
                        }
                    }
                });
            }
        }).mouseup(function (event) {
            if (GLOBAL.playerMode()) {
                // Listen for mouseUp events
                var wasDragging = _this.isDragging;
                _this.isDragging = false;
                $("#clickArea").unbind("mousemove");
                //   if (wasDragging) {
                // Simplify the mouse trail
                _this.mousePath.simplify();
                // Calculate the % position clicked
                var mousePos = _this.video.clientToVideoCoord(event.pageX, event.pageY);
                // Add the position to the mousePath
                _this.mousePath.push(new PathPoint(mousePos.x, mousePos.y, _this.video.currentTime));
                // And go to the editor mode
                //gotoEditor();
                if (_this.events.onDrawingComplete)
                    _this.events.onDrawingComplete(_this.mousePath);
            }
        });
    }
    DrawingCanvas.prototype.updateMouseTrail = function () {
        if (!this.mousePolyline) {
            this.mousePolyline = this.drawing.polyline([]).fill('none').stroke({ width: 5, color: '#f06' });
        }
        var c = $('#drawing');
        var scaleX = c.width();
        var scaleY = c.height();
        var p = [];
        for (var i = 0; i < this.mousePath.points.length; i++) {
            p.push([this.mousePath.points[i].x * scaleX, this.mousePath.points[i].y * scaleY]);
        }
        var casted = this.mousePolyline;
        casted.plot(p);
    };
    DrawingCanvas.prototype.updateAnimation = function () {
        if (GLOBAL.editorMode()) {
            var p = this.mousePath.getPosAtTime(this.video.currentTime);
            //<mousePath.log(p);
            if (p) {
                var c = $('#drawing');
                var scaleX = c.width();
                var scaleY = c.height();
                if (!this.circle) {
                    this.circle = this.drawing.circle(50).attr({ fill: '#f06' });
                }
                this.circle.move(p.x * scaleX - 25, p.y * scaleY - 25);
                this.video.zoomPos.x = p.x;
                this.video.zoomPos.y = p.y;
                this.video.updatePlayerSize();
            }
        }
        else {
        }
    };
    DrawingCanvas.prototype.clearMouseTrail = function () {
        var casted = this.mousePolyline;
        casted.plot([]);
    };
    DrawingCanvas.prototype.updateNotes = function (notes) {
        for (var i = 0; i < notes.length; i++) {
            var note = notes[i];
            var p = note.path.getPosAtTime(video.currentTime);
            if (p) {
                if (!note.elm) {
                    note.elm = $('<div class="note">');
                    //  note.elm.append('<div class="note-white">');
                    note.elm.append('<div class="note-text">' + note.text + '</div>');
                    $('#notes').append(note.elm);
                    note.elm.attr('id', note.id);
                }
                this.updateNoteElm(note, p);
            }
            else if (note.elm && note.path.last().time + 100 < video.currentTime) {
                // Remove old notes
                this.removeNote(note);
                notes.splice(i, 1);
                i--;
            }
        }
    };
    // Update a specific notes visual elements position
    DrawingCanvas.prototype.updateNoteElm = function (note, p) {
        if (p) {
            var pos = video.videoToClientCoord(p.x, p.y);
            //  console.log(p,pos);
            if (pos != note.curPos) {
                //  if(!note.curPos){
                note.curPos = pos;
                //}
                /* var dirVec = {x: (pos.x - note.curPos.x),
                    y: (pos.y - note.curPos.y)};

                var length = Math.sqrt(dirVec.x*dirVec.x + dirVec.y*dirVec.y);

                var dirUnitVec = {x: dirVec.x / length,
                    y: dirVec.y / length};

                var goalDir = {x: dirVec.x - dirUnitVec.x*40,
                    y: dirVec.y - dirUnitVec.y*40};

                note.curPos.x += goalDir.x * 0.1;
                note.curPos.y += goalDir.y * 0.1;*/
                note.elm.css({
                    top: note.curPos.y,
                    left: note.curPos.x
                });
                /* console.log({
                     top: note.curPos.y,
                         left: note.curPos.x
                 })*/
                var c = $('#drawing');
                var scaleX = c.width();
                var scaleY = c.height();
                var p2 = video.clientToVideoCoord(note.curPos.x, note.curPos.y);
            }
        }
    };
    DrawingCanvas.prototype.removeNote = function (note) {
        console.log("Remove ", note);
        note.elm.remove();
        //  note.line.plot([]);
        // delete note.line;
    };
    return DrawingCanvas;
})();
//# sourceMappingURL=drawingCanvas.js.map