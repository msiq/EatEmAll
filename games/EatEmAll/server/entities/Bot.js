const { PlayerStateMachine } = require('../../../../engine');
const { ShieldedPlayerState, ActivePlayerState, DeadPlayerState } = require('../states/PlayerStates.js');
const { DOT_COLORS } = require('./Dot.js');

function createBot(game, name, eatingSystem) {
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

    bot.playerFSM = new PlayerStateMachine(bot);
    bot.playerFSM.registerState(new ShieldedPlayerState(3500));
    bot.playerFSM.registerState(new ActivePlayerState());
    bot.playerFSM.registerState(new DeadPlayerState());
    bot.playerFSM.setState('active');
    bot.state = 'active';

    // AI steering state tracking
    bot.ai = {
        wanderAngle: Math.random() * Math.PI * 2,
        targetId: null,
        targetPos: null,
        targetLockUntil: 0
    };

    bot.abilities.collidable.onCollisionStart((object) => {
        if (eatingSystem) eatingSystem.handleCollision(bot, object);
    });

    game.subSystems.collision.AddEntity(bot);
    game.subSystems.motion.AddEntity(bot);
    game.subSystems.physics.AddEntity(bot);
    game.subSystems.score.AddEntity(bot);

    game.addEntity(bot, 'players');
    return bot;
}

module.exports = { createBot };
