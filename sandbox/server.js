var http    = require('http'),
    express = require('express'),
    app     = express(),
    server  = http.Server(app),
    io      = require('socket.io')(server);

app.use(express.static(__dirname));


app.get('/', function (req, res) {
  res.sendStatus(200);
});



var eventState = {};
var eventList = [];
var insiderToEventMap = {};

io.on('connection', function (socket) {
  //triggered when the join button on landing.html is clicked
  socket.on('join', function (event) {
    //server side socket will join the event passed in
    socket.join(event);
    //map the socket id to the event
    insiderToEventMap[socket.id] = event;
  });

  //triggered when someone enters the event
  socket.on('joined', function () {
    //send the state of the event to the client
    socket.emit('joined', eventState[insiderToEventMap[socket.id]]);
  });

  //triggered when the create button is clicked on create.html
  socket.on('create', function (event) {
    //server side socket joins the event that is passed in
    socket.join(event);
    //push the event to the events list
    eventList.push(event);
    //create a prop on eventState object with name of the event. Init w/ empty array
    eventState[event] = [];
    //map socket id to event
    insiderToEventMap[socket.id] = event;
  });
  //triggered when someone clicks add in search.html
  socket.on('addSong', function (song) {
    console.log(song);
    //add the song to the event state for the event of the socket
    eventState[insiderToEventMap[socket.id]].push(song);
    //broadcast to all insiders the added song
    io.to(insiderToEventMap[socket.id]).emit('songAdded', song);
  });
});

server.listen(3030);