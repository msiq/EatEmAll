    
    var players = {};
    var player = false;
    var userName = '';
    var id = false;

    var canvas;
    var cxt;
    var dots = [];
    var socket = io.connect();


    var move = {
        x: 0,
        y: 0,

        speed: 10,

//        going: false,

        up: function () {
            this.y-=1*this.speed;
//            this.going = this.up;
        },
        down: function () {
            this.y+=1*this.speed;
//            this.going = this.down;
        },
        left: function () {
            this.x-=1*this.speed;
//            this.going = this.left;
        },
        right: function () {
            this.x+=1*this.speed;
//            this.going = this.right;
        },
    };



    document.getElementById('login-form').addEventListener('submit', function(event) {
        event.preventDefault();
        userName = event.target.querySelector('.userName').value;
        // alert('yeahhh'+ userName);
        if (connectToServer(userName)) {
            var loginSplash = document.getElementById('login-splash');
            loginSplash.remove();
        }
    });

    function connectToServer(userName) {

        socket.emit('letmeeat', {userName:userName});

        socket.on('okeat', function (data) {
            console.log('this data',data);
            players = data['players'];
            id = data['id'];
            player = players[id];
            
            move.x = player.x;
            move.y = player.y;
            move.rad = player.rad;

            dots = data.dots;
            initiGame();
        });
        return true;
    }

    // new player is entered game, we need to spwn it now
    socket.on('playerJoined', function (newplayer) {
        console.log( newplayer);
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

    // new player is entered game, we need to spwn it now
    socket.on('playerLeft', function (remainingPlayers) {
console.log(Object.keys(remainingPlayers).length);
        players = remainingPlayers.players;
console.log(Object.keys(players).length);
        showPlayers();
    });


    function initiGame() {
        canvas = document.getElementById('canvas');
        cxt = canvas.getContext('2d');

        console.log('yeah');
        showPlayers();
        // spawnPlayer(player);
        refreshDots(dots);
         setInterval(startGame , 1000);
    }

    function startGame() {
        // window.requestAnimationFrame(function () {
        // setInterval()
console.log(Object.keys(players).length);
            cxt.clear();
            refreshDots(dots);
            showPlayers();
        // });

        updateServer();
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
    for (plyr in players) {
        plyr = players[plyr];
 console.log(plyr);

//        plyr.x = move.x;
//        plyr.y = move.y;
//        plyr.rad = move.rad;

        cxt.beginPath();
        cxt.fillStyle = plyr.color;
        cxt.arc(plyr.x, plyr.y, plyr.rad, 0, Math.PI * 2, true);

        if(typeof plyr.skin == 'object') {
            // cxt.globalCompositeOperation = 'source-over';
            cxt.drawImage(plyr.skin, plyr.x-plyr.rad, plyr.y-plyr.rad, plyr.rad*2, plyr.rad*2);
        } else {
            cxt.fill();
        }
        cxt.closePath();
    }
};

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









/////////////////////////////////////////////////////////////////////

document.addEventListener('keydown', function (evt) {
    doKeyDown(evt);
}, true);

function doKeyDown(evt) {

    // which key?
    switch (evt.keyCode) {
        case 38: move.up(); evt.preventDefault(); break;  /* Up */
        case 40: move.down(); evt.preventDefault(); break;  /* Down */
        case 37: move.left(); evt.preventDefault(); break;  /* Left */
        case 39: move.right(); evt.preventDefault(); break;  /* Right */
        default: //haha;
    }
console.log(player);
    player.x = move.x;
    player.y = move.y;
    player.rad = move.rad;
    players[player.id] = player;
}

function updateServer() {
console.log('------------------hhhhhhhhhhhhhhhhhh--------------------------------------');
    socket.emit('tick', {players:players, dots:dots});
}
 socket.on('tick', function (update) {
    console.log(update,'---------------jjjjjjjjjjjjjjjjjjjjjj-----------------------------------------');
     players = update.players;
     dots = update.dots;
 });
 