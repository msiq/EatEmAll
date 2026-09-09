const { spawnOnArm } = require("../galaxies.js");
const { defineServerOnly } = require("./Stardust.js");

let pId = 1;
const planetTypes = ["rock", "gas", "ice", "star"];

function createPlanet(game, galaxy, customPos = null) {
    const type = planetTypes[Math.floor(Math.random() * planetTypes.length)];
    const mass = type === "star" ? 30 : (Math.random() * 15 + 5);
    // Planets hug the arms a little tighter than loose dust.
    const pos = customPos || spawnOnArm(galaxy, Math.random, { spreadScale: 0.28 });

    const p = {
        id: "P" + pId++,
        type: type,
        x: pos.x,
        y: pos.y,
        radius: Math.sqrt(mass) * 2
    };

    defineServerOnly(p, { mass, vx: 0, vy: 0 });

    if (!game.entities["planets"]) game.entities["planets"] = [];
    game.entities["planets"].push(p);
    return p;
}

module.exports = { createPlanet };
