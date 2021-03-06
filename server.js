var PORT = process.env.PORT || 3000; 
var express = require("express");
var app = express(); // express app which is used boilerplate for HTTP
var http = require("http").Server(app);


var moment = require("moment");
var music = {'tabla' : 'sound/tabla.mp3',
             'flute' : 'sound/flute_classic.mp3',
             'piano' : 'sound/piano.mp3',          
             'guitar' : 'sound/guitar.mp3',
             'dhol' : 'sound/dhol.mp3',
             'sitar' : 'sound/sitar.mp3'
            };
//
//console.log(music);
var clientInfo = {};

//socket io module
var io = require("socket.io")(http);


app.use(express.static(__dirname + '/public'));

// send current users to provided scoket
function sendCurrentUsers(socket) { // loading current users
  var info = clientInfo[socket.id];
  var users = [];
  if (typeof info === 'undefined') {
    return;
  }
  // filte name based on rooms
  Object.keys(clientInfo).forEach(function(socketId) {
    var userinfo = clientInfo[socketId];
    // check if user room and selcted room same or not
    // as user should see names in only his chat room
    if (info.room == userinfo.room) {
      users.push(userinfo.name);
    }

  });
 

  socket.emit("message", {
    name: "Natasha",
    text: "Current Users : " + users.join(', '),
    timestamp: moment().valueOf()
  });

}


// io.on listens for events
io.on("connection", function(socket) {
  console.log("User is connected");

  //for disconnection
  socket.on("disconnect", function() {
    var userdata = clientInfo[socket.id];
    if (typeof(userdata !== undefined)) {
      socket.leave(userdata.room); 
      socket.broadcast.to(userdata.room).emit("message", {
        text: userdata.name + " has left",
        name: "Natasha",
        timestamp: moment().valueOf()
      });

      // delete user data-
      delete clientInfo[socket.id];

    }
  });

  // for private chat
  socket.on('joinRoom', function(req) {
    clientInfo[socket.id] = req;
    socket.join(req.room);
    //broadcast new user joined room
    socket.broadcast.to(req.room).emit("message", {
      name: "Natasha",
      text: req.name + ' has joined',
      timestamp: moment().valueOf()
    });

  });

  // to show who is typing Message

  socket.on('typing', function(message) { 
    socket.broadcast.to(clientInfo[socket.id].room).emit("typing", message);
  });

  // to check if user seen Message
  socket.on("userSeen", function(msg) {
    socket.broadcast.to(clientInfo[socket.id].room).emit("userSeen", msg);
    //socket.emit("message", msg);

  });

  socket.emit("message", {
    text: "Welcome to Gossip-Dot-Com !",
    timestamp: moment().valueOf(),
    name: "Natasha"
  });

  
  socket.on("message", function(message) {
    console.log("Message Received : " + message.text);
    // to show all current users
    var str = message.text;
    str = str.toLowerCase();
    var args = str.split(" ");
    if(args[0]=="play") 
    { p = music[args[1]];
      if(p) 
      { console.log(p); 
        var data = {url:p};
       // socket.to(clientInfo[socket.id].room).emit('music',data);
        io.in(clientInfo[socket.id].room).emit('music',data);
      }
    } console.log("args",args);
    if(args[0]=="pause")
    {
      io.in(clientInfo[socket.id].room).emit('pause',{});
      
    }
    if (message.text === "@currentUsers") {
      sendCurrentUsers(socket);
    } else {
      //broadcast to all users except for sender
      message.timestamp = moment().valueOf();
      
      // now message should be only sent to users who are in same room
      socket.broadcast.to(clientInfo[socket.id].room).emit("message", message);
      
    }

  });
});
http.listen(PORT, function() {
  console.log("server started");
});
