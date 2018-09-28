const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const path = require('path');
const config = require('./config.js');

const gameInterval = false;

let socket;

function GameServer() {
  this.sockets = [];
  this.game = {};

  this.serve = (game) => {
    this.game = game;

    return new Promise((resolve, reject) => {
      // define routes and start receiving Player connections
      app.get('/', (req, res) => res.sendFile(path.resolve('/Client/game.html'), {
        root: '.',
      }));
      // app.get('/', (req, res) => res.sendFile('collision-test.html', { root: '.' }));
      app.get('/*', (req, res) => res.sendFile(req.params[0], {
        root: '.',
      }));

      let okk = false;
      // start listening to on port 4444
      http.listen(this.game.config.gameport, () => console.log(`listening on : ${this.game.config.gameport}`));
      okk = io.on('connection', this.onConnection);

      if (!okk) {
        reject('reject says: no');
      }

      game.active = true;
      resolve('resolve says: yes');
    });
  };
  this.onConnection = (sock) => {
    this.sockets.push(sock);
    console.log('conneted with something!');
    this.onRequest('letmeplay', game.onletMePlay);
    this.onRequest('input', game.playerInput);
    this.onRequest('click', game.playerClick);

    return 'OK';
  };
  this.onRequest = (request, onRequest) => {
    this.sockets.map((soc) => {
      soc.on(request, onRequest);
    });
  };
  this.onResponse = (socketId, response, onResponse) => {
    io.sockets.sockets[socketId].emit(response, onResponse);
  };
  this.letEmPlay = (player) => {
    io.sockets.sockets[player.socket_id].emit('play', {
      player,
    });
  };
  this.goAway = (socketId) => {
    io.sockets.sockets[socketId].emit('goaway');
  };
  this.doTick = (data) => {
    io.sockets.emit(
      'tick',
      JSON.stringify({
        players: data.players,
        fps: data.fps,
      }),
    );
  };
}

// io.on('connection', );
// (sock) => {
// socket = sock;
// console.log('Someone connected!');

// socket.on('letmeeat', game.onletMeEat);
// });

// Handle eating request
// function onletMeEat(data) {

//     let pid = data.oldId;

//     // if info missing dont let em eat anything :|
//     if (data.userName == '') {
//         socket.emit('goaway');
//         return 0;
//     }

//     // Is returning eater :)
//     if (IsReturningEater(pid, players)) {
//         console.log('This eater is back again!');
//         players[pid].socket_id = socket.id;
//         letEmEat(players[pid]);
//         return 0;
//     }

//     // new eater :)
//     pid = initializePlayer(data.userName, { 'socket-id': socket.id });
//     letEmEat(players[pid]);

//     // Start ticking
//     doTick();

// }

// function IsReturningEater(previousId, players) {
//     return previousId !== '' &&
//         Object.keys(players).length > 0 &&
//         Object.keys(Object.keys(players).filter((id) => players[id].id == previousId)).length > 0
// }

// function letEmEat(player) {
//     socket.emit('eat', { player: player });
// }

// update all eaters with new happenings
// let check = 1;

// function doTick() {
//     if (Math.round(new Date().getTime() / 1000) % 3 == 0) {
//         process.stdout.clearLine();
//         process.stdout.cursorTo(0);
//     }

//     process.stdout.write('.');
//     io.sockets.emit('tick', JSON.stringify({ players: players }));

//     // start ticking
//     if (!gameInterval) {
//         gameInterval = setInterval(doTick, 1000 / config.server.frameRate);
//     }
// }

// // Initialize new player
// function initializePlayer(name, options) {
//     const newplayer = new Player(name, options);
//     // console.log(newplayer);
//     // Save Player in players collection
//     players[newplayer.id] = newplayer;

//     // Initialize new player
//     newplayer.currentState.execute()
//         .then((data) => {
//             console.log(data);
//         }).catch((data) => {
//             console.log('could not initialize player :(', data);
//         });

//     newplayer.setState(new PlayerState.menu());

//     return newplayer.id;
// }

module.exports = exports = GameServer;
