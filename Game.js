const Game = require('./Server/GameClass.js');
const Shapes = require('./Server/Shapes.js');
const Entity = require('./Server/Entity.js');

const DOT_COLORS = [
    '#FF5722', '#E91E63', '#9C27B0', '#00BCD4',
    '#4CAF50', '#FFEB3B', '#FF9800', '#03A9F4',
    '#00E676', '#FF1744', '#F50057', '#651FFF'
];

var game = new Game();

game.setup = function() {
    game.addEntityType('players', Entity.TYPE_MAIN);
    game.addEntityType('dots', Entity.TYPE_DEFAULT);

    console.log('[Game] Setting up game arena (2000x2000)...');

    // Spawn 150 collectible dots
    for (let i = 0; i < 150; i++) {
        initiateDot(this);
    }
};

game.joinGame = function(data) {
    return initiatePlayer(this, data);
};

game.update = function() {
    // Collision callbacks are event-driven via collidable abilities
};

function handlePlayerCollision(entity, object, game) {
    if (!object || !object.abilities) return;

    // 1. Colliding with a Dot (EATING)
    if (object.name === 'dot' || object.type === 'dots') {
        // Respawn dot at new random position
        let pad = 40;
        let newX = Math.floor(Math.random() * (game.config.canvas.width - pad * 2)) + pad;
        let newY = Math.floor(Math.random() * (game.config.canvas.height - pad * 2)) + pad;
        object.abilities.position.pos.x = newX;
        object.abilities.position.pos.y = newY;
        object.abilities.body.color = DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)];
        object.abilities.aabb = new game.abilities.Aabb(object.abilities.body);

        // Player gains score, xp, and grows
        if (entity.has('score')) {
            entity.abilities.score.add(10);
        }
        if (entity.has('experience')) {
            entity.abilities.experience.add(1);
            if (entity.abilities.experience.xp % 10 === 0 && entity.has('rank')) {
                entity.abilities.rank.raise();
            }
        }
        if (entity.has('health')) {
            entity.abilities.health.health = Math.min(100, entity.abilities.health.health + 2);
        }
        if (entity.has('power')) {
            entity.abilities.power.power = Math.min(100, entity.abilities.power.power + 1);
        }

        // Grow radius (max 150px)
        if (entity.has('body')) {
            let shape = entity.abilities.body.shape;
            if (shape && shape.radius) {
                shape.radius = Math.min(150, shape.radius + 0.4);
                entity.abilities.aabb = new game.abilities.Aabb(entity.abilities.body);
            }
        }
        return;
    }

    // 2. Colliding with Another Player (EAT OR BE EATEN)
    if (object.type === 'players' && object.id !== entity.id) {
        let myRadius = entity.abilities.body.shape.radius || 20;
        let otherRadius = object.abilities.body.shape.radius || 20;

        // If I am at least 15% larger, I eat the other player!
        if (myRadius > otherRadius * 1.15) {
            console.log('[Game]', entity.name, 'consumed', object.name);

            // Reward predator
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

    let pad = 100;
    let playerPos = new game.shapes.Vect(
        Math.floor(Math.random() * (game.config.canvas.width - pad * 2)) + pad,
        Math.floor(Math.random() * (game.config.canvas.height - pad * 2)) + pad
    );
    let playerCirc = new game.shapes.Circ(20);

    // Random vibrant player color
    const playerColor = DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)];

    player.attach(new game.abilities.Body(playerCirc, playerColor));
    player.attach(new game.abilities.Position(playerPos));
    player.attach(new game.abilities.Velocity());
    player.attach(new game.abilities.Input());
    player.attach(new game.abilities.Mass(100));
    player.attach(new game.abilities.Cor(0.4));
    player.attach(new game.abilities.Collidable());

    player.attach(new game.abilities.Score());
    player.attach(new game.abilities.Rank({
        1: 100,
        2: 250,
        3: 500,
        4: 1000,
        5: 2000,
    }));
    player.attach(new game.abilities.Experience(1000));
    player.attach(new game.abilities.Power(100));
    player.attach(new game.abilities.Health(100));
    player.attach(new game.abilities.Orientation());

    // Register collision callback on player
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
    console.log('[Game] New player initialized:', player.name, player.id);
    return player;
}

function initiateDot(game, x, y) {
    let pad = 30;
    let dotPos = new game.shapes.Vect(
        x || Math.floor(Math.random() * (game.config.canvas.width - pad * 2)) + pad,
        y || Math.floor(Math.random() * (game.config.canvas.height - pad * 2)) + pad
    );
    // Dots are smaller than players (radius 7px)
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
