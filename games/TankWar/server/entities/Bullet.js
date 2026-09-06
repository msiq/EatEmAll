let nextBulletId = 1;

function createBullet(game, options) {
    const bullet = new game.Entity("bullet");
    bullet.id = "b_" + (nextBulletId++) + "_" + Math.random().toString(36).substr(2, 4);
    bullet.name = "bullet";
    bullet.type = "bullets";
    bullet.ownerId = options.ownerId;
    bullet.ownerName = options.ownerName || "Tank";
    bullet.damage = options.damage || 25;
    bullet.lifetime = options.lifetime || 2.2;

    const angle = options.angle || 0;
    const speed = options.speed || 680;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    bullet.attach(new game.abilities.Position(new game.shapes.Vect(options.x, options.y)));
    bullet.attach(new game.abilities.Velocity(new game.shapes.Vect(vx, vy)));
    bullet.attach(new game.abilities.Body(new game.shapes.Circ(4.5), "#f97316"));
    bullet.attach(new game.abilities.Orientation(new game.shapes.Vect(Math.cos(angle), Math.sin(angle)), angle));

    game.addEntity(bullet, "bullets");
    return bullet;
}

module.exports = { createBullet };
