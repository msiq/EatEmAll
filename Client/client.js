const socket = io();
const loginModal = document.getElementById("menu");
const loginBtn = document.getElementById("login-btn");
const userNameInput = document.getElementById("user-name");
const canvas = document.getElementById("canvas");
const fpsBox = document.getElementById("current-fps");
const playerStats = document.getElementById("player-stats");
const hudName = document.getElementById("hud-name");
const hudScore = document.getElementById("hud-score");
const hudRadius = document.getElementById("hud-radius");
const hudHealth = document.getElementById("hud-health");
const leaderboardList = document.getElementById("leaderboard-list");

const cxt = canvas.getContext("2d");

let connected = false;
let player = null;
let currentOrigin = { x: 0, y: 0 };
let isMouseDown = false;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Handle login button & Enter key
loginBtn.addEventListener("click", joinGame);
userNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") joinGame();
});

function joinGame() {
    const name = userNameInput.value.trim() || "Player";
    socket.emit("letmeplay", {
        userName: name,
        oldId: localStorage.getItem("eeaid") || ""
    });
}

socket.on("play", (data) => {
    connected = true;
    player = data.player;
    if (player && player.id) {
        localStorage.setItem("eeaid", player.id);
    }
    loginModal.style.display = "none";
    playerStats.style.display = "flex";
    setupListeners();
});

socket.on("goaway", () => {
    connected = false;
    alert("Access denied by server.");
});

socket.on("tick", (raw) => {
    try {
        const data = JSON.parse(raw);
        update(data);
    } catch (e) {}
});

function setupListeners() {
    window.addEventListener("keydown", doKeyDown);
    canvas.addEventListener("mousedown", (e) => {
        isMouseDown = true;
        doMouse(e);
    });
    window.addEventListener("mouseup", () => {
        isMouseDown = false;
    });
    canvas.addEventListener("mousemove", doMouse);
}

function getMouseXY(evt) {
    const rect = canvas.getBoundingClientRect();
    const screenX = (evt.clientX - rect.left) * (canvas.width / rect.width);
    const screenY = (evt.clientY - rect.top) * (canvas.height / rect.height);
    return {
        x: screenX + currentOrigin.x,
        y: screenY + currentOrigin.y
    };
}

function doMouse(evt) {
    if (!connected || !player || !player.id) return;
    socket.emit("click", {
        playerId: player.id,
        action: "mousemove",
        params: { mouse: getMouseXY(evt) }
    });
}

function doKeyDown(evt) {
    if (!connected || !player || !player.id) return;
    if ([37, 38, 39, 40].includes(evt.keyCode)) {
        evt.preventDefault();
        socket.emit("input", {
            playerId: player.id,
            action: "keydown",
            params: { key: evt.keyCode }
        });
    }
}

function update(data) {
    if (!data.players) return;
    if (fpsBox && data.fps) fpsBox.textContent = data.fps;

    const allPlayers = data.players.players || [];
    const allDots = data.players.dots || [];

    // Find my player
    let me = null;
    if (player && player.id) {
        me = allPlayers.find(p => p.id === player.id);
    }

    // Update camera origin centered on player
    if (me) {
        let targetX = me.x - canvas.width / 2;
        let targetY = me.y - canvas.height / 2;
        if (canvas.width < 2000) {
            currentOrigin.x = Math.max(0, Math.min(2000 - canvas.width, targetX));
        } else {
            currentOrigin.x = (2000 - canvas.width) / 2;
        }
        if (canvas.height < 2000) {
            currentOrigin.y = Math.max(0, Math.min(2000 - canvas.height, targetY));
        } else {
            currentOrigin.y = (2000 - canvas.height) / 2;
        }

        // Update HUD
        if (hudName) hudName.textContent = me.name || "You";
        if (hudScore) hudScore.textContent = me.score !== "nono" ? me.score : 0;
        if (hudRadius) hudRadius.textContent = me.radius ? Math.round(me.radius) : 20;
        if (hudHealth) {
            let hp = me.health !== "nono" ? me.health : 100;
            hudHealth.style.width = Math.max(0, Math.min(100, hp)) + "%";
        }
    }

    // Update Leaderboard
    if (leaderboardList && allPlayers.length > 0) {
        const sorted = allPlayers.slice().sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);
        let itemsHtml = "";
        for (let i = 0; i < sorted.length; i++) {
            const p = sorted[i];
            const isMe = me && p.id === me.id;
            itemsHtml += "<li class=\"" + (isMe ? "self" : "") + "\"><span>" + (i + 1) + ". " + (p.name || "Player") + "</span><span>" + (p.score || 0) + "</span></li>";
        }
        leaderboardList.innerHTML = itemsHtml;
    }

    // Begin Rendering
    cxt.clearRect(0, 0, canvas.width, canvas.height);

    cxt.save();
    cxt.translate(-currentOrigin.x, -currentOrigin.y);

    // Draw Grid Lines (0..2000)
    cxt.lineWidth = 1;
    cxt.strokeStyle = "rgba(255, 255, 255, 0.06)";
    cxt.beginPath();
    for (let x = 0; x <= 2000; x += 100) {
        cxt.moveTo(x, 0);
        cxt.lineTo(x, 2000);
    }
    for (let y = 0; y <= 2000; y += 100) {
        cxt.moveTo(0, y);
        cxt.lineTo(2000, y);
    }
    cxt.stroke();

    // Draw World Boundary Border
    cxt.lineWidth = 6;
    cxt.strokeStyle = "#ef4444";
    cxt.strokeRect(0, 0, 2000, 2000);

    // Render Dots
    allDots.forEach(dot => {
        const rad = dot.radius || 7;
        cxt.beginPath();
        cxt.arc(dot.x, dot.y, rad, 0, Math.PI * 2);
        cxt.fillStyle = dot.color || "#00bcd4";
        cxt.fill();
    });

    // Render Players
    allPlayers.forEach(p => {
        const rad = p.radius || 20;
        const isMe = me && p.id === me.id;

        // Player Circle
        cxt.beginPath();
        cxt.arc(p.x, p.y, rad, 0, Math.PI * 2);
        cxt.fillStyle = p.color || (isMe ? "#38ef7d" : "#4facfe");
        cxt.fill();

        cxt.lineWidth = isMe ? 4 : 2.5;
        cxt.strokeStyle = isMe ? "#ffffff" : "rgba(255, 255, 255, 0.7)";
        cxt.stroke();

        // Direction Indicator Line
        if (p.dir && (p.dir.x !== 0 || p.dir.y !== 0)) {
            cxt.beginPath();
            cxt.moveTo(p.x, p.y);
            cxt.lineTo(p.x + p.dir.x * 1.3, p.y + p.dir.y * 1.3);
            cxt.strokeStyle = "rgba(0, 0, 0, 0.4)";
            cxt.lineWidth = 3;
            cxt.stroke();
        }

        // Name & Score Label
        let fontSize = Math.max(12, Math.min(18, rad * 0.45));
        cxt.font = "600 " + fontSize + "px Outfit, sans-serif";
        cxt.textAlign = "center";
        cxt.fillStyle = "#ffffff";
        cxt.shadowColor = "rgba(0, 0, 0, 0.8)";
        cxt.shadowBlur = 4;
        cxt.fillText(p.name || "Player", p.x, p.y + (fontSize * 0.35));
        cxt.shadowBlur = 0;
    });

    cxt.restore();
}
