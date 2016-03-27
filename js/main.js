$(document).ready(function () {
//alert("staring...");
    inits();
//setupPlayer(player1, move, cxt);
});
var dots = [];
var timer;
var mouseX;
var mouseY;
var player1;

function Player(name, cxt) {
    this.name = name;
    this.cxt = cxt;
    this.x = 100;
    this.y = 100;
    this.rad = 8;
    this.color = "#" + ((1 << 24) * Math.random() | 0).toString(16)
    this.move(move);
}
Player.prototype.move = function (move) {
    this.cxt.beginPath();
    this.cxt.arc(move.x, move.y, 5, 0, Math.PI * 2, true);
    this.x = move.x;
    this.y = move.y;
    this.cxt.fill();
    this.cxt.closePath();
};
Player.prototype.aboutMe = function () {
    return "I'm " + this.name;
}

function setupPlayer(player, move, cxt) {
    console.log(move, cxt);
    cxt.beginPath();
    cxt.arc(move.x, move.y, 5, 0, Math.PI * 2, true);
    cxt.fill();
    cxt.closePath();
    //clearInterval(move.timer);
    //alert("setupPlayer!");
}

CanvasRenderingContext2D.prototype.clear =
        CanvasRenderingContext2D.prototype.clear || function () {
            this.clearRect(0, 0, this.canvas.width, this.canvas.height);
        };

var canvas = document.getElementById('canvas');
var cxt = canvas.getContext('2d');
var minRad = 10;
var move = {
    maxY: canvas.height - (minRad / 2),
    maxX: canvas.width - (minRad / 2),
    speed: 2,
    x: 100,
    y: 100,
    up: function () { if (this.y - this.speed >= 5) { this.y -= this.speed; this.going = this.up;}},
    down: function () { if (this.y + this.speed <= this.maxY) { this.y += this.speed;  this.going = this.down;}},
    left: function () { if (this.x - this.speed >= 5) { this.x -= this.speed;  this.going = this.left;}},
    right: function () {
        if (this.x + this.speed <= this.maxX) {
            this.x += this.speed;
            this.going = this.right;
        }
    },
    keepGoing: function () { 
    /*    console.log(typeof this.going, this.going); 
        move.right(); 
        cxt.clear(); 
        player1.move(move);
        */
    },
    going: false,
    goto: function (newX, newY) { this.x = newX || this.mouseX; this.y = newY || this.mouseY; },
    mouseX: 0,
    mouseY: 0,
    getMouseXY: function (evt) {
        var bRect = canvas.getBoundingClientRect();
        this.mouseX = (evt.clientX - bRect.left) * (canvas.width / bRect.width);
        this.mouseY = (evt.clientY - bRect.top) * (canvas.height / bRect.height);
        return {mouseX: this.mouseX, mouseY: this.mouseX};
    },
    timer: false,
    ease: .2, //0 to 1
    gotoStep: function (stepX, stepY) {
        this.x = stepX;
        this.y = stepY;
    },
    dragging:false
};
function keepGoing() {
        console.log(typeof move.going, move.going); 
        move.going(); 
        cxt.clear(); 
        player1.move(move);
}
move.keepGoing = keepGoing
function inits() {
    player1 = new Player("p1", cxt);
    console.log(player1);
    //setupPlayer(player1, move, player1.cxt);
    /*
     var startCrl = parseInt(40+Math.random()*100-40);
     for (var i=0;i<startCrl; i++){
     var crlX = parseInt(40+Math.random()*canvas.width-40);
     var crlY= parseInt(40+Math.random()*canvas.height-40);
     var dot = {
     x: crlX,
     y: crlY,
     rad:5,//parseInt(minRad+Math.random()*10-minRad),
     color:"#"+((1<<24)*Math.random()|0).toString(16)};

     //console.log(dots[0]);
     cxt.fillStyle = dot.color;//'#8ED6FF';
     cxt.beginPath();
     cxt.arc(dot.x, dot.y, dot.rad, 0, Math.PI*2, true);
     cxt.fill();
     cxt.closePath();
     dots.push(dot);
     if (dots.length < 20) {
     i--;
     continue;
     }
     // console.log(dot);
     // exit;
     }
     */
//console.log(dots);
}

