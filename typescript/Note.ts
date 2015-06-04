declare var simplify:any; // Magic

class PathPoint {
    x:number;
    y:number;
    time:number;

    constructor(x:number, y:number, time:number){
        this.x = x;
        this.y = y;
        this.time = time;

      //  console.log(this);
    }
}

class Path {
    points:PathPoint[];

    constructor(json:any[]){
        this.points = [];


        if(json && json.length > 0) {
            for(var i=0;i<json.length;i++){
                this.points.push(new PathPoint(json[i].x, json[i].y, json[i].time));
            }

            // Check that the path is at least 3 sec long
            var diff = this.last().time - this.points[0].time;
            if (diff < 3000) {
                this.points[this.points.length - 1].time += 3000 - diff;
            }
        }
    }

    push(point : PathPoint){
        this.points.push(point);
    }

    last(){
        return _.last(this.points);
    }

    first(){
        return _.first(this.points);
    }

    getPosAtTime(time:number){
        if(this.points.length == 0){
            return;
        }

        if(time < this.points[0].time){
            return undefined;
        }

        for(var i=0;i<this.points.length;i++){
            if(this.points[i].time >= time ){
                if(i == 0){
                    return this.points[i];
                }

                var p = this.points[i-1];
                var n = this.points[i];

                var pct = (time - p.time) / (n.time - p.time);

                return {
                    x: p.x * (1-pct) + n.x*pct,
                    y: p.y * (1-pct) + n.y*pct,
                    time: time
                };
            }
        }
    }


    simplify(){
        this.points = simplify(this.points, 0.002);
    }
}

class Note {
    id: number;
    time_begin:number;
    time_end:number;
    text:string;
    path:Path;

    elm: JQuery;
    line : any;
    curPos: any;

    constructor(json){
        if(json) {
            this.id = json.id;
            this.time_begin = json.time_begin;
            this.time_end = json.time_end;
            this.text = json.note;
            this.path = new Path(json.path);


            if(this.text) {
                var dur = this.time_end - this.time_begin;
                var minDur = this.text.length / 140 * 6000 + 3000; // 6 seconds to read 140 characters
                if (dur < minDur) {
                    var newPoint = new PathPoint(
                        this.path.last().x,
                        this.path.last().y,
                        this.path.first().time + minDur
                    );
                    this.path.push(newPoint);
                    this.time_end = this.time_begin + minDur;
                }
            }
        }
    }
}