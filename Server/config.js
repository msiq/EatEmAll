module.exports =
    exports = {
        gameport: 4444,
        server: {
            mode: 'standard', // 'standard' (capped at frameRate) or 'unrestricted' (max simulation speed + hardware tripwires)
            frameRate: 30,
            unrestricted: {
                maxBroadcastFps: 60, // Capped network broadcast rate to keep browser clients smooth
                maxEventLoopLagMs: 25, // Event loop freeze circuit breaker
                maxHeapMB: 1400, // Memory ceiling sentinel
                cooldownMs: 6, // Tripwire pause
                thermalBreatherEveryMs: 1000, // Regular duty cycle breather
                thermalBreatherDurationMs: 10
            }
        },
        canvas: {
            width: 2000,
            height: 2000,
        },
        dots: {
            minRad: 15,
            maxRad: 25,
        },
        player: {
            fps: 30,
            speed: 2,
            ease: 0.2,
            rad: 20,
            turn: 2,
        },
        env: {
            gravity: 9.8,
            airResistance: 0.1,
            surfaceResistance: 0.3,
        },
    };
