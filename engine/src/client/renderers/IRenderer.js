/**
 * IRenderer.js
 * Universal rendering backend interface contract for the game engine.
 * Concrete plugins (Canvas2DRenderer, WebGL3DRenderer, etc.) must implement these methods.
 */
(function (global) {
    'use strict';

    class IRenderer {
        constructor() {
            if (new.target === IRenderer) {
                throw new TypeError("Cannot construct IRenderer instances directly");
            }
        }

        init(container, options = {}) {
            throw new Error("init() must be implemented by renderer plugin");
        }

        resize(width, height) {
            throw new Error("resize() must be implemented by renderer plugin");
        }

        beginFrame(camera) {
            throw new Error("beginFrame() must be implemented by renderer plugin");
        }

        renderBackground(worldConfig, theme = {}) {
            throw new Error("renderBackground() must be implemented by renderer plugin");
        }

        renderEntity(type, entity, renderHook) {
            throw new Error("renderEntity() must be implemented by renderer plugin");
        }

        endFrame() {
            throw new Error("endFrame() must be implemented by renderer plugin");
        }

        destroy() {
            // Optional cleanup
        }
    }

    global.EngineClient = global.EngineClient || {};
    global.EngineClient.IRenderer = IRenderer;
})(typeof window !== 'undefined' ? window : global);
