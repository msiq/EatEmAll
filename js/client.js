let socket = io.connect();
let loginSplash = document.getElementById('menu');

let loginBtn = document.getElementById('login-btn');
let UserName = document.getElementById('user-name');
const canvas = document.getElementById('canvas');
const cxt = canvas.getContext('2d');

let connected = false;
let player = {};


// Handel game join button
$(loginBtn).on('click', (event) => {
    event.defaultPrevented;
    if (UserName.value !== '') {
        console.log('Ready to connect');
        connectToServer(UserName.value);
    }
});


// Connect to Server
function connectToServer(userName) {
    console.log('Trying to connect');
    oldId = localStorage.getItem('eeaid');
    socket.emit('letmeeat', { userName, oldId, socketId: socket.id });
}
socket.on('eat', eatingRequestSuccess);
socket.on('goaway', eatingRequestFail);
socket.on('tick', onTick);


function setup() {
    console.log(player);
    if (player.abilities.hasOwnProperty('input')) {

        // set up key press listner
        document.addEventListener('keydown', doKeyDown, true);

        // set up click listener 
        canvas.addEventListener("click", doMouseClick, true);
    }
}

// On request success
function eatingRequestSuccess(data) {
    connected = true;
    console.log(data.player);
    player = data.player;
    localStorage.setItem('eeaid', player.id);
    loginSplash.style.display = "none";
    canvas.style.display = "inline-flex";
    canvas.HTML = "<H1>HI Welcome in!</H1>";
    // console.log(data, 'connected :)');
    setup();
    // show player    
    // spawnPlayer(player);

    // start game loop    
    // update();
};

// on request Reject
function eatingRequestFail(data) {
    connected = false;
    console.log('refused :(');
};

// on tick from server
function onTick(data) {
    // console.log('yessssssss!', data);


    data = JSON.parse(data);

    update(data);

    // if (player) {
    //     let updatedPlayer = data.players[player.id];

    //     player = updatedPlayer;
    // }
    // spawnPlayer(player);
}

function update(data) {
    cxt.clear();
    var ps = data.players;
    for (p in ps) {
        // console.log(ps[p]);
        renderPlayer(ps[p]);
    }

    // data.dots.forEach((p) => {
    //     spawnPlayer(p);
    // }, this);


    // cxt.clear();
    // player.x = player.x + 1;
    // // console.log(player.color);
    // setTimeout(function() {
    //     if (player.color == 'red') {
    //         player.color = 'blue';
    //     } else {
    //         player.color = 'red';
    //     }
    // }, 1000);
    // if (player.x > 600) {
    //     player.x = 10;
    // }

    // renderPlayer();

    // window.requestAnimationFrame(update);
}

function spawnPlayer(plr) {
    // var body = player.has('body');
    // console.log(plr);
    // var pos = player.abilities.body.shape.pos;
    // console.log(player.x, player.y, player.redius, 0, Math.PI * 2);

    cxt.beginPath();
    cxt.fillStyle = plr.color;

    cxt.arc(plr.x, plr.y, plr.redius, 0, Math.PI * 2);
    cxt.fillStyle = plr.color;
    cxt.fill();
    cxt.closePath();


    cxt.fillText(JSON.stringify(plr), 10, 10);
};

function renderPlayer(player) {
    spawnPlayer(player);
}






































// polyfix for canvas clear
CanvasRenderingContext2D.prototype.clear = CanvasRenderingContext2D.prototype.clear || function() {
    this.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

function doMouseClick(evt) {
    console.log('clickingggggggggggggggggggggggg');
    evt.preventDefault();
    socket.emit('action', { playerId: player.id, action: 'gotoMouse', params: { mouse: getMouseXY(evt) } });
}

function getMouseXY(evt) {
    var canvasBox = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - canvasBox.left) * (canvas.width / canvasBox.width),
        y: (evt.clientY - canvasBox.top) * (canvas.height / canvasBox.height)
    };
}

function doKeyDown(evt) {
    var actions = [38, 40, 37, 39];
    if (actions.indexOf(evt.keyCode) >= 0) {
        evt.preventDefault();
        socket.emit('player-action', { playerId: player.id, action: evt.keyCode, params: {} });
    }
}