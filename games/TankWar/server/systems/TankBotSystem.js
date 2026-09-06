const { createBullet } = require("../entities/Bullet.js");

class TankBotSystem {
    constructor(game, config) {
        this.game = game;
        this.config = config || {};
        this.worldW = (config.canvas && config.canvas.width) || 1600;
        this.worldH = (config.canvas && config.canvas.height) || 1200;
        this.fireTimers = new Map();
    }

    update(dt) {
        const game = this.game;
        const tanks = game.entities["players"] || [];
        const bots = tanks.filter(t => t.isBot);

        for (const bot of bots) {
            const bPos = bot.abilities.position.pos;
            const bVel = bot.abilities.velocity.velocity;

            // Find closest opponent
            let closestOpponent = null;
            let closestDistSq = 650 * 650;

            for (const other of tanks) {
                if (other.id === bot.id) continue;
                const oPos = other.abilities.position.pos;
                const dx = oPos.x - bPos.x;
                const dy = oPos.y - bPos.y;
                const distSq = dx * dx + dy * dy;
                if (distSq < closestDistSq) {
                    closestDistSq = distSq;
                    closestOpponent = other;
                }
            }

            if (closestOpponent) {
                const oPos = closestOpponent.abilities.position.pos;
                const dx = oPos.x - bPos.x;
                const dy = oPos.y - bPos.y;
                const dist = Math.sqrt(closestDistSq);
                const targetAngle = Math.atan2(dy, dx);

                // Smoothly steer turret towards target
                let angleDiff = targetAngle - bot.turretAngle;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                bot.turretAngle += angleDiff * Math.min(1.0, dt * 6.5);

                // Drive logic
                const speed = (bot.speed || 170) * 0.75;
                if (dist > 300) {
                    // Approach target
                    bVel.x += Math.cos(targetAngle) * speed * dt * 4.0;
                    bVel.y += Math.sin(targetAngle) * speed * dt * 4.0;
                    bot.chassisAngle = Math.atan2(bVel.y, bVel.x);
                } else if (dist < 160) {
                    // Retreat from target
                    bVel.x -= Math.cos(targetAngle) * speed * dt * 4.0;
                    bVel.y -= Math.sin(targetAngle) * speed * dt * 4.0;
                    bot.chassisAngle = Math.atan2(bVel.y, bVel.x);
                } else {
                    // Circle strafe
                    const strafeAngle = targetAngle + Math.PI / 2;
                    bVel.x += Math.cos(strafeAngle) * speed * dt * 3.0;
                    bVel.y += Math.sin(strafeAngle) * speed * dt * 3.0;
                    bot.chassisAngle = Math.atan2(bVel.y, bVel.x);
                }

                // Fire weapon when aligned and in range
                if (dist < 550 && Math.abs(angleDiff) < 0.28 && bot.ammo > 0 && bot.shootCooldown <= 0) {
                    let nextFire = this.fireTimers.get(bot.id) || 0;
                    if (Date.now() >= nextFire) {
                        const bulletData = bot.fire();
                        if (bulletData) {
                            createBullet(game, bulletData);
                            this.fireTimers.set(bot.id, Date.now() + 450 + Math.random() * 400);
                        }
                    }
                }
            } else {
                // Idle wander
                const wanderAngle = (bot.turretAngle || 0) + 0.05;
                bot.turretAngle = wanderAngle;
            }

            // Boundary repulsion
            const pad = 100;
            if (bPos.x < pad) bVel.x += 120 * dt;
            if (bPos.x > this.worldW - pad) bVel.x -= 120 * dt;
            if (bPos.y < pad) bVel.y += 120 * dt;
            if (bPos.y > this.worldH - pad) bVel.y -= 120 * dt;

            bot.updateCustom();
        }
    }
}

module.exports = { TankBotSystem };
