function Shape() {
    this.color = 'blue';
}
var Shapes = {
    Vect: function(x = 0, y = 0, z = 0) {
        this.name = 'vector';
        this.x = x;
        this.y = y;
        this.z = z;

        this.add = (v) => {
            return new Shapes.Vect(
                this.x + v.x,
                this.y + v.y,
                this.z + v.z
            );
        };
        this.rev = () => {
            return new Shapes.Vect(
                this.x * -1,
                this.y * -1,
                this.z * -1
            );
        };
        this.sub = (v) => {
            return this.add(v.rev());
        };
        this.multi = (v) => {

            if (typeof v !== 'object') {
                v = new Shapes.Vect(v, v, v);
            }

            return new Shapes.Vect(
                this.x * v.x,
                this.y * v.y,
                this.z * v.z
            );
        };
        this.div = (v) => {
            if (typeof v !== 'object') {
                v = new Shapes.Vect(v, v, v);
            }
            return new Shapes.Vect(
                (v.x == 0) ? this.x : this.x / v.x,
                (v.x == 0) ? this.y : this.y / v.y,
                (v.x == 0) ? this.z : this.z / v.z
            );
        };
        this.mag = () => Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z));
        this.unit = () => {
            return this.div(this.mag());
        };
        this.dot = (v) => {
            let vec = this.multi(v);
            return vec.x + vec.y + vec.z;
        };
        this.cross = (v) => {
            return new Shapes.Vect(
                x = this.y * 1 - v.y * 1,
                y = 1 * v.x - 1 * this.x,
                0
            );
        };
        // this.cross2D = (v) => {
        //     if (typeof v !== 'object') {
        //         v = new Shapes.Vect(v, v, v);
        //     }
        //     return this.x * v.y - this.y * v.x;
        // };
        // this.crossfromScalar = (s) => {
        //     return Shapes.Vect(s * this.y, -s * this.x);
        // };
        // this.crossToScalar = (s) => {
        //     return Shapes.Vect(-s * this.y, s * this.x);
        // };
        this.empty = () => this.x === this.y === this.z === 0;
        this.rotate = (deg) => {
            let cos = Math.cos(this.toRadians(deg));
            let sin = Math.sin(this.toRadians(deg));
            return (new Shapes.Vect(this.x * cos - this.y * sin, this.x * sin + this.y * cos, 0)).unit();
        };
        this.toRadians = (angle) => angle * (Math.PI / 180);
    },
    Line: function(start, end) {
        name: 'line';
        this.start = (start !== null) ? start : new this.Vect(0, 0);
        this.end = (end !== null) ? end : new this.Vect(0, 0);
    },
    Circ: function(radius) {
        name: 'circle';
        this.radius = radius;
    },
    Rect: function(width, height) {
        name: 'rectangle';
        this.width = width;
        this.height = height;
    }
}
Shapes.Vect.prototype = new Shape;
Shapes.Line.prototype = new Shape;
Shapes.Circ.prototype = new Shape;
Shapes.Rect.prototype = new Shape;

// console.log(Shapes);
module.exports = exports = Shapes;