document.addEventListener('keydown',
        function (evt) {
            doKeyDown(evt);
            console.log(move, cxt, move.x, move.y);
            cxt.clear();
            player1.move(move);
            //setupPlayer(move, cxt);
        },
        true);

function doKeyDown(evt) {

    switch (evt.keyCode) {
        case 38: move.up(); evt.preventDefault(); break;  /* Up */
        case 40: move.down(); evt.preventDefault(); break;  /* Down */
        case 37: move.left(); evt.preventDefault(); break;  /* Left */
        case 39: move.right(); evt.preventDefault(); break;  /* Right */
    }

    if(move.timer && move.going != this.going) {
        clearInterval(move.timer);
        move.timer = false;
        move.going = false;
        this.going = false;
    } else if (move.going && move.going != this.going) {
        this.going = move.going;
        move.timer = setInterval(move.keepGoing, 1000/60); console.log(move.timer);
    }
    //move.keepGoing();
}

canvas.addEventListener("mousedown", doMouseDown, false);
function doMouseDown(evt) {
    console.log('down');
    console.log(move.getMouseXY(evt));
    //get mouse position



    //if mouse down on palyer dot, it must be trying to drag
    if (hitTest(player1, move.mouseX, move.mouseY)) {
        move.dragging = true;
        console.log('hitting', move);
    }

    if (move.dragging) {
        canvas.addEventListener("mousemove", doMouseMove, false);
    }

    canvas.removeEventListener("mousedown", doMouseDown, false);
    canvas.addEventListener("mouseup", doMouseUp, false);
}

function doMouseUp(evt) {
    console.log('up');
    canvas.addEventListener("mousedown", doMouseDown, false);
    canvas.removeEventListener("mouseup", doMouseUp, false);

    if (move.dragging) {
        move.dragging = false;
        console.log('dragging-->', move.dragging);
        canvas.removeEventListener("mousemove", doMouseMove, false);
    }
}

function doMouseMove(evt) {
    console.log('move');
    move.getMouseXY(evt);
    move.goto(move.mouseX, move.mouseY);

    //move dot 30 fps...
    if (!move.timer) {
        move.timer = setInterval(onTimerTick, 1000/30);
            console.log(move.timer,'---',move.dragging ,'sssssssssssssssssssssssssssssssssssssss');
    }

    //clearInterval(move.timer);
    console.log(move);
}

function onTimerTick() {
    console.log('ticking...........................................................', move.timer);
    cxt.clear();
    //move.ease*
    //console.log(player1.x+ move.ease*(player1.x - move.mouseX), player1.y + move.ease*(player1.x - move.mouseY));
    var gotox = player1.x + (move.mouseX - player1.x) * move.ease;// (move.mouseX - player1.x)/2;
    var gotoy = player1.y + (move.mouseY - player1.y) * move.ease;//- player1.y)/2;
    //gotox = (gotox > move.maxX)? move.maxX: (gotox < 0)? 10: gotox;
    //gotoy = (gotoy > move.maxY)? move.maxY: (gotoy < 0)? 10: gotoy;
console.log('>>>>>>>>>', gotox, gotoy);  
//, math.abs(player1.y - move.mouseY) );  
    move.gotoStep(gotox, gotoy);
    player1.move(move);


console.log('-->->->->->->->->->', gotox,  move.x , player1.x, '---', move.dragging, '---', Math.abs(player1.x - move.mouseX) , '---', Math.abs(player1.y - move.mouseY));
    if (!move.dragging && Math.abs(player1.x - move.mouseX) <= 0.1 && Math.abs(player1.y - move.mouseY) <= 0.1) {
        clearInterval(move.timer);
        move.timer = false;
        console.log(move.timer, 'stopppppedddddddddd');
    }else{
        console.log(move.timer, 'noooooooooooooooooooooooooo');
    }
}

function hitTest(shape, mx, my) {
    var dx = mx - shape.x;
    var dy = my - shape.y;
    console.log(dx, '---', dy,'---', shape.rad);
    return (dx * dx + dy * dy < shape.rad * shape.rad);
}