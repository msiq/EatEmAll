const Type = {
  INPUT: 'input',
  MOTION: 'motion',
  PHYSICS: 'physics',
  SCORE: 'score',
  COLLISION: 'collision',
};
Object.freeze(Type);

/**
 * Create new Message:
 * new MessageSystem.Message(systemName, entities, params)
 *
 * Send Message:
 * game.messageBus.add(new Message(....))
 */
class Message {
  /**
   * @param {string} type name of the system message intended to
   * @param {array} entities Array of entities that message should effect
   * @param {object} params Object contains key:value info needed for this message to complete
   */
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
