const path = require("path");
const config = require("./config.json");
const { createTank } = require("./server/entities/Tank.js");
const { createObstacle } = require("./server/entities/Obstacle.js");
const { CombatSystem } = require("./server/systems/CombatSystem.js");
const { TankBotSystem } = require("./server/systems/TankBotSystem.js");

const TANK_BOT_NAMES = [
    "Panzer", "Abrams", "T-90", "Challenger", "Leopard", "Viper"
];

class TankWarCartridge {
    static config = config;
    static cartridgeDir = __dirname;
    static clientDir = path.join(__dirname, "client");
    static visualsPath = path.join(__dirname, "visuals.js");

    constructor(game) {
        this.game = game;
        this.combatSystem = new CombatSystem(game, config);
        this.botSystem = new TankBotSystem(game, config);
    }

    init() {
        const game = this.game;

        // Register entity collections
        game.addEntityType("players");
        game.addEntityType("bullets");
        game.addEntityType("obstacles");

        // Spawn concrete barricade obstacles
        const obsCount = config.obstacleCount || 14;
        console.log(`[TankWar] Spawning ${obsCount} concrete barricades and ${config.botCount} tank bots...`);
        for (let i = 0; i < obsCount; i++) {
            createObstacle(game, {
                radius: 28,
                health: 50
            });
        }

        // Spawn combat bots
        const botCount = config.botCount || 6;
        for (let i = 0; i < botCount; i++) {
            createTank(game, {
                name: TANK_BOT_NAMES[i] || `Bot-${i+1}`,
                isBot: true,
                color: "#d97706"
            });
        }

        // Route player input and click to combat system
        game.playerInput = (event) => {
            const tank = (game.entities["players"] || []).find(p => p.id === event.playerId || p.socketId === event.playerId);
            if (tank) {
                this.combatSystem.handleInput(tank, event);
            }
        };

        game.playerClick = (event) => {
            const tank = (game.entities["players"] || []).find(p => p.id === event.playerId || p.socketId === event.playerId);
            if (tank) {
                this.combatSystem.handleClick(tank, event);
            }
        };

        // Hook game simulation update loop
        game.update = () => {
            const dt = 0.033;
            this.combatSystem.update(dt);
            this.botSystem.update(dt);
        };
    }

    onPlayerJoin(socketId, userData) {
        const game = this.game;
        const name = (userData && userData.userName) || "Tank Commander";
        const playerTank = createTank(game, {
            name,
            socketId,
            isBot: false,
            color: "#16a34a"
        });
        return playerTank;
    }

    onPlayerDisconnect(socketId) {
        const game = this.game;
        const players = game.entities["players"] || [];
        const index = players.findIndex(p => p.socketId === socketId);
        if (index >= 0) {
            console.log(`[TankWar] Tank ${players[index].name} disconnected.`);
            players.splice(index, 1);
        }
    }
}

module.exports = TankWarCartridge;
