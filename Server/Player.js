const UUID = require('node-uuid');
// const Entity = require('./Entity.js');
// const Shapes = require('./Shapes.js');

const Player = (name, options = {}) => {
  // console.log(options.shape.constructor.name, options.shape);
  const uuid = UUID();
  // Set up basic player
  this.name = name;
  this.id = uuid;
  this.rad = 10;
  this.color = 'red';

  this.shape = typeof options.shape === 'object' ? 'options.shape' : 'yes'; // new Shapes.Circ(10, new Shapes.Vect(20, 20));

  // console.log('-------------------------------------', this);
  // Set initial palyer state
  // this.currentState = new PlayerState.init(this);

  this.setState = (newState) => {
    this.currentState = newState;
  };
  this.setSocket = (socketId) => {
    this.socketId = socketId;
  };
};

module.exports = Player;
