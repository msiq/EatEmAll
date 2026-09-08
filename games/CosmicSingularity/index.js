const path = require("path");
const config = require("./config.json");
const { createBlackHole } = require("./server/entities/BlackHole.js");
const { createPlanet } = require("./server/entities/Planet.js");
const { createStardust } = require("./server/entities/Stardust.js");
const { createAsteroid } = require("./server/entities/Asteroid.js");
const { createPulsar } = require("./server/entities/Pulsar.js");
const { SpacePhysicsSystem } = require("./server/systems/SpacePhysicsSystem.js");

class CosmicSingularityCartridge {
    static config = config;
    static cartridgeDir = __dirname;
    static visualsPath = path.join(__dirname, "visuals.js");

    constructor(game) {
        this.game = game;
        this.physicsSystem = new SpacePhysicsSystem(game, config);
    }

    init() {
        const game = this.game;

        // Register all celestial entity collections
        game.addEntityType("blackholes");
        game.addEntityType("planets");
        game.addEntityType("stardust");
        game.addEntityType("asteroids");
        game.addEntityType("pulsars");

        // 1. Spawn Stardust Micro-Motes
        const sdCount = config.stardustCount || 280;
        // spawner log
        for (let i = 0; i < sdCount; i++) {
            createStardust(game, config.canvas);
        }

        // 2. Spawn Asteroids (Tactical Obstacles / Virus Equivalent)
        const astCount = config.asteroidCount || 22;
        // spawner log
        for (let i = 0; i < astCount; i++) {
            createAsteroid(game, config.canvas);
        }

        // 3. Spawn Pulsars (Magnetized Neutron Stars)
        const psrCount = config.pulsarCount || 4;
        // spawner log
        for (let i = 0; i < psrCount; i++) {
            createPulsar(game, config.canvas, i, psrCount);
        }

        // 4. Spawn Orbiting Planets
        const pCount = config.planetCount || 120;
        // spawner log
        for (let i = 0; i < pCount; i++) {
            createPlanet(game, config.canvas);
        }

        // 5. Spawn Bot Black Holes
        const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
        for (let i = 0; i < config.botCount; i++) {
            createBlackHole(game, {
                name: "Bot Singularity " + (i+1),
                isBot: true,
                color: colors[i % colors.length],
                canvas: config.canvas
            });
        }

        game.playerInput = (event) => {
            const bh = (game.entities["blackholes"] || []).find(p => p.socketId === event.playerId);
            if (bh) {
                if (event.angle !== undefined) {
                    bh.targetAngle = event.angle;
                    bh.angle = event.angle;
                }
                if (event.isThrusting !== undefined) {
                    bh.isThrusting = Boolean(event.isThrusting);
                } else if (event.x !== undefined && event.y !== undefined) {
                    const dist = Math.hypot(event.x, event.y);
                    bh.isThrusting = (dist > 0.1);
                }
                // Analog throttle based on cursor distance for fine precision aiming
                if (event.x !== undefined && event.y !== undefined) {
                    const dist = Math.hypot(event.x, event.y);
                    bh.throttle = Math.min(1.0, Math.max(0.35, dist));
                } else {
                    bh.throttle = 1.0;
                }
            }
        };

        game.update = () => {
            const dt = 1.0 / config.fps;
            this.physicsSystem.update(dt);
        };

        game.joinGame = (data) => {
            return this.onPlayerJoin(data.socketId, data);
        };
        
        game.onPlayerDisconnect = (socketId) => {
            this.onPlayerDisconnect(socketId);
        };
    }

    onPlayerJoin(socketId, userData) {
        const name = (userData && userData.userName) || "Nova";
        return createBlackHole(this.game, {
            name,
            socketId,
            isBot: false,
            color: "#38bdf8", // Signature player cyan
            canvas: config.canvas
        });
    }

    onPlayerDisconnect(socketId) {
        const bhs = this.game.entities["blackholes"] || [];
        const index = bhs.findIndex(p => p.socketId === socketId);
        if (index >= 0) bhs.splice(index, 1);
    }
}

module.exports = CosmicSingularityCartridge;
