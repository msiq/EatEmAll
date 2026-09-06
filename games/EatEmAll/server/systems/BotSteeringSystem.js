const { Rectangle } = require('../../../../engine');

class BotSteeringSystem {
    constructor(game) {
        this.game = game;
    }

    update(dt) {
        const game = this.game;
        if (!game.entities || !game.entities['players']) return;

        const now = Date.now();
        const arenaW = game.config.canvas.width;
        const arenaH = game.config.canvas.height;
        const wallMargin = 120;

        game.entities['players'].forEach(p => {
            if (!p.isBot || !p.abilities || !p.abilities.position || !p.abilities.velocity) return;

            if (!p.ai) {
                p.ai = {
                    wanderAngle: Math.random() * Math.PI * 2,
                    targetId: null,
                    targetPos: null,
                    targetLockUntil: 0
                };
            }
            const ai = p.ai;
            const myPos = p.abilities.position.pos;
            const myRadius = (p.abilities.body && p.abilities.body.shape && p.abilities.body.shape.radius) || 20;
            const baseSpeed = Math.max(2.2, 4.2 * Math.pow(20 / myRadius, 0.3));

            const searchBox = new Rectangle(myPos.x - 380, myPos.y - 380, 760, 760);
            const nearby = game.subSystems.collision.quadtree ? game.subSystems.collision.quadtree.query(searchBox) : [];

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

                // 1. THREAT EVALUATION
                const isPlayer = item.type === 'players';
                const isPredator = isPlayer && itemRadius > myRadius * 1.15;

                if (isPredator && dist < 260) {
                    const threatWeight = Math.pow((260 - dist) / 260, 1.5) * 3.5;
                    fleeVecX -= (dx / dist) * threatWeight;
                    fleeVecY -= (dy / dist) * threatWeight;
                    hasThreat = true;
                    continue;
                }

                // 2. VIRUS THREAT
                const isVirus = item.name === 'virus' || item.type === 'viruses';
                if (isVirus && myRadius >= 45 && dist < 180) {
                    const virusWeight = ((180 - dist) / 180) * 2.5;
                    fleeVecX -= (dx / dist) * virusWeight;
                    fleeVecY -= (dy / dist) * virusWeight;
                    hasThreat = true;
                    continue;
                }

                // 3. PREY HUNTING
                const isPrey = isPlayer && myRadius > itemRadius * 1.15;
                if (isPrey && !hasThreat && dist < minPreyDist && dist < 320) {
                    if (!item.playerFSM || !item.playerFSM.isShielded()) {
                        minPreyDist = dist;
                        preyTarget = itemPos;
                    }
                }

                // 4. COLLECTIBLE DOTS
                const isDot = item.name === 'dot' || item.type === 'dots';
                if (isDot && !hasThreat && dist < minDotDist) {
                    minDotDist = dist;
                    bestDot = { id: item.id, pos: itemPos };
                }
            }

            // Boundary repulsion
            let wallVecX = 0;
            let wallVecY = 0;
            if (myPos.x < wallMargin) wallVecX += (wallMargin - myPos.x) / wallMargin;
            if (myPos.x > arenaW - wallMargin) wallVecX -= (myPos.x - (arenaW - wallMargin)) / wallMargin;
            if (myPos.y < wallMargin) wallVecY += (wallMargin - myPos.y) / wallMargin;
            if (myPos.y > arenaH - wallMargin) wallVecY -= (myPos.y - (arenaH - wallMargin)) / wallMargin;

            let desiredDirX = 0;
            let desiredDirY = 0;

            if (hasThreat) {
                desiredDirX = fleeVecX + wallVecX * 2.0;
                desiredDirY = fleeVecY + wallVecY * 2.0;
                ai.targetLockUntil = 0;
            } else if (preyTarget) {
                const pdx = preyTarget.x - myPos.x;
                const pdy = preyTarget.y - myPos.y;
                const pDist = Math.hypot(pdx, pdy) || 1;
                desiredDirX = (pdx / pDist) * 2.2 + wallVecX * 1.5;
                desiredDirY = (pdy / pDist) * 2.2 + wallVecY * 1.5;
                ai.targetLockUntil = 0;
            } else {
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

            const desiredMag = Math.hypot(desiredDirX, desiredDirY);
            let targetVelX = 0;
            let targetVelY = 0;
            if (desiredMag > 0.001) {
                targetVelX = (desiredDirX / desiredMag) * baseSpeed;
                targetVelY = (desiredDirY / desiredMag) * baseSpeed;
            }

            const curVel = p.abilities.velocity.velocity;
            const steerWeight = Math.min(1.0, 0.20 * (game.timeScale || 1.0));
            curVel.x += (targetVelX - curVel.x) * steerWeight;
            curVel.y += (targetVelY - curVel.y) * steerWeight;

            if (p.abilities.orientation && (Math.abs(curVel.x) > 0.01 || Math.abs(curVel.y) > 0.01)) {
                p.abilities.orientation.orientation = curVel.unit();
            }
        });
    }
}

module.exports = { BotSteeringSystem };
