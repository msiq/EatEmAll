
// set some settings
var settings  = {
  gameport: 4444,
  canvas: {
    width: 600,
    height: 300
  },
  dots: {
    minRad:15,
    maxRad:25
  },
  player: {
    fps:30,
    speed:2,
    ease:0.1,
    rad:20,
    turn:2,
  }
};
var dots = addFood();

// here we start
var app = require('express')();
// app.use(function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "X-Requested-With");
//     res.header("Access-Control-Allow-Headers", "Content-Type");
//     res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
//     next();
// });
var http = require('http').Server(app);
var io = require('socket.io')(http);
var UUID = require('node-uuid');
require('./js/game.js');

var players = {};
var numberOfEaters = 0;

app.get('/', function (req, res) {
	// console.log(req);
  res.sendFile(__dirname + "/eatemall.html");
});
app.get('/*', function (req, res) {
  res.sendFile(__dirname + '/' + req.params[0]);
});

console.log(settings.gameport);
http.listen(port = settings.gameport, function() {
	console.log('listening on : ' + port);
});

io.on('connection', function (socket) {
console.log("connection established!");
  
  socket.on('letmeeat', function (data) {
console.log(data);
    if (data['userName'] != 'fails') {
      var uuid = UUID();
      players[uuid] = new Player(data['userName'], 'default');
      players[uuid]['socket_id'] = socket.id;
      players[uuid]['id'] = uuid;


      socket.emit('okeat',
        {
          id: uuid,
          players: players,
          dots: dots,
          settings: settings.canvas,
          success: true
        }
      );
      numberOfEaters +=1;

      //send new players to all players
      io.sockets.emit('playerJoined', 
        {player: players[uuid]}
      );
    } else {

      socket.emit('goaway');
    }

    console.log(data['userName'] + ' is eating now!');
  });

  socket.on('tick', function (data) {
    // console.log(players);
    players = data.players;
    dots = data.dots;

    // send update to eveyone eating now
    // doTack();
    // console.log(players);
  });

  setInterval(doGame , 1000/10);

  function doGame() {
    // do all collisions and stuff
    // doPhysics();
    // update all
    doTack();
  }


  socket.on('action', function (actionParams) {
    // console.log(actionParams, players);
    var correntAction = actionParams.action;

    // var pal = players.filter(function(elm){ return true});
    // console.log(pal); 

    // console.log( correntAction);
    // console.log(players[actionParams.playerId]);
    var actions = new Actions(players[actionParams.playerId]);
    players[actionParams.playerId] = actions.do(correntAction);
    // doTack();
    // players[actionParams.playerId].up();
  });


  socket.on('disconnect', function () {
    var stoppedEating = findBySocket(players, socket.id);
    console.log('bye '+ stoppedEating +'...');

    // io.sockets.emit('playerLeft', 
    //   {players: players}
    // );
// console.log('before >'+ Object.keys(players).length);
    delete players[stoppedEating];
// console.log('after >' + Object.keys(players).length);

      io.sockets.emit('playerLeft', 
       {players: players}
     );
  });

});
function doTack() {
  io.sockets.emit('tack', {players: players, dots: dots});
}

function findBySocket(players, socketId) {  
  for (playerId in players) {
    if (players[playerId].socket_id == socketId) {

      return playerId;
    }
  }

  return false;
}

function Player(name, style) {
    this.name = name;
    this.x = Math.floor(Math.random() * 200) + 10;
    this.y = Math.floor(Math.random() * 200) + 10;
    this.rad = settings.player.rad;
    this.color = "#" + ((1 << 24) * Math.random() | 0).toString(16);
    this.originalColor = this.color;
    // this.move =  move;
    // function move (move, cxt){};
    // var skin = document.createElement('img');
    // skin.src = '/img/player.png';
 
    // this.skin=skin;
    // var player = this;
}

function Actions(player) {
    this.player = player;
// console.log('--->',this.player);
    this.do = function (action) {
      if (typeof this[action] === 'function') {
        this[action]();
console.log(this.player);
      this.checkLimit();
console.log(this.player);
        return this.player;
      } else {
        // console.log('"' + action + '" is not valid action');
        return this.player;
      }
    }
    this.up = function () {
      this.player.y -= 10;
    };
    this.down = function () {
      this.player.y += 10;
    };
    this.right = function () {
      this.player.x += 10;
    };
    this.left = function () {
      this.player.x -= 10;
    };
    this.checkLimit = function () {
      if (this.player.x >= settings.canvas.width - this.player.rad) {
        this.player.x = settings.canvas.width - this.player.rad;
      }
      if (this.player.x <= this.player.rad) {
        this.player.x =  this.player.rad;
      }
      if (this.player.y >= settings.canvas.height - this.player.rad) {
        this.player.y = settings.canvas.height - this.player.rad;
      }
      if (this.player.y <= this.player.rad) {
        this.player.y = this.player.rad;
      }
    };
// this.player.y= 200;
// this.player.x = 300;
// console.log('------>', this.player);
//     players[this.player.id] = this.player;

    // doTack();
}


function addFood() {
    var minRad = settings.dots.minRad;
    var maxRad = settings.dots.maxRad;
    var canvas = settings.canvas;
    var dots = [];
    var bites =  20;
    var startCrl = 20;//parseInt(bites+Math.random()*bites);
    startCrl = startCrl?startCrl:2;
    for (var i=0;i<startCrl; i++) {
        var thisRad = parseInt(Math.random()*(minRad-maxRad + 1) + minRad);
        var crlX = Math.floor(Math.random() * (canvas.width-thisRad*2 - thisRad*2 + 1)) + thisRad*2;
        var crlY = Math.floor(Math.random() * (canvas.height-thisRad*2 - thisRad*2 + 1)) + thisRad*2;

        var allcolors = {};
        var newColor = ((1<<24)*Math.random()|0).toString(16);
        var dot = {
            x: crlX,
            y: crlY,
            rad:thisRad,
            color:"#"+((1<<24)*Math.random()|0).toString(16)
        };

        dots.push(dot);
   }

   return dots;
}