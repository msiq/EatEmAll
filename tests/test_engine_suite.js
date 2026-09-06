const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log("=================================================");
console.log("=== RUNNING ENGINE DECOUPLING & PHYSICS TESTS ===");
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
// TEST 1: Decoupling Verification (No Game Leaks in Engine Core)
// -------------------------------------------------------------
test("Engine SubSystems.js should not contain hardcoded 'dot' or 'virus' entity checks", () => {
    const subSystemsCode = fs.readFileSync(path.join(__dirname, '../Server/SubSystems.js'), 'utf8');

    // Extract resolveCircleImpulse method
    const impulseMatch = subSystemsCode.match(/this\.resolveCircleImpulse\s*=\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\s*this\./);
    assert(impulseMatch, "Could not locate resolveCircleImpulse in SubSystems.js");

    const impulseBody = impulseMatch[1];
    assert(!impulseBody.includes('entityA.name === "dot"'), "Leaked dot check found in resolveCircleImpulse");
    assert(!impulseBody.includes('entityA.name === "virus"'), "Leaked virus check found in resolveCircleImpulse");
    assert(!impulseBody.includes('radA > radB * 1.15'), "Leaked eating predator rule found in resolveCircleImpulse");
});

test("Engine GameClass.js should use generic staticLayers rather than hardcoded dots", () => {
    const gameClassCode = fs.readFileSync(path.join(__dirname, '../Server/GameClass.js'), 'utf8');
    assert(gameClassCode.includes('this.staticLayers'), "GameClass.js missing staticLayers set");
    assert(!gameClassCode.includes("if (entityType === 'dots') return;"), "Hardcoded dots check still in doTick");
});

// -------------------------------------------------------------
// TEST 2: Newtonian Collision Impulse & Momentum Conservation
// -------------------------------------------------------------
test("Newtonian Impulse Solver preserves total linear momentum (m1*v1 + m2*v2)", () => {
    const Shapes = require('../Server/Shapes.js');
    const SubSystems = require('../Server/SubSystems.js');

    // Mock Game & Entities
    const mockGame = {
        config: { canvas: { width: 2000, height: 2000 } },
        abilities: { Aabb: function() { this.bounds = {}; } },
        addTickEvent: () => {}
    };

    const collisionSystem = SubSystems(mockGame).collision;

    // Entity 1: Moving right (mass = 100, radius = 20, v = [6, 0])
    const entity1 = {
        id: "p1",
        abilities: {
            position: { pos: new Shapes.Vect(100, 200) },
            velocity: { velocity: new Shapes.Vect(6, 0) },
            body: { shape: new Shapes.Circ(20) },
            mass: { mass: 100 },
            cor: { cor: 0.8 },
            collidable: { isTrigger: false, isStatic: false }
        },
        has: (name) => ["position", "velocity", "body", "mass", "cor", "collidable"].includes(name)
    };

    // Entity 2: Moving left (mass = 300, radius = 34.64, v = [-2, 0])
    const entity2 = {
        id: "p2",
        abilities: {
            position: { pos: new Shapes.Vect(130, 200) }, // Overlapping (dist = 30 < 20 + 34.64)
            velocity: { velocity: new Shapes.Vect(-2, 0) },
            body: { shape: new Shapes.Circ(34.64) },
            mass: { mass: 100 },
            cor: { cor: 0.8 },
            collidable: { isTrigger: false, isStatic: false }
        },
        has: (name) => ["position", "velocity", "body", "mass", "cor", "collidable"].includes(name)
    };

    // Compute pre-collision momentum
    const rad1 = entity1.abilities.body.shape.radius;
    const rad2 = entity2.abilities.body.shape.radius;
    const m1 = 100 * (rad1 / 20) * (rad1 / 20); // 100
    const m2 = 100 * (rad2 / 20) * (rad2 / 20); // 300

    const initialP_x = m1 * entity1.abilities.velocity.velocity.x + m2 * entity2.abilities.velocity.velocity.x;
    const initialP_y = m1 * entity1.abilities.velocity.velocity.y + m2 * entity2.abilities.velocity.velocity.y;

    // Run impulse solver
    collisionSystem.resolveCircleImpulse(entity1, entity2);

    // Compute post-collision momentum
    const finalP_x = m1 * entity1.abilities.velocity.velocity.x + m2 * entity2.abilities.velocity.velocity.x;
    const finalP_y = m1 * entity1.abilities.velocity.velocity.y + m2 * entity2.abilities.velocity.velocity.y;

    // Verify momentum conservation: initial P == final P
    assert(Math.abs(initialP_x - finalP_x) < 1e-4, `Momentum X not conserved: pre=${initialP_x}, post=${finalP_x}`);
    assert(Math.abs(initialP_y - finalP_y) < 1e-4, `Momentum Y not conserved: pre=${initialP_y}, post=${finalP_y}`);

    // Verify entities are separated
    const postDist = Math.hypot(
        entity2.abilities.position.pos.x - entity1.abilities.position.pos.x,
        entity2.abilities.position.pos.y - entity1.abilities.position.pos.y
    );
    assert(postDist > 30, `Entities should be separated: postDist=${postDist}`);
});

