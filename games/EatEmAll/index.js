const path = require('path');
const config = require('./config.json');
const { createDot } = require('./server/entities/Dot.js');
const { createVirus } = require('./server/entities/Virus.js');
const { createPlayer } = require('./server/entities/Player.js');
const { createBot } = require('./server/entities/Bot.js');
const { EatingSystem } = require('./server/systems/EatingSystem.js');
const { BotSteeringSystem } = require('./server/systems/BotSteeringSystem.js');
const { LobbyGameState, RoundActiveGameState, RoundOverGameState } = require('./server/states/MatchStates.js');

const BOT_NAMES = [
    'Apex', 'Nebula', 'Cipher', 'Vortex', 'Blaze',
    'Titan', 'Shadow', 'Phantom', 'Cosmo', 'Pulse'
];

class EatEmAllCartridge {
    static config = config;
    static clientDir = path.join(__dirname, 'client');

    constructor(game) {
        this.game = game;
        this.eatingSystem = new EatingSystem(game);
        this.botSteeringSystem = new BotSteeringSystem(game);
    }

    init() {
        const game = this.game;

        // 1. Declare static layer for dots (full sync on join, deltas on tick)
        game.markLayerStatic('dots');

        // 2. Setup game finite state machine
        game.gameFSM.registerState(new LobbyGameState());
        game.gameFSM.registerState(new RoundActiveGameState());
        game.gameFSM.registerState(new RoundOverGameState());
        game.gameFSM.setState('lobby');

        // 3. Register entity collections
        game.addEntityType('players');
        game.addEntityType('dots');
        game.addEntityType('viruses');

        // 4. Hook eating vs bounce physics resolution
        game.subSystems.collision.filterImpulse = (A, B) => {
            return this.eatingSystem.filterImpulse(A, B);
        };

        // 5. Spawn initial game world
        console.log(`[EatEmAll] Spawning ${config.initialDots} dots, ${config.initialBots} bots & ${config.initialViruses} viruses...`);
        for (let i = 0; i < config.initialDots; i++) {
            createDot(game);
        }
        for (let i = 0; i < config.initialBots; i++) {
            createBot(game, BOT_NAMES[i], this.eatingSystem);
        }
        for (let i = 0; i < config.initialViruses; i++) {
            createVirus(game);
        }

        // 6. Hook bot steering system into game loop
        game.update = () => {
            this.botSteeringSystem.update(0.033);
        };
    }

    onPlayerJoin(socketId, userData) {
        return createPlayer(this.game, { socketId, userName: userData.userName }, this.eatingSystem);
    }
}

module.exports = EatEmAllCartridge;
