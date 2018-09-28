function Shape() {
  this.color = 'blue';
}
const shapeObject = new Shape();

function Vect(x = 0, y = 0, z = 0) {
  this.name = 'vector';
  this.x = x;
  this.y = y;
  this.z = z;

  this.isZero = () => this.x < 1 && this.x > -1 && this.y < 1 && this.y > -1;
  this.copy = () => new Shapes.Vect(this.x, this.y, this.y);
  this.add = v => new Shapes.Vect(this.x + v.x, this.y + v.y, this.z + v.z);
  this.rev = () => new Shapes.Vect(this.x * -1, this.y * -1, this.z * -1);
  this.sub = v => this.add(v.rev());
  this.multi = (v) => {
    if (typeof v !== 'object') {
      v = new Shapes.Vect(v, v, v);
    }

    return new Shapes.Vect(this.x * v.x, this.y * v.y, this.z * v.z);
  };
  this.div = (v) => {
    if (typeof v !== 'object') {
      v = new Shapes.Vect(v, v, v);
    }
    return new Shapes.Vect(
      v.x == 0 ? this.x : this.x / v.x,
      v.x == 0 ? this.y : this.y / v.y,
      v.x == 0 ? this.z : this.z / v.z,
    );
  };
  this.mag = () => Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  this.unit = () => this.div(this.mag());
  this.projection = v => new Shapes.Vect(
    (this.dotProduct() / (v.x * v.x + v.y * v.y)) * v.x,
    (this.dotProduct() / (v.x * v.x + v.y * v.y)) * v.y,
    0,
  );
  this.dotProduct = () => this.x * this.x + this.y * this.y;
  this.normal = left => new Shapes.Vect(
    this.y * (left ? 1 : -1),
    this.x * (left ? -1 : 1),
    0,
  );
  this.dot = (v) => {
    const vec = this.multi(v);
    return vec.x + vec.y + vec.z;
  };
  this.cross = v => new Shapes.Vect(
    (x = this.y * 1 - v.y * 1),
    (y = 1 * v.x - 1 * this.x),
    0,
  );
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
  this.empty = () => ((this.x === this.y) === this.z) === 0;
  this.rotate = (deg) => {
    const cos = Math.cos(this.toRadians(deg));
    const sin = Math.sin(this.toRadians(deg));
    return new Shapes.Vect(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos,
      0,
    ).unit();
  };
  this.toRadians = angle => angle * (Math.PI / 180);
}

function Line(start, end) {
  this.name = 'line';
  this.start = start !== null ? start : new this.Vect(0, 0);
  this.end = end !== null ? end : new this.Vect(0, 0);
}

function Circ(radius) {
  this.name = 'circle';
  this.radius = radius;
}

function Rect(width, height) {
  this.name = 'rectangle';
  this.width = width;
  this.height = height || width;
}

const Shapes = {
  Vect,
  Line,
  Circ,
  Rect,
};
Object.keys(Shapes).map(
  (shape) => {
    Shapes[shape].prototype = shapeObject;
    return Shapes[shape];
  }
);

module.exports = Shapes;
