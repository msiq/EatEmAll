const UUID = require('node-uuid');
const Entity = require('./Entity.js');
const Shapes = require('./Shapes.js');

Player = function (name, options = {}) {
  // console.log(options.shape.constructor.name, options.shape);
  const uuid = UUID();
  // Set up basic player
  this.name = name;
  this.id = uuid;
  this.rad = 10;
  this.color = 'red';

  this.shape = typeof options.shape === Object ? 'options.shape' : 'yes'; // new Shapes.Circ(10, new Shapes.Vect(20, 20));

  // console.log('-------------------------------------', this);
  // Set initial palyer state
  // this.currentState = new PlayerState.init(this);

  this.setState = function (newState) {
    this.currentState = newState;
  };
  this.setSocket = function (socketId) {
    this.socketId = socketId;
  };
};

// Player.prototype = new Entity;

module.exports = exports = Player;
