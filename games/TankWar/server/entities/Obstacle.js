let nextObstacleId = 1;

function createObstacle(game, options = {}) {
    const obstacle = new game.Entity("obstacle");
    obstacle.id = "obs_" + (nextObstacleId++);
    obstacle.name = "obstacle";
    obstacle.type = "obstacles";
    obstacle.maxHealth = options.health || 50;

    const x = options.x !== undefined ? options.x : (150 + Math.random() * 1300);
    const y = options.y !== undefined ? options.y : (150 + Math.random() * 900);
    const radius = options.radius || 28;

    obstacle.attach(new game.abilities.Position(new game.shapes.Vect(x, y)));
    obstacle.attach(new game.abilities.Body(new game.shapes.Circ(radius), "#64748b"));
    obstacle.attach(new game.abilities.Health(obstacle.maxHealth));
    obstacle.attach(new game.abilities.Collidable(true, false));

    obstacle.custom = {
        maxHealth: obstacle.maxHealth,
        isObstacle: true
    };

    game.addEntity(obstacle, "obstacles");
    return obstacle;
}

module.exports = { createObstacle };
