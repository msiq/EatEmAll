/**
 * Generic Finite State Machine for Game Lifecycle Management
 * 100% Game-Agnostic ECS Engine Subsystem
 */

class BaseGameState {
    constructor(name) {
        this.name = name;
    }
    enter(game, payload = {}) {}
    update(game, dt) {}
    exit(game) {}
    canTransitionTo(nextStateName) {
        return true;
    }
}

class GameStateMachine {
    constructor(game) {
        this.game = game;
        this.states = new Map();
        this.currentState = null;
        this.stateStartTime = Date.now();
    }

    registerState(stateInstance) {
        if (!stateInstance || !stateInstance.name) {
            throw new Error("Invalid state: must have a name");
        }
        this.states.set(stateInstance.name, stateInstance);
        return this;
    }

    setState(stateName, payload = {}) {
        const nextState = this.states.get(stateName);
        if (!nextState) {
            console.warn(`[GameFSM] Unknown state: ${stateName}`);
            return false;
        }

        if (this.currentState) {
            if (!this.currentState.canTransitionTo(stateName)) {
                console.warn(`[GameFSM] Illegal transition from ${this.currentState.name} to ${stateName}`);
                return false;
            }
            this.currentState.exit(this.game);
        }

        const prevState = this.currentState ? this.currentState.name : null;
        this.currentState = nextState;
        this.stateStartTime = Date.now();
        this.currentState.enter(this.game, payload);

        if (this.game && typeof this.game.addTickEvent === 'function') {
            this.game.addTickEvent({
                type: 'game_state_changed',
                state: stateName,
                prev: prevState,
                timestamp: this.stateStartTime
            });
        }
        return true;
    }

    update(dt) {
        if (this.currentState && typeof this.currentState.update === 'function') {
            this.currentState.update(this.game, dt);
        }
    }

    getStateName() {
        return this.currentState ? this.currentState.name : 'uninitialized';
    }

    getTimeInState() {
        return Date.now() - this.stateStartTime;
    }

    getRemainingTime(durationMs) {
        return Math.max(0, durationMs - this.getTimeInState());
    }
}

module.exports = {
    BaseGameState,
    GameStateMachine
};
