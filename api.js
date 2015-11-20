var boring = require('./boring');
var query = require('pg-query');
var express = require('express');
var bodyParser = require("body-parser");
var request = require('request');

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
      "hidden" boolean,\
      "site" int NOT NULL DEFAULT 0, \
      PRIMARY KEY ("id"));')
      }
    });

    query("SELECT * FROM information_schema.tables where table_name = 'blacklist'", function(rows, ret){
      if(ret.length == 0){
        query('CREATE TABLE "public"."blacklist" (\
      "ip" cidr,\
      PRIMARY KEY ("ip"));')
      }
    });

    this.api.get('/notes/count', function (req, res) {
      var site = req.query.site || 0;
      query('SELECT count(*) FROM notes ' +
        'where site = $1', [site], function(err, ret){
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

    this.api.get('/regex', function (req, res) {
      res.json({
        all: boring.getRegex(),
        psql: boring.getPsqlRegex(),
        parts: boring.getRegexes()
      });
    })

    this.api.get('/clean', function (req, res) {
      console.log('Cleaning: marking all boring content in database hidden.');
      var psqlRegex = boring.getPsqlRegex();
      query('update notes set hidden = true where hidden is null and lower(note) ~ $1 returning note',
        [psqlRegex], function(err, ret) {
          if(err){
            res.status(500).send('Could not select notes');
            console.log(err);
            return;
          }
          res.send(ret.map(function(result) {
            console.log("Done cleaning");
            return result.note;
          }));
      })
    })

    this.api.get('/notes/recent/hidden', function (req, res) {
      var limit = Math.min((req.query.limit || 250), 1000);
      var site = req.query.site || 0;
      query('select note from notes where hidden = true and site = $1 order by timestamp desc limit $2',
        [site, limit], function(err, ret) {
          if(err){
            res.status(500).send('Could not select notes');
            console.log(err);
            return;
          }
          res.send(ret.map(function(result) {
            return result.note;
          }));
        })
    })

    this.api.get('/notes/recent/visible', function (req, res) {
      var limit = Math.min((req.query.limit || 250), 1000);
      var site = req.query.site || 0;
      query('select note from notes where hidden is null and site = $1 order by timestamp desc limit $2',
        [site, limit], function(err, ret) {
          if(err){
            res.status(500).send('Could not select notes');
            console.log(err);
            return;
          }
          res.send(ret.map(function(result) {
            return result.note;
          }));
        })
    })

    this.api.get('/notes', function (req, res) {
      var startTime = Math.round(req.query.timeframeStart);
      var endTime = Math.round(req.query.timeframeEnd);
      var ip = req.query.ip || req.ip;
      var site = req.query.site || 0;
      query(
        'select id, time_begin, time_end, note, path ' +
        'from notes ' +
        'where time_end >= $1 ' +
        'and time_begin <= $2 ' +
        'and site = $3 ' +
        'and ( ' +
          'ip = $4 ' +
          'or not ( ' +
            'hidden is true ' +
            'or ( ' +
              'hidden is null ' +
              'and exists( ' +
                'select 1 ' +
                'from blacklist ' +
                'where ip = notes.ip)))) ' +
        'limit 100',
        [startTime, endTime, site, ip], function(err, ret){
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

          res.send(ret)
        })

    });


    this.api.post('/notes', function (req, res) {

      var paths = req.body.path;
      var text = req.body.text;
      var site = req.body.site;

      if(paths.length < 2){
        res.status(500).send('At least 2 points in a path are required');
        return;
      }

      if(!text){
        res.status(500).send('Text is missing');
        return;
      }

      if(site === undefined){
        res.status(500).send('Site is missing');
        return;
      }

      if(text.length > 140) {
        text = text.substr(0, 140);
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

              var hidden = boring.check(text);
              query('INSERT INTO "public"."notes" ("time_begin", "time_end", "note", "ip", "timestamp", "path", "hidden", "site") VALUES ($1, $2, $3, $4, now(), $5, $6, $7) RETURNING id',
                [
                  Math.round(paths[0].time),
                  Math.round(paths[paths.length-1].time),
                  text,
                  req.ip,
                  "{"+ q.join(",")+"}",
                  hidden ? true : null,
                  site
                ], function(err, ret) {

                  if(err || ret.length == 0){
                    res.status(500).send('Could not submit note');
                    console.log(err);
                    return;
                  }

                  var note_id = ret[0].id;
                  res.send({id:note_id});
                })
            }
          );
        });
    })

  }

};