const Game = require('./GameClass.js');

var game = new Game();
game.setup = function() {

    game.addEntityType('players');
    game.addEntityType('dots');

    console.log('setting up game');

    // add some dots
    for (let i = 0; i < 1; i++) {
        initiateDot(this);
    }
};

game.joinGame = function(data) {
    return initiatePlayer(this, data);
}

game.update = function() {

    game.entities['players'].forEach(function(entity) {

        if (entity.name == 'plr') {
            return;
        }

        // entity.abilities.velocity.velocity = entity.abilities.velocity.velocity.add(new Shapes.Vect(
        //     Math.random() > .5 ? -Math.random() - 1 : Math.random() + 1,
        //     Math.random() > .5 ? -Math.random() - 1 : Math.random() + 1,
        //     0));
    }, this);


};



function initiatePlayer(game, data) {

    const player = new game.Entity(data.userName);

    let playerPos = new game.shapes.Vect(Math.floor(Math.random() * (300 - 1 + 1)) + 1, Math.floor(Math.random() * (300 - 1 + 1)) + 1);
    let playerCirc = new game.shapes.Rect(30);

    player.attach(new game.abilities.Body(playerCirc, 'green'));
    player.attach(new game.abilities.Position(playerPos));
    player.attach(new game.abilities.Velocity());
    player.attach(new game.abilities.Input());
    player.attach(new game.abilities.Mass(100));
    player.attach(new game.abilities.Cor(.4));
    player.attach(new game.abilities.Collidable());

    // player.attach(new game.abilities.Gravity());

    player.attach(new game.abilities.Orientation());

    // player.attach(new game.abilities.Torque());
    // player.attach(new game.abilities.Acceleration());
    player.attach(new game.abilities.AngularVelocity());

    game.subSystems.collision.AddEntity(player);
    game.subSystems.motion.AddEntity(player);
    game.subSystems.physics.AddEntity(player);

    console.log('-------------------------lll', game.activeConnections);

    player.socket_id = data.socketId;
    game.addEntity(player, 'players');

    return player;
}


function initiateDot(game) {

    var dotPos = new game.shapes.Vect(Math.floor(Math.random() * (game.config.canvas.width - 1 + 1)) + 1, Math.floor(Math.random() * (game.config.canvas.height - 1 + 1)) + 1)
        // (game.config.canvas.width / 2, game.config.canvas.height / 2);
    var dotCirc = new game.shapes.Circ(20);
    var dot = new game.Entity('dot');
    dot.attach(new game.abilities.Body(dotCirc, 'blue'));
    dot.attach(new game.abilities.Position(dotPos));
    dot.attach(new game.abilities.Collidable());
    dot.attach(new game.abilities.Velocity());
    dot.attach(new game.abilities.Mass(50));

    dot.attach(new game.abilities.Orientation());
    // dot.attach(new game.abilities.Gravity());

    dot.attach(new game.abilities.AngularVelocity());

    dot.attach(new game.abilities.Cor(.5));




    game.subSystems.collision.AddEntity(dot);
    game.subSystems.physics.AddEntity(dot);
    game.subSystems.motion.AddEntity(dot);

    game.addEntity(dot, 'players');
}

module.exports = exports = game;