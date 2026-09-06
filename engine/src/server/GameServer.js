const fs = require('fs');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

function GameServer() {
    this.app = express();
    this.httpServer = http.createServer(this.app);
    this.sockets = [];
    this.socketMap = new Map();
    this.game = {};
    this.wss = null;
    let nextSocketId = 1;

    this.serve = (game, options) => {
        this.game = game;
        this.wss = new WebSocket.Server({ server: this.httpServer, path: '/ws' });
        const wss = this.wss;
        const app = this.app;

        return new Promise((resolve, reject) => {
            // Silence favicon 404 noise
            app.get('/favicon.ico', (req, res) => res.status(204).end());

            // Enable JSON body parsing for API endpoints
            app.use(express.json());

            // Serve Universal Engine Client & Plugin Assets
            const engineClientDir = path.resolve(__dirname, '../client');
            const universalIndexHtml = path.join(engineClientDir, 'index.html');
            app.use('/engine/client', express.static(engineClientDir));
            app.use('/Client', express.static(path.join(__dirname, '../../../Client')));

            // Dynamic Active Cartridge Visual Manifest
            const cartridgeDir = (options && options.cartridgeDir) || (options && options.clientDir ? path.dirname(options.clientDir) : null);
            const visualsPath = (options && options.visualsPath) || (cartridgeDir ? path.join(cartridgeDir, 'visuals.js') : null);

            app.get('/game/visuals.js', (req, res) => {
                if (visualsPath && fs.existsSync(visualsPath)) {
                    res.sendFile(visualsPath);
                } else if (options && options.clientDir && fs.existsSync(path.join(options.clientDir, 'visuals.js'))) {
                    res.sendFile(path.join(options.clientDir, 'visuals.js'));
                } else {
                    res.type('application/javascript').send('window.CartridgeVisuals = window.CartridgeVisuals || {};');
                }
            });

            // Universal Client Entry Point
            app.get('/', (req, res) => {
                if (fs.existsSync(universalIndexHtml)) {
                    res.sendFile(universalIndexHtml);
                } else if (options && options.clientDir && fs.existsSync(path.join(options.clientDir, 'game.html'))) {
                    res.sendFile(path.join(options.clientDir, 'game.html'));
                } else {
                    res.sendFile(path.join(__dirname, '../../../Client/game.html'));
                }
            });

            if (options && options.clientDir) {
                app.use('/game/client', express.static(options.clientDir));
            }
            // Engine Benchmark Dashboard & Historical Metrics Data (Pure Engine Feature)
            const engineBenchmarkHtml = path.resolve(__dirname, '../client/benchmark.html');
            const engineBenchmarkData = path.resolve(__dirname, '../../../benchmark_history.json');

            app.get('/benchmark', (req, res) => {
                if (fs.existsSync(engineBenchmarkHtml)) {
                    res.sendFile(engineBenchmarkHtml);
                } else {
                    res.status(404).send('Engine benchmark dashboard not found');
                }
            });

            app.get('/benchmark-data', (req, res) => {
                if (fs.existsSync(engineBenchmarkData)) {
                    res.sendFile(engineBenchmarkData);
                } else {
                    res.json({ runs: [] });
                }
            });

            // Live Engine Hardware & Simulation Telemetry
            app.get('/engine-telemetry', (req, res) => {
                const tripStats = (this.game && this.game.safetyTripwire && typeof this.game.safetyTripwire.getStats === 'function')
                    ? this.game.safetyTripwire.getStats()
                    : { status: 'NORMAL', currentTps: (this.game && this.game.lastFPS) || 30, eventLoopLagMs: 0, heapMB: 0, tripCount: 0 };

                let entityCount = 0;
                if (this.game && this.game.entities) {
                    Object.keys(this.game.entities).forEach(k => {
                        if (Array.isArray(this.game.entities[k])) entityCount += this.game.entities[k].length;
                    });
                }

                res.json({
                    mode: (this.game && this.game.mode) || 'standard',
                    fps: (this.game && this.game.lastFPS) || 0,
                    tps: (this.game && this.game.mode === 'unrestricted') ? (tripStats.currentTps || this.game.lastFPS || 0) : ((this.game && this.game.lastFPS) || 30),
                    entityCount,
                    tripwire: tripStats,
                    timestamp: Date.now()
                });
            });

            // Live Engine Mode Switcher (Standard 30 Hz vs. Unrestricted Protected Turbo)
            app.post('/set-mode', (req, res) => {
                const { mode } = req.body || {};
                if (this.game && typeof this.game.setMode === 'function') {
                    const success = this.game.setMode(mode);
                    return res.json({ success, mode: this.game.mode });
                }
                res.status(500).json({ success: false, error: 'Game instance not initialized' });
            });

            // Start listening on configured port
            const port = (this.game && this.game.config && this.game.config.gameport) || 4444;
            this.httpServer.listen(port, () => {
                // Only log when not in silent mode
                if (!options || !options.silent) {
                    console.log('Game server listening on port: ' + port);
                }
            });

            wss.on('connection', (sock, req) => {
                const sockId = 'ws_' + (nextSocketId++) + '_' + Math.random().toString(36).substring(2, 7);
                sock.id = sockId;
                this.sockets.push(sock);
                this.socketMap.set(sockId, sock);

                sock.on('message', (raw) => {
                    try {
                        const parsed = JSON.parse(raw);
                        const event = parsed.event;
                        const data = parsed.data || {};

                        if (event === 'letmeplay') {
                            if (this.game && typeof this.game.onletMePlay === 'function') {
                                data.socketId = sock.id;
                                this.game.onletMePlay(data);
                            }
                        } else if (event === 'input') {
                            if (this.game && typeof this.game.playerInput === 'function') {
                                this.game.playerInput(data);
                            }
                        } else if (event === 'click') {
                            if (this.game && typeof this.game.playerClick === 'function') {
                                this.game.playerClick(data);
                            }
                        }
                    } catch (e) {
                        console.error('[GameServer] Failed to process message:', e);
                    }
                });

                sock.on('close', () => {
                    this.socketMap.delete(sock.id);
                    const index = this.sockets.indexOf(sock);
                    if (index >= 0) {
                        this.sockets.splice(index, 1);
                    }
                    if (this.game && typeof this.game.onPlayerDisconnect === 'function') {
                        this.game.onPlayerDisconnect(sock.id);
                    }
                });

                sock.on('error', (err) => {
                    console.error('[GameServer] Client socket error:', sock.id, err.message);
                });
            });

            game.active = true;
            resolve('Server started successfully');
        });
    };

    this.letEmPlay = (player, socketId, allDots) => {
        const targetId = socketId || (player && (player.socket_id || player.socketId));
        const sock = this.socketMap.get(targetId);
        if (sock && sock.readyState === WebSocket.OPEN) {
            sock.send(JSON.stringify({
                event: 'play',
                data: { player, dots: allDots || [] }
            }));
        }
    };

    this.gameOver = (socketId, stats) => {
        const sock = this.socketMap.get(socketId);
        if (sock && sock.readyState === WebSocket.OPEN) {
            sock.send(JSON.stringify({
                event: 'gameover',
                data: stats
            }));
        }
    };

    this.goAway = (socketId) => {
        const sock = this.socketMap.get(socketId);
        if (sock && sock.readyState === WebSocket.OPEN) {
            sock.send(JSON.stringify({
                event: 'goaway'
            }));
        }
    };

    this.doTick = (data) => {
        if (this.wss && this.wss.clients && this.wss.clients.size > 0) {
            const payload = JSON.stringify({
                event: 'tick',
                data: {
                    players: data.players,
                    dotsDelta: data.dotsDelta || [],
                    fps: data.fps,
                    events: data.events || [],
                    gameState: data.gameState || null
                }
            });

            for (const client of this.wss.clients) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(payload);
                }
            }
        }
    };

    this.close = () => {
        return new Promise((resolve) => {
            if (this.wss) {
                for (const client of this.wss.clients) {
                    try { client.terminate(); } catch (e) {}
                }
                this.wss.close(() => {
                    if (this.httpServer) {
                        this.httpServer.close(resolve);
                    } else {
                        resolve();
                    }
                });
            } else if (this.httpServer) {
                this.httpServer.close(resolve);
            } else {
                resolve();
            }
        });
    };
}

module.exports = exports = GameServer;
