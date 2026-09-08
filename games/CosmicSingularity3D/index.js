const path = require("path");
const config = require("./config.json");
const { createBlackHole } = require("./server/entities/BlackHole.js");
const { createPlanet } = require("./server/entities/Planet.js");
const { createStardust } = require("./server/entities/Stardust.js");
const { createAsteroid } = require("./server/entities/Asteroid.js");
const { createPulsar } = require("./server/entities/Pulsar.js");
const { createWormhole } = require("./server/entities/Wormhole.js");
const { createGalaxy } = require("./server/entities/Galaxy.js");
const { getGalaxies, spiralPoint } = require("./server/galaxies.js");
const { SpacePhysicsSystem } = require("./server/systems/SpacePhysicsSystem.js");

// Gateways sit far out on an arm; arrivals land well inside the destination on
// a different arm, so you never surface on top of another gateway.
const GATEWAY_AT = 0.88;
const ARRIVAL_AT = 0.22;

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
        game.addEntityType("wormholes");
        game.addEntityType("galaxies");

        // Every galaxy is populated to the same density from the shared
        // per-galaxy counts in config.json.
        const galaxies = getGalaxies(config);

        for (let gIdx = 0; gIdx < galaxies.length; gIdx++) {
            const g = galaxies[gIdx];

            // Publish the disc itself so the client draws the very arms that
            // everything below is scattered along.
            createGalaxy(game, g);

            const sdCount = config.stardustCount || 180;
            for (let i = 0; i < sdCount; i++) createStardust(game, g);

            const astCount = config.asteroidCount || 24;
            for (let i = 0; i < astCount; i++) createAsteroid(game, g);

            const psrCount = config.pulsarCount || 5;
            for (let i = 0; i < psrCount; i++) createPulsar(game, g, i, psrCount);

            const pCount = config.planetCount || 130;
            for (let i = 0; i < pCount; i++) createPlanet(game, g);

            const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
            const bCount = config.botCount || 5;
            for (let i = 0; i < bCount; i++) {
                createBlackHole(game, {
                    name: g.name + " Singularity " + (i + 1),
                    isBot: true,
                    color: colors[i % colors.length],
                    galaxy: g
                });
            }

            // Gateway onward to the next galaxy, wired into a closed ring.
            if (galaxies.length > 1) {
                const nextG = galaxies[(gIdx + 1) % galaxies.length];
                const gate = spiralPoint(g, GATEWAY_AT, 0);
                // Arrive on the far arm of the destination, away from its gateway.
                const arrive = spiralPoint(nextG, ARRIVAL_AT, Math.min(1, nextG.arms - 1));
                createWormhole(game, {
                    name: "Gateway to " + nextG.name,
                    x: gate.x,
                    y: gate.y,
                    destX: arrive.x,
                    destY: arrive.y
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
        const galaxies = getGalaxies(config);
        // Drop new arrivals into a random galaxy so the universe fills evenly.
        const g = galaxies[Math.floor(Math.random() * galaxies.length)];

        return createBlackHole(this.game, {
            name,
            socketId,
            isBot: false,
            color: "#38bdf8", // Signature player cyan
            galaxy: g
        });
    }

    onPlayerDisconnect(socketId) {
        const bhs = this.game.entities["blackholes"] || [];
        const index = bhs.findIndex(p => p.socketId === socketId);
        if (index >= 0) bhs.splice(index, 1);
    }
}

module.exports = CosmicSingularityCartridge;
