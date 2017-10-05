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
    };
    this.update = function(player) {
        // console.log(this.name + ' is updating!...');
    };
    this.postUpdate = function(player) {
        // this.entities.forEach(function (entity) {
        //     if (entity.has('position')) {
        //         entity.abilities.position.pos = this.limit(entity.abilities.position.pos);
        //     }
        // }, this);
    };
    this.entities = [];
    this.AddEntity = (entity) => this.entities.push(entity);

    this.last = {};
    // this.now = 0;
    this.debounce = (wait, entityId) => {
        // this.now = Date.now();
        let canCall = ((Date.now() - this.last[entityId]) > wait) ? true : false;
        this.last[entityId] = (canCall) ? Date.now() : (this.last[entityId]) ? this.last[entityId] : 0;

        return canCall;
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
        up: (v, c) => new Shapes.Vect(v.x, v.y - c, v.z),
        down: (v, c) => new Shapes.Vect(v.x, v.y + c, v.z),
        left: (v, c) => new Shapes.Vect(v.x - c, v.y, v.z),
        right: (v, c) => new Shapes.Vect(v.x + c, v.y, v.z),
    };

    // this.toRadians = (angle) => angle * (Math.PI / 180);

    // this.rotate = (entity, deg) => {
    //     if (entity.has('orientation')) {
    //         let ort = entity.abilities.orientation.orientation;
    //         let cos = Math.cos(this.toRadians(deg));
    //         let sin = Math.sin(this.toRadians(deg));
    //         let newDir = new Shapes.Vect(ort.x * cos - ort.y * sin, ort.x * sin + ort.y * cos, 0);
    //         entity.abilities.orientation.orientation = newDir.unit();
    //     }
    // };

    this.handleMessage = (message) => {
        if (message.type == this.name) {

            if (this.actions[message.params.action]) {
                message.entities.forEach((eid) => {
                    let entity = this.game.searchEntity(eid, 'players');

                    if (entity.has('velocity')) {
                        let vel = entity.abilities.velocity.velocity;

                        if (entity.has('orientation')) {

                            let ort = entity.abilities.orientation.orientation;
                            switch (message.params.action) {
                                case 'left':
                                    entity.abilities.orientation.rotate(-5);
                                    break;
                                case 'right':
                                    entity.abilities.orientation.rotate(5);
                                    break;
                                case 'up':
                                    entity.abilities.velocity.velocity = vel.add(ort.multi(1));
                                    return;
                                    break;
                                case 'down':
                                    entity.abilities.velocity.velocity = vel.sub(ort.multi(1));
                                    return;
                                    break;
                            }

                        } else {
                            entity.abilities.velocity.velocity = this.actions[message.params.action](entity.abilities.velocity.velocity, 1);
                        }
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
            // Update postion of entities
            if (entity.has('velocity')) {
                let velo = entity.abilities.velocity.velocity


                //apply new velocity to the direction
                if (entity.has('orientation')) {
                    let ort = entity.abilities.orientation.orientation;
                    // let newDir = ort.sub(entity.abilities.velocity.velocity.unit()).unit();
                    // console.log(
                    //     ort,
                    //     velo,
                    //     '-------------------------------------------------------------------------'
                    // );

                    entity.abilities.velocity.velocity =
                        // entity.abilities.velocity.velocity.multi(entity.abilities.velocity.velocity.dot(ort));
                        new Shapes.Vect(
                            ort.x * entity.abilities.velocity.velocity.dot(ort),
                            ort.y * entity.abilities.velocity.velocity.dot(ort),
                            ort.z * 0
                        );
                }

                // move entity towords velocity
                let pos = entity.abilities.position.pos;
                if (velo.mag() > 0.5) {
                    entity.abilities.position.pos = new Shapes.Vect(
                        pos.x + velo.x,
                        pos.y + velo.y,
                        pos.z + velo.z
                    );
                }

            }


            // /** Apply gravity */
            // if (entity.has('gravity') && entity.has('velocity')) {
            //     let g = entity.has('gravity') ? entity.abilities.gravity.gravity : Shapes.Vect;
            //     let vel = entity.abilities.velocity.velocity;
            //     entity.abilities.velocity.velocity = new Shapes.Vect(
            //         vel.x + g.x,
            //         vel.y + g.y,
            //         vel.z + g.z
            //     );
            // }

        }, this);
    };
    this.postUpdate = function() {
        this.checkLimits();
    };
    this.checkLimits = function() {
        this.entities.forEach(function(entity) {
            if (entity.has('position')) {
                this.limit(entity);
            }
        }, this);
    };
    this.limit = (entity) => {
        let pos = entity.abilities.position.pos;
        let radius = entity.abilities.body.shape.radius;
        let vel = entity.abilities.velocity.velocity;

        let dirChanged = false;
        if (pos.x <= radius + vel.x) {
            pos.x = radius + 0.1;
            vel.x = vel.x * -1;
            dirChanged = true;
        }
        if (pos.x >= config.canvas.width - (radius + vel.x)) {
            pos.x = config.canvas.width - radius;
            vel.x = vel.x * -1;
            dirChanged = true;
        }

        if (pos.y <= radius + vel.y) {
            pos.y = radius + 0.1;
            vel.y = vel.y * -1;
            dirChanged = true;
        }
        if (pos.y >= config.canvas.height - (radius + vel.y)) {
            pos.y = config.canvas.height - radius;
            vel.y = vel.y * -1;
            dirChanged = true;
        }
        entity.abilities.position.pos = pos;
        entity.abilities.velocity.velocity = vel;


        if (entity.has('orientation') && entity.has('velocity') && dirChanged) {
            if (entity.abilities.velocity.velocity.mag() > 0.5) {
                entity.abilities.orientation.orientation = entity.abilities.velocity.velocity.unit();
            }
        }
    };
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
    };

    this.update = () => {


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

        this.entities.forEach((entity) => {

            // /** Apply gravity */
            // if (entity.has('gravity') && entity.has('velocity')) {
            //     let g = entity.has('gravity') ? entity.abilities.gravity.gravity : Shapes.Vect;
            //     let vel = entity.abilities.velocity.velocity;
            //     entity.abilities.velocity.velocity = new Shapes.Vect(
            //         vel.x + g.x,
            //         vel.y + g.y,
            //         vel.z + g.z
            //     );
            // }


            // apply all forces
            if (this.debounce(1000, entity.id)) {
                // apply environmental forces 
                if (entity.has('velocity') && !entity.abilities.velocity.velocity.empty()) {
                    let vel = entity.abilities.velocity.velocity;
                    let air = vel.multi(config.env.airResistance);
                    let surface = vel.multi(config.env.surfaceResistance);
                    vel = vel.sub(air).sub(surface);
                    entity.abilities.velocity.velocity = vel;
                }
            }


            // this is not finished yet
            // fix strings here
            // console.log(entity.name);
            if (entity.has('string') && false) {

                let stringConn = entity.abilities.string;
                // console.log(stringConn);
                if (entity.id == stringConn.tail) {

                    let head = this.game.getEntityById(stringConn.head);
                    let distance = entity.distance(head);
                    // > stringConn.distance;
                    // console.log(head);
                    console.log(distance);
                    console.log(distance.mag, stringConn.length);

                    if (distance.mag < stringConn.length - 5) {
                        console.log('------------------------------------------------------------------------------------------------------->>>>>>>>');
                        entity.abilities.velocity.velocity.x += (stringConn.elasticity / distance.mag) * 100;
                        entity.abilities.velocity.velocity.y += (stringConn.elasticity / distance.mag) * 100;
                        entity.abilities.velocity.velocity.z = 0;
                    }
                    if (distance.mag > stringConn.length + 5) {
                        console.log('------------------------------------------------------------------------------------------------------<<<<<<<<<<');
                        entity.abilities.velocity.velocity.x += (stringConn.elasticity / distance.mag) * 100;
                        entity.abilities.velocity.velocity.y += (stringConn.elasticity / distance.mag) * 100;
                        entity.abilities.velocity.velocity.z = 0;
                    }
                }
            }
        });
    };
    this.handleMessage = (message) => {

        if (message.type == this.name) {
            // console.log(this.name);
            console.log(message);
            // console.log('----------->>>>>>>>>>>>>>>>>>>>>><<<<<<<<' + message.type + '   ' + this.game.messageBus.messages.length);
            if (this.actions[message.params.action]) {
                message.entities.forEach((eid) => {
                    let entity = this.game.searchEntity(eid, 'players');
                    if (entity.has('gravity')) {

                        // console.log('-------------+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
                        // console.log(entity.abilities.gravity.gravity);
                        entity.abilities.gravity.gravity = this.actions[message.params.action](message.params.gravity);
                        // console.log('-------------+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
                        // console.log(entity.abilities.gravity.gravity);
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

        this.entities.filter((entity) => entity.has('cor')).forEach((entity) => {

            if (entity.has('collidable')) {

                this.entities.forEach((object) => {

                    if (entity.id != object.id) {

                        if (object.has('collidable')) {
                            // console.log('tesing 111111111111111111111111111111111111111111111--' + entity.id + '---------' + object.id);
                            if (this.collisionTest(entity, object)) {
                                entity.abilities.body.color = "#ff0000";
                                object.abilities.body.color = "#ff0000";

                                if (entity.has('velocity')) {

                                    if (entity.abilities.collidable.collidingWith.indexOf(entity.id) >= 0) {
                                        console.log('..............................................................................');
                                        return;
                                    }

                                    let ePos = entity.abilities.position.pos;
                                    let enMass = entity.abilities.mass.mass;
                                    let oPos = object.abilities.position.pos;
                                    let obMass = object.abilities.mass.mass;
                                    let eVal = entity.abilities.velocity.velocity;
                                    let oVal = (object.has('velocity')) ? object.abilities.velocity.velocity : new Shapes.Vect();


                                    entity.abilities.position.pos = ePos.sub(eVal);

                                    console.log(
                                        eVal.x + ' ___ ' +
                                        eVal.y + ' ___ ' +
                                        enMass + ' ___ ' +

                                        obMass + ' ___ ' +
                                        oVal.x + ' ___ ' +
                                        oVal.y
                                    );


                                    let enValX = ((eVal.x * (enMass - obMass)) + (2 * obMass * oVal.x)) / (enMass + obMass);
                                    let enValY = ((eVal.y * (enMass - obMass)) + (2 * obMass * oVal.y)) / (enMass + obMass);
                                    let obValX = ((oVal.x * (obMass - enMass)) + (2 * enMass * eVal.x)) / (enMass + obMass);
                                    let obValY = ((oVal.y * (obMass - enMass)) + (2 * enMass * eVal.y)) / (enMass + obMass);


                                    console.log(enValX, enValY);
                                    console.log(obValX, obValY);

                                    entity.abilities.velocity.velocity = new Shapes.Vect(
                                        x = enValX,
                                        y = enValY,
                                        z = 0
                                    );


                                    if (object.has('velocity')) {
                                        object.abilities.velocity.velocity = new Shapes.Vect(
                                            x = obValX,
                                            y = obValY,
                                            z = 0
                                        );
                                    }

                                    entity.abilities.collidable.collidingWith.push(object.id);
                                    object.abilities.collidable.collidingWith.push(entity.id);

                                    if (entity.has('orientation')) {
                                        entity.abilities.orientation.orientation = entity.abilities.velocity.velocity.unit();
                                    }

                                    if (object.has('orientation') && object.has('velocity')) {
                                        object.abilities.orientation.orientation = object.abilities.velocity.velocity.unit();
                                    }


                                    return 'this is returning';



                                    let plrPos = entity.abilities.position.pos;
                                    let obPos = object.abilities.position.pos;
                                    let oval = entity.abilities.velocity.velocity;


                                    // get vector parpendiculer to colliding surface
                                    // circle center to touching point gives us this direction vector
                                    // objects pos is circle center point




                                    // get reflection or to that vector

                                    // new direction is 2 * reflection vector


                                    entity.abilities.velocity.velocity = new Shapes.Vect(
                                        x = plrPos.x - obPos.x,
                                        y = plrPos.y - obPos.y,
                                        z = 0
                                    );

                                    if (entity.has('orientation')) {
                                        entity.abilities.orientation.orientation = entity.abilities.velocity.velocity.unit();
                                    }

                                    return;


                                    let lineToCenter = new Shapes.Vect(
                                        x = plrPos.x - obPos.x,
                                        y = plrPos.y - obPos.y,
                                        z = 0
                                    );

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
                                entity.abilities.collidable.collidingWith = [];

                                // if (entity.has('gravity') && entity.has('velocity')) {
                                //     entity.abilities.gravity.gravity = new Shapes.Vect(0, 0.5);
                                // }
                                entity.abilities.body.color = entity.abilities.body.originalColor;
                                object.abilities.body.color = object.abilities.body.originalColor;
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
        let entityRad = entity.abilities.body.shape.radius;
        let objectPos = object.abilities.position.pos;
        let objectRad = object.abilities.body.shape.radius;

        let eVal = entity.abilities.velocity.velocity;

        // add velocity in position to calculate collision before it happens
        // So we have more time to react
        entityPos = new Shapes.Vect(
            entityPos.x + eVal.x,
            entityPos.y + eVal.y,
            entityPos.z + eVal.z
        );

        var dx = entityPos.x - objectPos.x;
        var dy = entityPos.y - objectPos.y;
        depth = entityRad + objectRad - Math.sqrt(dx * dx + dy * dy);
        if (depth > -1) {
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

            physics: new Physics(game),

            motion: new Motion(game),


            renderer: new Renderer(game),
        };
    };