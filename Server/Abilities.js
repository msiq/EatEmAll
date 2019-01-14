/* eslint-disable class-methods-use-this */
/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "[config, params]" }] */
/* eslint no-param-reassign:
  ["error", {
    "props": true,
      "ignorePropertyModificationsFor": ["asdasd"],

    }]
*/
const autoBind = require('auto-bind');
const Shapes = require('./Shapes.js');

class Ability {
  constructor() {
    this.name = 'ability';
    autoBind(this);
  }

  preUpdate(player) {
    console.log(`${this.name} is pre updated!.....`);
  }

  update(player) {
    console.log(`${this.name} is updated!.....`);
  }

  postUpdate(player) {
    console.log(`${this.name} is post updated!.....`);
  }
}

class Body extends Ability {
  constructor(shape, color = 'red') {
    super();
    autoBind(this);
    this.name = 'body';
    if (!(shape instanceof Shapes.Shape)) {
      throw new Error('Body requires a Shape, that must be of Type Shape!');
    }
    this.shape = shape;
    this.color = color;
    this.originalColor = color;
  }
}

class Aabb extends Ability {
  constructor(body, angle = false) {
    super();
    autoBind(this);
    this.name = 'aabb';
    this.height = {
      min: 0,
      max: 0,
    };
    this.width = {
      min: 0,
      max: 0,
    };

    if (body.shape.name === 'circle') {
      this.height.min = Math.abs(this.height.min - body.shape.radius);
      this.height.max = Math.abs(this.height.max + body.shape.radius);
      this.width.min = Math.abs(this.width.min - body.shape.radius);
      this.width.max = Math.abs(this.width.max + body.shape.radius);
    }

    if (body.shape.name === 'rectangle') {
      this.height.min = Math.abs(this.height.min + body.shape.height / 2);
      this.height.max = Math.abs(this.height.max + body.shape.height / 2);
      this.width.min = Math.abs(this.width.min + body.shape.width / 2);
      this.width.max = Math.abs(this.width.max + body.shape.width / 2);
    }
  }

  makeAABB(rect) {
    const hw = rect.width / 2;
    const hh = rect.height / 2;
    return {
      tl: {
        x: rect.x - hw,
        y: rect.y - hh,
      },
      bl: {
        x: rect.x - hw,
        y: rect.y + hh,
      },
      br: {
        x: rect.x + hw,
        y: rect.y + hh,
      },
      tr: {
        x: rect.x + hw,
        y: rect.y - hh,
      },
    };
  }

  moveToOrigin(aabb, origin) {
    if (origin) {
      return {
        tl: {
          x: aabb.tl.x + origin.x,
          y: aabb.tl.y + origin.y,
        },
        bl: {
          x: aabb.bl.x + origin.x,
          y: aabb.bl.y + origin.y,
        },
        br: {
          x: aabb.br.x + origin.x,
          y: aabb.br.y + origin.y,
        },
        tr: {
          x: aabb.tr.x + origin.x,
          y: aabb.tr.y + origin.y,
        },
      };
    }

    const AbsOrigin = {
      x: 0,
      y: 0,
    };
    const hw = Math.abs(aabb.tr.x - aabb.bl.x) / 2;
    const hh = Math.abs(aabb.tr.y - aabb.bl.y) / 2;
    return {
      tl: {
        x: AbsOrigin.x - hw,
        y: AbsOrigin.y - hh,
      },
      bl: {
        x: AbsOrigin.x - hw,
        y: AbsOrigin.y + hh,
      },
      br: {
        x: AbsOrigin.x + hw,
        y: AbsOrigin.y + hh,
      },
      tr: {
        x: AbsOrigin.x + hw,
        y: AbsOrigin.y - hh,
      },
    };
  }

