
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , parties = require('./routes/parties')
  , http = require('http')
  , path = require('path');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('stylus').middleware(__dirname + '/public'));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('/', routes.index);
app.get('/users', user.list);

app.post('/api/add_party', parties.add);
app.delete('/api/end_party/:id', parties.end);

app.post('/api/join_party', parties.join);
app.post('/api/leave_party', parties.leave);
app.post('/api/request_songs', parties.request);
app.post('/api/update_now_playing', parties.nowPlaying);

app.get('/api/get_all_parties', parties.getAllParties);
app.get('/api/find_nearby', parties.findNearby);
app.get('/api/find_by_name', parties.findByName);
app.get('/api/get_requests/:id', parties.getRequests);
app.get('/api/now_playing/:id', parties.getNowPlaying);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
