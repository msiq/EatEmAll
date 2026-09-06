const { BaseGameState } = require('./Server/GameState.js');
const { BasePlayerState, PlayerStateMachine } = require('./Server/PlayerState.js');
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


// ==================== Eat 'Em All State Implementations ====================
class LobbyGameState extends BaseGameState {
    constructor() { super('lobby'); }
    enter(game) { console.log('[GameFSM] Entered Lobby state'); }
    update(game, dt) {
        const players = game.entities['players'] || [];
        const humans = players.filter(p => !p.isBot);
        if (humans.length > 0) {
            game.gameFSM.setState('round_active', { durationMs: 180000 });
        }
    }
}

class RoundActiveGameState extends BaseGameState {
    constructor() {
        super('round_active');
        this.durationMs = 180000; // 3-minute round
    }
    enter(game, payload = {}) {
        this.durationMs = payload.durationMs || 180000;
        console.log(`[GameFSM] Round active! Time limit: ${this.durationMs / 1000}s`);
    }
    update(game, dt) {
        if (game.gameFSM.getTimeInState() >= this.durationMs) {
            game.gameFSM.setState('round_over');
        }
    }
}

class RoundOverGameState extends BaseGameState {
    constructor() {
        super('round_over');
        this.celebrationDurationMs = 6000;
        this.winner = null;
    }
    enter(game) {
        const players = (game.entities['players'] || []).slice();
        players.sort((a, b) => ((b.abilities.score && b.abilities.score.score) || 0) - ((a.abilities.score && a.abilities.score.score) || 0));
        const top = players[0];
        this.winner = top ? { name: top.name, score: (top.abilities.score && top.abilities.score.score) || 0 } : { name: 'Nobody', score: 0 };
        console.log(`[GameFSM] Round Over! Winner: ${this.winner.name} (${this.winner.score} pts)`);

        if (typeof game.addTickEvent === 'function') {
            game.addTickEvent({
                type: 'round_summary',
                winner: this.winner.name,
                score: this.winner.score
            });
        }
    }
    update(game, dt) {
        if (game.gameFSM.getTimeInState() >= this.celebrationDurationMs) {
            const players = game.entities['players'] || [];
            players.forEach(p => {
                if (p.abilities.score) p.abilities.score.score = 0;
                if (p.abilities.body && p.abilities.body.shape) p.abilities.body.shape.radius = 20;
                if (p.abilities.aabb) p.abilities.aabb = new game.abilities.Aabb(p.abilities.body);
                if (p.playerFSM) p.playerFSM.setState('shielded', { durationMs: 3500 });
            });
            game.gameFSM.setState('round_active', { durationMs: 180000 });
        }
    }
}

class ShieldedPlayerState extends BasePlayerState {
    constructor() {
        super('shielded');
        this.durationMs = 3500;
    }
    enter(player, payload = {}) {
        this.durationMs = payload.durationMs || 3500;
    }
    update(player, dt) {
        if (player.playerFSM && player.playerFSM.getTimeInState() >= this.durationMs) {
            player.playerFSM.setState('active');
        }
    }
}

class ActivePlayerState extends BasePlayerState {
    constructor() { super('active'); }
}

class DeadPlayerState extends BasePlayerState {
    constructor() { super('dead'); }
}
// =========================================================================

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

        // Register Eat 'Em All FSM states
    if (game.gameFSM) {
        game.gameFSM.registerState(new LobbyGameState());
        game.gameFSM.registerState(new RoundActiveGameState());
        game.gameFSM.registerState(new RoundOverGameState());
        game.gameFSM.setState('lobby');
    }
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

