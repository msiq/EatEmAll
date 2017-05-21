var GameState = require('./eatemall/GameState.js');
var Game = require('./eatemall/Game.js');
var PlayerState = require('./eatemall/PlayerState.js');
var Player = require('./eatemall/Player.js');

var player;

game = new Game(GameState);

/* Initialize Game */
(function() {

    // start initializing all the things needed to run Server, 
    // init state is set on declaration
    var initializeGame = game.currentState.execute()

    // wait for Game to finish initialization
    initializeGame.then(function(res) {

        // Set menu game State
        game.setState(new GameState.menu());

        console.log(res);
        // set game in Menu state and wait for something
        return game.currentState.execute();
    }).catch(function(exp) {
        console.log('something failed while initializing game!');
        console.log(exp);
    }).then(function(res) {

        initializePlayer();
        player = new Player();
        // player.currentState.execute();
        console.log(res);
    }).catch(function(exp) {
        console.log('something failed in menu!');
        console.log(exp);
    });
})();


function initializePlayer() {

    player = new Player();
    player.currentState.execute();
    player.setState(new PlayerState.menu());
}

function doGame() {
    // Game.currentState.execute();
    // doGameLoop();
}

// console.log(Core.GameState);
// return;

function doGameLoop() {
    setInterval(function() {
        console.log('.');
        // doGame();
        // console.log(Object.getOwnPropertyNames(state));
        // console.log('----> '+ player.name + ' -- state---> ' + player.state);
    }, 1000 / 1);
}

function inhertis(Sub, Super) {
    Sub.super_ = Super;
    Sub.prototype = Object.create(Super.prototype, {
        constructor: {
            value: Sub,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });

}