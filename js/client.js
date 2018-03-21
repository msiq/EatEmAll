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

function askOptions() {
    loginSplash.innerHTML =
        " <ul> <li>yes</li> <li>noo</li> <//ul>";

    return true;
}

function showMenu() {

    loginSplash.innerHTML = "<H1>Wait wait!</H1>";
    return new Promise((resolve, reject) => {
        setTimeout(function() {
            if (askOptions()) {
                resolve('yesss');
            }
        }, 500);
    });
};

// On request success
function onPlay(data) {
    connected = true;
    player = data.player;
    localStorage.setItem('eeaid', player.id);

    showMenu()
        .then(function(data) {
            loginSplash.style.display = "none";
            canvas.style.display = "inline-flex";
            canvas.HTML = "<H1>HI Welcome in!</H1>";

            setup();
        });
};

// on request Reject
function onNoGameForYou(data) {

    console.log('Noooooooooooooooooooo!');
    connected = false;
    console.log('refused :(');
};

// on tick from server
function onTick(data) {
    data = JSON.parse(data);
    update(data);
}

let lastTime = 0;
let oldInfo = infobox.appendChild(document.createElement('span'));

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


    // if ((Date.now() - lastTime) > 5000) {
    //     lastTime = Date.now();
    //     infobox.removeChild(oldInfo);
    //     oldInfo = infobox.appendChild(treefy(ps));
    // }

    for (p in ps) {
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

    //-------------------------------------------------------------------------_
    // let cir = { x: 190, y: 210, radius: 20, shape: 'circle', dir: { x: 2, y: 3 } };
    // drawNearestPointforRectCirl(ps[1], ps[0], cxt);

    //-------------------------------------------------------------------------_
    // window.requestAnimationFrame(update);
}


function drawNearestPointforRectCirl(rect, circle, cxt) {
    let cir = circle || { x: 190, y: 210, radius: 20, shape: 'circle', dir: { x: 2, y: 3 } };
    let rct = rect || { x: 230, y: 150, width: 20, height: 20, shape: 'rectangle', dir: { x: 2, y: 3 } };
    // renderPlayer(cir);

    // find nearest point on rect
    var nearestX = Math.max(rct.x - rct.width / 2, Math.min(cir.x, rct.x + rct.width / 2));
    var nearestY = Math.max(rct.y - rct.height / 2, Math.min(cir.y, rct.y + rct.height / 2));
    // render nearest point on rect
    cxt.beginPath();
    cxt.fillStyle = "blue";
    cxt.arc(nearestX, nearestY, 5, 0, Math.PI * 2);
    cxt.fill();
    cxt.closePath();

    // find distance between center of circle to nearest point on rect
    var dx = nearestX - cir.x;
    var dy = nearestY - cir.y;
    var dd = Math.sqrt(dx * dx + dy * dy);

    // find nearest point on circle
    var csx = cir.x + dx / dd * cir.radius;
    var csy = cir.y + dy / dd * cir.radius;

    // render line between nearest points
    cxt.beginPath();
    cxt.fillStyle = 'black';
    cxt.lineWidth = 2;
    cxt.moveTo(nearestX, nearestY);
    cxt.lineTo(csx, csy);
    cxt.stroke();
    cxt.closePath();

    // render nearest point on rect
    cxt.beginPath();
    cxt.fillStyle = "yellow";
    cxt.arc(csx, csy, 5, 0, Math.PI * 2);
    cxt.fill();
    cxt.closePath();
}

function renderPlayer(player) {
    spawnPlayer(player);
}

function spawnPlayer(plr) {
    if (plr.shape == 'circle') {
        drawCircle(cxt, plr);
    }

    if (plr.shape == 'rectangle') {
        drawRect(cxt, plr);

    }

    drawAabb(cxt, plr);

    if (plr.name == 'plr') {
        cxt.fillStyle = 'red';
        cxt.fillText(JSON.stringify(plr), 0, 30);
    }
};

