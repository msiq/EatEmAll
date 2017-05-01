module.exports =
    exports = function Game(GameState) {
        this.gameStates = GameState;
        // Initialize the game
        this.currentState = new this.gameStates.init();
        //new GameState.init();
        this.init = function() {
            this.currentState = new this.gameStates.init();
        };
        // change state if given state is valid
        this.changeState = function(state) {
            this.currentState = state;
        };
    };