// AI Bots decision loop (Realistic Context Steering AI with target commitment, evasion, and momentum)
let lastBotAiTime = 0;
game.update = function() {
    const now = Date.now();
    if (now - lastBotAiTime < 60) return; // run bot AI every ~60ms (~16 Hz smooth updates)
    const dtSec = Math.min(0.1, (now - lastBotAiTime) / 1000);
    lastBotAiTime = now;

    if (!game.entities['players'] || !game.subSystems.collision.quadtree) return;

    const arenaW = (game.config && game.config.canvas && game.config.canvas.width) || 2000;
    const arenaH = (game.config && game.config.canvas && game.config.canvas.height) || 2000;
    const wallMargin = 140;

    game.entities['players'].forEach(p => {
        if (!p.isBot || !p.abilities || !p.abilities.position || !p.abilities.velocity) return;
        if (!p.aiState) {
            p.aiState = {
                targetId: null,
                targetPos: null,
                targetLockUntil: 0,
                wanderAngle: Math.random() * Math.PI * 2,
                turnRate: 0.22,
            };
        }

        const ai = p.aiState;
        const myPos = p.abilities.position.pos;
        const myRadius = (p.abilities.body && p.abilities.body.shape && p.abilities.body.shape.radius) || 20;

        // Speed scaling based on cell size (larger cells move slightly slower)
        const baseSpeed = Math.max(2.2, 4.2 * Math.pow(20 / myRadius, 0.3));

        // Query Quadtree for nearby items within 380px
        const searchBox = new Rectangle(myPos.x - 380, myPos.y - 380, 760, 760);
        const nearby = game.subSystems.collision.quadtree.query(searchBox);

        let fleeVecX = 0;
        let fleeVecY = 0;
        let hasThreat = false;

        let preyTarget = null;
        let minPreyDist = Infinity;

        let bestDot = null;
        let minDotDist = Infinity;

        for (let i = 0; i < nearby.length; i++) {
            const item = nearby[i];
            if (item.id === p.id || !item.abilities || !item.abilities.position) continue;

            const itemPos = item.abilities.position.pos;
            const dx = itemPos.x - myPos.x;
            const dy = itemPos.y - myPos.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 0.001) continue;

            const itemRadius = (item.abilities.body && item.abilities.body.shape && item.abilities.body.shape.radius) || 20;

            // 1. THREAT EVALUATION: Bigger players that can swallow me
            const isPlayer = item.type === 'players';
            const isPredator = isPlayer && itemRadius > myRadius * 1.15;

            if (isPredator && dist < 260) {
                const threatWeight = Math.pow((260 - dist) / 260, 1.5) * 3.5;
                fleeVecX -= (dx / dist) * threatWeight;
                fleeVecY -= (dy / dist) * threatWeight;
                hasThreat = true;
                continue;
            }

            // 2. VIRUS THREAT: Large bots avoid viruses
            const isVirus = item.name === 'virus' || item.type === 'viruses';
            if (isVirus && myRadius >= 45 && dist < 180) {
                const virusWeight = ((180 - dist) / 180) * 2.5;
                fleeVecX -= (dx / dist) * virusWeight;
                fleeVecY -= (dy / dist) * virusWeight;
                hasThreat = true;
                continue;
            }

            // 3. PREY HUNTING: Smaller players that I can eat
            const isPrey = isPlayer && myRadius > itemRadius * 1.15;
            if (isPrey && !hasThreat && dist < minPreyDist && dist < 320) {
                if (!item.playerFSM || !item.playerFSM.isShielded()) {
                    minPreyDist = dist;
                    preyTarget = itemPos;
                }
            }

            // 4. COLLECTIBLE DOTS:
            const isDot = item.name === 'dot' || item.type === 'dots';
            if (isDot && !hasThreat && dist < minDotDist) {
                minDotDist = dist;
                bestDot = { id: item.id, pos: itemPos };
            }
        }

        // Arena Boundary Repulsion (keeps bots safely away from arena edges)
        let wallVecX = 0;
        let wallVecY = 0;
        if (myPos.x < wallMargin) wallVecX += (wallMargin - myPos.x) / wallMargin;
        if (myPos.x > arenaW - wallMargin) wallVecX -= (myPos.x - (arenaW - wallMargin)) / wallMargin;
        if (myPos.y < wallMargin) wallVecY += (wallMargin - myPos.y) / wallMargin;
        if (myPos.y > arenaH - wallMargin) wallVecY -= (myPos.y - (arenaH - wallMargin)) / wallMargin;

        let desiredDirX = 0;
        let desiredDirY = 0;

        if (hasThreat) {
            // High Priority: Escape from predator
            desiredDirX = fleeVecX + wallVecX * 2.0;
            desiredDirY = fleeVecY + wallVecY * 2.0;
            ai.targetLockUntil = 0; // Break target lock when fleeing
        } else if (preyTarget) {
            // Medium-High Priority: Chase down prey
            const pdx = preyTarget.x - myPos.x;
            const pdy = preyTarget.y - myPos.y;
            const pDist = Math.hypot(pdx, pdy) || 1;
            desiredDirX = (pdx / pDist) * 2.2 + wallVecX * 1.5;
            desiredDirY = (pdy / pDist) * 2.2 + wallVecY * 1.5;
            ai.targetLockUntil = 0;
        } else {
            // Normal: Target lock or Wandering
            if (now < ai.targetLockUntil && ai.targetPos && Math.hypot(ai.targetPos.x - myPos.x, ai.targetPos.y - myPos.y) > 8) {
                const tdx = ai.targetPos.x - myPos.x;
                const tdy = ai.targetPos.y - myPos.y;
                const tDist = Math.hypot(tdx, tdy) || 1;
                desiredDirX = (tdx / tDist) + wallVecX * 1.5;
                desiredDirY = (tdy / tDist) + wallVecY * 1.5;
            } else if (bestDot) {
                ai.targetId = bestDot.id;
                ai.targetPos = bestDot.pos;
                ai.targetLockUntil = now + 1200 + Math.random() * 1000;

                const tdx = bestDot.pos.x - myPos.x;
                const tdy = bestDot.pos.y - myPos.y;
                const tDist = Math.hypot(tdx, tdy) || 1;
                desiredDirX = (tdx / tDist) + wallVecX * 1.5;
                desiredDirY = (tdy / tDist) + wallVecY * 1.5;
            } else {
                ai.wanderAngle += (Math.random() - 0.5) * 0.4;
                desiredDirX = Math.cos(ai.wanderAngle) + wallVecX * 2.0;
                desiredDirY = Math.sin(ai.wanderAngle) + wallVecY * 2.0;
            }
        }

        // Normalize desired direction vector
        const desiredMag = Math.hypot(desiredDirX, desiredDirY);
        let targetVelX = 0;
        let targetVelY = 0;
        if (desiredMag > 0.001) {
            targetVelX = (desiredDirX / desiredMag) * baseSpeed;
            targetVelY = (desiredDirY / desiredMag) * baseSpeed;
        }

        // Smooth Steering & Inertia (lerp current velocity towards target velocity)
        const curVel = p.abilities.velocity.velocity;
        const steerWeight = Math.min(1.0, 0.20 * (game.timeScale || 1.0));

        curVel.x += (targetVelX - curVel.x) * steerWeight;
        curVel.y += (targetVelY - curVel.y) * steerWeight;

        if (p.abilities.orientation && (Math.abs(curVel.x) > 0.01 || Math.abs(curVel.y) > 0.01)) {
            const heading = curVel.unit();
            p.abilities.orientation.orientation = heading;
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
            radius: (object.abilities.body && object.abilities.body.shape && object.abilities.body.shape.radius) || 3.5,
            color: object.abilities.body.color
        });

        if (entity.has('score')) entity.abilities.score.add(2);
        if (entity.has('experience')) {
            entity.abilities.experience.add(1);
            if (entity.abilities.experience.xp % 10 === 0 && entity.has('rank')) {
                entity.abilities.rank.raise();
            }
        }
        if (entity.has('health')) {
            entity.abilities.health.health = Math.min(100, entity.abilities.health.health + 2);
        }

        // Area/mass-based growth: Area = pi * r^2. Each pellet adds a mass delta (2.5),
        // giving smooth early progression while introducing natural diminishing returns for larger cells.
        if (entity.has('body')) {
            let shape = entity.abilities.body.shape;
            if (shape && shape.radius) {
                const pelletMass = 2.5;
                shape.radius = Math.min(160, Math.sqrt(shape.radius * shape.radius + pelletMass));
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
                    radius: (dot.abilities.body && dot.abilities.body.shape && dot.abilities.body.shape.radius) || 3.5,
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

        // Attach Player FSM with 3.5s spawn invulnerability shield
    player.playerFSM = new PlayerStateMachine(player);
    player.playerFSM.registerState(new ShieldedPlayerState());
    player.playerFSM.registerState(new ActivePlayerState());
    player.playerFSM.registerState(new DeadPlayerState());
    player.playerFSM.setState('shielded', { durationMs: 3500 });
    player.state = 'shielded';

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

        bot.playerFSM = new PlayerStateMachine(bot);
    bot.playerFSM.registerState(new ShieldedPlayerState());
    bot.playerFSM.registerState(new ActivePlayerState());
    bot.playerFSM.registerState(new DeadPlayerState());
    bot.playerFSM.setState('active');
    bot.state = 'active';

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
    let dotCirc = new game.shapes.Circ(3.5);
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
