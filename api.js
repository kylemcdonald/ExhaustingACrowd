var query = require('pg-query');
var express = require('express');
var bodyParser = require("body-parser");

query.connectionParameters = process.env.DATABASE_URL;


module.exports = {
  setup: function(){
    this.api = express();
    this.api.use(bodyParser.json());
    this.api.enable('trust proxy')

    query("SELECT * FROM information_schema.tables where table_name = 'paths'", function(rows, ret){
      if(ret.length == 0){
        query('CREATE TABLE "public"."paths" (\
    "id" serial,\
      "coordinate" point,\
      "time" int,\
      "note_id" int,\
      PRIMARY KEY ("id"));')
      }
    });

    query("SELECT * FROM information_schema.tables where table_name = 'notes'", function(rows, ret){
      if(ret.length == 0){
        query('CREATE TABLE "public"."notes" (\
    "id" serial,\
      "time_begin" int,\
      "time_end" int,\
      "note" text,\
      "ip" cidr,\
      "timestamp" timestamp,\
      PRIMARY KEY ("id"));')
      }
    });

    this.api.get('/notes', function (req, res) {
      var notes = [
        {
          id: 1,
          position: {
            x: 0.3,
            y: 0.5
          },
          note: 'blahblah blaaah'
        }
      ];
      res.send(notes);
    });


    this.api.post('/notes', function (req, res) {

      var paths = req.body.path;

      if(paths.length < 2){
        res.status(500).send('At least 2 points in a path are required');
        return;
      }

      // TODO value testing

      query('INSERT INTO "public"."notes" ("time_begin", "time_end", "note", "ip", "timestamp") VALUES ($1, $2, $3, $4, now()) RETURNING id',
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

        });


    })

  }

};