const config = require('./config.js');

const GameServer = require('./GameServer.js');
const events = require('./events.js');
const gameStates = require('./GameState.js');
const Entity = require('./Entity.js');
const Shapes = require('./Shapes.js');
const Player = require('./Player.js');


var Game = function Game() {
    this.server = new GameServer();

    this.state = false;
    this.players = {};
    this.active = false;
    this.control = false;


    this.events = {};

    this.setup = function() {
        console.log('I am default setup....');

    };
    this.update = function() {
        console.log('i am default update');
    };

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
            players.forEach((player) => {
                Object.keys(player.abilities).forEach((comp) => {
                    player.abilities[comp].update(player);
                })
            });
        }
    };

    this.isActive = function() {
        return !!this.active;
    };

    this.doTick = function() {

        // console.log(this.entities);
        let players = this.getEntities('players');
        players = players.map((player) => {
            return {
                id: player.id,
                socketId: player.socketId,
                x: player.abilities.body.shape.pos.x,
                y: player.abilities.body.shape.pos.y,
                redius: player.abilities.body.shape.redius,
                color: player.abilities.body.color
            };
        })
        console.log(Object.keys(players).length);
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
    this.Shapes = Shapes;

    /** Entity object constructor */
    this.Entity = new Entity();
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
        this.entities[type].push(entity);
    };
    this.addEntityType = function(name) {
        this.entities[name] = [];
    };
    this.getEntities = function(type) {
        if (this.entities[type] !== undefined) {
            return this.entities[type];
        }

        throw 'Entities of type "' + type + '" does not exists!';
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
    this.onletMeEat = (data) => {
        console.log('let meeeeeeeeeeeeeeeeee    eattt!');
        let pid = data.oldId;
        // if info missing dont let em eat anything :|
        if (data.userName == '') {
            this.server.goaway(data.socketId);
            return 0;
        }

        // // Is returning eater :)
        // if (player = this.searchEntity(pid, 'players')) {
        //     console.log('This eater is back again!');
        //     player.socket_id = requestData.socketId;
        //     // letEmEat(players[pid]);
        //     return 0;
        // }

        var playerPos = new game.Shapes.Vect(Math.floor(Math.random() * (300 - 1 + 1)) + 1, Math.floor(Math.random() * (300 - 1 + 1)) + 1);
        var playerCirc = new game.Shapes.Circ(Math.floor(Math.random() * (30 - 10 + 1)) + 1, playerPos);
        var player = this.Entity.createPlayer(data.userName, playerCirc, 'blue');
        player.socket_id = data.socketId;
        this.addEntity(player, 'players');

        this.server.letEmEat(player);
    };

    this.playerAction = (event) => {
        var player = this.searchEntity(event.playerId, 'players');
        player.addAction(event.action, event.params);
        console.log(player);
        // var motion = player.has('motion');
        // if (motion.hasOwnProperty(event.action)) {
        //     player.abilities.body.shape.pos = motion[event.action](player.abilities.body.shape.pos);
        // }
        // player.abilities.body.shape.pos = this[event.action](player.abilities.body.shape.pos);
    };
};




module.exports = exports = Game;