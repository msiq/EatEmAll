const Shapes = require('./Shapes.js');

function Ability() {
    this.name = 'ability';
    this.update = function(player) { console.log(this.name + ' is updated!.....'); }
}

function Body(shape, color = 'red') {
    this.name = 'body';
    if (shape.constructor.name !== 'Shape') {
        console.log(shape.constructor.name);
        throw 'Body requires a Shape, that must be of type Shape!';
    }
    this.shape = shape;
    this.color = color;
}
Body.prototype = new Ability;

function Position(vector = null) {
    this.name = 'position';
    this.pos = vector ? vector : new Shapes.Vect(0, 0);
}
Position.prototype = new Ability;

function Velocity(vector = null) {
    this.name = 'velocity';
    this.vel = vector ? vector : new Shapes.Vect(0, 0);
}
Velocity.prototype = new Ability;

function Input() {
    this.name = 'input';
}
Input.prototype = new Ability;

module.exports =
    exports = {
        Body,
        Position,
        Velocity,
        Input,
    };