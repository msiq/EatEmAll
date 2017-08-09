function Shape() {
    this.color = 'blue';
}
var Shapes = {
    Vect: function(x, y, z = 0) {
        name: 'vector';
        this.x = x;
        this.y = y;
        this.z = z;
    },
    Line: function(start, end) {
        name: 'line';
        this.start = (start !== null) ? start : new this.Vect(0, 0);
        this.end = (end !== null) ? end : new this.Vect(0, 0);
    },
    Circ: function(redius) {
        name: 'circle';
        this.redius = redius;
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