  rotateAABB(aabb, rotateAngle) {
    const cosa = Math.cos(rotateAngle);
    const sina = Math.sin(rotateAngle);
    return {
      tl: {
        x: aabb.tl.x * cosa - aabb.tl.y * sina,
        y: aabb.tl.x * cosa + aabb.tl.y * sina,
      },
      bl: {
        x: aabb.bl.x * sina - aabb.bl.y * cosa,
        y: aabb.bl.x * sina + aabb.bl.y * cosa,
      },
      br: {
        x: aabb.br.x * cosa - aabb.br.y * sina,
        y: aabb.br.x * cosa + aabb.br.y * sina,
      },
      tr: {
        x: aabb.tr.x * sina - aabb.tr.y * cosa,
        y: aabb.tr.x * sina + aabb.tr.y * cosa,
      },
    };
  }
}

class Position extends Ability {
  constructor(vector = null) {
    super();
    autoBind(this);
    this.name = 'position';
    this.pos = vector || new Shapes.Vect(0, 0);
  }
}

class Orientation extends Ability {
  constructor(vector = null) {
    super();
    autoBind(this);
    this.name = 'orientation';
    this.orientation = vector
      || new Shapes.Vect(
        Math.floor(Math.random() * (10 - -10 + 1)) + -10,
        Math.floor(Math.random() * (10 - -10 + 1)) + -10,
        0,
        // (Math.floor(Math.random() * (10 - (-10) + 1)) + (-10))
        // something doest not work well when z is set here. Why?????????????
      ).unit();
    this.angle = Math.atan2(this.orientation.y, this.orientation.x);
  }

  // rotate direction facing to degrees in radians
  rotate(deg) {
    const ort = this.orientation;
    const cos = Math.cos(this.toRadians(deg));
    const sin = Math.sin(this.toRadians(deg));
    const newDir = new Shapes.Vect(
      ort.x * cos - ort.y * sin,
      ort.x * sin + ort.y * cos,
      0,
    );
    this.orientation = newDir.unit();
    this.calcAngle(deg);
  }

  calcAngle(deg) {
    const rad = this.toRadians(deg);
    this.angle = this.angle + rad;
    if (this.angle > Math.PI * 2) {
      this.angle = this.angle - Math.PI * 2;
    }
    if (this.angle < Math.PI * -2) {
      this.angle = this.angle + Math.PI * 2;
    }
  }

  toRadians(angle) {
    return angle * (Math.PI / 180);
  }
}

class Velocity extends Ability {
  constructor(vector = null) {
    super();
    autoBind(this);
    this.name = 'velocity';
    this.velocity = vector || new Shapes.Vect(0, 0);
  }
}

class Gravity extends Ability {
  constructor(vector = null) {
    super();
    autoBind(this);
    this.name = 'gravity';
    this.gravity = vector || new Shapes.Vect(0, 0.5);
  }
}

class Collidable extends Ability {
  constructor() {
    super();
    autoBind(this);
    this.name = 'collidable';
    this.collidingWith = [];
    this.collidingStart = [];
    this.collidingEnd = [];
    this.inCollision = false;
    this.onCollisionStartCallback = false;
    this.onCollisionEndCallback = false;
    this.onCollisionCallback = false;
  }

  colliding(object, collision) {
    const colliding = this.collidingWith.indexOf(object) >= 0;
    const goingto = this.collidingStart.indexOf(object) >= 0;
    if (collision && !goingto && !colliding) {
      this.collidingStart.push(object);
    }

    if (!collision) {
      this.collidingWith.splice(this.collidingWith.indexOf(object), 1);
      this.collidingEnd.push(object);
    }
  }

  collisionStart() {
    this.collidingStart.forEach((object) => {
      if (this.onCollisionStartCallback) {
        this.onCollisionStartCallback(object);
      }
      this.collidingWith.push(object);
      this.collidingStart.splice(this.collidingStart.indexOf(object), 1);
    });
  }

  collision() {
    this.collidingWith.forEach((object) => {
      if (this.onCollisionCallback) {
        this.onCollisionCallback(object);
      }
    });
  }

