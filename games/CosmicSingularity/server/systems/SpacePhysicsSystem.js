const { createPlanet } = require("../entities/Planet.js");
const { createBlackHole } = require("../entities/BlackHole.js");
const { createStardust } = require("../entities/Stardust.js");
const { createAsteroid } = require("../entities/Asteroid.js");
const { createPulsar } = require("../entities/Pulsar.js");

class SpacePhysicsSystem {
    constructor(game, config) {
        this.game = game;
        this.config = config;
        this.G = 50;
    }

    update(dt) {
        const bhs = this.game.entities["blackholes"] || [];
        const planets = this.game.entities["planets"] || [];
        const stardust = this.game.entities["stardust"] || [];
        const asteroids = this.game.entities["asteroids"] || [];
        const pulsars = this.game.entities["pulsars"] || [];
        const W = this.config.canvas.width;
        const H = this.config.canvas.height;

        // 1. Radius, Timers & Mass Decay for Black Holes
        for (const bh of bhs) {
            if (bh.spawnImmunity > 0) {
                bh.spawnImmunity = Math.max(0, bh.spawnImmunity - dt);
            }
            if (bh.boostTimer > 0) {
                bh.boostTimer = Math.max(0, bh.boostTimer - dt);
            }
            if (bh.beamHitCooldown > 0) {
                bh.beamHitCooldown = Math.max(0, bh.beamHitCooldown - dt);
            }

            // Balanced radius: starts at 14, reaches 40 at mass 600, hard-capped at 65px!
            bh.radius = Math.min(65, 14 + Math.sqrt(Math.max(0, bh.mass - 100)) * 1.25);

            // Hawking Radiation (mass decay)
            if (bh.mass > 300) {
                bh.mass -= (bh.mass * 0.003) * dt;
            }
            if (bh.mass > 1000) {
                bh.mass -= (bh.mass * 0.010) * dt;
            }
            if (bh.mass > 2000) {
                bh.mass -= (bh.mass * 0.030) * dt;
            }
            bh.mass = Math.min(2500, Math.max(30, bh.mass));
        }

        // 2. Bot AI targeting
        for (const bh of bhs) {
            if (!bh.isBot) continue;
            let nearest = null;
            let minDist = Infinity;
            for (const p of planets) {
                const dx = p.x - bh.x;
                const dy = p.y - bh.y;
                const dist = Math.hypot(dx, dy);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = p;
                }
            }
            if (nearest) {
                bh.targetAngle = Math.atan2(nearest.y - bh.y, nearest.x - bh.x);
                bh.angle = bh.targetAngle;
                bh.throttle = 0.70;
                bh.isThrusting = true;
            } else {
                bh.isThrusting = false;
            }
        }

        // 3. Black Hole Movement & Inertia (Supports Pulsar Hyper-Slingshot)
        for (const bh of bhs) {
            let maxSpeed = Math.max(130, 220 - (Math.sqrt(bh.mass) - 10) * 3.5);

            // Hyper-speed window when slingshotted by a pulsar!
            if (bh.boostTimer > 0) {
                maxSpeed *= 2.4; // Accelerate up to ~500 px/sec!
            }

            if (bh.isThrusting) {
                const throttle = bh.throttle !== undefined ? bh.throttle : 1.0;
                const thrustForce = 750 * throttle;
                bh.vx += Math.cos(bh.targetAngle) * thrustForce * dt;
                bh.vy += Math.sin(bh.targetAngle) * thrustForce * dt;
                bh.angle = bh.targetAngle;

                if (bh.mass > 30) {
                    bh.mass -= 0.02 * dt;
                }
            } else {
                if (Math.hypot(bh.vx, bh.vy) > 5) {
                    bh.angle = Math.atan2(bh.vy, bh.vx);
                }
            }

            // Normal damping, but lighter damping during boost for extended glide
            const damping = bh.boostTimer > 0 ? 0.94 : 0.88;
            bh.vx *= damping;
            bh.vy *= damping;

            const currentSpeed = Math.hypot(bh.vx, bh.vy);
            if (currentSpeed > maxSpeed) {
                const scale = maxSpeed / currentSpeed;
                bh.vx *= scale;
                bh.vy *= scale;
            }
            
            bh.x += bh.vx * dt;
            bh.y += bh.vy * dt;

            bh.x = Math.max(bh.radius, Math.min(W - bh.radius, bh.x));
            bh.y = Math.max(bh.radius, Math.min(H - bh.radius, bh.y));
        }

