const GameClass = require('./Server/GameClass.js');
const Game = require('./Game.js');

if (Game instanceof GameClass === false) {
  console.log(`Game Must be an instance of GameClass, instance of ${Game.constructor.name} given!`);
  console.log('Please correct the problem and try again!');
}

// const players = {};

// Game.setState(new GameState.init());
// let gameInterval = false;
// doGameLoop();

Game.start();
// Game.stop();

/** Dont do loop here it should be hidden in Game someehow */

// // do Game Loop
// function doGameLoop() {

//     let eventsPromise = Game.handleEvents();
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
//     const initializeGame = Game.currentState.setup()

//     // wait for Game to finish initialization
//     initializeGame.then((res) => {

//         // Set menu game State
//         Game.setState(new GameState.menu());

//         console.log(res);
//         // set game in Menu state and wait for something
//         return Game.currentState.setup();
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
