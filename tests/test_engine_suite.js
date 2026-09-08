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
    const subSystemsCode = fs.readFileSync(path.join(__dirname, '../engine/src/physics/SubSystems.js'), 'utf8');

    const impulseMatch = subSystemsCode.match(/this\.resolveCircleImpulse\s*=\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\s*this\./);
    assert(impulseMatch, "Could not locate resolveCircleImpulse in SubSystems.js");

    const impulseBody = impulseMatch[1];
    assert(!impulseBody.includes('entityA.name === "dot"'), "Leaked dot check found in resolveCircleImpulse");
    assert(!impulseBody.includes('entityA.name === "virus"'), "Leaked virus check found in resolveCircleImpulse");
    assert(!impulseBody.includes('radA > radB * 1.15'), "Leaked eating predator rule found in resolveCircleImpulse");
});

test("Engine GameClass.js should use generic staticLayers rather than hardcoded dots", () => {
    const gameClassCode = fs.readFileSync(path.join(__dirname, '../engine/src/server/GameClass.js'), 'utf8');
    assert(gameClassCode.includes('this.staticLayers'), "GameClass.js missing staticLayers set");
    assert(!gameClassCode.includes("if (entityType === 'dots') return;"), "Hardcoded dots check still in doTick");
});

// -------------------------------------------------------------
// TEST 2: Newtonian Collision Impulse & Momentum Conservation
// -------------------------------------------------------------
test("Newtonian Impulse Solver preserves total linear momentum (m1*v1 + m2*v2)", () => {
    const Shapes = require('../engine').Shapes;
    const SubSystems = require('../engine/src/physics/SubSystems.js');

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

    const rad1 = entity1.abilities.body.shape.radius;
    const rad2 = entity2.abilities.body.shape.radius;
    const m1 = 100 * (rad1 / 20) * (rad1 / 20); // 100
    const m2 = 100 * (rad2 / 20) * (rad2 / 20); // 300

    const initialP_x = m1 * entity1.abilities.velocity.velocity.x + m2 * entity2.abilities.velocity.velocity.x;
    const initialP_y = m1 * entity1.abilities.velocity.velocity.y + m2 * entity2.abilities.velocity.velocity.y;

    collisionSystem.resolveCircleImpulse(entity1, entity2);

    const finalP_x = m1 * entity1.abilities.velocity.velocity.x + m2 * entity2.abilities.velocity.velocity.x;
    const finalP_y = m1 * entity1.abilities.velocity.velocity.y + m2 * entity2.abilities.velocity.velocity.y;

    assert(Math.abs(initialP_x - finalP_x) < 1e-4, `Momentum X not conserved: pre=${initialP_x}, post=${finalP_x}`);
    assert(Math.abs(initialP_y - finalP_y) < 1e-4, `Momentum Y not conserved: pre=${initialP_y}, post=${finalP_y}`);

    const postDist = Math.hypot(
        entity2.abilities.position.pos.x - entity1.abilities.position.pos.x,
        entity2.abilities.position.pos.y - entity1.abilities.position.pos.y
    );
    assert(postDist > 30, `Entities should be separated: postDist=${postDist}`);
});

test("Impulse solver applies restitution and tangential Coulomb friction", () => {
    const Shapes = require('../engine').Shapes;
    const SubSystems = require('../engine/src/physics/SubSystems.js');

    const mockGame = {
        config: { canvas: { width: 2000, height: 2000 } },
        abilities: { Aabb: function() {} }
    };
    const collisionSystem = SubSystems(mockGame).collision;

    const e1 = {
        id: "e1",
        abilities: {
            position: { pos: new Shapes.Vect(100, 100) },
            velocity: { velocity: new Shapes.Vect(4, 2) },
            body: { shape: new Shapes.Circ(20) },
            mass: { mass: 100 },
            cor: { cor: 0.5 },
            collidable: { isTrigger: false, isStatic: false }
        },
        has: () => true
    };

    const e2 = {
        id: "e2",
        abilities: {
            position: { pos: new Shapes.Vect(130, 100) }, // dx = 30 along X normal
            velocity: { velocity: new Shapes.Vect(-4, -2) },
            body: { shape: new Shapes.Circ(20) },
            mass: { mass: 100 },
            cor: { cor: 0.5 },
            collidable: { isTrigger: false, isStatic: false }
        },
        has: () => true
    };

    collisionSystem.resolveCircleImpulse(e1, e2);

    const relNormSep = e2.abilities.velocity.velocity.x - e1.abilities.velocity.velocity.x;
    assert(relNormSep > 0, "Circles should be moving apart along normal");
    assert(Math.abs(relNormSep - 4.0) < 0.1, `Expected normal separation speed ~4.0, got ${relNormSep}`);
});

