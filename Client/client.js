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
const renderedViruses = new Map();

// Visual effects state
let screenShakeTime = 0;
let screenShakeIntensity = 0;
const shockwaves = [];
const particles = [];

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

    // Load initial full dots snapshot on join (sent once)
    if (data.dots && Array.isArray(data.dots)) {
        renderedDots.clear();
        for (let i = 0; i < data.dots.length; i++) {
            const d = data.dots[i];
            renderedDots.set(d.id, {
                id: d.id,
                x: d.x,
                y: d.y,
                targetX: d.x,
                targetY: d.y,
                radius: d.radius || 7,
                color: d.color || "#00bcd4"
            });
        }
    }

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

    // Toggle Max FPS shortcut on key 'F' or 'U'
    if (evt.key === 'f' || evt.key === 'F' || evt.key === 'u' || evt.key === 'U') {
        if (!document.activeElement || document.activeElement.tagName !== 'INPUT') {
            toggleMaxFps();
            return;
        }
    }

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

    // Track active viruses
    const serverViruses = (data.players && data.players.viruses) || [];
    const activeVirusIds = new Set();
    for (let i = 0; i < serverViruses.length; i++) {
        const sv = serverViruses[i];
        activeVirusIds.add(sv.id);

        let rv = renderedViruses.get(sv.id);
        if (!rv) {
            renderedViruses.set(sv.id, {
                id: sv.id,
                x: sv.x,
                y: sv.y,
                targetX: sv.x,
                targetY: sv.y,
                radius: sv.radius || 48,
                rot: Math.random() * Math.PI * 2
            });
        } else {
            rv.targetX = sv.x;
            rv.targetY = sv.y;
            rv.radius = sv.radius || 48;
        }
    }
    for (const id of renderedViruses.keys()) {
        if (!activeVirusIds.has(id)) {
            renderedViruses.delete(id);
        }
    }

    // High-Performance Optimization: Process delta dots update
    if (data.dotsDelta && Array.isArray(data.dotsDelta)) {
        for (let i = 0; i < data.dotsDelta.length; i++) {
            const dd = data.dotsDelta[i];
            let rd = renderedDots.get(dd.id);
            if (!rd) {
                renderedDots.set(dd.id, {
                    id: dd.id,
                    x: dd.x,
                    y: dd.y,
                    targetX: dd.x,
                    targetY: dd.y,
                    radius: dd.radius || 7,
                    color: dd.color
                });
            } else {
                rd.x = dd.x;
                rd.y = dd.y;
                rd.targetX = dd.x;
                rd.targetY = dd.y;
                rd.color = dd.color;
            }
        }
    } else if (serverDots && serverDots.length > 0) {
        // Fallback for full snapshots
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
            } else if (ev.type === "virus_pop") {
                if (window.soundManager) {
                    window.soundManager.playVirusPop();
                }
                screenShakeTime = 0.35;
                screenShakeIntensity = 14;

                shockwaves.push({
                    x: ev.x,
                    y: ev.y,
                    radius: ev.radius || 45,
                    maxRadius: (ev.radius || 45) * 2.6,
                    life: 1.0
                });

                for (let p = 0; p < 18; p++) {
                    const pAngle = (p / 18) * Math.PI * 2 + Math.random() * 0.25;
                    const pSpeed = 70 + Math.random() * 150;
                    particles.push({
                        x: ev.x,
                        y: ev.y,
                        vx: Math.cos(pAngle) * pSpeed,
                        vy: Math.sin(pAngle) * pSpeed,
                        life: 0.55,
                        maxLife: 0.55,
                        size: 3 + Math.random() * 4,
                        color: "#4ade80"
                    });
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

// Max Uncapped FPS Driver (MessageChannel zero-latency scheduler)
let uncappedFps = localStorage.getItem("eat_uncapped_fps") === "true";
const maxFpsBtn = document.getElementById("max-fps-btn");
const maxFpsLabel = document.getElementById("max-fps-label");
const maxFpsIcon = document.getElementById("max-fps-icon");

function updateMaxFpsUI() {
    if (maxFpsBtn) {
        if (uncappedFps) {
            maxFpsBtn.classList.add("active");
            if (maxFpsLabel) maxFpsLabel.textContent = "UNCAPPED";
            if (maxFpsIcon) maxFpsIcon.textContent = "🚀";
            if (fpsBox && fpsBox.parentElement) fpsBox.parentElement.classList.add("uncapped");
        } else {
            maxFpsBtn.classList.remove("active");
            if (maxFpsLabel) maxFpsLabel.textContent = "MAX FPS";
            if (maxFpsIcon) maxFpsIcon.textContent = "⚡";
            if (fpsBox && fpsBox.parentElement) fpsBox.parentElement.classList.remove("uncapped");
        }
    }
}

function toggleMaxFps() {
    uncappedFps = !uncappedFps;
    localStorage.setItem("eat_uncapped_fps", uncappedFps ? "true" : "false");
    updateMaxFpsUI();
    if (uncappedFps) {
        scheduleNextFrame();
    }
}

if (maxFpsBtn) {
    maxFpsBtn.addEventListener("click", toggleMaxFps);
}

// Paced High-Refresh Scheduler (Guarantees WebSockets, mouse inputs, and UI never freeze)
function scheduleNextFrame() {
    if (uncappedFps && !document.hidden) {
        // Cooperative yield via setTimeout so browser event loop, WebSockets, and mouse inputs remain 100% responsive
        setTimeout(() => {
            render(performance.now());
        }, 0);
    } else {
        requestAnimationFrame(render);
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

    // Interpolate viruses
    for (const v of renderedViruses.values()) {
        v.x += (v.targetX - v.x) * posLerp;
        v.y += (v.targetY - v.y) * posLerp;
        v.rot = (v.rot + dt * 0.35) % (Math.PI * 2);
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

    // Calculate Screen Shake
    let shakeX = 0;
    let shakeY = 0;
    if (screenShakeTime > 0) {
        screenShakeTime -= dt;
        const currentIntensity = screenShakeIntensity * Math.max(0, screenShakeTime / 0.35);
        shakeX = (Math.random() - 0.5) * currentIntensity * 2;
        shakeY = (Math.random() - 0.5) * currentIntensity * 2;
    }

    // Render Scene
    cxt.clearRect(0, 0, canvas.width, canvas.height);

    cxt.save();
    cxt.translate(-Math.round(currentOrigin.x + shakeX), -Math.round(currentOrigin.y + shakeY));

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

    // 1. Render Food Dots with Camera Viewport Culling
    const viewPad = 35;
    const viewLeft = currentOrigin.x - viewPad;
    const viewRight = currentOrigin.x + canvas.width + viewPad;
    const viewTop = currentOrigin.y - viewPad;
    const viewBottom = currentOrigin.y + canvas.height + viewPad;

    for (const dot of renderedDots.values()) {
        // Viewport Culling: Skip dots outside the visible camera view
        if (dot.x < viewLeft || dot.x > viewRight || dot.y < viewTop || dot.y > viewBottom) {
            continue;
        }
        cxt.beginPath();
        cxt.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        cxt.fillStyle = dot.color;
        cxt.fill();
    }

    // 2. Render Small Hiding Players (radius < 45px) beneath the viruses
    for (const p of renderedPlayers.values()) {
        if (p.radius < 45) {
            drawPlayerEntity(cxt, p, me && p.id === me.id);
        }
    }

    // 3. Render Spiky Green Viruses with Viewport Culling
    for (const v of renderedViruses.values()) {
        if (v.x < viewLeft - v.radius || v.x > viewRight + v.radius || v.y < viewTop - v.radius || v.y > viewBottom + v.radius) {
            continue;
        }
        drawVirus(cxt, v.x, v.y, v.radius, v.rot);
    }

    // 4. Render Large Players (radius >= 45px) above the viruses
    for (const p of renderedPlayers.values()) {
        if (p.radius >= 45) {
            drawPlayerEntity(cxt, p, me && p.id === me.id);
        }
    }

    // 5. Render Expanding Shockwaves
    for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.life -= dt * 2.2;
        if (sw.life <= 0) {
            shockwaves.splice(i, 1);
            continue;
        }
        const curR = sw.radius + (sw.maxRadius - sw.radius) * (1.0 - sw.life);
        cxt.beginPath();
        cxt.arc(sw.x, sw.y, curR, 0, Math.PI * 2);
        cxt.strokeStyle = "rgba(74, 222, 128, " + (sw.life * 0.85) + ")";
        cxt.lineWidth = 4 * sw.life;
        cxt.stroke();
    }

    // 6. Render Burst Particles
    for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.life -= dt;
        if (pt.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vx *= 0.94;
        pt.vy *= 0.94;
        const alpha = Math.max(0, pt.life / pt.maxLife);
        cxt.beginPath();
        cxt.arc(pt.x, pt.y, pt.size * alpha, 0, Math.PI * 2);
        cxt.fillStyle = "rgba(34, 197, 94, " + alpha + ")";
        cxt.fill();
    }

    cxt.restore();

    scheduleNextFrame();
}

// Start decoupled render loop
updateMaxFpsUI();
scheduleNextFrame();
// Draw an individual player entity
function drawPlayerEntity(ctx, p, isMe) {
    // Player Circle
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color || (isMe ? "#38ef7d" : "#4facfe");
    ctx.fill();

    ctx.lineWidth = isMe ? 4 : 2.5;
    ctx.strokeStyle = isMe ? "#ffffff" : "rgba(255, 255, 255, 0.75)";
    ctx.stroke();

    // Direction Indicator Line
    if (p.dir && (p.dir.x !== 0 || p.dir.y !== 0)) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.dir.x * 1.3, p.y + p.dir.y * 1.3);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    // Name & Score Label
    const fontSize = Math.max(12, Math.min(18, p.radius * 0.45));
    ctx.font = "600 " + fontSize + "px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
    ctx.shadowBlur = 4;
    ctx.fillText(p.name || "Player", p.x, p.y + (fontSize * 0.35));
    ctx.shadowBlur = 0;
}

// Draw a spiky green hazard virus with saw-tooth spikes
function drawVirus(ctx, x, y, radius, rot) {
    const spikes = 16;
    const innerR = radius * 0.90;
    const outerR = radius * 1.08;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);

    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
        const angle = (i / (spikes * 2)) * Math.PI * 2;
        const r = (i % 2 === 0) ? outerR : innerR;
        const sx = Math.cos(angle) * r;
        const sy = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
    }
    ctx.closePath();

    // Vibrant green radial gradient
    const grad = ctx.createRadialGradient(0, 0, innerR * 0.15, 0, 0, outerR);
    grad.addColorStop(0, "#4ade80");
    grad.addColorStop(0.65, "#22c55e");
    grad.addColorStop(1, "#16a34a");
    ctx.fillStyle = grad;
    ctx.fill();

    // Spiky dark green outline
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = "#14532d";
    ctx.stroke();

    // Inner ring texture
    ctx.beginPath();
    ctx.arc(0, 0, innerR * 0.45, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(20, 83, 45, 0.4)";
    ctx.stroke();

    ctx.restore();
}
