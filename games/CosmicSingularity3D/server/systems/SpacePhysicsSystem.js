const { createPlanet } = require("../entities/Planet.js");
const { createBlackHole } = require("../entities/BlackHole.js");
const { createStardust } = require("../entities/Stardust.js");
const { createAsteroid } = require("../entities/Asteroid.js");
const { createPulsar } = require("../entities/Pulsar.js");
const { getGalaxies, galaxyAt, clampToDisc } = require("../galaxies.js");

// Stardust capture. CAPTURE_MIN keeps the early game from starving; the scale
// term lets a grown black hole hoover up a wide swathe.
const CAPTURE_MIN = 95;
const CAPTURE_SCALE = 3.0;

// A planet slower than this, with nothing pulling it, is parked.
const PLANET_REST_SPEED = 1.2;
const PLANET_DAMPING = 0.97;

class SpacePhysicsSystem {
    constructor(game, config) {
        this.game = game;
        this.config = config;
        this.G = 50;
        this.galaxies = getGalaxies(config);
        // Pulse waves top the universe up, but only until every galaxy is at
        // roughly its configured stardust density.
        this.stardustCap = Math.round((config.stardustCount || 100) * this.galaxies.length * 1.15);
    }

    /**
     * How far a black hole can swallow stardust from. Generous compared with
     * its physical size, because a fast mover has almost no dwell time near any
     * one mote - this is the knob that decides whether the game feeds you.
     */
    captureRadius(bh) {
        return Math.max(CAPTURE_MIN, bh.radius * CAPTURE_SCALE);
    }

    /** The galaxy a body currently belongs to. */
    homeOf(entity) {
        return galaxyAt(this.galaxies, entity.x, entity.y);
    }

    /**
     * Hold a body inside its galaxy's rim. Bodies with velocity bounce off it;
     * the rim is a hard edge of the disc, not a square wall.
     */
    containInDisc(g, e, inset) {
        const maxR = Math.max(1, g.radius - inset);
        const dx = e.x - g.x;
        const dy = e.y - g.y;
        const d = Math.hypot(dx, dy);
        if (d <= maxR) return false;

        const nx = dx / (d || 1);
        const ny = dy / (d || 1);
        e.x = g.x + nx * maxR;
        e.y = g.y + ny * maxR;

        // Reflect any outward velocity back into the disc.
        if (e.vx !== undefined) {
            const outward = e.vx * nx + e.vy * ny;
            if (outward > 0) {
                e.vx -= 2 * outward * nx;
                e.vy -= 2 * outward * ny;
            }
        }
        return true;
    }

    update(dt) {
        const bhs = this.game.entities["blackholes"] || [];
        const planets = this.game.entities["planets"] || [];
        const stardust = this.game.entities["stardust"] || [];
        const asteroids = this.game.entities["asteroids"] || [];
        const pulsars = this.game.entities["pulsars"] || [];
        const wormholes = this.game.entities["wormholes"] || [];

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
                
                // Smooth turning
                let diff = bh.targetAngle - bh.angle;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                
                const turnSpeed = Math.PI * 1.5; // rad per sec
                const maxTurn = turnSpeed * dt;
                
                if (Math.abs(diff) <= maxTurn) {
                    bh.angle = bh.targetAngle;
                } else {
                    bh.angle += Math.sign(diff) * maxTurn;
                }
                
                while (bh.angle > Math.PI * 2) bh.angle -= Math.PI * 2;
                while (bh.angle < 0) bh.angle += Math.PI * 2;

                bh.vx += Math.cos(bh.angle) * thrustForce * dt;
                bh.vy += Math.sin(bh.angle) * thrustForce * dt;

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
            
            // Resolve the home galaxy before moving, so a fast body can never
            // be handed to a neighbour by overshooting its own wall.
            const home = this.homeOf(bh);

            bh.x += bh.vx * dt;
            bh.y += bh.vy * dt;

            // The rim of the disc is the edge of the world. Slide along it
            // rather than bouncing, so hugging the rim stays controllable.
            const held = clampToDisc(home, bh.x, bh.y, home.radius - bh.radius);
            bh.x = held.x;
            bh.y = held.y;
        }


        // Wormhole Teleportation. Bots stay home: they are the local fauna, and
        // letting them drift through gateways slowly empties whole galaxies.
        for (const bh of bhs) {
            if (bh.isBot) continue;
            if (bh.wormholeCooldown > 0) {
                bh.wormholeCooldown -= dt;
                continue;
            }
            
            for (const wh of wormholes) {
                const dist = Math.hypot(bh.x - wh.x, bh.y - wh.y);
                if (dist < bh.radius + wh.radius) {
                    bh.x = wh.destX;
                    bh.y = wh.destY;
                    bh.vx = 0;
                    bh.vy = 0;
                    bh.wormholeCooldown = 3.0; // 3 seconds cooldown
                    break;
                }
            }
        }

