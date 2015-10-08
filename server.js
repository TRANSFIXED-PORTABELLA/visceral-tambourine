var http    = require('http'),
    express = require('express'),
    app     = express(),
    server  = http.Server(app),
    io      = require('socket.io')(server);

app.use(express.static(__dirname + '/public'));


app.get('/', function (req, res) {
  res.sendStatus(200);
});

var eventState = {};
var eventList = [];
var insiderToEventMap = {};

io.on('connection', function (socket) {
  console.log('starting connect on socket', socket.id);
  //triggered when the join button on landing.html is clicked
  socket.on('join', function (event) {
    console.log('joining event', event);
    var successful = false;
    //server side socket will join the event passed in
    eventList.forEach(function(item) {
      if (item === event) {
        socket.join(event);
        insiderToEventMap[socket.id] = event;
        successful = true;
        return;
      }
    });
    socket.emit('success', successful);
    console.log('success will be', successful);
  });

  //triggered when someone enters the event
  socket.on('joined', function () {
    console.log('joined the room! yay!', socket.id);
    //send the state of the event to the client
    socket.emit('roomJoined', eventState[insiderToEventMap[socket.id]]);
  });

  //triggered when the create button is clicked on create.html
  socket.on('create', function (event) {
    //server side socket joins the event that is passed in
    if (eventList.indexOf(event) === -1) {
      socket.join(event);
      //push the event to the events list
      eventList.push(event);
      //create a prop on eventState object with name of the event. Init w/ empty array
      eventState[event] = [];
      //map socket id to event
      insiderToEventMap[socket.id] = event;
      socket.emit('createable', true);
      return;
    }

    socket.emit('createable', false);
  });
  //triggered when someone clicks add in search.html
  socket.on('addSong', function (song) {
    console.log(song);
    //add the song to the event state for the event of the socket
    eventState[insiderToEventMap[socket.id]].push(song);
    //broadcast to all insiders the added song
    io.to(insiderToEventMap[socket.id]).emit('songAdded', song);
  });
  socket.on('removeSong', function (songID) {
    eventState[insiderToEventMap[socket.id]].forEach(function(song, index) {
      if (song.id === songID) {
        eventState[insiderToEventMap[socket.id]].splice(index, 1);
        io.to(insiderToEventMap[socket.id]).emit('songRemoved', song);
      }
    });
  });
  socket.on('upVote', function (songID) {
    eventState[insiderToEventMap[socket.id]].forEach(function (song, index) {
      if (song.id === songID) {
        song.votes++;
        io.to(insiderToEventMap[socket.id]).emit('voted', song);
      }
    });
  });
});

var port = process.env.PORT || 3030;
server.listen(port, function() {
  console.log('Listening on ' + port);
});
