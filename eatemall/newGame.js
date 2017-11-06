// const config = require('./config.js');
// const GameServer = require('./GameServer.js');

// const GameState = require('./GameState.js');
const Game = require('./GameClass.js');
// const PlayerState = require('./PlayerState.js');
// const Player = require('./Player.js');

const Shapes = require('./Shapes.js');

var game = new Game();
game.setup = function() {
    // const shapes = game.Shapes;
    // const abilities = game.abilities;
    // const subSystems = game.subSystems;

    game.addEntityType('players');
    game.addEntityType('dots');

    console.log('setting up game');
    // console.log(game.activeConnections);


    // add some dots
    for (let i = 0; i < 5; i++) {
        initiateDot(this);
    }


    // this.server.letEmPlay(player);

};

game.joinGame = function() {
    return initiatePlayer(this);
}

game.update = function() {
    // console.log('I am updating...');
    // game.entities['players'].forEach(function(entity) {
    //     console.log(JSON.stringify(entity));
    // }, this);




};



function initiatePlayer(game) {

    // console.log(game);



    const player = new game.Entity(game.activeConnections[Object.keys(game.activeConnections)[0]].userName);

    let playerPos = new game.shapes.Vect(Math.floor(Math.random() * (300 - 1 + 1)) + 1, Math.floor(Math.random() * (300 - 1 + 1)) + 1);
    let playerCirc = new game.shapes.Circ(15);

    player.attach(new game.abilities.Body(playerCirc, 'green'));
    player.attach(new game.abilities.Position(playerPos));
    player.attach(new game.abilities.Velocity());
    player.attach(new game.abilities.Input());
    player.attach(new game.abilities.Mass(50));
    player.attach(new game.abilities.Cor(0));
    player.attach(new game.abilities.Collidable());

    // player.attach(new game.abilities.Gravity());

    player.attach(new game.abilities.Orientation());

    // player.attach(new game.abilities.Torque());
    // player.attach(new game.abilities.Acceleration());
    player.attach(new game.abilities.AngularVelocity());

    game.subSystems.collision.AddEntity(player);
    game.subSystems.motion.AddEntity(player);
    game.subSystems.physics.AddEntity(player);

    console.log('-------------------------lll', game.activeConnections);

    player.socket_id = Object.keys(game.activeConnections)[0];
    game.addEntity(player, 'players');

    return player;
}


function initiateDot(game) {

    var dotPos = new game.shapes.Vect(Math.floor(Math.random() * (300 - 1 + 1)) + 1, Math.floor(Math.random() * (300 - 1 + 1)) + 1)
        // (game.config.canvas.width / 2, game.config.canvas.height / 2);
    var dotCirc = new game.shapes.Circ(12);
    var dot = new game.Entity('dot');

    dot.attach(new game.abilities.Body(dotCirc, 'blue'));
    dot.attach(new game.abilities.Position(dotPos));
    dot.attach(new game.abilities.Collidable());
    dot.attach(new game.abilities.Velocity());
    dot.attach(new game.abilities.Mass(110));

    dot.attach(new game.abilities.Orientation());
    // dot.attach(new game.abilities.Gravity());

    dot.attach(new game.abilities.AngularVelocity());

    dot.attach(new game.abilities.Cor(0));

    game.subSystems.collision.AddEntity(dot);
    game.subSystems.physics.AddEntity(dot);
    game.subSystems.motion.AddEntity(dot);

    game.addEntity(dot, 'players');
}

module.exports = exports = game;