const Type = {
    INPUT: 'input',
    MOTION: 'motion'
}

function Message(type, entities = [], params = {}) {
    this.type = type;
    this.entities = entities;
    this.params = params;
}

const MessageBus = function(game) {
    this.game = game;
    this.messages = [];

    this.add = (message) => this.messages.push(message);
    this.getNext = () => this.isEmpty() ? false : this.messages.pop();
    this.isEmpty = () => this.messages.length === 0;
}

module.exports =
    exports = {
        Type,
        Message,
        MessageBus
    };