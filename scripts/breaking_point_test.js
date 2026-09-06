const { performance } = require("perf_hooks");
const { Rectangle, Quadtree } = require("../Server/Quadtree.js");
const Shapes = require("../Server/Shapes.js");

console.log("=================================================");
console.log("   BREAKING POINT TEST: FINDING ENGINE LIMITS   ");
console.log("=================================================");

const scales = [1000, 2500, 5000, 7500, 10000, 15000, 20000, 30000];
const results = [];

for (const N of scales) {
    // Generate N entities
    const entities = [];
    for (let i = 0; i < N; i++) {
        entities.push({
            id: i,
            x: Math.random() * 2000,
            y: Math.random() * 2000,
            radius: 8 + Math.random() * 15
        });
    }

    // 1. Measure Quadtree Rebuild Time
    const tRebuildStart = performance.now();
    const qt = new Quadtree(new Rectangle(0, 0, 2000, 2000), 4);
    for (let i = 0; i < N; i++) {
        qt.insert(entities[i]);
    }
    const rebuildMs = performance.now() - tRebuildStart;

    // 2. Measure All-Pairs Collision Queries via Quadtree
    let candidatePairs = 0;
    const tQueryStart = performance.now();
    for (let i = 0; i < N; i++) {
        const ent = entities[i];
        const searchBox = new Rectangle(ent.x - 30, ent.y - 30, 60, 60);
        const nearby = qt.query(searchBox);
        candidatePairs += nearby.length;
    }
    const queryMs = performance.now() - tQueryStart;
    const totalMs = rebuildMs + queryMs;
    const estimatedFps = totalMs > 0 ? Math.min(30, 1000 / totalMs) : 30;
    const isExceeded = totalMs > 33.33; // 30 FPS budget = 33.33ms

    const mem = process.memoryUsage().heapUsed / 1024 / 1024;

    results.push({
        N,
        rebuildMs: parseFloat(rebuildMs.toFixed(2)),
        queryMs: parseFloat(queryMs.toFixed(2)),
        totalMs: parseFloat(totalMs.toFixed(2)),
        candidatePairs,
        estimatedFps: parseFloat(estimatedFps.toFixed(1)),
        isExceeded,
        memMB: parseFloat(mem.toFixed(1))
    });

    const status = isExceeded ? "❌ OVER BUDGET (LAG)" : "✅ PASS (30 FPS)";
    console.log(`N = ${N.toString().padStart(5)} | Rebuild: ${rebuildMs.toFixed(2).padStart(6)}ms | Queries: ${queryMs.toFixed(2).padStart(6)}ms | Total: ${totalMs.toFixed(2).padStart(6)}ms | Est FPS: ${estimatedFps.toFixed(1).padStart(4)} | ${status}`);

    if (totalMs > 100) {
        console.log(`\n⚠️ Critical breakdown reached at N = ${N} entities (> 100ms per tick / sub-10 FPS). Stopping further scaling.`);
        break;
    }
}
