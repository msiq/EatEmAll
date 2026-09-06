/**
 * Generic Finite State Machine for Player Entity Lifecycle
 * 100% Game-Agnostic ECS Component / State Engine
 */

class BasePlayerState {
    constructor(name) {
        this.name = name;
    }
    enter(player, payload = {}) {}
    update(player, dt) {}
    exit(player) {}
    canTransitionTo(nextStateName) {
        return true;
    }
}

class PlayerStateMachine {
    constructor(player) {
        this.player = player;
        this.states = new Map();
        this.currentState = null;
        this.stateStartTime = Date.now();
    }

    registerState(stateInstance) {
        if (!stateInstance || !stateInstance.name) {
            throw new Error("Invalid player state: must have a name");
        }
        this.states.set(stateInstance.name, stateInstance);
        return this;
    }

    setState(stateName, payload = {}) {
        const nextState = this.states.get(stateName);
        if (!nextState) {
            console.warn(`[PlayerFSM] Unknown state: ${stateName}`);
            return false;
        }

        if (this.currentState) {
            if (!this.currentState.canTransitionTo(stateName)) {
                console.warn(`[PlayerFSM] Illegal transition from ${this.currentState.name} to ${stateName}`);
                return false;
            }
            this.currentState.exit(this.player);
        }

        const prevState = this.currentState ? this.currentState.name : null;
        this.currentState = nextState;
        this.stateStartTime = Date.now();
        this.player.state = stateName;
        this.currentState.enter(this.player, payload);

        if (this.player.game && typeof this.player.game.addTickEvent === 'function') {
            this.player.game.addTickEvent({
                type: 'player_state_changed',
                playerId: this.player.id,
                state: stateName,
                prev: prevState
            });
        }
        return true;
    }

    update(dt) {
        if (this.currentState && typeof this.currentState.update === 'function') {
            this.currentState.update(this.player, dt);
        }
    }

    getStateName() {
        return this.currentState ? this.currentState.name : 'uninitialized';
    }

    getTimeInState() {
        return Date.now() - this.stateStartTime;
    }

    isShielded() {
        return this.getStateName() === 'shielded';
    }
}

module.exports = {
    BasePlayerState,
    PlayerStateMachine
};
