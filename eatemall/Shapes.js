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
    Circ: function(redius, pos = null) {
        name: 'circle';
        this.redius = redius;
        this.pos = (pos !== null) ? pos : new this.Vect(0, 0);
    },
    Rect: function(width, height, pos = null) {
        name: 'rectangle';
        this.width = width;
        this.height = height;
        this.pos = (pos !== null) ? pos : new this.Vect(0, 0);
    }
}
Shapes.Vect.prototype = new Shape;
Shapes.Circ.prototype = new Shape;
Shapes.Rect.prototype = new Shape;

// console.log(Shapes);
module.exports = exports = Shapes;