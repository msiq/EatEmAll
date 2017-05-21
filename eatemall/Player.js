module.exports =
    exports =
    Player = function(name) {
        this.name = name;
        this.currentState = new PlayerState.init();
        this.setState = function(newState) {
            this.currentState = newState;
        }
    }