let bhId = 1;

function findSafeSpawn(game, canvas, margin = 250) {
    const existing = game.entities["blackholes"] || [];
    const W = (canvas && canvas.width) || 4000;
    const H = (canvas && canvas.height) || 4000;

    let bestX = Math.random() * (W - margin * 2) + margin;
    let bestY = Math.random() * (H - margin * 2) + margin;
    let maxMinDist = -1;

    // Test up to 30 candidate positions across the universe
    for (let attempt = 0; attempt < 30; attempt++) {
        const testX = Math.random() * (W - margin * 2) + margin;
        const testY = Math.random() * (H - margin * 2) + margin;

        if (existing.length === 0) {
            return { x: testX, y: testY };
        }

        let minDist = Infinity;
        for (let i = 0; i < existing.length; i++) {
            const other = existing[i];
            const d = Math.hypot(testX - other.x, testY - other.y) - (other.radius || 20);
            if (d < minDist) minDist = d;
        }

        // If this spot is comfortably far (> 800px away from any black hole), pick it immediately
        if (minDist > 800) {
            return { x: testX, y: testY };
        }

        if (minDist > maxMinDist) {
            maxMinDist = minDist;
            bestX = testX;
            bestY = testY;
        }
    }

    return { x: bestX, y: bestY };
}

function createBlackHole(game, options) {
    const pos = findSafeSpawn(game, options.canvas);

    const bh = {
        id: "BH" + bhId++,
        socketId: options.socketId || null,
        type: "blackhole",
        name: options.name || "Singularity",
        x: pos.x,
        y: pos.y,
        mass: 100,
        radius: 14,
        color: options.color || "#ffffff",
        isBot: options.isBot || false,
        vx: 0,
        vy: 0,
        targetAngle: 0,
        angle: 0,
        throttle: 1.0,
        isThrusting: false,
        spawnImmunity: options.isBot ? 2.5 : 5.0
    };

    if (!game.entities["blackholes"]) game.entities["blackholes"] = [];
    game.entities["blackholes"].push(bh);
    return bh;
}

module.exports = { createBlackHole, findSafeSpawn };
