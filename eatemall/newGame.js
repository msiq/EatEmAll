const Game = require('./GameClass.js');
const Shapes = require('./Shapes.js');
const Entity = require('./Entity.js');

var game = new Game();
game.setup = function() {

    game.addEntityType('players', Entity.TYPE_MAIN);
    game.addEntityType('dots', Entity.TYPE_DEFAULT);

    console.log('setting up game');

    // add some dots
    let dotx = 160;
    let doty = 180;
    for (let i = 0; i < 1; i++) {
        initiateDot(this);
        dotx += 60;
    }
};

game.joinGame = function(data) {
    return initiatePlayer(this, data);
}

game.update = function() {
    colliding(game);
};


function colliding(game) {
    if (game.entities['players']) {
        game.entities['players'].forEach(
            function(entity) {
                entity.abilities.collidable.onCollisionStart((object) => {
                    entity.abilities.body.color = "#ff0000";
                    entity.abilities.score.add(1);
                    entity.abilities.power.sub(1);
                    if (entity.abilities.score.score > 0 && entity.abilities.score.score % 10 == 0) {
                        entity.abilities.experience.add(1);
                        if (entity.abilities.experience.xp > 0 && entity.abilities.experience.xp % 5 == 0) {
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
            },
            this);
    }

    if (game.entities['dots']) {
        game.entities['dots'].forEach(
            function(entity) {
                entity.abilities.collidable.onCollisionStart((object) => {
                    entity.abilities.body.color = "#ffff00";
                });
                entity.abilities.collidable.onCollision((object) => {
                    // entity.abilities.body.color = "#ffff00";
                });
                entity.abilities.collidable.onCollisionEnd((object) => {
                    entity.abilities.body.color = entity.abilities.body.originalColor;
                });
            },
            this);
    }
};

function moveRandom(entity) {
    entity.abilities.velocity.velocity = entity.abilities.velocity.velocity.add(new Shapes.Vect(
        Math.random() > .5 ? -Math.random() - 1 : Math.random() + 1,
        Math.random() > .5 ? -Math.random() - 1 : Math.random() + 1,
        0));
}

function initiatePlayer(game, data) {

    const player = new game.Entity(data.userName);

    let playerPos = new game.shapes.Vect(Math.floor(Math.random() * (300 - 1 + 1)) + 1, Math.floor(Math.random() * (300 - 1 + 1)) + 1);
    let playerCirc = new game.shapes.Circ(20);

    player.attach(new game.abilities.Body(playerCirc, 'green'));
    player.attach(new game.abilities.Position(playerPos));
    player.attach(new game.abilities.Velocity());
    player.attach(new game.abilities.Input());
    player.attach(new game.abilities.Mass(100));
    player.attach(new game.abilities.Cor(.4));
    player.attach(new game.abilities.Collidable());

    player.attach(new game.abilities.Score());
    player.attach(new game.abilities.Rank({ 1: 300, 2: 500, 3: 600 }));
    player.attach(new game.abilities.Experience(1000));

    player.attach(new game.abilities.Power(100));

    // player.attach(new game.abilities.Gravity());

    player.attach(new game.abilities.Orientation());

    // player.attach(new game.abilities.Torque());
    // player.attach(new game.abilities.Acceleration());
    // player.attach(new game.abilities.AngularVelocity());

    game.subSystems.collision.AddEntity(player);
    game.subSystems.motion.AddEntity(player);
    game.subSystems.physics.AddEntity(player);
    game.subSystems.score.AddEntity(player);

    console.log('-------------------------lll', game.activeConnections);

    player.socket_id = data.socketId;
    game.addEntity(player, 'players');

    return player;
}


function initiateDot(game, x, y) {

    var dotPos = new game.shapes.Vect(
        x || Math.floor(Math.random() * (game.config.canvas.width - 1 + 1)) + 1,
        y || Math.floor(Math.random() * (game.config.canvas.height - 1 + 1)) + 1
    );
    // (game.config.canvas.width / 2, game.config.canvas.height / 2);
    var dotCirc = new game.shapes.Circ(20);
    var dot = new game.Entity('dot');
    dot.attach(new game.abilities.Body(dotCirc, 'blue'));
    dot.attach(new game.abilities.Position(dotPos));
    dot.attach(new game.abilities.Collidable());
    dot.attach(new game.abilities.Velocity());
    dot.attach(new game.abilities.Mass(50));
    dot.attach(new game.abilities.Power(100));

    dot.attach(new game.abilities.Orientation());
    // dot.attach(new game.abilities.Gravity());

    dot.attach(new game.abilities.AngularVelocity());

    dot.attach(new game.abilities.Cor(.5));




    game.subSystems.collision.AddEntity(dot);
    game.subSystems.physics.AddEntity(dot);
    game.subSystems.motion.AddEntity(dot);

    game.addEntity(dot, 'dots');
}

module.exports = exports = game;