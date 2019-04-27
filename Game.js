/* eslint-disable class-methods-use-this */
/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "[object]" }] */
/* eslint no-param-reassign:
  ["error", {
    "props": true,
      "ignorePropertyModificationsFor": ["entity", "object"],

    }]
*/
const GameClass = require('./Server/GameClass.js');
const Shapes = require('./Server/Shapes.js');
const Entity = require('./Server/Entity.js');
const MessageSystem = require('./Server/MessageBus.js');

class Game extends GameClass {
  // constructor() {
  //   super();
  //   // this.players = [];
  //   // this.dots = [];
  // }

  setup() {
    this.addEntityType('players', Entity.TYPE_MAIN);
    this.addEntityType('dots', Entity.TYPE_DEFAULT);
    // console.log('setting up game');
    // add some dots
    // let dotx = 160;
    // let doty = 180;
    for (let i = 0; i < 30; i++) {
      this.initiateDot();
      // dotx += 40;
      // doty += 40;
    }
  }

  joinGame(data) {
    return this.initiatePlayer(data);
  }

  update() {
    // console.log(this);
    // console.log(this.entities.players.length > 0 && this.entities.players[0].abilities.velocity.velocity.x);
    // console.log(this.entities.players.length > 0 && this.entities.players[0].abilities.velocity.velocity.y);
    // this.entities.dots.forEach(this.moveRandom);
    // this.entities.players.forEach(this.moveRandom);

    this.colliding(this);
    this.entities.players.forEach((player) => {
      this.inputHandler(player);
    });
  }

  inputHandler(player) {
    player.abilities.input.onKeyPress(
      input => this.handleKeypress(player, input),
    );
    player.abilities.input.onMouseClick(
      input => this.handleMouseClick(player, input),
    );
  }

  handleKeypress(player, input) {
    const action = this.actionMapper(player, input);
    if (action) {
      this.messageBus.add(
        new MessageSystem.Message(action.system, action.entities, action.params),
      );
    }
  }

  handleMouseClick(player, input) {
    const action = {
      type: 'message', system: MessageSystem.Type.MOTION, entities: [player], params: { ...input },
    };

    if (input.action === 'mousemove') {
      action.params.action = 'drag';
    }

    if (action) {
      this.messageBus.add(
        new MessageSystem.Message(action.system, action.entities, action.params),
      );
    }
  }

  actionMapper(player, input) {
    let action = {
      type: 'message', system: MessageSystem.Type.MOTION, entities: [player], params: { ...input },
    };

    switch (input.key) {
      case 37:
        action.params.action = 'left';
        break;
      case 38:
        action.params.action = 'up';
        break;
      case 39:
        action.params.action = 'right';
        break;
      case 40:
        action.params.action = 'down';
        break;
      default:
        action = {};
        break;
    }

    // add more action here
    return action;
  }

  /**
   * create player dot
   * @param {Object} data
   * @return {Entity} player
   */
  initiatePlayer(data) {
    const player = new this.Entity(data.userName);

    const playerPos = new this.shapes.Vect(
      Math.floor(Math.random() * (300 - 1 + 1)) + 1,
      Math.floor(Math.random() * (300 - 1 + 1)) + 1,
    );
    const playerCirc = new this.shapes.Circ(40);

    player.attach(new this.abilities.Body(playerCirc, 'green'));
    player.attach(new this.abilities.Position(playerPos));
    player.attach(new this.abilities.Velocity());
    player.attach(new this.abilities.Input());
    player.attach(new this.abilities.Mass(100));
    player.attach(new this.abilities.Cor(0.4));
    player.attach(new this.abilities.Collidable());

    // const controls = new this.abilities.controls({
    //   left: () => { 'add velocity for that entity' },
    //   right: () => { 'add velocity for that entity' },
    //   up: () => { 'add velocity for that entity' },
    //   down: () => { 'add velocity for that entity'},
    // });

    player.attach(new this.abilities.Score());
    player.attach(
      new this.abilities.Rank({
        1: 300,
        2: 500,
        3: 600,
      }),
    );
    player.attach(new this.abilities.Experience(1000));
    player.attach(new this.abilities.Power(100));
    player.attach(new this.abilities.Health(100));
    // player.attach(new this.abilities.Gravity());
    player.attach(new this.abilities.Orientation());
    // player.attach(new this.abilities.Torque());
    // player.attach(new this.abilities.Acceleration());
    // player.attach(new this.abilities.AngularVelocity());

    this.subSystems.collision.AddEntity(player);
    this.subSystems.motion.AddEntity(player);
    this.subSystems.physics.AddEntity(player);
    this.subSystems.score.AddEntity(player);

    const camera = new this.abilities.Camera(player.abilities.position.pos);
    player.attach(camera);
    player.attach(new this.abilities.Viewport(1000, 800, camera));
    this.subSystems.display.AddEntity(player);
    this.subSystems.input.AddEntity(player);
    player.socket_id = data.socketId;
    this.addEntity(player, 'players');
    // console.log(player.abilities.viewport);
    return player;
  }

