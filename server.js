
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


    // var pal = players.filter(function(elm){ return true});
    // console.log(pal); 
    var currentAction = actionParams.action;
    var params = actionParams.params;

    console.log( currentAction);
    // console.log(players[actionParams.playerId]);

    var action = new Action(players[actionParams.playerId]);
// console.log('here----->', players[actionParams.playerId]);
    players[actionParams.playerId] = action.do(currentAction, params);
// console.log('here----->', players[actionParams.playerId]);
    // doTack();
    // players[actionParams.playerId].up();
    delete action;
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

// update all eaters with new happenings
function doTack() {

    for (var playerId in players) {

        players[playerId] = doPlayerAction(players[playerId]);
    }

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

// player object handels all the things about players
function Player(name, style) {
    this.name = name;
    this.x = Math.floor(Math.random() * 200) + 10;
    this.y = Math.floor(Math.random() * 200) + 10;
    this.rad = settings.player.rad;
    this.color = "#" + ((1 << 24) * Math.random() | 0).toString(16);
    this.originalColor = this.color;
    this.mouse = {x:0, y:0};
    this.curveP1 = {x:0, y:0};
    // this.move =  move;
    // function move (move, cxt){};
    // var skin = document.createElement('img');
    // skin.src = '/img/player.png';
 
    // this.skin=skin;
    // var player = this;
}

// all the action that eaters can request
function Action(player) {
    this.player = player;
    this.do = function (action, params) {
      if (typeof this[action] === 'function') {
        
        //clear previous action stuff
        this.player.mouse = {x:0, y:0};

        // do this action
        this[action](params);
console.log( '----------->',action , params);

        //check if eater breaking any limits, reset it
        this.checkLimit();
        return this.player;
      } else {
        // console.log('"' + action + '" is not valid action');
        return this.player;
      }
    }
    this.up = function (params) {
      this.player.y -= 10;
    };
    this.down = function (params) {
      this.player.y += 10;
    };
    this.right = function (params) {
      this.player.x += 10;
    };
    this.left = function (params) {
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
    this.gotoMouse = function (params) {

    if (this.player.mouse.x > 0 || this.player.mouse.y > 0) {
      this.player.curveP1 = this.player.mouse;
      this.player.mouse = params.mouse;
    } else {
      this.player.mouse = params.mouse;
    }

      // console.log(params, this.player.mouse);
      // this.player.x = params.mouse.x;
      // this.player.y = params.mouse.y;
    }
// this.player.y= 200;
// this.player.x = 300;
// console.log('------>', this.player);
//     players[this.player.id] = this.player;

    // doTack();
}

function doPlayerAction(player) {
  var easing = .04;
  var closeEnough = .1;
  var nextStep = {x:0, y:0};
// console.log('->>>>>>>>>>>>>', player.mouse.x, player.x);
    if (player.mouse.x != 0 || player.mouse.y != 0) {
      // player.x = player.mouse.x;
      // player.y = player.mouse.y;

      // if (player.curveP1.x > 0 || player.curveP1.y > 0) {
      //   nextStep = curveToStep(player, player.curveP1, player.mouse, easing);        
      // } else {
        nextStep = getNextStep(player, player.mouse, easing);

      // }


console.log(nextStep);
      player.x = nextStep.x;
      player.y = nextStep.y;
      // var diff = (Math.abs(player.x - nextStep.x) + Math.abs(player.y - nextStep.y));
// console.log(Math.abs(player.x - player.mouse.x), Math.abs(player.y - player.mouse.y));      
      if (
          Math.abs(player.x - player.mouse.x) < closeEnough 
          && Math.abs(player.y - player.mouse.y) < closeEnough
        ) {
        player.mouse = {x:0, y:0};
      }
    }

  return player;
}

/**
 * get next step moving straight from p1 to p2
 *
 * p1 Object point 1, x y position
 * p2 Object point 2, x y position
 * e int easing 0 to 1
 */
function getNextStep(p1, p2, e) {
  var pt1 = 0;

  var x = p1.x;
  var y = p1.y;

  x = p1.x + (p2.x - p1.x) * e;
  y = p1.y + (p2.y - p1.y) * e;

  return { x: x, y: y };
}

/**
 * Get next step moving on curve between p1, p2 and p3
 *
 * p1 Object point 1, x y position
 * p2 Object point 2, x y position
 * p3 Object point 2, x y position
 * e int easing 0 to 1
 */
function curveToStep(p1, p2, p3, e) {
  var p4 = getNextStep(p1, p2, e);
  var p5 = getNextStep(p2, p3, e);
  
  var cp = getNextStep(p4, p5, e);

  return cp;
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