var drawCircle = (cxt, plr) => {
    pdir = {
        x: plr.x + plr.dir.x * 1.2,
        y: plr.y + plr.dir.y * 1.2
    };
    // draw direction line
    cxt.beginPath();
    cxt.fillStyle = 'black';
    cxt.lineWidth = 4;
    cxt.moveTo(plr.x, plr.y);
    cxt.lineTo(pdir.x, pdir.y);
    cxt.stroke();
    cxt.closePath();

    // draw shape
    cxt.beginPath();
    cxt.fillStyle = plr.color;
    cxt.arc(plr.x, plr.y, plr.radius, 0, Math.PI * 2);
    cxt.fill();
    cxt.closePath();

    // drow circle on position
    cxt.beginPath();
    cxt.fillStyle = "yellow";
    cxt.arc(plr.x, plr.y, 5, 0, Math.PI * 2);
    cxt.fill();
    cxt.closePath();
}


function makeAABB(rect) {
    let hw = rect.width / 2;
    let hh = rect.height / 2;
    return {
        tl: { x: rect.x - hw, y: rect.y - hh },
        bl: { x: rect.x - hw, y: rect.y + hh },
        br: { x: rect.x + hw, y: rect.y + hh },
        tr: { x: rect.x + hw, y: rect.y - hh },
    };
};

function addToAABB(aabb, aabb2) {
    return {
        tl: { x: Math.max(aabb.tl.x, aabb2.tl.x), y: Math.max(aabb.tl.y + aabb2.tl.x) },
        bl: { x: Math.max(aabb.bl.x, aabb2.bl.x), y: Math.max(aabb.bl.y + aabb2.bl.x) },
        br: { x: Math.max(aabb.br.x, aabb2.br.x), y: Math.max(aabb.br.y + aabb2.br.x) },
        tr: { x: Math.max(aabb.tr.x, aabb2.tr.x), y: Math.max(aabb.tr.y + aabb2.tr.x) },
    };
}


function moveToOrigin(aabb, origin) {
    if (origin) {
        return {
            tl: { x: aabb.tl.x + origin.x, y: aabb.tl.y + origin.y },
            bl: { x: aabb.bl.x + origin.x, y: aabb.bl.y + origin.y },
            br: { x: aabb.br.x + origin.x, y: aabb.br.y + origin.y },
            tr: { x: aabb.tr.x + origin.x, y: aabb.tr.y + origin.y },
        };
    }

    origin = { x: 0, y: 0 };
    let hw = Math.abs(aabb.tr.x - aabb.bl.x) / 2;
    let hh = Math.abs(aabb.tr.y - aabb.bl.y) / 2;
    return {
        tl: { x: origin.x - hw, y: origin.y - hh },
        bl: { x: origin.x - hw, y: origin.y + hh },
        br: { x: origin.x + hw, y: origin.y + hh },
        tr: { x: origin.x + hw, y: origin.y - hh },
    };
};

function rotateAABB(aabb, angle) {
    let cosa = Math.cos(angle);
    let sina = Math.sin(angle);
    return {
        tl: { x: aabb.tl.x * cosa - aabb.tl.y * sina, y: aabb.tl.x * cosa + aabb.tl.y * sina },
        bl: { x: aabb.bl.x * sina - aabb.bl.y * cosa, y: aabb.bl.x * sina + aabb.bl.y * cosa },
        br: { x: aabb.br.x * cosa - aabb.br.y * sina, y: aabb.br.x * cosa + aabb.br.y * sina },
        tr: { x: aabb.tr.x * sina - aabb.tr.y * cosa, y: aabb.tr.x * sina + aabb.tr.y * cosa },
    };
};

