const Type = {
  INPUT: 'input',
  MOTION: 'motion',
  PHYSICS: 'physics',
  SCORE: 'score',
  COLLISION: 'collision',
};

function Message(type, entities = [], params = {}) {
  this.type = type;
  this.entities = entities;
  this.params = params;
}

function MessageBus(game) {
  this.game = game;
  this.messages = [];

  this.add = (message) => {
    this.messages.push(message);
    // console.log(this.messages)
  };
  this.getNext = () => (this.isEmpty() ? false : this.messages.pop());
  this.isEmpty = () => this.messages.length === 0;
}

module.exports = {
  Type,
  Message,
  MessageBus,
};
