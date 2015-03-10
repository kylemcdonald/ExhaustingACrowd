var express = require('express');
var app = express();
var sassMiddleware = require('node-sass-middleware');
var path = require('path');

app.set('port', (process.env.PORT || 5000));

// adding the sass middleware
app.use(sassMiddleware({
  src: path.join(__dirname,'sass'),
  dest: path.join(__dirname, 'public'),
  debug: false,
  outputStyle: 'compressed'
}));

app.use(express.static(__dirname + '/public'));


app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
