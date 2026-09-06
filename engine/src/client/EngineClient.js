/**
 * EngineClient.js
 * Core browser runtime for 2D multiplayer games.
 * Provides Camera, Interpolation, Input, Audio, and Particle systems.
 */
(function (global) {
    'use strict';

    class Camera {
        constructor(canvas) {
            this.canvas = canvas;
            this.origin = { x: 0, y: 0 };
            this.zoom = 1.0;
        }

        follow(target, lerpFactor = 0.1) {
            if (!target) return;
            const targetX = target.x - this.canvas.width / 2;
            const targetY = target.y - this.canvas.height / 2;
            this.origin.x += (targetX - this.origin.x) * lerpFactor;
            this.origin.y += (targetY - this.origin.y) * lerpFactor;
        }

        begin(ctx) {
            ctx.save();
            ctx.translate(-this.origin.x, -this.origin.y);
        }

        end(ctx) {
            ctx.restore();
        }

        getViewBounds(padding = 50) {
            return {
                left: this.origin.x - padding,
                right: this.origin.x + this.canvas.width + padding,
                top: this.origin.y - padding,
                bottom: this.origin.y + this.canvas.height + padding
            };
        }

        isVisible(x, y, radius = 0, padding = 50) {
            const b = this.getViewBounds(padding);
            return x + radius >= b.left && x - radius <= b.right && y + radius >= b.top && y - radius <= b.bottom;
        }
    }

    class Interpolator {
        constructor() {
            this.entities = new Map();
        }

        set(id, data) {
            this.entities.set(id, data);
        }

        get(id) {
            return this.entities.get(id);
        }

        delete(id) {
            this.entities.delete(id);
        }

        clear() {
            this.entities.clear();
        }

        values() {
            return this.entities.values();
        }

        lerpAll(speed = 0.15) {
            for (const ent of this.entities.values()) {
                if (ent.targetX !== undefined && ent.targetY !== undefined) {
                    ent.x += (ent.targetX - ent.x) * speed;
                    ent.y += (ent.targetY - ent.y) * speed;
                }
                if (ent.targetRadius !== undefined) {
                    ent.radius += (ent.targetRadius - ent.radius) * speed;
                }
            }
        }
    }

    class InputManager {
        constructor(canvas, onInputChange) {
            this.canvas = canvas;
            this.onInputChange = onInputChange;
            this.lastSendTime = 0;
            this.lastInput = { x: 0, y: 0 };
            this.init();
        }

        init() {
            const handleMove = (clientX, clientY) => {
                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;
                const dx = clientX - centerX;
                const dy = clientY - centerY;
                const dist = Math.hypot(dx, dy);
                const maxDist = Math.min(centerX, centerY) * 0.8 || 1;
                const normalizedDist = Math.min(1.0, dist / maxDist);
                const angle = Math.atan2(dy, dx);
                const inputX = Math.cos(angle) * normalizedDist;
                const inputY = Math.sin(angle) * normalizedDist;

                const now = performance.now();
                if (now - this.lastSendTime > 30 || Math.hypot(inputX - this.lastInput.x, inputY - this.lastInput.y) > 0.04) {
                    this.lastSendTime = now;
                    this.lastInput = { x: inputX, y: inputY };
                    if (this.onInputChange) this.onInputChange(this.lastInput);
                }
            };

            window.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
            window.addEventListener('touchmove', (e) => {
                if (e.touches.length > 0) handleMove(e.touches[0].clientX, e.touches[0].clientY);
            });
        }
    }

    class ParticleEngine {
        constructor() {
            this.particles = [];
            this.shockwaves = [];
            this.screenShakeTime = 0;
            this.screenShakeIntensity = 0;
        }

        addShockwave(x, y, maxRadius = 80, color = '#22d3ee') {
            this.shockwaves.push({ x, y, radius: 10, maxRadius, alpha: 1.0, color });
        }

        burst(x, y, count = 15, color = '#38bdf8') {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * 4;
                this.particles.push({
                    x, y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    radius: 2 + Math.random() * 3,
                    alpha: 1.0,
                    decay: 0.02 + Math.random() * 0.03,
                    color
                });
            }
        }

        shake(durationMs = 200, intensity = 8) {
            this.screenShakeTime = performance.now() + durationMs;
            this.screenShakeIntensity = intensity;
        }

        applyShake(ctx) {
            if (performance.now() < this.screenShakeTime) {
                const dx = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
                const dy = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
                ctx.translate(dx, dy);
            }
        }

        updateAndDraw(ctx) {
            for (let i = this.shockwaves.length - 1; i >= 0; i--) {
                const sw = this.shockwaves[i];
                sw.radius += (sw.maxRadius - sw.radius) * 0.15 + 1.5;
                sw.alpha -= 0.03;
                if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
                    this.shockwaves.splice(i, 1);
                    continue;
                }
                ctx.beginPath();
                ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
                ctx.strokeStyle = sw.color;
                ctx.globalAlpha = Math.max(0, sw.alpha);
                ctx.lineWidth = 2.5;
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }

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

                this.ws.onerror = (err) => {
                    this.emitLocal('error', err);
                };

                this.ws.onmessage = (event) => {
                    try {
                        const parsed = JSON.parse(event.data);
                        if (parsed && parsed.event) {
                            this.emitLocal(parsed.event, parsed.data);
                        }
                    } catch (e) {
                        console.error('[NetworkClient] Failed to parse message:', e);
                    }
                };
            } catch (err) {
                console.error('[NetworkClient] Connection error:', err);
                setTimeout(() => this.connect(), this.reconnectDelay);
            }
        }

        on(event, handler) {
            if (!this.listeners.has(event)) {
                this.listeners.set(event, []);
            }
            this.listeners.get(event).push(handler);
        }

        off(event, handler) {
            if (!this.listeners.has(event)) return;
            const list = this.listeners.get(event);
            const index = list.indexOf(handler);
            if (index !== -1) list.splice(index, 1);
        }

        emit(event, data) {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ event, data }));
            }
        }

        emitLocal(event, data) {
            const handlers = this.listeners.get(event);
            if (handlers) {
                for (let i = 0; i < handlers.length; i++) {
                    try {
                        handlers[i](data);
                    } catch (e) {
                        console.error(`[NetworkClient] Error in handler for event "${event}":`, e);
                    }
                }
            }
        }
    }

    global.EngineClient = {
        Camera,
        Interpolator,
        InputManager,
        ParticleEngine,
        NetworkClient
    };
})(typeof window !== 'undefined' ? window : global);
