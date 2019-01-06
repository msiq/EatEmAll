/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "[player]" }] */
/* eslint no-param-reassign:
  ["error", {
    "props": true,
      "ignorePropertyModificationsFor": ["player"],

    }]
*/

function AbstractState(player) {
  this.execute = () => console.log('You should never see this execute message :( \n, fix it! ');
  this.setup = () => this.execute();
  // console.log('You should never see this setup message :( \n, fix it! ');
  this.update = () => console.log('You should never see this update message :( \n, fix it! ');
}
const abstractState = new AbstractState();

function InitState(player) {
  this.execute = () => new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(player.color);
      player.color = 'green';
      console.log(player.color);
      console.log('Initializing player state');
      resolve('Initializing player state resolved');
    }, 3000);
  });
}
InitState.prototype = abstractState;

function MenuState(player) {
  this.execute = () => new Promise(
    (resolve, reject) => console.log('you are in menu do whatever you wanted to do and press x to continue!'),
  );
}
MenuState.prototype = abstractState;

function PlayingState(player) {
  this.execute = () => new Promise(
    (resolve, reject) => console.log('player are playing now!'),
  );
}
PlayingState.prototype = abstractState;

function KilledState(player) {
  this.execute = () => new Promise(
    (resolve, reject) => console.log('you dieded!'),
  );
}
KilledState.prototype = abstractState;

module.exports = {
  init: InitState,
  menu: MenuState,
  playing: PlayingState,
  killed: KilledState,
};
