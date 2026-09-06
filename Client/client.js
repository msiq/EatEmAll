const socket = io();
const loginModal = document.getElementById("menu");
const loginBtn = document.getElementById("login-btn");
const userNameInput = document.getElementById("user-name");
const gameOverModal = document.getElementById("game-over-modal");
const killerName = document.getElementById("killer-name");
const deathScore = document.getElementById("death-final-score");
const deathRadius = document.getElementById("death-final-radius");
const respawnBtn = document.getElementById("respawn-btn");
const soundBtn = document.getElementById("sound-btn");
const soundIcon = document.getElementById("sound-icon");
const settingsBtn = document.getElementById("settings-btn");
const soundSettingsModal = document.getElementById("sound-settings-modal");
const closeSettingsBtn = document.getElementById("close-settings-btn");
const volumeSlider = document.getElementById("volume-slider");
const volumeVal = document.getElementById("volume-val");
const soundOptBtns = document.querySelectorAll(".sound-opt-btn");
const toggleBounces = document.getElementById("toggle-bounces");
const toggleChomps = document.getElementById("toggle-chomps");
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
let lastMouseSendTime = 0;
let listenersInitialized = false;
let lastMyScore = null;

// Client-side interpolation state
const renderedPlayers = new Map();
const renderedDots = new Map();

// Frame timing & FPS tracking
let lastFrameTime = performance.now();
let frameCount = 0;
let fpsLastTime = performance.now();
let clientFps = 60;
let serverFps = 30;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Setup sound toggle button
if (soundBtn && window.soundManager) {
    soundIcon.textContent = window.soundManager.isMuted() ? "🔇" : "🔊";
    soundBtn.addEventListener("click", () => {
        const isMuted = window.soundManager.toggleMute();
        soundIcon.textContent = isMuted ? "🔇" : "🔊";
    });
}

// Setup audio preferences modal
if (settingsBtn && soundSettingsModal) {
    settingsBtn.addEventListener("click", () => {
        if (window.soundManager) window.soundManager.init();
        soundSettingsModal.style.display = soundSettingsModal.style.display === "none" ? "flex" : "none";
    });
}

if (closeSettingsBtn && soundSettingsModal) {
    closeSettingsBtn.addEventListener("click", () => {
        soundSettingsModal.style.display = "none";
    });
}

// Sync volume slider
if (volumeSlider && window.soundManager) {
    const currentVol = Math.round(window.soundManager.getVolume() * 100);
    volumeSlider.value = currentVol;
    if (volumeVal) volumeVal.textContent = currentVol + "%";

    volumeSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        if (volumeVal) volumeVal.textContent = val + "%";
        window.soundManager.setVolume(val / 100);
    });
}

// Sync dot sound style options
if (soundOptBtns && soundOptBtns.length > 0 && window.soundManager) {
    const currentStyle = window.soundManager.getDotStyle();
    soundOptBtns.forEach((btn) => {
        if (btn.dataset.style === currentStyle) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }

        btn.addEventListener("click", () => {
            soundOptBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const style = btn.dataset.style;
            window.soundManager.setDotStyle(style);
            window.soundManager.previewDotStyle(style);
        });
    });
}

// Sync effect toggles
if (toggleBounces && window.soundManager) {
    toggleBounces.checked = window.soundManager.isBouncesEnabled();
    toggleBounces.addEventListener("change", (e) => {
        window.soundManager.setBouncesEnabled(e.target.checked);
    });
}

if (toggleChomps && window.soundManager) {
    toggleChomps.checked = window.soundManager.isChompsEnabled();
    toggleChomps.addEventListener("change", (e) => {
        window.soundManager.setChompsEnabled(e.target.checked);
    });
}

// Handle login button & Enter key
loginBtn.addEventListener("click", joinGame);
userNameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") joinGame();
});

if (respawnBtn) {
    respawnBtn.addEventListener("click", respawnPlayer);
}

function joinGame() {
    if (window.soundManager) window.soundManager.init();
    const name = userNameInput.value.trim() || "Player";
    socket.emit("letmeplay", {
        userName: name,
        oldId: localStorage.getItem("eeaid") || ""
    });
}

