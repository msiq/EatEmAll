const Game = require('./Server/GameClass.js');
const Shapes = require('./Server/Shapes.js');
const Entity = require('./Server/Entity.js');
const { Rectangle } = require('./Server/Quadtree.js');

const DOT_COLORS = [
    '#FF5722', '#E91E63', '#9C27B0', '#00BCD4',
    '#4CAF50', '#FFEB3B', '#FF9800', '#03A9F4',
    '#00E676', '#FF1744', '#F50057', '#651FFF'
];

const BOT_NAMES = [
    'Vortex', 'Phantom', 'Nebula', 'Titan', 'Apex',
    'Zenith', 'Shadow', 'Blaze', 'Cosmo', 'Cipher'
];

var game = new Game();
let botUpdateTick = 0;

game.setup = function() {
    game.addEntityType('players', Entity.TYPE_MAIN);
    game.addEntityType('dots', Entity.TYPE_DEFAULT);

    console.log('[Game] Stress Test: Spawning 1,000 dots & 10 bots...');

    // 1. Spawn 1,000 collectible dots
    for (let i = 0; i < 1000; i++) {
        initiateDot(this);
    }

    // 2. Spawn 10 autonomous AI bot players
    for (let i = 0; i < BOT_NAMES.length; i++) {
        initiateBot(this, BOT_NAMES[i]);
    }
};

game.joinGame = function(data) {
    return initiatePlayer(this, data);
};

// AI Bots decision loop (steers using Quadtree)
game.update = function() {
    botUpdateTick++;
    if (botUpdateTick % 3 !== 0) return; // run bot AI every 3 ticks (~10 Hz)

    if (!game.entities['players'] || !game.subSystems.collision.quadtree) return;

    game.entities['players'].forEach(p => {
        if (!p.isBot || !p.abilities || !p.abilities.position) return;

        const myPos = p.abilities.position.pos;
        const myRadius = (p.abilities.body && p.abilities.body.shape && p.abilities.body.shape.radius) || 20;

        // Query Quadtree for nearby items within 400px
        const searchBox = new Rectangle(myPos.x - 300, myPos.y - 300, 600, 600);
        const nearby = game.subSystems.collision.quadtree.query(searchBox);

        let target = null;
        let minDist = Infinity;

        for (let i = 0; i < nearby.length; i++) {
            const item = nearby[i];
            if (item.id === p.id || !item.abilities || !item.abilities.position) continue;

            const itemPos = item.abilities.position.pos;
            const dist = Math.hypot(itemPos.x - myPos.x, itemPos.y - myPos.y);

            // Prefer eating dots or smaller players
            const isEdiblePlayer = item.type === 'players' && myRadius > (item.abilities.body.shape.radius || 20) * 1.15;
            const isDot = item.name === 'dot' || item.type === 'dots';

            if ((isDot || isEdiblePlayer) && dist < minDist) {
                minDist = dist;
                target = itemPos;
            }
        }

        if (target && minDist > 4) {
            const dx = target.x - myPos.x;
            const dy = target.y - myPos.y;
            const speed = 3.8;
            p.abilities.velocity.velocity = new Shapes.Vect(
                (dx / minDist) * speed,
                (dy / minDist) * speed,
                0
            );
        }
    });
};

function handlePlayerCollision(entity, object, game) {
    if (!object || !object.abilities) return;

    // 1. Colliding with a Dot (EATING)
    if (object.name === 'dot' || object.type === 'dots') {
        let pad = 40;
        let newX = Math.floor(Math.random() * (game.config.canvas.width - pad * 2)) + pad;
        let newY = Math.floor(Math.random() * (game.config.canvas.height - pad * 2)) + pad;
        object.abilities.position.pos.x = newX;
        object.abilities.position.pos.y = newY;
        object.abilities.body.color = DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)];
        object.abilities.aabb = new game.abilities.Aabb(object.abilities.body);

        if (entity.has('score')) entity.abilities.score.add(10);
        if (entity.has('experience')) {
            entity.abilities.experience.add(1);
            if (entity.abilities.experience.xp % 10 === 0 && entity.has('rank')) {
                entity.abilities.rank.raise();
            }
        }
        if (entity.has('health')) {
            entity.abilities.health.health = Math.min(100, entity.abilities.health.health + 2);
        }

        // Grow radius (max 160px)
        if (entity.has('body')) {
            let shape = entity.abilities.body.shape;
            if (shape && shape.radius) {
                shape.radius = Math.min(160, shape.radius + 0.3);
                entity.abilities.aabb = new game.abilities.Aabb(entity.abilities.body);
            }
        }
        return;
    }

    // 2. Colliding with Another Player (EAT OR BE EATEN)
    if (object.type === 'players' && object.id !== entity.id) {
        let myRadius = entity.abilities.body.shape.radius || 20;
        let otherRadius = object.abilities.body.shape.radius || 20;

        if (myRadius > otherRadius * 1.15) {
            console.log('[Game]', entity.name, 'ate', object.name);
            entity.abilities.score.add(Math.round(otherRadius * 20));
            entity.abilities.body.shape.radius = Math.min(180, Math.sqrt(myRadius * myRadius + otherRadius * otherRadius * 0.5));
            entity.abilities.aabb = new game.abilities.Aabb(entity.abilities.body);

            // Respawn prey at safe location
            let pad = 100;
            object.abilities.position.pos.x = Math.floor(Math.random() * (game.config.canvas.width - pad * 2)) + pad;
            object.abilities.position.pos.y = Math.floor(Math.random() * (game.config.canvas.height - pad * 2)) + pad;
            object.abilities.body.shape.radius = 20;
            object.abilities.aabb = new game.abilities.Aabb(object.abilities.body);
            if (object.has('score')) object.abilities.score.score = 0;
            if (object.has('health')) object.abilities.health.health = 100;
        }
    }
}

