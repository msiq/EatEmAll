const assert = require("assert");
const { Game } = require("../engine");
const CosmicSingularity3DCartridge = require("../games/CosmicSingularity3D");
const { createBlackHole, findSafeSpawn } = require("../games/CosmicSingularity3D/server/entities/BlackHole.js");
const { createPlanet } = require("../games/CosmicSingularity3D/server/entities/Planet.js");
const { createStardust } = require("../games/CosmicSingularity3D/server/entities/Stardust.js");
const { createAsteroid } = require("../games/CosmicSingularity3D/server/entities/Asteroid.js");
const { createPulsar } = require("../games/CosmicSingularity3D/server/entities/Pulsar.js");
const { getGalaxies, galaxyAt, spiralPoint, armSpread } = require("../games/CosmicSingularity3D/server/galaxies.js");

const CONFIG = CosmicSingularity3DCartridge.config;
const GALAXIES = getGalaxies(CONFIG);
const HOME = GALAXIES[0];

// Every entity must sit inside the disc that owns it - never adrift in the
// void between galaxies.
function assertInsideAGalaxy(entities, label) {
    for (const e of entities) {
        const g = galaxyAt(GALAXIES, e.x, e.y);
        const d = Math.hypot(e.x - g.x, e.y - g.y);
        assert(
            d <= g.radius + 1,
            label + " " + e.id + " escaped " + g.name + ": " + Math.round(d) + " from centre, radius " + g.radius
        );
    }
}

/** Distance from a point to the nearest spiral arm of galaxy g. */
function distanceToNearestArm(g, x, y) {
    let best = Infinity;
    for (let arm = 0; arm < g.arms; arm++) {
        for (let t = 0; t <= 1.0; t += 0.002) {
            const p = spiralPoint(g, t, arm);
            const d = Math.hypot(x - p.x, y - p.y);
            if (d < best) best = d;
        }
    }
    return best;
}

console.log("=================================================");
console.log("=== RUNNING COSMIC SINGULARITY 3D TEST SUITE ====");
console.log("=================================================\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log("  PASS: " + name);
        passed++;
    } catch (err) {
        console.error("  FAIL: " + name);
        console.error("     Error: " + err.message);
        failed++;
    }
}

// TEST 1: Cartridge Bootstrap & World Population
test("CosmicSingularity3D cartridge registers 3D entity collections and populates galaxy", () => {
    const game = new Game(CosmicSingularity3DCartridge.config);
    const cartridge = new CosmicSingularity3DCartridge(game);
    cartridge.init();

    assert(Array.isArray(game.entities["blackholes"]), "BlackHoles collection must exist");
    assert(Array.isArray(game.entities["planets"]), "Planets collection must exist");
    assert(Array.isArray(game.entities["stardust"]), "Stardust collection must exist");
    assert(Array.isArray(game.entities["asteroids"]), "Asteroids collection must exist");
    assert(Array.isArray(game.entities["pulsars"]), "Pulsars collection must exist");

    assert(Array.isArray(game.entities["wormholes"]), "Wormholes collection must exist");

    // Config counts are per galaxy; the universe holds one set per galaxy.
    const n = GALAXIES.length;
    assert.strictEqual(game.entities["blackholes"].length, CONFIG.botCount * n, "Should spawn botCount bots per galaxy");
    assert.strictEqual(game.entities["planets"].length, CONFIG.planetCount * n, "Should spawn planetCount planets per galaxy");
    assert.strictEqual(game.entities["stardust"].length, CONFIG.stardustCount * n, "Should spawn stardustCount motes per galaxy");
    assert.strictEqual(game.entities["asteroids"].length, CONFIG.asteroidCount * n, "Should spawn asteroidCount asteroids per galaxy");
    assert.strictEqual(game.entities["pulsars"].length, CONFIG.pulsarCount * n, "Should spawn pulsarCount pulsars per galaxy");
    assert.strictEqual(game.entities["wormholes"].length, n, "Each galaxy needs one outbound gateway");
});

