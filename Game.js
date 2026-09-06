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
    // Register static layer for fast network synchronization
    if (typeof game.markLayerStatic === 'function') {
        game.markLayerStatic('dots');
    }

    // Register game-specific impulse filter: skip physical bounce if predator is big enough to swallow prey
    if (game.subSystems && game.subSystems.collision) {
        game.subSystems.collision.filterImpulse = (entityA, entityB) => {
            const radA = (entityA.abilities.body && entityA.abilities.body.shape && entityA.abilities.body.shape.radius) || 20;
            const radB = (entityB.abilities.body && entityB.abilities.body.shape && entityB.abilities.body.shape.radius) || 20;
            const posA = entityA.abilities.position.pos;
            const posB = entityB.abilities.position.pos;
            const dist = Math.hypot(posB.x - posA.x, posB.y - posA.y);
            if (radA > radB * 1.15 && dist < radA * 0.8) return false;
            if (radB > radA * 1.15 && dist < radB * 0.8) return false;
            return true;
        };
    }
    game.addEntityType('players', Entity.TYPE_MAIN);
    game.addEntityType('dots', Entity.TYPE_DEFAULT);
    game.addEntityType('viruses', Entity.TYPE_DEFAULT);

    console.log('[Game] Spawning 1,000 dots, 10 bots & 18 hazard viruses...');

    // 1. Spawn 1,000 collectible dots
    for (let i = 0; i < 1000; i++) {
        initiateDot(this);
    }

    // 2. Spawn 10 autonomous AI bot players
    for (let i = 0; i < BOT_NAMES.length; i++) {
        initiateBot(this, BOT_NAMES[i]);
    }

    // 3. Spawn 18 spiky hazard viruses
    for (let i = 0; i < 18; i++) {
        initiateVirus(this);
    }
};

game.joinGame = function(data) {
    return initiatePlayer(this, data);
};

