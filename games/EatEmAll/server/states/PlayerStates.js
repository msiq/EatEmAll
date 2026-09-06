const { BasePlayerState } = require('../../../../engine');

class ShieldedPlayerState extends BasePlayerState {
    constructor(durationMs = 3500) {
        super('shielded');
        this.durationMs = durationMs;
    }

    enter(player, params) {
        if (params && params.durationMs) this.durationMs = params.durationMs;
        player.state = 'shielded';
    }

    update(player, dt) {
        if (player.playerFSM && player.playerFSM.getTimeInState() >= this.durationMs) {
            player.playerFSM.setState('active');
        }
    }

    exit(player) {
        player.state = 'active';
    }
}

class ActivePlayerState extends BasePlayerState {
    constructor() {
        super('active');
    }

    enter(player) {
        player.state = 'active';
    }
}

class DeadPlayerState extends BasePlayerState {
    constructor() {
        super('dead');
    }

    enter(player) {
        player.state = 'dead';
    }
}

module.exports = {
    ShieldedPlayerState,
    ActivePlayerState,
    DeadPlayerState
};
