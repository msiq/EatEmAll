let socket = io.connect();
let loginSplash = document.getElementById('menu');

let loginBtn = document.getElementById('login-btn');
let UserName = document.getElementById('user-name');
const canvas = document.getElementById('canvas');
const FPSbox = document.getElementById('current-fps');
const infobox = document.getElementById('player-info');
const cxt = canvas.getContext('2d');

let connected = false;
let player = {};

let mousedown = false;


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
    socket.emit('letmeplay', { userName, oldId, socketId: socket.id });
}

socket.on('play', onPlay);
socket.on('goaway', onNoGameForYou);
socket.on('tick', onTick);


function setup() {

    if (player.abilities.hasOwnProperty('input')) {

        // set up key press listner
        document.addEventListener('keydown', doKeyDown, true);

        // set up click listener 
        canvas.addEventListener("mousedown", () => mousedown = true, true);
        canvas.addEventListener("mouseup", () => mousedown = false, true);
        canvas.addEventListener("mousemove", doMouseClick, true);
        canvas.addEventListener("click", doMouseClick, true);
    }
}

// On request success
function onPlay(data) {
    connected = true;
    // console.log(data.player.length);
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
function onNoGameForYou(data) {
    connected = false;
    console.log('refused :(');
};

// on tick from server
function onTick(data) {
    data = JSON.parse(data);
    update(data);

    // if (player) {
    //     let updatedPlayer = data.players[player.id];

    //     player = updatedPlayer;
    // }
    // spawnPlayer(player);
}

let lastTime = 0;
let oldInfo = infobox.appendChild(document.createElement('span'));;

function update(data) {
    cxt.clear();
    var ps = data.players;
    // window.fps = data.fps;
    FPSbox.innerHTML = data.fps;

    // let infolist = '';
    // for (ind in ps) {
    //     psob = ps[ind];
    //     // console.log(ps[ind]);
    //     for (ind2 in psob) {
    //         infolist += '<li><span>' + ind2 + '<spna/><span>' + JSON.stringify(psob[ind2]) + '<spna/><li/>';
    //     }
    // }


    if ((Date.now() - lastTime) > 5000) {
        lastTime = Date.now();
        infobox.removeChild(oldInfo);
        oldInfo = infobox.appendChild(treefy(ps));
    }

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
    // console.log(player.x, player.y, player.radius, 0, Math.PI * 2);


    pdir = {
            x: plr.x + plr.dir.x * 1.2,
            y: plr.y + plr.dir.y * 1.2
        }
        // draw direction line
    cxt.beginPath();
    cxt.lineWidth = 4;
    cxt.moveTo(plr.x, plr.y);
    cxt.lineTo(pdir.x, pdir.y);
    // cxt.lineTo(plr.x + plr.dir.x * 1.2, plr.y + plr.dir.y * 1.2);
    cxt.stroke();
    cxt.closePath();


    // if (plr.name == "plr") {

    //     cxt.beginPath();
    //     cxt.lineWidth = 2;
    //     cxt.moveTo(plr.x, plr.y);
    //     cxt.lineTo(pdir.y * -1, pdir.x)
    //         // console.log(plr.x + ' : ' + plr.y);
    //         // console.log(pdir.x + ' :::' + pdir.y);
    //         // cxt.lineTo(plr.y + plr.dir.x * 5, (plr.x + plr.dir.y * 5) * -1);
    //         // plr.x + plr.dir.x * 1.2, plr.y + plr.dir.y * 1.2);
    //     cxt.stroke();
    //     cxt.closePath();

    // }

    // Draw objects
    cxt.beginPath();
    cxt.fillStyle = plr.color;

    cxt.arc(plr.x, plr.y, plr.radius, 0, Math.PI * 2);
    cxt.fillStyle = plr.color;
    cxt.fill();
    cxt.closePath();


    // console.log(plr);
    if (plr.name == 'plr') {
        cxt.fillStyle = 'red';
        cxt.fillText(JSON.stringify(plr), 0, 30);
    }
};

function renderPlayer(player) {
    spawnPlayer(player);
}


function treefy(data, child = false) {
    let tree = document.createElement('ul')
    tree.className = "list dropable";
    Object.keys(data).map(key => {
        let li = document.createElement('li');
        let keyName = document.createElement('span');
        keyName.textContent = key + ': ';
        let summary = document.createElement('span');
        summary.className = "summary open";
        summary.textContent = dotify(data[key]);
        let keyValue = document.createElement('span');

        li.appendChild(keyName);
        if (typeof data[key] === 'object') {
            let arrow = document.createElement('span');
            arrow.textContent = ">";
            arrow.className = "arrow";
            arrow.setAttribute('onClick', "clickedMe(this)");
            li.appendChild(arrow);
            li.appendChild(summary);
            keyValue = treefy(data[key]);
        } else {
            keyValue.textContent = data[key];
        }

        li.appendChild(keyValue);
        tree.appendChild(li);
    });

    return tree;

    // let tree = '<ul class="list dropable">';
    // for (index in data) {
    //     tree += '<li>' +
    //         (isNaN(index) ? index : data[index].name) +
    //         ((typeof data[index] === 'object') ?
    //             ' <span class="arrow" OnClick="clickedMe(this); return false;">></span><span class="summary open">' + dotify(data[index]) + '</span>' + treefy(data[index]) :
    //             ' : ' + JSON.stringify(data[index])) +
    //         '</li>';
    // }
    // return tree + '</ul>'
}

function dotify(str, length = 30) {
    return ((typeof str === 'object') ? JSON.stringify(str) : "'" + str + "'").substr(0, length) + '...';
}

function clickedMe(elm) {
    elm.classList.toggle('open');
    elm.nextSibling.classList.toggle('open');
    elm.nextSibling.nextSibling.classList.toggle('open');
}




































// polyfix for canvas clear
CanvasRenderingContext2D.prototype.clear = CanvasRenderingContext2D.prototype.clear || function() {
    this.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

function doMouseClick(evt) {
    console.log('clickingggggggggggggggggggggggg', mousedown);
    evt.preventDefault();

    if (mousedown || evt.type == 'click') {
        socket.emit('click', { playerId: player.id, action: 'click', params: { input: getMouseXY(evt) } });
    }
}

function getMouseXY(evt) {
    var canvasBox = canvas.getBoundingClientRect();
    let pos = {
        x: (evt.clientX - canvasBox.left) * (canvas.width / canvasBox.width),
        y: (evt.clientY - canvasBox.top) * (canvas.height / canvasBox.height)
    };

    // console.log(pos);
    return pos;
}

function doKeyDown(evt) {
    var actions = [38, 40, 37, 39];
    if (actions.indexOf(evt.keyCode) >= 0) {
        evt.preventDefault();
        socket.emit('input', { playerId: player.id, params: { input: evt.keyCode } });
    }
}