function respawnPlayer() {
    if (window.soundManager) window.soundManager.init();
    if (gameOverModal) gameOverModal.style.display = "none";
    const name = userNameInput.value.trim() || (player && player.name) || "Player";
    socket.emit("letmeplay", {
        userName: name,
        oldId: localStorage.getItem("eeaid") || ""
    });
}

socket.on("play", (data) => {
    connected = true;
    player = data.player;
    lastMyScore = null;

    if (player && player.id) {
        localStorage.setItem("eeaid", player.id);
    }
    if (loginModal) loginModal.style.display = "none";
    if (gameOverModal) gameOverModal.style.display = "none";
    if (playerStats) playerStats.style.display = "flex";

    // Play spawn chime
    if (window.soundManager) window.soundManager.playSpawn();

    // Snap camera origin immediately to spawn location
    let spawnX = null;
    let spawnY = null;
    if (player && player.abilities && player.abilities.position && player.abilities.position.pos) {
        spawnX = player.abilities.position.pos.x;
        spawnY = player.abilities.position.pos.y;
    } else if (player && player.x !== undefined && player.y !== undefined) {
        spawnX = player.x;
        spawnY = player.y;
    }

    if (spawnX !== null && spawnY !== null) {
        let targetX = spawnX - canvas.width / 2;
        let targetY = spawnY - canvas.height / 2;
        currentOrigin.x = Math.max(0, Math.min(2000 - canvas.width, targetX));
        currentOrigin.y = Math.max(0, Math.min(2000 - canvas.height, targetY));
    }

    setupListeners();
});

// Human player eaten event
socket.on("gameover", (data) => {
    connected = false;
    player = null;
    lastMyScore = null;

    if (window.soundManager) window.soundManager.playGameOver();

    if (playerStats) playerStats.style.display = "none";
    if (killerName) killerName.textContent = data.eatenBy || "A Predator";
    if (deathScore) deathScore.textContent = data.score !== undefined ? data.score : 0;
    if (deathRadius) deathRadius.textContent = data.radius !== undefined ? data.radius : 20;

    if (gameOverModal) {
        gameOverModal.style.display = "flex";
    }
});

socket.on("goaway", () => {
    connected = false;
    alert("Access denied by server.");
});

socket.on("tick", (raw) => {
    try {
        const data = JSON.parse(raw);
        onServerTick(data);
    } catch (e) {}
});

