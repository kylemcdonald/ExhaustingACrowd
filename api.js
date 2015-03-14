var query = require('pg-query');
var express = require('express');

query.connectionParameters = process.env.DATABASE_URL;


module.exports = {
  setup: function(){
    this.api = express();
//    this.api.set('port', (process.env.PORT || 5000));
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
    })

  }

};