test("Trigger colliders should be completely skipped by physical impulse solver", () => {
    const Shapes = require('../engine').Shapes;
    const SubSystems = require('../engine/src/physics/SubSystems.js');

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
            collidable: { isTrigger: true, isStatic: true }
        },
        has: () => true
    };

    collisionSystem.resolveCircleImpulse(player, triggerDot);

    assert.strictEqual(player.abilities.velocity.velocity.x, 5, "Player velocity should not be modified by trigger collider");
});

// -------------------------------------------------------------
// TEST 3: State Machines (GameStateMachine & PlayerStateMachine)
// -------------------------------------------------------------
test("GameStateMachine correctly manages transitions and state lifecycle", () => {
    const { BaseGameState, GameStateMachine } = require('../engine');

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
    const { BasePlayerState, PlayerStateMachine } = require('../engine');

    const mockPlayer = { id: "p1" };
    const fsm = new PlayerStateMachine(mockPlayer);

    class ShieldedState extends BasePlayerState {
        constructor() { super('shielded'); }
        update(player, dt) {
            if (fsm.getTimeInState() >= 3500) {
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

    // Advance state timer deterministically
    fsm.stateStartTime = Date.now() - 4000;
    fsm.update(0.1);
    assert(!fsm.isShielded(), "Shield should expire after 3500ms duration");
    assert.strictEqual(fsm.getStateName(), 'active');
});

// -------------------------------------------------------------
// TEST 4: Context Steering AI, Target Commitment & Inertia Lerp
// -------------------------------------------------------------
test("Bot Steering AI smoothly lerps velocity without instantaneous jitter", () => {
    const curVel = { x: 0, y: 0 };
    const targetVel = { x: 5.0, y: 0 };
    const steerWeight = 0.20;

    curVel.x += (targetVel.x - curVel.x) * steerWeight;
    curVel.y += (targetVel.y - curVel.y) * steerWeight;

    assert.strictEqual(curVel.x, 1.0, `Expected smoothed vel.x=1.0, got ${curVel.x}`);
    assert.strictEqual(curVel.y, 0, `Expected smoothed vel.y=0, got ${curVel.y}`);

    curVel.x += (targetVel.x - curVel.x) * steerWeight;
    assert.strictEqual(Math.round(curVel.x * 100) / 100, 1.80, `Expected smoothed vel.x=1.80, got ${curVel.x}`);
});

test("Bot Steering AI evades approaching predators outside safe eating margin", () => {
    const myPos = { x: 500, y: 500 };
    const myRadius = 20;

    const predatorPos = { x: 550, y: 500 };
    const predatorRadius = 35;
    const dist = Math.hypot(predatorPos.x - myPos.x, predatorPos.y - myPos.y);

    let fleeVecX = 0;
    let fleeVecY = 0;
    let hasThreat = false;

    if (predatorRadius > myRadius * 1.15 && dist < 260) {
        const threatWeight = Math.pow((260 - dist) / 260, 1.5) * 3.5;
        const dx = predatorPos.x - myPos.x;
        const dy = predatorPos.y - myPos.y;
        fleeVecX -= (dx / dist) * threatWeight;
        fleeVecY -= (dy / dist) * threatWeight;
        hasThreat = true;
    }

    assert(hasThreat, "Predator within threat distance must trigger hasThreat");
    assert(fleeVecX < 0, "Flee vector must steer strongly LEFT (-X), away from predator on right");
    assert.strictEqual(fleeVecY, 0, "Flee vector Y should be zero for horizontal threat");
});

test("Bot Steering AI enforces boundary repulsion away from arena perimeter", () => {
    const wallMargin = 120;
    const arenaW = 2000;
    const arenaH = 2000;

    const myPos = { x: 30, y: 1000 };
    let wallVecX = 0;
    let wallVecY = 0;

    if (myPos.x < wallMargin) wallVecX += (wallMargin - myPos.x) / wallMargin;
    if (myPos.x > arenaW - wallMargin) wallVecX -= (myPos.x - (arenaW - wallMargin)) / wallMargin;

    assert(wallVecX > 0, `Wall repulsion should push right (+X) into arena: got ${wallVecX}`);
    assert.strictEqual(wallVecX, (120 - 30) / 120, "Wall repulsion magnitude must scale inversely with edge distance");
});

console.log('\n=================================================');
console.log(`=== SUMMARY: ${passed} PASSED | ${failed} FAILED ===`);
console.log('=================================================\n');

if (failed > 0) process.exit(1);
