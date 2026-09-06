const { createBullet } = require("../entities/Bullet.js");

class CombatSystem {
    constructor(game, config) {
        this.game = game;
        this.config = config || {};
        this.worldW = (config.canvas && config.canvas.width) || 1600;
        this.worldH = (config.canvas && config.canvas.height) || 1200;
    }

    handleInput(tank, inputData) {
        if (!tank || !inputData) return;

        // Mouse aiming direction
        if (inputData.mouseAngle !== undefined) {
            tank.turretAngle = inputData.mouseAngle;
            tank.updateCustom();
        } else if (inputData.dir && (inputData.dir.x !== 0 || inputData.dir.y !== 0)) {
            tank.turretAngle = Math.atan2(inputData.dir.y, inputData.dir.x);
            tank.updateCustom();
        }

        // Movement input (WASD or directional vector)
        const move = inputData.move || inputData.dir;
        if (move && (move.x !== 0 || move.y !== 0)) {
            const mag = Math.sqrt(move.x * move.x + move.y * move.y) || 1;
            const nx = move.x / mag;
            const ny = move.y / mag;
            const speed = tank.speed || 170;

            tank.abilities.velocity.velocity.x = nx * speed;
            tank.abilities.velocity.velocity.y = ny * speed;
            tank.chassisAngle = Math.atan2(ny, nx);
            tank.updateCustom();
        }
    }

    handleClick(tank, clickData) {
        if (!tank) return;
        if (clickData && clickData.mouseAngle !== undefined) {
            tank.turretAngle = clickData.mouseAngle;
        }
        const bulletData = tank.fire();
        if (bulletData) {
            createBullet(this.game, bulletData);
            this.game.addTickEvent({
                type: "hit",
                x: bulletData.x,
                y: bulletData.y
            });
        }
    }

