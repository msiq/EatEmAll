function AbstractState() {
    this.execute = function() {
        console.log('this should not be printed anywhere..................');
    }
}

function InitState() {
    this.execute = function() {
        console.log('Initializing player state');
    }
}
InitState.prototype = new AbstractState();

function MenuState() {
    this.execute = function() {
        console.log('you are in menu do whatever you wanted to do and press x to continue!');
    }
}
MenuState.prototype = new AbstractState();

function PlayingState() {
    this.execute = function() {
        console.log('player are playing now!');
    }
}
PlayingState.prototype = new AbstractState();

function KilledState() {
    this.execute = function() {
        console.log('you dieded!');
    }
}
KilledState.prototype = new AbstractState();

module.exports = exports =
    PlayerState = {
        init: InitState,
        menu: MenuState,
        playing: PlayingState,
        killed: KilledState
    }