// TEST 1b: Nothing is stranded in the void between galaxies
test("Every celestial body spawns inside a galaxy, never in intergalactic void", () => {
    const game = new Game(CONFIG);
    const cartridge = new CosmicSingularity3DCartridge(game);
    cartridge.init();

    ["blackholes", "planets", "stardust", "asteroids", "pulsars"].forEach(type => {
        assertInsideAGalaxy(game.entities[type], type);
    });

    // Each galaxy must actually be populated - not just galaxy zero.
    for (const g of GALAXIES) {
        const localDust = game.entities["stardust"].filter(sd => galaxyAt(GALAXIES, sd.x, sd.y) === g);
        assert.strictEqual(localDust.length, CONFIG.stardustCount, g.name + " must hold its own stardust");

        const localRocks = game.entities["asteroids"].filter(a => galaxyAt(GALAXIES, a.x, a.y) === g);
        assert.strictEqual(localRocks.length, CONFIG.asteroidCount, g.name + " must hold its own asteroids");

        const localPulsars = game.entities["pulsars"].filter(ps => galaxyAt(GALAXIES, ps.x, ps.y) === g);
        assert.strictEqual(localPulsars.length, CONFIG.pulsarCount, g.name + " must hold its own pulsars");
    }
});

// TEST 1c: Consumed bodies replenish in the galaxy they were eaten in
test("Eaten stardust and planets respawn inside the galaxy that consumed them", () => {
    const game = new Game(CONFIG);
    const cartridge = new CosmicSingularity3DCartridge(game);
    cartridge.init();

    const far = GALAXIES[GALAXIES.length - 1];
    const bh = game.entities["blackholes"][0];
    bh.x = far.x;
    bh.y = far.y;
    bh.radius = 60;
    bh.spawnImmunity = 0;

    const dustBefore = game.entities["stardust"].length;
    createStardust(game, far, { x: bh.x + 5, y: bh.y + 5 });
    cartridge.physicsSystem.update(0.033);

    assert.strictEqual(game.entities["stardust"].length, dustBefore + 1, "Consumed mote must be replaced");
    assertInsideAGalaxy(game.entities["stardust"], "stardust");
});

// TEST 1d: Gateways move a black hole between galaxies
test("Wormhole gateways carry a black hole into the next galaxy and contain it there", () => {
    const game = new Game(CONFIG);
    const cartridge = new CosmicSingularity3DCartridge(game);
    cartridge.init();

    const gate = game.entities["wormholes"][0];
    const destGalaxy = galaxyAt(GALAXIES, gate.destX, gate.destY);
    assert(destGalaxy !== galaxyAt(GALAXIES, gate.x, gate.y), "A gateway must lead to a different galaxy");

    // Only players ride the gateways - bots are pinned to their home galaxy.
    const bh = cartridge.onPlayerJoin("sock_traveller", { userName: "Traveller" });
    bh.x = gate.x;
    bh.y = gate.y;
    bh.wormholeCooldown = 0;
    bh.isThrusting = false;
    bh.spawnImmunity = 99;

    cartridge.physicsSystem.update(0.033);

    assert.strictEqual(galaxyAt(GALAXIES, bh.x, bh.y), destGalaxy, "Black hole must arrive in the destination galaxy");
    assert(bh.wormholeCooldown > 0, "Traveller must be on cooldown to stop instant re-entry");

    // And it must now be contained by its NEW galaxy, not dragged back.
    for (let i = 0; i < 30; i++) cartridge.physicsSystem.update(0.033);
    assert.strictEqual(galaxyAt(GALAXIES, bh.x, bh.y), destGalaxy, "Black hole must stay in its new galaxy");

    // Bots must NOT travel, or galaxies slowly drain of opponents.
    const bot = game.entities["blackholes"].find(b => b.isBot);
    const botHome = galaxyAt(GALAXIES, bot.x, bot.y);
    const botGate = game.entities["wormholes"].find(w => galaxyAt(GALAXIES, w.x, w.y) === botHome);
    bot.x = botGate.x;
    bot.y = botGate.y;
    bot.wormholeCooldown = 0;
    cartridge.physicsSystem.update(0.033);
    assert.strictEqual(galaxyAt(GALAXIES, bot.x, bot.y), botHome, "Bots must stay in their home galaxy");
});

