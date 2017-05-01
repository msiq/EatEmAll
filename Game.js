// Here we have some core components
exports.Game = function Game() {
    // Initialize the game
    // this.currentState = new GameSate.init();

    // change state if givin state is valid
    this.changeState = function(state) {
        this.currentState = state;
    }
}