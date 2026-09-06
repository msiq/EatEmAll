const path = require("path");
const { Game } = require("./engine");

const gameName = process.argv[2] || process.env.GAME || "EatEmAll";
const cartridgePath = path.join(__dirname, "games", gameName);

let Cartridge;
try {
    Cartridge = require(cartridgePath);
} catch (err) {
    console.error(`[Server] Failed to load cartridge '${gameName}':`, err);
    process.exit(1);
}

const config = Cartridge.config || {
    canvas: { width: 2000, height: 2000 },
    fps: 30
};

const game = new Game(config);
const cartridge = new Cartridge(game);

game.setup = function() {
    cartridge.init();
};

game.joinGame = function(data) {
    return cartridge.onPlayerJoin(data.socketId, data);
};

const port = process.env.PORT || 4444;
const clientDir = Cartridge.clientDir || path.join(__dirname, "games", gameName, "client");
const visualsPath = Cartridge.visualsPath || path.join(__dirname, "games", gameName, "visuals.js");

game.start({
    port,
    clientDir,
    cartridgeDir: cartridgePath,
    visualsPath,
    gameName
});

console.log("======================================================");
console.log(`[Server] 🎮 Loaded Cartridge: ${Cartridge.config ? Cartridge.config.name : gameName}`);
console.log(`[Server] 🌐 Server running at: http://localhost:${port}`);
console.log("======================================================");
