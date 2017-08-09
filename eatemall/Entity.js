const UUID = require('node-uuid');
const Shapes = require('./Shapes.js');

const Abilities = require('./Abilities.js');

var Entity = function(name = 'noname') {
    this.id = UUID();
    this.name = name;
    this.socket_id = false;

    this.actions = [];
    // Array.pop will remove this action once its applied
    this.addAction = function(action, params = {}) {
        this.actions.push({ name: action, params: params });
    };

    this.abilities = {};
    this.has = (ability) => {
        return this.abilities.hasOwnProperty(ability) ? this.abilities[ability] : false;
    }
    this.attach = function(ability) {
        if (ability.constructor.name === 'Ability') {
            this.abilities[ability.name] = ability;
        }
    }

    this.update = () => {
        var pos = this.abilities.position.pos;
        var vel = this.abilities.velocity.vel;
        this.abilities.position.pos = Object.assign({}, pos, { x: pos.x + vel.x, y: pos.y + vel.y });
    };

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


module.exports = exports = Entity;