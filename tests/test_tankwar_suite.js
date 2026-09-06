const assert = require("assert");
const { Game } = require("../engine");
const TankWarCartridge = require("../games/TankWar");
const { createTank } = require("../games/TankWar/server/entities/Tank.js");
const { createObstacle } = require("../games/TankWar/server/entities/Obstacle.js");
const { createBullet } = require("../games/TankWar/server/entities/Bullet.js");

console.log("=================================================");
console.log("=== RUNNING TANKWAR CARTRIDGE TEST SUITE ========");
console.log("=================================================\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✅ PASS: ${name}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${name}`);
        console.error(`     Error: ${err.message}`);
        failed++;
    }
}

// -------------------------------------------------------------
// TEST 1: TankWar Bootstrap & World Population
// -------------------------------------------------------------
test("TankWar cartridge initializes arena (14 obstacles, 6 bots, entity layers)", () => {
    const game = new Game(TankWarCartridge.config);
    const cartridge = new TankWarCartridge(game);
    cartridge.init();

    assert.strictEqual(game.entities["obstacles"].length, 14, "Should spawn 14 obstacles");
    assert.strictEqual(game.entities["players"].length, 6, "Should spawn 6 bots");
    assert(Array.isArray(game.entities["bullets"]), "Bullets collection must be initialized");
    assert.strictEqual(game.config.canvas.width, 1600, "Arena width must be 1600");
    assert.strictEqual(game.config.canvas.height, 1200, "Arena height must be 1200");
});

// -------------------------------------------------------------
// TEST 2: Tank Firing Mechanics & Recoil
// -------------------------------------------------------------
test("Tank firing consumes ammo, spawns bullet, and applies recoil", () => {
    const game = new Game(TankWarCartridge.config);
    const cartridge = new TankWarCartridge(game);
    cartridge.init();

    const playerTank = cartridge.onPlayerJoin("sock_test", { userName: "Commander" });
    assert(playerTank, "Player tank must be created");
    assert.strictEqual(playerTank.ammo, 10, "Initial ammo must be 10");

    playerTank.turretAngle = 0; // facing right (+X)
    const bulletData = playerTank.fire();

    assert(bulletData, "Firing with ammo must return bullet parameters");
    assert.strictEqual(playerTank.ammo, 9, "Ammo must decrement to 9");
    assert(playerTank.abilities.velocity.velocity.x < 0, "Tank must receive backwards recoil (-X)");

    // Spawn bullet into game
    const bullet = createBullet(game, bulletData);
    assert.strictEqual(game.entities["bullets"].length, 1, "Bullet must be registered");
    assert(bullet.abilities.velocity.velocity.x > 500, "Bullet velocity must exceed 500 px/s forward");
});

// -------------------------------------------------------------
// TEST 3: Bullet Combat & Damage Application
// -------------------------------------------------------------
test("Bullet collision deals 25 damage to enemy tank and applies impulse", () => {
    const game = new Game(TankWarCartridge.config);
    const cartridge = new TankWarCartridge(game);
    cartridge.init();

    const shooter = createTank(game, { name: "Shooter", x: 100, y: 100 });
    const target = createTank(game, { name: "Target", x: 130, y: 100 });

    const initialHp = target.abilities.health.health;
    assert.strictEqual(initialHp, 100, "Target tank starts with 100 HP");

    // Create bullet fired from shooter towards target
    const bullet = createBullet(game, {
        x: 125,
        y: 100,
        angle: 0,
        speed: 680,
        damage: 25,
        ownerId: shooter.id,
        ownerName: shooter.name
    });

    // Run combat system update
    cartridge.combatSystem.update(0.016);

    assert.strictEqual(target.abilities.health.health, 75, "Target must take 25 damage (100 -> 75)");
    assert(target.abilities.velocity.velocity.x > 0, "Target must be pushed forward by bullet impact");
    assert.strictEqual(game.entities["bullets"].length, 0, "Bullet must be consumed on hit");
});

// -------------------------------------------------------------
// TEST 4: Obstacle Destruction & Score Rewards
// -------------------------------------------------------------
test("Bullets damage and destroy obstacles, rewarding score on kills", () => {
    const game = new Game(TankWarCartridge.config);
    const cartridge = new TankWarCartridge(game);
    cartridge.init();

    // Clear obstacles to isolate test
    game.entities["obstacles"] = [];
    const obs = createObstacle(game, { x: 500, y: 500, radius: 28, health: 50 });

    // Bullet 1: 50 -> 25 HP
    createBullet(game, {
        x: 495,
        y: 500,
        angle: 0,
        speed: 600,
        damage: 25,
        ownerId: "some_tank"
    });
    cartridge.combatSystem.update(0.016);
    assert.strictEqual(obs.abilities.health.health, 25, "Obstacle must have 25 HP after first hit");
    assert.strictEqual(game.entities["obstacles"].length, 1, "Obstacle must still exist");

    // Bullet 2: 25 -> 0 HP (destruction)
    createBullet(game, {
        x: 495,
        y: 500,
        angle: 0,
        speed: 600,
        damage: 25,
        ownerId: "some_tank"
    });
    cartridge.combatSystem.update(0.016);
    assert.strictEqual(game.entities["obstacles"].length, 0, "Obstacle must be removed upon 0 HP destruction");
});

console.log("\n=================================================");
console.log(`=== SUMMARY: ${passed} PASSED | ${failed} FAILED ===`);
console.log("=================================================\n");

if (failed > 0) process.exit(1);
