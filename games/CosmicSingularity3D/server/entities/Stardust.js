let sdId = 1;
const stardustColors = ["#38bdf8", "#f43f5e", "#fbbf24", "#a855f7", "#34d399", "#ffffff"];

function createStardust(game, canvas, customPos = null) {
    const W = (canvas && canvas.width) || 4000;
    const H = (canvas && canvas.height) || 4000;
    const mass = 1.0 + Math.random() * 1.5;
    const radius = 2.5 + Math.random() * 1.5;

    const sd = {
        id: "SD" + sdId++,
        type: "stardust",
        x: customPos ? customPos.x : Math.random() * (W - 80) + 40,
        y: customPos ? customPos.y : Math.random() * (H - 80) + 40,
        mass: mass,
        radius: radius,
        color: stardustColors[Math.floor(Math.random() * stardustColors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        seed: Math.random() * 100
    };

    if (!game.entities["stardust"]) game.entities["stardust"] = [];
    game.entities["stardust"].push(sd);
    return sd;
}

module.exports = { createStardust };
