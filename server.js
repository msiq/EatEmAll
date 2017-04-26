function GameState() {
    this.state = {};
    this.state.init = 1;
    this.state.booting = 2;
    this.state.mmenu = 3;
    this.state.pause = 3.1;
    this.state.helt = 3.2;
    this.state.stopped = 0;

    this.currentState = this.state.init;
}

gameState = new GameState();

function State() {
    this.state = {};
    this.state.dead = 0;
    this.state.init = 1;
    this.state.menu = 2;
    this.state.playing = 3;
    this.state.moving = 3.1;
    this.state.Going = 3.2;
    this.state.curving = 3.3;;
    this.state.pause = 4;
    this.state.killed = 5;

    this.currentState = this.state.init;
}

state = new State();

// set some settings
var settings = {
    gameport: 4444,
    canvas: {
        width: 600,
        height: 300
    },
    dots: {
        minRad: 15,
        maxRad: 25
    },
    player: {
        fps: 30,
        speed: 2,
        ease: 0.1,
        rad: 20,
        turn: 2,
    },
    allowPhysics: false,
    frameRate: 10,
    easing: .1,
    closeEnough: 1,
    gravity: { x: 0, y: 9.8 }, // m/s^2 default gravity for everything on earth, on moon it is .83 
    maxVelocity: { x: 20, y: 20 },
    state: gameState
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
//require('./js/game.js');

var players = {};
var playerThings = { action: {}, velocity: { x: 0, y: 0 }, mass: {} };
var numberOfEaters = 0;

app.get('/', function(req, res) {
    // console.log(req);
    res.sendFile(__dirname + "/eatemall.html");
});
app.get('/*', function(req, res) {
    res.sendFile(__dirname + '/' + req.params[0]);
});

console.log(settings.gameport);
http.listen(port = settings.gameport, function() {
    console.log('listening on : ' + port);
});

io.on('connection', function(socket) {
    console.log("connection established!");

    socket.on('letmeeat', function(data) {

        if (data['userName'] != 'fails') {
            var uuid = UUID();
            players[uuid] = new Player(data['userName'], 'default');
            players[uuid]['socket_id'] = socket.id;
            players[uuid]['id'] = uuid;
            playerThings.action[uuid] = new Action(players[uuid]);
            playerThings.velocity[uuid] = { x: 0, y: 0 }; //0 - 1
            playerThings.mass[uuid] = Math.floor(Math.random() * 6) + 1;
            socket.emit('okeat', {
                id: uuid,
                players: players,
                dots: dots,
                settings: settings.canvas,
                success: true
            });
            numberOfEaters += 1;

            //send new players to all players
            io.sockets.emit('playerJoined', { player: players[uuid] });
        } else {

            socket.emit('goaway');
        }

        console.log(data['userName'] + ' is eating now!');
    });

    socket.on('tick', function(data) {
        // console.log(players);
        players = data.players;
        dots = data.dots;

        // send update to eveyone eating now
        // doTack();
        // console.log(players);
    });

    setInterval(doGame, 1000 / settings.frameRate);

    function doGame() {
        // do all collisions and stuff
        for (var playerId in players) {
            // check coliisions with dots
            players[playerId] = collisionTest(players[playerId], dots);
            // check coliisions with players
            players[playerId] = playersCollisionTest(players[playerId], players);
        }


        // doPhysics();
        // update all
        doTack();
    }


    socket.on('action', function(actionParams) {

        var currentAction = actionParams.action;
        var params = actionParams.params;

        var action = playerThings.action[actionParams.playerId];

        players[actionParams.playerId] = action.do(currentAction, params);

        delete action;
    });


    socket.on('disconnect', function() {
        var stoppedEating = findBySocket(players, socket.id);
        console.log('bye ' + stoppedEating + '...');

        // io.sockets.emit('playerLeft', 
        //   {players: players}
        // );
        // console.log('before >'+ Object.keys(players).length);
        delete players[stoppedEating];

        io.sockets.emit('playerLeft', { players: players });
    });

});

// update all eaters with new happenings
function doTack() {

    for (var playerId in players) {
        players[playerId] = playerThings.action[playerId].doAction();
    }

    io.sockets.emit('tack', { players: players, dots: dots });
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
    this.state = state;
    this.name = name;
    this.x = Math.floor(Math.random() * 200) + 10;
    this.y = Math.floor(Math.random() * 200) + 10;
    this.rad = settings.player.rad;
    this.color = "#" + ((1 << 24) * Math.random() | 0).toString(16);
    this.originalColor = this.color;
    this.mouse = { x: 0, y: 0 };
    this.curveP1 = { x: 0, y: 0 };
    // function move (move, cxt){};
    // var skin = document.createElement('img');
    // skin.src = '/img/player.png';

    // this.skin=skin;
    // var player = this;
}

// all the action that eaters can request
function Action(player) {
    this.player = player;
    this.do = function(action, params) {
        if (typeof this[action] === 'function') {

            //clear previous action stuff
            this.player.curveP1 = { x: 0, y: 0 };

            // do this action
            this[action](params);

            //check if eater breaking any limits, reset it
            this.checkLimit();
            return this.player;
        } else {
            return this.player;
        }
    };
    this.startGoing = function(goFrom, goTowards) {
        this.going.x = goTowards.x - goFrom.x;
        this.going.y = goTowards.y - goFrom.y;
        this.goingAngle = Math.atan2(this.going.y, this.going.x);
        this.isGoing = true;
    };
    this.up = function(params) {
        // this.player.y -= 10;
        this.startGoing({ x: this.player.x, y: this.player.y }, { x: this.player.x, y: this.player.y - 10 });
        // this.going.x = this.player.x - this.player.x;
        // this.going.y = this.player.y-10 - this.player.y;
        // this.goingAngle = Math.atan2(this.going.y, this.going.x);

        // this.isGoing = true;
    };
    this.down = function(params) {
        // this.player.y += 10;
        this.startGoing({ x: this.player.x, y: this.player.y }, { x: this.player.x, y: this.player.y + 10 });
        // this.going.x = this.player.x - this.player.x;
        // this.going.y = this.player.y+10 - this.player.y;
        // this.goingAngle = Math.atan2(this.going.y, this.going.x);
        // this.isGoing = true;
    };
    this.right = function(params) {
        // this.player.x += 10;
        this.startGoing({ x: this.player.x, y: this.player.y }, { x: this.player.x + 10, y: this.player.y });
    };
    this.left = function(params) {
        // this.player.x -= 10;
        this.startGoing({ x: this.player.x, y: this.player.y }, { x: this.player.x - 10, y: this.player.y });
    };
    this.checkLimit = function() {
        var touching = { x: false, y: false, max: false, min: false };
        if (this.player.x >= settings.canvas.width - this.player.rad) {
            this.player.x = settings.canvas.width - this.player.rad;
            touching.x = touching.max = true;
        }
        if (this.player.x <= this.player.rad) {
            this.player.x = this.player.rad;
            touching.x = touching.min = true;
        }
        if (this.player.y >= settings.canvas.height - this.player.rad) {
            this.player.y = settings.canvas.height - this.player.rad;
            touching.y = touching.max = true;
        }
        if (this.player.y <= this.player.rad) {
            this.player.y = this.player.rad;
            touching.y = touching.min = true;
        }

        return touching;
    };
    this.gotoMouse = function(params) {

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
            this.start = { x: this.player.x, y: this.player.y };

            this.player.curveP1 = this.player.mouse;
            this.player.mouse = params.mouse;

        } else {
            this.mouse = params.mouse;

            this.going.x = this.mouse.x - this.player.x;
            this.going.y = this.mouse.y - this.player.y;

            this.goingAngle = Math.atan2(this.going.y, this.going.x);

            this.isGoing = true;
        }

        if (!this.isMoving && !this.isGoing) {

            this.isMoving = true;

            this.player.mouse = params.mouse;
            this.mouse = params.mouse;
            this.start = { x: this.player.x, y: this.player.y };
        }
    };
    this.isMoving = false;
    this.isCurving = false;
    this.isGoing = false;
    this.goingAngle = 0;
    this.going = { x: 0, y: 0 };
    this.currentStep = 1;
    this.nextStep = { x: 0, y: 0 };
    this.start = { x: 0, y: 0 };
    this.controlPoint1 = { x: 0, y: 0 };
    this.controlPoint1 = { x: 0, y: 0 };
    this.mouse = { x: 0, y: 0 };
    this.steps = {};
    this.stopMoving = function() {
        this.isMoving = false;
        this.isCurving = false;
        this.isGoing = false;
        this.goingAngle = 0;
        this.going = { x: 0, y: 0 };
        this.currentStep = 1;
        this.steps = {};
        this.nextStep = { x: 0, y: 0 };
        this.start = { x: 0, y: 0 };
        this.controlPoint1 = { x: 0, y: 0 };
        this.controlPoint1 = { x: 0, y: 0 };
        this.mouse = { x: 0, y: 0 };
        playerThings.velocity[this.player.id].y = 0.2;
    };
    this.doAction = function() {

        var velocity = {
            x: playerThings.velocity[this.player.id].x,
            y: playerThings.velocity[this.player.id].y
        };
        var mass = playerThings.mass[this.player.id];
        this.start = { x: this.player.x, y: this.player.y };
        //////////////////////////////////////////////////////////////////////////////
        ////            do moving or curving                                      ////
        //////////////////////////////////////////////////////////////////////////////
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
        } else if (this.isGoing) {
            this.player.x = this.player.x + settings.player.speed * Math.cos(this.goingAngle);
            this.player.y = this.player.y + settings.player.speed * Math.sin(this.goingAngle);

            this.checkLimit();

        } else if (settings.allowPhysics) {
            //////////////////////////////////////////////////////////////////////////////
            ////            Apply gravity                                             ////
            //////////////////////////////////////////////////////////////////////////////
            var touching = this.checkLimit();
            if (!touching.x && !touching.y) {

                console.log('------> ' + mass + ' = ' + velocity.x + ' <---> ' + velocity.y);

                // if (settings.gravity.y) {
                //   velocity.y += mass/settings.gravity.y*1/settings.gravity.y; ;
                // } else {
                velocity.y += 0.1;
                // velocity.x += 0.1;
                //   // (velocity.y > 0) ? // velocity.y + velocity.y*0.2 ://  velocity.y*0.2;
                //   // mass*(mass/10);
                // }

                console.log(velocity.y);
                if (Math.abs(velocity.y) >= settings.maxVelocity.y) {
                    velocity.y = settings.maxVelocity.y;
                }
                // if (velocity.y < settings.velocity.y) {
                //   velocity.y = settings.velocity.y;
                // }
            }

            // }

            //////////////////////////////////////////////////////////////////////////////
            ////            reverse forces on touch                                   ////
            //////////////////////////////////////////////////////////////////////////////
            touching = this.checkLimit();
            if (touching.x && touching.max) {
                console.log('touching x -----');
                if (Math.abs(velocity.x) > .5) {
                    velocity.x = -Math.abs(velocity.x);
                } else {
                    velocity.x = 0;
                }
            } else if (touching.x && touching.min) {
                velocity.x = velocity.x + .1;
                velocity.x = Math.abs(velocity.x);
            }

            touching = this.checkLimit();
            if (touching.y && touching.max) {
                console.log('touching y -----');
                if (Math.abs(velocity.y) > .5) {
                    velocity.y = -velocity.y + (settings.gravity.y / 10);
                    console.log('touching++++++++++++++++++++++++++++++ ' + velocity.y);
                } else {
                    console.log('touching------------------------------');
                    velocity.y = 0;
                    //velocity.x = 0;
                }
            } else if (touching.y && touching.min) {
                velocity.y = 0.1; //settings.maxVelocity.y;
            }
        }

        if (settings.allowPhysics) {
            //////////////////////////////////////////////////////////////////////////////
            ////            Apply acceleration                                        ////
            //////////////////////////////////////////////////////////////////////////////
            playerThings.velocity[this.player.id].x = velocity.x;
            playerThings.velocity[this.player.id].y = velocity.y;
            this.player.x += velocity.x;
            this.player.y += velocity.y;
        }

        return this.player;
    };
    this.isCloseEnough = function(point1, point2) {
        if (point1 + point2 === 0) {
            point1 = this.start;
            point2 = this.mouse;
        }
        return (Math.abs(point1.x - point2.x) < settings.closeEnough) &&
            (Math.abs(point1.x - point2.x) < settings.closeEnough);
    };
    this.getNextStep = function(start, end) {
        return {
            x: start.x + (end.x - start.x) * settings.easing,
            y: start.y + (end.y - start.y) * settings.easing
        };
    };
    this.curveto = function(start, controlPoint1, target) {

        if (!Object.keys(this.steps).length) {

            this.setCurveSteps(start, controlPoint1, target);
        }

        if (Object.keys(this.steps).length) {

            return this.steps[this.currentStep];
        }
    };
    this.setCurveSteps = function(start, controlPoint1, target) {
        var p1 = start;
        var cp = controlPoint1;
        var p2 = target;
        var p3, p4 = {};
        // var i=1;
        // while (!this.isCloseEnough(p1, p2))
        // {
        for (var i = 1; i < 100; i++) {
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
    var bites = 20;
    var startCrl = 20; //parseInt(bites+Math.random()*bites);
    startCrl = startCrl ? startCrl : 2;
    for (var i = 0; i < startCrl; i++) {
        var thisRad = parseInt(Math.random() * (minRad - maxRad + 1) + minRad);
        var crlX = Math.floor(Math.random() * (canvas.width - thisRad * 2 - thisRad * 2 + 1)) + thisRad * 2;
        var crlY = Math.floor(Math.random() * (canvas.height - thisRad * 2 - thisRad * 2 + 1)) + thisRad * 2;

        var allcolors = {};
        var newColor = ((1 << 24) * Math.random() | 0).toString(16);
        var dot = {
            x: crlX,
            y: crlY,
            rad: thisRad,
            color: "#" + ((1 << 24) * Math.random() | 0).toString(16)
        };

        dots.push(dot);
    }

    return dots;
}

// object player  player object which we want to check if its touching the any of the given objects
// array objects array of object that could collide with player
function collisionTest(player, objects) {
    var touching = false;
    var depth = 0;
    for (var i = 0; i < objects.length; i++) {

        object = objects[i];

        var dx = player.x - object.x;
        var dy = player.y - object.y;
        depth = player.rad + object.rad - Math.sqrt(dx * dx + dy * dy);
        if (depth > 0) {
            touching = true;
        }
        if (depth > 5) {
            player.rad = player.rad + object.rad / 20;
            dots.splice(i, 1);
            if (dots.length == 0) { // if there are no dots left add some more  
                dots = addFood();
                // console.log('addddddingggggggggg moreeeeeeeeeeeeeeeeeeeeeeeee');
            }
        }
    }
    if (touching) {
        player.color = "#ff0000";
    } else {
        player.color = player.originalColor;
    }

    return player;
}

function playersCollisionTest(player, objects) {
    var touching = false;
    var depth = 0;
    for (var playerId in objects) {
        // dont check if player colliding with it itself
        if (player.id == playerId) {
            continue;
        }

        object = objects[playerId];

        var dx = player.x - object.x;
        var dy = player.y - object.y;
        depth = player.rad + object.rad - Math.sqrt(dx * dx + dy * dy);
        if (depth > 0) {
            touching = true;
        }
        if (depth > 5) {
            player.rad = player.rad + object.rad / 20;
            //kill other player if he has smaller radius
            if (player.rad > objects[playerId].rad) {
                killHimNow(playerId);
                // delete objects[playerId];
            }
        }
    }
    if (touching) {
        player.color = "#ff0000";
    } else {
        player.color = player.originalColor;
    }

    return player;
}

function killHimNow(playerId) {
    console.log(players[playerId].name + 'is killed..................')
    delete players[playerId];
    // io.sockets.emit('playerLeft', {players: players});
    io.sockets.emit('youAreKilled', { playerId: playerId });

}

//do end game for player who is killed by bigger player