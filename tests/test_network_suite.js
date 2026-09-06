const assert = require('assert');
const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const GameServer = require('../engine/src/server/GameServer.js');

console.log('=================================================');
console.log('=== RUNNING ENGINE WEBSOCKET NETWORK TESTS ======');
console.log('=================================================\n');

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
    try {
        await fn();
        console.log(`  ✅ PASS: ${name}`);
        passed++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${name}`);
        console.error(err);
        failed++;
    }
}

async function main() {
    const testPort = 4455;

    let receivedInput = null;
    let disconnectedSocketId = null;

    const mockGame = {
        config: { gameport: testPort },
        active: false,
        onletMePlay: (data) => {
            mockGame.server.letEmPlay(
                { id: 'player_1', name: data.userName, x: 500, y: 500, radius: 20 },
                data.socketId,
                [{ id: 'dot_1', x: 510, y: 510, radius: 3.5 }]
            );
        },
        playerInput: (data) => {
            receivedInput = data;
        },
        playerClick: () => {},
        onPlayerDisconnect: (socketId) => {
            disconnectedSocketId = socketId;
        }
    };

    const server = new GameServer();
    mockGame.server = server;

    await runTest("GameServer initializes WebSocket Server on /ws and binds to port", async () => {
        await server.serve(mockGame, {});
        assert(server.wss instanceof WebSocket.Server, "server.wss must be an instance of WebSocket.Server");
    });

    await runTest("WebSocket client connects, sends 'letmeplay', and receives 'play' snapshot", async () => {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`ws://localhost:${testPort}/ws`);
            let receivedPlay = false;

            ws.on('open', () => {
                ws.send(JSON.stringify({
                    event: 'letmeplay',
                    data: { userName: 'QuantumBlob' }
                }));
            });

            ws.on('message', (raw) => {
                const msg = JSON.parse(raw);
                if (msg.event === 'play') {
                    receivedPlay = true;
                    assert.strictEqual(msg.data.player.name, 'QuantumBlob');
                    assert.strictEqual(msg.data.dots.length, 1);
                    assert.strictEqual(msg.data.dots[0].radius, 3.5);
                    ws.close();
                    resolve();
                }
            });

            ws.on('error', reject);
            setTimeout(() => {
                if (!receivedPlay) reject(new Error("Timeout waiting for 'play' response"));
            }, 2000);
        });
    });

    await runTest("GameServer broadcasts 'tick' payload in single pass to multiple clients", async () => {
        return new Promise((resolve, reject) => {
            const ws1 = new WebSocket(`ws://localhost:${testPort}/ws`);
            const ws2 = new WebSocket(`ws://localhost:${testPort}/ws`);
            let ws1GotTick = false;
            let ws2GotTick = false;

            let readyCount = 0;
            const onOpen = () => {
                readyCount++;
                if (readyCount === 2) {
                    server.doTick({
                        players: [{ id: 'p1', x: 200, y: 300, radius: 25 }],
                        dotsDelta: [{ id: 'd99', status: 'eaten' }],
                        fps: 30,
                        events: [],
                        gameState: { state: 'RoundActive', timeRemaining: 175 }
                    });
                }
            };

            const checkDone = () => {
                if (ws1GotTick && ws2GotTick) {
                    ws1.close();
                    ws2.close();
                    resolve();
                }
            };

            ws1.on('open', onOpen);
            ws2.on('open', onOpen);

            ws1.on('message', (raw) => {
                const msg = JSON.parse(raw);
                if (msg.event === 'tick') {
                    ws1GotTick = true;
                    assert.strictEqual(msg.data.players[0].x, 200);
                    checkDone();
                }
            });

            ws2.on('message', (raw) => {
                const msg = JSON.parse(raw);
                if (msg.event === 'tick') {
                    ws2GotTick = true;
                    assert.strictEqual(msg.data.gameState.timeRemaining, 175);
                    checkDone();
                }
            });

            setTimeout(() => {
                if (!ws1GotTick || !ws2GotTick) reject(new Error("Timeout waiting for tick broadcasts"));
            }, 2000);
        });
    });

    await runTest("WebSocket client routes 'input' event to game.playerInput", async () => {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`ws://localhost:${testPort}/ws`);
            ws.on('open', () => {
                ws.send(JSON.stringify({
                    event: 'input',
                    data: { x: 0.707, y: -0.707 }
                }));
                setTimeout(() => {
                    assert(receivedInput !== null, "Server should have received input data");
                    assert.strictEqual(receivedInput.x, 0.707);
                    assert.strictEqual(receivedInput.y, -0.707);
                    ws.close();
                    resolve();
                }, 100);
            });
            ws.on('error', reject);
        });
    });

    await runTest("WebSocket disconnection triggers game.onPlayerDisconnect cleanup", async () => {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(`ws://localhost:${testPort}/ws`);
            ws.on('open', () => {
                setTimeout(() => {
                    ws.close();
                }, 50);
            });
            setTimeout(() => {
                assert(disconnectedSocketId !== null, "Server must register disconnectedSocketId on close");
                resolve();
            }, 200);
        });
    });

    console.log('\n=================================================');
    console.log(`=== SUMMARY: ${passed} PASSED | ${failed} FAILED ===`);
    console.log('=================================================\n');

    process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
    console.error("Fatal test runner error:", err);
    process.exit(1);
});
