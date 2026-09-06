const DOT_COLORS = [
    '#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6',
    '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6',
    '#10b981', '#22c55e', '#84cc16', '#eab308', '#f59e0b', '#f97316'
];

function createDot(game, x, y) {
    let pad = 20;
    let dotPos = new game.shapes.Vect(
        x || Math.floor(Math.random() * (game.config.canvas.width - pad * 2)) + pad,
        y || Math.floor(Math.random() * (game.config.canvas.height - pad * 2)) + pad
    );
    let dotCirc = new game.shapes.Circ(3.5);
    let dot = new game.Entity('dot');
    let color = DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)];

    dot.attach(new game.abilities.Body(dotCirc, color));
    dot.attach(new game.abilities.Position(dotPos));
    dot.attach(new game.abilities.Collidable(true, true)); // Trigger & static
    dot.attach(new game.abilities.Velocity());
    dot.attach(new game.abilities.Mass(10));
    dot.attach(new game.abilities.Orientation());

    game.subSystems.collision.AddEntity(dot);
    game.subSystems.physics.AddEntity(dot);
    game.subSystems.motion.AddEntity(dot);

    game.addEntity(dot, 'dots');
    return dot;
}

module.exports = { createDot, DOT_COLORS };
