/**
 * EngineClient.js
 * Universal Client Runtime for the 2D/3D Multiplayer Game Engine.
 * Provides Camera, Interpolation, NetworkClient, InputManager, ParticleEngine,
 * AudioManager, and the central App Orchestrator.
 */
(function (global) {
    'use strict';

    // -------------------------------------------------------------
    // CAMERA: Viewport culling, follow, and world translation
    // -------------------------------------------------------------
    class Camera {
        constructor() {
            this.origin = { x: 0, y: 0 };
            this.viewportWidth = window.innerWidth;
            this.viewportHeight = window.innerHeight;
            this.zoom = 1.0;
        }

        updateDimensions(width, height) {
            this.viewportWidth = width;
            this.viewportHeight = height;
        }

        follow(target, lerpFactor = 0.12, worldW = 2000, worldH = 2000) {
            if (!target) return;
            const targetX = target.x - this.viewportWidth / 2;
            const targetY = target.y - this.viewportHeight / 2;
            const maxX = Math.max(0, worldW - this.viewportWidth);
            const maxY = Math.max(0, worldH - this.viewportHeight);

            const clampedX = Math.max(0, Math.min(maxX, targetX));
            const clampedY = Math.max(0, Math.min(maxY, targetY));

            this.origin.x += (clampedX - this.origin.x) * lerpFactor;
            this.origin.y += (clampedY - this.origin.y) * lerpFactor;
        }

        snap(target, worldW = 2000, worldH = 2000) {
            if (!target) return;
            const targetX = target.x - this.viewportWidth / 2;
            const targetY = target.y - this.viewportHeight / 2;
            this.origin.x = Math.max(0, Math.min(worldW - this.viewportWidth, targetX));
            this.origin.y = Math.max(0, Math.min(worldH - this.viewportHeight, targetY));
        }

        isVisible(x, y, radius = 25, padding = 60) {
            const left = this.origin.x - padding;
            const right = this.origin.x + this.viewportWidth + padding;
            const top = this.origin.y - padding;
            const bottom = this.origin.y + this.viewportHeight + padding;
            return x + radius >= left && x - radius <= right && y + radius >= top && y - radius <= bottom;
        }
    }

    // -------------------------------------------------------------
    // INTERPOLATOR: Snapshot buffer & smooth multi-entity lerping
    // -------------------------------------------------------------
    class Interpolator {
        constructor() {
            this.collections = new Map();
        }

        getCollection(type) {
            if (!this.collections.has(type)) {
                this.collections.set(type, new Map());
            }
            return this.collections.get(type);
        }

        syncType(type, serverEntities = []) {
            const col = this.getCollection(type);
            const activeIds = new Set();

            for (let i = 0; i < serverEntities.length; i++) {
                const s = serverEntities[i];
                activeIds.add(s.id);
                let ent = col.get(s.id);

                if (!ent) {
                    ent = Object.assign({}, s, {
                        x: s.x,
                        y: s.y,
                        targetX: s.x,
                        targetY: s.y,
                        radius: s.radius,
                        targetRadius: s.radius,
                        angle: s.angle || 0,
                        targetAngle: s.angle || 0
                    });
                    col.set(s.id, ent);
                } else {
                    ent.targetX = s.x;
                    ent.targetY = s.y;
                    if (s.radius !== undefined) ent.targetRadius = s.radius;
                    if (s.angle !== undefined) ent.targetAngle = s.angle;

                    // Copy updated game properties
                    Object.assign(ent, s);

                    // Teleport threshold: snap if distance > 400px
                    const dist = Math.hypot(ent.targetX - ent.x, ent.targetY - ent.y);
                    if (dist > 400) {
                        ent.x = ent.targetX;
                        ent.y = ent.targetY;
                    }
                }
            }

            // Prune deleted/dead entities
            for (const id of col.keys()) {
                if (!activeIds.has(id)) col.delete(id);
            }
        }

        lerpAll(speed = 0.18) {
            for (const col of this.collections.values()) {
                for (const ent of col.values()) {
                    if (ent.targetX !== undefined) ent.x += (ent.targetX - ent.x) * speed;
                    if (ent.targetY !== undefined) ent.y += (ent.targetY - ent.y) * speed;
                    if (ent.targetRadius !== undefined) ent.radius += (ent.targetRadius - ent.radius) * speed;
                    if (ent.targetAngle !== undefined) {
                        let diff = ent.targetAngle - ent.angle;
                        while (diff < -Math.PI) diff += Math.PI * 2;
                        while (diff > Math.PI) diff -= Math.PI * 2;
                        ent.angle += diff * speed;
                    }
                }
            }
        }
    }

    // -------------------------------------------------------------
    // INPUT MANAGER: Mouse, touch, keyboard, pointer tracking
    // -------------------------------------------------------------
    class InputManager {
        constructor(canvas, onInput, onClick, getPlayerScreenPos, transformDirection) {
            this.canvas = canvas;
            this.onInput = onInput;
            this.onClick = onClick;
            this.getPlayerScreenPos = getPlayerScreenPos;
            this.transformDirection = transformDirection;
            this.lastInput = { x: 0, y: 0, angle: 0, isThrusting: false };
            this.lastSendTime = 0;
            this.pointerPos = null;
            this.keys = new Set();
            this.init();
        }

        init() {
            const updatePointer = (clientX, clientY) => {
                const rect = this.canvas.getBoundingClientRect();
                this.pointerPos = {
                    x: clientX - rect.left,
                    y: clientY - rect.top
                };
                this.evaluateAndSend();
            };

            window.addEventListener('mousemove', (e) => updatePointer(e.clientX, e.clientY));
            window.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
            });
            window.addEventListener('touchstart', (e) => {
                if (e.touches.length > 0) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
            });

            this.canvas.addEventListener('mousedown', (e) => {
                if (this.onClick) this.onClick({ action: 'fire', clientX: e.clientX, clientY: e.clientY });
            });

            window.addEventListener('keydown', (e) => {
                this.keys.add(e.code);
                if (e.code === 'Space' && this.onClick) {
                    this.onClick({ action: 'action_space' });
                }
                this.evaluateAndSend();
            });
            window.addEventListener('keyup', (e) => {
                this.keys.delete(e.code);
                this.evaluateAndSend();
            });

            // Steady 30Hz ticker for continuous steering & input sync
            setInterval(() => {
                this.evaluateAndSend(true);
            }, 33);
        }

        evaluateAndSend(isTick = false) {
            let dx = 0;
            let dy = 0;
            let isThrusting = false;

            // 1. Keyboard Controls (WASD / Arrows)
            let keyDx = 0;
            let keyDy = 0;
            if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) keyDy -= 1;
            if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) keyDy += 1;
            if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) keyDx -= 1;
            if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) keyDx += 1;

            if (keyDx !== 0 || keyDy !== 0) {
                const len = Math.hypot(keyDx, keyDy);
                dx = keyDx / len;
                dy = keyDy / len;
                isThrusting = true;
            } else if (this.pointerPos) {
                // 2. Mouse / Pointer Controls relative to player screen position
                const rect = this.canvas.getBoundingClientRect();
                let originX = rect.width / 2;
                let originY = rect.height / 2;

                if (typeof this.getPlayerScreenPos === 'function') {
                    const pos = this.getPlayerScreenPos();
                    if (pos && pos.x !== undefined && pos.y !== undefined) {
                        originX = pos.x;
                        originY = pos.y;
                    }
                }

                const diffX = this.pointerPos.x - originX;
                const diffY = this.pointerPos.y - originY;
                const dist = Math.hypot(diffX, diffY);

                // Deadzone of 25px around player to allow coasting / staying still
                if (dist > 25) {
                    isThrusting = true;
                    const maxDist = Math.min(rect.width, rect.height) * 0.4 || 180;
                    const normDist = Math.min(1.0, (dist - 15) / maxDist);
                    const angle = Math.atan2(diffY, diffX);
                    dx = Math.cos(angle) * normDist;
                    dy = Math.sin(angle) * normDist;
                } else {
                    isThrusting = false;
                    dx = 0;
                    dy = 0;
                }
            }

            let sendDx = dx;
            let sendDy = dy;
            if (isThrusting && typeof this.transformDirection === "function") {
                const [tdx, tdy] = this.transformDirection(dx, dy);
                sendDx = tdx;
                sendDy = tdy;
            }
            const angle = Math.atan2(sendDy, sendDx);
            const now = performance.now();

            const changed = isThrusting !== this.lastInput.isThrusting ||
                            Math.abs(angle - this.lastInput.angle) > 0.05 ||
                            Math.hypot(dx - this.lastInput.x, dy - this.lastInput.y) > 0.05;

            if (changed || (isTick && isThrusting && (now - this.lastSendTime >= 33))) {
                this.lastSendTime = now;
                this.lastInput = { x: sendDx, y: sendDy, angle, isThrusting };
                if (this.onInput) {
                    this.onInput(this.lastInput);
                }
            }
        }
    }

    // -------------------------------------------------------------
    // PARTICLE ENGINE: Screen shake & particle bursts
    // -------------------------------------------------------------
    class ParticleEngine {
        constructor() {
            this.particles = [];
            this.shakeEnd = 0;
            this.shakeIntensity = 0;
        }

        burst(x, y, count = 16, color = '#38bdf8') {
            for (let i = 0; i < count; i++) {
                const ang = Math.random() * Math.PI * 2;
                const spd = 1.5 + Math.random() * 5;
                this.particles.push({
                    x, y,
                    vx: Math.cos(ang) * spd,
                    vy: Math.sin(ang) * spd,
                    radius: 2 + Math.random() * 3,
                    alpha: 1.0,
                    decay: 0.02 + Math.random() * 0.025,
                    color
                });
            }
        }

        shake(durationMs = 250, intensity = 6) {
            this.shakeEnd = performance.now() + durationMs;
            this.shakeIntensity = intensity;
        }

        applyShake(ctx) {
            if (performance.now() < this.shakeEnd) {
                const dx = (Math.random() - 0.5) * this.shakeIntensity * 2;
                const dy = (Math.random() - 0.5) * this.shakeIntensity * 2;
                ctx.translate(dx, dy);
            }
        }

        updateAndDraw(ctx) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.96;
                p.vy *= 0.96;
                p.alpha -= p.decay;

                if (p.alpha <= 0) {
                    this.particles.splice(i, 1);
                    continue;
                }
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }
    }

    // -------------------------------------------------------------
    // AUDIO MANAGER: Procedural Web Audio synthesizer
    // -------------------------------------------------------------
    class AudioManager {
        constructor() {
            this.ctx = null;
            this.enabled = true;
            this.volume = 0.6;
        }

        init() {
            if (!this.ctx && typeof AudioContext !== 'undefined') {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        playChime(freq = 440, duration = 0.15, type = 'sine') {
            if (!this.enabled || !this.ctx) return;
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + duration);

                gain.gain.setValueAtTime(this.volume * 0.3, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + duration);
            } catch (e) {}
        }

        playShot() {
            if (!this.enabled || !this.ctx) return;
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(320, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);

                gain.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.12);
            } catch (e) {}
        }

        playExplosion() {
            if (!this.enabled || !this.ctx) return;
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(140, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.3);

                gain.gain.setValueAtTime(this.volume * 0.5, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.3);
            } catch (e) {}
        }
    }

    // -------------------------------------------------------------
    // NETWORK CLIENT: Native WebSocket with auto-reconnect
    // -------------------------------------------------------------
    class NetworkClient {
        constructor(url) {
            this.url = url || this.getDefaultUrl();
            this.ws = null;
            this.listeners = new Map();
            this.reconnectAttempts = 0;
            this.maxReconnectAttempts = 20;
            this.reconnectDelay = 1500;
            this.isConnected = false;
            this.connect();
        }

        getDefaultUrl() {
            if (typeof window !== 'undefined' && window.location) {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                return `${protocol}//${window.location.host}/ws`;
            }
            return 'ws://localhost:4444/ws';
        }

        connect() {
            try {
                this.ws = new WebSocket(this.url);

                this.ws.onopen = () => {
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.emitLocal('connect');
                };

                this.ws.onclose = () => {
                    this.isConnected = false;
                    this.emitLocal('disconnect');
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        this.reconnectAttempts++;
                        setTimeout(() => this.connect(), this.reconnectDelay);
                    }
                };

                this.ws.onerror = (err) => this.emitLocal('error', err);

                this.ws.onmessage = (event) => {
                    try {
                        const parsed = JSON.parse(event.data);
                        if (parsed && parsed.event) {
                            this.emitLocal(parsed.event, parsed.data);
                        }
                    } catch (e) {}
                };
            } catch (err) {
                setTimeout(() => this.connect(), this.reconnectDelay);
            }
        }

        on(event, handler) {
            if (!this.listeners.has(event)) this.listeners.set(event, []);
            this.listeners.get(event).push(handler);
        }

        emit(event, data) {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ event, data }));
            }
        }

        emitLocal(event, data) {
            const handlers = this.listeners.get(event);
            if (handlers) {
                for (let i = 0; i < handlers.length; i++) handlers[i](data);
            }
        }
    }

    // -------------------------------------------------------------
    // UNIVERSAL ENGINE APP ORCHESTRATOR
    // -------------------------------------------------------------
    class App {
        constructor(options = {}) {
            this.visuals = options.visuals || window.CartridgeVisuals || {};
            this.container = options.container || document.body;

            // 1. Core subsystems
            this.camera = new Camera();
            this.interpolator = new Interpolator();
            this.particles = new ParticleEngine();
            this.audio = new AudioManager();
            this.net = new NetworkClient();

            // 2. Pluggable Renderer initialization (Canvas2D or WebGL3D)
            const rType = (this.visuals && this.visuals.rendererType) || "canvas2d";
            let RendererClass = (global.EngineClient && global.EngineClient.Canvas2DRenderer) || class {};
            if (rType === "webgl3d" && global.EngineClient && global.EngineClient.WebGL3DRenderer) {
                RendererClass = global.EngineClient.WebGL3DRenderer;
            }
            this.renderer = new RendererClass();
            this.canvas = this.renderer.init(this.container, {
                backdrop: this.visuals.backdrop
            });

            // 3. Game state
            this.myPlayerId = null;
            this.lastMyScore = null;
            this.fps = 0;
            this.fpsLastTime = performance.now();
            this.fpsCount = 0;
            this.isPlaying = false;

            // 4. Input wiring
            this.input = new InputManager(
                this.canvas,
                (inputData) => this.net.emit('input', inputData),
                (clickData) => {
                    this.audio.init();
                    this.net.emit('click', clickData);
                },
                () => {
                    const p = this.getMyPlayer();
                    if (p) {
                        if (this.renderer && typeof this.renderer.worldToScreen === 'function') {
                            const screenPos = this.renderer.worldToScreen(p.x, p.y);
                            if (screenPos) return screenPos;
                        }
                        if (this.camera && this.camera.origin) {
                            return {
                                x: p.x - this.camera.origin.x,
                                y: p.y - this.camera.origin.y
                            };
                        }
                    }
                    return null;
                },
                (dx, dy) => {
                    if (this.renderer && typeof this.renderer.transformInputDirection === 'function') {
                        return this.renderer.transformInputDirection(dx, dy);
                    }
                    return [dx, dy];
                }
            );

            // 5. Network bindings
            this.setupNetwork();

            // 6. Window resize
            window.addEventListener('resize', () => {
                const w = window.innerWidth;
                const h = window.innerHeight;
                this.renderer.resize(w, h);
                this.camera.updateDimensions(w, h);
            });
            this.camera.updateDimensions(window.innerWidth, window.innerHeight);

            // 7. Start render loop
            this.startLoop();
        }

        setupNetwork() {
            this.net.on('play', (data) => {
                this.audio.init();
                this.isPlaying = true;
                const p = data.player;
                if (p && p.id) {
                    this.myPlayerId = p.id;
                    localStorage.setItem('engine_pid', p.id);
                    this.camera.snap(p, (this.visuals.world && this.visuals.world.width) || 2000, (this.visuals.world && this.visuals.world.height) || 2000);
                }

                // Initial static layer sync (e.g. dots)
                if (data.dots && Array.isArray(data.dots)) {
                    this.interpolator.syncType('dots', data.dots);
                }

                // Any other layer the cartridge marked static: sent in full once
                // here, then only as deltas on each tick.
                if (data.staticLayers && typeof data.staticLayers === 'object') {
                    Object.keys(data.staticLayers).forEach(layer => {
                        if (layer === 'dots') return;
                        this.interpolator.syncType(layer, data.staticLayers[layer] || []);
                    });
                }

                const loginModal = document.getElementById('login-modal');
                const deathModal = document.getElementById('death-modal');
                const hudOverlay = document.getElementById('hud-overlay');

                if (loginModal) loginModal.style.display = 'none';
                if (deathModal) deathModal.style.display = 'none';
                if (hudOverlay) hudOverlay.style.display = 'flex';
            });

            this.net.on('tick', (data) => {
                if (!data) return;
                const playersData = data.players || {};

                // Sync each entity layer from tick
                Object.keys(playersData).forEach(type => {
                    this.interpolator.syncType(type, playersData[type] || []);
                });

                // Delta layers (e.g. dots delta)
                if (data.dotsDelta && Array.isArray(data.dotsDelta)) {
                    const dotsCol = this.interpolator.getCollection('dots');
                    data.dotsDelta.forEach(d => {
                        dotsCol.set(d.id, d);
                    });
                }

                // Deltas for every other static layer. An entry marked remove
                // deletes it; anything else is an insert or a move.
                if (data.staticDelta && typeof data.staticDelta === 'object') {
                    Object.keys(data.staticDelta).forEach(layer => {
                        const col = this.interpolator.getCollection(layer);
                        (data.staticDelta[layer] || []).forEach(d => {
                            if (d.remove) { col.delete(d.id); return; }
                            // Merge rather than replace: a delta may carry only
                            // the fields that actually changed, so a mostly
                            // static entity can send one number instead of all
                            // of itself. Lerp targets are seeded only for the
                            // fields present.
                            const ent = Object.assign({}, col.get(d.id) || {}, d);
                            if (d.x !== undefined) ent.targetX = d.x;
                            if (d.y !== undefined) ent.targetY = d.y;
                            if (d.radius !== undefined) ent.targetRadius = d.radius;
                            if (d.angle !== undefined) ent.targetAngle = d.angle;
                            col.set(d.id, ent);
                        });
                    });
                }

                // Tick events (chomps, hits, explosions)
                if (data.events && Array.isArray(data.events)) {
                    data.events.forEach(ev => {
                        if (ev.type === 'chomp' || ev.type === 'hit') {
                            this.particles.burst(ev.x || 0, ev.y || 0, 15, '#38bdf8');
                            this.audio.playChime(520, 0.12);
                        } else if (ev.type === 'explosion') {
                            this.particles.burst(ev.x || 0, ev.y || 0, 30, '#f97316');
                            this.particles.shake(250, 8);
                            this.audio.playExplosion();
                        }
                    });
                }
            });

            this.net.on('gameover', (data) => {
                this.isPlaying = false;
                const deathModal = document.getElementById('death-modal');
                const killerEl = document.getElementById('death-killer');
                const scoreEl = document.getElementById('death-score');

                if (killerEl) killerEl.textContent = data.eatenBy || data.killedBy || 'An Opponent';
                if (scoreEl) scoreEl.textContent = data.score !== undefined ? data.score : 0;
                if (deathModal) deathModal.style.display = 'flex';
            });
        }

        join(userName) {
            this.audio.init();
            const name = (userName || '').trim() || 'Player';
            this.net.emit('letmeplay', {
                userName: name,
                oldId: localStorage.getItem('engine_pid') || ''
            });
        }

        startLoop() {
            const step = () => {
                this.updateAndRender();
                requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
        }

        updateAndRender() {
            // FPS calculation
            this.fpsCount++;
            const now = performance.now();
            if (now - this.fpsLastTime >= 1000) {
                this.fps = this.fpsCount;
                this.fpsCount = 0;
                this.fpsLastTime = now;
                const fpsEl = document.getElementById('hud-fps');
                if (fpsEl) fpsEl.textContent = this.fps;
            }

            // Interpolation
            this.interpolator.lerpAll(0.18);

            // Find my player across any active entity collection
            const myPlayer = this.getMyPlayer();

            // Camera follow
            const worldW = (this.visuals.world && this.visuals.world.width) || 2000;
            const worldH = (this.visuals.world && this.visuals.world.height) || 2000;
            if (myPlayer) {
                this.camera.follow(myPlayer, 0.12, worldW, worldH);
            }

            // Begin rendering
            this.renderer.beginFrame(this.camera, myPlayer);

            // Background & grid
            this.renderer.renderBackground(this.visuals.world || {}, this.visuals.theme || {}, this.visuals);

            // Render all entities through Cartridge Visual Hooks
            const renderers = this.visuals.drawHooks || this.visuals.renderers || {};

            // Dynamic Layered Entity Rendering (respects cartridge layerOrder)
            const defaultOrder = ['dots', 'stardust', 'obstacles', 'planets', 'asteroids', 'pulsars', 'viruses', 'bullets', 'players', 'blackholes'];
            const layerOrder = this.visuals.layerOrder || defaultOrder;
            const renderedTypes = new Set();

            layerOrder.forEach(type => {
                const hook = renderers[type];
                if (hook) {
                    renderedTypes.add(type);
                    const col = this.interpolator.getCollection(type);
                    for (const ent of col.values()) {
                        this.renderer.renderEntity(type, ent, hook);
                    }
                }
            });

            // Render any custom entity types not enumerated in layerOrder
            Object.keys(renderers).forEach(type => {
                if (!renderedTypes.has(type)) {
                    const hook = renderers[type];
                    if (hook) {
                        const col = this.interpolator.getCollection(type);
                        for (const ent of col.values()) {
                            this.renderer.renderEntity(type, ent, hook);
                        }
                    }
                }
            });

            // Particles
            if (this.renderer.ctx) {
                this.particles.updateAndDraw(this.renderer.ctx);
            }

            this.renderer.endFrame();

            // Update HUD
            if (myPlayer) {
                this.updateHUD(myPlayer);
            }
        }

        getMyPlayer() {
            if (!this.myPlayerId) return null;
            const playersCol = this.interpolator.getCollection('players');
            let p = playersCol.get(this.myPlayerId);
            if (p) return p;
            for (const col of this.interpolator.collections.values()) {
                if (col.has(this.myPlayerId)) return col.get(this.myPlayerId);
            }
            return null;
        }

        updateHUD(player) {
            const hudStats = (this.visuals.hud && this.visuals.hud.stats) || [];
            hudStats.forEach(s => {
                const el = document.getElementById(`stat-val-${s.id}`);
                if (el) {
                    const rawVal = player[s.key] !== undefined ? player[s.key] : 0;
                    el.textContent = s.format ? s.format(rawVal) : rawVal;
                }
            });

            // Health bar if present
            const hpBar = document.getElementById('hud-health-fill');
            if (hpBar && player.health !== undefined) {
                hpBar.style.width = Math.max(0, Math.min(100, player.health)) + '%';
            }

            // Update Leaderboard
            let leaderboardCol = this.interpolator.getCollection('players');
            if (leaderboardCol.size === 0 && this.interpolator.collections.has('blackholes')) {
                leaderboardCol = this.interpolator.getCollection('blackholes');
            }
            const sorted = Array.from(leaderboardCol.values())
                .sort((a, b) => (b.mass !== undefined ? b.mass : (b.score || 0)) - (a.mass !== undefined ? a.mass : (a.score || 0)))
                .slice(0, 8);

            const lbList = document.getElementById('hud-leaderboard-list');
            if (lbList) {
                lbList.innerHTML = sorted.map((p, idx) => {
                    const isMe = p.id === this.myPlayerId;
                    return `<li class="${isMe ? 'self' : ''}">
                        <span>${idx + 1}. ${p.name || 'Player'}</span>
                        <span>${p.mass !== undefined ? Math.round(p.mass) + 'M' : (p.score || 0)}</span>
                    </li>`;
                }).join('');
            }
        }
    }

    global.EngineClient = global.EngineClient || {};
    global.EngineClient.Camera = Camera;
    global.EngineClient.Interpolator = Interpolator;
    global.EngineClient.InputManager = InputManager;
    global.EngineClient.ParticleEngine = ParticleEngine;
    global.EngineClient.AudioManager = AudioManager;
    global.EngineClient.NetworkClient = NetworkClient;
    global.EngineClient.App = App;
})(typeof window !== 'undefined' ? window : global);
