let pId = 1;
const planetTypes = ["rock", "gas", "ice", "star"];
const colors = {"rock": "#8b7355", "gas": "#d2b48c", "ice": "#aeeeee", "star": "#ffd700"};

function createPlanet(game, canvas) {
    const type = planetTypes[Math.floor(Math.random() * planetTypes.length)];
    const mass = type === "star" ? 30 : (Math.random() * 15 + 5);
    const radius = Math.sqrt(mass) * 2;

    const p = {
        id: "P" + pId++,
        type: type,
        x: Math.random() * (canvas.width - 100) + 50,
        y: Math.random() * (canvas.height - 100) + 50,
        mass: mass,
        radius: radius,
        color: colors[type],
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10
    };

    if (!game.entities["planets"]) game.entities["planets"] = [];
    game.entities["planets"].push(p);
    return p;
}
module.exports = { createPlanet };
