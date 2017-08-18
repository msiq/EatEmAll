const Shapes = require('./Shapes.js');
const MessageSystem = require('./MessageBus.js');
const config = require('./config.js');

var ops = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
}

function SubSystem(game) {
    this.game = game;
    this.name = 'SubSystem';
    this.update = function(player) {
        // console.log(this.name + ' is updating!...');
    }
    this.entities = [];
    this.AddEntity = (entity) => this.entities.push(entity);

    this.last = 0;
    this.now = 0;
    this.debounce = (wait) => {
        this.now = Date.now();
        let canCall = ((this.now - this.last) > wait) ? true : false;
        // console.log('-------------------------------------->', canCall, this.last, this.now);
        this.last = (canCall) ? Date.now() : this.last;

        return canCall;
    }
}

function Input(game) {
    this.game = game;
    this.name = 'input';
    this.actions = {
        '38': 'up',
        '40': 'down',
        '37': 'left',
        '39': 'right',
        // 'click': 'click'
    };
    this.handle = function(event) {
        if (this.actions[event.action]) {
            this.game.messageBus.add(
                new MessageSystem.Message(
                    MessageSystem.Type.MOTION, [event.playerId],
                    Object.assign({}, event.params, { action: this.actions[event.action] })
                )
            );
            // game.searchEntity(event.playerId, 'players').addAction(this.actions[event.action], event.params);
        }
    };

    this.update = () => {

    };
}
Input.prototype = new SubSystem;

/** Get */
function Motion(game) {
    this.game = game;
    this.name = 'motion';
    this.actions = {
        up: (v, c) => Object.assign({}, v, { y: v.y - c }),
        down: (v, c) => Object.assign({}, v, { y: v.y + c }),
        left: (v, c) => Object.assign({}, v, { x: v.x - c }),
        right: (v, c) => Object.assign({}, v, { x: v.x + c }),
    };
    this.update = function() {
        if (!this.game.messageBus.isEmpty()) {
            let message = this.game.messageBus.messages[this.game.messageBus.messages.length - 1];
            console.log(message);
            let action = this.actions[message.params.action];
            console.log(action);
            if (typeof action == 'function') {
                message.entities.forEach((eid) => {
                    let entity = this.game.searchEntity(eid, 'players');
                    entity.abilities.velocity.velocity = action(entity.abilities.velocity.velocity, 1);
                });

                this.game.messageBus.messages.pop();
            }
        }

        this.entities.forEach(function(entity) {
            // if (entity.actions.length > 0) {
            //     let action = this.actions[entity.actions[entity.actions.length - 1].name];
            //     console.log(entity.actions);
            //     if (typeof action == 'function') {
            //         entity.abilities.velocity.velocity = action(entity.abilities.velocity.velocity, 1);
            //         entity.actions.pop();
            //     }
            // }

            /**
             * Update postion of entities
             */
            let g = entity.has('gravity') ? entity.abilities.gravity.gravity : Shapes.Vect;
            let pos = entity.abilities.position.pos;
            let vel = entity.abilities.velocity.velocity;
            entity.abilities.position.pos = Object.assign({}, pos, {
                x: Number((pos.x + vel.x + g.x).toFixed(2)),
                y: Number((pos.y + vel.y + g.y).toFixed(2)),
                z: Number((pos.z + vel.z + g.z).toFixed(2))
            });



            vel = entity.abilities.velocity.velocity;
            let debounceTime = Math.max(...Object.keys(vel).map(val => Math.abs(vel[val]))) * 10;
            if (this.debounce(debounceTime)) {

                entity.abilities.velocity.velocity = Object.assign({}, vel, {
                    x: this.applyEase(vel.x, config.player.ease),
                    y: this.applyEase(vel.y, config.player.ease),
                    z: this.applyEase(vel.z, config.player.ease),
                });
            }

            entity.abilities.position.pos = this.limit(entity.abilities.position.pos);

        }, this);

        console.log(this.name + ' issssssssss updateding!.....');
    };
    this.limit = (pos) => {
        return Object.assign({},
            pos, {
                x: pos.x < 0 ? 0 : (pos.x > config.canvas.width) ? config.canvas.width : pos.x,
                y: pos.y < 0 ? 0 : (pos.y > config.canvas.height) ? config.canvas.height : pos.y,
                z: pos.z < 0 ? 0 : (pos.z > config.canvas.height) ? config.canvas.height : pos.z,
            }
        )
    }
    this.applyEase = function(val, ease) {
        if (val !== 0) {
            if (val > 0) {
                val = val - ease;
            } else {
                val = Math.abs(val) - ease;
                if (val < 0) {
                    val = 0;
                } else {
                    val = val * -1;
                }
            }
        }

        return Number(val.toFixed(2));
    }
}
Motion.prototype = new SubSystem;

function Physics(game) {
    this.game = game;
    this.name = 'physics';
}
Physics.prototype = new SubSystem;

function Renderer(game) {
    this.game = game;
    this.name = 'renderer';
}
Renderer.prototype = new SubSystem;

function Collision(game) {
    this.game = game;
    this.name = 'collision';
}
Collision.prototype = new SubSystem;


module.exports =
    exports = function SubSystem(game) {
        return {
            motion: new Motion(game),
            collision: new Collision(game),
            input: new Input(game),
            renderer: new Renderer(game),
            physics: new Physics(game),
        };
    };