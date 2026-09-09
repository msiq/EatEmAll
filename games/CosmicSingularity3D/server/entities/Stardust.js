const { spawnOnArm } = require("../galaxies.js");

let sdId = 1;
const stardustColors = ["#38bdf8", "#f43f5e", "#fbbf24", "#a855f7", "#34d399", "#ffffff"];

function createStardust(game, galaxy, customPos = null) {
    const pos = customPos || spawnOnArm(galaxy, Math.random, { spreadScale: 0.34 });
    const mass = 1.0 + Math.random() * 1.5;

    const sd = {
        id: "SD" + sdId++,
        type: "stardust",
        x: pos.x,
        y: pos.y,
        radius: 2.5 + Math.random() * 1.5,
        color: stardustColors[Math.floor(Math.random() * stardustColors.length)],
        seed: Math.random() * 100
    };

    // Simulation-only state: hidden from JSON.stringify so it never rides the
    // 30 Hz snapshot. The client renders position, size and colour only.
    defineServerOnly(sd, { mass, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4 });

    if (!game.entities["stardust"]) game.entities["stardust"] = [];
    game.entities["stardust"].push(sd);
    return sd;
}

function defineServerOnly(obj, fields) {
    for (const k of Object.keys(fields)) {
        Object.defineProperty(obj, k, { value: fields[k], writable: true, enumerable: false, configurable: true });
    }
}

module.exports = { createStardust, defineServerOnly };
