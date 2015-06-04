var query = require('pg-query');
var express = require('express');
var bodyParser = require("body-parser");
var request = require('request');
var blacklist = require('./blacklist.json');

query.connectionParameters = process.env.DATABASE_URL;


module.exports = {
  setup: function(){
    this.api = express();
    this.api.use(bodyParser.json());
    this.api.enable('trust proxy')

    /*query("SELECT * FROM information_schema.tables where table_name = 'paths'", function(rows, ret){
     if(ret.length == 0){
     query('CREATE TABLE "public"."paths" (\
     "id" serial,\
     "coordinate" point,\
     "time" int,\
     "note_id" int,\
     PRIMARY KEY ("id"));')
     }
     });*/

    query("SELECT * FROM information_schema.tables where table_name = 'notes'", function(rows, ret){
      if(ret.length == 0){
        query('CREATE TABLE "public"."notes" (\
    "id" serial,\
      "time_begin" int,\
      "time_end" int,\
      "note" text,\
      "ip" cidr,\
      "timestamp" timestamp,\
      "path" float[][],\
      PRIMARY KEY ("id"));')
      }
    });

    this.api.get('/notes/count', function (req, res) {
      query('SELECT count(*) FROM notes', [], function(err, ret){
        if(err){
          res.status(500).send('Could not select notes');
          console.log(err);
          return;
        }
        if(!ret.length){
          res.status(500).send('SELECT returned no results');
          console.log(err);
          return;
        }
        res.send(ret[0]);
      });
    })

    this.api.get('/notes', function (req, res) {
      var startTime = Math.round(req.query.timeframeStart);
      var endTime = Math.round(req.query.timeframeEnd);

      //if(endTime - startTime > )

      query('SELECT ip, notes.id, time_begin, time_end, note, path ' +
        'FROM "notes" ' +
        'where time_end >= $1 and time_begin <= $2 ' +
        'limit 100',

        [startTime, endTime], function(err, ret){
          if(err ){
            res.status(500).send('Could not select notes');
            console.log(err);
            return;
          }

          for(var u=0;u<ret.length;u++){
            var path = [];
            for(var i=0;i<ret[u].path.length;i++){
              path.push({
                x: ret[u].path[i][0],
                y: ret[u].path[i][1],
                time: ret[u].path[i][2]
              })
            }
            ret[u].path = path;
          }

          // filter out blacklisted ips except to those people
          var srcIp = req.query.ip || req.ip; // use ip arg to test this
          ret = ret.filter(function(note) {
            return blacklist.indexOf(note.ip) == -1 || note.ip == srcIp;
          })

          // don't reveal ip through api
          ret = ret.map(function(note) {
            delete note.ip;
            return note;
          })

          res.send(ret)
        })


    });


    this.api.post('/notes', function (req, res) {

      var paths = req.body.path;
      var text = req.body.text;

      if(paths.length < 2){
        res.status(500).send('At least 2 points in a path are required');
        return;
      }

      if(!text){
        res.status(500).send('Text is missing');
        return;
      }

      // TODO value testing
      var q = [];
      for(var i=0;i<paths.length;i++){
        q.push('{'+paths[i].x+','+paths[i].y+','+Math.round(paths[i].time)+'}');
      }

      // Get the last entry by the IP
      query('SELECT notes.id, time_begin, time_end, note, path, timestamp ' +
        'FROM "notes" ' +
        'WHERE ip = $1 ' +
        'ORDER BY id desc ' +
        'LIMIT 1;',
        [req.ip], function(err, ret){
          if(err ){
            res.status(500).send('Could not select notes');
            console.log(err);
            return;
          }
          if(ret.length > 0){
            if(ret.time_begin == Math.round(paths[0].time) &&  ret.time_end ==  Math.round(paths[paths.length-1].time)){
              res.status(500).send('Duplicate entry');
              return;
            }
          }

          query('SELECT count(*) as count ' +
            'FROM "notes" ' +
            'WHERE ip = $1 ' +
            'AND timestamp > (now() - interval \'10 minute\');',
            [req.ip], function(err, ret){
              if(err ){
                res.status(500).send('Could not select notes');
                console.log(err);
                return;
              }
              if(ret.length > 0 && ret[0].count > 15){
                res.status(500).send('Note add rate limit');
                return;
              }

              request('http://www.wdyl.com/profanity?q='+text, function(err, profanityTest){
                var profanity = false;
                try {
                  var p = JSON.parse(profanityTest.body);
                  profanity = (p.response != "false");
                } catch(e){};

                if(profanity){
                  console.log(profanityTest.body, text);
                  res.status(500).send('Note contains profanity');
                  return;
                }

                query('INSERT INTO "public"."notes" ("time_begin", "time_end", "note", "ip", "timestamp", "path") VALUES ($1, $2, $3, $4, now(), $5) RETURNING id',
                  [
                    Math.round(paths[0].time),
                    Math.round(paths[paths.length-1].time),
                    text,
                    req.ip,
                    "{"+ q.join(",")+"}"
                  ], function(err, ret) {

                    if(err || ret.length == 0){
                      res.status(500).send('Could not submit note');
                      console.log(err);
                      return;
                    }

                    var note_id = ret[0].id;
                    res.send({id:note_id});
                  })
              })
            }
          );
        })



      /*      query('INSERT INTO "public"."notes" ("time_begin", "time_end", "note", "ip", "timestamp") VALUES ($1, $2, $3, $4, now()) RETURNING id',
       [
       Math.round(paths[0].time),
       Math.round(paths[paths.length-1].time),
       "test",
       req.ip
       ], function(err, ret){

       if(err || ret.length == 0){
       res.status(500).send('Could not submit note');
       console.log(err);
       return;
       }

       var note_id = ret[0].id;

       var q = '';
       for(var i=0;i<paths.length;i++){
       q += 'INSERT INTO "public"."paths" ("coordinate", "time", "note_id") VALUES (point('+paths[i].x+','+paths[i].y+') ,'+paths[i].time+','+note_id+');'
       }

       query(q, function(err, ret){
       if(err){
       res.status(500).send('Could not submit note path');
       console.log(err);
       return;
       }

       res.send({id:note_id});

       });

       });*/


    })

  }

};