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

function Aabb(body, angle = false) {
    this.name = 'aabb';
    this.height = { min: 0, max: 0 };
    this.width = { min: 0, max: 0 };

    if (body.shape.name == 'circle') {
        this.height.min = Math.abs(this.height.min - body.shape.radius);
        this.height.max = Math.abs(this.height.max + body.shape.radius);
        this.width.min = Math.abs(this.width.min - body.shape.radius);
        this.width.max = Math.abs(this.width.max + body.shape.radius);
    }

    if (body.shape.name == 'rectangle') {

        this.height.min = Math.abs(this.height.min + body.shape.height / 2);
        this.height.max = Math.abs(this.height.max + body.shape.height / 2);
        this.width.min = Math.abs(this.width.min + body.shape.width / 2);
        this.width.max = Math.abs(this.width.max + body.shape.width / 2);
    };

    this.makeAABB = (rect) => {
        let hw = rect.width / 2;
        let hh = rect.height / 2;
        return {
            tl: { x: rect.x - hw, y: rect.y - hh },
            bl: { x: rect.x - hw, y: rect.y + hh },
            br: { x: rect.x + hw, y: rect.y + hh },
            tr: { x: rect.x + hw, y: rect.y - hh },
        };
    };
    this.moveToOrigin = (aabb, origin) => {
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
    this.rotateAABB = (aabb, angle) => {
        let cosa = Math.cos(angle);
        let sina = Math.sin(angle);
        return {
            tl: { x: aabb.tl.x * cosa - aabb.tl.y * sina, y: aabb.tl.x * cosa + aabb.tl.y * sina },
            bl: { x: aabb.bl.x * sina - aabb.bl.y * cosa, y: aabb.bl.x * sina + aabb.bl.y * cosa },
            br: { x: aabb.br.x * cosa - aabb.br.y * sina, y: aabb.br.x * cosa + aabb.br.y * sina },
            tr: { x: aabb.tr.x * sina - aabb.tr.y * cosa, y: aabb.tr.x * sina + aabb.tr.y * cosa },
        };
    };
}
Aabb.prototype = new Ability;

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
    this.angle = Math.atan2(this.orientation.y, this.orientation.x);
    // rotate direction facing to degrees in radians
    this.rotate = (deg) => {
        let ort = this.orientation;
        let cos = Math.cos(this.toRadians(deg));
        let sin = Math.sin(this.toRadians(deg));
        let newDir = new Shapes.Vect(ort.x * cos - ort.y * sin, ort.x * sin + ort.y * cos, 0);
        this.orientation = newDir.unit();
        this.calcAngle(deg);
    };

    this.calcAngle = (deg) => {
        deg = this.toRadians(deg);
        this.angle = this.angle + deg;
        if (this.angle > Math.PI * 2) {
            this.angle = this.angle - Math.PI * 2;
        }
        if (this.angle < Math.PI * -2) {
            this.angle = this.angle + Math.PI * 2;
        }
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
        Torque,
        Aabb
    };