  collisionEnd() {
    this.collidingEnd.forEach((object) => {
      if (this.onCollisionEndCallback) {
        this.onCollisionEndCallback(object);
      }
      this.collidingEnd.splice(this.collidingEnd.indexOf(object), 1);
    });
  }

  onCollisionStart(callback = false) {
    this.onCollisionStartCallback = callback;
  }

  onCollision(callback = false) {
    this.onCollisionCallback = callback;
  }

  onCollisionEnd(callback = false) {
    this.onCollisionEndCallback = callback;
  }

  preUpdate() { }

  update(entity) {
    this.collisionStart(entity);
    this.collision(entity);
    this.collisionEnd(entity);
  }
}

class Input extends Ability {
  constructor() {
    super();
    autoBind(this);
    this.name = 'input';
  }
}

class Mass extends Ability {
  constructor(mass) {
    super();
    autoBind(this);
    this.name = 'mass';
    this.mass = mass || 1;
  }
}

// Coefficient of restitution
class Cor extends Ability {
  constructor(cor = 0.5) {
    super();
    autoBind(this);
    // elasticity
    this.name = 'cor';
    this.cor = cor;
  }
}

class Acceleration extends Ability {
  constructor(vector = null) {
    super();
    autoBind(this);
    this.name = 'acceleration';
    this.acceleration = vector || new Shapes.Vect(0, 0, 0);
  }
}

class AngularVelocity extends Ability {
  constructor(vector = null) {
    super();
    autoBind(this);
    this.name = 'angularVelocity';
    this.angularVelocity = vector || new Shapes.Vect(0, 0, 0);
  }
}

class Torque extends Ability {
  constructor(vector = null) {
    super();
    autoBind(this);
    this.name = 'torque';
    this.torque = vector || new Shapes.Vect(0, 0, 0);
  }
}

/**
 * @param {string} head Id of the entity
 * @param {string} tail Id of the entity
 * @param {float} length
 * @param {float} elasticity  between 0 - 1
 */
class String extends Ability {
  constructor(head, tail, length = 10, elasticity = 0.5) {
    super();
    autoBind(this);
    this.name = 'string';
    this.head = head;
    this.tail = tail;
    this.length = length;
    this.elasticity = elasticity;
  }
}

class Score extends Ability {
  constructor(step) {
    super();
    autoBind(this);
    this.name = 'score';
    this.score = 0;
    this.step = step || 1;
  }

  add(points) {
    this.score = this.score + points;
    return this.score;
  }

  sub(points) {
    this.score = this.score - points;
    this.score = this.score < 0 ? 0 : this.score;
    return this.score;
  }

  update(action, params) { }

  reset() {
    this.score = 0;
    return this.score;
  }
}

class Experience extends Ability {
  constructor(config) {
    super();
    autoBind(this);
    this.name = 'experience';
    this.xp = 0;
  }

  update(score) {
    this.xp = Math.floor(score / 100);
    return this.xp;
  }

  add(xp) {
    this.xp = this.xp + xp || 1;
    return this.xp;
  }

  sub(xp) {
    this.xp = this.xp - xp || 1;
    this.xp = this.xp < 0 ? 0 : this.xp;
    return this.xp;
  }

  reset() {
    this.xp = 0;
    return this.xp;
  }
}

class Rank extends Ability {
  constructor(config) {
    super();
    autoBind(this);
    this.name = 'rank';
    this.rank = 0;
    this.ranks = {
      1: 1000,
    };
    this.threshold = 1000;
    this.config = config || 1000;
    if (typeof this.config === 'number') {
      this.threshold = this.config;
    } else {
      this.ranks = this.config;
      this.threshold = this.ranks['1'];
    }
  }

  update(score) {
    if (this.rank < Object.keys(this.ranks).length) {
      if (score >= this.threshold) {
        this.raise();
        this.threshold = this.ranks[this.rank + 1];
      }
    }
  }

