const { spiralPoint } = require("../galaxies.js");
const { defineServerOnly } = require("./Stardust.js");

let psrId = 1;

function createPulsar(game, galaxy, index = 0, total = 4) {
    // Space pulsars evenly along the arms by golden-angle stepping, so any
    // count distributes sensibly instead of stacking in quadrants.
    const frac = total > 1 ? (index + 0.5) / total : 0.5;
    const t = 0.22 + frac * 0.66;
    const arm = index % galaxy.arms;
    const p = spiralPoint(galaxy, t, arm);
    const jitter = galaxy.radius * 0.03;

    const psr = {
        id: "PSR" + psrId++,
        type: "pulsar",
        name: "Pulsar " + String.fromCharCode(65 + index),
        x: p.x + (Math.random() - 0.5) * jitter,
        y: p.y + (Math.random() - 0.5) * jitter,
        radius: 20,
        color: index % 2 === 0 ? "#06b6d4" : "#ec4899",
        beamAngle: Math.random() * Math.PI * 2,
        beamLength: 500,
        beamWidth: 32,
        pulsePhase: 0
    };

    defineServerOnly(psr, {
        mass: 5000, // Massive immovable anchor
        spinSpeed: (index % 2 === 0 ? 1 : -1) * (3.8 + Math.random() * 1.5),
        pulseTimer: Math.random() * 3.0,
        pulseInterval: 3.2
    });

    if (!game.entities["pulsars"]) game.entities["pulsars"] = [];
    game.entities["pulsars"].push(psr);
    return psr;
}

module.exports = { createPulsar };
