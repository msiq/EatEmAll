let psrId = 1;

function createPulsar(game, canvas, index = 0, total = 4) {
    const W = (canvas && canvas.width) || 4000;
    const H = (canvas && canvas.height) || 4000;

    // Distribute pulsars symmetrically across the galaxy quadrants
    const quadrantX = (index % 2 === 0 ? 0.28 : 0.72) * W;
    const quadrantY = (index < 2 ? 0.28 : 0.72) * H;
    const jitterX = (Math.random() - 0.5) * 300;
    const jitterY = (Math.random() - 0.5) * 300;

    const psr = {
        id: "PSR" + psrId++,
        type: "pulsar",
        name: "Pulsar " + String.fromCharCode(65 + index),
        x: quadrantX + jitterX,
        y: quadrantY + jitterY,
        radius: 20,
        mass: 5000, // Massive immovable anchor
        color: index % 2 === 0 ? "#06b6d4" : "#ec4899", // Cyan and Magenta pulsars
        beamAngle: Math.random() * Math.PI * 2,
        spinSpeed: (index % 2 === 0 ? 1 : -1) * (3.8 + Math.random() * 1.5), // Rapid rotation
        beamLength: 500,
        beamWidth: 32,
        pulseTimer: Math.random() * 3.0,
        pulseInterval: 3.2,
        pulsePhase: 0
    };

    if (!game.entities["pulsars"]) game.entities["pulsars"] = [];
    game.entities["pulsars"].push(psr);
    return psr;
}

module.exports = { createPulsar };
