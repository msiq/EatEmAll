const { spawnOnArm } = require("../galaxies.js");
const { defineServerOnly } = require("./Stardust.js");

let astId = 1;

function createAsteroid(game, galaxy, customPos = null) {
    const mass = 85 + Math.random() * 40;
    const radius = 26 + Math.random() * 8;
    // Rubble drifts wider of the arms than planets do.
    const pos = customPos || spawnOnArm(galaxy, Math.random, { spreadScale: 1.0 });

    const ast = {
        id: "AST" + astId++,
        type: "asteroid",
        x: pos.x,
        y: pos.y,
        radius: radius,
        angle: Math.random() * Math.PI * 2
    };

    // The 3D renderer builds its cratered geometry from the entity id, so the
    // vertex and crater tables are simulation-side only - shipping them was
    // 80% of the asteroid snapshot.
    defineServerOnly(ast, {
        mass,
        color: "#78716c",
        rotSpeed: (Math.random() - 0.5) * 0.45,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6
    });

    if (!game.entities["asteroids"]) game.entities["asteroids"] = [];
    game.entities["asteroids"].push(ast);
    return ast;
}

module.exports = { createAsteroid };
