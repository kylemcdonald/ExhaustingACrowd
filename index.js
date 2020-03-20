var favicon = require('serve-favicon');
var MobileDetect = require('mobile-detect');
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

// Put everything behind a username / password if PASSWORD is set
if(process.env.PASSWORD) {
  var basicAuth = require('basic-auth');
  var auth = function (req, res, next) {
    function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      return res.sendStatus(401);
    };
    var user = basicAuth(req);
    if (!user || !user.name || !user.pass) {
      return unauthorized(res);
    };
    if (user.name === process.env.PASSWORD && user.pass === process.env.PASSWORD) {
      return next();
    } else {
      return unauthorized(res);
    };
  };
  app.use('/', auth);
}

app.set('port', (process.env.PORT || 5000));

app.use(favicon(__dirname + '/public/favicon.ico'));

// adding the sass middleware
app.use(sassMiddleware({
  src: path.join(__dirname,'sass'),
  dest: path.join(__dirname, 'public'),
  debug: false,
  outputStyle: 'compressed'
}));

app.use(raven.middleware.express('https://edf1ff6b26ca41b0a9bbb280902b8c4e:e709b93edcdf49aabf54f637c90bf6b0@app.getsentry.com/41348'));

// Add new locations here.
var sites = ['london', 'netherlands', 'birmingham', 'gwangju', 'beijing'];

function randomChoice(array) {
  return array[Math.floor(Math.random()*array.length)];
}

app.get('/', function(req, res) {
  // To redirect the main page during an exhibition, modify the next line.
  // var location = 'beijing';
  var location = randomChoice(sites);
  res.redirect('/' + location);
});

sites.forEach(function(site) {
  app.get('/' + site, function(req, res) {
    returnSite(req,res);
  });
});

app.use('/', express.static(__dirname + '/public'));

// Host the api on /api
app.use('/api', api.api);


app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});


function returnSite(req,res){
  md = new MobileDetect(req.headers['user-agent']);
  if(md.mobile()) {
    res.sendFile(__dirname + '/public/mobile.html');
  } else {
    res.sendFile(__dirname + '/public/index.html');
  }
}