// AI Bots decision loop (steers using Quadtree at constant ~10 Hz fixed interval)
let lastBotAiTime = 0;
game.update = function() {
    const now = Date.now();
    if (now - lastBotAiTime < 100) return; // run bot AI every ~100ms (10 Hz fixed across all engine modes)
    lastBotAiTime = now;

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

        let virusAvoidX = 0;
        let virusAvoidY = 0;
        let closeVirus = false;

        for (let i = 0; i < nearby.length; i++) {
            const item = nearby[i];
            if (item.id === p.id || !item.abilities || !item.abilities.position) continue;

            const itemPos = item.abilities.position.pos;
            const dist = Math.hypot(itemPos.x - myPos.x, itemPos.y - myPos.y);

            // Large bots actively steer away from viruses
            const isVirus = item.name === 'virus' || item.type === 'viruses';
            if (isVirus && myRadius >= 42 && dist < 160) {
                virusAvoidX += (myPos.x - itemPos.x) / Math.max(1, dist);
                virusAvoidY += (myPos.y - itemPos.y) / Math.max(1, dist);
                closeVirus = true;
                continue;
            }

            // Prefer eating dots or smaller players
            const isEdiblePlayer = item.type === 'players' && myRadius > (item.abilities.body.shape.radius || 20) * 1.15;
            const isDot = item.name === 'dot' || item.type === 'dots';

            if ((isDot || isEdiblePlayer) && dist < minDist) {
                minDist = dist;
                target = itemPos;
            }
        }

        if (closeVirus) {
            const norm = Math.hypot(virusAvoidX, virusAvoidY) || 1;
            const speed = 3.8;
            p.abilities.velocity.velocity = new Shapes.Vect(
                (virusAvoidX / norm) * speed,
                (virusAvoidY / norm) * speed,
                0
            );
        } else if (target && minDist > 4) {
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

        if (!game.dotsDelta) game.dotsDelta = [];
        game.dotsDelta.push({
            id: object.id,
            x: newX,
            y: newY,
            radius: (object.abilities.body && object.abilities.body.shape && object.abilities.body.shape.radius) || 7,
            color: object.abilities.body.color
        });

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
            if (game && typeof game.addTickEvent === 'function') {
                game.addTickEvent({
                    type: 'chomp',
                    predator: entity.id,
                    prey: object.id
                });
            }
            entity.abilities.score.add(Math.round(otherRadius * 20));
            entity.abilities.body.shape.radius = Math.min(180, Math.sqrt(myRadius * myRadius + otherRadius * otherRadius * 0.5));
            entity.abilities.aabb = new game.abilities.Aabb(entity.abilities.body);

            if (object.isBot) {
                // Respawn bot at safe location
                let pad = 100;
                let newX = Math.floor(Math.random() * (game.config.canvas.width - pad * 2)) + pad;
                let newY = Math.floor(Math.random() * (game.config.canvas.height - pad * 2)) + pad;
                object.abilities.position.pos = new game.shapes.Vect(newX, newY);
                object.abilities.body.shape.radius = 20;
                object.abilities.aabb = new game.abilities.Aabb(object.abilities.body);
                if (object.has('score')) object.abilities.score.score = 0;
                if (object.has('health')) object.abilities.health.health = 100;
                if (object.has('velocity')) object.abilities.velocity.velocity = new game.shapes.Vect(0, 0, 0);
            } else {
                // Human player was eaten!
                const stats = {
                    eatenBy: entity.name || 'A Predator',
                    score: object.has('score') ? object.abilities.score.score : 0,
                    radius: Math.round(otherRadius)
                };

                // Notify client socket
                if (object.socket_id && game.server && typeof game.server.gameOver === 'function') {
                    game.server.gameOver(object.socket_id, stats);
                }

                // Remove dead player from active game subsystems
                game.onPlayerDisconnect(object.socket_id);
            }
        }
    }

    // 3. Colliding with a Virus Hazard (HIDING OR POPPING)
    if (object.name === 'virus' || object.type === 'viruses') {
        let playerRadius = (entity.abilities.body && entity.abilities.body.shape && entity.abilities.body.shape.radius) || 20;
        let virusRadius = (object.abilities.body && object.abilities.body.shape && object.abilities.body.shape.radius) || 48;

        // If player is smaller than virus, player can hide underneath safely!
        if (playerRadius < virusRadius) {
            return;
        }

        // Large player pops/shatters!
        console.log('[Game]', entity.name, 'hit a virus and popped!');

        const currentScore = entity.has('score') ? entity.abilities.score.score : 0;
        const lostScore = Math.floor(currentScore * 0.45);
        if (entity.has('score')) {
            entity.abilities.score.score = Math.max(0, currentScore - lostScore);
        }

        // Shrink radius down to ~55% of current size (minimum 22px)
        const newRadius = Math.max(22, Math.round(playerRadius * 0.55));
        entity.abilities.body.shape.radius = newRadius;
        entity.abilities.aabb = new game.abilities.Aabb(entity.abilities.body);

        // Broadcast pop event to clients for audio/visual shockwave
        const popX = object.abilities.position.pos.x;
        const popY = object.abilities.position.pos.y;
        if (game && typeof game.addTickEvent === 'function') {
            game.addTickEvent({
                type: 'virus_pop',
                playerId: entity.id,
                x: popX,
                y: popY,
                radius: playerRadius
            });
        }

        // Erupt 20 collectible food dots scattered radially outward around the impact site
        if (game.entities && game.entities['dots']) {
            const dots = game.entities['dots'];
            const numDots = Math.min(20, dots.length);
            for (let i = 0; i < numDots; i++) {
                const dot = dots[i];
                const angle = (i / numDots) * Math.PI * 2 + Math.random() * 0.3;
                const dist = 40 + Math.random() * 90;
                let dotX = Math.max(30, Math.min(game.config.canvas.width - 30, popX + Math.cos(angle) * dist));
                let dotY = Math.max(30, Math.min(game.config.canvas.height - 30, popY + Math.sin(angle) * dist));
                dot.abilities.position.pos.x = dotX;
                dot.abilities.position.pos.y = dotY;
                dot.abilities.body.color = DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)];
                dot.abilities.aabb = new game.abilities.Aabb(dot.abilities.body);

                if (!game.dotsDelta) game.dotsDelta = [];
                game.dotsDelta.push({
                    id: dot.id,
                    x: dotX,
                    y: dotY,
                    radius: (dot.abilities.body && dot.abilities.body.shape && dot.abilities.body.shape.radius) || 7,
                    color: dot.abilities.body.color
                });
            }
        }

        // Respawn virus at a new random location in the arena
        let pad = 120;
        object.abilities.position.pos.x = Math.floor(Math.random() * (game.config.canvas.width - pad * 2)) + pad;
        object.abilities.position.pos.y = Math.floor(Math.random() * (game.config.canvas.height - pad * 2)) + pad;
        object.abilities.aabb = new game.abilities.Aabb(object.abilities.body);
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
    player.attach(new game.abilities.Collidable(false, false));
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
    bot.attach(new game.abilities.Collidable(false, false));
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
    dot.attach(new game.abilities.Collidable(true, true)); // Trigger & static
    dot.attach(new game.abilities.Velocity());
    dot.attach(new game.abilities.Mass(10));
    dot.attach(new game.abilities.Orientation());

    game.subSystems.collision.AddEntity(dot);
    game.subSystems.physics.AddEntity(dot);
    game.subSystems.motion.AddEntity(dot);

    game.addEntity(dot, 'dots');
}


function initiateVirus(game, x, y) {
    let pad = 120;
    let virusPos = new game.shapes.Vect(
        x || Math.floor(Math.random() * (game.config.canvas.width - pad * 2)) + pad,
        y || Math.floor(Math.random() * (game.config.canvas.height - pad * 2)) + pad
    );
    let virusRadius = 48;
    let virusCirc = new game.shapes.Circ(virusRadius);
    let virus = new game.Entity('virus');
    virus.type = 'viruses';

    virus.attach(new game.abilities.Body(virusCirc, '#22c55e'));
    virus.attach(new game.abilities.Position(virusPos));
    virus.attach(new game.abilities.Collidable(true, true)); // Trigger & static
    virus.attach(new game.abilities.Mass(500));
    virus.attach(new game.abilities.Velocity());
    virus.attach(new game.abilities.Orientation());

    game.subSystems.collision.AddEntity(virus);
    game.subSystems.physics.AddEntity(virus);
    game.subSystems.motion.AddEntity(virus);

    game.addEntity(virus, 'viruses');
    return virus;
}

module.exports = exports = game;
