    
var socket= io.connect();
var loginSplash = document.getElementById('login-splash');

function init() {
    window.players = {};
    window.player = false;
    window.userName = '';
    window.id = false;

    window.canvas;
    window.cxt;
    window.dots = [];

    window.connected = false;

    window.settings = {
        canvas:
            {
                height: 0,
                width: 0
            }
    };
};

//do initilize all the things
init();

    document.getElementById('login-form').addEventListener('submit', function(event) {

        event.preventDefault();

        connected = connectToServer(event.target.querySelector('.userName').value);

        // if (connected) {
            loginSplash.style.display="none";
        // }
    });

    function connectToServer(userName) {

        socket.emit('letmeeat', requestToJoinEating(userName));

        socket.on('okeat', eatingRequestSuccess);

        socket.on('goaway', eatingRequestFail);

        return connected;
    }

    function requestToJoinEating(userName) {
        return {userName: userName};
    }

    function eatingRequestSuccess(response) {
        id = response['id'];
        player = response['players'][id];
        move.x = player.x;
        move.y = player.y;
        move.rad = player.rad;
        dots = response.dots;

        settings.canvas.height = response.settings.height;
        settings.canvas,width = response.settings.width;
        initiGame();

        connected = true;
    }

    // something is wrong you cant eat now
    // show error message and ask to try again
    function eatingRequestFail(response) {
        // var errorElement = document.getElementById('no-one-loves-you');
        // errorElement.classList.remove('hide-it');
        // errorElement.classList.remove('show-it');

        // var loginSplash = document.getElementById('login-splash');
        // loginSplash.classList.remove('hide-it');
        // loginSplash.classList.remove('show-it');

        connected = false;
    }

    // new player is entered game, we need to spawn it now
    socket.on('playerJoined', function (newplayer) {
//        console.log( newplayer);
        // spawnPlayer(newPlayer.player);
            players[newplayer.player.id] = newplayer.player;
        // newPlayers = newPlayers.players;
        // for (p in newPlayers) {
        //     if (typeof(players[p]) == "undefined" || players[p] == null) {
        //         console.log(p);
        //         spawnPlayer(newPlayers[p]);

        //     }
        // }

    });

socket.on('youAreKilled', function (data) {
console.log(data.playerId, id);
    if (data.playerId === id) {
            // loginSplash.show();
            loginSplash.style.display="block";
            init();
    }
});
    // new player is entered game, we need to spwn it now
    socket.on('playerLeft', function (remainingPlayers) {
//console.log(Object.keys(remainingPlayers).length);
        players = remainingPlayers.players;
//console.log(Object.keys(players).length);
        showPlayers();
    });


    function initiGame() {
        canvas = document.getElementById('canvas');
        cxt = canvas.getContext('2d');

        // setup all other things
        setup();
    }

    function setup() {
        // set up key press listner
        document.addEventListener('keydown', function (evt) { doKeyDown(evt); }, true);

        // set up click listener 
        canvas.addEventListener("click", function (evt) { doMouseClick(evt) }, true);

    }

    function doGame() {
        if (connected) {
            cxt.clear();
            refreshDots(dots);
            showPlayers();
        }
    }

function spawnPlayer(player) {
    cxt.beginPath();
    cxt.fillStyle = player.color;
    cxt.arc(player.x, player.y, player.rad, 0, Math.PI * 2, true);

    if(typeof player.skin == 'object') {
        // cxt.globalCompositeOperation = 'source-over';
        cxt.drawImage(player.skin, player.x-player.rad, player.y-player.rad, player.rad*2, player.rad*2);
    } else {
        cxt.fill();
    }
    cxt.closePath();
};

function showPlayers() {
// console.log(Object.keys(players).length);
    var otherPlayers = players;
    for (plyr in players) {
        if (plyr != player.id) {
            drawPlayer(players[plyr]);
        } else {
            player = players[plyr];
        }
     }

     drawPlayer(player);
};

