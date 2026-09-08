let wormholeId = 1;

function createWormhole(game, config) {
    // Config should contain { x, y, destX, destY, destBounds }
    const wh = {
        id: "WH" + wormholeId++,
        type: "wormhole",
        name: config.name || "Wormhole",
        x: config.x,
        y: config.y,
        radius: 60,
        destX: config.destX,
        destY: config.destY,
        destBounds: config.destBounds
    };

    if (!game.entities["wormholes"]) {
        game.addEntityType("wormholes");
    }
    
    game.entities["wormholes"].push(wh);
    return wh;
}

module.exports = { createWormhole };

