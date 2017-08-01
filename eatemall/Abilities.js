const Shapes = require('./Shapes.js');

function Ability() {
    this.name = 'ability';
    this.update = function(player) { console.log(this.name + ' is updated!.....'); }
}

var vect = new Shapes.Vect(10, 10);
var circ = new Shapes.Circ(5, vect);

function Body(shape = circ, color = 'reed') {
    this.name = 'body';
    if (shape.constructor.name !== 'Shape') {
        console.log(shape.constructor.name);
        throw 'Body requires shape must be of type Shape!';
    }
    this.shape = shape;
    this.color = color;
}
Body.prototype = new Ability;

function Motion() {
    this.name = 'motion';
    this.speed = 10;
    this.update = function(player) {

        if (player.actions.length > 0) {
            // player.actions.forEach((index) => {
            // while (
            if (action = player.actions.pop()) {
                // ) {
                // });
                if (this.hasOwnProperty(action.name)) {
                    this[action.name](player);
                }
            }
        }

        console.log(this.name + ' is updateding!.....');
    };
    this.up = function(player) {
        let pos = player.abilities.body.shape.pos;
        player.abilities.body.shape.pos = Object.assign({}, pos, { y: pos.y - 10 });
    };
    this.down = function(player) {
        let pos = player.abilities.body.shape.pos;
        player.abilities.body.shape.pos = Object.assign({}, pos, { y: pos.y + 10 });
        // return Object.assign({}, pos, { y: pos.y + 10 });
    };
    this.right = function(player) {
        let pos = player.abilities.body.shape.pos;
        player.abilities.body.shape.pos = Object.assign({}, pos, { x: pos.x + 10 });
        // return Object.assign({}, pos, { x: pos.x + 10 });
    };
    this.left = function(player) {
        let pos = player.abilities.body.shape.pos;
        player.abilities.body.shape.pos = Object.assign({}, pos, { x: pos.x - 10 });
        // return Object.assign({}, pos, { x: pos.x - 10 });
    };
}
Motion.prototype = new Ability;

function Collision() {
    this.name = 'collision';
}
Collision.prototype = new Ability;


module.exports =
    exports = {
        Ability,
        Body,
        Motion,
        Collision
    };