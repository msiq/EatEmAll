const { spawnOnArm } = require("../galaxies.js");
const { defineServerOnly } = require("./Stardust.js");

let pId = 1;
const planetTypes = ["rock", "gas", "ice", "star"];

function createPlanet(game, galaxy, customPos = null) {
    const type = planetTypes[Math.floor(Math.random() * planetTypes.length)];
    const mass = type === "star" ? 30 : (Math.random() * 15 + 5);
    // Planets hug the arms a little tighter than loose dust.
    const pos = customPos || spawnOnArm(galaxy, Math.random, { spreadScale: 0.42 });

    const p = {
        id: "P" + pId++,
        type: type,
        x: pos.x,
        y: pos.y,
        radius: Math.sqrt(mass) * 2
    };

    defineServerOnly(p, { mass, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10 });

    if (!game.entities["planets"]) game.entities["planets"] = [];
    game.entities["planets"].push(p);
    return p;
}

module.exports = { createPlanet };
