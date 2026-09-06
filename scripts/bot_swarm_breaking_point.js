const { performance } = require("perf_hooks");
const Game = require("../Game.js");
const { Rectangle } = require("../Server/Quadtree.js");

console.log("=================================================");
console.log("      BOT SWARM COLLISION BREAKING POINT TEST    ");
console.log("=================================================");

const botCounts = [10, 25, 50, 100, 200, 350, 500];

for (const count of botCounts) {
    Game.entities = {};
    Game.setup();
    
    // Clear players and spawn 'count' bots
    Game.entities['players'] = [];
    Game.subSystems.collision.entities = Game.subSystems.collision.entities.filter(e => e.type !== 'players');
    Game.subSystems.motion.entities = Game.subSystems.motion.entities.filter(e => e.type !== 'players');
    Game.subSystems.physics.entities = Game.subSystems.physics.entities.filter(e => e.type !== 'players');

    for (let i = 0; i < count; i++) {
        const bot = new Game.Entity("Bot_" + i);
        bot.isBot = true;
        const botPos = new Game.shapes.Vect(Math.random() * 1800 + 100, Math.random() * 1800 + 100);
        const botCirc = new Game.shapes.Circ(20 + Math.random() * 25);
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

    // Warmup
    for (let i = 0; i < 5; i++) {
        Game.update();
        Game.internalUpdate();
    }

    // Measure 30 ticks
    const tickTimes = [];
    let aiTimes = 0;
    let physTimes = 0;

    for (let i = 0; i < 30; i++) {
        const t0 = performance.now();
        Game.update();
        const t1 = performance.now();
        Game.internalUpdate();
        const t2 = performance.now();

        tickTimes.push(t2 - t0);
        aiTimes += (t1 - t0);
        physTimes += (t2 - t1);
    }

    const avgTotal = tickTimes.reduce((a, b) => a + b, 0) / 30;
    const avgAI = aiTimes / 30;
    const avgPhys = physTimes / 30;
    const estFps = Math.min(30, 1000 / avgTotal);
    const status = avgTotal > 33.33 ? "❌ OVER BUDGET (SERVER LAG)" : "✅ PASS (30 FPS)";

    console.log(`Active Bots: ${count.toString().padStart(4)} | Total Tick: ${avgTotal.toFixed(2).padStart(6)}ms | Bot AI: ${avgAI.toFixed(2).padStart(5)}ms | Physics+Collision: ${avgPhys.toFixed(2).padStart(5)}ms | ${estFps.toFixed(1).padStart(4)} FPS | ${status}`);

    if (avgTotal > 70) {
        console.log(`\n🛑 Severe breakdown reached at ${count} bots (${avgTotal.toFixed(1)}ms per tick). Stopping bot scale.`);
        break;
    }
}