// TEST 2: Safe Spawn Protection & Immunity in 3D
test("Safe spawn algorithm protects players in 3D arena with 5.0s quantum shield", () => {
    const game = new Game(CosmicSingularity3DCartridge.config);
    const cartridge = new CosmicSingularity3DCartridge(game);
    cartridge.init();

    const spawnPos = findSafeSpawn(game, HOME);
    const spawnDist = Math.hypot(spawnPos.x - HOME.x, spawnPos.y - HOME.y);
    assert(spawnDist <= HOME.radius, "Spawn must land inside the galaxy disc");

    const joined = cartridge.onPlayerJoin("sock_scout", { userName: "Scout" });
    assertInsideAGalaxy([joined], "player");

    const player = cartridge.onPlayerJoin("sock_nova_3d", { userName: "CosmoPilot3D" });
    assert.strictEqual(player.spawnImmunity, 5.0, "New player must receive 5.0s quantum spawn shield");
});

// TEST 3: Stardust Gravity Suction in 3D
test("3D Black holes attract and consume nearby stardust, triggering immediate respawn", () => {
    const game = new Game(CosmicSingularity3DCartridge.config);
    const cartridge = new CosmicSingularity3DCartridge(game);
    cartridge.init();

    game.entities["asteroids"] = [];
    const bh = game.entities["blackholes"][0];
    bh.x = 500;
    bh.y = 500;
    bh.radius = 20;
    const initialMass = bh.mass;

    const sd = createStardust(game, game.config.canvas, { x: 505, y: 505 });
    const sdMass = sd.mass;
    const totalCount = game.entities["stardust"].length;

    cartridge.physicsSystem.update(0.033);

    assert(bh.mass >= initialMass + sdMass - 0.05, "Black hole mass must increase from stardust");
    assert.strictEqual(game.entities["stardust"].length, totalCount, "Consumed stardust must immediately replenish");
});

// TEST 4: Asteroids 3D Tactical Disruption
test("Asteroids provide safe cover for small black holes and disrupt giant titans", () => {
    const game = new Game(CosmicSingularity3DCartridge.config);
    const cartridge = new CosmicSingularity3DCartridge(game);
    cartridge.init();

    game.entities["asteroids"] = [];
    const ast = createAsteroid(game, game.config.canvas, { x: 1000, y: 1000 });
    ast.mass = 100;
    ast.radius = 30;

    const smallBH = game.entities["blackholes"][0];
    smallBH.mass = 50;
    smallBH.radius = 15;
    smallBH.x = 1010;
    smallBH.y = 1000;

    cartridge.physicsSystem.update(0.033);
    assert.strictEqual(game.entities["asteroids"].length, 1, "Asteroid must NOT be destroyed by small black hole");

    const titanBH = game.entities["blackholes"][1];
    titanBH.mass = 800;
    titanBH.radius = 50;
    titanBH.x = 1010;
    titanBH.y = 1000;

    cartridge.physicsSystem.update(0.033);
    assert(titanBH.mass < 800, "Titan must shed mass upon smashing asteroid");
    assert(Math.hypot(titanBH.vx, titanBH.vy) > 100, "Titan must receive explosive kinetic recoil");
});

// TEST 5: Pulsar Slingshot in 3D
test("Pulsars impart relativistic slingshot boost and pulse waves disperse stardust in 3D", () => {
    const game = new Game(CosmicSingularity3DCartridge.config);
    const cartridge = new CosmicSingularity3DCartridge(game);
    cartridge.init();

    const psr = game.entities["pulsars"][0];
    psr.x = 2000;
    psr.y = 2000;
    psr.beamAngle = 0;

    const bh = game.entities["blackholes"][0];
    bh.x = 2150;
    bh.y = 2000;
    bh.mass = 100;
    bh.radius = 20;
    bh.beamHitCooldown = 0;
    bh.boostTimer = 0;

    cartridge.physicsSystem.update(0.033);

    assert(bh.boostTimer > 1.0, "Black hole must receive hyper-boost timer");
    assert(bh.vx >= 380, "Black hole must receive +X slingshot catapult velocity");

    psr.pulseTimer = psr.pulseInterval;
    const prevCount = game.entities["stardust"].length;
    cartridge.physicsSystem.update(0.033);
    assert(game.entities["stardust"].length >= prevCount + 3, "Pulsar pulse wave must disperse stardust in 3D");
});

