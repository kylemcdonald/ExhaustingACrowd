var express = require('express');
var sassMiddleware = require('node-sass-middleware');

var path = require('path');
var raven = require('raven');


var client = new raven.Client('https://edf1ff6b26ca41b0a9bbb280902b8c4e:e709b93edcdf49aabf54f637c90bf6b0@app.getsentry.com/41348');
client.patchGlobal();

// Setup api app
var api = require('./api');
api.setup();

// Setup express app
var app = express();

app.set('port', (process.env.PORT || 5000));

// adding the sass middleware
app.use(sassMiddleware({
  src: path.join(__dirname,'sass'),
  dest: path.join(__dirname, 'public'),
  debug: false,
  outputStyle: 'compressed'
}));

app.use(raven.middleware.express('https://edf1ff6b26ca41b0a9bbb280902b8c4e:e709b93edcdf49aabf54f637c90bf6b0@app.getsentry.com/41348'));

app.use(express.static(__dirname + '/public'));


// Host the api on /api
app.use('/api', api.api);


app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});
