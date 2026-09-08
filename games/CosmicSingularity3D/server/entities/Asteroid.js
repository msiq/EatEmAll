let astId = 1;

function createAsteroid(game, canvas, customPos = null) {
    const W = (canvas && canvas.width) || 4000;
    const H = (canvas && canvas.height) || 4000;
    const mass = 85 + Math.random() * 40;
    const radius = 26 + Math.random() * 8;

    // Generate irregular polygon vertices
    const numVerts = 8 + Math.floor(Math.random() * 4);
    const vertRatios = [];
    for (let i = 0; i < numVerts; i++) {
        vertRatios.push(0.78 + Math.random() * 0.42);
    }

    // Generate a few crater positions
    const craters = [];
    const numCraters = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numCraters; i++) {
        const ang = Math.random() * Math.PI * 2;
        const dist = Math.random() * (radius * 0.55);
        craters.push({
            x: Math.cos(ang) * dist,
            y: Math.sin(ang) * dist,
            r: 2.5 + Math.random() * (radius * 0.22)
        });
    }

    const ast = {
        id: "AST" + astId++,
        type: "asteroid",
        x: customPos ? customPos.x : Math.random() * (W - 200) + 100,
        y: customPos ? customPos.y : Math.random() * (H - 200) + 100,
        mass: mass,
        radius: radius,
        color: "#78716c", // Warm mineral gray
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.45,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        vertRatios: vertRatios,
        craters: craters
    };

    if (!game.entities["asteroids"]) game.entities["asteroids"] = [];
    game.entities["asteroids"].push(ast);
    return ast;
}

module.exports = { createAsteroid };
