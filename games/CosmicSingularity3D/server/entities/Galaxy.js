let galaxyId = 1;

/**
 * The galaxy itself, published as an entity purely so the client receives the
 * exact arm geometry the server spawned against. Immutable once created.
 */
function createGalaxy(game, g) {
    const entity = {
        id: "GAL" + galaxyId++,
        type: "galaxy",
        name: g.name,
        x: g.x,
        y: g.y,
        radius: g.radius,
        palette: g.palette || "amber",
        arms: g.arms,
        twist: g.twist,
        seed: g.seed
    };

    if (!game.entities["galaxies"]) game.addEntityType("galaxies");
    game.entities["galaxies"].push(entity);
    return entity;
}

module.exports = { createGalaxy };