        // 4. Stardust Micro-Motes: Gravity Pull & Ingestion
        for (let i = stardust.length - 1; i >= 0; i--) {
            const sd = stardust[i];
            let eatenBy = null;
            let ax = 0, ay = 0;

            for (const bh of bhs) {
                const dx = bh.x - sd.x;
                const dy = bh.y - sd.y;
                const dist = Math.hypot(dx, dy);

                // Instant suction ingestion
                if (dist < bh.radius + sd.radius) {
                    eatenBy = bh;
                    break;
                }

                // Vacuum pull when nearby
                const pullRadius = Math.min(220, bh.radius * 3.0);
                if (dist < pullRadius && dist > 1) {
                    const pullForce = (2800) / (dist + 25);
                    ax += (dx / dist) * pullForce;
                    ay += (dy / dist) * pullForce;
                }
            }

            if (eatenBy) {
                eatenBy.mass += sd.mass;
                stardust.splice(i, 1);
                createStardust(this.game, this.config.canvas);
                continue;
            }

            sd.vx = (sd.vx + ax * dt) * 0.94;
            sd.vy = (sd.vy + ay * dt) * 0.94;
            sd.x += sd.vx * dt;
            sd.y += sd.vy * dt;

            if (sd.x < 0) sd.x += W;
            if (sd.x > W) sd.x -= W;
            if (sd.y < 0) sd.y += H;
            if (sd.y > H) sd.y -= H;
        }

        // 5. Asteroids: Tumble, Drift & Tactical Tidal Disruption (Virus Mechanics)
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const ast = asteroids[i];
            ast.angle += ast.rotSpeed * dt;
            ast.x += ast.vx * dt;
            ast.y += ast.vy * dt;

            // Bounce off boundaries
            if (ast.x < ast.radius) { ast.x = ast.radius; ast.vx = Math.abs(ast.vx); }
            if (ast.x > W - ast.radius) { ast.x = W - ast.radius; ast.vx = -Math.abs(ast.vx); }
            if (ast.y < ast.radius) { ast.y = ast.radius; ast.vy = Math.abs(ast.vy); }
            if (ast.y > H - ast.radius) { ast.y = H - ast.radius; ast.vy = -Math.abs(ast.vy); }

            let destroyed = false;

            for (const bh of bhs) {
                const dx = bh.x - ast.x;
                const dy = bh.y - ast.y;
                const dist = Math.hypot(dx, dy);

                if (dist < bh.radius + ast.radius) {
                    if (bh.mass < ast.mass) {
                        // Small black holes can hide safely or gently nudge off the asteroid
                        const nx = dx / (dist || 1);
                        const ny = dy / (dist || 1);
                        bh.vx += nx * 40 * dt;
                        bh.vy += ny * 40 * dt;
                    } else {
                        // Massive black holes shatter the asteroid, but suffer tidal fragmentation!
                        destroyed = true;
                        
                        // Explosive repulsive recoil kickback
                        const nx = dx / (dist || 1);
                        const ny = dy / (dist || 1);
                        bh.vx += nx * 220;
                        bh.vy += ny * 220;

                        // Mass shedding (lose 10% mass, min 15, max 75)
                        const massLost = Math.min(75, Math.max(15, bh.mass * 0.10));
                        bh.mass -= massLost;

                        // Spawn fragmented stardust motes around collision site
                        const fragmentCount = 6;
                        for (let f = 0; f < fragmentCount; f++) {
                            const fAng = (Math.PI * 2 / fragmentCount) * f + Math.random() * 0.5;
                            const fDist = ast.radius * 1.3;
                            createStardust(this.game, this.config.canvas, {
                                x: ast.x + Math.cos(fAng) * fDist,
                                y: ast.y + Math.sin(fAng) * fDist
                            });
                        }
                        break;
                    }
                }
            }

