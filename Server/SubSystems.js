/* eslint-disable class-methods-use-this */
const Shapes = require('./Shapes.js');
const MessageSystem = require('./MessageBus.js');
const config = require('./config.js');
const autoBind = require('auto-bind');

/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "[player|message]" }] */
/* eslint no-param-reassign:
  ["error", {
    "props": true,
      "ignorePropertyModificationsFor": ["entity", "object"],

    }]
*/

// const ops = {
//   '+': (a, b) => a + b,
//   '-': (a, b) => a - b,
// };

class SubSystem {
  constructor(game) {
    autoBind(this);
    this.game = game;
    this.name = 'SubSystem';
    this.actions = {};

    this.entities = [];
    this.last = {};
  }

  preUpdate(player) {
    // console.log(this.name + ' is preeeeeeeeeeeeeee updating!...');
  }

  update(player) {
    // console.log(this.name + ' is updating!...');
  }

  postUpdate(player) {
    // this.entities.forEach(function (entity) {
    //     if (entity.has('position')) {
    //         entity.abilities.position.pos = this.limit(entity.abilities.position.pos);
    //     }
    // }, this);
  }

  AddEntity(entity) {
    this.entities.push(entity);
  }

  debounce(wait, entityId) {
    const canCall = Date.now() - this.last[entityId] > wait;
    if (canCall) {
      this.last[entityId] = Date.now();
    } else {
      this.last[entityId] = this.last[entityId] ? this.last[entityId] : 0;
    }

    return canCall;
  }

  // eslint-disable-next-line class-methods-use-this
  handleMessage(message) { }

  getNextMessage() {
    //     if (!this.game.messageBus.isEmpty()) {
    //         let message = this.game.messageBus
    //           .messages[this.game.messageBus.messages.length - 1];
    //         if (typeof this.actions[message.params.action] !== undefined) {
    //             this.handle(message);
    //             // this.game.messageBus.messages.pop();
    //         }
    //     }
    //     return false;
  }
}

class Input extends SubSystem {
  constructor(game) {
    super();
    this.game = game;
    this.name = 'input';
    this.actions = {
      38: 'up',
      40: 'down',
      37: 'left',
      39: 'right',
      click: 'click',
      mousemove: 'drag',
    };
  }

  actionMapper(params) {
    if (params.action === 'keydown') {
      return this.actions[params.key];
    }

    return this.actions[params.action];
  }

  handleMessage(message) {
    if (message.type === this.name) {
      this.game.messageBus.add(
        new MessageSystem.Message(
          MessageSystem.Type.MOTION,
          message.entities,
          Object.assign({}, message.params, {
            action: this.actionMapper(message.params),
          }),
        ),
      );
    }
  }

  // this.handle = function(event) {
  //     if (this.actions[event.action]) {
  //         this.game.messageBus.add(
  //             new MessageSystem.Message(
  //                 MessageSystem.Type.MOTION, [event.playerId],
  //                 Object.assign({}, event.params, { action: this.actions[event.action] })
  //             )
  //         );
  //         // game.searchEntity(event.playerId, 'players')
  //         //  .addAction(this.actions[event.action], event.params);
  //     }
  // };
}

/** Get */
class Motion extends SubSystem {
  constructor(game) {
    super();
    autoBind(this);
    this.game = game;
    this.name = 'motion';
    this.actions = {
      up: (v, c) => new Shapes.Vect(v.x, v.y - c, v.z),
      down: (v, c) => new Shapes.Vect(v.x, v.y + c, v.z),
      left: (v, c) => new Shapes.Vect(v.x - c, v.y, v.z),
      right: (v, c) => new Shapes.Vect(v.x + c, v.y, v.z),
      click: mouse => new Shapes.Vect(mouse.x, mouse.y, 0),
      drag: mouse => new Shapes.Vect(mouse.x, mouse.y, 0),
    };
  }