  raise() {
    this.rank = this.rank + 1;
    return this.rank;
  }

  drop() {
    this.rank = this.rank - this.step;
    this.renk = this.rank < 0 ? 0 : this.rank;
    return this.rank;
  }

  reset() {
    this.rank = 0;
    return this.rank;
  }
}

class Power extends Ability {
  constructor(max) {
    super();
    autoBind(this);
    this.name = 'power';
    this.max = max || 100;
    this.power = this.max;
  }

  addPercent(percent) {
    this.power = this.power + percent;
    return this.add(this.max * (percent * 100));
  }

  subPercent(percent) {
    this.power = this.power + percent;
    return this.sub(this.max * (percent * 100));
  }

  add(points) {
    this.power = this.power + points;
    this.power = this.power <= this.max ? this.power : this.max;
    return this.power;
  }

  sub(points) {
    this.power = this.power - points;
    this.power = this.power < 0 ? 0 : this.power;
    return this.power;
  }

  update(action, params) { }

  reset() {
    this.power = this.max;
    return this.power;
  }
}

class Health extends Ability {
  constructor(max) {
    super();
    autoBind(this);
    this.name = 'health';
    this.max = max || 100;
    this.health = this.max;
  }

  addPercent(percent) {
    this.health = this.health + percent;
    return this.add(this.max * (percent * 100));
  }

  subPercent(percent) {
    this.health = this.health + percent;
    return this.sub(this.max * (percent * 100));
  }

  add(points) {
    this.health = this.health + points;
    this.health = this.health <= this.max ? this.health : this.max;
    return this.health;
  }

  sub(points) {
    this.health = this.health - points;
    this.health = this.health < 0 ? 0 : this.health;
    return this.health;
  }

  update(action, params) { }

  reset() {
    this.health = this.max;
    return this.health;
  }
}

class Camera extends Ability {
  constructor(pos, id) {
    super();
    autoBind(this);
    this.pos = pos || new Shapes.Vect(200, 200);
    this.name = 'camera';
    this.id = id || 'default';
  }

  update(player) {
    this.pos = new Shapes.Vect(
      player.abilities.position.pos.x,
      player.abilities.position.pos.y,
      player.abilities.position.pos.z,
    );
  }
}

// view port is not updateding as it should fix it;
class Viewport extends Ability {
  constructor(width, height, theCamera) {
    super();
    autoBind(this);
    this.name = 'viewport';
    this.width = width || 400;
    this.height = height || 400;
    this.cameras = {};
    const camera = theCamera || new Camera();
    // let cameraId = camera.id;
    this.cameras[camera.id] = camera;
    this.visibleThings = [];
  }

  addCamera(newCamera) {
    this.cameras[newCamera.id] = newCamera;
    return this.cameras;
  }

  removeCamera(cameraId) {
    if (!this.cameras[cameraId]) {
      return false;
    }
    delete this.cameras[cameraId];
    return true;
  }

  update(player) {
    Object.keys(this.cameras).forEach((cameraId) => {
      if (this.cameras[cameraId].pos.x < this.width / 2) {
        this.cameras[cameraId].pos.x = this.width / 2;
      }
      if (this.cameras[cameraId].pos.y < this.height / 2) {
        this.cameras[cameraId].pos.y = this.height / 2;
      }

      if (this.cameras[cameraId].pos.x > 2000 - this.width / 2) {
        this.cameras[cameraId].pos.x = 2000 - this.width / 2;
      }
      if (this.cameras[cameraId].pos.y > 2000 - this.height / 2) {
        this.cameras[cameraId].pos.y = 2000 - this.height / 2;
      }
    });
  }
}

module.exports = {
  Ability,
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
  Aabb,
  Score,
  Experience,
  Rank,
  Power,
  Health,
  Camera,
  Viewport,
};
