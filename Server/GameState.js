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

function AbstractGameState() {
  this.initialized = false;
  this.execute = (game) => {
    console.log('You should never see this execute message :( \n, fix it! ');
  };
  this.setup = (game) => {
    console.log('You should never see this setup message :( \n, fix it! ');
    // return this.execute();
  };
  this.handleEvents = (game) => {
    console.log('You should never see this events message :( \n, fix it! ');
  };
  this.update = (game) => {
    console.log('You should never see this updating message :( \n, fix it! ');
  };
  this.render = (game) => {
    console.log('You should never see this rendering message :( \n, fix it! ');
  };
}

function InitGameState() {
  this.execute = game => new Promise((resolve) => {
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

  this.handleEvents = game => new Promise((resolve) => {
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
InitGameState.prototype = new AbstractGameState();

function MenuGameState() {
  this.execute = game => new Promise(resolve => setTimeout(() => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write('you are in the menu :)\n');
    return resolve('menu resolved');
  }, 4000));
}
MenuGameState.prototype = new AbstractGameState();

function PlayGameState() {
  this.execute = (game) => {
    console.log('starting now...');
  };
}

PlayGameState.prototype = new AbstractGameState();

function FinishGameState() {
  this.execute = (game) => {
    console.log('you ar dead! :( Ending game!');
  };
}
FinishGameState.prototype = new AbstractGameState();

module.exports = {
  init: InitGameState,
  menu: MenuGameState,
  play: PlayGameState,
  finish: FinishGameState,
};
