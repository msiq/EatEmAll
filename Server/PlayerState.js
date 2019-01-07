/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "[player]" }] */
/* eslint no-param-reassign:
  ["error", {
    "props": true,
      "ignorePropertyModificationsFor": ["player"],

    }]
*/

class AbstractState {
  constructor(player) {
    this.player = player;
  }

  execute() {
    console.log('You should never see this execute message :( \n, fix it! ');
  }

  setup() {
    this.execute();
    // console.log('You should never see this setup message :( \n, fix it! ');
  }

  update() {
    console.log('You should never see this update message :( \n, fix it! ');
  }
}

class InitState extends AbstractState {
  execute() {
    new Promise((resolve, reject) => {
      setTimeout(() => {
        console.log(player.color);
        player.color = 'green';
        console.log(player.color);
        console.log('Initializing player state');
        resolve('Initializing player state resolved');
      }, 3000);
    });
  }
}

class MenuState extends AbstractState{
  execute() {
    new Promise(
      (resolve, reject) => console.log('you are in menu do whatever you wanted to do and press x to continue!'),
    );
  }
}

class PlayingState extends AbstractState{
  execute() {
    new Promise(
      (resolve, reject) => console.log('player are playing now!'),
    );
  }
}

class KilledState extends AbstractState{
  execute() {
    new Promise(
      (resolve, reject) => console.log('you dieded!'),
    );
  }
}

module.exports = {
  init: InitState,
  menu: MenuState,
  playing: PlayingState,
  killed: KilledState,
};
