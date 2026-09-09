const { spawnInDisc } = require("../galaxies.js");
const { defineServerOnly } = require("./Stardust.js");

let bhId = 1;

function findSafeSpawn(game, galaxy, margin = 250) {
    const existing = game.entities["blackholes"] || [];

    let best = spawnInDisc(galaxy, Math.random, margin);
    let maxMinDist = -1;

    // Test up to 30 candidate positions across the disc
    for (let attempt = 0; attempt < 30; attempt++) {
        const test = spawnInDisc(galaxy, Math.random, margin);

        if (existing.length === 0) return test;

        let minDist = Infinity;
        for (const other of existing) {
            const d = Math.hypot(test.x - other.x, test.y - other.y) - (other.radius || 20);
            if (d < minDist) minDist = d;
        }

        // Comfortably clear of every rival - take it immediately
        if (minDist > 800) return test;

        if (minDist > maxMinDist) {
            maxMinDist = minDist;
            best = test;
        }
    }

    return best;
}

function createBlackHole(game, options) {
    const pos = findSafeSpawn(game, options.galaxy);

    const bh = {
        id: "BH" + bhId++,
        type: "blackhole",
        name: options.name || "Singularity",
        x: pos.x,
        y: pos.y,
        radius: 14,
        color: options.color || "#ffffff",
        isBot: options.isBot || false,
        angle: 0,
        mass: 100,
        // On the wire because the client renders them: the HUD velocity
        // readout reads vx/vy, and the spawn shield keys off spawnImmunity.
        vx: 0,
        vy: 0,
        spawnImmunity: options.isBot ? 2.5 : 5.0
    };

    defineServerOnly(bh, {
        // Server-side routing only; the client identifies itself by id.
        socketId: options.socketId || null,
        targetAngle: 0,
        throttle: 1.0,
        isThrusting: false,
        wormholeCooldown: 0
    });

    if (!game.entities["blackholes"]) game.entities["blackholes"] = [];
    game.entities["blackholes"].push(bh);
    return bh;
}

module.exports = { createBlackHole, findSafeSpawn };
