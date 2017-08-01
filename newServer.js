// const config = require('./eatemall/config.js');
// const GameServer = require('./eatemall/GameServer.js');

// const GameState = require('./eatemall/GameState.js');
const GameClass = require('./eatemall/GameClass.js');
// const PlayerState = require('./eatemall/PlayerState.js');
// const Player = require('./eatemall/Player.js');

const newGame = require('./eatemall/newGame.js');

if (newGame instanceof GameClass === false) {
    console.log('Game Must be an instance of GameClass, instance of ' + newGame.constructor.name + ' given!');
    console.log('Please correct the problem and try again!');
}

const players = {};

game = newGame;

// game.setState(new GameState.init());
// let gameInterval = false;
// doGameLoop();


game.start();
// game.stop();


/** Dont do loop here it should be hidden in Game someehow */



// // do Game Loop
// function doGameLoop() {

//     let eventsPromise = game.handleEvents();
//     eventsPromise.then(() => {

//     });

//     if (!gameInterval) {
//         gameInterval = setInterval(doGameLoop, 1000 / config.server.frameRate);
//     }
// }

// /* Initialize Game */
// (function() {

//     // start initializing all the things needed to run Server, 
//     // init state is set on declaration
//     const initializeGame = game.currentState.setup()

//     // wait for Game to finish initialization
//     initializeGame.then((res) => {

//         // Set menu game State
//         game.setState(new GameState.menu());

//         console.log(res);
//         // set game in Menu state and wait for something
//         return game.currentState.setup();
//     }).catch((exp) => {
//         console.log('something failed while initializing game!');
//         console.log(exp);
//     }).then((res) => {
//         // wait for first player to login and then procceed
//         GameServer.serve();
//         doGameLoop();
//         console.log(res);
//     }).catch((exp) => {
//         console.log('something failed in menu!');
//         console.log(exp);
//     });
// })();