function drawPlayer(plr) {
        cxt.beginPath();
        cxt.fillStyle = plr.color;
        cxt.arc(plr.x, plr.y, plr.rad, 0, Math.PI * 2, true);
        // cxt.arc(plr.mouse.x, plr.mouse.y, 2, 0, Math.PI * 2, true);
        // if (plr.curveP1.x > 0)
        // cxt.arc(plr.curveP1.x, plr.curveP1.y, 4, 0, Math.PI * 2, true);

        if(typeof plr.skin == 'object') {
            // cxt.globalCompositeOperation = 'source-over';
            cxt.drawImage(plr.skin, plr.x-plr.rad, plr.y-plr.rad, plr.rad*2, plr.rad*2);
        } else {
            cxt.fill();
        }
        cxt.closePath();
}

function refreshDots(dots)
{
    for(var i=0;i<dots.length; i++) {
      var dot=dots[i];
        cxt.fillStyle = dot.color;
        cxt.beginPath();
        cxt.arc(dot.x, dot.y, dot.rad, 0, Math.PI*2, true);
        cxt.fill();
        cxt.closePath();

        //calculate color weight
        var nt = i;
        cxt.fill();
        cxt.fillStyle = "yellow"; // font color to write the text with
        var font = "bold " + dot.rad +"px serif";
        cxt.font = font;

        // Move it down by half the text height and left by half the text width
        var width = cxt.measureText(nt).width;
        var height = cxt.measureText("w").width; // this is a GUESS of height
        cxt.fillText(nt, dot.x - (width/2) ,dot.y + (height/2));

        //$("#colorsdiv").append(  '<div style="background-color:'+dot.color+';width:300px;height:40px;">'+i+'||'+dot.color+'---->'+colorWeight(dot.color)+'</div>' );
    }
}

// polyfix for canvas clear
CanvasRenderingContext2D.prototype.clear = CanvasRenderingContext2D.prototype.clear || function () {
    this.clearRect(0, 0, this.canvas.width, this.canvas.height);
};



// function doTick() {
//     socket.emit('tick', {players:players, dots:dots});
// }

socket.on('tack', function (update) {
console.log('.');
    players = update.players;
    dots = update.dots;
    doGame();
});





/////////////////////////////////////////////////////////////////////

// DO KEY DOWN EVENTS

/////////////////////////////////////////////////////////////////////
function doKeyDown(evt) {
    
    var action = false;
    // which key?
    switch (evt.keyCode) {
        case 38: /* Up */ 
            action = 'up';
            // move.up(); 
            break;  
        case 40: /* Down */
            action = 'down';
            // move.down(); 
            break;  
        case 37: /* Left */
            action = 'left';
            // move.left();
            break;  
        case 39: /* Right */
            action = 'right';
            // move.right();
            break;  
        default: //haha;
    }

    if (action) {
        evt.preventDefault();
        socket.emit('action', {playerId:player.id, action:action, params:{}});        
    }


}

///////////////////////////////////////////////////////////////////////////

// Do CLICK EVENTS

///////////////////////////////////////////////////////////////////////////

function doMouseClick(evt) {
    evt.preventDefault();

    var mouseXY = getMouseXY(evt);
    socket.emit('action', {playerId:player.id, action:'gotoMouse', params:{mouse: mouseXY}});
}

function getMouseXY(evt) {
    var bRect = canvas.getBoundingClientRect();
    var mouse = {x:0, y:0};
    mouse.x = (evt.clientX - bRect.left) * (canvas.width / bRect.width);
    mouse.y = (evt.clientY - bRect.top) * (canvas.height / bRect.height);
    return mouse;
}



// console.log(player);
    // player.x = move.x;
    // player.y = move.y;
    // player.rad = move.rad;
    // players[player.id] = player;


// socket.on('tack', function (update) {
//     players = update.players;
//     dots = update.dots;
// });

// var move = {
//     x: 0,
//     y: 0,

//     speed: 10,

// //        going: false,

//     up: function () {
//         socket.emit('tick', {player:player.id, action:'up'});
//         // this.y-=1*this.speed;
// //            this.going = this.up;
//     },
//     down: function () {
//         socket.emit('tick', {players:players, action:'up'});
//         // this.y+=1*this.speed;
// //            this.going = this.down;
//     },
//     left: function () {
//         socket.emit('tick', {players:players, dots:dots});
//         // this.x-=1*this.speed;
// //            this.going = this.left;
//     },
//     right: function () {
//         socket.emit('tick', {players:players, dots:dots});
//         // this.x+=1*this.speed;
// //            this.going = this.right;
//     },
// };
