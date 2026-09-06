const { BaseGameState } = require('../../../../engine');

class LobbyGameState extends BaseGameState {
    constructor() {
        super('lobby');
    }

    enter(game) {
        console.log('[GameFSM] Entered Lobby state');
    }

    update(game, dt) {
        const activePlayers = game.entities && game.entities['players']
            ? game.entities['players'].filter(p => !p.isBot)
            : [];

        // When at least 1 human player connects, start match round
        if (activePlayers.length > 0) {
            game.gameFSM.setState('round_active', { durationSec: 180 });
        }
    }
}

class RoundActiveGameState extends BaseGameState {
    constructor() {
        super('round_active');
        this.timeRemaining = 180;
    }

    enter(game, params) {
        this.timeRemaining = (params && params.durationSec) || 180;
        console.log(`[GameFSM] Round active! Time limit: ${this.timeRemaining}s`);
    }

    update(game, dt) {
        this.timeRemaining = Math.max(0, this.timeRemaining - dt);
        if (this.timeRemaining <= 0) {
            game.gameFSM.setState('round_over', { durationSec: 8 });
        }
    }

    getStateData() {
        return {
            timeRemaining: Math.ceil(this.timeRemaining),
            totalDuration: 180
        };
    }
}

class RoundOverGameState extends BaseGameState {
    constructor() {
        super('round_over');
        this.celebrateTime = 8;
        this.winner = null;
    }

    enter(game, params) {
        this.celebrateTime = (params && params.durationSec) || 8;

        // Compute match winner (player with highest score)
        let topScore = -1;
        let topPlayer = 'No one';

        if (game.entities && game.entities['players']) {
            game.entities['players'].forEach(p => {
                const s = (p.abilities.score && p.abilities.score.score) || 0;
                if (s > topScore) {
                    topScore = s;
                    topPlayer = p.name || 'Anonymous';
                }
            });
        }

        this.winner = { name: topPlayer, score: topScore };
        console.log(`[GameFSM] Round Over! Winner: ${topPlayer} (${topScore} pts)`);

        if (game.addTickEvent) {
            game.addTickEvent({
                type: 'round_over',
                winner: this.winner
            });
        }
    }

    update(game, dt) {
        this.celebrateTime -= dt;
        if (this.celebrateTime <= 0) {
            // Reset scores & restart round
            if (game.entities && game.entities['players']) {
                game.entities['players'].forEach(p => {
                    if (p.abilities.score) p.abilities.score.score = 0;
                    if (p.abilities.body && p.abilities.body.shape) {
                        p.abilities.body.shape.radius = 20;
                        if (p.abilities.aabb) p.abilities.aabb = new game.abilities.Aabb(p.abilities.body);
                    }
                });
            }
            game.gameFSM.setState('round_active', { durationSec: 180 });
        }
    }

    getStateData() {
        return {
            winner: this.winner,
            celebrateTime: Math.ceil(this.celebrateTime)
        };
    }
}

module.exports = {
    LobbyGameState,
    RoundActiveGameState,
    RoundOverGameState
};
