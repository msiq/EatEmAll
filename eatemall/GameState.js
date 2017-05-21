var GameState = {
    init: InitGameState,
    menu: MenuGameState,
    play: PlayGameState,
    finish: FinishGameState,
}
module.exports =
    exports = GameState;

function AbstractGameState() {
    this.execute = function(game) {
        console.log('You should never see this message :( \n, fix it! ');
    }
}

function InitGameState() {
    this.execute = function(game) {
        return new Promise(function(resolve, reject) {
            // Start loading animation
            const loadingControl = startLoading();
            process.stdout.write('Initializing game...' + '\n');
            setTimeout(function() {

                // Stop loading animation
                stopLoading(loadingControl);
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write('Initializing done!' + '\n');
                resolve('init resolved');
            }, 6000);
            // reject('true');
        });
    }
}
InitGameState.prototype = new AbstractGameState;

function MenuGameState() {
    this.execute = function(game) {
        return new Promise(function(resolve, reject) {
            setTimeout(function() {
                process.stdout.clearLine();
                process.stdout.cursorTo(0);
                process.stdout.write('you are in the menu :)   \n');
                resolve('menu resolved');
            }, 4000);
            // reject('true');
        });
    }
}
MenuGameState.prototype = new AbstractGameState;

function PlayGameState() {
    this.execute = function(game) {
        console.log('starting now...');
    }
}

PlayGameState.prototype = new AbstractGameState;

function FinishGameState() {
    this.execute = function(game) {
        console.log('you ar dead! :( Ending game!');
    }
}
FinishGameState.prototype = new AbstractGameState;

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