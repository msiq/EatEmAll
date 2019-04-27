/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */
const autoBind = require('auto-bind');
const config = require('./config.js');
const GameServer = require('./GameServer.js');
const events = require('./events.js');
const Entity = require('./Entity.js');
const Shapes = require('./Shapes.js');
const Abilities = require('./Abilities.js');
const SubSystems = require('./SubSystems.js');
const MessageSystem = require('./MessageBus.js');
// const gameStates = require('./GameState.js');
// const Player = require('./Player.js');

class Game {
  constructor() {
    autoBind(this);
    this.config = config;
    this.server = new GameServer(this);
    this.subSystems = new SubSystems(this);
    // console.log(this.subSystems);
    this.messageBus = new MessageSystem.MessageBus(this);

    this.state = false;
    this.players = {};
    this.active = false;
    // this.control = false;
    this.activeConnections = {};
    this.events = {};

    // time delta here and  count FPS somehow
    this.fps = 0;
    this.lastFPS = config.server.frameRate;
    this.lastRun = Date.now();
    this.fpsLastRun = Date.now();
    this.now = 0;

    this.delta = 1 / config.server.frameRate;

    /**
     * Shapes object constructor
     */
    this.shapes = Shapes;

    this.abilities = Abilities;

    /** Entity object constructor */
    this.Entity = Entity;
    /**
     * Add entity in entity collections
     *
     * entity must be Type Entity
     * type Type of Entity, defaults to "Default"
     */
    this.entities = {
      default: [],
    };
    this.entityTypes = {
      default: Entity.TYPE_DEFAULT,
    };
  }

  /** *****************************************************************'
   * Function available to be overridden by Devs
   */

  /**
   * setup must be overriden by dev
   */
  setup() {
    console.log(
      'hey, i am default setup, look like you are missing something.',
    );
    throw new Error(`No setup method implemented.  ${this.fps}`);
  }

  /**
   * Update must be overriden by dev
   */
  update() {
    console.log(
      'Hey! i am default update, you should implement your own update method.',
    );
    throw new Error(`No update method implemented. ${this.fps}`);
  }

  /**
   * Dev may override joinGame(data) to satisfiy their needs on client requests to let them play
   * data array data needed to join game
   */
  joinGame(data) {
    console.log(`hey, i am default joinGame. ${this.fps}`, data);
  }

  //* ******************************************************************* */

  start() {
    this.server
      .serve()
      .then((mes) => {
        console.log(mes);
        this.setup();
        this.loop();
      })
      .catch((err) => {
        console.log(err);
      });
  }

  stop() {
    if (this.active) {
      // && this.control
      // clearInterval(this.control);

      this.active = false;
    }
  }

  // // time delta here and  count FPS somehow
  // fps = 0;
  // this.lastFPS = 30;
  // this.lastRun = Date.now();
  // this.fpsLastRun = Date.now();
  // this.now = 0;

  // this.delta = 1 / 30;
  loop() {
    this.now = Date.now();

    if (this.now - this.lastRun >= 1000 / config.server.frameRate) {
      this.delta = 1500 / this.lastFPS / 100;
      this.doTick();
      this.update();
      this.internalUpdate();
      this.lastRun = this.now;
      this.fps++;
    }

    if (!this.control) {
      this.control = setInterval(this.loop.bind(this), 0.1);
      this.active = true;
    }

    if (this.now - this.fpsLastRun > 1000) {
      this.lastFPS = this.fps;
      console.log(this.fps);
      this.fps = 0;
      this.fpsLastRun = Date.now();
    }
  }

  static applyMessage(SubSystem) {
    return (Message) => {
      if (SubSystem.name === Message.type) {
        SubSystem.handleMessage(Message);
      }
    };
  }

  passMessageToHandled(message, subSystemName) {
    if (this.subSystems[subSystemName].name === message.type) {
      this.subSystems[subSystemName].handleMessage(message);
    }
  }

  internalUpdate() {
    const players = this.getEntities('players');
    if (players.length > 0) {
      // handle all messages
      if (!this.messageBus.isEmpty()) {
        let message = false;
        while ((message = this.messageBus.messages.pop())) {
          Object.keys(this.subSystems).forEach(this.passMessageToHandled.bind(this, message));
        }
      }

      // update all subsystems
      Object.keys(this.subSystems).forEach((subSystem) => {
        this.subSystems[subSystem].preUpdate();
        this.subSystems[subSystem].update();
        this.subSystems[subSystem].postUpdate();
      });

      // players.forEach((player) => {
      //     player.update();
      //     //         Object.keys(player.abilities).forEach((comp) => {
      //     //             player.abilities[comp].update(player);
      //     //         })
      // });
    }
  }

  isActive() {
    return !!this.active;
  }