function setupListeners() {
    if (listenersInitialized) return;
    listenersInitialized = true;

    window.addEventListener("keydown", doKeyDown);
    canvas.addEventListener("mousedown", (e) => {
        if (window.soundManager) window.soundManager.init();
        isMouseDown = true;
        sendMousePosition(e);
    });
    window.addEventListener("mouseup", () => {
        isMouseDown = false;
    });
    canvas.addEventListener("mousemove", (e) => {
        sendMousePosition(e);
    });
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

function sendMousePosition(evt) {
    if (!connected || !player || !player.id) return;
    const now = performance.now();
    if (now - lastMouseSendTime < 25) return; // throttle to ~40Hz
    lastMouseSendTime = now;

    socket.emit("click", {
        playerId: player.id,
        action: "mousemove",
        params: { mouse: getMouseXY(evt) }
    });
}

function doKeyDown(evt) {
    if (window.soundManager) window.soundManager.init();

    // Close settings modal on Escape
    if (evt.keyCode === 27 && soundSettingsModal && soundSettingsModal.style.display !== "none") {
        soundSettingsModal.style.display = "none";
        return;
    }

    // Quick respawn shortcut on Enter or Space when game over modal is active
    if (gameOverModal && gameOverModal.style.display !== "none") {
        if (evt.keyCode === 13 || evt.keyCode === 32) {
            evt.preventDefault();
            respawnPlayer();
            return;
        }
    }

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

function onServerTick(data) {
    if (!data.players) return;
    if (data.fps) serverFps = data.fps;

    const serverPlayers = data.players.players || [];
    const serverDots = data.players.dots || [];

    // Track active players
    const activePlayerIds = new Set();
    for (let i = 0; i < serverPlayers.length; i++) {
        const sp = serverPlayers[i];
        activePlayerIds.add(sp.id);

        const targetRad = sp.radius || 20;
        let rp = renderedPlayers.get(sp.id);

        if (!rp) {
            rp = {
                id: sp.id,
                x: sp.x,
                y: sp.y,
                targetX: sp.x,
                targetY: sp.y,
                radius: targetRad,
                targetRadius: targetRad,
                name: sp.name || "Player",
                color: sp.color,
                score: sp.score !== "nono" ? sp.score : 0,
                health: sp.health !== "nono" ? sp.health : 100,
                dir: sp.dir || { x: 0, y: 0 }
            };
            renderedPlayers.set(sp.id, rp);
        } else {
            rp.targetX = sp.x;
            rp.targetY = sp.y;
            rp.targetRadius = targetRad;
            rp.name = sp.name || rp.name;
            rp.color = sp.color || rp.color;
            rp.score = sp.score !== "nono" ? sp.score : rp.score;
            rp.health = sp.health !== "nono" ? sp.health : rp.health;
            rp.dir = sp.dir || rp.dir;

            // Teleport threshold: if distance > 400px (e.g. respawn), snap immediately
            const dist = Math.hypot(rp.targetX - rp.x, rp.targetY - rp.y);
            if (dist > 400) {
                rp.x = rp.targetX;
                rp.y = rp.targetY;
                rp.radius = targetRad;
            }
        }
    }

    // Prune disconnected players
    for (const id of renderedPlayers.keys()) {
        if (!activePlayerIds.has(id)) {
            renderedPlayers.delete(id);
        }
    }

    // Track active dots
    const activeDotIds = new Set();
    for (let i = 0; i < serverDots.length; i++) {
        const sd = serverDots[i];
        activeDotIds.add(sd.id);

        let rd = renderedDots.get(sd.id);
        if (!rd) {
            renderedDots.set(sd.id, {
                id: sd.id,
                x: sd.x,
                y: sd.y,
                targetX: sd.x,
                targetY: sd.y,
                radius: sd.radius || 7,
                color: sd.color || "#00bcd4"
            });
        } else {
            const dDist = Math.hypot(sd.x - rd.x, sd.y - rd.y);
            if (dDist > 50) {
                rd.x = sd.x;
                rd.y = sd.y;
            }
            rd.targetX = sd.x;
            rd.targetY = sd.y;
            rd.color = sd.color || rd.color;
        }
    }

    for (const id of renderedDots.keys()) {
        if (!activeDotIds.has(id)) {
            renderedDots.delete(id);
        }
    }

    // Update HUD & Leaderboard
    let me = null;
    if (player && player.id) {
        me = renderedPlayers.get(player.id);
    }

    if (me) {
        if (hudName) hudName.textContent = me.name || "You";
        if (hudScore) hudScore.textContent = me.score;
        if (hudRadius) hudRadius.textContent = Math.round(me.radius);
        if (hudHealth) hudHealth.style.width = Math.max(0, Math.min(100, me.health)) + "%";

        // Sound triggers on score increase
        if (lastMyScore !== null && me.score > lastMyScore && window.soundManager) {
            const diff = me.score - lastMyScore;
            if (diff <= 20) {
                window.soundManager.playDotSound(me.radius || 20);
            } else {
                window.soundManager.playChomp();
            }
        }
        lastMyScore = me.score;
    }

    // Handle tick events (bounces & chomps)
    if (data.events && Array.isArray(data.events) && player && player.id && window.soundManager) {
        for (let i = 0; i < data.events.length; i++) {
            const ev = data.events[i];
            if (ev.type === "bounce") {
                if (ev.p1 === player.id || ev.p2 === player.id) {
                    window.soundManager.playBounce();
                }
            } else if (ev.type === "chomp") {
                if (ev.predator === player.id) {
                    window.soundManager.playChomp();
                }
            }
        }
    }

    if (leaderboardList && renderedPlayers.size > 0) {
        const sorted = Array.from(renderedPlayers.values())
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 5);

        let itemsHtml = "";
        for (let i = 0; i < sorted.length; i++) {
            const p = sorted[i];
            const isMe = me && p.id === me.id;
            itemsHtml += '<li class="' + (isMe ? 'self' : '') + '"><span>' + (i + 1) + '. ' + (p.name || 'Player') + '</span><span>' + (p.score || 0) + '</span></li>';
        }
        leaderboardList.innerHTML = itemsHtml;
    }
}

// Decoupled 60-144 FPS Rendering Loop with Linear/Exponential Interpolation
function render(timestamp) {
    const dt = Math.min((timestamp - lastFrameTime) / 1000, 0.1);
    lastFrameTime = timestamp;

    // Track client rendering FPS
    frameCount++;
    if (timestamp - fpsLastTime >= 500) {
        clientFps = Math.round((frameCount * 1000) / (timestamp - fpsLastTime));
        frameCount = 0;
        fpsLastTime = timestamp;
        if (fpsBox) {
            fpsBox.textContent = clientFps + " (" + serverFps + " tick)";
        }
    }

    const posLerp = 1.0 - Math.exp(-22 * dt);
    const radLerp = 1.0 - Math.exp(-12 * dt);

    // Interpolate players
    for (const p of renderedPlayers.values()) {
        p.x += (p.targetX - p.x) * posLerp;
        p.y += (p.targetY - p.y) * posLerp;
        p.radius += (p.targetRadius - p.radius) * radLerp;
    }

    // Camera follow with smooth damping
    let me = null;
    if (player && player.id) {
        me = renderedPlayers.get(player.id);
    }

    if (me) {
        let targetCamX = me.x - canvas.width / 2;
        let targetCamY = me.y - canvas.height / 2;

        if (canvas.width < 2000) {
            targetCamX = Math.max(0, Math.min(2000 - canvas.width, targetCamX));
        } else {
            targetCamX = (2000 - canvas.width) / 2;
        }

        if (canvas.height < 2000) {
            targetCamY = Math.max(0, Math.min(2000 - canvas.height, targetCamY));
        } else {
            targetCamY = (2000 - canvas.height) / 2;
        }

        const camLerp = 1.0 - Math.exp(-14 * dt);
        currentOrigin.x += (targetCamX - currentOrigin.x) * camLerp;
        currentOrigin.y += (targetCamY - currentOrigin.y) * camLerp;
    }

    // Render Scene
    cxt.clearRect(0, 0, canvas.width, canvas.height);

    cxt.save();
    cxt.translate(-Math.round(currentOrigin.x), -Math.round(currentOrigin.y));

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

    // World Boundary Border
    cxt.lineWidth = 6;
    cxt.strokeStyle = "#ef4444";
    cxt.strokeRect(0, 0, 2000, 2000);

    // Render Dots
    for (const dot of renderedDots.values()) {
        cxt.beginPath();
        cxt.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        cxt.fillStyle = dot.color;
        cxt.fill();
    }

    // Render Players
    for (const p of renderedPlayers.values()) {
        const isMe = me && p.id === me.id;

        // Player Circle
        cxt.beginPath();
        cxt.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        cxt.fillStyle = p.color || (isMe ? "#38ef7d" : "#4facfe");
        cxt.fill();

        cxt.lineWidth = isMe ? 4 : 2.5;
        cxt.strokeStyle = isMe ? "#ffffff" : "rgba(255, 255, 255, 0.75)";
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
        const fontSize = Math.max(12, Math.min(18, p.radius * 0.45));
        cxt.font = "600 " + fontSize + "px Outfit, sans-serif";
        cxt.textAlign = "center";
        cxt.fillStyle = "#ffffff";
        cxt.shadowColor = "rgba(0, 0, 0, 0.85)";
        cxt.shadowBlur = 4;
        cxt.fillText(p.name || "Player", p.x, p.y + (fontSize * 0.35));
        cxt.shadowBlur = 0;
    }

    cxt.restore();

    requestAnimationFrame(render);
}

// Start decoupled render loop
requestAnimationFrame(render);