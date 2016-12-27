
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
  },
  frameRate:3,
  easing: .1,
  closeEnough: .1
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
var playerThings = {action: {}};
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

    if (data['userName'] != 'fails') {
      var uuid = UUID();
      players[uuid] = new Player(data['userName'], 'default');
      players[uuid]['socket_id'] = socket.id;
      players[uuid]['id'] = uuid;
      playerThings.action[uuid] = new Action(players[uuid]);

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

  setInterval(doGame , 1000/settings.frameRate);

  function doGame() {
    // do all collisions and stuff
    // doPhysics();
    // update all
    doTack();
  }


  socket.on('action', function (actionParams) {

    var currentAction = actionParams.action;
    var params = actionParams.params;

    var action = playerThings.action[actionParams.playerId];

    players[actionParams.playerId] = action.do(currentAction, params);

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

    io.sockets.emit('playerLeft', 
      {players: players}
    );
  });

});

// update all eaters with new happenings
function doTack() {

    for (var playerId in players) {
      players[playerId] = playerThings.action[playerId].doAction();
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
        this.player.curveP1 = {x:0, y:0};

        // do this action
        this[action](params);

        //check if eater breaking any limits, reset it
        this.checkLimit();
        return this.player;
      } else {
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

      if (this.isMoving) {
        if (this.isCurving) {
          var oldmouse = this.mouse;
          this.stopMoving();
          this.mouse = oldmouse;
          this.isMoving = true;
        }
        this.isCurving = true;

        this.controlPoint1 = this.mouse;
        this.mouse = params.mouse;
        this.start = {x:this.player.x, y: this.player.y};

        this.player.curveP1 = this.player.mouse;
        this.player.mouse = params.mouse;

      } else {

        this.isMoving = true;


        this.player.mouse = params.mouse;
        this.mouse = params.mouse;
        this.start = {x:this.player.x, y: this.player.y};
      }
    };
    this.isMoving = false;
    this.isCurving = false;
    this.currentStep = 1;
    this.nextStep = {x:0, y:0};
    this.start = {x:0, y:0};
    this.controlPoint1 = {x:0, y:0};
    this.controlPoint1 = {x:0, y:0};
    this.mouse = {x:0, y:0};
    this.steps = {};
    this.stopMoving = function () {
        this.isMoving = false;
        this.isCurving = false;
        this.currentStep = 1;
        this.steps = {};
        this.nextStep = {x:0, y:0};
        this.start = {x:0, y:0};
        this.controlPoint1 = {x:0, y:0};
        this.controlPoint1 = {x:0, y:0};
        this.mouse = {x:0, y:0};
        this.isMoving = false;
        this.isCurving = false;
    };
    this.doAction = function() {
      this.start = {x:this.player.x, y:this.player.y};

      if (this.isMoving) {
        if (this.isCurving) {
            this.nextStep = this.curveto(this.start, this.controlPoint1, this.mouse);
            this.currentStep += 1;
          } else {
            this.nextStep = this.getNextStep(this.start, this.mouse);
          }
// console.log(Object.keys(this.steps).length +':-------------------: ' + this.currentStep);
          //Update player posisiton or more
          this.player.x = this.nextStep.x;
          this.player.y = this.nextStep.y;

          if (this.isCloseEnough(0, 0)) {
console.log('Stop it, stay there!');
            this.stopMoving();
          }

      }
      return this.player;
    };
    this.isCloseEnough = function (point1, point2) {
      if (point1 + point2 === 0) {
        point1 = this.start;
        point2 = this.mouse;
      }
      return (Math.abs(point1.x - point2.x) < settings.closeEnough) 
      && (Math.abs(point1.x - point2.x) < settings.closeEnough);
    };
    this.getNextStep = function (start, end) {
      return {
        x: start.x + (end.x - start.x) * settings.easing,
        y: start.y + (end.y - start.y) * settings.easing
      };
    };
    this.curveto = function (start, controlPoint1, target) {

      if (!Object.keys(this.steps).length) {

        this.setCurveSteps(start, controlPoint1, target);
      }

      if (Object.keys(this.steps).length) {

        return this.steps[this.currentStep];
      }
    };
    this.setCurveSteps = function (start, controlPoint1, target) {
      var p1 = start;
      var cp = controlPoint1;
      var p2 = target;
      var p3, p4 = {};
      // var i=1;
      // while (!this.isCloseEnough(p1, p2))
      // {
      for (var i=1; i<100; i++) {
        p3 = this.getNextStep(p1, cp);
        p4 = this.getNextStep(cp, p2);
        
        p1 = this.steps[i] = this.getNextStep(p3, p4);
        cp = p4;
        if (this.isCloseEnough(0, 0)) {
          break;
        }
        // i++;
      }
    };
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