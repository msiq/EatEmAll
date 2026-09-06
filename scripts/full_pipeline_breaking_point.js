const { performance } = require("perf_hooks");
const Game = require("../Game.js");

console.log("=================================================");
console.log("   OPTIMIZED FULL PIPELINE BREAKING POINT TEST   ");
console.log("=================================================");

// Test scales up to 25,000 entities!
const dotScales = [1000, 2500, 5000, 10000, 25000, 50000, 75000, 100000];
const results = [];

for (const dotCount of dotScales) {
    Game.entities = {};
    Game.setup();
    
    // Reset dots
    Game.entities['dots'] = [];
    Game.subSystems.collision.entities = Game.subSystems.collision.entities.filter(e => e.name !== 'dot' && e.type !== 'dots');
    Game.subSystems.motion.entities = Game.subSystems.motion.entities.filter(e => e.name !== 'dot' && e.type !== 'dots');
    Game.subSystems.physics.entities = Game.subSystems.physics.entities.filter(e => e.name !== 'dot' && e.type !== 'dots');

    for (let i = 0; i < dotCount; i++) {
        const dotPos = new Game.shapes.Vect(Math.random() * 1960 + 20, Math.random() * 1960 + 20);
        const dotCirc = new Game.shapes.Circ(7);
        const dot = new Game.Entity('dot');
        dot.attach(new Game.abilities.Body(dotCirc, '#FF5722'));
        dot.attach(new Game.abilities.Position(dotPos));
        dot.attach(new Game.abilities.Collidable());
        dot.attach(new Game.abilities.Velocity());
        dot.attach(new Game.abilities.Mass(10));
        dot.attach(new Game.abilities.Orientation());

        Game.subSystems.collision.AddEntity(dot);
        Game.subSystems.physics.AddEntity(dot);
        Game.subSystems.motion.AddEntity(dot);
        Game.addEntity(dot, 'dots');
    }

    const totalEntities = (Game.entities['players'] ? Game.entities['players'].length : 0) +
                          (Game.entities['dots'] ? Game.entities['dots'].length : 0) +
                          (Game.entities['viruses'] ? Game.entities['viruses'].length : 0);

    // Warmup 5 ticks
    for (let i = 0; i < 5; i++) {
        Game.update();
        Game.internalUpdate();
    }

    // Profile 30 ticks
    const tickTimes = [];
    const subTimers = { botAI: 0, internalUpdate: 0, serialize: 0 };
    let lastPayloadKB = 0;

    for (let i = 0; i < 30; i++) {
        const t0 = performance.now();
        Game.update();
        const t1 = performance.now();
        Game.internalUpdate();
        const t2 = performance.now();
        
        // Optimized serialization: Skip static dots in tick snapshots
        let players = {};
        Object.keys(Game.entities).forEach(type => {
            if (type === 'dots') return;
            players[type] = Game.entities[type].map(Game.formatToRender);
        });
        const dotsDelta = Game.dotsDelta || [];
        Game.dotsDelta = [];

        const jsonPayload = JSON.stringify({ players, dotsDelta, fps: 30, events: [] });
        const t3 = performance.now();

        tickTimes.push(t3 - t0);
        subTimers.botAI += (t1 - t0);
        subTimers.internalUpdate += (t2 - t1);
        subTimers.serialize += (t3 - t2);
        lastPayloadKB = Math.round(jsonPayload.length / 1024);
    }

    const avgTotal = tickTimes.reduce((a, b) => a + b, 0) / tickTimes.length;
    const avgAI = subTimers.botAI / 30;
    const avgSubsystems = subTimers.internalUpdate / 30;
    const avgSerialize = subTimers.serialize / 30;
    const estFps = Math.min(30, 1000 / avgTotal);
    const status = avgTotal > 33.33 ? "❌ OVER BUDGET (SERVER LAG)" : "✅ PASS (30 FPS)";

    results.push({
        totalEntities,
        avgTotal: parseFloat(avgTotal.toFixed(2)),
        avgAI: parseFloat(avgAI.toFixed(2)),
        avgSubsystems: parseFloat(avgSubsystems.toFixed(2)),
        avgSerialize: parseFloat(avgSerialize.toFixed(2)),
        payloadKB: lastPayloadKB,
        estFps: parseFloat(estFps.toFixed(1)),
        status
    });

    console.log(`Entities: ${totalEntities.toString().padStart(5)} | Total Tick: ${avgTotal.toFixed(2).padStart(6)}ms | Subsystems: ${avgSubsystems.toFixed(2).padStart(5)}ms | Serialize: ${avgSerialize.toFixed(2).padStart(5)}ms | Payload: ${lastPayloadKB.toString().padStart(4)} KB | ${estFps.toFixed(1).padStart(4)} FPS | ${status}`);

    if (avgTotal > 70) {
        console.log(`\n🛑 Severe breakdown reached at ${totalEntities} entities (${avgTotal.toFixed(1)}ms per tick). Engine limit exceeded.`);
        break;
    }
}
