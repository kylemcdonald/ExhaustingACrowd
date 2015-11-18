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
        this.linedrawing = SVG('linedrawing');
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
        $(window).mouseleave(function (event) {
            if (GLOBAL.playerMode() && _this.isDragging) {
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
            this.mousePolyline = this.drawing.polyline([]).fill('none').stroke({ width: 5, color: 'white', opacity: .5 });
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
                    this.circle = this.drawing.circle(50).attr({ fill: 'white', opacity: .5 });
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
        if (this.mousePolyline) {
            var casted = this.mousePolyline;
            casted.plot([]);
        }
    };
    DrawingCanvas.prototype.updateNotes = function (notes) {
        for (var i = 0; i < notes.length; i++) {
            var note = notes[i];
            var p = note.path.getPosAtTime(video.currentTime);
            if (p) {
                if (!note.elm) {
                    note.elm = $('<div class="note"/>');
                    var noteText = $('<div class="note-text"/>');
                    noteText.text(note.text);
                    note.elm.append(noteText);
                    $('#notes').append(note.elm);
                    note.elm.attr('id', note.id);
                    note.line = this.linedrawing.polyline([]).fill('none').stroke({ width: 2, color: 'rgba(0,0,0,0.5)' });
                }
                this.updateNoteElm(note, p);
            }
            else if (note.path.last().time + 100 < video.currentTime) {
                // Remove old notes
                if (note.elm) {
                    this.removeNote(note);
                }
                notes.splice(i, 1);
                i--;
            }
            else if (note.elm && note.path.first().time > video.currentTime) {
                // Hide notes not visible yet
                this.removeNote(note);
            }
        }
    };
    // Update a specific notes visual elements position
    DrawingCanvas.prototype.updateNoteElm = function (note, p) {
        if (p) {
            var pos = video.videoToClientCoord(p.x, p.y);
            //  console.log(p,pos);
            if (pos != note.curPos) {
                if (!note.curPos) {
                    note.curPos = pos;
                }
                var dirVec = { x: (pos.x - note.curPos.x), y: (pos.y - note.curPos.y) };
                var length = Math.sqrt(dirVec.x * dirVec.x + dirVec.y * dirVec.y);
                if (length > 0) {
                    var dirUnitVec = {
                        x: dirVec.x / length,
                        y: dirVec.y / length
                    };
                }
                else {
                    var dirUnitVec = {
                        x: 1.0,
                        y: 0.0
                    };
                }
                var dist = 40;
                var goalDir = {
                    x: dirVec.x - dirUnitVec.x * dist,
                    y: dirVec.y - dirUnitVec.y * dist
                };
                note.curPos.x += goalDir.x * 0.1;
                note.curPos.y += goalDir.y * 0.1;
                var offset = { x: -1, y: -1 };
                if (dirUnitVec.x > 0.1) {
                    offset.x = -note.elm.children(".note-text").outerWidth() + 1;
                }
                if (dirUnitVec.y > 0.5) {
                    offset.y = -note.elm.children(".note-text").outerHeight() + 1;
                }
                var playerSize = video.calculatePlayerSize();
                if (note.curPos.y + offset.y > playerSize.height) {
                    note.curPos.y = playerSize.height - offset.y;
                }
                if (note.curPos.y + offset.y < 0) {
                    note.curPos.y = 0 - offset.y;
                }
                if (note.curPos.x + offset.x > playerSize.width) {
                    note.curPos.x = playerSize.width - offset.x;
                }
                if (note.curPos.x + offset.x < 0) {
                    note.curPos.x = 0 - offset.x;
                }
                //console.log(note.curPos.y);
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
                note.line.plot([[Math.floor(p2.x * scaleX), Math.floor(p2.y * scaleY)], [p.x * scaleX, p.y * scaleY]]);
            }
        }
    };
    DrawingCanvas.prototype.removeNote = function (note) {
        //console.log("Remove ", note);
        note.elm.remove();
        note.line.plot([]);
        delete note.line;
        delete note.elm;
    };
    return DrawingCanvas;
})();
