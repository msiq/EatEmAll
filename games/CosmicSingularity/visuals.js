(function (global) {
    "use strict";

    // Round rect polyfill just in case
    if (typeof CanvasRenderingContext2D !== "undefined" && !CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.beginPath();
            this.moveTo(x + r, y);
            this.arcTo(x + w, y, x + w, y + h, r);
            this.arcTo(x + w, y + h, x, y + h, r);
            this.arcTo(x, y + h, x, y, r);
            this.arcTo(x, y, x + w, y, r);
            this.closePath();
            return this;
        };
    }

    const CosmicSingularityVisuals = {
        layerOrder: ["stardust", "planets", "asteroids", "pulsars", "blackholes"],
        title: "Cosmic Singularity - Multiplayer Universe",
        world: {
            width: 4000,
            height: 4000
        },
        theme: {
            backgroundColor: "#020014",
            borderColor: "rgba(139, 92, 246, 0.5)",
            grid: {
                enabled: false // Disable grid to enjoy the nebula
            }
        },
        hud: {
            showHealth: false,
            stats: [
                { id: "mass", label: "Mass", key: "mass", format: (v) => Math.round(v) + "M", highlight: true },
                { id: "radius", label: "Event Horizon", key: "radius", format: (v) => Math.round(v) + " km" }
            ]
        },
        
        drawBackground: function (ctx, cam, worldW, worldH, bgImg) {
            // 1. Deep Void Canvas Base
            ctx.fillStyle = "#03040a";
            ctx.fillRect(0, 0, worldW, worldH);

            // 2. Extremely subtle, faded painterly nebula texture (sparse, gentle background depth)
            if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
                ctx.save();
                ctx.globalAlpha = 0.10; // Faint, subtle ambient presence
                ctx.drawImage(bgImg, 0, 0, worldW, worldH);
                ctx.restore();
            }

            // 3. Sparse, localized cosmic clouds (most of space remains deep black void)
            const clouds = [
                { x: 900, y: 900, r: 850, color: "rgba(88, 28, 135, 0.09)" },   // Soft deep violet
                { x: 3100, y: 1100, r: 900, color: "rgba(30, 58, 138, 0.08)" },  // Faint midnight sapphire
                { x: 1900, y: 3100, r: 750, color: "rgba(13, 148, 136, 0.06)" }, // Whisper of teal
                { x: 3300, y: 3200, r: 850, color: "rgba(159, 18, 57, 0.07)" }   // Subtle cosmic rose
            ];

            clouds.forEach(c => {
                const grad = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r);
                grad.addColorStop(0, c.color);
                grad.addColorStop(1, "rgba(0, 0, 0, 0)");
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
                ctx.fill();
            });

            // 4. Sparse Starfield (Deterministic, clean pinprick points)
            if (!this._sparseStars) {
                this._sparseStars = [];
                // Simple deterministic PRNG
                let s = 42981;
                function rand() {
                    s = (s * 16807) % 2147483647;
                    return (s - 1) / 2147483646;
                }
                const starColors = ["#ffffff", "#e0f2fe", "#fef3c7", "#ede9fe"];
                // Only 160 stars across the entire 4000x4000 universe (very sparse!)
                for (let i = 0; i < 160; i++) {
                    this._sparseStars.push({
                        x: rand() * worldW,
                        y: rand() * worldH,
                        r: 0.6 + rand() * 1.4,
                        baseAlpha: 0.25 + rand() * 0.55,
                        color: starColors[Math.floor(rand() * starColors.length)],
                        isBeacon: rand() < 0.08, // Rare bright stars with lens flare
                        pulseSpeed: 0.5 + rand() * 2.0
                    });
                }
            }

            const time = performance.now() * 0.001;
            const camOriginX = cam && cam.origin ? cam.origin.x : 0;
            const camOriginY = cam && cam.origin ? cam.origin.y : 0;
            const vpW = cam && cam.viewportWidth ? cam.viewportWidth : 2000;
            const vpH = cam && cam.viewportHeight ? cam.viewportHeight : 2000;

            for (let i = 0; i < this._sparseStars.length; i++) {
                const st = this._sparseStars[i];
                // Viewport culling for stars
                if (st.x < camOriginX - 30 || st.x > camOriginX + vpW + 30 ||
                    st.y < camOriginY - 30 || st.y > camOriginY + vpH + 30) {
                    continue;
                }

                const alpha = Math.min(1.0, Math.max(0.1, st.baseAlpha + Math.sin(time * st.pulseSpeed + i) * 0.15));
                ctx.fillStyle = st.color;
                ctx.globalAlpha = alpha;

                ctx.beginPath();
                ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
                ctx.fill();

                // Faint diffraction spikes on rare beacons
                if (st.isBeacon) {
                    ctx.strokeStyle = st.color;
                    ctx.lineWidth = 0.75;
                    ctx.globalAlpha = alpha * 0.45;
                    ctx.beginPath();
                    ctx.moveTo(st.x - 7, st.y);
                    ctx.lineTo(st.x + 7, st.y);
                    ctx.moveTo(st.x, st.y - 7);
                    ctx.lineTo(st.x, st.y + 7);
                    ctx.stroke();
                }
            }
            ctx.globalAlpha = 1.0;

            // 5. Minimalist Neon World Boundary
            ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
            ctx.lineWidth = 3;
            ctx.strokeRect(0, 0, worldW, worldH);
        },
        drawHooks: {
            blackholes: function (ctx, p, cam) {
                ctx.save();
                ctx.translate(p.x, p.y);
                
                const time = performance.now() * 0.001;
                const rIn = p.radius;
                const rLens = p.radius * 1.75; // Full Option 3 Gravitational Lens boundary

                // 1. Radiant Gravitational Lensing Halo (Option 3: Smooth, luminous curvature falloff)
                const haloGrad = ctx.createRadialGradient(0, 0, rIn * 0.96, 0, 0, rLens);
                haloGrad.addColorStop(0, "#ffffff");                 // White-hot photon lip
                haloGrad.addColorStop(0.10, p.color);               // Pure signature hue
                haloGrad.addColorStop(0.32, p.color + "bb");         // Vibrant warm lensing body (~73% opacity)
                haloGrad.addColorStop(0.65, p.color + "44");         // Diffuse outer curvature glow (~27% opacity)
                haloGrad.addColorStop(1, "rgba(0, 0, 0, 0)");        // Seamless transition into deep space

                ctx.save();
                ctx.beginPath();
                ctx.arc(0, 0, rLens, 0, Math.PI * 2);
                ctx.fillStyle = haloGrad;
                ctx.globalAlpha = 0.88; // Vibrant, luminous as in original Option 3
                ctx.fill();
                ctx.restore();

                // 2. Relativistic Doppler Lensing Asymmetry (Subtle Einstein arc brightening)
                ctx.save();
                const lensSpeed = 0.45;
                ctx.rotate(time * lensSpeed);
                const dopplerGrad = ctx.createLinearGradient(-rLens, 0, rLens, 0);
                dopplerGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
                dopplerGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.0)");
                dopplerGrad.addColorStop(1, "rgba(0, 0, 0, 0.35)");

                ctx.beginPath();
                ctx.arc(0, 0, rLens * 0.98, 0, Math.PI * 2);
                ctx.fillStyle = dopplerGrad;
                ctx.globalCompositeOperation = "screen";
                ctx.globalAlpha = 0.55;
                ctx.fill();
                ctx.restore();

                // 3. Crisp, Brilliant Photon Sphere Ring (Einstein Ring)
                ctx.save();
                ctx.beginPath();
                ctx.arc(0, 0, p.radius * 1.04, 0, Math.PI * 2);
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = Math.max(1.5, p.radius * 0.055);
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 10;
                ctx.globalAlpha = 0.95;
                ctx.stroke();
                ctx.restore();

                // 4. Absolute Pitch-Black Event Horizon
                ctx.beginPath();
                ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = "#000000";
                ctx.shadowBlur = 0;
                ctx.fill();

                // Quantum Spawn Shield Effect
                if (p.spawnImmunity > 0) {
                    ctx.save();
                    const shieldPulse = 1.0 + Math.sin(time * 10) * 0.08;
                    const shieldRadius = p.radius * 2.3 * shieldPulse;
                    
                    ctx.beginPath();
                    ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
                    ctx.strokeStyle = "#38bdf8";
                    ctx.lineWidth = 2.5;
                    ctx.setLineDash([8, 5]);
                    ctx.shadowColor = "#38bdf8";
                    ctx.shadowBlur = 12;
                    ctx.stroke();

                    // Subtle shield glow fill
                    ctx.fillStyle = "rgba(56, 189, 248, 0.14)";
                    ctx.fill();
                    ctx.restore();
                }

                // Thrust Jet Exhaust (Clean directed ion beam)
                if (p.isThrusting) {
                    ctx.beginPath();
                    const ang = (p.angle !== undefined ? p.angle : (p.targetAngle || 0));
                    const thrustX = -Math.cos(ang) * p.radius * 1.3;
                    const thrustY = -Math.sin(ang) * p.radius * 1.3;
                    ctx.arc(thrustX, thrustY, p.radius * 0.32, 0, Math.PI * 2);
                    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 12;
                    ctx.fill();
                }

                // Relativistic Hyper-Slingshot Aura (Triggered by Pulsar Beam)
                if (p.boostTimer > 0) {
                    ctx.save();
                    const boostPulse = 1.0 + Math.sin(time * 20) * 0.12;
                    const boostR = p.radius * 2.1 * boostPulse;
                    
                    // Electric aura ring
                    ctx.beginPath();
                    ctx.arc(0, 0, boostR, 0, Math.PI * 2);
                    ctx.strokeStyle = "#38bdf8";
                    ctx.lineWidth = 3.0;
                    ctx.shadowColor = "#38bdf8";
                    ctx.shadowBlur = 18;
                    ctx.globalAlpha = Math.min(1.0, p.boostTimer * 1.2);
                    ctx.stroke();

                    // Trailing relativistic hyper-jets
                    const mvAng = Math.atan2(p.vy || 0, p.vx || 0);
                    for (let j = 0; j < 3; j++) {
                        const jetDist = p.radius * (1.6 + j * 0.8);
                        const jx = -Math.cos(mvAng) * jetDist;
                        const jy = -Math.sin(mvAng) * jetDist;
                        ctx.beginPath();
                        ctx.arc(jx, jy, p.radius * (0.45 - j * 0.1), 0, Math.PI * 2);
                        ctx.fillStyle = "#38bdf8";
                        ctx.globalAlpha = (0.6 - j * 0.18) * Math.min(1.0, p.boostTimer);
                        ctx.fill();
                    }
                    ctx.restore();
                }

                ctx.restore();

                // Draw Glassmorphic Name Tag below entity
                ctx.save();
                ctx.translate(p.x, p.y + p.radius * 1.6 + 24);
                
                // Tag Background
                ctx.fillStyle = "rgba(20, 20, 30, 0.75)";
                ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
                ctx.lineWidth = 1;
                
                const w = 120, h = 45, r = 8;
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(-w/2, -h/2, w, h, r);
                } else {
                    ctx.rect(-w/2, -h/2, w, h);
                }
                ctx.fill();
                ctx.stroke();

                // Name
                ctx.fillStyle = "#ffffff";
                ctx.font = "bold 13px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(p.name || "Player", 0, -8);

                // Mass indicator
                ctx.fillStyle = "#aaaaaa";
                ctx.font = "11px sans-serif";
                ctx.fillText("Mass", -25, 10);

                ctx.fillStyle = p.color;
                ctx.fillRect(-3, 6, 20, 7);
                
                ctx.fillStyle = "#ffffff";
                ctx.textAlign = "left";
                ctx.fillText(Math.floor(p.mass || 0) + "M", 22, 10);
                
                ctx.restore();
            },
            planets: function (ctx, p, cam) {
                ctx.save();
                ctx.translate(p.x, p.y);
                
                const time = performance.now() * 0.001;
                const seed = p.id ? p.id.charCodeAt(p.id.length-1) : 0;
                ctx.rotate(seed + time * 0.2); // Slow orbit rotation
                
                // Atmospheric glow
                const grad = ctx.createRadialGradient(0, 0, p.radius * 0.6, 0, 0, p.radius * 1.5);
                grad.addColorStop(0, p.color);
                grad.addColorStop(1, "rgba(0,0,0,0)");
                
                ctx.beginPath();
                ctx.arc(0, 0, p.radius * 1.5, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();

                // Solid core
                ctx.beginPath();
                ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();
                
                // 3D Shadow shading
                const shadow = ctx.createLinearGradient(-p.radius, -p.radius, p.radius, p.radius);
                shadow.addColorStop(0, "rgba(255,255,255,0.4)");
                shadow.addColorStop(0.5, "rgba(0,0,0,0)");
                shadow.addColorStop(1, "rgba(0,0,0,0.8)");
                ctx.beginPath();
                ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = shadow;
                ctx.fill();
                
                ctx.restore();
            },
            stardust: function (ctx, p, cam) {
                ctx.save();
                ctx.translate(p.x, p.y);

                const time = performance.now() * 0.001;
                const seed = p.seed || 0;
                const twinkle = 0.65 + Math.sin(time * 5 + seed) * 0.35;

                // Faint chromatic glow halo
                const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, p.radius * 2.8);
                glow.addColorStop(0, p.color);
                glow.addColorStop(0.5, p.color + "55");
                glow.addColorStop(1, "rgba(0,0,0,0)");

                ctx.beginPath();
                ctx.arc(0, 0, p.radius * 2.8, 0, Math.PI * 2);
                ctx.fillStyle = glow;
                ctx.globalAlpha = twinkle * 0.65;
                ctx.fill();

                // Luminous particle core
                ctx.beginPath();
                ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = "#ffffff";
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 6;
                ctx.globalAlpha = twinkle;
                ctx.fill();

                // Subtle micro diffraction cross for sparkling motes
                if (p.radius > 3.2) {
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 0.8;
                    ctx.globalAlpha = twinkle * 0.55;
                    ctx.beginPath();
                    ctx.moveTo(-p.radius * 2.2, 0);
                    ctx.lineTo(p.radius * 2.2, 0);
                    ctx.moveTo(0, -p.radius * 2.2);
                    ctx.lineTo(0, p.radius * 2.2);
                    ctx.stroke();
                }

                ctx.restore();
            },
            asteroids: function (ctx, p, cam) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle || 0);

                const verts = p.vertRatios || [1, 0.9, 1.1, 0.85, 1.05, 0.95, 1.15, 0.9];
                const numVerts = verts.length;
                const baseR = p.radius;

                // Irregular Craggy Polygon Silhouette
                ctx.beginPath();
                for (let i = 0; i < numVerts; i++) {
                    const ang = (Math.PI * 2 / numVerts) * i;
                    const r = baseR * verts[i];
                    const vx = Math.cos(ang) * r;
                    const vy = Math.sin(ang) * r;
                    if (i === 0) ctx.moveTo(vx, vy);
                    else ctx.lineTo(vx, vy);
                }
                ctx.closePath();

                // 3D Spherical Rocky Shading
                const rockGrad = ctx.createRadialGradient(-baseR * 0.35, -baseR * 0.35, baseR * 0.1, 0, 0, baseR * 1.25);
                rockGrad.addColorStop(0, "#a8a29e");    // Highlight lit crest
                rockGrad.addColorStop(0.35, "#78716c"); // Midtone basalt rock
                rockGrad.addColorStop(0.75, "#44403c"); // Shadow tone
                rockGrad.addColorStop(1, "#1c1917");    // Deep occlusion shadow
                
                ctx.fillStyle = rockGrad;
                ctx.fill();

                // Subtle mineral edge stroke
                ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
                ctx.lineWidth = 1.2;
                ctx.stroke();

                // Craters with directional lighting
                const craters = p.craters || [];
                for (let i = 0; i < craters.length; i++) {
                    const c = craters[i];
                    ctx.save();
                    ctx.translate(c.x, c.y);

                    // Crater depression shadow
                    ctx.beginPath();
                    ctx.arc(0, 0, c.r, 0, Math.PI * 2);
                    ctx.fillStyle = "rgba(20, 18, 16, 0.75)";
                    ctx.fill();

                    // Crater illuminated crescent rim
                    ctx.beginPath();
                    ctx.arc(-c.r * 0.2, -c.r * 0.2, c.r * 0.85, Math.PI * 0.7, Math.PI * 1.8);
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
                    ctx.lineWidth = 0.9;
                    ctx.stroke();

                    ctx.restore();
                }

                ctx.restore();
            },
            pulsars: function (ctx, p, cam) {
                ctx.save();
                ctx.translate(p.x, p.y);

                const time = performance.now() * 0.001;
                const bAngle = p.beamAngle || 0;
                const bLen = p.beamLength || 500;
                const bWidth = p.beamWidth || 32;

                // 1. Dual Sweeping Relativistic Jet Beams (Opposing conical gamma-ray emissions)
                const beamAngles = [bAngle, bAngle + Math.PI];

                for (const ang of beamAngles) {
                    ctx.save();
                    ctx.rotate(ang);

                    // Conical beam path
                    ctx.beginPath();
                    ctx.moveTo(p.radius * 0.6, -bWidth * 0.25);
                    ctx.lineTo(bLen, -bWidth * 0.9);
                    ctx.lineTo(bLen, bWidth * 0.9);
                    ctx.lineTo(p.radius * 0.6, bWidth * 0.25);
                    ctx.closePath();

                    const beamGrad = ctx.createLinearGradient(0, 0, bLen, 0);
                    beamGrad.addColorStop(0, "#ffffff");
                    beamGrad.addColorStop(0.12, p.color);
                    beamGrad.addColorStop(0.55, p.color + "77");
                    beamGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

                    ctx.fillStyle = beamGrad;
                    ctx.globalCompositeOperation = "screen";
                    ctx.globalAlpha = 0.82 + Math.sin(time * 15) * 0.12;
                    ctx.fill();

                    // Core intense central laser line
                    ctx.beginPath();
                    ctx.moveTo(p.radius * 0.8, 0);
                    ctx.lineTo(bLen * 0.95, 0);
                    ctx.strokeStyle = "#ffffff";
                    ctx.lineWidth = 2.5;
                    ctx.shadowColor = p.color;
                    ctx.shadowBlur = 12;
                    ctx.globalAlpha = 0.90;
                    ctx.stroke();

                    ctx.restore();
                }

                // 2. Expanding Electromagnetic Radiation Pulse Waves
                const pulseT = (p.pulseTimer || 0) / (p.pulseInterval || 3.2);
                const pulseR = p.radius + pulseT * 260;
                const pulseAlpha = Math.max(0, (1 - pulseT) * 0.45);

                ctx.save();
                ctx.beginPath();
                ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = pulseAlpha;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 10;
                ctx.stroke();
                ctx.restore();

                // 3. Dipolar Magnetic Field Rings
                ctx.save();
                ctx.rotate(bAngle + Math.PI / 2); // Perpendicular to jet axis
                for (let m = 1; m <= 2; m++) {
                    ctx.beginPath();
                    ctx.ellipse(0, 0, p.radius * (1.5 + m * 0.6), p.radius * (0.8 + m * 0.3), 0, 0, Math.PI * 2);
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 1.0;
                    ctx.globalAlpha = 0.28 / m;
                    ctx.stroke();
                }
                ctx.restore();

                // 4. Ultra-Dense Neutron Star Core
                ctx.save();
                // Outer coronal aura
                const coreGlow = ctx.createRadialGradient(0, 0, p.radius * 0.4, 0, 0, p.radius * 1.8);
                coreGlow.addColorStop(0, "#ffffff");
                coreGlow.addColorStop(0.35, p.color);
                coreGlow.addColorStop(0.8, p.color + "44");
                coreGlow.addColorStop(1, "rgba(0, 0, 0, 0)");

                ctx.beginPath();
                ctx.arc(0, 0, p.radius * 1.8, 0, Math.PI * 2);
                ctx.fillStyle = coreGlow;
                ctx.fill();

                // Blinding solid core
                ctx.beginPath();
                ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = "#ffffff";
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 18;
                ctx.fill();
                ctx.restore();

                // Pulsar Name Badge
                ctx.save();
                ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
                ctx.font = "bold 10px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(p.name || "PULSAR", 0, p.radius + 18);
                ctx.restore();

                ctx.restore();
            }
        }
    };

    global.CartridgeVisuals = CosmicSingularityVisuals;
})(typeof window !== "undefined" ? window : global);
