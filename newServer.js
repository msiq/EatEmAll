var GameState = require('./eatemall/GameState.js');
var Game = new require('./eatemall/Game.js');
var PlayerState = require('./eatemall/PlayerState.js');
var Player = new require('./eatemall/Player.js');


Game = new Game(GameState);
Game.init();

var player;


function initializePlayer() {
    player = new Player();
    player.currentState.execute();
    player.changeState(new PlayerState.menu());
}

function initGame() {
    var LoadingCtrl = startLoading();

    player = new Player();
    var initializeGame = Game.currentState.execute()
    initializeGame.then(function(res) {
        stopLoading(LoadingCtrl);
        Game.changeState(new GameState.menu());

        initializePlayer();

        console.log(res);
        return Game.currentState.execute();
    }).then(function(res) {

        player.currentState.execute();
        console.log(res);
    });
}

function doGame() {
    // Game.currentState.execute();
    // doGameLoop();
}

// console.log(Core.GameState);
// return;

initGame();

function doGameLoop() {
    setInterval(function() {
        console.log('.');
        // doGame();
        // console.log(Object.getOwnPropertyNames(state));
        // console.log('----> '+ player.name + ' -- state---> ' + player.state);
    }, 1000 / 1);
}


function startLoading() {
    var loading = ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙', ];

    var ctrl = 0;
    return setInterval(function() {
            ctrl = (ctrl == loading.length) ? 0 : ctrl;
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write('loading ' + loading[ctrl]);
            ctrl++;
        },
        1000 / 10);
}

function stopLoading(LoadingCtrl) {
    clearInterval(LoadingCtrl);
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write('loading done!' + '\n');
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