  /**
   * create a dot
   * @param {number} x
   * @param {number} y
   */
  initiateDot(x, y) {
    const dotPos = new this.shapes.Vect(
      x || Math.floor(Math.random() * (this.config.canvas.width - 1 + 1)) + 1,
      y || Math.floor(Math.random() * (this.config.canvas.height - 1 + 1)) + 1,
    );
    // (this.config.canvas.width / 2, this.config.canvas.height / 2);
    const dotCirc = new this.shapes.Circ(20);
    const dot = new this.Entity('dot');
    dot.attach(new this.abilities.Body(dotCirc, 'blue'));
    dot.attach(new this.abilities.Position(dotPos));
    dot.attach(new this.abilities.Collidable());
    dot.attach(new this.abilities.Velocity());
    dot.attach(new this.abilities.Mass(100));
    dot.attach(new this.abilities.Power(100));
    
    dot.attach(new this.abilities.Input());

    dot.attach(new this.abilities.Orientation());
    // dot.attach(new this.abilities.Gravity());
    dot.attach(new this.abilities.AngularVelocity());
    dot.attach(new this.abilities.Cor(0.5));

    this.subSystems.collision.AddEntity(dot);
    this.subSystems.physics.AddEntity(dot);
    this.subSystems.motion.AddEntity(dot);
    this.subSystems.input.AddEntity(dot);
    this.addEntity(dot, 'dots');
  }

  colliding(game) {
    if (game.entities.players) {
      game.entities.players.forEach((player) => {
        player.abilities.collidable.onCollisionStart((object) => {
          console.log('onCollisionStart', player.name, object.name);
          player.abilities.body.color = '#0000ff';
          player.abilities.score.add(1);
          player.abilities.power.sub(1);
          player.abilities.health.sub(2);
          if (
            player.abilities.score.score > 0 && player.abilities.score.score % 10 === 0
          ) {
            player.abilities.experience.add(1);
            if (
              player.abilities.experience.xp > 0 && player.abilities.experience.xp % 5 === 0
            ) {
              player.abilities.rank.raise();
            }
          }
        });
        player.abilities.collidable.onCollision((object) => {
          console.log('onCollision', player.name, object.name);
          player.abilities.body.color = '#ff00ff';
        });
        player.abilities.collidable.onCollisionEnd((object) => {
          console.log('onCollisionEnd', player.name, object.name);
          player.abilities.body.color = player.abilities.body.originalColor;
        });
      });
    }

    if (game.entities.dots) {
      game.entities.dots.forEach((entity) => {
        entity.abilities.collidable.onCollisionStart((object) => {
          entity.abilities.body.color = '#51e12d';
        });
        entity.abilities.collidable.onCollision((object) => {
          // entity.abilities.body.color = "#ffff00";
        });
        entity.abilities.collidable.onCollisionEnd((object) => {
          entity.abilities.body.color = entity.abilities.body.originalColor;
        });
      }, this);
    }
  }

  /**
   * @param {Entity} entity
   */
  moveRandom(entity) {
    // let velo = entity.abilities.velocity.velocity;

    entity.abilities.velocity.velocity = entity.abilities.velocity.velocity.add(
      new Shapes.Vect(
        (Math.random() > 0.5 ? -Math.random() - 1 : Math.random() + 1),
        (Math.random() > 0.5 ? -Math.random() - 1 : Math.random() + 1),
        0,
      ).multi(this.delta),
    );
  }
}

const game = new Game();

// console.log(game.joinGame);

module.exports = game;
