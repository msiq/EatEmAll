/* eslint-disable class-methods-use-this */
// const events = require('./events.js');

/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "game" }] */

function startLoading() {
  const loading = ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'];

  let ctrl = 0;
  return setInterval(() => {
    ctrl = ctrl === loading.length ? 0 : ctrl;
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(`loading ${loading[ctrl]}`);
    ctrl++;
  }, 1000 / 10);
}

function stopLoading(LoadingCtrl) {
  clearInterval(LoadingCtrl);
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write('loading done! \n');
}

class AbstractGameState {
  constructor() {
    this.initialized = false;
  }

  execute(game) {
    console.log('You should never see this execute message :( \n, fix it! ');
  }

  setup(game) {
    console.log('You should never see this setup message :( \n, fix it! ');
    // return this.execute();
  }

  handleEvents(game) {
    console.log('You should never see this events message :( \n, fix it! ');
  }

  update(game) {
    console.log('You should never see this updating message :( \n, fix it! ');
  }

  render(game) {
    console.log('You should never see this rendering message :( \n, fix it! ');
  }
}

class InitGameState extends AbstractGameState {
  execute(game) {
    return new Promise((resolve) => {
      // Start loading animation
      const loadingControl = startLoading();
      process.stdout.write('Initializing game...\n');
      setTimeout(() => {
        // Stop loading animation
        stopLoading(loadingControl);
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write('Initializing done!\n');
        resolve('init resolved');
      }, 3000);
      // reject('true');
    });
  }

  handleEvents(game) {
    return new Promise((resolve) => {
      // for (let event in game.events) {
      //     switch (event.event) {
      //         case events.CHANGE_STATE:
      //             game.setState(event.entity);
      //             break;
      //     }
      // }
      this.execute().then(() => {
        resolve('handle envents resolved');
      });
    });
  }
}

class MenuGameState extends AbstractGameState {
  execute(game) {
    return new Promise(resolve => setTimeout(() => {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write('you are in the menu :)\n');
      return resolve('menu resolved');
    }, 4000));
  }
}

class PlayGameState extends AbstractGameState {
  execute(game) {
    console.log('starting now...');
  }
}


class FinishGameState extends AbstractGameState {
  execute(game) {
    console.log('you ar dead! :( Ending game!');
  }
}

module.exports = {
  init: InitGameState,
  menu: MenuGameState,
  play: PlayGameState,
  finish: FinishGameState,
};
