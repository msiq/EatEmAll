const express = require('express');
const app = express();
const http = require('http').Server(app);
const { Server } = require('socket.io');
const path = require('path');

function GameServer() {
    this.sockets = [];
    this.game = {};
    let io = null;

    this.serve = (game) => {
        this.game = game;
        io = new Server(http, {
            cors: { origin: "*" }
        });

        return new Promise((resolve, reject) => {
            // Silence favicon 404 noise
            app.get('/favicon.ico', (req, res) => res.status(204).end());

            // Enable JSON body parsing for API endpoints
            app.use(express.json());

            // Serve Client assets safely
            app.use('/Client', express.static(path.join(__dirname, '../Client')));
            app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../Client/game.html')));
            app.get('/benchmark', (req, res) => res.sendFile(path.join(__dirname, '../Client/benchmark.html')));
            app.get('/benchmark-data', (req, res) => res.sendFile(path.join(__dirname, '../benchmark_history.json')));

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
            const port = this.game.config.gameport || 4444;
            http.listen(port, () => {
                console.log('Game server listening on port: ' + port);
            });

            io.on('connection', (sock) => {
                this.sockets.push(sock);
                console.log('New client connected: ' + sock.id);

                sock.on('letmeplay', (data) => {
                    if (this.game && typeof this.game.onletMePlay === 'function') {
                        data = data || {};
                        data.socketId = sock.id;
                        this.game.onletMePlay(data);
                    }
                });

                sock.on('input', (data) => {
                    if (this.game && typeof this.game.playerInput === 'function') {
                        this.game.playerInput(data);
                    }
                });

                sock.on('click', (data) => {
                    if (this.game && typeof this.game.playerClick === 'function') {
                        this.game.playerClick(data);
                    }
                });

                sock.on('disconnect', () => {
                    console.log('Client disconnected: ' + sock.id);
                    let index = this.sockets.indexOf(sock);
                    if (index >= 0) {
                        this.sockets.splice(index, 1);
                    }
                    if (this.game && typeof this.game.onPlayerDisconnect === 'function') {
                        this.game.onPlayerDisconnect(sock.id);
                    }
                });
            });

            game.active = true;
            resolve('Server started successfully');
        });
    };

    this.letEmPlay = (player, socketId, allDots) => {
        const targetId = socketId || (player && (player.socket_id || player.socketId));
        if (io && targetId) {
            io.to(targetId).emit('play', { player, dots: allDots || [] });
        }
    };

    this.gameOver = (socketId, stats) => {
        if (io && socketId) {
            io.to(socketId).emit('gameover', stats);
        }
    };

    this.goAway = (socketId) => {
        if (io && socketId) {
            io.to(socketId).emit('goaway');
        }
    };

    this.doTick = (data) => {
        if (io) {
            io.emit('tick', JSON.stringify({
                players: data.players,
                dotsDelta: data.dotsDelta || [],
                fps: data.fps,
                events: data.events || [],
                gameState: data.gameState || null,
            }));
        }
    };
}

module.exports = exports = GameServer;