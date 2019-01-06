class Shape {
  constructor() {
    this.color = 'blue';
  }
}

class Vect extends Shape {
  constructor(x = 0, y = 0, z = 0) {
    super();
    this.name = 'vector';
    this.x = x;
    this.y = y;
    this.z = z;
  }

  isZero() {
    return this.x < 1 && this.x > -1 && this.y < 1 && this.y > -1;
  }

  copy() {
    return new Vect(this.x, this.y, this.y);
  }

  add(v) {
    return new Vect(this.x + v.x, this.y + v.y, this.z + v.z);
  }

  rev() {
    return new Vect(this.x * -1, this.y * -1, this.z * -1);
  }

  sub(v) {
    return this.add(v.rev());
  }

  multi(v) {
    const vec = (typeof v === 'object') ? v : new Vect(v, v, v);

    return new Vect(this.x * vec.x, this.y * vec.y, this.z * vec.z);
  }

  div(v) {
    const vec = (typeof v === 'object') ? v : new Vect(v, v, v);

    return new Vect(
      vec.x === 0 ? this.x : this.x / vec.x,
      vec.y === 0 ? this.y : this.y / vec.y,
      vec.z === 0 ? this.z : this.z / vec.z,
    );
  }

  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  unit() {
    return this.div(this.mag());
  }

  projection(v) {
    return new Vect(
      (this.dotProduct() / (v.x * v.x + v.y * v.y)) * v.x,
      (this.dotProduct() / (v.x * v.x + v.y * v.y)) * v.y,
      0,
    );
  }

  dotProduct() {
    return this.x * this.x + this.y * this.y;
  }

  normal(left) {
    return new Vect(
      this.y * (left ? 1 : -1),
      this.x * (left ? -1 : 1),
      0,
    );
  }

  dot(v) {
    const vec = this.multi(v);
    return vec.x + vec.y + vec.z;
  }

  cross(v) {
    return new Vect(
      this.y * 1 - v.y * 1,
      1 * v.x - 1 * this.x,
      0,
    );
  }

  // cross2D(v) {
  //   if (typeof v !== 'object') {
  //     v = new Vect(v, v, v);
  //   }

  //   return this.x * v.y - this.y * v.x;
  // }

  // crossfromScalar(s) {
  //   return new Vect(s * this.y, -s * this.x);
  // }

  // crossToScalar(s) {
  //   return new Vect(-s * this.y, s * this.x);
  // }

  empty() {
    return ((this.x === this.y) === this.z) === 0;
  }

  rotate(deg) {
    const cos = Math.cos(this.toRadians(deg));
    const sin = Math.sin(this.toRadians(deg));
    return new Vect(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos,
      0,
    ).unit();
  }

  static toRadians(angle) {
    return angle * (Math.PI / 180);
  }
}

class Line extends Shape {
  constructor(start, end) {
    super();
    this.name = 'line';
    this.start = start !== null ? start : new this.Vect(0, 0);
    this.end = end !== null ? end : new this.Vect(0, 0);
  }
}

class Circ extends Shape {
  constructor(radius) {
    super();
    this.name = 'circle';
    this.radius = radius;
  }
}

class Rect extends Shape {
  constructor(width, height) {
    super();
    this.name = 'rectangle';
    this.width = width;
    this.height = height || width;
  }
}

module.exports = {
  Shape,
  Vect,
  Line,
  Circ,
  Rect,
};
