var express = require('express'),
    app = express();
var server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    nicknames = [],
    users = {};

server.listen(3000);

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function (socket) {
   socket.on('new user', function (data, callback) {
      if(data in users) {
          callback(false);
      } else {
          callback(true);
          socket.nickname = data;
          users[socket.nickname] = socket;
          updateNicknames();
      }
   });

   function updateNicknames() {
      io.sockets.emit('usernames', Object.keys(users));
   }
   
   socket.on('send message', function (data, callback) {
       var msg = data.trim();
       if(msg.substr(0,1) === '@') {
           msg = msg.substr(1);
           var ind = msg.indexOf(' ');
           if(ind !== -1) {
               var name = msg.substring(0, ind);
               var msg = msg.substring(ind + 1);
               if(name in users) {
                    users[name].emit('whisper', {msg: msg, nick: socket.nickname});
               } else {
                   callback('Error! Enter a valid user.');
               }
               console.log('Whisper!');
               console.log(socket);
           } else {
                callback('Error! Please enter a message for your whisper.');
           }
       } else {
            io.sockets.emit('new message', {msg: msg, nick: socket.nickname});
       }
   });

   socket.on('disconnect', function (data) {
       if(!socket.nickname) return;
       delete users[socket.nickname];
       updateNicknames();
   })
});
