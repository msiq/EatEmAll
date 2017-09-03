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
    this.actions = {};
    this.preUpdate = function(player) {
        // console.log(this.name + ' is preeeeeeeeeeeeeee updating!...');
    }
    this.update = function(player) {
        // console.log(this.name + ' is updating!...');
    }
    this.postUpdate = function(player) {
        this.entities.forEach(function(entity) {
            if (entity.has('position')) {
                entity.abilities.position.pos = this.limit(entity.abilities.position.pos);
            }
        }, this);
    }
    this.entities = [];
    this.AddEntity = (entity) => this.entities.push(entity);

    this.last = 0;
    this.now = 0;
    this.debounce = (wait) => {
        this.now = Date.now();
        let canCall = ((this.now - this.last) > wait) ? true : false;
        this.last = (canCall) ? Date.now() : this.last;

        return canCall;
    };
    this.limit = (pos) => {
        return Object.assign({},
            pos, {
                x: pos.x < 0 ? 0 : (pos.x > config.canvas.width) ? config.canvas.width : pos.x,
                y: pos.y < 0 ? 0 : (pos.y > config.canvas.height) ? config.canvas.height : pos.y,
                z: pos.z < 0 ? 0 : (pos.z > config.canvas.height) ? config.canvas.height : pos.z,
            }
        )
    };

    this.handleMessage = (message) => {};
    this.getNextMessage = () => {
        //     if (!this.game.messageBus.isEmpty()) {
        //         let message = this.game.messageBus.messages[this.game.messageBus.messages.length - 1];
        //         if (typeof this.actions[message.params.action] !== undefined) {
        //             this.handle(message);
        //             // this.game.messageBus.messages.pop();
        //         }
        //     }

        //     return false;
    };
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
    this.handleMessage = (message) => {

        console.log(this.game.messageBus.messages.length);
        // if (!this.game.messageBus.isEmpty()) {
        if (message.type == this.name) {
            // console.log(this.name);
            // console.log(message);
            if (this.actions[message.params.input]) {
                this.game.messageBus.add(
                    new MessageSystem.Message(
                        MessageSystem.Type.MOTION, message.entities,
                        Object.assign({}, message.params, { action: this.actions[message.params.input] })
                    )
                );
            }
        }
        // console.log('----------->>>>>>>>>>>>>>>>>>>>>><<<<<<<<' + this.game.messageBus.messages.length);
        // }
    };
    // this.handle = function(event) {
    //     if (this.actions[event.action]) {
    //         this.game.messageBus.add(
    //             new MessageSystem.Message(
    //                 MessageSystem.Type.MOTION, [event.playerId],
    //                 Object.assign({}, event.params, { action: this.actions[event.action] })
    //             )
    //         );
    //         // game.searchEntity(event.playerId, 'players').addAction(this.actions[event.action], event.params);
    //     }
    // };

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
    this.handleMessage = (message) => {
        if (message.type == this.name) {
            console.log(this.name);
            console.log(message);
            if (this.actions[message.params.action]) {
                message.entities.forEach((eid) => {
                    let entity = this.game.searchEntity(eid, 'players');
                    if (entity.has('velocity')) {
                        entity.abilities.velocity.velocity = this.actions[message.params.action](entity.abilities.velocity.velocity, 1);
                    }
                });


                // this.game.messageBus.add(
                //     new MessageSystem.Message(
                //         MessageSystem.Type.MOTION, message.entities,
                //         Object.assign({}, message.params, { action: this.actions[message.action] })
                //     )
                // );
            }
        }
    };
    this.update = function() {

        // if (!this.game.messageBus.isEmpty()) {
        //     console.log('motiooooooooooooooooooooooooooooooooooooooooooonnnnnn');
        //     let message = this.game.messageBus.messages[this.game.messageBus.messages.length - 1];
        //     console.log(message);
        //     let action = this.actions[message.params.action];
        //     console.log(action);
        //     if (typeof action == 'function') {
        //         message.entities.forEach((eid) => {
        //             let entity = this.game.searchEntity(eid, 'players');
        //             if (entity.has('velocity')) {
        //                 entity.abilities.velocity.velocity = action(entity.abilities.velocity.velocity, 1);
        //             }
        //         });

        //         this.game.messageBus.messages.pop();
        //     }
        // }


        if (message = this.getNextMessage()) {

        }

        this.entities.forEach(function(entity) {

            // /**
            //  * Update postion of entities
            //  */
            // if (entity.has('gravity') && entity.has('velocity')) {
            //     let g = entity.has('gravity') ? entity.abilities.gravity.gravity : Shapes.Vect;
            //     let pos = entity.abilities.position.pos;
            //     let vel = entity.abilities.velocity.velocity;
            //     entity.abilities.position.pos = Object.assign({}, pos, {
            //         x: Number((pos.x + vel.x + g.x).toFixed(2)),
            //         y: Number((pos.y + vel.y + g.y).toFixed(2)),
            //         z: Number((pos.z + vel.z + g.z).toFixed(2))
            //     });
            // }



            if (entity.has('velocity')) {
                vel = entity.abilities.velocity.velocity;
                let debounceTime = Math.max(...Object.keys(vel).map(val => Math.abs(vel[val]))) * 10;
                if (this.debounce(debounceTime)) {

                    entity.abilities.velocity.velocity = Object.assign({}, vel, {
                        x: this.applyEase(vel.x, config.player.ease),
                        y: this.applyEase(vel.y, config.player.ease),
                        z: this.applyEase(vel.z, config.player.ease),
                    });
                }
            }

            // if (entity.has('position')) {
            //     entity.abilities.position.pos = this.limit(entity.abilities.position.pos);
            // }
        }, this);

        // console.log(this.name + ' issssssssss updateding!.....');---------------------------------------------------------------------------
    };
    // this.limit = (pos) => {
    //     return Object.assign({},
    //         pos, {
    //             x: pos.x < 0 ? 0 : (pos.x > config.canvas.width) ? config.canvas.width : pos.x,
    //             y: pos.y < 0 ? 0 : (pos.y > config.canvas.height) ? config.canvas.height : pos.y,
    //             z: pos.z < 0 ? 0 : (pos.z > config.canvas.height) ? config.canvas.height : pos.z,
    //         }
    //     )
    // }
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
    this.actions = {
        gravity: (g) => {
            console.log('ggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg');
            console.log(g);
            return g
        },
    }


    this.update = function() {
        // if (!this.game.messageBus.isEmpty()) {
        //     let message = this.game.messageBus.messages[this.game.messageBus.messages.length - 1];
        //     console.log(message);
        //     let action = this.actions[message.params.action];
        //     console.log(action);
        //     if (typeof action == 'function') {
        //         message.entities.forEach((eid) => {
        //             let entity = this.game.searchEntity(eid, 'players');
        //             if (entity.has('velocity')) {
        //                 entity.abilities.velocity.velocity = action(entity.abilities.velocity.velocity, 1);
        //             }
        //         });

        //         this.game.messageBus.messages.pop();
        //     }
        // }

        this.entities.forEach(function(entity) {
            /** Apply gravity */
            if (entity.has('gravity') && entity.has('velocity')) {
                let g = entity.has('gravity') ? entity.abilities.gravity.gravity : Shapes.Vect;
                let pos = entity.abilities.position.pos;
                let vel = entity.abilities.velocity.velocity;
                entity.abilities.position.pos = Object.assign({}, pos, {
                    x: Number((pos.x + vel.x + g.x).toFixed(2)),
                    y: Number((pos.y + vel.y + g.y).toFixed(2)),
                    z: Number((pos.z + vel.z + g.z).toFixed(2))
                });
            }
        });
    };
    this.handleMessage = (message) => {

        if (message.type == this.name) {
            console.log(this.name);
            console.log(message);
            console.log('----------->>>>>>>>>>>>>>>>>>>>>><<<<<<<<' + message.type + '   ' + this.game.messageBus.messages.length);
            if (this.actions[message.params.action]) {
                message.entities.forEach((eid) => {
                    let entity = this.game.searchEntity(eid, 'players');
                    if (entity.has('gravity')) {

                        console.log('-------------+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
                        console.log(entity.abilities.gravity.gravity);
                        entity.abilities.gravity.gravity = this.actions[message.params.action](message.params.gravity);
                        console.log('-------------+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
                        console.log(entity.abilities.gravity.gravity);
                    }
                });
            }
        }
    };
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
    this.update = function() {

        this.entities.filter((entity) => entity.has('gravity')).forEach((entity) => {

            if (entity.has('collidable')) {

                this.entities.forEach((object) => {

                    if (entity.id != object.id) {

                        if (object.has('collidable')) {
                            // console.log('tesing 111111111111111111111111111111111111111111111--' + entity.id + '---------' + object.id);
                            if (this.collisionTest(entity, object)) {
                                entity.abilities.body.color = "#ff0000";

                                if (entity.has('gravity') && entity.has('velocity')) {

                                    let plrPos = entity.abilities.position.pos;
                                    let obPos = object.abilities.position.pos;
                                    let oval = entity.abilities.velocity.velocity;




                                    entity.abilities.velocity.velocity = {
                                        x: plrPos.x - obPos.x,
                                        y: plrPos.y - obPos.y,
                                        z: 0
                                    };

                                    return;


                                    let lineToCenter = {
                                        x: plrPos.x - obPos.x,
                                        y: plrPos.y - obPos.y,
                                        z: 0,
                                    }

                                    let lineLength = Math.sqrt(
                                        lineToCenter.x * lineToCenter.x +
                                        lineToCenter.y * lineToCenter.y
                                    );

                                    // lineToCenter = {
                                    //     x: lineToCenter.x / lineLength,
                                    //     y: lineToCenter.y / lineLength,
                                    //     z: 0,
                                    // }

                                    // let dotProd = oval.x * lineToCenter.x + oval.y * lineToCenter.y;

                                    // let comp = {
                                    //     x: lineToCenter.x * dotProd,
                                    //     y: lineToCenter.y * dotProd,
                                    //     z: 0
                                    // }

                                    // entity.abilities.velocity.velocity = {
                                    //     x: oval.x - 2 * comp.x,
                                    //     y: oval.y - 2 * comp.y,
                                    //     z: 0
                                    // };



                                    // let originalVel = entity.abilities.velocity.velocity;
                                    // entity.abilities.velocity.velocity = {
                                    //     x: originalVel.x * Math.sin(180),
                                    //     y: originalVel.y * Math.cos(180),
                                    //     z: originalVel.z,

                                    // };

                                    // fix move action on collisions
                                    this.game.subSystems.physics.handleMessage(
                                        new MessageSystem.Message(MessageSystem.Type.PHYSICS, [entity.id], { action: 'gravity', gravity: new Shapes.Vect() })
                                    );
                                    // this.game.messageBus.add(
                                    //     new MessageSystem.Message(MessageSystem.Type.PHYSICS, [entity.id], { action: 'gravity', gravity: new Shapes.Vect() })
                                    // );
                                }



                            } else {

                                // if (entity.has('gravity') && entity.has('velocity')) {
                                //     entity.abilities.gravity.gravity = new Shapes.Vect(0, 0.5);
                                // }
                                entity.abilities.body.color = entity.abilities.body.originalColor;
                            }
                        }
                    }
                });
            }
        });
    }

    this.collisionTest = function(entity, object) {

        let touching = false;
        let colliding = false;
        let depth = 0;

        let entityPos = entity.abilities.position.pos;
        let entityRad = entity.abilities.body.shape.redius;
        let objectPos = object.abilities.position.pos;
        let objectRad = object.abilities.body.shape.redius;

        var dx = entityPos.x - objectPos.x;
        var dy = entityPos.y - objectPos.y;
        depth = entityRad + objectRad - Math.sqrt(dx * dx + dy * dy);
        if (depth > 5) {
            touching = true;
        }
        // if (depth > 5) {
        //     entityRad = entityRad + objectRad / 100;
        // }

        return touching;
        // if (touching) {
        //     // console.log('tesing collisions------------------------------------------------>>> ' + depth)
        //     entity.abilities.body.color = "#ff0000";
        // } else {
        //     entity.abilities.body.color = entity.abilities.body.originalColor;
        // }
    }
}
Collision.prototype = new SubSystem;


module.exports =
    exports = function SubSystem(game) {
        return {
            input: new Input(game),

            collision: new Collision(game),

            motion: new Motion(game),
            physics: new Physics(game),


            renderer: new Renderer(game),
        };
    };