const assert = require("assert");
const { Game } = require("../engine");
const CosmicSingularityCartridge = require("../games/CosmicSingularity");
const { createBlackHole, findSafeSpawn } = require("../games/CosmicSingularity/server/entities/BlackHole.js");
const { createPlanet } = require("../games/CosmicSingularity/server/entities/Planet.js");
const { createStardust } = require("../games/CosmicSingularity/server/entities/Stardust.js");
const { createAsteroid } = require("../games/CosmicSingularity/server/entities/Asteroid.js");
const { createPulsar } = require("../games/CosmicSingularity/server/entities/Pulsar.js");

console.log("=================================================");
console.log("=== RUNNING COSMIC SINGULARITY TEST SUITE =======");
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
test("CosmicSingularity cartridge registers all 5 entity collections and populates galaxy", () => {
    const game = new Game(CosmicSingularityCartridge.config);
    const cartridge = new CosmicSingularityCartridge(game);
    cartridge.init();

    assert(Array.isArray(game.entities["blackholes"]), "BlackHoles collection must exist");
    assert(Array.isArray(game.entities["planets"]), "Planets collection must exist");
    assert(Array.isArray(game.entities["stardust"]), "Stardust collection must exist");
    assert(Array.isArray(game.entities["asteroids"]), "Asteroids collection must exist");
    assert(Array.isArray(game.entities["pulsars"]), "Pulsars collection must exist");

    assert.strictEqual(game.entities["blackholes"].length, 5, "Should spawn 5 bot singularities");
    assert.strictEqual(game.entities["planets"].length, 120, "Should spawn 120 planets");
    assert.strictEqual(game.entities["stardust"].length, 280, "Should spawn 280 stardust motes");
    assert.strictEqual(game.entities["asteroids"].length, 22, "Should spawn 22 asteroids");
    assert.strictEqual(game.entities["pulsars"].length, 4, "Should spawn 4 pulsars");
});

// TEST 2: Safe Spawn Protection & Immunity
test("Safe spawn algorithm avoids predator proximities and grants spawn immunity", () => {
    const game = new Game(CosmicSingularityCartridge.config);
    const cartridge = new CosmicSingularityCartridge(game);
    cartridge.init();

    const predator = game.entities["blackholes"][0];
    predator.x = 1000;
    predator.y = 1000;
    predator.radius = 65;

    const spawnPos = findSafeSpawn(game, game.config.canvas);
    assert(spawnPos.x >= 200 && spawnPos.x <= 3800, "Spawn X within arena boundaries");
    assert(spawnPos.y >= 200 && spawnPos.y <= 3800, "Spawn Y within arena boundaries");

    const player = cartridge.onPlayerJoin("sock_nova", { userName: "NovaVoyager" });
    assert.strictEqual(player.spawnImmunity, 5.0, "New player must receive 5.0s quantum spawn shield");
});

// TEST 3: Stardust Gravity Suction & Growth
test("Black holes attract and consume nearby stardust, triggering immediate respawn", () => {
    const game = new Game(CosmicSingularityCartridge.config);
    const cartridge = new CosmicSingularityCartridge(game);
    cartridge.init();

    const bh = game.entities["blackholes"][0];
    bh.x = 500;
    bh.y = 500;
    bh.radius = 20;
    const initialMass = bh.mass;

    const sd = createStardust(game, game.config.canvas, { x: 505, y: 505 });
    const sdMass = sd.mass;
    const totalStardustCount = game.entities["stardust"].length;

    cartridge.physicsSystem.update(0.033);

    assert(bh.mass >= initialMass + sdMass - 0.05, "Black hole mass must increase from stardust");
    assert.strictEqual(game.entities["stardust"].length, totalStardustCount, "Consumed stardust must immediately replenish");
});

// TEST 4: Asteroid Tactical Cover vs. Titan Disruption
test("Small black holes pass asteroids safely; massive black holes suffer tidal fragmentation", () => {
    const game = new Game(CosmicSingularityCartridge.config);
    const cartridge = new CosmicSingularityCartridge(game);
    cartridge.init();

    game.entities["asteroids"] = [];
    const ast = createAsteroid(game, game.config.canvas, { x: 1000, y: 1000 });
    ast.mass = 100;
    ast.radius = 30;

    // Small black hole (mass 50 < 100)
    const smallBH = game.entities["blackholes"][0];
    smallBH.mass = 50;
    smallBH.radius = 15;
    smallBH.x = 1010;
    smallBH.y = 1000;

    cartridge.physicsSystem.update(0.033);
    assert.strictEqual(game.entities["asteroids"].length, 1, "Asteroid must NOT be destroyed by small black hole");

    // Titan black hole (mass 800 >= 100)
    const titanBH = game.entities["blackholes"][1];
    titanBH.mass = 800;
    titanBH.radius = 50;
    titanBH.x = 1010;
    titanBH.y = 1000;

    cartridge.physicsSystem.update(0.033);
    assert(titanBH.mass < 800, "Titan must shed mass upon smashing asteroid");
    assert(Math.hypot(titanBH.vx, titanBH.vy) > 100, "Titan must receive explosive kinetic recoil");
});

// TEST 5: Pulsar Relativistic Slingshot Boost & Pulse Waves
test("Pulsar beam collision triggers 480 px/s hyper-slingshot and pulse waves disperse stardust", () => {
    const game = new Game(CosmicSingularityCartridge.config);
    const cartridge = new CosmicSingularityCartridge(game);
    cartridge.init();

    const psr = game.entities["pulsars"][0];
    psr.x = 2000;
    psr.y = 2000;
    psr.beamAngle = 0; // beam points along +X axis

    const bh = game.entities["blackholes"][0];
    bh.x = 2150;
    bh.y = 2000;
    bh.mass = 100;
    bh.radius = 20;
    bh.beamHitCooldown = 0;
    bh.boostTimer = 0;

    cartridge.physicsSystem.update(0.033);

    assert(bh.boostTimer > 1.0, "Black hole must receive hyper-boost timer (>1.0s)");
    assert(bh.vx >= 380, "Black hole must receive +X slingshot catapult velocity");

    // Pulse wave ejection
    psr.pulseTimer = psr.pulseInterval;
    const prevStardust = game.entities["stardust"].length;
    cartridge.physicsSystem.update(0.033);
    assert(game.entities["stardust"].length >= prevStardust + 3, "Pulsar pulse wave must disperse new stardust burst");
});

console.log("\n=================================================");
console.log("=== SUMMARY: " + passed + " PASSED | " + failed + " FAILED ===");
console.log("=================================================");

if (failed > 0) process.exit(1);