// TEST 6: Arm-aligned spawning - the loot follows the drawn spiral
test("Stardust and planets are scattered along the spiral arms, not uniformly", () => {
    const game = new Game(CONFIG);
    const cartridge = new CosmicSingularity3DCartridge(game);
    cartridge.init();

    const g = GALAXIES[0];
    const local = game.entities["stardust"].filter(sd => galaxyAt(GALAXIES, sd.x, sd.y) === g);
    assert(local.length > 50, "Need a decent sample to judge the distribution");

    // Mean distance to the nearest arm, spawned vs a uniform scatter over the
    // same disc. Arm spawning must be decisively tighter or the spiral
    // structure is invisible in where the loot actually sits.
    const mean = xs => xs.reduce((a, b) => a + b, 0) / xs.length;

    const spawnedMean = mean(local.map(sd => distanceToNearestArm(g, sd.x, sd.y)));

    const uniform = [];
    for (let i = 0; i < 400; i++) {
        const r = Math.sqrt(Math.random()) * g.radius;
        const th = Math.random() * Math.PI * 2;
        uniform.push(distanceToNearestArm(g, g.x + Math.cos(th) * r, g.y + Math.sin(th) * r));
    }
    const uniformMean = mean(uniform);

    assert(spawnedMean < uniformMean * 0.65,
        "Stardust must cluster on the arms: mean distance " + Math.round(spawnedMean) +
        " vs uniform " + Math.round(uniformMean) + " (need < " + Math.round(uniformMean * 0.65) + ")");

    // And nothing should be stranded far off any arm.
    const strayed = local.filter(sd => distanceToNearestArm(g, sd.x, sd.y) > armSpread(g, 1.0) * 2.5);
    assert(strayed.length / local.length < 0.05,
        "Under 5% of stardust may stray well off-arm, got " + Math.round(100 * strayed.length / local.length) + "%");
});

// TEST 7: The disc rim replaces the old square walls
test("The galaxy rim contains bodies, and the spiral formula is pinned", () => {
    const game = new Game(CONFIG);
    const cartridge = new CosmicSingularity3DCartridge(game);
    cartridge.init();

    const g = GALAXIES[0];
    const bh = cartridge.onPlayerJoin("sock_rim", { userName: "Rimrunner" });
    bh.spawnImmunity = 99;

    // Fling it hard at the rim and let the physics hold it. Start off-centre:
    // the galactic core is the gateway now, and standing on it teleports you.
    bh.x = g.x + g.radius * 0.5;
    bh.y = g.y;
    bh.vx = 100000;
    bh.vy = 100000;
    for (let i = 0; i < 60; i++) cartridge.physicsSystem.update(0.033);

    const d = Math.hypot(bh.x - g.x, bh.y - g.y);
    assert(d <= g.radius, "Rim must hold the player inside the disc, got " + Math.round(d));

    // Pin the shared arm formula: visuals.js paints against these exact values.
    const p0 = spiralPoint({ x: 0, y: 0, radius: 1000, arms: 2, twist: 2.6 }, 0.5, 0);
    assert(Math.abs(p0.x - (-332.1)) < 1.0 && Math.abs(p0.y - (-457.1)) < 1.0,
        "Spiral formula changed - update the generator in visuals.js to match: got " +
        p0.x.toFixed(1) + ", " + p0.y.toFixed(1));
});

console.log("\n=================================================");
console.log("=== SUMMARY: " + passed + " PASSED | " + failed + " FAILED ===");
console.log("=================================================");

if (failed > 0) process.exit(1);
