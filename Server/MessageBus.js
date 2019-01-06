const Type = {
  INPUT: 'input',
  MOTION: 'motion',
  PHYSICS: 'physics',
  SCORE: 'score',
  COLLISION: 'collision',
};
Object.freeze(Type);

class Message {
  constructor(type, entities = [], params = {}) {
    this.type = type;
    this.entities = entities;
    this.params = params;
  }
}

class MessageBus {
  constructor(game) {
    this.game = game;
    this.messages = [];
  }

  add(message) {
    this.messages.push(message);
  }

  getNext() {
    return this.isEmpty() ? false : this.messages.pop();
  }

  isEmpty() {
    return this.messages.length === 0;
  }
}

module.exports = {
  Type,
  Message,
  MessageBus,
};
