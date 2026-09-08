const path = require("path");
const config = require("./config.json");
const { createBlackHole } = require("./server/entities/BlackHole.js");
const { createPlanet } = require("./server/entities/Planet.js");
const { createStardust } = require("./server/entities/Stardust.js");
const { createAsteroid } = require("./server/entities/Asteroid.js");
const { createPulsar } = require("./server/entities/Pulsar.js");
const { createWormhole } = require("./server/entities/Wormhole.js");
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

        // Iterate over galaxies and spawn entities in each
        const galaxies = config.galaxies || [{ name: "Universe", x: 0, y: 0, width: config.canvas.width, height: config.canvas.height }];
        
        for (let gIdx = 0; gIdx < galaxies.length; gIdx++) {
            const g = galaxies[gIdx];
            const localCanvas = { width: g.width, height: g.height, offsetX: g.x, offsetY: g.y };

            const sdCount = config.stardustCount || 100;
            for (let i = 0; i < sdCount; i++) createStardust(game, localCanvas);

            const astCount = config.asteroidCount || 8;
            for (let i = 0; i < astCount; i++) createAsteroid(game, localCanvas);

            const psrCount = config.pulsarCount || 1;
            for (let i = 0; i < psrCount; i++) createPulsar(game, localCanvas, i, psrCount);

            const pCount = config.planetCount || 40;
            for (let i = 0; i < pCount; i++) createPlanet(game, localCanvas);

            const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
            const bCount = config.botCount || 2;
            for (let i = 0; i < bCount; i++) {
                let bot = createBlackHole(game, {
                    name: "Bot " + g.name + " " + (i+1),
                    isBot: true,
                    color: colors[i % colors.length],
                    canvas: localCanvas
                });
                bot.galaxyBounds = { minX: g.x, maxX: g.x + g.width, minY: g.y, maxY: g.y + g.height };
            }
            
            // Spawn Wormhole connecting to next galaxy
            if (galaxies.length > 1) {
                const nextG = galaxies[(gIdx + 1) % galaxies.length];
                createWormhole(game, {
                    name: "Gateway to " + nextG.name,
                    x: g.x + g.width / 2,
                    y: g.y + g.height / 2,
                    destX: nextG.x + nextG.width / 2 + 300,
                    destY: nextG.y + nextG.height / 2,
                    destBounds: { minX: nextG.x, maxX: nextG.x + nextG.width, minY: nextG.y, maxY: nextG.y + nextG.height }
                });
            }
        }

        game.playerInput = (event) => {
            const bh = (game.entities["blackholes"] || []).find(p => p.socketId === event.playerId);
            if (bh) {
                if (event.angle !== undefined) {
                    bh.targetAngle = event.angle;
                    
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
        const galaxies = config.galaxies || [{ name: "Universe", x: 0, y: 0, width: config.canvas.width, height: config.canvas.height }];
        // Pick random galaxy for player spawn
        const g = galaxies[Math.floor(Math.random() * galaxies.length)];
        const localCanvas = { width: g.width, height: g.height, offsetX: g.x, offsetY: g.y };
        
        let player = createBlackHole(this.game, {
            name,
            socketId,
            isBot: false,
            color: "#38bdf8", // Signature player cyan
            canvas: localCanvas
        });
        player.galaxyBounds = { minX: g.x, maxX: g.x + g.width, minY: g.y, maxY: g.y + g.height };
        return player;
    }

    onPlayerDisconnect(socketId) {
        const bhs = this.game.entities["blackholes"] || [];
        const index = bhs.findIndex(p => p.socketId === socketId);
        if (index >= 0) bhs.splice(index, 1);
    }
}

module.exports = CosmicSingularityCartridge;
