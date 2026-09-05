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

            // Serve Client assets safely
            app.use('/Client', express.static(path.join(__dirname, '../Client')));
            app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../Client/game.html')));

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

    this.letEmPlay = (player) => {
        if (io && player && player.socket_id) {
            io.to(player.socket_id).emit('play', { player });
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
                fps: data.fps,
            }));
        }
    };
}

module.exports = exports = GameServer;
