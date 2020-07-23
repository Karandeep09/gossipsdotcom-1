var PORT = process.env.PORT || 3000; 
var express = require("express");
var app = express(); // express app which is used boilerplate for HTTP
var http = require("http").Server(app);


var moment = require("moment");
var music = {'tabla' : 'tabla.mp3',
             'flute' :'https://fsa.zobj.net/download/bsbkyc23fQx26Sfp6RPCeQUhZezFvYmoOApa6kCX_1O3EJXREMYo2uEKB7SoR828ptgClHCM6nCrs4ybyMKsPkPEDqBrEPz7sJ6LgXAyYR06Tqa_9ZQqdyPrsSVs/?a=web&c=72&f=flute_classic.mp3&special=1595502341-M7eGxez3w3sVLv1uCIFXY7Tk4CmW7x8aZiUqJ2h7z7w%3D',
             'piano' : 'https://fsa.zobj.net/download/bFiYKEtCtgGCe_v3UDKlDbPajfkS9xKVwAk2c--BtRZ5lFMhqt8WsrOwxsupU9vhdRz7hOenEyp5pFvqOPeHiBKyDKtEZ5cs-dG_rvKrn640jZqHmUAtOkdl4ims/?a=web&c=72&f=piano.mp3&special=1595502690-VN%2FuQQZ8X8gGmu5roFbPGE2H7GooBrt5eWOFeeq2xPc%3D',          
             'guitar' : 'https://fsa.zobj.net/download/b7b0Utabo40-NklnniTt2SlrNUTtuawgKBka5IBCG-oJTxveCREZSNWLfFMWwaDhslI2XApbvDSRbx28v2QP7koJpkcUOf_MUthYupAZtwDB2d9JNDe806wGRuu0/?a=web&c=72&f=guitar.mp3&special=1595502992-f5vOT1LfgQb%2BHXn5O7jYzmGgdcBG0cy0K530sPtImSM%3D',
             'dhol' : 'https://fsa.zobj.net/download/btL--45VINmF68lh3PonmdXmERLXi7ENUYomQxKjDTvS35xFanBOf0jB-zfGI7LvdRub80TmalvuARnmWc5kfI_yjlSO3hjfDZuMt_925Z6WBa8jYEtXjkZ-nuQ8/?a=web&c=72&f=dhol.mp3&special=1595503224-CwCMBvyX0G0ZpYBAvvSaCh7H%2F0sWJvl8VJbbXPO9cEk%3D',
             'sitar' : 'https://fsa.zobj.net/download/bo37A-8yOvmt8jKvVJGUqlUj22J_Pzo5Zz1VXxft8C48bhmRF7XUjvWHndDnOuelPInGyx3hX-Lid8UOyKF1BD97R-Hhe13ozWL6Pb9K0q-sXKOz0TUCAEnQ-0Nk/?a=web&c=72&f=sitar.mp3&special=1595503284-KFy1hQ8CQCsD4HVBqCln%2FmQvY%2Ftu8kRuh1xqbVd4m1E%3D'
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