function initiatePlayer(game, data) {
    const player = new game.Entity(data.userName || 'Player');
    player.isBot = false;

    let pad = 100;
    let playerPos = new game.shapes.Vect(
        Math.floor(Math.random() * (game.config.canvas.width - pad * 2)) + pad,
        Math.floor(Math.random() * (game.config.canvas.height - pad * 2)) + pad
    );
    let playerCirc = new game.shapes.Circ(20);
    const playerColor = DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)];

    player.attach(new game.abilities.Body(playerCirc, playerColor));
    player.attach(new game.abilities.Position(playerPos));
    player.attach(new game.abilities.Velocity());
    player.attach(new game.abilities.Input());
    player.attach(new game.abilities.Mass(100));
    player.attach(new game.abilities.Cor(0.4));
    player.attach(new game.abilities.Collidable());
    player.attach(new game.abilities.Score());
    player.attach(new game.abilities.Rank({ 1: 100, 2: 250, 3: 500 }));
    player.attach(new game.abilities.Experience(1000));
    player.attach(new game.abilities.Power(100));
    player.attach(new game.abilities.Health(100));
    player.attach(new game.abilities.Orientation());

    player.abilities.collidable.onCollisionStart((object) => {
        handlePlayerCollision(player, object, game);
    });

    game.subSystems.collision.AddEntity(player);
    game.subSystems.motion.AddEntity(player);
    game.subSystems.physics.AddEntity(player);
    game.subSystems.score.AddEntity(player);

    let camera = new game.abilities.Camera(player.abilities.position.pos);
    player.attach(camera);
    player.attach(new game.abilities.Viewport(800, 600, camera));
    game.subSystems.display.AddEntity(player);

    player.socket_id = data.socketId;
    game.addEntity(player, 'players');
    return player;
}

function initiateBot(game, name) {
    const bot = new game.Entity(name);
    bot.isBot = true;

    let pad = 100;
    let botPos = new game.shapes.Vect(
        Math.floor(Math.random() * (game.config.canvas.width - pad * 2)) + pad,
        Math.floor(Math.random() * (game.config.canvas.height - pad * 2)) + pad
    );
    let botCirc = new game.shapes.Circ(20);
    const botColor = DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)];

    bot.attach(new game.abilities.Body(botCirc, botColor));
    bot.attach(new game.abilities.Position(botPos));
    bot.attach(new game.abilities.Velocity());
    bot.attach(new game.abilities.Mass(100));
    bot.attach(new game.abilities.Cor(0.4));
    bot.attach(new game.abilities.Collidable());
    bot.attach(new game.abilities.Score());
    bot.attach(new game.abilities.Rank({ 1: 100, 2: 250, 3: 500 }));
    bot.attach(new game.abilities.Experience(1000));
    bot.attach(new game.abilities.Health(100));
    bot.attach(new game.abilities.Orientation());

    bot.abilities.collidable.onCollisionStart((object) => {
        handlePlayerCollision(bot, object, game);
    });

    game.subSystems.collision.AddEntity(bot);
    game.subSystems.motion.AddEntity(bot);
    game.subSystems.physics.AddEntity(bot);
    game.subSystems.score.AddEntity(bot);

    game.addEntity(bot, 'players');
    return bot;
}

function initiateDot(game, x, y) {
    let pad = 20;
    let dotPos = new game.shapes.Vect(
        x || Math.floor(Math.random() * (game.config.canvas.width - pad * 2)) + pad,
        y || Math.floor(Math.random() * (game.config.canvas.height - pad * 2)) + pad
    );
    let dotCirc = new game.shapes.Circ(7);
    let dot = new game.Entity('dot');
    let color = DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)];

    dot.attach(new game.abilities.Body(dotCirc, color));
    dot.attach(new game.abilities.Position(dotPos));
    dot.attach(new game.abilities.Collidable());
    dot.attach(new game.abilities.Velocity());
    dot.attach(new game.abilities.Mass(10));
    dot.attach(new game.abilities.Orientation());

    game.subSystems.collision.AddEntity(dot);
    game.subSystems.physics.AddEntity(dot);
    game.subSystems.motion.AddEntity(dot);

    game.addEntity(dot, 'dots');
}

module.exports = exports = game;
