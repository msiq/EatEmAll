module.exports =
    exports = function Game(GameState) {
        this.gameStates = GameState;
        // set Initial game state
        this.currentState = new this.gameStates.init();

        // Set new state if given state is valid
        this.setState = function(state) {
            this.currentState = state;
        };
    };