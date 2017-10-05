// const config = require('./config.js');
// const GameServer = require('./GameServer.js');

// const GameState = require('./GameState.js');
const GameClass = require('./GameClass.js');
// const PlayerState = require('./PlayerState.js');
// const Player = require('./Player.js');

const Shapes = require('./Shapes.js');

var game = new GameClass();
game.setup = function() {
    game.addEntityType('players');
    game.addEntityType('dots');

    // var player = addPlayer();
    // console.log(player);
    // game.addEntity(player, 'players');

    // var player = addPlayer();
    // // console.log(player);
    // game.addEntity(player, 'players');

    // for (var i = 0; i < 1; i++) {
    //     // console.log(JSON.stringify(makeDot()));
    //     game.addEntity(addDot(), 'dots');
    // }

    console.log('setting up game');

    // test vector class
    // let v = new Shapes.Vect(-6, 8, 0);
    // let v2 = new Shapes.Vect(5, 12, 0);
    // let v3 = v.rev();
    // console.log(v);
    // console.log(v3);
    // let unit = v.unit();
    // console.log(unit);
    // console.log(unit.mag());
    // return;

    // console.log(game.entities['players']);
};

game.update = function() {
    // console.log('I am updating...');
    // game.entities['players'].forEach(function(entity) {
    //     console.log(JSON.stringify(entity));
    // }, this);




};

function addDot() {
    var dotPos = new game.Shapes.Vect(
        Math.floor(Math.random() * (300 - 1 + 1)) + 1,
        Math.floor(Math.random() * (300 - 1 + 1)) + 1
    );
    var dotCirc = new game.Shapes.Circ(Math.floor(Math.random() * (20 - 10 + 1)) + 10, dotPos);
    return game.Entity.createEnemy();
}

// function addPlayer() {

//     // console.log(game.Entity);
//     var playerPos = new game.Shapes.Vect(10, 20);
//     var playerCirc = new game.Shapes.Circ(20, playerPos);
//     return game.Entity.createPlayer('name', { shapes: playerCirc });

// }

module.exports = exports = game;