        // 4. Stardust Micro-Motes: Ingestion
        //
        // Stardust is a STATIC layer: the full field is sent once when a client
        // joins and after that only what changes travels. That is what makes a
        // dense field affordable - motes therefore do not drift, and every
        // removal and every replacement must be published as a delta or clients
        // keep eating ghosts.
        for (let i = stardust.length - 1; i >= 0; i--) {
            const sd = stardust[i];

            let eatenBy = null;
            for (const bh of bhs) {
                // Capture reaches out to the vacuum radius. The old code only
                // swallowed motes on physical contact and relied on suction to
                // drag them in, which barely acts on a black hole moving at
                // full speed - a new player could fly an arm and eat nothing.
                if (Math.hypot(bh.x - sd.x, bh.y - sd.y) < this.captureRadius(bh) + sd.radius) {
                    eatenBy = bh;
                    break;
                }
            }

            if (eatenBy) {
                eatenBy.mass += sd.mass;
                stardust.splice(i, 1);
                this.game.pushStaticDelta("stardust", { id: sd.id, remove: true });
                const fresh = createStardust(this.game, this.homeOf(sd));
                this.game.pushStaticDelta("stardust", fresh);
            }
        }

        // 5. Asteroids: Tumble, Drift & Tactical Tidal Disruption (Virus Mechanics)
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const ast = asteroids[i];
            const home = this.homeOf(ast);
            ast.angle += ast.rotSpeed * dt;
            ast.x += ast.vx * dt;
            ast.y += ast.vy * dt;

            // Bounce off the rim of the host galaxy
            this.containInDisc(home, ast, ast.radius);

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

                        // Spawn fragmented stardust motes around collision site.
                        // Respects the same population cap as pulsar waves, or a
                        // long match slowly silts the universe up with debris.
                        const fragmentCount = stardust.length < this.stardustCap ? 6 : 0;
                        for (let f = 0; f < fragmentCount; f++) {
                            const fAng = (Math.PI * 2 / fragmentCount) * f + Math.random() * 0.5;
                            const fDist = ast.radius * 1.3;
                            this.game.pushStaticDelta("stardust", createStardust(this.game, home, {
                                x: ast.x + Math.cos(fAng) * fDist,
                                y: ast.y + Math.sin(fAng) * fDist
                            }));
                        }
                        break;
                    }
                }
            }

            if (destroyed) {
                asteroids.splice(i, 1);
                createAsteroid(this.game, home);
            }
        }

        // 6. Pulsars: Slingshot Beams, Feeding Wave Ejection & Core Hazard
        for (const psr of pulsars) {
            psr.beamAngle += psr.spinSpeed * dt;
            if (psr.beamAngle > Math.PI * 2) psr.beamAngle -= Math.PI * 2;
            if (psr.beamAngle < 0) psr.beamAngle += Math.PI * 2;

            // Pulsars are a static layer: they never move, so only the rotating
            // beam goes on the wire - one number instead of the whole record.
            this.game.pushStaticDelta("pulsars", {
                id: psr.id,
                beamAngle: Math.round(psr.beamAngle * 1000) / 1000
            });

            psr.pulseTimer += dt;
            if (psr.pulseTimer >= psr.pulseInterval) {
                psr.pulseTimer = 0;

                // PULSE WAVE: Eject a burst of glowing stardust radiating outward!
                if (stardust.length < this.stardustCap) {
                    const burstCount = 4;
                    for (let b = 0; b < burstCount; b++) {
                        const bAng = (Math.PI * 2 / burstCount) * b + Math.random() * 0.4;
                        const sd = createStardust(this.game, this.homeOf(psr), {
                            x: psr.x + Math.cos(bAng) * (psr.radius + 15),
                            y: psr.y + Math.sin(bAng) * (psr.radius + 15)
                        });
                        this.game.pushStaticDelta("stardust", sd);
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

        // 7. Planets: gravity from a nearby black hole, and ingestion.
        //
        // Planets are a STATIC layer. Only the few inside some black hole's pull
        // are integrated and published; the rest sit still and cost nothing at
        // all. What they used to do instead was drift on their spawn velocity -
        // 598 of 600 wandering at 4 u/s past nobody, for 77% of the tick
        // payload. A planet falling into a black hole is worth paying for;
        // aimless drift is not.
        for (let i = planets.length - 1; i >= 0; i--) {
            const p = planets[i];
            const home = this.homeOf(p);
            let ax = 0, ay = 0;
            let eatenBy = null;
            let pulled = false;

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
                    pulled = true;
                    const effectiveMass = Math.min(300, bh.mass);
                    const force = (this.G * effectiveMass) / (distSq + 160);
                    ax += (dx / dist) * force;
                    ay += (dy / dist) * force;
                }
            }

            if (eatenBy) {
                eatenBy.mass += p.mass;
                planets.splice(i, 1);
                this.game.pushStaticDelta("planets", { id: p.id, remove: true });
                this.game.pushStaticDelta("planets", createPlanet(this.game, home));
                continue;
            }

            // At rest and unpulled: nothing to simulate, nothing to send.
            const speed = Math.hypot(p.vx, p.vy);
            if (!pulled && speed < PLANET_REST_SPEED) {
                if (speed > 0) { p.vx = 0; p.vy = 0; }
                continue;
            }

            p.vx += ax * dt;
            p.vy += ay * dt;
            // Once out of reach, coast to a stop rather than drifting forever.
            if (!pulled) {
                p.vx *= PLANET_DAMPING;
                p.vy *= PLANET_DAMPING;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            this.containInDisc(home, p, p.radius);
            this.game.pushStaticDelta("planets", p);
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
                        galaxy: this.homeOf(bh)
                    });
                }
            }
        }
    }
}

module.exports = { SpacePhysicsSystem };