            if (destroyed) {
                asteroids.splice(i, 1);
                createAsteroid(this.game, this.config.canvas);
            }
        }

        // 6. Pulsars: Slingshot Beams, Feeding Wave Ejection & Core Hazard
        for (const psr of pulsars) {
            psr.beamAngle += psr.spinSpeed * dt;
            if (psr.beamAngle > Math.PI * 2) psr.beamAngle -= Math.PI * 2;
            if (psr.beamAngle < 0) psr.beamAngle += Math.PI * 2;

            psr.pulseTimer += dt;
            if (psr.pulseTimer >= psr.pulseInterval) {
                psr.pulseTimer = 0;

                // PULSE WAVE: Eject a burst of glowing stardust radiating outward!
                if (stardust.length < 320) {
                    const burstCount = 4;
                    for (let b = 0; b < burstCount; b++) {
                        const bAng = (Math.PI * 2 / burstCount) * b + Math.random() * 0.4;
                        const sd = createStardust(this.game, this.config.canvas, {
                            x: psr.x + Math.cos(bAng) * (psr.radius + 15),
                            y: psr.y + Math.sin(bAng) * (psr.radius + 15)
                        });
                        sd.vx = Math.cos(bAng) * 90;
                        sd.vy = Math.sin(bAng) * 90;
                    }
                }
            }

            // Dual opposing beam angles
            const beamAngles = [psr.beamAngle, psr.beamAngle + Math.PI];

            for (const bh of bhs) {
                const dx = bh.x - psr.x;
                const dy = bh.y - psr.y;
                const dist = Math.hypot(dx, dy);

                // A. CORE HAZARD: Violent magnetic repulsion & mild mass spark
                if (dist < psr.radius + bh.radius + 12) {
                    const nx = dx / (dist || 1);
                    const ny = dy / (dist || 1);
                    bh.vx = nx * 580;
                    bh.vy = ny * 580;
                    bh.mass = Math.max(25, bh.mass - 3);
                    bh.boostTimer = 0.6;
                    continue;
                }

                // B. RELATIVISTIC SLINGSHOT BEAM: Catapult surge along the jet axis!
                if (dist < psr.beamLength && dist > 1) {
                    const targetAngle = Math.atan2(dy, dx);
                    
                    for (const bAng of beamAngles) {
                        let diff = Math.abs(targetAngle - bAng);
                        while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

                        // Within conical beam cone (~16 degrees / 0.28 rad)
                        if (diff < 0.28) {
                            if (!bh.beamHitCooldown || bh.beamHitCooldown <= 0) {
                                bh.beamHitCooldown = 0.75; // Prevent machine-gun retrigger
                                bh.boostTimer = 1.35;      // 1.35 seconds of hyper-slingshot!

                                // Catapult impulse along beam direction!
                                const slingshotSpeed = 480;
                                bh.vx = Math.cos(bAng) * slingshotSpeed;
                                bh.vy = Math.sin(bAng) * slingshotSpeed;
                                bh.angle = bAng;
                            }
                            break;
                        }
                    }
                }
            }
        }

        // 7. Planets & Capped Gravity Pull
        for (let i = planets.length - 1; i >= 0; i--) {
            const p = planets[i];
            let ax = 0, ay = 0;
            let eatenBy = null;

            for (const bh of bhs) {
                const dx = bh.x - p.x;
                const dy = bh.y - p.y;
                const distSq = dx*dx + dy*dy;
                const dist = Math.sqrt(distSq);

                if (dist < bh.radius + p.radius) {
                    eatenBy = bh;
                    break;
                }

                // Capped influence distance (max 320px)
                const maxInfluence = Math.min(320, bh.radius * 3.2);
                if (dist < maxInfluence) {
                    const effectiveMass = Math.min(300, bh.mass);
                    const force = (this.G * effectiveMass) / (distSq + 160);
                    ax += (dx / dist) * force;
                    ay += (dy / dist) * force;
                }
            }

            if (eatenBy) {
                eatenBy.mass += p.mass;
                planets.splice(i, 1);
                createPlanet(this.game, this.config.canvas);
                continue;
            }

            p.vx += ax * dt;
            p.vy += ay * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            if (p.x < p.radius) { p.x = p.radius; p.vx = Math.abs(p.vx); }
            if (p.x > W - p.radius) { p.x = W - p.radius; p.vx = -Math.abs(p.vx); }
            if (p.y < p.radius) { p.y = p.radius; p.vy = Math.abs(p.vy); }
            if (p.y > H - p.radius) { p.y = H - p.radius; p.vy = -Math.abs(p.vy); }
        }

        // 8. Consumption between Black Holes (Protected by Spawn Immunity)
        for (let i = 0; i < bhs.length; i++) {
            for (let j = i + 1; j < bhs.length; j++) {
                const b1 = bhs[i];
                const b2 = bhs[j];

                if (b1.spawnImmunity > 0 || b2.spawnImmunity > 0) continue;

                const dx = b1.x - b2.x;
                const dy = b1.y - b2.y;
                const dist = Math.hypot(dx, dy);

                const eater = b1.mass >= b2.mass * 1.10 ? b1 : (b2.mass >= b1.mass * 1.10 ? b2 : null);
                const prey = eater === b1 ? b2 : (eater === b2 ? b1 : null);

                if (eater && prey) {
                    if (dist < eater.radius * 0.85 + prey.radius * 0.3) {
                        eater.mass += Math.min(prey.mass, 350);
                        prey.dead = true;
                        prey.killedBy = eater.name;
                    }
                }
            }
        }

        // 9. Dead black hole cleanup & respawn
        for (let i = bhs.length - 1; i >= 0; i--) {
            const bh = bhs[i];
            if (bh.mass <= 0 || bh.dead) {
                if (bh.socketId && this.game.server) {
                    this.game.server.gameOver(bh.socketId, {
                        killedBy: bh.killedBy || "Singularity Collapse",
                        score: Math.round(bh.mass || 0)
                    });
                }
                bhs.splice(i, 1);

                if (bh.isBot) {
                    createBlackHole(this.game, {
                        name: bh.name,
                        isBot: true,
                        color: bh.color,
                        canvas: this.config.canvas
                    });
                }
            }
        }
    }
}

module.exports = { SpacePhysicsSystem };
