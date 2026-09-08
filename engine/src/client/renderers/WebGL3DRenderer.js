/**
 * WebGL3DRenderer.js
 * Universal 3D WebGL rendering backend plugin for the game engine.
 * Powered by Three.js with pulled-back third-person chase camera, vast 3D cosmos, and dynamic mesh pooling.
 */
(function (global) {
    'use strict';

    const IRenderer = (global.EngineClient && global.EngineClient.IRenderer) || class {};

    class WebGL3DRenderer extends IRenderer {
        constructor() {
            super();
            this.container = null;
            this.canvas = null;
            this.renderer = null;
            this.scene = null;
            this.camera3D = null;
            this.starfield = null;
            this.skydome = null;
            this.lights = {};

            // 3D Entity Mesh Pool: Map<entityId, { mesh: THREE.Object3D, lastFrame: number }>
            this.meshPool = new Map();
            this.frameIndex = 0;

            // Camera Chase State
            this.camPos = { x: 2000, y: 390, z: 2720 };
            this.camLook = { x: 2000, y: 15, z: 1780 };
            this._hasSnappedCamera = false;

            this.width = window.innerWidth;
            this.height = window.innerHeight;
        }

        init(container, options = {}) {
            if (typeof THREE === 'undefined') {
                console.error('[WebGL3DRenderer] Three.js is not loaded! Please include three.min.js.');
                return null;
            }

            this.container = container;

            // 1. Three.js WebGL Renderer
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                powerPreference: 'high-performance',
                alpha: false
            });
            this.renderer.setSize(this.width, this.height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
            this.renderer.setClearColor(0x02030a, 1.0);
            this.renderer.outputEncoding = THREE.sRGBEncoding;

            this.canvas = this.renderer.domElement;
            this.canvas.id = 'game-canvas-3d';
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.zIndex = '1';

            this.container.appendChild(this.canvas);

            // 2. Scene with vast space atmospheric depth
            this.scene = new THREE.Scene();
            this.scene.fog = new THREE.FogExp2(0x020510, 0.000020);

            // 3. Perspective 3D Camera (FOV 62, Far 75000 for immense cosmic vistas)
            this.camera3D = new THREE.PerspectiveCamera(62, this.width / this.height, 2, 75000);
            this.camera3D.position.set(2000, 390, 2720);
            this.camera3D.lookAt(2000, 15, 1780);

            // 4. Lighting Rig
            this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.70);
            this.scene.add(this.lights.ambient);

            this.lights.sun = new THREE.DirectionalLight(0xfff8e7, 1.15);
            this.lights.sun.position.set(2200, 1200, 2900);
            this.scene.add(this.lights.sun);
            this.scene.add(this.lights.sun.target);

            this.lights.fill = new THREE.DirectionalLight(0x93c5fd, 0.45);
            this.lights.fill.position.set(-2000, -1000, -2000);
            this.scene.add(this.lights.fill);

            // 5. High-Tech Cosmic Backdrop (Nebula, Starfield, Planet, Sun Flare)
            this.backdropObjects = {};
            this.initCosmicBackdrop();

            console.log('[WebGL3DRenderer] Initialized Vast Cosmic 3D Universe Renderer');
            return this.canvas;
        }

        initCosmicBackdrop() {
            // 1. Procedural 360-degree Cosmic Sky Dome
            const skyCvs = document.createElement('canvas');
            skyCvs.width = 1024;
            skyCvs.height = 512;
            const skyCtx = skyCvs.getContext('2d');

            // Deep cosmic gradient
            const bgGrad = skyCtx.createLinearGradient(0, 0, 0, 512);
            bgGrad.addColorStop(0.0, '#010206');
            bgGrad.addColorStop(0.3, '#020510');
            bgGrad.addColorStop(0.5, '#040a1c');
            bgGrad.addColorStop(0.7, '#020510');
            bgGrad.addColorStop(1.0, '#010206');
            skyCtx.fillStyle = bgGrad;
            skyCtx.fillRect(0, 0, 1024, 512);

            // Sweeping Galactic Nebula Clouds
            const nebulae = [
                { cx: 300, cy: 180, rx: 350, ry: 120, col: 'rgba(56, 189, 248, 0.08)' },
                { cx: 750, cy: 300, rx: 380, ry: 130, col: 'rgba(217, 119, 6, 0.06)' }
            ];
            for (const neb of nebulae) {
                const nGrad = skyCtx.createRadialGradient(neb.cx, neb.cy, 10, neb.cx, neb.cy, Math.max(neb.rx, neb.ry));
                nGrad.addColorStop(0.0, neb.col);
                nGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
                skyCtx.fillStyle = nGrad;
                skyCtx.beginPath();
                skyCtx.ellipse(neb.cx, neb.cy, neb.rx, neb.ry, 0, 0, Math.PI * 2);
                skyCtx.fill();
            }

            // Distant Micro Stars in Skybox
            for (let s = 0; s < 1800; s++) {
                const sx = Math.random() * 1024;
                const sy = Math.random() * 512;
                const sr = Math.random() * 1.5;
                const alpha = 0.3 + Math.random() * 0.7;
                skyCtx.fillStyle = Math.random() > 0.4 ? `rgba(255, 255, 255, ${alpha})` : 
`rgba(56, 189, 248, ${alpha})`;
                skyCtx.beginPath();
                skyCtx.arc(sx, sy, sr, 0, Math.PI * 2);
                skyCtx.fill();
            }

            const skyTex = new THREE.CanvasTexture(skyCvs);
            skyTex.needsUpdate = true;
            const skyGeom = new THREE.SphereGeometry(65000, 32, 32);
            const skyMat = new THREE.MeshBasicMaterial({
                map: skyTex,
                side: THREE.BackSide,
                depthWrite: false,
                fog: false
            });
            this.skydome = new THREE.Mesh(skyGeom, skyMat);
            this.scene.add(this.skydome);

            // 2. High-Density Dynamic Starfield Particles (8,500 3D Stars)
            const starCount = 8500;
            const starGeom = new THREE.BufferGeometry();
            const starPositions = new Float32Array(starCount * 3);
            const starColors = new Float32Array(starCount * 3);

            const starPalettes = [
                new THREE.Color(0xffffff),
                new THREE.Color(0xdbeafe),
                new THREE.Color(0x38bdf8),
                new THREE.Color(0x00f0ff),
                new THREE.Color(0xfde047),
                new THREE.Color(0xf472b6)
            ];

            for (let i = 0; i < starCount; i++) {
                const u = Math.random();
                const v = Math.random();
                const theta = u * 2.0 * Math.PI;
                const phi = Math.acos(2.0 * v - 1.0);
                const r = 2500 + Math.random() * 42000;

                starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta) + 2000;
                starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.85 + 1200;
                starPositions[i * 3 + 2] = r * Math.cos(phi) + 2000;

                const col = starPalettes[Math.floor(Math.random() * starPalettes.length)];
                starColors[i * 3] = col.r;
                starColors[i * 3 + 1] = col.g;
                starColors[i * 3 + 2] = col.b;
            }

            starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
            starGeom.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

            // Circular Pinpoint Starlight Texture
            const starCvs = document.createElement('canvas');
            starCvs.width = 32; starCvs.height = 32;
            const sCtx = starCvs.getContext('2d');
            const sGrad = sCtx.createRadialGradient(16, 16, 1, 16, 16, 15);
            sGrad.addColorStop(0.0, '#ffffff');
            sGrad.addColorStop(0.25, 'rgba(219, 234, 254, 0.95)');
            sGrad.addColorStop(0.60, 'rgba(56, 189, 248, 0.40)');
            sGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
            sCtx.fillStyle = sGrad;
            sCtx.fillRect(0, 0, 32, 32);
            const starMap = new THREE.CanvasTexture(starCvs);
            starMap.needsUpdate = true;

            const starMat = new THREE.PointsMaterial({
                size: 1.8,
                map: starMap,
                vertexColors: true,
                transparent: true,
                opacity: 0.92,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                sizeAttenuation: false,
                fog: false
            });

            this.starfield = new THREE.Points(starGeom, starMat);
            this.scene.add(this.starfield);

            // 3. Giant Gas Giant & Equatorial Rings (Saturn aesthetic)
            this.initGiantPlanet();

            // 4. Distant Stellar Flare (Sun)
            this.initStellarSun();
        }

        initGiantPlanet() {
            // Saturn-like Golden Gas Giant in Upper Sky Horizon
            const cvs = document.createElement('canvas');
            cvs.width = 1024;
            cvs.height = 512;
            const ctx = cvs.getContext('2d');

            // Rich warm banded atmospheric belts (mocha, caramel, warm ochre, ivory cream)
            const bands = [
                { y: 0.00, col: '#3e2a14' },
                { y: 0.08, col: '#6b4923' },
                { y: 0.16, col: '#a37540' },
                { y: 0.24, col: '#c89d58' },
                { y: 0.32, col: '#edd8ad' },
                { y: 0.40, col: '#d4b075' },
                { y: 0.48, col: '#9c6f37' },
                { y: 0.54, col: '#c49d5c' },
                { y: 0.62, col: '#f2e2be' },
                { y: 0.70, col: '#b58849' },
                { y: 0.80, col: '#7a5127' },
                { y: 0.90, col: '#452b12' },
                { y: 1.00, col: '#241407' }
            ];

            const pGrad = ctx.createLinearGradient(0, 0, 0, 512);
            bands.forEach(b => pGrad.addColorStop(b.y, b.col));
            ctx.fillStyle = pGrad;
            ctx.fillRect(0, 0, 1024, 512);

            // Fine atmospheric turbulence and swirling storm belts
            ctx.fillStyle = 'rgba(255, 245, 225, 0.22)';
            for (let i = 0; i < 40; i++) {
                const y = Math.random() * 512;
                const h = 2 + Math.random() * 8;
                ctx.fillRect(0, y, 1024, h);
            }
            // Jovian/Saturnian Great Storm Oval
            ctx.fillStyle = 'rgba(195, 120, 55, 0.55)';
            ctx.beginPath();
            ctx.ellipse(380, 220, 75, 32, 0, 0, Math.PI * 2);
            ctx.fill();

            const planetTex = new THREE.CanvasTexture(cvs);
            planetTex.needsUpdate = true;

            const planetGroup = new THREE.Group();
            planetGroup.position.set(6800, 3500, -11500);

            // 1. Gas Giant Sphere
            const planetGeom = new THREE.SphereGeometry(2600, 64, 64);
            const planetMat = new THREE.MeshBasicMaterial({
                map: planetTex,
                fog: false
            });
            const planet = new THREE.Mesh(planetGeom, planetMat);
            planetGroup.add(planet);

            // 2. Atmospheric Rim Glow
            const atmosGeom = new THREE.SphereGeometry(2650, 48, 48);
            const atmosMat = new THREE.MeshBasicMaterial({
                color: 0xf5d089,
                transparent: true,
                opacity: 0.40,
                side: THREE.BackSide,
                blending: THREE.AdditiveBlending,
                fog: false
            });
            const atmos = new THREE.Mesh(atmosGeom, atmosMat);
            planetGroup.add(atmos);

            // 3. Majestic Planetary Rings (Fine concentric icy dust rings with Cassini Division)
            const ringCvs = document.createElement('canvas');
            ringCvs.width = 1024;
            ringCvs.height = 1024;
            const rCtx = ringCvs.getContext('2d');
            const cx = 512, cy = 512;
            const rGrad = rCtx.createRadialGradient(cx, cy, 210, cx, cy, 500);
            rGrad.addColorStop(0.00, 'rgba(0,0,0,0)');
            rGrad.addColorStop(0.08, 'rgba(195, 165, 125, 0.4)');
            rGrad.addColorStop(0.24, 'rgba(235, 215, 185, 0.88)'); // Ring C / B
            rGrad.addColorStop(0.50, 'rgba(215, 190, 155, 0.95)'); // Main Ring B
            rGrad.addColorStop(0.54, 'rgba(0, 0, 0, 0.05)');       // Cassini Division
            rGrad.addColorStop(0.58, 'rgba(220, 195, 160, 0.88)'); // Ring A
            rGrad.addColorStop(0.80, 'rgba(180, 155, 120, 0.65)');
            rGrad.addColorStop(0.86, 'rgba(0, 0, 0, 0.05)');       // Encke Gap
            rGrad.addColorStop(0.92, 'rgba(160, 135, 100, 0.45)'); // F Ring
            rGrad.addColorStop(1.00, 'rgba(0,0,0,0)');
            rCtx.fillStyle = rGrad;
            rCtx.beginPath();
            rCtx.arc(cx, cy, 500, 0, Math.PI * 2);
            rCtx.fill();

            // Cut center out
            rCtx.globalCompositeOperation = 'destination-out';
            rCtx.beginPath();
            rCtx.arc(cx, cy, 210, 0, Math.PI * 2);
            rCtx.fill();
            rCtx.globalCompositeOperation = 'source-over';

            const ringTex = new THREE.CanvasTexture(ringCvs);
            ringTex.needsUpdate = true;

            const ringGeom = new THREE.RingGeometry(3100, 7200, 96);
            const ringMat = new THREE.MeshBasicMaterial({
                map: ringTex,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.90,
                blending: THREE.NormalBlending,
                fog: false
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.rotation.x = Math.PI / 2.2;
            ring.rotation.y = -Math.PI / 7.5;
            planetGroup.add(ring);

            this.scene.add(planetGroup);
            this.backdropObjects.planet = planetGroup;
        }

        initStellarSun() {
            // Brilliant distant star with lens flare
            const cvs = document.createElement('canvas');
            cvs.width = 256;
            cvs.height = 256;
            const ctx = cvs.getContext('2d');

            const grad = ctx.createRadialGradient(128, 128, 4, 128, 128, 124);
            grad.addColorStop(0.0, '#ffffff');
            grad.addColorStop(0.15, 'rgba(255, 255, 255, 0.95)');
            grad.addColorStop(0.4, 'rgba(56, 189, 248, 0.5)');
            grad.addColorStop(0.8, 'rgba(14, 165, 233, 0.15)');
            grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 256, 256);

            // 6-Point Stellar Diffraction Spikes
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 2;
            for (let a = 0; a < 3; a++) {
                const ang = (a / 3) * Math.PI;
                ctx.beginPath();
                ctx.moveTo(128 - Math.cos(ang) * 120, 128 - Math.sin(ang) * 120);
                ctx.lineTo(128 + Math.cos(ang) * 120, 128 + Math.sin(ang) * 120);
                ctx.stroke();
            }

            const flareTex = new THREE.CanvasTexture(cvs);
            flareTex.needsUpdate = true;
            const flareMat = new THREE.SpriteMaterial({
                map: flareTex,
                color: 0xffffff,
                transparent: true,
                blending: THREE.AdditiveBlending,
                opacity: 0.95,
                depthWrite: false,
                fog: false
            });

            const sunFlare = new THREE.Sprite(flareMat);
            sunFlare.position.set(-6500, 7500, -12000);
            sunFlare.scale.set(5500, 5500, 1);
            this.scene.add(sunFlare);
            this.backdropObjects.sunFlare = sunFlare;
        }

        resize(width, height) {
            this.width = width;
            this.height = height;
            if (this.camera3D) {
                this.camera3D.aspect = width / height;
                this.camera3D.updateProjectionMatrix();
            }
            if (this.renderer) {
                this.renderer.setSize(width, height);
            }
        }

        beginFrame(camera2D, myPlayer) {
            this.frameIndex++;
            this.myPlayer = myPlayer;

            // 3D Third-Person Camera Tracking
            if (myPlayer) {
                const px = myPlayer.x || 2000;
                const pz = myPlayer.y || 2000;
                const radius = myPlayer.radius || 18;

                // Grand pulled-back camera giving immense scale to 3D space
                const baseChaseDist = window.cameraSettings ? window.cameraSettings.distance : 720;
                const baseChaseHeight = window.cameraSettings ? window.cameraSettings.height : 390;
                const chaseDist = Math.max(baseChaseDist, radius * (baseChaseDist / 51.0));
                const chaseHeight = Math.max(baseChaseHeight, radius * (baseChaseHeight / 55.0));
                const lookDist = Math.max(220, radius * 4.5);     // Looking forward across the cosmos

                // Position camera behind (+Z) and above (+Y) the player, looking forward (-Z)
                const idealCamX = px;
                const idealCamY = chaseHeight;
                const idealCamZ = pz + chaseDist;

                const targetLookX = px;
                const targetLookY = 15;
                const targetLookZ = pz - lookDist;

                if (!this._hasSnappedCamera) {
                    this.camPos.x = idealCamX;
                    this.camPos.y = idealCamY;
                    this.camPos.z = idealCamZ;
                    this.camLook.x = targetLookX;
                    this.camLook.y = targetLookY;
                    this.camLook.z = targetLookZ;
                    this._hasSnappedCamera = true;
                }

                // Smooth responsive camera chase lerp
                const lerpFactor = 0.08;
                this.camPos.x += (idealCamX - this.camPos.x) * lerpFactor;
                this.camPos.y += (idealCamY - this.camPos.y) * lerpFactor;
                this.camPos.z += (idealCamZ - this.camPos.z) * lerpFactor;

                this.camLook.x += (targetLookX - this.camLook.x) * 0.12;
                this.camLook.y += (targetLookY - this.camLook.y) * 0.12;
                this.camLook.z += (targetLookZ - this.camLook.z) * 0.12;

                this.camera3D.position.set(this.camPos.x, this.camPos.y, this.camPos.z);
                this.camera3D.lookAt(this.camLook.x, this.camLook.y, this.camLook.z);

                // Keep directional sun light positioned with the camera for crisp, illuminated relief
                if (this.lights && this.lights.sun) {
                    this.lights.sun.position.set(this.camPos.x + 300, this.camPos.y + 700, this.camPos.z + 200);
                    this.lights.sun.target.position.set(this.camLook.x, this.camLook.y, this.camLook.z);
                    this.lights.sun.target.updateMatrixWorld();
                }

                // Keep Skydome centered around camera so space is truly infinite
                if (this.skydome) {
                    this.skydome.position.set(this.camPos.x, this.camPos.y * 0.2, this.camPos.z);
                }

                // Position Saturn gas giant in the upper-right sky horizon ahead of the player
                if (this.backdropObjects && this.backdropObjects.planet) {
                    this.backdropObjects.planet.position.set(this.camPos.x + 5200, 3500, this.camPos.z - 12000);
                }

                if (this.backdropObjects && this.backdropObjects.sunFlare) {
                    this.backdropObjects.sunFlare.position.set(this.camPos.x - 6500, 7500, this.camPos.z - 12500);
                }
            } else if (camera2D && camera2D.origin) {
                // Fallback free-float tracking
                const cx = camera2D.origin.x + (camera2D.viewportWidth || 1000) / 2;
                const cz = camera2D.origin.y + (camera2D.viewportHeight || 1000) / 2;
                this.camera3D.position.set(cx, 600, cz + 900);
                this.camera3D.lookAt(cx, 15, cz - 200);

                if (this.skydome) {
                    this.skydome.position.set(cx, 0, cz);
                }
            }

            // Cinematic backdrop animations
            if (this.starfield) {
                this.starfield.rotation.y += 0.00010;
            }
            if (this.backdropObjects && this.backdropObjects.planet) {
                this.backdropObjects.planet.rotation.y += 0.00020;
            }
        }

        renderBackground(worldConfig, theme = {}, visuals = {}) {
            // In 3D, the background is the 3D procedural starfield and skydome
        }

        renderEntity(type, entity, renderHook) {
            if (!this.scene) return;

            const entityId = entity.id || (type + '_' + (entity.x || 0) + '_' + (entity.y || 0));
            let entry = this.meshPool.get(entityId);

            if (!entry) {
                // Let the Cartridge 3D render hook create the Three.js mesh/object
                let mesh = null;
                if (typeof renderHook === 'function') {
                    mesh = renderHook(this, entity, THREE);
                }

                if (mesh) {
                    this.scene.add(mesh);
                    entry = { mesh, lastFrame: this.frameIndex };
                    this.meshPool.set(entityId, entry);
                }
            } else {
                entry.lastFrame = this.frameIndex;
                // Update 3D mesh transform and visual parameters
                if (typeof renderHook === 'function') {
                    renderHook(this, entity, THREE, entry.mesh);
                }
            }
        }

        endFrame() {
            if (!this.renderer || !this.scene || !this.camera3D) return;

            // Garbage collect meshes for dead/eaten entities
            for (const [id, entry] of this.meshPool.entries()) {
                if (entry.lastFrame < this.frameIndex) {
                    this.scene.remove(entry.mesh);
                    if (entry.mesh.geometry) entry.mesh.geometry.dispose();
                    if (entry.mesh.material) {
                        if (Array.isArray(entry.mesh.material)) {
                            entry.mesh.material.forEach(m => m.dispose());
                        } else {
                            entry.mesh.material.dispose();
                        }
                    }
                    this.meshPool.delete(id);
                }
            }

            // Render 3D Scene
            this.renderer.render(this.scene, this.camera3D);
        }

        destroy() {
            if (this.canvas && this.canvas.parentNode) {
                this.canvas.parentNode.removeChild(this.canvas);
            }
            if (this.renderer) {
                this.renderer.dispose();
            }
            this.meshPool.clear();
        }
    }

    global.EngineClient = global.EngineClient || {};
    global.EngineClient.WebGL3DRenderer = WebGL3DRenderer;
})(typeof window !== 'undefined' ? window : global);
