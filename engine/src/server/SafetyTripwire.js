const { performance } = require('perf_hooks');

/**
 * SafetyTripwire: Hardware & System Protection Subsystem
 * Protects Node.js from event loop freezing, memory exhaustion, network flooding,
 * and CPU core overheating during uncapped / high-speed simulation.
 */
class SafetyTripwire {
    constructor(config = {}) {
        this.maxEventLoopLagMs = config.maxEventLoopLagMs || 25; // Trigger if event loop lags > 25ms
        this.maxHeapMB = config.maxHeapMB || 1400; // Trigger if heap > 1.4 GB
        this.cooldownMs = config.cooldownMs || 6; // Cool-down breathing pause
        this.broadcastIntervalMs = 1000 / (config.broadcastFpsLimit || config.maxBroadcastFps || 120); // Cap network broadcasts up to 120 Hz
        this.thermalBreatherIntervalMs = config.thermalBreatherEveryMs || 1000;
        this.thermalBreatherDurationMs = config.thermalBreatherDurationMs || 10;

        this.eventLoopLag = 0;
        this.lastBroadcast = 0;
        this.lastThermalBreather = performance.now();
        this.currentTps = 30;
        this.tpsCounter = 0;
        this.lastTpsTime = performance.now();
        this.tripCount = 0;
        this.status = "NORMAL";

        // Setup background event loop lag checker (measures scheduling latency every 20ms)
        this._initLagChecker();
    }

    _initLagChecker() {
        let expectedTime = performance.now() + 20;
        this.lagTimer = setInterval(() => {
            const now = performance.now();
            this.eventLoopLag = Math.max(0, now - expectedTime);
            expectedTime = now + 20;
        }, 20);
        if (this.lagTimer.unref) this.lagTimer.unref();
    }

    // Called on simulation ticks to decouple physics rate from network broadcast rate
    shouldBroadcast(now) {
        if (!now) now = performance.now();
        if (now - this.lastBroadcast >= this.broadcastIntervalMs) {
            this.lastBroadcast = now;
            return true;
        }
        return false;
    }

    // Evaluates system vitals and returns whether a breathing pause is required
    checkVitals() {
        const now = performance.now();
        this.tpsCounter++;

        // Update real-time TPS once per second
        if (now - this.lastTpsTime >= 1000) {
            this.currentTps = Math.round((this.tpsCounter * 1000) / (now - this.lastTpsTime));
            this.tpsCounter = 0;
            this.lastTpsTime = now;
        }

        // 1. Event Loop Lag Tripwire (Prevents UI & network freezes)
        if (this.eventLoopLag > this.maxEventLoopLagMs) {
            this.status = "LAG_TRIPPED";
            this.tripCount++;
            return { pause: true, duration: this.cooldownMs, reason: `Event loop lag (${this.eventLoopLag.toFixed(1)}ms > ${this.maxEventLoopLagMs}ms)` };
        }

        // 2. Memory Ceiling Sentinel (Prevents V8 OOM crash)
        const heapMB = process.memoryUsage().heapUsed / 1024 / 1024;
        if (heapMB > this.maxHeapMB) {
            this.status = "MEMORY_TRIPPED";
            this.tripCount++;
            return { pause: true, duration: this.cooldownMs * 2, reason: `Heap memory near limit (${Math.round(heapMB)}MB > ${this.maxHeapMB}MB)` };
        }

        // 3. Thermal Duty Cycle Breather (Allows OS scheduler and CPU to idle)
        if (now - this.lastThermalBreather >= this.thermalBreatherIntervalMs) {
            this.lastThermalBreather = now;
            this.status = "THERMAL_BREATHE";
            return { pause: true, duration: this.thermalBreatherDurationMs, reason: "Thermal duty cycle breather" };
        }

        this.status = "NORMAL";
        return { pause: false, duration: 0, reason: null };
    }

    getStats() {
        return {
            status: this.status,
            currentTps: this.currentTps,
            eventLoopLagMs: parseFloat(this.eventLoopLag.toFixed(1)),
            heapMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            tripCount: this.tripCount
        };
    }

    destroy() {
        if (this.lagTimer) clearInterval(this.lagTimer);
    }
}

module.exports = SafetyTripwire;