    update(dt) {
        const game = this.game;
        const tanks = game.entities["players"] || [];
        const bullets = game.entities["bullets"] || [];
        const obstacles = game.entities["obstacles"] || [];

        // 1. Update tanks (reload, cooldowns, bounds, damping)
        for (const tank of tanks) {
            if (tank.shootCooldown > 0) tank.shootCooldown -= dt;

            if (tank.ammo < tank.maxAmmo) {
                tank.reloadTimer -= dt;
                if (tank.reloadTimer <= 0) {
                    tank.ammo = tank.maxAmmo;
                    tank.updateCustom();
                }
            }

            // Position integration from velocity
            const pos = tank.abilities.position.pos;
            const vel = tank.abilities.velocity.velocity;
            pos.x += vel.x * dt;
            pos.y += vel.y * dt;

            // Arena boundary clamping
            const rad = (tank.abilities.body && tank.abilities.body.shape && tank.abilities.body.shape.radius) || 24;
            pos.x = Math.max(rad, Math.min(this.worldW - rad, pos.x));
            pos.y = Math.max(rad, Math.min(this.worldH - rad, pos.y));

            // Velocity damping
            vel.x *= 0.88;
            vel.y *= 0.88;

            tank.updateCustom();
        }

        // 2. Tank vs Obstacle solid collision resolution
        for (const tank of tanks) {
            const tPos = tank.abilities.position.pos;
            const tRad = 24;

            for (const obs of obstacles) {
                const oPos = obs.abilities.position.pos;
                const oRad = (obs.abilities.body && obs.abilities.body.shape && obs.abilities.body.shape.radius) || 28;

                const dx = tPos.x - oPos.x;
                const dy = tPos.y - oPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = tRad + oRad;

                if (dist < minDist && dist > 0.001) {
                    const overlap = minDist - dist;
                    tPos.x += (dx / dist) * overlap;
                    tPos.y += (dy / dist) * overlap;
                }
            }
        }

        // 3. Tank vs Tank soft bounce resolution
        for (let i = 0; i < tanks.length; i++) {
            for (let j = i + 1; j < tanks.length; j++) {
                const t1 = tanks[i];
                const t2 = tanks[j];
                const p1 = t1.abilities.position.pos;
                const p2 = t2.abilities.position.pos;
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = 48; // 24 + 24

                if (dist < minDist && dist > 0.001) {
                    const overlap = (minDist - dist) * 0.5;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    p1.x -= nx * overlap;
                    p1.y -= ny * overlap;
                    p2.x += nx * overlap;
                    p2.y += ny * overlap;
                }
            }
        }

        // 4. Update bullets & bullet collisions
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.lifetime -= dt;

            const bPos = b.abilities.position.pos;
            const bVel = b.abilities.velocity.velocity;
            bPos.x += bVel.x * dt;
            bPos.y += bVel.y * dt;

            // Check out of bounds or lifetime expiry
            if (b.lifetime <= 0 || bPos.x < 0 || bPos.x > this.worldW || bPos.y < 0 || bPos.y > this.worldH) {
                bullets.splice(i, 1);
                continue;
            }

            let hit = false;

            // A. Check bullet vs Obstacle
            for (let j = obstacles.length - 1; j >= 0; j--) {
                const obs = obstacles[j];
                const oPos = obs.abilities.position.pos;
                const oRad = (obs.abilities.body && obs.abilities.body.shape && obs.abilities.body.shape.radius) || 28;

                const dx = bPos.x - oPos.x;
                const dy = bPos.y - oPos.y;
                if ((dx * dx + dy * dy) < (oRad + 4.5) * (oRad + 4.5)) {
                    // Deal damage
                    if (obs.abilities.health) {
                        obs.abilities.health.takeDamage(b.damage);
                    }
                    game.addTickEvent({ type: "hit", x: bPos.x, y: bPos.y });
                    hit = true;

                    // Obstacle destruction
                    if (obs.abilities.health && obs.abilities.health.health <= 0) {
                        game.addTickEvent({ type: "explosion", x: oPos.x, y: oPos.y });
                        obstacles.splice(j, 1);
                    }
                    break;
                }
            }

            if (hit) {
                bullets.splice(i, 1);
                continue;
            }

            // B. Check bullet vs Tank
            for (const tank of tanks) {
                if (tank.id === b.ownerId) continue; // Do not hit own tank

                const tPos = tank.abilities.position.pos;
                const tRad = 24;
                const dx = bPos.x - tPos.x;
                const dy = bPos.y - tPos.y;

                if ((dx * dx + dy * dy) < (tRad + 4.5) * (tRad + 4.5)) {
                    // Damage tank
                    if (tank.abilities.health) {
                        tank.abilities.health.takeDamage(b.damage);
                    }

                    // Recoil push
                    tank.abilities.velocity.velocity.x += bVel.x * 0.08;
                    tank.abilities.velocity.velocity.y += bVel.y * 0.08;

                    game.addTickEvent({ type: "hit", x: bPos.x, y: bPos.y });
                    hit = true;

                    // Check tank death
                    if (tank.abilities.health && tank.abilities.health.health <= 0) {
                        game.addTickEvent({ type: "explosion", x: tPos.x, y: tPos.y });

                        // Award shooter
                        const shooter = tanks.find(p => p.id === b.ownerId);
                        if (shooter) {
                            shooter.kills = (shooter.kills || 0) + 1;
                            if (shooter.abilities.score) shooter.abilities.score.add(100);
                            shooter.updateCustom();
                        }

                        if (tank.isBot) {
                            // Respawn bot at random location
                            tank.abilities.health.health = 100;
                            tank.ammo = 10;
                            tank.abilities.position.pos.x = 200 + Math.random() * (this.worldW - 400);
                            tank.abilities.position.pos.y = 200 + Math.random() * (this.worldH - 400);
                            tank.abilities.velocity.velocity.x = 0;
                            tank.abilities.velocity.velocity.y = 0;
                            tank.updateCustom();
                        } else {
                            // Human player elimination
                            if (game.server && typeof game.server.gameOver === "function" && tank.socketId) {
                                game.server.gameOver(tank.socketId, {
                                    killedBy: b.ownerName || "Opponent",
                                    score: tank.abilities.score ? tank.abilities.score.score : 0,
                                    kills: tank.kills || 0
                                });
                            }

                            // Respawn human
                            tank.abilities.health.health = 100;
                            tank.ammo = 10;
                            tank.abilities.position.pos.x = 200 + Math.random() * (this.worldW - 400);
                            tank.abilities.position.pos.y = 200 + Math.random() * (this.worldH - 400);
                            tank.abilities.velocity.velocity.x = 0;
                            tank.abilities.velocity.velocity.y = 0;
                            tank.updateCustom();
                        }
                    }
                    break;
                }
            }

            if (hit) {
                bullets.splice(i, 1);
            }
        }
    }
}

module.exports = { CombatSystem };
