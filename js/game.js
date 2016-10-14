

function inits() {
    addFood();

    player1 = new Player("p1", 'style');

    player1.skin.onload = function() {
        player1.move(move);
    };
    // player2 = new Player("p2", cxt);
}

var dots = [];
var timer;
var mouseX;
var mouseY;
var player1;

var settings = {
    fps:30,
    speed:2,
    ease:0.1,
    rad:20,
    turn:2,
};

function Player(name, style) {
    this.name = name;
    this.x = 100;
    this.y = 100;
    this.rad = settings.rad;
    this.color = "#" + ((1 << 24) * Math.random() | 0).toString(16);
    this.originalColor = this.color;
    var skin = document.createElement('img');
    skin.src = '/img/player.png';
 
    this.skin=skin;
    var player = this;
}

Player.prototype.move = function (move) {
    this.x = move.x;
    this.y = move.y;

    this.cxt.beginPath();
    this.cxt.fillStyle = this.color;
    this.cxt.arc(this.x, this.y, this.rad, 0, Math.PI * 2, true);

    if(typeof this.skin == 'object') {
        // cxt.globalCompositeOperation = 'source-over';
        cxt.drawImage(this.skin, this.x-this.rad, this.y-this.rad, this.rad*2, this.rad*2);
    } else {
        this.cxt.fill();
    }

    this.cxt.closePath();
};


// var canvas = document.getElementById('canvas');
// var cxt = canvas.getContext('2d');
var canvas = {
    height: 400,
    width: 600,
    getBoundingClientRect: function () {
        return {
            height:500,
            width:300
        };
    }
}
var minRad = 10;
var move = {
    maxY: canvas.height - (minRad / 2),
    maxX: canvas.width - (minRad / 2),
    minY: 0,
    minX: 0,
    speed: settings.speed,
    timer: false,
    going: false,
    dragging:false,
    turn:0,
    x: 100,
    y: 100,
    offsetX:0,
    offsetY:0,
    up: function () {
        if (this.y - this.speed - settings.rad >= this.minY) {
            this.y -= this.speed;
            this.going = this.up;
        } else {
            this.going = false;
        }
    },
    down: function () {
        if (this.y + this.speed + settings.rad <= this.maxY) {
            this.y += this.speed;
            if(this.going == this.right){
                this.x += this.offsetY;
                // console.log('right down', this.going);
            }
            if(this.going == this.left) {
                this.x -= this.offsetY;
                // console.log('right left', this.going);
            }
            this.going = this.down;
        } else {
            this.going = false;
        }
    },
    left: function () {
        if (this.x - this.speed - settings.rad >= this.minX) {
            this.x -= this.speed;
            this.going = this.left;
        } else {
            this.going = false;
        }
    },
    right: function () {
        if (this.x + this.speed + settings.rad <= this.maxX) {
            this.x += this.speed;
            this.going = this.right;
        } else {
            this.going = false;
        }
    },
    keepGoing: function () {
        if (move.going) {
            collisionTest(player1, dots);
            move.going();
            cxt.clear();
            refreshDots(dots);
            player1.move(move);
        } else {
            move.stopGoing();
        }
    },
    goto: function (newX, newY) { this.x = newX || this.mouseX; this.y = newY || this.mouseY; },
    mouseX: 0,
    mouseY: 0,
    getMouseXY: function (evt) {
        var bRect = canvas.getBoundingClientRect();
        this.mouseX = (evt.clientX - bRect.left) * (canvas.width / bRect.width);
        this.mouseY = (evt.clientY - bRect.top) * (canvas.height / bRect.height);
        return {mouseX: this.mouseX, mouseY: this.mouseX};
    },
    ease: settings.ease, //0 to 1
    gotoStep: function (stepX, stepY) { this.x = stepX; this.y = stepY; },
    stopGoing: function () { clearInterval(move.timer); move.timer = false; move.going = false; },
    goTowards: function () {

    }
};


function colorWeight(RGBColor) {
    var weight = 0;
    for (var i = 0; i < RGBColor.length; i++) {
        var numberValue = RGBColor.charCodeAt(i) - ((RGBColor.charCodeAt(i) > 96)? 87 : 48);
        weight += parseInt(numberValue);
    }

    return weight;
}

function onTimerTick() {

    // Test if something colliding
    collisionTest(player1, dots); 
    cxt.clear();

    //move.ease*
    //console.log(player1.x+ move.ease*(player1.x - move.mouseX), player1.y + move.ease*(player1.x - move.mouseY));
    var gotox = player1.x + (move.mouseX - player1.x) * move.ease;// (move.mouseX - player1.x)/2;
    var gotoy = player1.y + (move.mouseY - player1.y) * move.ease;//- player1.y)/2;
    //gotox = (gotox > move.maxX)? move.maxX: (gotox < 0)? 10: gotox;
    //gotoy = (gotoy > move.maxY)? move.maxY: (gotoy < 0)? 10: gotoy;

    move.gotoStep(gotox, gotoy);
    refreshDots(dots);
    player1.move(move);

    if (!move.dragging && Math.abs(player1.x - move.mouseX) <= 0.1 && Math.abs(player1.y - move.mouseY) <= 0.1) {
        clearInterval(move.timer);
        move.timer = false;
    }else{
        //do something here
    }
}

function hitTest(shape, mx, my) {
    var dx = mx - shape.x;
    var dy = my - shape.y;
    return (dx * dx + dy * dy < shape.rad * shape.rad);
}

// object player  player object which we want to check if its touching the any of the given objects
// array objects array of object that could collide with player
function collisionTest(player, objects)
{
    var touching = false;
    var depth = 0;
    for (var i=0;i<objects.length;i++) {
        object = objects[i];
        
        var dx = player.x - object.x;
        var dy = player.y - object.y;
        depth = player.rad + object.rad - Math.sqrt(dx*dx + dy*dy);
        if (depth > 0) {
            touching = true;
        }
        if (depth > 5) {
            player.rad = player.rad + object.rad/100;
            dots.splice(i, 1);
            if (dots.length == 0) { // if there are no dots left add some more  
                addFood();
                refreshDots(dots);
                // console.log('addddddingggggggggg moreeeeeeeeeeeeeeeeeeeeeeeee');
            }
        }
    }
    if (touching) {
        player.color = "#ff0000";
    } else {
        player.color = player.originalColor;
    }
}
