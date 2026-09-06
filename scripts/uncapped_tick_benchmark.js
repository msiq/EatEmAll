const { performance } = require("perf_hooks");
const Game = require("../Game.js");

console.log("==========================================================");
console.log("   SAFETY-CONTROLLED UNCAPPED TICK BENCHMARK (TIMED)      ");
console.log("==========================================================");

// We run a safety-bounded test for exactly 2000 ms per test tier
function measureUncappedTickRate(dotCount, botCount, virusCount = 18, durationMs = 2000) {
    Game.entities = {};
    Game.setup();

    // Configure exact entity counts
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

    Game.entities['players'] = [];
    Game.subSystems.collision.entities = Game.subSystems.collision.entities.filter(e => e.type !== 'players');
    Game.subSystems.motion.entities = Game.subSystems.motion.entities.filter(e => e.type !== 'players');
    Game.subSystems.physics.entities = Game.subSystems.physics.entities.filter(e => e.type !== 'players');

    for (let i = 0; i < botCount; i++) {
        const bot = new Game.Entity("Bot_" + i);
        bot.isBot = true;
        const botPos = new Game.shapes.Vect(Math.random() * 1800 + 100, Math.random() * 1800 + 100);
        const botCirc = new Game.shapes.Circ(20 + Math.random() * 20);
        bot.attach(new Game.abilities.Body(botCirc, '#4CAF50'));
        bot.attach(new Game.abilities.Position(botPos));
        bot.attach(new Game.abilities.Velocity());
        bot.attach(new Game.abilities.Mass(100));
        bot.attach(new Game.abilities.Cor(0.4));
        bot.attach(new Game.abilities.Collidable());
        bot.attach(new Game.abilities.Score());
        bot.attach(new Game.abilities.Orientation());

        Game.subSystems.collision.AddEntity(bot);
        Game.subSystems.motion.AddEntity(bot);
        Game.subSystems.physics.AddEntity(bot);
        Game.addEntity(bot, 'players');
    }

    // Warmup 20 ticks
    for (let i = 0; i < 20; i++) {
        Game.update();
        Game.internalUpdate();
    }

    // Run completely UNCAPPED for exactly durationMs
    let ticksCompleted = 0;
    const tickDurations = [];
    const tStart = performance.now();
    const tDeadline = tStart + durationMs;

    while (performance.now() < tDeadline) {
        const t0 = performance.now();
        Game.update();
        Game.internalUpdate();

        // Optimized delta serialization check
        let players = {};
        Object.keys(Game.entities).forEach(type => {
            if (type === 'dots') return;
            players[type] = Game.entities[type].map(Game.formatToRender);
        });
        const dotsDelta = Game.dotsDelta || [];
        Game.dotsDelta = [];
        JSON.stringify({ players, dotsDelta, fps: 30, events: [] });

        const t1 = performance.now();
        tickDurations.push(t1 - t0);
        ticksCompleted++;
    }
    const totalElapsedMs = performance.now() - tStart;
    const actualTicksPerSec = Math.round((ticksCompleted / totalElapsedMs) * 1000);
    const avgTickMs = (tickDurations.reduce((a, b) => a + b, 0) / tickDurations.length);
    const minTickMs = Math.min(...tickDurations);
    const maxTickMs = Math.max(...tickDurations);
    const totalEntities = dotCount + botCount + (Game.entities['viruses'] ? Game.entities['viruses'].length : 0);
    const memMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);

    return {
        totalEntities,
        dotCount,
        botCount,
        durationSec: (totalElapsedMs / 1000).toFixed(2),
        ticksCompleted,
        actualTicksPerSec,
        avgTickMs: parseFloat(avgTickMs.toFixed(3)),
        minTickMs: parseFloat(minTickMs.toFixed(3)),
        maxTickMs: parseFloat(maxTickMs.toFixed(3)),
        memMB
    };
}

const tiers = [
    { label: "Light Arena", dots: 500, bots: 5 },
    { label: "Standard Game (Live Arena)", dots: 1000, bots: 10 },
    { label: "Medium Stress Arena", dots: 2500, bots: 25 },
    { label: "Heavy Stress Arena", dots: 5000, bots: 50 },
    { label: "Extreme Arena", dots: 10000, bots: 100 }
];

const results = [];
for (const tier of tiers) {
    const res = measureUncappedTickRate(tier.dots, tier.bots, 18, 2000);
    results.push({ label: tier.label, ...res });
    console.log(`[${tier.label}] Entities: ${res.totalEntities} (${res.dots} dots, ${res.bots} bots)`);
    console.log(`  ⏱️  Completed ${res.ticksCompleted} ticks in ${res.durationSec}s`);
    console.log(`  🚀  REAL UNCAPPED RATE:  ${res.actualTicksPerSec} TICKS / SEC (TPS / FPS)`);
    console.log(`  ⚡  Avg Tick Time:       ${res.avgTickMs} ms (Min: ${res.minTickMs} ms / Max: ${res.maxTickMs} ms)`);
    console.log(`  🧠  Heap Memory:         ${res.memMB} MB`);
    console.log("----------------------------------------------------------");
}
