const { PlayerStateMachine } = require('../../../../engine');
const { ShieldedPlayerState, ActivePlayerState, DeadPlayerState } = require('../states/PlayerStates.js');
const { DOT_COLORS } = require('./Dot.js');

function createPlayer(game, data, eatingSystem) {
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

    // Attach Player FSM with 3.5s spawn invulnerability shield
    player.playerFSM = new PlayerStateMachine(player);
    player.playerFSM.registerState(new ShieldedPlayerState(3500));
    player.playerFSM.registerState(new ActivePlayerState());
    player.playerFSM.registerState(new DeadPlayerState());
    player.playerFSM.setState('shielded', { durationMs: 3500 });
    player.state = 'shielded';

    player.abilities.collidable.onCollisionStart((object) => {
        if (eatingSystem) eatingSystem.handleCollision(player, object);
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

module.exports = { createPlayer };
