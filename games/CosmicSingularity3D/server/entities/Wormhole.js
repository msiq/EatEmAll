let wormholeId = 1;

/**
 * A gateway linking two galaxies. A black hole that touches one is moved to
 * the far end; its galaxy is re-derived from that new position, so no bounds
 * travel with the entity.
 */
function createWormhole(game, options) {
    const wh = {
        id: "WH" + wormholeId++,
        type: "wormhole",
        name: options.name || "Wormhole",
        x: options.x,
        y: options.y,
        radius: options.radius || 400,
        color: options.color || "#a855f7",
        destX: options.destX,
        destY: options.destY
    };

    if (!game.entities["wormholes"]) game.addEntityType("wormholes");

    game.entities["wormholes"].push(wh);
    return wh;
}

module.exports = { createWormhole };
