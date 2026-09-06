const { performance } = require('perf_hooks');
const Game = require('../Game.js');

const type = process.argv[2] || 'bots';
const count = parseInt(process.argv[3] || '1000', 10);

Game.entities = {};
Game.setup();

if (type === 'bots') {
    Game.entities['players'] = [];
    Game.subSystems.collision.entities = Game.subSystems.collision.entities.filter(e => e.type !== 'players');
    Game.subSystems.motion.entities = Game.subSystems.motion.entities.filter(e => e.type !== 'players');
    Game.subSystems.physics.entities = Game.subSystems.physics.entities.filter(e => e.type !== 'players');

    for (let i = 0; i < count; i++) {
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

    // Warmup
    for (let i = 0; i < 3; i++) {
        Game.update();
        Game.internalUpdate();
    }

    let total = 0;
    for (let i = 0; i < 15; i++) {
        const t0 = performance.now();
        Game.update();
        Game.internalUpdate();
        total += (performance.now() - t0);
    }
    const avg = total / 15;
    const mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    console.log(JSON.stringify({ count, avgMs: parseFloat(avg.toFixed(2)), memMB: mem }));
} else {
    Game.entities['dots'] = [];
    Game.subSystems.collision.entities = Game.subSystems.collision.entities.filter(e => e.name !== 'dot' && e.type !== 'dots');
    Game.subSystems.motion.entities = Game.subSystems.motion.entities.filter(e => e.name !== 'dot' && e.type !== 'dots');
    Game.subSystems.physics.entities = Game.subSystems.physics.entities.filter(e => e.name !== 'dot' && e.type !== 'dots');

    for (let i = 0; i < count; i++) {
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

    Game.update();
    Game.internalUpdate();

    let total = 0;
    for (let i = 0; i < 10; i++) {
        const t0 = performance.now();
        Game.update();
        Game.internalUpdate();
        let players = {};
        Object.keys(Game.entities).forEach(t => {
            if (t === 'dots') return;
            players[t] = Game.entities[t].map(Game.formatToRender);
        });
        const dotsDelta = Game.dotsDelta || [];
        Game.dotsDelta = [];
        JSON.stringify({ players, dotsDelta, fps: 30, events: [] });
        total += (performance.now() - t0);
    }
    const avg = total / 10;
    const mem = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    console.log(JSON.stringify({ count, avgMs: parseFloat(avg.toFixed(2)), memMB: mem }));
}
