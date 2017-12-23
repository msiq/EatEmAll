const Shapes = require('./Shapes.js');

function Ability() {
    this.name = 'ability';
    this.update = function(player) { console.log(this.name + ' is updated!.....'); }
}

function Body(shape, color = 'red') {
    this.name = 'body';
    if (shape.constructor.name !== 'Shape') {
        // console.log(shape.constructor.name);
        throw 'Body requires a Shape, that must be of type Shape!';
    }
    this.shape = shape;
    this.color = color;
    this.originalColor = color;
}
Body.prototype = new Ability;

function Position(vector = null) {
    this.name = 'position';
    this.pos = vector ? vector : new Shapes.Vect(0, 0);
}
Position.prototype = new Ability;

function Orientation(vector = null) {
    this.name = 'orientation';
    this.orientation = vector ? vector : new Shapes.Vect(
        (Math.floor(Math.random() * (10 - (-10) + 1)) + (-10)),
        (Math.floor(Math.random() * (10 - (-10) + 1)) + (-10)),
        0 // (Math.floor(Math.random() * (10 - (-10) + 1)) + (-10))  // something doest not work well when z is set here. Why?????????????
    ).unit();
    // rotate direction facing to degrees in radians
    this.rotate = (deg) => {
        let ort = this.orientation;
        let cos = Math.cos(this.toRadians(deg));
        let sin = Math.sin(this.toRadians(deg));
        let newDir = new Shapes.Vect(ort.x * cos - ort.y * sin, ort.x * sin + ort.y * cos, 0);
        this.orientation = newDir.unit();
    };
    this.toRadians = (angle) => angle * (Math.PI / 180);
}
Orientation.prototype = new Ability;

function Velocity(vector = null) {
    this.name = 'velocity';
    this.velocity = vector ? vector : new Shapes.Vect(0, 0);
}
Velocity.prototype = new Ability;

function Gravity(vector = null) {
    this.name = 'gravity';
    this.gravity = vector ? vector : new Shapes.Vect(0, 0.5);
}
Gravity.prototype = new Ability;

function Collidable(vector = null) {
    this.name = 'collidable';
    this.collidingWith = [];
}
Collidable.prototype = new Ability;

function Input() {
    this.name = 'input';
}
Input.prototype = new Ability;

function Mass(mass) {
    this.name = 'mass';
    this.mass = mass ? mass : 1;
}
Mass.prototype = new Ability;

// Coefficient of restitution
function Cor(cor = .5) { //elasticity
    this.name = 'cor';
    this.cor = cor;
}
Cor.prototype = new Ability;

function Acceleration(vector = null) {
    this.name = 'acceleration';
    this.acceleration = vector ? vector : new Shapes.Vect(0, 0, 0);
}
Acceleration.prototype = new Ability;

function AngularVelocity(vector = null) {
    this.name = 'angularVelocity';
    this.angularVelocity = vector ? vector : new Shapes.Vect(0, 0, 0);
}
AngularVelocity.prototype = new Ability;

function Torque(vector = null) {
    this.name = 'torque';
    this.torque = vector ? vector : new Shapes.Vect(0, 0, 0);
}
Torque.prototype = new Ability;

/**
 * @param {string} head Id of the entity 
 * @param {string} tail Id of the entity
 * @param {float} length 
 * @param {float} elasticity  between 0 - 1
 */
function String(head, tail, length = 10, elasticity = 0.5) {
    this.name = 'string';
    this.head = head;
    this.tail = tail;
    this.length = length;
    this.elasticity = elasticity;
}
String.prototype = new Ability;

module.exports =
    exports = {
        Body,
        Position,
        Velocity,
        Input,
        Gravity,
        Collidable,
        Cor,
        Mass,
        String,
        Orientation,
        Acceleration,
        AngularVelocity,
        Torque
    };