const { GameStateMachine } = require('../fsm/GameState.js');
const config = require('./config.js');

const GameServer = require('./GameServer.js');
const events = require('../shared/events.js');
const gameStates = require('../fsm/GameState.js');
const Entity = require('../ecs/Entity.js');
const Shapes = require('../shared/Shapes.js');
const Player = require('./Player.js');

const Abilities = require('../ecs/Abilities.js');
const SubSystems = require('../physics/SubSystems.js');
const MessageSystem = require('./MessageBus.js');
const SafetyTripwire = require('./SafetyTripwire.js');
const { performance } = require('perf_hooks');


var Game = function Game(customConfig) {
    this.config = Object.assign({}, config, customConfig || {});
    if (customConfig && customConfig.canvas) {
        this.config.canvas = Object.assign({}, config.canvas, customConfig.canvas);
    }
    this.server = new GameServer();
    this.subSystems = SubSystems(this);
    // console.log(this.subSystems);
    this.messageBus = new MessageSystem.MessageBus(this);

    this.mode = (config.server && config.server.mode) || 'standard';
    this.safetyTripwire = new SafetyTripwire((config.server && config.server.unrestricted) || {});

    this.state = false;
    this.players = {};
    this.active = false;
    // this.control = false;

    this.activeConnections = {};

    this.events = {};

    this.staticLayers = new Set(['dots']);
    this.markLayerStatic = function(layerName) {
        if (!this.staticLayers) this.staticLayers = new Set();
        this.staticLayers.add(layerName);
    };
    this.gameFSM = new GameStateMachine(this);

    /** *****************************************************************'
     * Function available to be overridden by Devs
     */

    /**
     * setup must be overriden by dev
     */
    this.setup = function() {
        console.log('hey, i am default setup, look like you are missing something.');
        throw new Error('No setup method implemented.');
    };

    /**
     * Update must be overriden by dev
     */
    this.update = function() {
        console.log('Hey! i am default update, you sould implement your own update method.');
        throw new Error('No update method implemented.');
    };

    /**
     * Dev may override joinGame(data) to satisfiy their needs on client requests to let them play
     * data array data needed to join game
     */
    this.joinGame = function(data) {
        console.log('hey, i am default joinGame.');
    };

    //* ******************************************************************* */


    this.start = function(options) {
        this.server.serve(this, options)
            .then((mes) => {
                console.log(mes);
                this.setup();
                this.startLoop();
            }).catch((er) => {
                console.log(er);
            });
    };
    this.stop = function() {
        this.stopLoop();
    };

    this.setMode = function(newMode) {
        if (newMode !== 'standard' && newMode !== 'unrestricted') {
            console.error('[Game] Invalid mode requested:', newMode);
            return false;
        }
        if (this.mode === newMode && this.active) return true;
        console.log(`[Game] Switching engine mode: ${this.mode} -> ${newMode}`);
        this.stopLoop();
        this.mode = newMode;
        if (newMode === 'standard' && this.safetyTripwire) {
            this.safetyTripwire.currentTps = this.lastFPS || 30;
            this.safetyTripwire.status = 'NORMAL';
        }
        this.startLoop();
        return true;
    };


    // FPS, timing and loop metrics
    this.fps = 0;
    this.lastFPS = 30;
    this.lastRun = Date.now();
    this.fpsLastRun = Date.now();
    this.now = 0;
    this.delta = 1 / 30;
    this.timeScale = 1.0;
    this.lastTickTime = performance.now();

    this.loopTimeout = null;
    this.immediateHandle = null;

    this.startLoop = function() {
        this.active = true;
        this.lastRun = Date.now();
        this.fpsLastRun = Date.now();
        this.fps = 0;
        this.lastTickTime = performance.now();

        console.log(`[Game] Starting game loop in '${this.mode}' mode.`);
        if (this.mode === 'unrestricted') {
            this.runUnrestrictedStep();
        } else {
            this.runStandardStep();
        }
    };

    this.stopLoop = function() {
        this.active = false;
        if (this.loopTimeout) {
            clearTimeout(this.loopTimeout);
            this.loopTimeout = null;
        }
        if (this.immediateHandle) {
            clearImmediate(this.immediateHandle);
            this.immediateHandle = null;
        }
        if (this.control) {
            clearInterval(this.control);
            this.control = null;
        }
    };

    // Standard mode loop (Drift-compensated setTimeout, fixed target frame rate, 97% fewer wakeups)
    this.runStandardStep = function() {
        if (!this.active || this.mode !== 'standard') return;

        const now = Date.now();
        this.now = now;

        const nowPerf = performance.now();
        const dtSec = Math.min(0.1, Math.max(0.0001, (nowPerf - this.lastTickTime) / 1000));
        this.lastTickTime = nowPerf;
        this.timeScale = dtSec * 30;
        this.dtSec = dtSec;

        const targetFps = (this.config.server && this.config.server.frameRate) || 30;
        this.delta = (1500 / (this.lastFPS || targetFps)) / 100;
        this.doTick();
        this.update();
        this.internalUpdate();
        this.lastRun = now;
        this.fps++;

        if ((now - this.fpsLastRun) >= 1000) {
            this.lastFPS = this.fps;
            console.log(`[Standard Loop] FPS: ${this.lastFPS}`);
            this.fps = 0;
            this.fpsLastRun = now;
        }

        const elapsed = Date.now() - now;
        const targetInterval = 1000 / targetFps;
        const nextDelay = Math.max(1, Math.round(targetInterval - elapsed));
        this.loopTimeout = setTimeout(() => this.runStandardStep(), nextDelay);
    };

    // Unrestricted mode loop (Cooperative setImmediate, uncapped physics simulation rate, protected by SafetyTripwire)
    this.runUnrestrictedStep = function() {
        if (!this.active || this.mode !== 'unrestricted') return;

        // Multi-Layer Hardware & OS Safety Check (Lag, Memory, Thermal Breather)
        const vitals = this.safetyTripwire.checkVitals();
        if (vitals.pause) {
            this.loopTimeout = setTimeout(() => this.runUnrestrictedStep(), vitals.duration);
            return;
        }

        const now = Date.now();
        this.now = now;

        const nowPerf = performance.now();
        const dtSec = Math.min(0.1, Math.max(0.0001, (nowPerf - this.lastTickTime) / 1000));
        this.lastTickTime = nowPerf;
        this.timeScale = dtSec * 30;
        this.dtSec = dtSec;

        // Network Backpressure Throttling (Cap client snapshots to max 60 Hz so clients don't choke)
        if (this.safetyTripwire.shouldBroadcast(now)) {
            this.doTick();
        }

        // Run full physics simulation at maximum hardware speed
        const currentRate = this.safetyTripwire.currentTps || this.lastFPS || 30;
        this.delta = 15 / Math.max(1, currentRate);
        this.update();
        this.internalUpdate();

        this.fps++;
        if ((now - this.fpsLastRun) >= 1000) {
            this.lastFPS = this.fps;
            console.log(`[Unrestricted Loop] Real TPS: ${this.safetyTripwire.currentTps || this.lastFPS} (Lag: ${this.safetyTripwire.eventLoopLag.toFixed(1)}ms, Status: ${this.safetyTripwire.status})`);
            this.fps = 0;
            this.fpsLastRun = now;
        }

        // Cooperative non-blocking re-entry
        this.immediateHandle = setImmediate(() => this.runUnrestrictedStep());
    };

    // Legacy fallback alias
    this.loop = function() {
        this.startLoop();
    };

    this.internalUpdate = function() {
        const dt = this.dtSec || 0.033;
        if (this.gameFSM && typeof this.gameFSM.update === 'function') {
            this.gameFSM.update(dt);
        }
        let players = this.getEntities('players');
        if (Array.isArray(players)) {
            players.forEach(p => {
                if (p.playerFSM && typeof p.playerFSM.update === 'function') {
                    p.playerFSM.update(dt);
                }
            });
        }
        if (players.length > 0) {
            // handle all messages
            if (!this.messageBus.isEmpty()) {
                while (message = this.messageBus.messages.pop()) {
                    Object.keys(this.subSystems).forEach((subSystem) => {
                        if (this.subSystems[subSystem].name == message.type) {
                            this.subSystems[subSystem].handleMessage(message);
                        }
                    });
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
    };

    this.isActive = function() {
        return !!this.active;
    };

    this.formatToRender = (player) => {
        if (this.staticLayers.has(player.type) || (player.abilities && player.abilities.collidable && player.abilities.collidable.isStatic)) {
            return {
                id: player.id,
                x: player.abilities.position.pos.x,
                y: player.abilities.position.pos.y,
                radius: (player.abilities.body && player.abilities.body.shape && player.abilities.body.shape.radius) || 7,
                color: player.abilities.body.color
            };
        }

        let ort = (player.has('orientation')) ? player.abilities.orientation.orientation : new Shapes.Vect();
        let angle = (player.has('orientation')) ? player.abilities.orientation.angle : 2;

        let vel = player.has('velocity') ? player.abilities.velocity.velocity : new Shapes.Vect();
        let shape = player.abilities.body.shape;
        let dir = ort.multi(shape.radius || shape.width + 2);
        return Object.assign({},
            player.abilities.position.pos,
            player.abilities.body.shape,
            {
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
                angle: angle,
                state: player.state || (player.playerFSM ? player.playerFSM.getStateName() : 'active'),
                score: player.has('score') ? player.abilities.score.score : 'nono',
                rank: player.has('rank') ? player.abilities.rank.rank : 'nono',
                xp: player.has('experience') ? player.abilities.experience.xp : 'nono',
                entityType: this.entityTypes[player.type],
                power: player.has('power') ? player.abilities.power.power : 'nono',
                health: player.has('health') ? player.abilities.health.health : 'nono',
                camera: player.has('camera') ? player.abilities.camera : 'nono',
                viewport: player.has('camera') ? player.abilities.viewport : 'nono',
            },
            player.custom || {}
        );
    };

    this.tickEvents = [];
    this.addTickEvent = function(event) {
        if (!this.tickEvents) this.tickEvents = [];
        this.tickEvents.push(event);
    };

    this.getStaticEntitiesSnapshot = function() {
        const result = [];
        this.staticLayers.forEach(layer => {
            if (this.entities[layer]) {
                this.entities[layer].forEach(e => {
                    result.push({
                        id: e.id,
                        x: (e.abilities.position && e.abilities.position.pos) ? e.abilities.position.pos.x : 0,
                        y: (e.abilities.position && e.abilities.position.pos) ? e.abilities.position.pos.y : 0,
                        radius: (e.abilities.body && e.abilities.body.shape && e.abilities.body.shape.radius) || 7,
                        color: (e.abilities.body && e.abilities.body.color) || '#fff'
                    });
                });
            }
        });
        return result;
    };
    this.getAllDotsCompact = function() {
        return this.getStaticEntitiesSnapshot();
    };

    this.doTick = function() {
        let players = {};
        Object.keys(this.entities).forEach((entityType) => {
            // High-Performance Optimization: Skip static dots in 30Hz tick snapshots!
            if (this.staticLayers.has(entityType)) return;
            players[entityType] = this.entities[entityType].map(this.formatToRender);
        });

        const events = this.tickEvents || [];
        this.tickEvents = [];

        const dotsDelta = this.dotsDelta || [];
        this.dotsDelta = [];

        const gameState = this.gameFSM ? {
            name: this.gameFSM.getStateName(),
            timeInState: this.gameFSM.getTimeInState(),
            remainingMs: this.gameFSM.getRemainingTime(180000)
        } : null;
        this.server.doTick({ players, dotsDelta, fps: this.lastFPS, events, gameState });
    };

    // Set new state
    this.changeState = function(state, options = []) {
        [].push.call(this.events, {event: events.CHANGE_STATE, enitity: state, option: option});
        // let evet = [].pop.call(this.events);
        console.log(this.events);
    };

    // Set new state
    this.setState = function(state) {
        this.state = state;
    };

    // execute any new events
    this.handleEvents = function() {
        return this.state.handleEvents(this);
    };

    // render all eater and food
    this.render = function() {
        this.state.render(this);
    };

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
    this.addEntity = function(entity, type = Entity.TYPE_DEFAULT) {
        entity.type = type;
        this.entities[type].push(entity);
    };
    this.addEntityType = function(name, type = Entity.TYPE_DEFAULT) {
        this.entities[name] = [];
        delete this.entities['default'];
        delete this.entityTypes['default'];
        this.entityTypes[name] = type;
    };
    this.getEntityById = function(id) {
        for (entityGroup in this.entities) {
            for (entity in this.entities[entityGroup]) {
                if (this.entities[entityGroup][entity].id == id) {
                    return this.entities[entityGroup][entity];
                }
            }
        }

        return false;
    };
    this.getEntities = function(type) {
        // return this.entities.filter((entity) => entity['type'] === type);
        if (this.entities[type] !== undefined) {
            return this.entities[type];
        } else {
            return [];
        }

        // throw 'Entities of type "' + type + '" does not exists!';
    };
    this.searchEntity = function(id, type) {
        if (this.entities[type] !== undefined) {
            for (entity in this.entities[type]) {
                if (this.entities[type][entity].id == id) {
                    return this.entities[type][entity];
                }
            }

            return false;
        }

        throw 'Entities of type "' + type + '" does not exists!';
    };
        this.removeEntity = function(id, type) {
        if (type && this.entities[type]) {
            this.entities[type] = this.entities[type].filter(e => e.id !== id);
        } else {
            Object.keys(this.entities).forEach(grp => {
                this.entities[grp] = this.entities[grp].filter(e => e.id !== id);
            });
        }
        Object.keys(this.subSystems).forEach(name => {
            if (this.subSystems[name] && typeof this.subSystems[name].RemoveEntity === 'function') {
                this.subSystems[name].RemoveEntity(id);
            }
        });
    };

    this.onPlayerDisconnect = (socketId) => {
        let player = null;
        if (this.entities['players']) {
            player = this.entities['players'].find(p => p.socket_id === socketId);
        }
        if (player) {
            console.log('[Server] Cleaning up disconnected player:', player.name, player.id);
            this.removeEntity(player.id, 'players');
        }
        if (this.activeConnections) {
            delete this.activeConnections[socketId];
        }
    };
    this.onletMePlay = (data) => {
        console.log('let meeeeeeeeeeeeeeeeee    eattt!');
        let pid = data.oldId;
        // if info missing dont let em eat anything :|
        if (data.userName == '') {
            this.server.goaway(data.socketId);
            return 0;
        }

        this.activeConnections[data.socketId] = {
            'socketId': data.socketId,
            'userName': data.userName,
        };


        // connected to client do setup now
        // this.setup();

        let player = this.joinGame(data);

        // // Is returning eater :)
        // if (player = this.searchEntity(pid, 'players')) {
        //     console.log('This eater is back again!');
        //     player.socket_id = requestData.socketId;
        //     // letEmEat(players[pid]);
        //     return 0;
        // }

        this.server.letEmPlay(this.formatToRender(player), player.socket_id, this.getAllDotsCompact());
    };


    this.playerClick = (event) => {
        this.messageBus.add(
            new MessageSystem.Message(
                MessageSystem.Type.INPUT, [event.playerId],
                Object.assign({}, {action: event.action}, event.params)
            )
        );
    };

    this.playerInput = (event) => {
        this.messageBus.add(
            new MessageSystem.Message(
                MessageSystem.Type.INPUT, [event.playerId],
                Object.assign({}, {action: event.action}, event.params)
            )
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
        //         // game.searchEntity(event.playerId, 'players').addAction(this.actions[event.action], event.params);
        //     }
        // };

        // console.log('----->>>>>>>>>>>>>>>>>><<<', event.action);
        // var player = this.searchEntity(event.playerId, 'players');

        // player.addAction(event.action, event.params);
    };
};


module.exports = exports = Game;
