const { DOT_COLORS } = require('../entities/Dot.js');

class EatingSystem {
    constructor(game) {
        this.game = game;
    }

    isEating(entityA, entityB) {
        if (!entityA || !entityB || !entityA.abilities || !entityB.abilities) return false;

        // Shielded players cannot eat or be eaten
        if (entityA.playerFSM && entityA.playerFSM.isShielded()) return false;
        if (entityB.playerFSM && entityB.playerFSM.isShielded()) return false;

        // Player eating food dot
        const isDot = (entityA.name === 'dot' || entityA.type === 'dots') || (entityB.name === 'dot' || entityB.type === 'dots');
        const isPlayer = (entityA.type === 'players') || (entityB.type === 'players');
        if (isDot && isPlayer) return true;

        // Player hitting virus
        const isVirus = (entityA.name === 'virus' || entityA.type === 'viruses') || (entityB.name === 'virus' || entityB.type === 'viruses');
        if (isVirus && isPlayer) return true;

        // Player vs Player predation
        if (entityA.type === 'players' && entityB.type === 'players') {
            const radA = (entityA.abilities.body && entityA.abilities.body.shape && entityA.abilities.body.shape.radius) || 20;
            const radB = (entityB.abilities.body && entityB.abilities.body.shape && entityB.abilities.body.shape.radius) || 20;
            if (radA > radB * 1.15 || radB > radA * 1.15) {
                return true;
            }
        }
        return false;
    }

    filterImpulse(A, B) {
        return !this.isEating(A, B);
    }

    handleCollision(entity, object) {
        if (!object || !object.abilities) return;
        const game = this.game;

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

            // Area/mass-based growth: Area = pi * r^2. Mass delta = 2.5
            if (entity.has('body')) {
                let shape = entity.abilities.body.shape;
                if (shape && shape.radius) {
                    const pelletMass = 6.0;
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
                    const stats = {
                        eatenBy: entity.name || 'A Predator',
                        score: object.has('score') ? object.abilities.score.score : 0,
                        radius: Math.round(otherRadius)
                    };
                    if (object.socket_id && game.server && typeof game.server.gameOver === 'function') {
                        game.server.gameOver(object.socket_id, stats);
                    }
                    game.onPlayerDisconnect(object.socket_id);
                }
            }
            return;
        }

        // 3. Colliding with a Hazard Virus (SHATTER ON IMPACT)
        if (object.name === 'virus' || object.type === 'viruses') {
            let myRadius = entity.abilities.body.shape.radius || 20;
            if (myRadius < 45) return;

            console.log('[Game]', entity.name, 'hit a virus and popped!');
            if (game && typeof game.addTickEvent === 'function') {
                game.addTickEvent({
                    type: 'virus_pop',
                    target: entity.id,
                    x: entity.abilities.position.pos.x,
                    y: entity.abilities.position.pos.y
                });
            }

            entity.abilities.body.shape.radius = Math.max(22, Math.round(myRadius * 0.65));
            entity.abilities.aabb = new game.abilities.Aabb(entity.abilities.body);

            const popX = entity.abilities.position.pos.x;
            const popY = entity.abilities.position.pos.y;

            if (game.entities && game.entities['dots']) {
                const dots = game.entities['dots'];
                const numDots = Math.min(20, dots.length);
                for (let i = 0; i < numDots; i++) {
                    const dot = dots[i];
                    const angle = (i / numDots) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
                    const dist = 60 + Math.random() * 80;
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

            let pad = 120;
            object.abilities.position.pos.x = Math.floor(Math.random() * (game.config.canvas.width - pad * 2)) + pad;
            object.abilities.position.pos.y = Math.floor(Math.random() * (game.config.canvas.height - pad * 2)) + pad;
            object.abilities.aabb = new game.abilities.Aabb(object.abilities.body);
        }
    }
}

module.exports = { EatingSystem };
