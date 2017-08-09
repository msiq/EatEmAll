const Shapes = require('./Shapes.js');

function SubSystem() {
    this.name = 'SubSystem';
    this.update = function(player) { console.log(this.name + ' is updated!.....'); }
    this.entities = [];
    this.AddEntity = (entity) => this.entities.push(entity);
}

function Input() {
    this.name = 'input';
    this.actions = {
        '38': 'up',
        '40': 'down',
        '37': 'left',
        '39': 'right',
    };
    this.handle = (game, event) => {

        if (this.actions[event.action]) {
            game.searchEntity(event.playerId, 'players').addAction(this.actions[event.action], event.params);
        }
    };

    this.update = () => {

    };
}
Input.prototype = new SubSystem;

/** Get */
function Motion() {
    this.name = 'motion';
    this.update = function() {
        console.log(this.entities);
        this.entities.forEach(function(entity) {
            if (action = entity.actions.pop()) {
                console.log(action);
                if (this.hasOwnProperty(action.name)) {
                    entity = this[action.name](entity);
                }
            }

        }, this);

        console.log(this.name + ' issssssssss updateding!.....');
    };
    this.up = function(entity) {
        var vel = entity.abilities.velocity.vel;
        entity.abilities.velocity.vel = Object.assign({}, vel, { y: vel.y - 1 });
        return entity;
    };
    this.down = function(entity) {
        var vel = entity.abilities.velocity.vel;
        entity.abilities.velocity.vel = Object.assign({}, vel, { y: vel.y + 1 });
        return entity;
    };
    this.right = function(entity) {
        var vel = entity.abilities.velocity.vel;
        entity.abilities.velocity.vel = Object.assign({}, vel, { x: vel.x + 1 });
        return entity;
    };
    this.left = function(entity) {
        var vel = entity.abilities.velocity.vel;
        entity.abilities.velocity.vel = Object.assign({}, vel, { x: vel.x - 1 });
        return entity;
    };
}
Motion.prototype = new SubSystem;

function Collision() {
    this.name = 'collision';
}
Collision.prototype = new SubSystem;


module.exports =
    exports = {
        motion: new Motion(),
        collision: new Collision(),
        input: new Input(),
    };