/**
 * Canvas2DRenderer.js
 * High-performance 2D Canvas rendering plugin for EngineClient.
 * Handles HiDPI resolution, camera translation, viewport culling, and grid lines.
 */
(function (global) {
    'use strict';

    const IRenderer = (global.EngineClient && global.EngineClient.IRenderer) || class {};

    class Canvas2DRenderer extends IRenderer {
        constructor() {
            super();
            this.canvas = null;
            this.ctx = null;
            this.camera = null;
            this.dpr = 1;
            this.width = 0;
            this.height = 0;
            this.bgImg = new Image();
            this.bgImg.src = "/engine/client/nebula_bg.jpg";
        }

        init(container, options = {}) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'engine-viewport-canvas';
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.display = 'block';
            this.canvas.style.zIndex = '1';

            container.appendChild(this.canvas);
            this.ctx = this.canvas.getContext('2d', { alpha: false });
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);

            this.resize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
            return this.canvas;
        }

        resize(width, height) {
            this.width = width;
            this.height = height;
            this.canvas.width = Math.round(width * this.dpr);
            this.canvas.height = Math.round(height * this.dpr);
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.ctx.scale(this.dpr, this.dpr);
        }

        beginFrame(camera) {
            this.camera = camera;
            this.ctx.save();
            this.ctx.clearRect(0, 0, this.width, this.height);

            // Apply camera world translation
            if (this.camera && this.camera.origin) {
                this.ctx.translate(-this.camera.origin.x, -this.camera.origin.y);
            }
        }

        renderBackground(worldConfig = {}, theme = {}, visuals = {}) {
            const worldW = worldConfig.width || 4000;
            const worldH = worldConfig.height || 4000;

            // Custom Cartridge Background Hook (e.g. for atmospheric/sparse space)
            if (visuals && typeof visuals.drawBackground === 'function') {
                visuals.drawBackground(this.ctx, this.camera, worldW, worldH, this.bgImg);
                return;
            }

            const bg = theme.backgroundColor || '#0a0e17';
            const gridCfg = theme.grid || { enabled: true, size: 50, color: 'rgba(255, 255, 255, 0.04)' };

            // Fill world backdrop
            if (this.bgImg && this.bgImg.complete && this.bgImg.naturalWidth > 0) {
                this.ctx.drawImage(this.bgImg, 0, 0, worldW, worldH);
                this.ctx.fillStyle = theme.dimOverlay || "rgba(0, 0, 0, 0.6)";
                this.ctx.fillRect(0, 0, worldW, worldH);
            } else {
                this.ctx.fillStyle = bg;
                this.ctx.fillRect(0, 0, worldW, worldH);
            }

            // Draw grid if enabled
            if (gridCfg.enabled !== false) {
                const step = gridCfg.size || 50;
                const cam = this.camera;
                const startX = cam ? Math.max(0, Math.floor(cam.origin.x / step) * step) : 0;
                const startY = cam ? Math.max(0, Math.floor(cam.origin.y / step) * step) : 0;
                const endX = cam ? Math.min(worldW, cam.origin.x + this.width + step) : worldW;
                const endY = cam ? Math.min(worldH, cam.origin.y + this.height + step) : worldH;

                this.ctx.beginPath();
                this.ctx.strokeStyle = gridCfg.color || 'rgba(255, 255, 255, 0.04)';
                this.ctx.lineWidth = 1;

                for (let x = startX; x <= endX; x += step) {
                    this.ctx.moveTo(x, startY);
                    this.ctx.lineTo(x, endY);
                }
                for (let y = startY; y <= endY; y += step) {
                    this.ctx.moveTo(startX, y);
                    this.ctx.lineTo(endX, y);
                }
                this.ctx.stroke();
            }

            // World boundary border
            this.ctx.strokeStyle = theme.borderColor || 'rgba(56, 189, 248, 0.35)';
            this.ctx.lineWidth = 4;
            this.ctx.strokeRect(0, 0, worldW, worldH);
        }

        renderEntity(type, entity, renderHook) {
            if (!renderHook || !entity) return;

            // Viewport Culling Optimization: Skip rendering if entity is off-screen!
            if (this.camera && typeof this.camera.isVisible === 'function') {
                const rad = entity.radius || entity.size || 25;
                if (!this.camera.isVisible(entity.x, entity.y, rad, 60)) {
                    return;
                }
            }

            // Execute Cartridge Render Hook
            try {
                renderHook(this.ctx, entity, this.camera);
            } catch (err) {
                console.error(`[Canvas2DRenderer] Error rendering entity of type "${type}":`, err);
            }
        }

        endFrame() {
            this.ctx.restore();
        }

        destroy() {
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
        }
    }

    global.EngineClient = global.EngineClient || {};
    global.EngineClient.Canvas2DRenderer = Canvas2DRenderer;
})(typeof window !== 'undefined' ? window : global);