  formatToRender(player) {
    const ort = player.has('orientation') ? player.abilities.orientation.orientation : new Shapes.Vect();
    const angle = player.has('orientation') ? player.abilities.orientation.angle : 35;
    const vel = player.has('velocity') ? player.abilities.velocity.velocity : new Shapes.Vect();
    const dir = ort.multi(
      player.abilities.body.shape.radius
      || player.abilities.body.shape.width + 2,
    );

    // this.entityTypes = this.entityTypes ? this.entityTypes : {};
    // // console.log(this);
    return {
      ...player.abilities.position.pos,
      ...player.abilities.body.shape, 
      shape: player.abilities.body.shape.name,
      id: player.id,
      socketId: player.socketId,
      color: player.abilities.body.color,
      vel,
      name: player.name,
      type: player.type,
      dir: {
        x: dir.x,
        y: dir.y,
        z: dir.z,
      },
      aabb: player.abilities.aabb,
      angle,
      score: player.has('score') ? player.abilities.score.score : 'nono',
      rank: player.has('rank') ? player.abilities.rank.rank : 'nono',
      xp: player.has('experience') ? player.abilities.experience.xp : 'nono',
      entityType: this.entityTypes[player.type],
      power: player.has('power') ? player.abilities.power.power : 'nono',
      health: player.has('health') ? player.abilities.health.health : 'nono',
      camera: player.has('camera') ? player.abilities.camera : 'nono',
      viewport: player.has('camera') ? player.abilities.viewport : 'nono',
    };
  }

  doTick() {
    const players = {};
    Object.keys(this.entities).forEach((entityType) => {
      players[entityType] = this.entities[entityType]
        .map(plr => this.formatToRender(plr));
    });

    // // console.log(this.entities);
    // let players = this.getEntities('players');

    // players = players.map(this.formatToRender);

    this.server.doTick({
      players,
      fps: this.lastFPS,
      config,
    });
  }

  // Set new state
  changeState(state, options = []) {
    [].push.call(this.events, {
      event: events.CHANGE_STATE,
      enitity: state,
      options,
    });
    // let evet = [].pop.call(this.events);
    console.log(this.events);
  }

  // Set new state
  setState(state) {
    this.state = state;
  }

  // execute any new events
  handleEvents() {
    return this.state.handleEvents(this);
  }

  // render all eater and food
  render() {
    this.state.render(this);
  }

  // /**
  //  * Shapes object constructor
  //  */
  // this.shapes = Shapes;

  // this.abilities = Abilities;

  // /** Entity object constructor */
  // this.Entity = Entity;
  // /**
  //  * Add entity in entity collections
  //  *
  //  * entity must be Type Entity
  //  * type Type of Entity, defaults to "Default"
  //  */
  // this.entities = {
  //   default: [],
  // };
  // this.entityTypes = {
  //   default: Entity.TYPE_DEFAULT,
  // };
  addEntity(entity, type = Entity.TYPE_DEFAULT) {
    // entity.type = type;
    this.entities[type].push(entity);
  }

  addEntityType(name, type = Entity.TYPE_DEFAULT) {
    this.entities[name] = [];
    delete this.entities.default;
    delete this.entityTypes.default;
    this.entityTypes[name] = type;
  }

  getEntityById(id) {
    for (const entityGroup in this.entities) {
      for (const entity in this.entities[entityGroup]) {
        if (this.entities[entityGroup][entity].id === id) {
          return this.entities[entityGroup][entity];
        }
      }
    }

    return false;
  }

  getEntities(type) {
    // return this.entities.filter((entity) => entity['type'] === type);
    if (this.entities[type] !== undefined) {
      return this.entities[type];
    }

    return [];
  }

  searchEntity(id, type) {
    if (this.entities[type] !== undefined) {
      for (const entity in this.entities[type]) {
        if (this.entities[type][entity].id === id) {
          return this.entities[type][entity];
        }
      }

      return false;
    }

    throw new Error(`Entities of type "${type}" does not exists!`);
  }

  onletMePlay(data) {
    console.log('let meeeeeeeeeeeeeeeeee    eattt!');
    // const pid = data.oldId;
    // if info missing dont let em eat anything :|
    if (data.userName === '') {
      this.server.goaway(data.socketId);
      return false;
    }

    // this.activeConnections[data.socketId] = {
    //   socketId: data.socketId,
    //   userName: data.userName,
    // };

    // connected to client do setup now
    // this.setup();

    // console.log('thissssssssssssssssssssssssss', this);

    const player = this.joinGame(data);

    // // Is returning eater :)
    // if (player = this.searchEntity(pid, 'players')) {
    //     console.log('This eater is back again!');
    //     player.socket_id = requestData.socketId;
    //     // letEmEat(players[pid]);
    //     return 0;
    // }

    this.server.letEmPlay(player);
    return true;
  }

  playerClick(event) {
    this.messageBus.add(
      new MessageSystem.Message(
        MessageSystem.Type.INPUT,
        [event.playerId],
        { action: event.action, ...event.params },
      ),
    );
  }

  playerInput(event) {
    this.messageBus.add(
      new MessageSystem.Message(
        MessageSystem.Type.INPUT,
        [event.playerId],
        // maybe we dont need this id here because input should be independent of player we should be able to chose what to do on input in system
        // Or developer will tell us what to do in Input ability args
        // Or developer will do it in input ability callback
        { action: event.action, ...event.params },
      ),
    );

    // this should go to message bus

    // this.subSystems.input.handle(event);

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

    // console.log('----->>>>>>>>>>>>>>>>>><<<', event.action);
    // var player = this.searchEntity(event.playerId, 'players');

    // player.addAction(event.action, event.params);
  }
}

module.exports = Game;