test("Trigger colliders should be completely skipped by physical impulse solver", () => {
    const Shapes = require('../Server/Shapes.js');
    const SubSystems = require('../Server/SubSystems.js');

    const mockGame = {
        config: { canvas: { width: 2000, height: 2000 } },
        abilities: { Aabb: function() {} }
    };
    const collisionSystem = SubSystems(mockGame).collision;

    const player = {
        abilities: {
            position: { pos: new Shapes.Vect(100, 100) },
            velocity: { velocity: new Shapes.Vect(5, 0) },
            body: { shape: new Shapes.Circ(20) },
            mass: { mass: 100 },
            collidable: { isTrigger: false, isStatic: false }
        },
        has: () => true
    };

    const triggerDot = {
        abilities: {
            position: { pos: new Shapes.Vect(105, 100) },
            velocity: { velocity: new Shapes.Vect(0, 0) },
            body: { shape: new Shapes.Circ(7) },
            mass: { mass: 10 },
            collidable: { isTrigger: true, isStatic: true } // Trigger!
        },
        has: () => true
    };

    collisionSystem.resolveCircleImpulse(player, triggerDot);

    // Player velocity must remain unchanged!
    assert.strictEqual(player.abilities.velocity.velocity.x, 5, "Player velocity should not be modified by trigger collider");
});

// -------------------------------------------------------------
// TEST 3: State Machines (GameStateMachine & PlayerStateMachine)
// -------------------------------------------------------------
test("GameStateMachine correctly manages transitions and state lifecycle", () => {
    const { BaseGameState, GameStateMachine } = require('../Server/GameState.js');

    const mockGame = {};
    const fsm = new GameStateMachine(mockGame);

    let lobbyEntered = false;
    let lobbyExited = false;
    let roundEntered = false;

    class MockLobby extends BaseGameState {
        constructor() { super('lobby'); }
        enter() { lobbyEntered = true; }
        exit() { lobbyExited = true; }
    }

    class MockRound extends BaseGameState {
        constructor() { super('round_active'); }
        enter() { roundEntered = true; }
    }

    fsm.registerState(new MockLobby());
    fsm.registerState(new MockRound());

    fsm.setState('lobby');
    assert.strictEqual(fsm.getStateName(), 'lobby');
    assert(lobbyEntered, "Lobby enter should be called");

    fsm.setState('round_active');
    assert.strictEqual(fsm.getStateName(), 'round_active');
    assert(lobbyExited, "Lobby exit should be called on transition");
    assert(roundEntered, "Round enter should be called on transition");
});

test("PlayerStateMachine correctly enforces spawn shield and expires to active", () => {
    const { BasePlayerState, PlayerStateMachine } = require('../Server/PlayerState.js');

    const mockPlayer = { id: "p1" };
    const fsm = new PlayerStateMachine(mockPlayer);

    class ShieldedState extends BasePlayerState {
        constructor() { super('shielded'); }
        update(player, dt) {
            if (fsm.getTimeInState() >= 50) { // 50ms for test
                fsm.setState('active');
            }
        }
    }

    class ActiveState extends BasePlayerState {
        constructor() { super('active'); }
    }

    fsm.registerState(new ShieldedState());
    fsm.registerState(new ActiveState());

    fsm.setState('shielded');
    assert(fsm.isShielded(), "Player should be shielded immediately after spawn");

    // Update with time advancement
    setTimeout(() => {
        fsm.update(0.1);
        assert(!fsm.isShielded(), "Shield should expire after duration");
        assert.strictEqual(fsm.getStateName(), 'active');
    }, 60);
});

console.log("\n=================================================");
console.log(`=== SUMMARY: ${passed} PASSED | ${failed} FAILED ===`);
console.log("=================================================\n");

if (failed > 0) process.exit(1);
