var query = require('pg-query');
var express = require('express');

query.connectionParameters = process.env.DATABASE_URL;


module.exports = {
  setup: function(){
    this.api = express();
//    this.api.set('port', (process.env.PORT || 5000));
    this.api.get('/', function (req, res) {
      res.send('Admin Homepage');
    })

  }

};