  handleMessage(message) {
    if (message.type === this.name) {
      if (this.actions[message.params.action]) {
        message.entities.forEach((eid) => {
          const entity = this.game.searchEntity(eid, 'players');

          if (entity.has('velocity')) {
            let vel = entity.abilities.velocity.velocity;
            let { pos } = entity.abilities.position;

            if (entity.has('orientation')) {
              const ort = entity.abilities.orientation.orientation;
              switch (message.params.action) {
                case 'left':
                  entity.abilities.orientation.rotate(-5);
                  entity.abilities.aabb = new this.game.abilities.Aabb(
                    entity.abilities.body,
                  );
                  break;
                case 'right':
                  entity.abilities.orientation.rotate(5);
                  entity.abilities.aabb = new this.game.abilities.Aabb(
                    entity.abilities.body,
                  );
                  break;
                case 'up':
                  vel = vel.add(ort.multi(1 * this.game.delta));
                  break;
                case 'down':
                  vel = vel.sub(ort.multi(1 * this.game.delta));
                  break;
                case 'click':
                  pos = this.actions[message.params.action](
                    message.params.mouse,
                  );
                  vel = new Shapes.Vect();
                  break;
                case 'drag':
                  vel = this.actions[message.params.action](message.params.mouse).sub(pos);
                  break;
                default:
                  console.log(message.params.action);
              }
              entity.abilities.position.pos = pos;
            } else {
              vel = this.actions[message.params.action](vel, 1 * this.game.delta);
            }
            entity.abilities.velocity.velocity = vel;
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
  }

  update() {
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
    //                 entity.abilities.velocity.velocity = action(
    //                    entity.abilities.velocity.velocity,
    //                    1
    //                  );
    //             }
    //         });

    //         this.game.messageBus.messages.pop();
    //     }
    // }

    // let message = this.getNextMessage();
    // if (message) {
    // }

    this.entities.forEach((entity) => {
      // Update postion of entities
      if (entity.has('velocity')) {
        const velo = entity.abilities.velocity.velocity;

        // apply new velocity to the direction
        if (entity.has('orientation')) {
          // const ort = entity.abilities.orientation.orientation;
          // let newDir = ort.sub(entity.abilities.velocity.velocity.unit()).unit();
          // console.log(
          //     ort,
          //     velo,
          //     '-------------------------------------------------------------------------'
          // );

          /** *************************************************************************************
           * this was adding velcity only on objects direction. :( bad code
           */
          // entity.abilities.velocity.velocity =
          //     // entity.abilities.velocity.velocity.multi(
          //     //   entity.abilities.velocity.velocity.dot(ort)
          //     // );
          //     new Shapes.Vect(
          //         ort.x * entity.abilities.velocity.velocity.dot(ort),
          //         ort.y * entity.abilities.velocity.velocity.dot(ort),
          //         ort.z * 0
          //     );
        }
        // /** Apply gravity */
        if (
          entity.has('gravity')
          && entity.has('velocity')
          && !entity.grounded
        ) {
          // console.log('graaaaaaaaaaaaaaavity' + entity.name);
          const g = entity.abilities.gravity.gravity;
          const vel = entity.abilities.velocity.velocity;
          // const { pos } = entity.abilities.position;
          entity.abilities.velocity.velocity = vel.add(g.multi(this.game.delta));

          if (entity.grounded) {
            console.log(this.game.delta);
            console.log(g);
            console.log(g.multi(this.game.delta));

            console.log('------------------------------------------------');
            console.log(vel);
            console.log(vel.add(g.multi(this.game.delta)));
            // console.log(aljshdl)
          }
        }

        // move entity towords velocity
        const { pos } = entity.abilities.position;
        if (velo.mag() > 0.5) {
          entity.abilities.position.pos = new Shapes.Vect(
            pos.x + velo.x,
            pos.y + velo.y,
            pos.z + velo.z,
          );
        }
      }
    }, this);
  }

  postUpdate() {
    this.checkLimits();
  }

  checkLimits() {
    this.entities.forEach((entity) => {
      if (entity.has('position')) {
        this.limit(entity);
      }
    }, this);
  }

  limit(entity) {
    const { pos } = entity.abilities.position;
    let vel = entity.abilities.velocity.velocity;

    const { height } = entity.abilities.aabb;
    const { width } = entity.abilities.aabb;

    // const dirChanged = false;
    if (pos.x <= width.min + vel.x) {
      pos.x = width.min + 1;
      vel.x *= -1;
      // dirChanged = true;
    }
    if (pos.x >= config.canvas.width - (width.max + vel.x)) {
      pos.x = config.canvas.width - width.max + 1;
      vel.x *= -1;
      // dirChanged = true;
    }

    if (pos.y <= height.min + vel.y) {
      pos.y = height.min + 1;
      vel.y *= -1;
      // dirChanged = true;
    }
    if (pos.y >= config.canvas.height - (height.max + vel.y)) {
      pos.y = config.canvas.height - height.max;
      vel.y *= -0.5;

      if (vel.mag() < 1) {
        vel = new Shapes.Vect();
        entity.grounded = true;
      }

      /**
       * Handle ground resistence and other things
       *TODO: move it somewhere else
       */
      // pos.y = config.canvas.height - radius;
      // if (vel.mag() > 3) {
      //     // if (entity.name == 'plr') {
      //     //     console.log(vel);
      //     // }
      //     pos.y = config.canvas.height - radius; - 1;
      //     // vel.y = vel.y * -1;
      //     vel.y = vel.y * -(entity.abilities.cor.cor);
      //     let orgxvel = vel.x;
      //     vel.x = vel.x * ((entity.abilities.cor.cor * 99) / 100);
      //     // dirChanged = true;

      //     if (entity.name == 'plr') {
      //         console.log((entity.abilities.cor.cor * 99) / 100, orgxvel, vel.x);
      //     }

      // } else {
      //     vel = new Shapes.Vect();
      // }
    } else {
      entity.grounded = false;
    }
    entity.abilities.position.pos = pos;
    entity.abilities.velocity.velocity = vel;

    // chencge direction towards velocity
    // if (entity.has('orientation') && entity.has('velocity') && dirChanged) {
    //     if (entity.abilities.velocity.velocity.mag() > 0.5) {
    //         entity.abilities.orientation.orientation = entity.abilities.velocity.velocity.unit();
    //     }
    // }
  }
}

class Physics extends SubSystem {
  constructor(game) {
    super();
    this.game = game;
    this.name = 'physics';
    this.actions = {
      gravity: (g) => {
        console.log(
          'ggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg',
        );
        console.log(g);
        return g;
      },
    };
  }

  update() {
    // if (!this.game.messageBus.isEmpty()) {
    //     let message = this.game.messageBus.messages[this.game.messageBus.messages.length - 1];
    //     console.log(message);
    //     let action = this.actions[message.params.action];
    //     console.log(action);
    //     if (typeof action == 'function') {
    //         message.entities.forEach((eid) => {
    //             let entity = this.game.searchEntity(eid, 'players');
    //             if (entity.has('velocity')) {
    //                 entity.abilities.velocity.velocity = action(
    //                   entity.abilities.velocity.velocity,
    //                   1
    //                 );
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
        if (
          entity.has('velocity')
          && !entity.abilities.velocity.velocity.empty()
        ) {
          let vel = entity.abilities.velocity.velocity;
          const air = vel.multi(config.env.airResistance);
          const surface = vel.multi(config.env.surfaceResistance);
          vel = vel.sub(air).sub(surface);
          entity.abilities.velocity.velocity = vel;
        }
      }

      // this is not finished yet
      // fix strings here
      // console.log(entity.name);
      if (entity.has('string') && false) {
        const stringConn = entity.abilities.string;
        // console.log(stringConn);
        if (entity.id === stringConn.tail) {
          const head = this.game.getEntityById(stringConn.head);
          const distance = entity.distance(head);
          // > stringConn.distance;
          // console.log(head);
          console.log(distance);
          console.log(distance.mag, stringConn.length);

          if (distance.mag < stringConn.length - 5) {
            console.log(
              '------------------------------------------------------------------------------------------------------->>>>>>>>',
            );
            entity.abilities.velocity.velocity.x
              += (stringConn.elasticity / distance.mag) * 100;
            entity.abilities.velocity.velocity.y
              += (stringConn.elasticity / distance.mag) * 100;
            entity.abilities.velocity.velocity.z = 0;
          }
          if (distance.mag > stringConn.length + 5) {
            console.log(
              '------------------------------------------------------------------------------------------------------<<<<<<<<<<',
            );
            entity.abilities.velocity.velocity.x
              += (stringConn.elasticity / distance.mag) * 100;
            entity.abilities.velocity.velocity.y
              += (stringConn.elasticity / distance.mag) * 100;
            entity.abilities.velocity.velocity.z = 0;
          }
        }
      }
    });
  }

  handleMessage(message) {
    if (message.type === this.name) {
      // console.log(this.name);
      // console.log(message);
      // console.log(
      //   '----------->>>>>>>>>>>>>>>>>>>>>><<<<<<<<' +
      //   message.type +
      //   '   ' +
      //   this.game.messageBus.messages.length
      // );
      if (this.actions[message.params.action]) {
        message.entities.forEach((eid) => {
          const entity = this.game.searchEntity(eid, 'players');
          if (entity.has('gravity')) {
            // console.log('-------------+++++++++++++++++++++++++++++++++++++++++++++++++++++');
            // console.log(entity.abilities.gravity.gravity);
            // entity.abilities.gravity.gravity = this.actions[message.params.action](
            //  message.params.gravity
            // );
            // console.log('-------------+++++++++++++++++++++++++++++++++++++++++++++++++++++');
            // console.log(entity.abilities.gravity.gravity);
          }
        });
      }
    }
  }
}

class Renderer extends SubSystem {
  constructor(game) {
    super();
    this.game = game;
    this.name = 'renderer';
  }
}

class Collision extends SubSystem {
  constructor(game) {
    super();
    this.game = game;
    this.name = 'collision';
    this.handleMessage = (message) => {
      // trigger on Collision event for all colliding entities
      message.entities.forEach((entity) => {
        entity.abilities.collidable.colliding(
          message.params.object,
          message.params.collision,
        );
      });
    };
  }

  update() {
    this.testCollisions();
    this.entities.filter(entity => entity.has('collidable')).forEach((entity) => {
      entity.abilities.collidable.update(entity);
    });

    // return here after checking collisions..................................................
    return;
    /* eslint no-unreachable: "off" */
    this.entities.filter(entity => entity.has('cor')).forEach((entity) => {
      // Decrease angular velocity
      if (entity.has('angularVelocity')) {
        const av = entity.abilities.angularVelocity.angularVelocity;

        entity.abilities.orientation.orientation = this.rotate(
          entity.abilities.orientation.orientation,
          this.toRadians(av.x),
        );

        entity.abilities.angularVelocity.angularVelocity = new Shapes.Vect(
          av.x > 6 ? av.x - 1 : 0,
          0,
          0,
        );
      }

      if (entity.has('collidable')) {
        const { pos } = entity.abilities.position;
        const { mass } = entity.abilities.mass;
        const vel = entity.abilities.velocity.velocity;

        this.entities.forEach((object) => {
          if (entity.id !== object.id) {
            if (object.has('collidable')) {
              if (this.collisionTest(entity, object)) {
                // mentity = entity.name == 'dot' ? object : entity;
                // if (mentity.has('score')) {
                //     this.game.messageBus.add(
                //         new MessageSystem.Message(
                //             MessageSystem.Type.SCORE, [mentity], {
                //                 action: 'add',
                //                 points: 1 * mentity.abilities.score.step,
                //             }
                //         )
                //     );
                // }

                // Change color for both colliding entities
                entity.abilities.body.color = '#ff0000';
                object.abilities.body.color = '#ff0000';

                return;

                if (entity.has('velocity')) {
                  const objPos = object.abilities.position.pos;
                  const objMass = object.abilities.mass.mass;
                  const objVel = object.abilities.velocity.velocity;

                  if (object.grounded) {
                    entity.grounded = true;
                    // return;
                  }

                  // find total velocity
                  const totalVelocity = entity.abilities.velocity.velocity.add(
                    object.abilities.velocity.velocity,
                  );

                  // find final direction and chenge direction of totalVelocity

                  // find force applied towards each velocity vector direction before collision

                  // find new direction after collision

                  // find force for each entity

                  // distribute velocity between both based on their mass

                  // console.log('-------------');
                  // console.log(totalVelocity);

                  // move noth out of each other
                  entity.abilities.position.pos = entity.abilities.position.pos.sub(
                    new Shapes.Vect(
                      entity.abilities.velocity.velocity.x,
                      entity.abilities.velocity.velocity.y,
                    ),
                  );
                  object.abilities.position.pos = object.abilities.position.pos.sub(
                    new Shapes.Vect(
                      object.abilities.velocity.velocity.x,
                      object.abilities.velocity.velocity.y,
                    ),
                  );

                  // use mass here , each object will get impulse based on mass
                  // check this http://www.randygaul.net/2013/03/27/game-physics-engine-part-1-impulse-resolution/

                  // distribute velocity between both based on their mass
                  object.abilities.velocity.velocity = totalVelocity
                    .copy()
                    .multi(entity.abilities.cor.cor);

                  entity.abilities.velocity.velocity = totalVelocity
                    .copy()
                    .multi(entity.abilities.cor.cor);

                  const un = pos.sub(objPos).unit();

                  const ut = new Shapes.Vect((un.y * -1), (un.x), 0);

                  // const enVeln = un.dot(vel);
                  // const objVeln = un.dot(objVel);

                  // const enVelt = ut.dot(vel);
                  // const objVelt = ut.dot(objVel);

                  // console.log(enVeln, objVeln);
                  // console.log(enVelt, objVelt);

                  // tangential velocities after the collision is
                  // same as initial tangential velocities

                  // calculate normal velocity after collision from 1 dimension formula
                  const enVelX = (vel.x * (mass - objMass) + 2 * objMass * objVel.x)
                    / (mass + objMass);
                  const enVelY = (vel.y * (mass - objMass) + 2 * objMass * objVel.y)
                    / (mass + objMass);
                  let obVelX = (objVel.x * (objMass - mass) + 2 * mass * vel.x)
                    / (mass + objMass);
                  let obVelY = (objVel.y * (objMass - mass) + 2 * mass * vel.y)
                    / (mass + objMass);

                  // new vels after collisions
                  const newEnVel = new Shapes.Vect(enVelX, enVelY);
                  const newObjVel = new Shapes.Vect(obVelX, obVelY);
                  obVelY = 2;
                  obVelX = obVelY;
                  // console.log(obVelX, obVelY);
                  // let enVelan = un.multi(newEnVel);
                  // let obVelan = un.multi(newObjVel);

                  // let enVelat = ut.multi(newEnVel);
                  // let obVelat = ut.multi(newObjVel);

                  // final velocities
                  // let enFVel = enVelan.add(enVelat);
                  // let obFVel = obVelan.add(obVelat);

                  // final velocities
                  // let enFVel = un.cross(ut).multi(newEnVel);
                  // let obFVel = ut.cross(un).multi(newObjVel);

                  const enFVel = newEnVel;
                  const obFVel = newObjVel;

                  entity.abilities.velocity.velocity = enFVel;
                  object.abilities.velocity.velocity = obFVel;

                  console.log(object.abilities.velocity.velocity);

                  // console.log(
                  //     vel.mag() + objVel.mag() + '>>>>>>>>' +
                  //     vel.x + '---' + vel.y + '---------------' +
                  //     objVel.x + '---' + objVel.y
                  // );

                  // console.log(
                  //     entity.abilities.velocity.velocity.mag() +
                  //     entity.abilities.velocity.velocity.mag() + '<<<<<<<<' +
                  //     entity.abilities.velocity.velocity.x +
                  //     '---' + entity.abilities.velocity.velocity.y + '---------------' +
                  //     object.abilities.velocity.velocity.x +
                  //     '---' + object.abilities.velocity.velocity.y
                  // );

                  // rotate on collision
                  // if (entity.has('angularVelocity')) {
                  //     entity.abilities
                  //       .angularVelocity.angularVelocity = new Shapes.Vect(180, 2, 2);
                  // }
                  // if (object.has('angularVelocity')) {
                  //     object.abilities
                  //       .angularVelocity.angularVelocity = new Shapes.Vect(180, 2, 2);
                  // }

                  // change direction on collision
                  // if (
                  //      entity.has('orientation') &&
                  //      entity.abilities.velocity.velocity.mag() !== 0
                  // ) {
                  //     entity.abilities
                  //       .orientation.orientation = entity.abilities.velocity.velocity.unit();
                  // }

                  // if (
                  //      object.has('orientation') &&
                  //       object.has('velocity') &&
                  //       object.abilities.velocity.velocity.mag() !== 0
                  // ) {
                  //     object.abilities
                  //       .orientation.orientation = object.abilities.velocity.velocity.unit();
                  // }

                  // let enValX =
                  //   ((vel.x * (mass - objMass)) + (2 * objMass * objVel.x)) / (mass + objMass);
                  // let enValY =
                  //   ((vel.y * (mass - objMass)) + (2 * objMass * objVel.y)) / (mass + objMass);
                  // let obValX =
                  //   ((objVel.x * (objMass - mass)) + (2 * mass * vel.x)) / (mass + objMass);
                  // let obValY =
                  //   ((objVel.y * (objMass - mass)) + (2 * mass * vel.y)) / (mass + objMass);

                  // // console.log(enValX, enValY);
                  // // console.log(obValX, obValY);

                  // // // find new direction and apply new velocity
                  // // let newEnDir = objPos.sub(pos).unit().multi((new Shapes.Vect(
                  // //     x = enValX,
                  // //     y = enValY,
                  // //     z = 0
                  // // )).mag());
                  // // // .rotate(enValY > 0 ? 90 : -90);
                  // // // let newEnDir = (new Shapes.Vect(
                  // // //     newEnDir1.x,
                  // // //     newEnDir1.y,
                  // // //     0
                  // // // )).unit();
                  // // // .rotate(-90);
                  // // let newEnVel =
                  // //     // newEnDir;
                  // //     // .multi(
                  // //     // (
                  // //     new Shapes.Vect(
                  // //         x = newEnDir.y,
                  // //         y = newEnDir.x,
                  // //         z = 0
                  // //     );
                  // // // ).mag());

                  // let unitNormal = objPos.sub(pos).unit();
                  // let unitTangent = new Shapes.Vect(
                  //     x = ((enValY < 0) ? unitNormal.y * -1 : unitNormal.y),
                  //     y = (enValX < 0) ? unitNormal.x * -1 : unitNormal.x,
                  //     0
                  // );
                  // let newEnVel = unitTangent.multi((new Shapes.Vect(
                  //     x = enValX * -1,
                  //     y = enValY,
                  //     z = 0
                  // )).mag());

                  // entity.abilities.velocity.velocity = newEnVel;

                  // // Apply new velocity on calculated direction
                  // // entity.abilities.velocity.velocity = new Shapes.Vect(
                  // //     x = enValX,
                  // //     y = enValY,
                  // //     z = 0
                  // // );

                  // // find new direction and apply new velocity
                  // if (object.has('velocity')) {
                  //     // find direction vector(unit) from object to entity
                  //     let newObjDir = objPos.sub(pos).unit();

                  //     // find magnitude of new object velocity
                  //     let newObjvelMag = (new Shapes.Vect(
                  //         x = obValX,
                  //         y = obValY,
                  //         z = 0
                  //     )).mag();

                  //     let newObjvel = newObjDir.multi(newObjvelMag);

                  //     object.abilities.velocity.velocity = newObjvel;
                  // }
                  // // Apply new velocity on calculated direction
                  // // object.abilities.velocity.velocity = new Shapes.Vect(
                  // //     x = obValX,
                  // //     y = obValY,
                  // //     z = 0
                  // // );

                  // console.log(
                  //     vel.mag() + objVel.mag() + '>>>>>>>>' +
                  //     vel.x + '---' + vel.y + '---------------' +
                  //     objVel.x + '---' + objVel.y
                  // );

                  // console.log(
                  //   entity.abilities.velocity.velocity.mag() +
                  //   entity.abilities.velocity.velocity.mag() + '<<<<<<<<' +
                  //   entity.abilities.velocity.velocity.x +
                  //   '---' + entity.abilities.velocity.velocity.y + '---------------' +
                  //   object.abilities.velocity.velocity.x +
                  //   '---' + object.abilities.velocity.velocity.y
                  // );

                  // // rotate on collision
                  // // if (entity.has('angularVelocity')) {
                  // //     entity.abilities.angularVelocity.angularVelocity =
                  // //       new Shapes.Vect(180, 2, 2);
                  // // }
                  // // if (object.has('angularVelocity')) {
                  // //     object.abilities.angularVelocity.angularVelocity =
                  // //       new Shapes.Vect(180, 2, 2);
                  // // }

                  // // change direction on collision
                  // if (
                  //   entity.has('orientation') &&
                  //   entity.abilities.velocity.velocity.mag() !== 0
                  // ) {
                  //     entity.abilities.orientation.orientation =
                  //       entity.abilities.velocity.velocity.unit();
                  // }

                  // if (
                  //   object.has('orientation') &&
                  //   object.has('velocity') &&
                  //   object.abilities.velocity.velocity.mag() !== 0
                  // ) {
                  //     object.abilities.orientation.orientation =
                  //       object.abilities.velocity.velocity.unit();
                  // }
                }
              }
              // entity.abilities.collidable.collidingWith = [];
              const obInd = entity.abilities.collidable.collidingWith.indexOf(
                object.id,
              );
              if (obInd) {
                entity.abilities.collidable.collidingWith.splice(obInd, 1);
              }
              const enInd = object.abilities.collidable.collidingWith.indexOf(
                entity.id,
              );
              if (enInd) {
                object.abilities.collidable.collidingWith.splice(enInd, 1);
              }

              // if (entity.has('gravity') && entity.has('velocity')) {
              //     entity.abilities.gravity.gravity = new Shapes.Vect(0, 0.5);
              // }
              entity.abilities.body.color = entity.abilities.body.originalColor;
              object.abilities.body.color = object.abilities.body.originalColor;
            }
          }
        });
      }
    });
  };

  testCollisions() {
    this.entities.filter(entity => entity.has('collidable')).forEach((entity) => {
      this.entities
        .filter(object => entity.id !== object.id)
        .forEach((object) => {
          this.collisionTest(entity, object);
        });
    });
  }

  collisionTest(entity, object) {
    if (entity.has('viewport') && entity.id !== object.id) {
      if (!this.inViewPort(entity, object)) {
        // Add all object in viewport visible things array
        const objectIndex = entity.abilities.viewport.visibleThings.indexOf(
          object.id,
        );
        if (objectIndex >= 0) {
          console.log('it was in ', objectIndex);
          entity.abilities.viewport.visibleThings.splice(objectIndex, 1);
        }
        // Add all object in viewport visible things array
      } else if (entity.abilities.viewport.visibleThings.indexOf(object.id) === -1) {
        console.log('it is innnnnnnnnnnnnnn ', object.id);
        entity.abilities.viewport.visibleThings.push(object.id);
      }
    }

    if (!this.aabbTest(entity, object)) {
      return false;
    }

    let touching = false;
    // const colliding = false;
    let depth = 0;

    switch (
      entity.abilities.body.shape.name + object.abilities.body.shape.name
    ) {
      case 'circlecircle':
        depth = this.circleToCicle(entity, object);
        break;
      case 'rectanglecircle':
        depth = this.rectToCircle(entity, object);
        break;
      case 'circlerectangle':
        depth = this.rectToCircle(object, entity);
        break;
      case 'rectanglerectangle':
        depth = this.rectToRect(entity, object);
        break;
      default:
    }

    if (depth > 0) {
      // send collision message
      if (entity.abilities.collidable.collidingWith.indexOf(object) < 0) {
        this.game.messageBus.add(
          new MessageSystem.Message(MessageSystem.Type.COLLISION, [entity], {
            collision: true,
            object,
          }),
        );
        this.game.messageBus.add(
          new MessageSystem.Message(MessageSystem.Type.COLLISION, [object], {
            collision: true,
            object: entity,
          }),
        );
      }

      /**
       * Stop entity to move inside another entity
       */
      // entity.abilities.position.pos = entity.abilities.position.pos.sub(eVal);
      touching = true;
    } else if (entity.abilities.collidable.collidingWith.indexOf(object) >= 0) {
      this.game.messageBus.add(
        new MessageSystem.Message(MessageSystem.Type.COLLISION, [entity], {
          collision: false,
          object,
        }),
      );
      this.game.messageBus.add(
        new MessageSystem.Message(MessageSystem.Type.COLLISION, [object], {
          collision: false,
          object: entity,
        }),
      );
    // }
      // this.game.messageBus.add(
      //   new MessageSystem.Message(
      //     MessageSystem.Type.COLLISION,
      //     [object],
      //     { 'collision': false, 'object': entity }
      //   ));
    }
    // if (depth > 5) {
    //     entityRad = entityRad + objectRad / 100;
    // }

    return touching;
    // if (touching) {
    //     // console.log('tesing collisions-------------------------->>> ' + depth)
    //     entity.abilities.body.color = "#ff0000";
    // } else {
    //     entity.abilities.body.color = entity.abilities.body.originalColor;
    // }
  }

  rotate(vec, deg) {
    const originalVec = vec.unit();
    const cos = Math.cos(this.toRadians(deg));
    const sin = Math.sin(this.toRadians(deg));
    const newDir = new Shapes.Vect(
      vec.x * cos - vec.y * sin,
      vec.x * sin + vec.y * cos,
      0,
    );

    return newDir.multi(originalVec.mag());
  }

  toRadians(degree) {
    return degree * (Math.PI / 180);
  }

  toDegree(radian) {
    return (180 / Math.PI) * radian;
  }

  distance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  circleToCicle(entity, object) {
    let entityPos = new Shapes.Vect(
      entity.abilities.position.pos.x,
      entity.abilities.position.pos.y,
    );
    const entityRad = entity.abilities.body.shape.radius;
    const objectPos = new Shapes.Vect(
      object.abilities.position.pos.x,
      object.abilities.position.pos.y,
    );
    const objectRad = object.abilities.body.shape.radius;

    const eVal = entity.abilities.velocity.velocity;

    // add velocity in position to calculate collision before it happens
    // So we have more time to react
    entityPos = entityPos.add(eVal);

    const dx = entityPos.x - objectPos.x;
    const dy = entityPos.y - objectPos.y;

    return entityRad + objectRad - Math.sqrt(dx * dx + dy * dy);
  }

  rectToCircle(rect, crcl) {
    return this.aabbToRect(rect, crcl);
  }

  aabbToRect(rect, crcl) {
    // only works for axis aligned rectagle and circle  ****************************
    const rectPos = new Shapes.Vect(
      rect.abilities.position.pos.x,
      rect.abilities.position.pos.y,
    );
    const rectWidth = rect.abilities.body.shape.width;
    const rectHeight = rect.abilities.body.shape.height;
    const crclPos = new Shapes.Vect(
      crcl.abilities.position.pos.x,
      crcl.abilities.position.pos.y,
    );
    const crclRadius = crcl.abilities.body.shape.radius;
    // find nearest point on rect
    const nearestX = Math.max(
      rectPos.x - rectWidth / 2,
      Math.min(crclPos.x, rectPos.x + rectWidth / 2),
    );
    const nearestY = Math.max(
      rectPos.y - rectHeight / 2,
      Math.min(crclPos.y, rectPos.y + rectHeight / 2),
    );

    // find distance between center of circle to nearest point on rect
    const dx = crclPos.x - nearestX;
    const dy = crclPos.y - nearestY;
    const dd = crclRadius * crclRadius - (dx * dx + dy * dy);

    return dd;
  }

  rectToRect(entity, object) {
    return this.aabbTest(entity, object) ? 1 : 0;
  }

  aabbTest(entity, object) {
    return entity.abilities.position.pos.x - entity.abilities.aabb.width.min < object.abilities.position.pos.x + object.abilities.aabb.width.max
      && entity.abilities.position.pos.y - entity.abilities.aabb.height.min < object.abilities.position.pos.y + object.abilities.aabb.height.max
      && object.abilities.position.pos.x - object.abilities.aabb.width.min < entity.abilities.position.pos.x + entity.abilities.aabb.width.max
      && object.abilities.position.pos.y - object.abilities.aabb.height.min < entity.abilities.position.pos.y + entity.abilities.aabb.height.max;
  }

  inViewPort(entity, object) {
    const viewPortAABB = {
      width: {
        min:
          entity.abilities.camera.pos.x - entity.abilities.viewport.width / 2,
        max: entity.abilities.camera.pos.x + entity.abilities.viewport.width / 2,
      },
      height: {
        min:
          entity.abilities.camera.pos.y - entity.abilities.viewport.height / 2,
        max:
          entity.abilities.camera.pos.y + entity.abilities.viewport.height / 2,
      },
    };
    // console.log(viewPortAABB);
    // console.log(
    // // viewPortAABB.width.min , ' < ',
    // //   object.abilities.position.pos.x + object.abilities.aabb.width.max, ' && ',
    // viewPortAABB.height.min ,' < ',
    //   object.abilities.position.pos.y + object.abilities.aabb.height.max, '&& ',
    // // object.abilities.position.pos.x - object.abilities.aabb.width.min ,' < ',
    // //   viewPortAABB.width.max, ' && ',
    //     object.abilities.position.pos.y - object.abilities.aabb.height.min ,' < ',
    //       viewPortAABB.height.max
    // );

    return viewPortAABB.width.min < object.abilities.position.pos.x + object.abilities.aabb.width.max
      && viewPortAABB.height.min < object.abilities.position.pos.y + object.abilities.aabb.height.max
      && object.abilities.position.pos.x - object.abilities.aabb.width.min < viewPortAABB.width.max
      && object.abilities.position.pos.y - object.abilities.aabb.height.min < viewPortAABB.height.max;
  }
}

function Score(game) {
  this.game = game;
  this.name = 'score';
  this.handleMessage = (message) => {
    if (message.type === this.name) {
      message.entities.forEach((entity) => {
        const newScore = entity.abilities.score[message.params.action](
          message.params.points,
        );
        if (entity.has('rank')) {
          entity.abilities.rank.update(newScore);
        }
        if (entity.has('experience')) {
          entity.abilities.experience.update(newScore);
        }
      });
    }
  };

  this.update = () => {};
}
Score.prototype = new SubSystem();

function Display(game) {
  this.game = game;
  this.name = 'display';
  this.handleMessage = (message) => {};
  this.update = () => {
    this.entities.forEach((entity) => {
      if (entity.has('camera') && entity.has('viewport')) {
        entity.abilities.camera.update(entity);
        entity.abilities.viewport.update(entity);
      }
    }, this);
  };
}
Display.prototype = new SubSystem();

module.exports = function SubSystems(game) {
  return {
    input: new Input(game),
    collision: new Collision(game),
    physics: new Physics(game),
    motion: new Motion(game),
    renderer: new Renderer(game),
    score: new Score(game),
    display: new Display(game),
  };
};