var drawAabb = (cxt, plr) => {
    let aabb = makeAABB(plr);
    aabb = moveToOrigin(aabb);
    aabb = rotateAABB(aabb, plr.angle);
    aabb = moveToOrigin(aabb, { x: plr.x, y: plr.y });

    // Draw AABB
    cxt.beginPath();
    cxt.lineWidth = "1";
    cxt.strokeStyle = 'blue';
    cxt.rect(
        plr.x - plr.aabb.width.min,
        plr.y - plr.aabb.height.min,
        plr.aabb.width.min + plr.aabb.width.max,
        plr.aabb.height.min + plr.aabb.height.max
    );
    cxt.stroke();
    cxt.closePath();

    // draw rotated AABB
    cxt.beginPath();
    cxt.lineWidth = "3";
    cxt.strokeStyle = 'yellow';
    cxt.moveTo(aabb.tl.x, aabb.tl.y);
    cxt.lineTo(aabb.tr.x, aabb.tr.y);
    cxt.lineTo(aabb.br.x, aabb.br.y);
    cxt.lineTo(aabb.bl.x, aabb.bl.y);
    cxt.lineTo(aabb.tl.x, aabb.tl.y);
    cxt.stroke();
    cxt.closePath();


    // cxt.beginPath();
    // cxt.fillStyle = "yellow";
    // cxt.arc(aabb.tl.x, aabb.tl.y, 8, 0, Math.PI * 2);
    // cxt.fill();
    // cxt.closePath();
    // cxt.beginPath();
    // cxt.fillStyle = "blue";
    // cxt.arc(aabb.tr.x, aabb.tr.y, 6, 0, Math.PI * 2);
    // cxt.fill();
    // cxt.closePath();
    // cxt.beginPath();
    // cxt.fillStyle = "red";
    // cxt.arc(aabb.bl.x, aabb.bl.y, 5, 0, Math.PI * 2);
    // cxt.fill();
    // cxt.closePath();
    // cxt.beginPath();
    // cxt.fillStyle = "blue";
    // cxt.arc(aabb.br.x, aabb.br.y, 8, 0, Math.PI * 2);
    // cxt.fill();
    // cxt.closePath();
    cxt.strokeStyle = 'black';
};

// let rott = 1;
var drawRect = (cxt, plr) => {
    pdir = {
        x: plr.x + plr.dir.x * 1.2,
        y: plr.y + plr.dir.y * 1.2
    };
    // draw direction line
    cxt.beginPath();
    cxt.fillStyle = 'black';
    cxt.lineWidth = 4;
    cxt.moveTo(plr.x, plr.y);
    cxt.lineTo(pdir.x, pdir.y);
    cxt.stroke();
    cxt.closePath();

    // draw shape
    cxt.save();
    cxt.translate(plr.x, plr.y);
    cxt.rotate(plr.angle);
    cxt.translate((plr.x) * -1, (plr.y) * -1);

    cxt.fillStyle = plr.color;
    cxt.beginPath();
    cxt.fillRect(
        plr.x - plr.width / 2,
        plr.y - plr.height / 2,
        plr.width,
        plr.height
    );
    cxt.closePath();

    cxt.restore();

    // drow circle on position
    cxt.beginPath();
    cxt.fillStyle = "yellow";
    cxt.arc(plr.x, plr.y, 5, 0, Math.PI * 2);
    cxt.fill();
    cxt.closePath();

    // if (rott > 360) {
    //     rott = 1;
    // }
    // rott += .05;
};

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
    // console.log('clickingggggggggggggggggggggggg', mousedown);
    evt.preventDefault();

    if (mousedown || evt.type == 'click') {
        socket.emit('click', {
            playerId: player.id,
            action: evt.type,
            params: {
                mouse: getMouseXY(evt),
            }
        });
    }
}

function getMouseXY(evt) {
    var canvasBox = canvas.getBoundingClientRect();
    let pos = {
        x: (evt.clientX - canvasBox.left) * (canvas.width / canvasBox.width),
        y: (evt.clientY - canvasBox.top) * (canvas.height / canvasBox.height)
    };

    return pos;
}

function doKeyDown(evt) {
    var actions = [38, 40, 37, 39];
    if (actions.indexOf(evt.keyCode) >= 0) {
        evt.preventDefault();
        socket.emit('input', {
            playerId: player.id,
            action: evt.type,
            params: {
                key: evt.keyCode
            }
        });
    }
}