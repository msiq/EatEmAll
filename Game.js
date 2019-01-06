/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "[object]" }] */
/* eslint no-param-reassign:
  ["error", {
    "props": true,
      "ignorePropertyModificationsFor": ["entity", "object"],

    }]
*/

const GameClass = require('./Server/GameClass.js');
// const Shapes = require('./Server/Shapes.js');
const Entity = require('./Server/Entity.js');

/**
 * @param {Game} game
 */
function colliding(game) {
  if (game.entities.players) {
    game.entities.players.forEach((entity) => {
      entity.abilities.collidable.onCollisionStart((object) => {
        entity.abilities.body.color = '#ff0000';
        entity.abilities.score.add(1);
        entity.abilities.power.sub(1);
        entity.abilities.health.sub(2);
        if (
          entity.abilities.score.score > 0 && entity.abilities.score.score % 10 === 0
        ) {
          entity.abilities.experience.add(1);
          if (
            entity.abilities.experience.xp > 0 && entity.abilities.experience.xp % 5 === 0
          ) {
            entity.abilities.rank.raise();
          }
        }
      });
      entity.abilities.collidable.onCollision((object) => {
        // entity.abilities.body.color = "#ffff00";
      });
      entity.abilities.collidable.onCollisionEnd((object) => {
        entity.abilities.body.color = entity.abilities.body.originalColor;
      });
    });
  }

  if (game.entities.dots) {
    game.entities.dots.forEach((entity) => {
      entity.abilities.collidable.onCollisionStart((object) => {
        entity.abilities.body.color = '#ffff00';
      });
      entity.abilities.collidable.onCollision((object) => {
        // entity.abilities.body.color = "#ffff00";
      });
      entity.abilities.collidable.onCollisionEnd((object) => {
        entity.abilities.body.color = entity.abilities.body.originalColor;
      });
    }, this);
  }
}

// /**
//  * @param {Entity} entity
//  */
// function moveRandom(entity) {
//   entity.abilities.velocity.velocity = entity.abilities.velocity.velocity.add(
//     new Shapes.Vect(
//       Math.random() > 0.5 ? -Math.random() - 1 : Math.random() + 1,
//       Math.random() > 0.5 ? -Math.random() - 1 : Math.random() + 1,
//       0,
//     ),
//   );
// }

/**
 * @param {Game} game
 * @param {Object} data
 * @return {Entity} player
 */
function initiatePlayer(game, data) {
  const player = new game.Entity(data.userName);

  const playerPos = new game.shapes.Vect(
    Math.floor(Math.random() * (300 - 1 + 1)) + 1,
    Math.floor(Math.random() * (300 - 1 + 1)) + 1,
  );
  const playerCirc = new game.shapes.Circ(20);

  player.attach(new game.abilities.Body(playerCirc, 'green'));
  player.attach(new game.abilities.Position(playerPos));
  player.attach(new game.abilities.Velocity());
  player.attach(new game.abilities.Input());
  player.attach(new game.abilities.Mass(100));
  player.attach(new game.abilities.Cor(0.4));
  player.attach(new game.abilities.Collidable());

  player.attach(new game.abilities.Score());
  player.attach(
    new game.abilities.Rank({
      1: 300,
      2: 500,
      3: 600,
    }),
  );
  player.attach(new game.abilities.Experience(1000));
  player.attach(new game.abilities.Power(100));
  player.attach(new game.abilities.Health(100));
  // player.attach(new game.abilities.Gravity());
  player.attach(new game.abilities.Orientation());
  // player.attach(new game.abilities.Torque());
  // player.attach(new game.abilities.Acceleration());
  // player.attach(new game.abilities.AngularVelocity());

  game.subSystems.collision.AddEntity(player);
  game.subSystems.motion.AddEntity(player);
  game.subSystems.physics.AddEntity(player);
  game.subSystems.score.AddEntity(player);

  const camera = new game.abilities.Camera(player.abilities.position.pos);
  player.attach(camera);
  player.attach(new game.abilities.Viewport(600, 600, camera));
  game.subSystems.display.AddEntity(player);
  player.socket_id = data.socketId;
  game.addEntity(player, 'players');
  // console.log(player.abilities.viewport);
  return player;
}

/**
 * @param {Game} game
 * @param {number} x
 * @param {number} y
 */
function initiateDot(game, x, y) {
  const dotPos = new game.shapes.Vect(
    x || Math.floor(Math.random() * (game.config.canvas.width - 1 + 1)) + 1,
    y || Math.floor(Math.random() * (game.config.canvas.height - 1 + 1)) + 1,
  );
  // (game.config.canvas.width / 2, game.config.canvas.height / 2);
  const dotCirc = new game.shapes.Circ(20);
  const dot = new game.Entity('dot');
  dot.attach(new game.abilities.Body(dotCirc, 'blue'));
  dot.attach(new game.abilities.Position(dotPos));
  dot.attach(new game.abilities.Collidable());
  dot.attach(new game.abilities.Velocity());
  dot.attach(new game.abilities.Mass(50));
  dot.attach(new game.abilities.Power(100));

  dot.attach(new game.abilities.Orientation());
  // dot.attach(new game.abilities.Gravity());
  dot.attach(new game.abilities.AngularVelocity());
  dot.attach(new game.abilities.Cor(0.5));
  game.subSystems.collision.AddEntity(dot);
  game.subSystems.physics.AddEntity(dot);
  game.subSystems.motion.AddEntity(dot);
  game.addEntity(dot, 'dots');
}

class Game extends GameClass {
  setup() {
    this.addEntityType('players', Entity.TYPE_MAIN);
    this.addEntityType('dots', Entity.TYPE_DEFAULT);
    // console.log('setting up game');
    // add some dots
    // let dotx = 160;
    // let doty = 180;
    for (let i = 0; i < 100; i++) {
      initiateDot(this);
      // dotx += 60;
    }
  }

  joinGame(data) {
    return initiatePlayer(this, data);
  }

  update() {
    return colliding(this);
  }
}

const game = new Game();

// console.log(game.joinGame);

module.exports = game;
