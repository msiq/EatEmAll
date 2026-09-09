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

    // ------------------------------------------------------------------------
    // HUD LANES
    // Every panel owns one lane and nothing shares. The engine's universal HUD
    // (engine/src/client/index.html) also draws into the top row, so this
    // cartridge takes the top-left lane and hands the top-right lane back to
    // the engine for the FPS readout, the audio toggle and the settings button.
    //
    //   top-left      player stats            (this cartridge)
    //   top-right     FPS / audio / settings  (engine top bar)
    //   right         leaderboard             (engine, below the top bar)
    //   bottom-left   radar                   (this cartridge)
    //   bottom-right  control hints           (this cartridge, fades)
    // ------------------------------------------------------------------------
    const HUD_EDGE = 20;          // distance of every panel from its screen edge
    const RADAR_SIZE = 160;
    const HINT_FADE_AFTER = 14;   // seconds before the control hints dim

    class HolographicCosmicHUD {
        constructor() {
            this.born = performance.now();
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
                    /* The engine top bar repeats MASS and HORIZON, which this
                       cartridge already shows in more detail on the left. Two
                       copies of the same numbers sat on top of each other. */
                    #hud-game-title-pill, #hud-stats-container { display: none !important; }

                    .ch-corner-box {
                        position: absolute;
                        background: rgba(8, 14, 26, 0.72);
                        backdrop-filter: blur(14px);
                        border: 1px solid rgba(255, 170, 40, 0.35);
                        box-shadow: 0 0 25px rgba(255, 120, 10, 0.18), inset 0 0 15px rgba(255, 180, 50, 0.08);
                        border-radius: 6px;
                        padding: 12px 18px;
                    }
                    .ch-top-left { top: ${HUD_EDGE}px; left: ${HUD_EDGE}px; min-width: 240px; }
                    .ch-bottom-right {
                        bottom: ${HUD_EDGE}px; right: ${HUD_EDGE}px; text-align: right;
                        transition: opacity 1.2s ease;
                    }
                    .ch-radar-wrap {
                        position: absolute;
                        bottom: ${HUD_EDGE}px; left: ${HUD_EDGE}px;
                        width: ${RADAR_SIZE}px;
                        background: rgba(8, 14, 26, 0.75);
                        border: 1px solid rgba(255, 170, 40, 0.35);
                        border-radius: 6px;
                        backdrop-filter: blur(14px);
                        box-shadow: 0 0 25px rgba(255, 120, 10, 0.18);
                        padding: 8px 8px 6px;
                    }
                    .ch-radar-label {
                        font-size: 9px; letter-spacing: 1.4px; text-transform: uppercase;
                        color: #ffaa22; text-align: center; margin-top: 5px;
                        text-shadow: 0 0 8px rgba(255,170,34,0.5);
                        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                    }
                    .ch-title {
                        font-size: 11px; font-weight: 800; letter-spacing: 2px;
                        color: #ffaa22; text-transform: uppercase; margin-bottom: 6px;
                        text-shadow: 0 0 10px rgba(255, 170, 34, 0.6);
                    }
                    .ch-row { display: flex; justify-content: space-between; gap: 18px; font-size: 12px; margin: 4px 0; font-family: monospace; }
                    .ch-val { font-weight: 700; color: #ffffff; text-shadow: 0 0 8px rgba(255, 255, 255, 0.4); }
                    .ch-key {
                        border: 1px solid #ffaa22; padding: 1px 4px;
                        border-radius: 3px; font-family: monospace;
                    }
                </style>
                <div class="ch-corner-box ch-top-left">
                    <div class="ch-title">PLAYER: GARGANTUA SINGULARITY</div>
                    <div class="ch-row"><span>MASS:</span><span class="ch-val" id="hud-val-mass">4.20e+6 M☉</span></div>
                    <div class="ch-row"><span>RELATIVISTIC VEL:</span><span class="ch-val" id="hud-val-speed">0 km/h</span></div>
                    <div class="ch-row"><span>EVENT HORIZON:</span><span class="ch-val" id="hud-val-radius">18.5 km</span></div>
                </div>
                <div class="ch-corner-box ch-bottom-right" id="cs3d-hints">
                    <div style="font-size: 11px; color: #cbd5e1;">
                        <span class="ch-key">WASD</span> or
                        <span class="ch-key">MOUSE</span> Fly 360° •
                        <span class="ch-key">SPACE</span> Pulse
                    </div>
                </div>
                <div class="ch-radar-wrap">
                    <canvas id="cs3d-radar-canvas" width="${RADAR_SIZE - 16}" height="${RADAR_SIZE - 16}"
                            style="display:block;width:${RADAR_SIZE - 16}px;height:${RADAR_SIZE - 16}px"></canvas>
                    <div class="ch-radar-label" id="cs3d-radar-label">—</div>
                </div>
            `;
            document.body.appendChild(this.container);
            this.radarCvs = document.getElementById("cs3d-radar-canvas");
            this.radarCtx = this.radarCvs ? this.radarCvs.getContext("2d") : null;
            this.hints = document.getElementById("cs3d-hints");
            this.radarLabel = document.getElementById("cs3d-radar-label");
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

            // Control hints have done their job after the first few seconds.
            if (this.hints) {
                const age = (performance.now() - this.born) / 1000;
                this.hints.style.opacity = age > HINT_FADE_AFTER ? "0.3" : "1";
            }

            this.drawRadar(p);
        }

        /**
         * A minimap of the galaxy you are in: the disc, your position, rival
         * singularities colour-coded by threat, and the gateway out. The old
         * version drew two rings and a sweep line and plotted nothing at all.
         */
        drawRadar(p) {
            const ctx = this.radarCtx;
            if (!ctx) return;

            const app = window.__engineApp;
            const S = this.radarCvs.width;
            const c = S / 2;
            ctx.clearRect(0, 0, S, S);

            if (!app || !app.interpolator) return;
            const galaxies = [...app.interpolator.getCollection("galaxies").values()];
            if (!galaxies.length) return;

            // The disc we are inside (or nearest to).
            let home = galaxies[0], best = Infinity;
            for (const g of galaxies) {
                const d = Math.hypot(p.x - g.x, p.y - g.y);
                if (d < best) { best = d; home = g; }
            }
            const R = home.radius || 9000;
            const scale = (c - 6) / R;
            const toRadar = (wx, wy) => ({ x: c + (wx - home.x) * scale, y: c + (wy - home.y) * scale });

            // Galaxy rim
            ctx.strokeStyle = "rgba(255, 170, 40, 0.35)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(c, c, R * scale, 0, Math.PI * 2);
            ctx.stroke();

            // Arms, so the map matches what is out of the window
            ctx.strokeStyle = "rgba(255, 170, 40, 0.13)";
            const arms = home.arms || 2, twist = home.twist || 2.6;
            for (let a = 0; a < arms; a++) {
                ctx.beginPath();
                for (let t = 0; t <= 1; t += 0.02) {
                    const th = (a / arms) * Math.PI * 2 + t * twist * Math.PI;
                    const rr = R * (ARM_INNER + t * ARM_OUTER) * scale;
                    const x = c + Math.cos(th) * rr, y = c + Math.sin(th) * rr;
                    if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }

            // Core. The gateway out of this galaxy sits here too, so one marker
            // serves for both: an amber core inside a violet exit ring.
            const hasGate = [...app.interpolator.getCollection("wormholes").values()]
                .some(wh => Math.hypot(wh.x - home.x, wh.y - home.y) <= R * 1.05);

            ctx.fillStyle = "rgba(255, 210, 130, 0.75)";
            ctx.beginPath();
            ctx.arc(c, c, 2.5, 0, Math.PI * 2);
            ctx.fill();

            if (hasGate) {
                ctx.strokeStyle = "rgba(192, 132, 252, 0.9)";
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.arc(c, c, 5.5, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Rivals, colour-coded by whether they can eat you
            const myMass = p.mass || 100;
            for (const bh of app.interpolator.getCollection("blackholes").values()) {
                if (bh.id === p.id) continue;
                if (Math.hypot(bh.x - home.x, bh.y - home.y) > R * 1.05) continue;
                const q = toRadar(bh.x, bh.y);
                const bigger = (bh.mass || 0) > myMass * 1.1;
                ctx.fillStyle = bigger ? "#f87171" : "rgba(148, 197, 255, 0.85)";
                ctx.beginPath();
                ctx.arc(q.x, q.y, bigger ? 3 : 2.2, 0, Math.PI * 2);
                ctx.fill();
            }

            // You, with a heading tick
            const me = toRadar(p.x, p.y);
            ctx.fillStyle = "#ffaa22";
            ctx.shadowColor = "#ff7a00";
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(me.x, me.y, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            const heading = Math.atan2(p.vy || 0, p.vx || 0);
            if (Math.hypot(p.vx || 0, p.vy || 0) > 5) {
                ctx.strokeStyle = "rgba(255, 200, 80, 0.9)";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(me.x, me.y);
                ctx.lineTo(me.x + Math.cos(heading) * 9, me.y + Math.sin(heading) * 9);
                ctx.stroke();
            }

            if (this.radarLabel) this.radarLabel.textContent = home.name || "—";
        }
    }

    // ------------------------------------------------------------------------
    // GALAXY DISCS - procedural spiral texture, one palette per galaxy
    // ------------------------------------------------------------------------
    // ARM GEOMETRY MUST MATCH server/galaxies.js spiralPoint(). The stardust and
    // planets are scattered against that formula; if these drift apart the arms
    // drawn here stop lining up with where the loot actually is.
    const ARM_INNER = 0.13;
    const ARM_OUTER = 0.87;
    const SPREAD_BASE = 0.034;
    const SPREAD_GROWTH = 0.117;

    const GALAXY_PALETTES = {
        amber: {
            core:     ["rgba(255,255,245,1)", "rgba(255,214,140,0.95)", "rgba(240,150,45,0.55)"],
            stars:    ["rgba(255,248,232,", "rgba(255,208,150,", "rgba(255,170,90,"],
            armGlow:  "rgba(220,150,70,",
            dust:     "rgba(28,10,4,",
            rim:      "rgba(190,120,55,",
            haze:     "rgba(90,50,20,"
        },
        azure: {
            core:     ["rgba(255,255,255,1)", "rgba(198,228,255,0.95)", "rgba(90,150,255,0.55)"],
            stars:    ["rgba(255,255,255,", "rgba(170,215,255,", "rgba(120,180,255,"],
            armGlow:  "rgba(90,150,255,",
            dust:     "rgba(6,14,40,",
            rim:      "rgba(90,160,235,",
            haze:     "rgba(25,55,120,"
        },
        violet: {
            core:     ["rgba(255,255,255,1)", "rgba(226,200,255,0.95)", "rgba(150,90,240,0.55)"],
            stars:    ["rgba(255,255,255,", "rgba(210,175,255,", "rgba(255,150,220,"],
            armGlow:  "rgba(150,110,245,",
            dust:     "rgba(28,8,38,",
            rim:      "rgba(180,110,230,",
            haze:     "rgba(60,30,110,"
        }
    };

    // Deterministic so a galaxy looks identical on every client and reload.
    function mulberry32(a) {
        return function () {
            a |= 0; a = a + 0x6D2B79F5 | 0;
            let t = Math.imul(a ^ a >>> 15, 1 | a);
            t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        };
    }

    // Presentation tunables for the galaxy discs.
    const HOME_DISC_Y = -1100;       // how far the plane sits below the action
    const HOME_DISC_OPACITY = 0.34;  // dim enough that entities stay readable
    const SKY_DIST = 38000;          // where neighbours are parked in the sky
    const SKY_Y = 6400;              // high enough to clear the play area
    const SKY_SIZE = 9000;           // apparent size of a neighbour
    const SKY_OPACITY = 0.5;         // a landmark, not a spotlight

    // Edible stardust: larger than the decorative motes, with a slow steady
    // breath rather than a fast random twinkle.
    const GATEWAY_Y = -60;        // sits just under the play plane
    const GATEWAY_FADE = 2600;    // distance over which the aperture fades in
    const STARDUST_CULL = 3600;   // how far out stardust still gets a mesh
    const EDIBLE_SCALE = 1.55;
    const EDIBLE_PULSE_RATE = Math.PI * 2 / 1.6;   // one breath every 1.6s
    const EDIBLE_PULSE_DEPTH = 0.16;

    // Motes making up the volumetric arms of the galaxy you are inside.
    // 90k looked dense in a small preview pane but thin at 1280p, where the same
    // motes cover ~5x the screen area. Density is per-pixel, not per-scene.
    const ARM_MOTES = 180000;
    const ARM_THICKNESS = 380;    // vertical sigma - motes sit above AND below the field
    const ARM_TIGHTNESS = 0.55;   // how closely motes hug the arm spine

    // Decorative mote colours per palette. Deliberately desaturated whites and
    // pale tints: edible stardust is saturated, so colour alone separates the
    // things you can eat from the things you cannot.
    const ARM_MOTE_COLORS = {
        amber:  [0xfff6e6, 0xffdca8, 0xffc37e, 0xf0a95c],
        azure:  [0xf2f8ff, 0xc2ddff, 0x93c2ff, 0x6ea8f5],
        violet: [0xf7f2ff, 0xdcc4ff, 0xc09bff, 0xa87ff0]
    };
    const ARM_CORE_GLOW = { amber: 0xffce8a, azure: 0xa8d0ff, violet: 0xc9a0ff };

    const ARM_VERT = [
        "attribute float aPhase;",
        "attribute float aSize;",
        "attribute vec3  aColor;",
        "uniform float uTime;",
        "uniform float uPixelScale;",
        "varying vec3  vColor;",
        "varying float vTw;",
        "void main() {",
        "    vec4 mv = modelViewMatrix * vec4(position, 1.0);",
        // Fast, per-mote-random twinkle. Edible stardust pulses slowly instead,
        // so the two read apart by motion as well as by colour.
        "    float tw = 0.45 + 0.55 * sin(uTime * 2.1 + aPhase);",
        "    vTw = tw;",
        "    vColor = aColor;",
        "    gl_PointSize = aSize * (0.70 + 0.60 * tw) * (uPixelScale / max(-mv.z, 1.0));",
        "    gl_Position = projectionMatrix * mv;",
        "}"
    ].join("\n");

    const ARM_FRAG = [
        "varying vec3  vColor;",
        "varying float vTw;",
        "void main() {",
        "    vec2 d = gl_PointCoord - vec2(0.5);",
        "    float r = length(d);",
        "    if (r > 0.5) discard;",
        "    float a = smoothstep(0.5, 0.0, r);",
        "    gl_FragColor = vec4(vColor * (0.55 + vTw), a * (0.30 + 0.70 * vTw));",
        "}"
    ].join("\n");

    /**
     * The galaxy you are inside, as a volume of twinkling motes scattered along
     * the same spiral the server spawns against. Client-side only - it costs
     * nothing on the wire.
     */
    function buildArmVolume(THREE, g) {
        const colors = ARM_MOTE_COLORS[g.palette] || ARM_MOTE_COLORS.amber;
        const arms = g.arms || 2;
        const twist = g.twist || 2.6;
        const R = g.radius || 9000;
        const rng = mulberry32((g.seed || 1) * 977 + 13);

        const pos = new Float32Array(ARM_MOTES * 3);
        const col = new Float32Array(ARM_MOTES * 3);
        const size = new Float32Array(ARM_MOTES);
        const phase = new Float32Array(ARM_MOTES);
        const c = new THREE.Color();

        for (let i = 0; i < ARM_MOTES; i++) {
            // sqrt gives even density per unit AREA. Uniform t looks even along
            // a radius but thins as 1/r, leaving the outer disc - where players
            // actually fly - noticeably empty.
            const t = Math.sqrt(rng());
            const arm = Math.floor(rng() * arms) % arms;
            const th = (arm / arms) * Math.PI * 2 + t * twist * Math.PI;
            const r = R * (ARM_INNER + t * ARM_OUTER);
            const spread = R * (SPREAD_BASE + t * SPREAD_GROWTH) * ARM_TIGHTNESS;

            pos[i * 3]     = g.x + Math.cos(th) * r + (rng() + rng() + rng() - 1.5) * 2 * spread;
            pos[i * 3 + 1] = (rng() + rng() + rng() - 1.5) * 2 * ARM_THICKNESS * (0.6 + t * 0.9);
            pos[i * 3 + 2] = g.y + Math.sin(th) * r + (rng() + rng() + rng() - 1.5) * 2 * spread;

            const towardCore = 1 - t;
            c.setHex(colors[rng() < 0.4 + towardCore * 0.35 ? 0 : 1 + Math.floor(rng() * (colors.length - 1))]);
            col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;

            size[i] = (rng() < 0.03 ? 5.5 + rng() * 5 : 1.5 + rng() * 2.6) * (0.7 + towardCore * 0.8);
            phase[i] = rng() * Math.PI * 2;
        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geom.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
        geom.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
        geom.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));

        const pts = new THREE.Points(geom, new THREE.ShaderMaterial({
            // uPixelScale is refreshed from the viewport height each frame:
            // gl_PointSize is in device pixels, so a fixed value makes the motes
            // shrink and the galaxy look thin on a large display.
            uniforms: { uTime: { value: 0 }, uPixelScale: { value: 900 } },
            vertexShader: ARM_VERT,
            fragmentShader: ARM_FRAG,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        }));
        // The volume surrounds the camera, so the bounding sphere test is useless.
        pts.frustumCulled = false;
        pts.renderOrder = -10;
        return pts;
    }

    /** Soft glowing bulge at the galactic core. */
    function buildCoreGlow(THREE, g) {
        const cvs = document.createElement("canvas");
        cvs.width = cvs.height = 256;
        const x = cvs.getContext("2d");
        const col = new THREE.Color(ARM_CORE_GLOW[g.palette] || ARM_CORE_GLOW.amber);
        const rgb = Math.round(col.r * 255) + "," + Math.round(col.g * 255) + "," + Math.round(col.b * 255);
        const gr = x.createRadialGradient(128, 128, 0, 128, 128, 126);
        gr.addColorStop(0.00, "rgba(255,255,255,0.95)");
        gr.addColorStop(0.18, "rgba(" + rgb + ",0.75)");
        gr.addColorStop(0.45, "rgba(" + rgb + ",0.28)");
        gr.addColorStop(1.00, "rgba(" + rgb + ",0)");
        x.fillStyle = gr;
        x.fillRect(0, 0, 256, 256);

        const tex = new THREE.CanvasTexture(cvs);
        tex.encoding = THREE.sRGBEncoding;
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({
            map: tex, transparent: true, blending: THREE.AdditiveBlending,
            depthWrite: false, opacity: 0.45
        }));
        // radius*0.9 made an 8000-unit blob that drowned the arms.
        sp.scale.set(g.radius * 0.30, g.radius * 0.30, 1);
        sp.position.set(g.x, 0, g.y);
        sp.renderOrder = -10;
        return sp;
    }

    const _galaxyTexCache = {};

    function getGalaxyTexture(palette, arms, twist, seed) {
        const key = palette + "|" + arms + "|" + twist + "|" + seed;
        if (_galaxyTexCache[key]) return _galaxyTexCache[key];

        const P = GALAXY_PALETTES[palette] || GALAXY_PALETTES.amber;
        const size = 1536;
        const rng = mulberry32(seed || 1);

        const cvs = document.createElement("canvas");
        cvs.width = cvs.height = size;
        const ctx = cvs.getContext("2d");
        const c = size / 2;
        const R = size * 0.47;

        // 1. Outer halo haze
        const haze = ctx.createRadialGradient(c, c, R * 0.15, c, c, R);
        haze.addColorStop(0.0, P.haze + "0.42)");
        haze.addColorStop(0.55, P.haze + "0.14)");
        haze.addColorStop(1.0, P.haze + "0)");
        ctx.fillStyle = haze;
        ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.fill();

        // 2. Dust lanes, trailing just inside each arm
        for (let a = 0; a < arms; a++) {
            const base = (a / arms) * Math.PI * 2 + 0.22;
            ctx.beginPath();
            for (let t = 0; t <= 1.0; t += 0.004) {
                const th = base + t * twist * Math.PI;
                const r = R * (ARM_INNER + t * ARM_OUTER);
                const x = c + Math.cos(th) * r, y = c + Math.sin(th) * r;
                if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = P.dust + "0.75)";
            ctx.lineWidth = size * 0.030;
            ctx.lineCap = "round";
            ctx.stroke();
        }

        // 3. Arm glow ribbons
        ctx.globalCompositeOperation = "lighter";
        for (let a = 0; a < arms; a++) {
            const base = (a / arms) * Math.PI * 2;
            for (let pass = 0; pass < 3; pass++) {
                ctx.beginPath();
                for (let t = 0; t <= 1.0; t += 0.004) {
                    const th = base + t * twist * Math.PI;
                    const r = R * (ARM_INNER + t * ARM_OUTER);
                    const x = c + Math.cos(th) * r, y = c + Math.sin(th) * r;
                    if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.strokeStyle = P.armGlow + (0.040 + pass * 0.024) + ")";
                ctx.lineWidth = size * (0.075 - pass * 0.021);
                ctx.lineCap = "round";
                ctx.stroke();
            }
        }

        // 4. Star population along the arms - same gaussian spread the server spawns with
        const STARS = 17000;
        for (let i = 0; i < STARS; i++) {
            const t = Math.pow(rng(), 0.62);
            const arm = Math.floor(rng() * arms) % arms;
            const th = (arm / arms) * Math.PI * 2 + t * twist * Math.PI;
            const r = R * (ARM_INNER + t * ARM_OUTER);
            const spread = R * (SPREAD_BASE + t * SPREAD_GROWTH);
            const x = c + Math.cos(th) * r + (rng() + rng() + rng() - 1.5) * 2 * spread;
            const y = c + Math.sin(th) * r + (rng() + rng() + rng() - 1.5) * 2 * spread;
            const d = Math.hypot(x - c, y - c);
            if (d > R) continue;

            const fade = 1 - d / R;
            const alpha = (0.14 + rng() * 0.44) * (0.35 + fade);
            const rad = rng() < 0.02 ? 1.6 + rng() * 1.8 : 0.4 + rng() * 0.85;
            ctx.fillStyle = P.stars[Math.floor(rng() * P.stars.length)] + alpha.toFixed(3) + ")";
            ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
        }

        // 5. Core bulge
        const core = ctx.createRadialGradient(c, c, 0, c, c, R * 0.30);
        core.addColorStop(0.00, P.core[0]);
        core.addColorStop(0.16, P.core[1]);
        core.addColorStop(0.45, P.core[2]);
        core.addColorStop(1.00, "rgba(0,0,0,0)");
        ctx.fillStyle = core;
        ctx.beginPath(); ctx.arc(c, c, R * 0.30, 0, Math.PI * 2); ctx.fill();

        // 6. Rim - the boundary players cannot cross
        const rim = ctx.createRadialGradient(c, c, R * 0.88, c, c, R);
        rim.addColorStop(0.0, P.rim + "0)");
        rim.addColorStop(0.75, P.rim + "0.30)");
        rim.addColorStop(1.0, P.rim + "0)");
        ctx.fillStyle = rim;
        ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.fill();

        // 7. Trim to the disc
        ctx.globalCompositeOperation = "destination-in";
        const mask = ctx.createRadialGradient(c, c, R * 0.90, c, c, R);
        mask.addColorStop(0, "rgba(0,0,0,1)");
        mask.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = mask;
        ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.fill();
        ctx.globalCompositeOperation = "source-over";

        _galaxyTexCache[key] = cvs;
        return cvs;
    }

    // ------------------------------------------------------------------------
    // MAIN CARTRIDGE VISUAL HOOKS FOR 3D RENDERER
    // ------------------------------------------------------------------------
    const CosmicSingularity3DVisuals = {
        title: "Cosmic Singularity 3D - Relativistic Gargantua Universe",
        rendererType: "webgl3d",
        // Neighbouring galaxies are this cartridge's sky landmarks - the stock
        // gas giant and sun flare are camera-pinned and out of scale here.
        backdrop: { planet: false, sun: false },
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
        // Galaxies paint first, everything else sits on top of them.
        layerOrder: ["galaxies", "wormholes", "stardust", "planets", "asteroids", "pulsars", "blackholes"],

        drawHooks: {
            // =================================================================
            // GALAXY DISC
            //   - the one you are in becomes the plane you fly over
            //   - the others hang in the sky, in the true direction of their
            //     gateway, so the horizon tells you where to fly
            // =================================================================
            galaxies: function (renderer, p, THREE, mesh) {
                const radius = p.radius || 9000;

                if (!mesh) {
                    // A group holding both presentations: the volume you fly
                    // through, and the billboard seen from another galaxy.
                    mesh = new THREE.Group();

                    const tex = new THREE.CanvasTexture(
                        getGalaxyTexture(p.palette, p.arms || 2, p.twist || 2.6, p.seed || 1)
                    );
                    // Painted in sRGB; without this the renderer's sRGB output
                    // pass brightens it and the disc washes the whole scene out.
                    tex.encoding = THREE.sRGBEncoding;
                    tex.needsUpdate = true;
                    tex.anisotropy = 8;
                    const sky = new THREE.Mesh(
                        new THREE.PlaneGeometry(radius * 2, radius * 2),
                        new THREE.MeshBasicMaterial({
                            map: tex,
                            transparent: true,
                            blending: THREE.AdditiveBlending,
                            depthWrite: false,
                            side: THREE.DoubleSide,
                            fog: false,
                            opacity: SKY_OPACITY
                        })
                    );
                    sky.name = "sky";
                    sky.renderOrder = -10;
                    mesh.add(sky);
                }

                const me = renderer.myPlayer;
                if (!me) { mesh.visible = false; return mesh; }
                mesh.visible = true;

                const dx = p.x - me.x;
                const dz = p.y - me.y;
                const dist = Math.hypot(dx, dz);
                const sky = mesh.getObjectByName("sky");
                const inside = dist <= radius * 1.05;

                if (inside) {
                    // Build the 90k-mote volume the first time this galaxy
                    // becomes home, then keep it for the rest of the session.
                    if (!mesh.userData.arms) {
                        mesh.userData.arms = buildArmVolume(THREE, p);
                        mesh.add(mesh.userData.arms);
                        mesh.add(buildCoreGlow(THREE, p));
                    }
                    mesh.userData.arms.visible = true;
                    const u = mesh.userData.arms.material.uniforms;
                    u.uTime.value = performance.now() * 0.001;
                    u.uPixelScale.value = renderer.height || 900;
                    const glow = mesh.children.find(o => o.isSprite);
                    if (glow) glow.visible = true;
                    sky.visible = false;
                } else {
                    // A landmark in the sky along the true bearing, so the
                    // horizon tells you where the gateway leads.
                    if (mesh.userData.arms) mesh.userData.arms.visible = false;
                    const glow = mesh.children.find(o => o.isSprite);
                    if (glow) glow.visible = false;

                    sky.visible = true;
                    const len = dist || 1;
                    sky.position.set(
                        me.x + (dx / len) * SKY_DIST,
                        SKY_Y,
                        me.y + (dz / len) * SKY_DIST
                    );
                    const k = SKY_SIZE / (radius * 2);
                    sky.scale.set(k, k, k);
                    sky.lookAt(me.x, SKY_Y * 0.25, me.y);
                    sky.rotateX(-0.34);
                    sky.rotateZ(((p.seed || 1) % 7) * 0.29);
                }

                return mesh;
            },

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
            // WORMHOLES (Inter-Galactic Gateways: Spinning Violet Event Ring)
            // =================================================================
            wormholes: function (renderer, p, THREE, mesh) {
                // The gateway IS the galactic core. Every galaxy has one in the
                // same place, so it needs no signpost of its own - the core glow
                // already tells you something is there. All this draws is a faint
                // aperture that only resolves once you are nearly on top of it.
                const r = p.radius || 400;

                if (!mesh) {
                    const group = new THREE.Group();

                    // A dark throat: a hole in the glow rather than an object.
                    const throat = new THREE.Mesh(
                        new THREE.CircleGeometry(1, 40),
                        new THREE.MeshBasicMaterial({
                            color: 0x04010a,
                            transparent: true,
                            opacity: 0.55,
                            side: THREE.DoubleSide,
                            depthWrite: false
                        })
                    );
                    throat.name = "throat";
                    throat.rotation.x = -Math.PI / 2;
                    group.add(throat);

                    // The faintest rim, so at close range the edge is readable.
                    const rim = new THREE.Mesh(
                        new THREE.TorusGeometry(1, 0.012, 10, 48),
                        new THREE.MeshBasicMaterial({
                            color: 0xc8b0ff,
                            transparent: true,
                            opacity: 0.22,
                            blending: THREE.AdditiveBlending,
                            depthWrite: false
                        })
                    );
                    rim.name = "rim";
                    rim.rotation.x = -Math.PI / 2;
                    group.add(rim);

                    mesh = group;
                    mesh.renderOrder = -9;   // above the arm dust, below entities
                }

                mesh.position.set(p.x, GATEWAY_Y, p.y);

                const throat = mesh.getObjectByName("throat");
                if (throat) throat.scale.set(r * 0.85, r * 0.85, 1);

                const rim = mesh.getObjectByName("rim");
                if (rim) {
                    rim.scale.set(r, r, r);
                    rim.rotation.z += 0.004;   // barely-there drift
                }

                // Fade the whole thing in only as you approach; from across the
                // galaxy it should read as nothing but the core.
                const me = renderer.myPlayer;
                if (me) {
                    const d = Math.hypot(p.x - me.x, p.y - me.y);
                    const near = 1 - Math.min(1, Math.max(0, (d - r) / GATEWAY_FADE));
                    if (throat) throat.material.opacity = 0.55 * near;
                    if (rim) rim.material.opacity = 0.22 * near;
                    mesh.visible = near > 0.01;
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
                const colHex = p.color ? parseInt(p.color.replace("#", "0x")) : 0xffaa22;

                // Only the motes near you get a mesh. With a field this dense,
                // building one for all of them costs more than the entire rest
                // of the scene; beyond this range a mote is a sub-pixel dot.
                const me = renderer.myPlayer;
                if (me) {
                    const d2 = (px - me.x) * (px - me.x) + (pz - me.y) * (pz - me.y);
                    if (d2 > STARDUST_CULL * STARDUST_CULL) {
                        if (mesh) mesh.visible = false;
                        return mesh || null;
                    }
                }
                if (mesh) mesh.visible = true;

                if (!mesh) {
                    const group = new THREE.Group();

                    // Saturated coloured body. The decorative galaxy motes are
                    // deliberately pale, so colour alone already separates what
                    // you can eat from the background.
                    const coreGeom = new THREE.SphereGeometry(1.0, 12, 12);
                    const core = new THREE.Mesh(coreGeom, new THREE.MeshBasicMaterial({ color: colHex }));
                    core.name = "core";
                    group.add(core);

                    // Hot white centre so it still reads at distance.
                    const hot = new THREE.Mesh(
                        new THREE.SphereGeometry(0.45, 10, 10),
                        new THREE.MeshBasicMaterial({ color: 0xffffff })
                    );
                    hot.name = "hot";
                    group.add(hot);

                    const halo = new THREE.Mesh(
                        new THREE.SphereGeometry(1.9, 12, 12),
                        new THREE.MeshBasicMaterial({
                            color: colHex,
                            transparent: true,
                            opacity: 0.7,
                            blending: THREE.AdditiveBlending,
                            depthWrite: false
                        })
                    );
                    halo.name = "halo";
                    group.add(halo);

                    mesh = group;
                }

                const time = performance.now() * 0.001;
                const sSeed = (p.seed !== undefined ? p.seed : (p.id ? String(p.id).charCodeAt(0) : 1));

                // A slow, steady breath - against the fast random twinkle of the
                // decorative motes, the eye picks these out by motion alone.
                const pulse = Math.sin(time * EDIBLE_PULSE_RATE + sSeed);
                const scale = r * EDIBLE_SCALE * (1.0 + EDIBLE_PULSE_DEPTH * pulse);

                const yBase = Math.sin(sSeed * 7.7) * 45;
                mesh.position.set(px, yBase + Math.sin(time * 2.2 + sSeed) * 8, pz);

                const core = mesh.getObjectByName("core");
                if (core) core.scale.set(scale, scale, scale);
                const hot = mesh.getObjectByName("hot");
                if (hot) hot.scale.set(scale, scale, scale);

                const halo = mesh.getObjectByName("halo");
                if (halo) {
                    const hs = scale * 1.35;
                    halo.scale.set(hs, hs, hs);
                    halo.material.opacity = 0.55 + 0.25 * pulse;
                }

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
