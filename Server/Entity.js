/* eslint-disable class-methods-use-this */
const UUID = require('node-uuid');
// const Shapes = require('./Shapes.js');
// const config = require('./config.js');

const Abilities = require('./Abilities.js');

class Entity {
  constructor(name = 'noname') {
    this.TYPE_DEFAULT = 'default';
    this.TYPE_MAIN = 'main';
    this.id = UUID();
    this.name = name;
    this.socket_id = false;
    this.type = 'default';
    this.grounded = false;

    this.actions = [];
    this.abilities = {};
    // this.abilities[Abilities.Orientation.name] = new Abilities.Orientation();
  }
  // Array.pop will remove this action once its applied

  addAction(action, params = {}) {
    this.actions.push({ name: action, params });
  }

  has(ability) {
    return Object
      .prototype
      .hasOwnProperty
      .call(this.abilities, ability) ? this.abilities[ability] : false;
  }

  attach(ability) {
    if (ability instanceof Abilities.Ability) {
      this.abilities[ability.name] = ability;
    }

    if (ability.name === 'body') {
      this.attach(new Abilities.Aabb(ability));
    }
  }

  distance(entity) {
    const thisPos = this.abilities.position.pos;
    const enPos = entity.abilities.position.pos;
    const deltaX = thisPos.x - enPos.x;
    const deltaY = thisPos.y - enPos.y;

    return {
      x: deltaX,
      y: deltaY,
      z: 0,
      mag: Math.sqrt(deltaX * deltaX + deltaY * deltaY),
    };
  }

  update() {
    // if (this.debounce(1000)) {
    //     let vel = this.abilities.velocity.velocity;
    //     this.abilities.velocity.velocity = Object.assign({}, vel, {
    //         x: this.applyEase(vel.x, config.player.ease),
    //         y: this.applyEase(vel.y, config.player.ease),
    //         z: this.applyEase(vel.z, config.player.ease),
    //     });
    // }
  }

  // this.applyEase = function(val, ease) {
  //     if (val !== 0) {
  //         if (val > 0) {
  //             val = val - ease;
  //         } else {
  //             val = Math.abs(val) - ease;
  //             if (val < 0) {
  //                 val = 0;
  //             } else {
  //                 val = val * -1;
  //             }
  //         }
  //     }

  //     return Number(val.toFixed(2));
  // }
  // this.limit = function(value) {
  //     return (Math.abs(value) > 0) ? value : 0;
  // }

  // this.last = 0;
  // this.now = 0;
  // this.debounce = (wait) => {
  //     this.now = Date.now();
  //     let canCall = ((this.now - this.last) > wait) ? true : false;
  //     // console.log('-------------------------------------->', canCall, this.last, this.now);
  //     this.last = (canCall) ? Date.now() : this.last;

  //     return canCall;
  // }

  // this.createPlayer = function(name, shape, color = 'blue') {

  //     console.log(arguments);
  //     var player = new Entity(name);
  //     player.attach(new Abilities.Body(shape, color));

  //     return player;
  // }

  // this.createEnemy = function() {
  //     var enemy = new Entity();
  //     enemy.attach(new Abilities.Body());

  //     return enemy;
  // }
}

module.exports = Entity;
