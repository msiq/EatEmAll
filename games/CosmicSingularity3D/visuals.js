/**
 * visuals.js - Cosmic Singularity 3D
 * Relativistic Gargantua Universe, Solid Watertight Asteroids & Astrophysical Pulsar Jets
 * Pure High-Fidelity 3D Visual Experience
 */
(function (global) {
    "use strict";

    // ------------------------------------------------------------------------
    // TEXTURE CACHES
    // ------------------------------------------------------------------------
    let _gargantuaDiskTex = null;
    let _gargantuaLensHaloTex = null;
    let _asteroidTex = null;
    let _asteroidBumpTex = null;
    let _photonRingTex = null;
    let _pulsarJetTex = null;

    // ------------------------------------------------------------------------
    // 1. GARGANTUA EQUATORIAL ACCRETION DISK TEXTURE (Fiery Golden-Amber Plasma)
    // ------------------------------------------------------------------------
    function getGargantuaDiskTexture() {
        if (_gargantuaDiskTex) return _gargantuaDiskTex;

        const cvs = document.createElement("canvas");
        cvs.width = 1024;
        cvs.height = 1024;
        const ctx = cvs.getContext("2d");

        const cx = 512;
        const cy = 512;
        const innerR = 140;
        const maxR = 495;

        // Radiant Relativistic Plasma Radial Gradient (White-hot to fiery amber to dark red)
        const radGrad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, maxR);
        radGrad.addColorStop(0.00, "rgba(255, 255, 255, 1.0)");  // Photon ring edge (white-hot)
        radGrad.addColorStop(0.05, "rgba(255, 250, 220, 0.98)"); // Incandescent inner disk
        radGrad.addColorStop(0.18, "rgba(255, 190, 45, 0.92)");  // Blazing golden amber
        radGrad.addColorStop(0.38, "rgba(255, 115, 10, 0.85)");  // Fiery orange
        radGrad.addColorStop(0.60, "rgba(215, 55, 5, 0.55)");    // Molten deep orange-red
        radGrad.addColorStop(0.82, "rgba(120, 20, 5, 0.22)");    // Outer perimeter cooling dust
        radGrad.addColorStop(1.00, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = radGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
        ctx.fill();

        // 45 Fine Turbulent Accretion Filaments (Whispering plasma streaks)
        ctx.save();
        for (let ring = 0; ring < 45; ring++) {
            const r = innerR + 10 + (ring / 45) * (maxR - innerR - 25);
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            const isWhiteHot = ring % 3 === 0;
            const alpha = 0.08 + Math.random() * 0.18;
            ctx.strokeStyle = isWhiteHot ? `rgba(255, 250, 230, ${alpha})` : `rgba(255, 160, 25, ${alpha})`;
            ctx.lineWidth = 3 + Math.random() * 7;
            ctx.stroke();
        }
        ctx.restore();

        // Relativistic Doppler Beaming (Left side approaching is brighter and hotter)
        const dopplerGrad = ctx.createLinearGradient(0, cy, 1024, cy);
        dopplerGrad.addColorStop(0.00, "rgba(255, 255, 255, 0.45)"); // Intense approaching beam
        dopplerGrad.addColorStop(0.35, "rgba(255, 210, 80, 0.25)");
        dopplerGrad.addColorStop(0.65, "rgba(220, 80, 15, 0.15)");
        dopplerGrad.addColorStop(1.00, "rgba(90, 15, 5, 0.05)");    // Dim receding side
        ctx.fillStyle = dopplerGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
        ctx.fill();

        // Cutout center event horizon
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";

        _gargantuaDiskTex = new THREE.CanvasTexture(cvs);
        _gargantuaDiskTex.needsUpdate = true;
        return _gargantuaDiskTex;
    }

    // ------------------------------------------------------------------------
    // 2. GARGANTUA GRAVITATIONAL LENSING HALO (The Iconic Vertical Arches)
    // ------------------------------------------------------------------------
    function getGargantuaLensHaloTexture() {
        if (_gargantuaLensHaloTex) return _gargantuaLensHaloTex;

        const cvs = document.createElement("canvas");
        cvs.width = 1024;
        cvs.height = 1024;
        const ctx = cvs.getContext("2d");

        const cx = 512;
        const cy = 512;
        const innerR = 145;
        const maxR = 490;

        const haloGrad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, maxR);
        haloGrad.addColorStop(0.00, "rgba(255, 255, 255, 1.0)");  // Photon ring inner edge
        haloGrad.addColorStop(0.08, "rgba(255, 240, 190, 0.95)"); // Incandescent core
        haloGrad.addColorStop(0.24, "rgba(255, 165, 30, 0.85)");  // Fiery golden arch
        haloGrad.addColorStop(0.48, "rgba(230, 80, 10, 0.55)");   // Molten orange
        haloGrad.addColorStop(0.75, "rgba(140, 25, 5, 0.20)");
        haloGrad.addColorStop(1.00, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
        ctx.fill();

        // Delicate plasma streaks curving around the event horizon
        ctx.save();
        for (let ring = 0; ring < 35; ring++) {
            const r = innerR + 8 + (ring / 35) * (maxR - innerR - 20);
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            const alpha = 0.06 + Math.random() * 0.16;
            ctx.strokeStyle = ring % 4 === 0 ? `rgba(255, 255, 255, ${alpha})` : `rgba(255, 180, 40, ${alpha})`;
            ctx.lineWidth = 3 + Math.random() * 5;
            ctx.stroke();
        }
        ctx.restore();

        // Punch out central event horizon cavity
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";

        // Thin, razor-sharp white photon ring right on the boundary
        ctx.beginPath();
        ctx.arc(cx, cy, innerR + 1, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        _gargantuaLensHaloTex = new THREE.CanvasTexture(cvs);
        _gargantuaLensHaloTex.needsUpdate = true;
        return _gargantuaLensHaloTex;
    }

    // ------------------------------------------------------------------------
    // 3. PHOTON RING TEXTURE (Razor-sharp blazing white boundary)
    // ------------------------------------------------------------------------
    function getPhotonRingTexture() {
        if (_photonRingTex) return _photonRingTex;

        const cvs = document.createElement("canvas");
        cvs.width = 256;
        cvs.height = 256;
        const ctx = cvs.getContext("2d");

        const cx = 128, cy = 128;
        const grad = ctx.createRadialGradient(cx, cy, 112, cx, cy, 126);
        grad.addColorStop(0.0, "rgba(0,0,0,0)");
        grad.addColorStop(0.5, "rgba(255, 255, 255, 1.0)");
        grad.addColorStop(0.8, "rgba(255, 230, 160, 0.85)");
        grad.addColorStop(1.0, "rgba(0,0,0,0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, 126, 0, Math.PI * 2);
        ctx.fill();

        _photonRingTex = new THREE.CanvasTexture(cvs);
        _photonRingTex.needsUpdate = true;
        return _photonRingTex;
    }

    // ------------------------------------------------------------------------
    // 4. CRATERED ASTEROID ROCK TEXTURE (Solid Slate/Basalt with Impact Rims)
    // ------------------------------------------------------------------------
    function getAsteroidTextures() {
        if (_asteroidTex && _asteroidBumpTex) return { map: _asteroidTex, bump: _asteroidBumpTex };

        const w = 512, h = 512;
        const cvs = document.createElement("canvas");
        cvs.width = w; cvs.height = h;
        const ctx = cvs.getContext("2d");

        const bumpCvs = document.createElement("canvas");
        bumpCvs.width = w; bumpCvs.height = h;
        const bumpCtx = bumpCvs.getContext("2d");

        ctx.fillStyle = "#333d4b";
        ctx.fillRect(0, 0, w, h);
        bumpCtx.fillStyle = "#808080";
        bumpCtx.fillRect(0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);
        const bumpData = bumpCtx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const bData = bumpData.data;

        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 38;
            data[i]     = Math.min(255, Math.max(0, 62 + noise));  // R
            data[i + 1] = Math.min(255, Math.max(0, 72 + noise));  // G
            data[i + 2] = Math.min(255, Math.max(0, 85 + noise));  // B
            bData[i] = bData[i + 1] = bData[i + 2] = Math.min(255, Math.max(0, 128 + noise * 1.5));
        }
        ctx.putImageData(imgData, 0, 0);
        bumpCtx.putImageData(bumpData, 0, 0);

        const craters = [
            { x: 120, y: 140, r: 42, depth: 0.6 },
            { x: 380, y: 160, r: 65, depth: 0.8 },
            { x: 260, y: 340, r: 52, depth: 0.7 },
            { x: 440, y: 410, r: 35, depth: 0.5 },
            { x: 90,  y: 390, r: 48, depth: 0.65 },
            { x: 290, y: 80,  r: 28, depth: 0.45 },
            { x: 190, y: 220, r: 30, depth: 0.5 }
        ];

        for (const c of craters) {
            const bowlGrad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
            bowlGrad.addColorStop(0.0, "rgba(18, 24, 34, 0.92)");
            bowlGrad.addColorStop(0.7, "rgba(35, 45, 58, 0.75)");
            bowlGrad.addColorStop(1.0, "rgba(60, 72, 88, 0.0)");
            ctx.fillStyle = bowlGrad;
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(165, 185, 205, 0.55)";
            ctx.lineWidth = 4 + c.r * 0.12;
            ctx.stroke();

            const bGrad = bumpCtx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * 1.25);
            bGrad.addColorStop(0.0, "rgb(40, 40, 40)");
            bGrad.addColorStop(0.75, "rgb(60, 60, 60)");
            bGrad.addColorStop(0.85, "rgb(235, 235, 235)");
            bGrad.addColorStop(1.0, "rgb(128, 128, 128)");
            bumpCtx.fillStyle = bGrad;
            bumpCtx.beginPath();
            bumpCtx.arc(c.x, c.y, c.r * 1.25, 0, Math.PI * 2);
            bumpCtx.fill();
        }

        _asteroidTex = new THREE.CanvasTexture(cvs);
        _asteroidTex.needsUpdate = true;
        _asteroidBumpTex = new THREE.CanvasTexture(bumpCvs);
        _asteroidBumpTex.needsUpdate = true;
        return { map: _asteroidTex, bump: _asteroidBumpTex };
    }

    // ------------------------------------------------------------------------
    // 5. ASTROPHYSICAL PULSAR RELATIVISTIC JET TEXTURE
    // ------------------------------------------------------------------------
    function getPulsarJetTexture() {
        if (_pulsarJetTex) return _pulsarJetTex;

        const cvs = document.createElement("canvas");
        cvs.width = 128;
        cvs.height = 512;
        const ctx = cvs.getContext("2d");

        // Vertical plasma jet gradient (Base = blinding white, Tip = ethereal cyan fade)
        const grad = ctx.createLinearGradient(0, 512, 0, 0);
        grad.addColorStop(0.00, "rgba(255, 255, 255, 1.0)");  // Eruption base
        grad.addColorStop(0.12, "rgba(200, 245, 255, 0.95)");
        grad.addColorStop(0.35, "rgba(56, 189, 248, 0.75)");  // Collimated beam
        grad.addColorStop(0.65, "rgba(14, 165, 233, 0.45)");
        grad.addColorStop(0.88, "rgba(3, 105, 161, 0.18)");
        grad.addColorStop(1.00, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 512);

        // Supersonic Shock Diamond Knots along the jet
        for (let i = 1; i <= 6; i++) {
            const y = 512 - (i * 75);
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            ctx.beginPath();
            ctx.ellipse(64, y, 32, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Horizontal falloff towards edges
        const edgeGrad = ctx.createLinearGradient(0, 0, 128, 0);
        edgeGrad.addColorStop(0.0, "rgba(0,0,0,0.8)");
        edgeGrad.addColorStop(0.3, "rgba(0,0,0,0.0)");
        edgeGrad.addColorStop(0.7, "rgba(0,0,0,0.0)");
        edgeGrad.addColorStop(1.0, "rgba(0,0,0,0.8)");
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = edgeGrad;
        ctx.fillRect(0, 0, 128, 512);
        ctx.globalCompositeOperation = "source-over";

        _pulsarJetTex = new THREE.CanvasTexture(cvs);
        _pulsarJetTex.needsUpdate = true;
        return _pulsarJetTex;
    }

    // ------------------------------------------------------------------------
    // PROCEDURAL WATERTIGHT ROCK GEOMETRY GENERATOR (Zero Broken Triangles!)
    // ------------------------------------------------------------------------
    function createCrateredRockGeometry(seed) {
        const geom = new THREE.IcosahedronGeometry(1, 4);
        const pos = geom.attributes.position;
        const v = new THREE.Vector3();

        const craters = [
            { x: 0.65,  y: 0.35,  z: 0.45,  r: 0.42, depth: 0.24, rim: 0.09 },
            { x: -0.58, y: 0.42,  z: 0.28,  r: 0.48, depth: 0.26, rim: 0.10 },
            { x: 0.22,  y: -0.72, z: 0.38,  r: 0.38, depth: 0.22, rim: 0.08 },
            { x: -0.42, y: -0.48, z: -0.62, r: 0.44, depth: 0.25, rim: 0.09 },
            { x: 0.50,  y: -0.30, z: -0.65, r: 0.36, depth: 0.20, rim: 0.07 }
        ];

        for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i);
            const len = v.length();
            const nx = v.x / len;
            const ny = v.y / len;
            const nz = v.z / len;

            let d = 1.0;
            d += 0.18 * Math.sin(nx * 2.6 + seed) * Math.cos(ny * 2.2);
            d += 0.12 * Math.cos(nz * 2.8 + seed * 0.7);

            for (let c = 0; c < craters.length; c++) {
                const cr = craters[c];
                const dist = Math.hypot(nx - cr.x, ny - cr.y, nz - cr.z);
                if (dist < cr.r) {
                    const u = dist / cr.r;
                    const bowl = Math.cos(u * Math.PI * 0.5);
                    d -= bowl * cr.depth;
                } else if (dist < cr.r * 1.35) {
                    const u = (dist - cr.r) / (cr.r * 0.35);
                    const rim = Math.sin(u * Math.PI);
                    d += rim * cr.rim;
                }
            }

            d += 0.035 * Math.sin(nx * 11.0 + nz * 9.0) * Math.cos(ny * 10.0);
            d += 0.020 * Math.sin(nx * 22.0 + ny * 18.0 + nz * 16.0);

            const finalR = Math.max(0.55, d);
            pos.setXYZ(i, nx * finalR, ny * finalR, nz * finalR);
        }

        geom.computeVertexNormals();
        return geom;
    }

    // ------------------------------------------------------------------------
    // SCI-FI HOLOGRAPHIC HUD OVERLAY
    // ------------------------------------------------------------------------
    let _hudInstance = null;

    class HolographicCosmicHUD {
        constructor() {
            this.container = document.createElement("div");
            this.container.id = "cs3d-holographic-hud";
            this.container.innerHTML = `
                <style>
                    #cs3d-holographic-hud {
                        position: fixed;
                        top: 0; left: 0; width: 100vw; height: 100vh;
                        pointer-events: none;
                        font-family: 'Outfit', 'Inter', -apple-system, sans-serif;
                        z-index: 999;
                        color: #f8fafc;
                        user-select: none;
                    }
                    .ch-corner-box {
                        position: absolute;
                        background: rgba(8, 14, 26, 0.72);
                        backdrop-filter: blur(14px);
                        border: 1px solid rgba(255, 170, 40, 0.35);
                        box-shadow: 0 0 25px rgba(255, 120, 10, 0.18), inset 0 0 15px rgba(255, 180, 50, 0.08);
                        border-radius: 6px;
                        padding: 12px 18px;
                    }
                    .ch-top-left { top: 20px; left: 24px; min-width: 240px; }
                    .ch-top-right { top: 20px; right: 24px; }
                    .ch-bottom-right { bottom: 24px; right: 24px; text-align: right; }
                    .ch-radar {
                        position: absolute;
                        bottom: 24px; left: 24px;
                        width: 140px; height: 140px;
                        border-radius: 6px;
                        background: rgba(8, 14, 26, 0.75);
                        border: 1px solid rgba(255, 170, 40, 0.35);
                        backdrop-filter: blur(14px);
                        box-shadow: 0 0 25px rgba(255, 120, 10, 0.18);
                    }
                    .ch-title {
                        font-size: 11px; font-weight: 800; letter-spacing: 2px;
                        color: #ffaa22; text-transform: uppercase; margin-bottom: 6px;
                        text-shadow: 0 0 10px rgba(255, 170, 34, 0.6);
                    }
                    .ch-row { display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; font-family: monospace; }
                    .ch-val { font-weight: 700; color: #ffffff; text-shadow: 0 0 8px rgba(255, 255, 255, 0.4); }
                    .ch-badge {
                        display: inline-block; padding: 3px 8px; border-radius: 3px;
                        font-size: 10px; font-weight: 800; letter-spacing: 1px;
                        background: rgba(255, 120, 10, 0.2); border: 1px solid rgba(255, 170, 40, 0.4);
                        color: #ffaa22;
                    }
                </style>
                <div class="ch-corner-box ch-top-left">
                    <div class="ch-title">PLAYER: GARGANTUA SINGULARITY</div>
                    <div class="ch-row"><span>MASS:</span><span class="ch-val" id="hud-val-mass">4.20e+6 M☉</span></div>
                    <div class="ch-row"><span>RELATIVISTIC VEL:</span><span class="ch-val" id="hud-val-speed">0 km/h</span></div>
                    <div class="ch-row"><span>EVENT HORIZON:</span><span class="ch-val" id="hud-val-radius">18.5 km</span></div>
                </div>
                <div class="ch-corner-box ch-top-right">
                    <span class="ch-badge">RELATIVISTIC SYSTEM</span>
                </div>
                <div class="ch-corner-box ch-bottom-right">
                    <div style="font-size: 10px; color: #94a3b8; letter-spacing: 1px; margin-bottom: 3px;">GRAVITATIONAL CAPTURE</div>
                    <div style="font-size: 14px; font-weight: 800; color: #ffaa22; text-shadow: 0 0 10px rgba(255,170,34,0.5);">ACCRETING STARDUST & ASTEROIDS</div>
                    <div style="font-size: 11px; color: #cbd5e1; margin-top: 4px;">
                        <span style="border: 1px solid #ffaa22; padding: 1px 4px; border-radius: 3px; font-family: monospace;">WASD</span> or 
                        <span style="border: 1px solid #ffaa22; padding: 1px 4px; border-radius: 3px; font-family: monospace;">MOUSE</span> Fly 360° • 
                        <span style="border: 1px solid #ffaa22; padding: 1px 4px; border-radius: 3px; font-family: monospace;">SPACE</span> Pulse
                    </div>
                </div>
                <canvas id="cs3d-radar-canvas" class="ch-radar" width="140" height="140"></canvas>
            `;
            document.body.appendChild(this.container);
            this.radarCvs = document.getElementById("cs3d-radar-canvas");
            this.radarCtx = this.radarCvs ? this.radarCvs.getContext("2d") : null;
        }

        update(p) {
            const massEl = document.getElementById("hud-val-mass");
            const spdEl = document.getElementById("hud-val-speed");
            const radEl = document.getElementById("hud-val-radius");

            if (massEl) {
                const m = p.mass || 100;
                massEl.textContent = (m * 42000).toLocaleString() + " M☉";
            }
            if (spdEl) {
                const spd = Math.hypot(p.vx || 0, p.vy || 0);
                spdEl.textContent = Math.round(spd * 3600).toLocaleString() + " km/h";
            }
            if (radEl) {
                const r = p.radius || 18;
                radEl.textContent = r.toFixed(1) + " km";
            }

            if (this.radarCtx) {
                const ctx = this.radarCtx;
                ctx.clearRect(0, 0, 140, 140);

                ctx.strokeStyle = "rgba(255, 170, 40, 0.25)";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(70, 70, 30, 0, Math.PI * 2);
                ctx.arc(70, 70, 60, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = "#ffaa22";
                ctx.shadowColor = "#ff7a00";
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(70, 70, 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                const sweepAngle = (performance.now() * 0.002) % (Math.PI * 2);
                ctx.strokeStyle = "rgba(255, 200, 80, 0.6)";
                ctx.beginPath();
                ctx.moveTo(70, 70);
                ctx.lineTo(70 + Math.cos(sweepAngle) * 60, 70 + Math.sin(sweepAngle) * 60);
                ctx.stroke();
            }
        }
    }

    // ------------------------------------------------------------------------
    // MAIN CARTRIDGE VISUAL HOOKS FOR 3D RENDERER
    // ------------------------------------------------------------------------
    const CosmicSingularity3DVisuals = {
        title: "Cosmic Singularity 3D - Relativistic Gargantua Universe",
        rendererType: "webgl3d",
        canvas: {
            width: 8000,
            height: 8000
        },
        hud: {
            showHealth: false,
            stats: [
                { id: "mass", label: "MASS", highlight: true },
                { id: "radius", label: "HORIZON (KM)" }
            ]
        },
        drawHooks: {
            // =================================================================
            // BLACK HOLE (Player & Rivals: Gargantua Relativistic Structure)
            // =================================================================
            blackholes: function (renderer, p, THREE, mesh) {
                const px = p.x || 2000;
                const pz = p.y || 2000;
                const r = p.radius || 18;

                if (!_hudInstance && typeof document !== "undefined") {
                    _hudInstance = new HolographicCosmicHUD();
                }
                if (_hudInstance && renderer.myPlayer && renderer.myPlayer.id === p.id) {
                    _hudInstance.update(p);
                }

                if (!mesh) {
                    const group = new THREE.Group();

                    // 1. Pure Pitch-Black Event Horizon Sphere
                    const horizonGeom = new THREE.SphereGeometry(1, 48, 48);
                    const horizonMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
                    const horizon = new THREE.Mesh(horizonGeom, horizonMat);
                    horizon.name = "horizon";
                    group.add(horizon);

                    // 2. Razor-Sharp Incandescent Photon Ring (Inner edge)
                    const pRingGeom = new THREE.PlaneGeometry(1, 1);
                    const pRingMat = new THREE.MeshBasicMaterial({
                        map: getPhotonRingTexture(),
                        transparent: true,
                        side: THREE.DoubleSide,
                        blending: THREE.AdditiveBlending,
                        depthWrite: false
                    });
                    const photonRing = new THREE.Mesh(pRingGeom, pRingMat);
                    photonRing.name = "photonRing";
                    group.add(photonRing);

                    // 3. Vertical Gravitational Lensing Halo (The Iconic Upper/Lower Curved Arches)
                    const haloGeom = new THREE.PlaneGeometry(1, 1);
                    const haloMat = new THREE.MeshBasicMaterial({
                        map: getGargantuaLensHaloTexture(),
                        transparent: true,
                        blending: THREE.AdditiveBlending,
                        side: THREE.DoubleSide,
                        depthWrite: false
                    });
                    const halo = new THREE.Mesh(haloGeom, haloMat);
                    halo.name = "halo";
                    group.add(halo);

                    // 4. Equatorial Accretion Disk (Passes in front and around horizon in X-Z plane)
                    const diskGeom = new THREE.RingGeometry(1.05, 4.4, 96);
                    const diskMat = new THREE.MeshBasicMaterial({
                        map: getGargantuaDiskTexture(),
                        transparent: true,
                        side: THREE.DoubleSide,
                        blending: THREE.AdditiveBlending,
                        depthWrite: false
                    });
                    const disk = new THREE.Mesh(diskGeom, diskMat);
                    disk.name = "disk";
                    disk.rotation.x = Math.PI / 2;
                    group.add(disk);

                    // 5. Smooth Translucent Quantum Shield Bubble
                    const shieldGeom = new THREE.SphereGeometry(1, 32, 32);
                    const shieldMat = new THREE.MeshBasicMaterial({
                        color: 0xffaa22,
                        transparent: true,
                        opacity: 0.32,
                        blending: THREE.AdditiveBlending
                    });
                    const shield = new THREE.Mesh(shieldGeom, shieldMat);
                    shield.name = "shield";
                    shield.visible = false;
                    group.add(shield);

                    mesh = group;
                }

                const seed = (p.id ? String(p.id).charCodeAt(0) * 0.77 : 3.5);
                const py = p.isBot ? Math.sin(seed * 4.3) * 12 : 0;
                mesh.position.set(px, py, pz);

                const horizon = mesh.getObjectByName("horizon");
                if (horizon) horizon.scale.set(r, r, r);

                const photonRing = mesh.getObjectByName("photonRing");
                if (photonRing) {
                    const pRSize = r * 2.3;
                    photonRing.scale.set(pRSize, pRSize, 1);
                    if (renderer.camera3D) {
                        photonRing.quaternion.copy(renderer.camera3D.quaternion);
                    }
                }

                const halo = mesh.getObjectByName("halo");
                if (halo) {
                    const haloSize = r * 4.6;
                    halo.scale.set(haloSize, haloSize, 1);
                    if (renderer.camera3D) {
                        halo.quaternion.copy(renderer.camera3D.quaternion);
                    }
                }

                const disk = mesh.getObjectByName("disk");
                if (disk) {
                    disk.scale.set(r, r, 1);
                    disk.rotation.z += 0.016;
                }

                const shield = mesh.getObjectByName("shield");
                if (shield) {
                    if (p.spawnImmunity > 0) {
                        shield.visible = true;
                        const sR = r * 2.2;
                        shield.scale.set(sR, sR, sR);
                    } else {
                        shield.visible = false;
                    }
                }

                return mesh;
            },

            // =================================================================
            // ASTEROIDS (Solid, Watertight, Cratered Boulders - Zero Broken Triangles!)
            // =================================================================
            asteroids: function (renderer, p, THREE, mesh) {
                const px = p.x || 0;
                const pz = p.y || 0;
                const r = p.radius || 25;

                if (!mesh) {
                    const seed = (p.id ? String(p.id).charCodeAt(0) * 0.77 : Math.random() * 10);
                    const geom = createCrateredRockGeometry(seed);
                    const textures = getAsteroidTextures();

                    const mat = new THREE.MeshStandardMaterial({
                        map: textures.map,
                        bumpMap: textures.bump,
                        bumpScale: 0.12,
                        roughness: 0.88,
                        metalness: 0.10,
                        flatShading: false
                    });

                    const rock = new THREE.Mesh(geom, mat);
                    rock.userData = {
                        rotX: (Math.sin(seed * 2.1) * 0.012),
                        rotY: (Math.cos(seed * 1.7) * 0.012),
                        rotZ: (Math.sin(seed * 3.3) * 0.008)
                    };
                    mesh = rock;
                }

                mesh.position.set(px, 0, pz);
                mesh.scale.set(r, r, r);

                mesh.rotation.x += mesh.userData.rotX;
                mesh.rotation.y += mesh.userData.rotY;
                mesh.rotation.z += mesh.userData.rotZ;

                return mesh;
            },

            // =================================================================
            // STARDUST (Glowing Luminous Celestial Motes - Smooth 3D Spheres, NO QUADS!)
            // =================================================================
            stardust: function (renderer, p, THREE, mesh) {
                const px = p.x || 0;
                const pz = p.y || 0;
                const r = p.radius || 4.5;

                if (!mesh) {
                    const group = new THREE.Group();

                    // 1. Blinding Incandescent Core (White Spark)
                    const coreGeom = new THREE.SphereGeometry(1.0, 10, 10);
                    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
                    const core = new THREE.Mesh(coreGeom, coreMat);
                    core.name = "core";
                    group.add(core);

                    // 2. Radiant Golden Amber Corona
                    const haloGeom = new THREE.SphereGeometry(1.8, 10, 10);
                    const colHex = p.color ? parseInt(p.color.replace("#", "0x")) : 0xffaa22;
                    const haloMat = new THREE.MeshBasicMaterial({
                        color: colHex,
                        transparent: true,
                        opacity: 0.65,
                        blending: THREE.AdditiveBlending
                    });
                    const halo = new THREE.Mesh(haloGeom, haloMat);
                    halo.name = "halo";
                    group.add(halo);

                    mesh = group;
                }

                const time = performance.now() * 0.001;
                const sSeed = (p.id ? String(p.id).charCodeAt(0) : (p.seed || 1));
                const yBase = Math.sin(sSeed * 7.7) * 45;
                const yBob = yBase + Math.sin(time * 2.2 + sSeed) * 8;
                mesh.position.set(px, yBob, pz);
                mesh.scale.set(r, r, r);

                return mesh;
            },

            // =================================================================
            // PLANETS (Terrestrial & Exotic Worlds)
            // =================================================================
            planets: function (renderer, p, THREE, mesh) {
                const px = p.x || 0;
                const pz = p.y || 0;
                const r = p.radius || 15;
                const planetPalettes = [0x0284c7, 0xd97706, 0x0f766e, 0x8b5cf6, 0x64748b, 0x1e3a8a];
                const pIdx = Math.abs((p.id ? String(p.id).charCodeAt(0) : 0)) % planetPalettes.length;
                const colHex = planetPalettes[pIdx];

                if (!mesh) {
                    const group = new THREE.Group();

                    const geom = new THREE.SphereGeometry(1, 36, 36);
                    const mat = new THREE.MeshStandardMaterial({
                        color: colHex,
                        roughness: 0.65,
                        metalness: 0.20
                    });
                    const sphere = new THREE.Mesh(geom, mat);
                    sphere.name = "planetSphere";
                    group.add(sphere);

                    const atmosGeom = new THREE.SphereGeometry(1.12, 32, 32);
                    const atmosMat = new THREE.MeshBasicMaterial({
                        color: 0x38bdf8,
                        transparent: true,
                        opacity: 0.32,
                        side: THREE.BackSide,
                        blending: THREE.AdditiveBlending
                    });
                    const atmos = new THREE.Mesh(atmosGeom, atmosMat);
                    atmos.name = "atmos";
                    group.add(atmos);

                    mesh = group;
                }

                const pSeed = (p.id ? String(p.id).charCodeAt(0) : 2);
                const py = Math.sin(pSeed * 5.1) * 60;
                mesh.position.set(px, py, pz);
                const sphere = mesh.getObjectByName("planetSphere");
                if (sphere) {
                    sphere.scale.set(r, r, r);
                    sphere.rotation.y += 0.008;
                }
                const atmos = mesh.getObjectByName("atmos");
                if (atmos) atmos.scale.set(r, r, r);

                return mesh;
            },

            // =================================================================
            // PULSARS (Astrophysical Relativistic Jet Beams - NO FANS!)
            // =================================================================
            pulsars: function (renderer, p, THREE, mesh) {
                const px = p.x || 0;
                const pz = p.y || 0;
                const r = p.radius || 20;
                const bAngle = p.beamAngle || 0;
                const bLen = p.beamLength || 650;

                if (!mesh) {
                    const group = new THREE.Group();

                    // 1. Blinding Diamond-White Neutron Core
                    const coreGeom = new THREE.SphereGeometry(1, 32, 32);
                    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
                    const core = new THREE.Mesh(coreGeom, coreMat);
                    core.name = "core";
                    group.add(core);

                    // 2. High-Energy Magnetospheric Corona
                    const coronaGeom = new THREE.SphereGeometry(1.3, 24, 24);
                    const coronaMat = new THREE.MeshBasicMaterial({
                        color: 0x38bdf8,
                        transparent: true,
                        opacity: 0.55,
                        blending: THREE.AdditiveBlending
                    });
                    const corona = new THREE.Mesh(coronaGeom, coronaMat);
                    corona.name = "corona";
                    group.add(corona);

                    // 3. Equatorial Magnetic Field Ring
                    const ringGeom = new THREE.RingGeometry(1.4, 1.65, 36);
                    const ringMat = new THREE.MeshBasicMaterial({
                        color: 0x00f0ff,
                        transparent: true,
                        opacity: 0.65,
                        side: THREE.DoubleSide,
                        blending: THREE.AdditiveBlending
                    });
                    const ring = new THREE.Mesh(ringGeom, ringMat);
                    ring.rotation.x = Math.PI / 2;
                    group.add(ring);

                    // 4. Sleek Relativistic Laser Jets (Thin, High-Energy Collimated Beams)
                    const beamGroup = new THREE.Group();
                    beamGroup.name = "beamGroup";

                    for (let pole = 0; pole < 2; pole++) {
                        const poleBeam = new THREE.Group();

                        // Needle Core (Intense 1.5px laser ray)
                        const needleGeom = new THREE.CylinderGeometry(1.2, 1.8, bLen, 12);
                        needleGeom.translate(0, bLen / 2, 0);
                        const needleMat = new THREE.MeshBasicMaterial({
                            color: 0xffffff,
                            transparent: true,
                            opacity: 0.95,
                            blending: THREE.AdditiveBlending
                        });
                        const needle = new THREE.Mesh(needleGeom, needleMat);
                        poleBeam.add(needle);

                        // Luminous Plasma Glow Sheath (soft 6px aura)
                        const sheathGeom = new THREE.CylinderGeometry(4.5, 7.5, bLen, 16);
                        sheathGeom.translate(0, bLen / 2, 0);
                        const sheathMat = new THREE.MeshBasicMaterial({
                            color: 0x00f0ff,
                            transparent: true,
                            opacity: 0.38,
                            blending: THREE.AdditiveBlending,
                            depthWrite: false
                        });
                        const sheath = new THREE.Mesh(sheathGeom, sheathMat);
                        poleBeam.add(sheath);

                        // Orient along horizontal axis: pole 0 (+X), pole 1 (-X)
                        poleBeam.rotation.z = pole === 0 ? -Math.PI / 2 : Math.PI / 2;
                        beamGroup.add(poleBeam);
                    }
                    group.add(beamGroup);

                    mesh = group;
                }

                mesh.position.set(px, 0, pz);

                const core = mesh.getObjectByName("core");
                if (core) core.scale.set(r, r, r);

                const corona = mesh.getObjectByName("corona");
                if (corona) {
                    corona.scale.set(r, r, r);
                    corona.rotation.y += 0.02;
                }

                const beamGroup = mesh.getObjectByName("beamGroup");
                if (beamGroup) {
                    beamGroup.rotation.y = -bAngle;
                }

                return mesh;
            }
        }
    };

    global.CartridgeVisuals = CosmicSingularity3DVisuals;
})(typeof window !== "undefined" ? window : global);
