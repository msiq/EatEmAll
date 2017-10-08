const config = require('./config.js');

const GameServer = require('./GameServer.js');
const events = require('./events.js');
const gameStates = require('./GameState.js');
const Entity = require('./Entity.js');
const Shapes = require('./Shapes.js');
const Player = require('./Player.js');

const Abilities = require('./Abilities.js');
const SubSystems = require('./SubSystems.js');
const MessageSystem = require('./MessageBus.js');


var Game = function Game() {
    this.config = config;
    this.server = new GameServer();
    this.subSystems = SubSystems(this);
    // console.log(this.subSystems);
    this.messageBus = new MessageSystem.MessageBus(this);

    this.state = false;
    this.players = {};
    this.active = false;
    this.control = false;

    this.activeConnections = {};

    this.events = {};

    /*******************************************************************'
     * Function available to be over ridden by Devs
     */
    //setup must be overriden by dev 
    this.setup = function() {
        console.log('hey, i am default setup, look like you are missing something.');
        throw new Error('No setup method implemented.');
    };
    // update must be overriden by dev
    this.update = function() {
        console.log('Hey! i am default update, you sould implement your own update method.');
        throw new Error('No update method implemented.');
    };
    //Dev may override joinGame() to satisfiy their needs on client requests to let them play
    this.joinGame = function() {
        console.log('hey, i am default join.');
    };

    //******************************************************************** */


    this.start = function() {
        this.server.serve(this);
        this.setup();
        this.loop();
    }
    this.stop = function() {
        if (this.active && this.control) {
            clearInterval(this.control);

            this.active = false;
        }
    }
    this.loop = function() {
        this.doTick();
        this.update();
        this.internalUpdate();

        if (!(this.control)) {
            this.control = setInterval(this.loop.bind(this), 1000 / config.server.frameRate);
            this.active = true;
        }

    };
    this.internalUpdate = function() {
        var players = this.getEntities('players');
        if (players.length > 0) {

            // handle all messages
            if (!this.messageBus.isEmpty()) {
                while (message = this.messageBus.messages.pop()) {
                    Object.keys(this.subSystems).forEach((subSystem) => {
                        this.subSystems[subSystem].handleMessage(message)
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

    this.doTick = function() {

        // console.log(this.entities);
        let players = this.getEntities('players');

        players = players.map((player) => {

            let ort = (player.has('orientation')) ? player.abilities.orientation.orientation : new Shapes.Vect();


            let vel = player.has('velocity') ? player.abilities.velocity.velocity : new Shapes.Vect();
            let shape = player.abilities.body.shape;
            let dir = ort.multi(shape.radius + 2);
            return Object.assign({}, {
                    id: player.id,
                    socketId: player.socketId,
                    color: player.abilities.body.color,
                    vel,
                    name: player.name,
                    type: player.type,
                    dir: {
                        x: dir.x,
                        y: dir.y,
                        z: dir.z
                    }
                },
                player.abilities.position.pos,
                player.abilities.body.shape

            );
            // return {
            //     id: player.id,
            //     socketId: player.socketId,
            //     x: player.abilities.position.pos.x,
            //     y: player.abilities.position.pos.y,
            //     radius: player.abilities.body.shape.radius,
            //     color: player.abilities.body.color
            // };
        });
        // console.log(Object.keys(players).length);
        this.server.doTick(players);
    };

    // Set new state
    this.changeState = function(state, options = []) {

        [].push.call(this.events, { event: events.CHANGE_STATE, enitity: state, option: option });
        // let evet = [].pop.call(this.events);
        console.log(this.events);
    }

    // Set new state
    this.setState = function(state) {
        this.state = state;
    }

    // execute any new events
    this.handleEvents = function() {
        return this.state.handleEvents(this);
    }

    // render all eater and food
    this.render = function() {
        this.state.render(this);
    }

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
        default: []
    };
    this.addEntity = function(entity, type = 'default') {
        entity.type = type;
        this.entities[type].push(entity);
    };
    this.addEntityType = function(name) {
        this.entities[name] = [];
    };
    this.getEntityById = function(id) {
        // this.entities.forEach(function(entities) {
        for (entitGroup in this.entities) {
            for (entity in this.entities[entitGroup]) {
                if (this.entities[entitGroup][entity].id == id) {
                    return this.entities[entitGroup][entity];
                }
            }
        }
        // });

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
            'userName': data.userName
        };


        // connected to client do setup now
        // this.setup();

        let player = this.joinGame();

        // // Is returning eater :)
        // if (player = this.searchEntity(pid, 'players')) {
        //     console.log('This eater is back again!');
        //     player.socket_id = requestData.socketId;
        //     // letEmEat(players[pid]);
        //     return 0;
        // }

        // var playerPos = new game.Shapes.Vect(Math.floor(Math.random() * (300 - 1 + 1)) + 1, Math.floor(Math.random() * (300 - 1 + 1)) + 1);
        // var playerCirc = new game.Shapes.Circ(10); //Math.floor(Math.random() * (30 - 10 + 1)) + 1);




        // // Add a dot to play with collisions
        // var dotPos = new game.Shapes.Vect(config.canvas.width / 2, config.canvas.height / 2);
        // var dotCirc = new game.Shapes.Circ(25);
        // var dot = new Entity('dot');
        // dot.attach(new Abilities.Body(dotCirc, 'blue'));
        // dot.attach(new Abilities.Position(dotPos));
        // dot.attach(new Abilities.Collidable());
        // dot.attach(new Abilities.Velocity());
        // dot.attach(new Abilities.Mass(40));

        // dot.attach(new Abilities.Orientation());
        // dot.attach(new Abilities.Gravity());
        // this.subSystems.collision.AddEntity(dot);
        // this.subSystems.physics.AddEntity(dot);
        // this.subSystems.motion.AddEntity(dot);

        // this.addEntity(dot, 'players');


        // var player = new Entity(data.userName);
        // player.attach(new Abilities.Body(playerCirc, 'green'));
        // player.attach(new Abilities.Position(playerPos));
        // player.attach(new Abilities.Velocity());
        // player.attach(new Abilities.Input());
        // player.attach(new Abilities.Mass(20));
        // player.attach(new Abilities.Cor());
        // player.attach(new Abilities.Collidable());
        // player.attach(new Abilities.Gravity());

        // player.attach(new Abilities.Orientation());

        // this.subSystems.collision.AddEntity(player);
        // this.subSystems.motion.AddEntity(player);
        // this.subSystems.physics.AddEntity(player);

        // player.socket_id = data.socketId;
        // this.addEntity(player, 'players');

        // // oconnect player and dot with a string
        // // let connString = new Abilities.String(dot.id, player.id, 100, 0.2);
        // // dot.attach(connString);
        // // player.attach(connString);

        this.server.letEmPlay(player);
    };

    this.playerInput = (event) => {

        this.messageBus.add(
            new MessageSystem.Message(MessageSystem.Type.INPUT, [event.playerId], { input: event.params.input })
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