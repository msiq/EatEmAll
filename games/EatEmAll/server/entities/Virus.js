function createVirus(game, x, y) {
    let pad = 120;
    let virusPos = new game.shapes.Vect(
        x || Math.floor(Math.random() * (game.config.canvas.width - pad * 2)) + pad,
        y || Math.floor(Math.random() * (game.config.canvas.height - pad * 2)) + pad
    );
    let virusRadius = 48;
    let virusCirc = new game.shapes.Circ(virusRadius);
    let virus = new game.Entity('virus');
    virus.type = 'viruses';

    virus.attach(new game.abilities.Body(virusCirc, '#22c55e'));
    virus.attach(new game.abilities.Position(virusPos));
    virus.attach(new game.abilities.Collidable(true, true)); // Trigger & static
    virus.attach(new game.abilities.Mass(500));
    virus.attach(new game.abilities.Velocity());
    virus.attach(new game.abilities.Orientation());

    game.subSystems.collision.AddEntity(virus);
    game.subSystems.physics.AddEntity(virus);

    game.addEntity(virus, 'viruses');
    return virus;
}

module.exports = { createVirus };
