const assert = require('assert');
const path = require('path');
const { Game } = require('../engine');
const EatEmAllCartridge = require('../games/EatEmAll');
const { EatingSystem } = require('../games/EatEmAll/server/systems/EatingSystem.js');
const { BotSteeringSystem } = require('../games/EatEmAll/server/systems/BotSteeringSystem.js');
const { createDot } = require('../games/EatEmAll/server/entities/Dot.js');
const { createPlayer } = require('../games/EatEmAll/server/entities/Player.js');

console.log("=================================================");
console.log("=== RUNNING EATEMALL CARTRIDGE TEST SUITE =======");
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
// TEST 1: Cartridge Bootstrap & World Population
// -------------------------------------------------------------
test("Cartridge initializes arena entities (1000 dots, 10 bots, 18 viruses)", () => {
    const game = new Game(EatEmAllCartridge.config);
    const cartridge = new EatEmAllCartridge(game);
    cartridge.init();

    assert.strictEqual(game.entities['dots'].length, 1000, "Should spawn 1,000 dots");
    assert.strictEqual(game.entities['players'].length, 10, "Should spawn 10 bots");
    assert.strictEqual(game.entities['viruses'].length, 18, "Should spawn 18 viruses");
    assert(game.staticLayers.has('dots'), "Cartridge should register 'dots' as a static layer");
    assert.strictEqual(game.gameFSM.getStateName(), 'lobby', "FSM should begin in lobby state");
});

// -------------------------------------------------------------
// TEST 2: Eating System & Impulse Filtering
// -------------------------------------------------------------
test("EatingSystem allows predation but filters physical impulse bounce", () => {
    const game = new Game(EatEmAllCartridge.config);
    const eatingSystem = new EatingSystem(game);

    // Predator (radius 35) vs Prey (radius 20)
    const predator = {
        name: 'predator',
        type: 'players',
        abilities: { body: { shape: { radius: 35 } } }
    };
    const prey = {
        name: 'prey',
        type: 'players',
        abilities: { body: { shape: { radius: 20 } } }
    };

    assert(eatingSystem.isEating(predator, prey), "Predator should eat prey (35 > 20 * 1.15)");
    assert.strictEqual(eatingSystem.filterImpulse(predator, prey), false, "Impulse should be bypassed for eating");

    // Equal sized players (radius 25 vs radius 25)
    const p1 = {
        name: 'p1',
        type: 'players',
        abilities: { body: { shape: { radius: 25 } } }
    };
    const p2 = {
        name: 'p2',
        type: 'players',
        abilities: { body: { shape: { radius: 25 } } }
    };

    assert.strictEqual(eatingSystem.isEating(p1, p2), false, "Similar players cannot eat each other");
    assert.strictEqual(eatingSystem.filterImpulse(p1, p2), true, "Similar players must physical bounce");
});

test("Eating a food dot applies area-based growth (sqrt(r^2 + 6.0)) and +2 score", () => {
    const game = new Game(EatEmAllCartridge.config);
    const eatingSystem = new EatingSystem(game);

    const player = {
        id: 'test_player',
        type: 'players',
        has: (name) => ['body', 'score', 'experience', 'health'].includes(name),
        abilities: {
            body: { shape: { radius: 20.0 } },
            score: { score: 0, add: function(n) { this.score += n; } },
            experience: { xp: 0, add: function(n) { this.xp += n; } },
            health: { health: 100 }
        }
    };

    const dot = {
        id: 'dot_1',
        name: 'dot',
        type: 'dots',
        abilities: {
            position: { pos: { x: 100, y: 100 } },
            body: { shape: { radius: 3.5 }, color: '#00bcd4' }
        }
    };

    eatingSystem.handleCollision(player, dot);

    // Score must be +2
    assert.strictEqual(player.abilities.score.score, 2, "Eating a dot should add 2 score points");

    // Radius must grow via area conservation: sqrt(20^2 + 6.0) = sqrt(406) ~= 20.1494
    const expectedRadius = Math.sqrt(20 * 20 + 6.0);
    assert(Math.abs(player.abilities.body.shape.radius - expectedRadius) < 1e-4, "Radius must grow via area formula");
});

// -------------------------------------------------------------
// TEST 3: Bot Steering & Inertia
// -------------------------------------------------------------
test("BotSteeringSystem updates bots with smooth angular momentum", () => {
    const game = new Game(EatEmAllCartridge.config);
    const cartridge = new EatEmAllCartridge(game);
    cartridge.init();

    const bot = game.entities['players'][0];
    const initialVelX = bot.abilities.velocity.velocity.x;

    // Run 1 tick of steering system
    cartridge.botSteeringSystem.update(0.033);

    const newVelX = bot.abilities.velocity.velocity.x;
    // Velocity must exist and not be NaN
    assert(!isNaN(newVelX), "Bot velocity must not be NaN");
    assert(bot.ai, "Bot must have an ai steering context");
});

console.log("\n=================================================");
console.log(`=== SUMMARY: ${passed} PASSED | ${failed} FAILED ===`);
console.log("=================================================\n");

if (failed > 0) process.exit(1);
