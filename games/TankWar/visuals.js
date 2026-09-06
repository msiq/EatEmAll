/**
 * visuals.js - TankWar Cartridge Visual Manifest
 * Top-down vehicular armored combat rendering hooks, military theme & HUD bindings.
 */
(function (global) {
    "use strict";

    global.CartridgeVisuals = {
        title: "TankWar - Armored 2D Combat Arena",
        world: {
            width: 1600,
            height: 1200
        },
        theme: {
            backgroundColor: "#0d1117",
            borderColor: "rgba(234, 179, 8, 0.55)",
            grid: {
                enabled: true,
                size: 60,
                color: "rgba(234, 179, 8, 0.045)"
            }
        },
        hud: {
            showHealth: true,
            stats: [
                { id: "score", label: "Score", key: "score", highlight: true },
                { id: "kills", label: "Kills", key: "kills" },
                { id: "ammo", label: "Shells", key: "ammo", format: (a) => (a !== undefined ? a : 10) + "/10" },
                { id: "health", label: "Armor", key: "health", format: (h) => Math.max(0, Math.round(h !== undefined ? h : 100)) + "%" }
            ]
        },
        renderers: {
            // Destructible Concrete Barricades
            obstacles: function (ctx, obs, cam) {
                const x = obs.x;
                const y = obs.y;
                const rad = obs.radius || 28;
                const hp = obs.health !== undefined ? obs.health : 50;
                const maxHp = 50;
                const hpRatio = Math.max(0, hp / maxHp);

                ctx.save();
                ctx.translate(x, y);

                // Concrete block shadow
                ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
                ctx.shadowBlur = 8;
                ctx.shadowOffsetY = 4;

                // Base concrete shape (rounded octagonal bunker block)
                const w = rad * 1.65;
                const h = rad * 1.65;
                const r = 6;
                ctx.beginPath();
                ctx.roundRect(-w / 2, -h / 2, w, h, r);
                ctx.fillStyle = "#334155";
                ctx.fill();
                ctx.shadowColor = "transparent";

                // Inner panel with metallic highlight
                ctx.beginPath();
                ctx.roundRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, r - 1);
                ctx.fillStyle = "#475569";
                ctx.fill();

                // 4 Corner reinforcement rivets
                const rivetOffset = w / 2 - 7;
                ctx.fillStyle = "#94a3b8";
                [
                    [-rivetOffset, -rivetOffset],
                    [rivetOffset, -rivetOffset],
                    [-rivetOffset, rivetOffset],
                    [rivetOffset, rivetOffset]
                ].forEach(([rx, ry]) => {
                    ctx.beginPath();
                    ctx.arc(rx, ry, 2.2, 0, Math.PI * 2);
                    ctx.fill();
                });

                // Center hazard cross symbol
                ctx.strokeStyle = "rgba(234, 179, 8, 0.45)";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(-10, -10); ctx.lineTo(10, 10);
                ctx.moveTo(10, -10); ctx.lineTo(-10, 10);
                ctx.stroke();

                // Damage Cracks as health depletes
                if (hpRatio < 0.75) {
                    ctx.strokeStyle = "rgba(15, 23, 42, 0.85)";
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(-6, -14); ctx.lineTo(0, -4); ctx.lineTo(12, -2);
                    if (hpRatio < 0.4) {
                        ctx.moveTo(2, 0); ctx.lineTo(-10, 8); ctx.lineTo(-4, 15);
                    }
                    ctx.stroke();
                }

                ctx.restore();
            },

            // High-Speed Tracer Projectile Shells
            bullets: function (ctx, b, cam) {
                const x = b.x;
                const y = b.y;
                const rad = b.radius || 4.5;
                const angle = (b.vel && (b.vel.x !== 0 || b.vel.y !== 0))
                    ? Math.atan2(b.vel.y, b.vel.x)
                    : (b.angle || 0);

                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);

                // Fiery Tracer Trail
                const trailGrad = ctx.createLinearGradient(-18, 0, 0, 0);
                trailGrad.addColorStop(0, "rgba(249, 115, 22, 0)");
                trailGrad.addColorStop(1, "rgba(249, 115, 22, 0.85)");
                ctx.fillStyle = trailGrad;
                ctx.beginPath();
                ctx.ellipse(-9, 0, 12, 3, 0, 0, Math.PI * 2);
                ctx.fill();

                // Bullet Core Glow
                ctx.shadowColor = "#ea580c";
                ctx.shadowBlur = 10;
                ctx.fillStyle = "#ffedd5";
                ctx.beginPath();
                ctx.arc(0, 0, rad, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            },

            // Armored Tanks (Chassis + Dual Treads + Rotating Turret Cannon)
            players: function (ctx, tank, cam) {
                const x = tank.x;
                const y = tank.y;
                const rad = tank.radius || 24;
                const isMe = (window.__engineApp && window.__engineApp.myPlayerId === tank.id);
                const isBot = !!tank.isBot;
                const chassisAngle = tank.chassisAngle || 0;
                const turretAngle = tank.turretAngle !== undefined ? tank.turretAngle : (tank.angle || 0);

                const baseColor = isMe ? "#16a34a" : (isBot ? "#d97706" : "#0284c7");
                const darkColor = isMe ? "#14532d" : (isBot ? "#78350f" : "#075985");
                const highlightColor = isMe ? "#4ade80" : (isBot ? "#fcd34d" : "#38bdf8");

                ctx.save();
                ctx.translate(x, y);

                // --- 1. CHASSIS & TREADS (aligned with chassisAngle) ---
                ctx.save();
                ctx.rotate(chassisAngle);

                // Tread Shadow
                ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
                ctx.shadowBlur = 12;
                ctx.shadowOffsetY = 3;

                // Left & Right Track Belts (Black rubber/steel)
                const treadW = rad * 1.7;
                const treadH = 9;
                const treadYOffset = rad * 0.72;

                ctx.fillStyle = "#1e293b";
                ctx.strokeStyle = "#0f172a";
                ctx.lineWidth = 1.5;

                // Top/Left Track
                ctx.beginPath();
                ctx.roundRect(-treadW / 2, -treadYOffset - treadH / 2, treadW, treadH, 3);
                ctx.fill();
                ctx.stroke();

                // Bottom/Right Track
                ctx.beginPath();
                ctx.roundRect(-treadW / 2, treadYOffset - treadH / 2, treadW, treadH, 3);
                ctx.fill();
                ctx.stroke();

                ctx.shadowColor = "transparent";

                // Track Ribs / Grooves
                ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
                ctx.lineWidth = 1;
                for (let tx = -treadW / 2 + 4; tx <= treadW / 2 - 4; tx += 6) {
                    ctx.beginPath();
                    ctx.moveTo(tx, -treadYOffset - treadH / 2 + 1);
                    ctx.lineTo(tx, -treadYOffset + treadH / 2 - 1);
                    ctx.moveTo(tx, treadYOffset - treadH / 2 + 1);
                    ctx.lineTo(tx, treadYOffset + treadH / 2 - 1);
                    ctx.stroke();
                }

                // Main Armored Hull
                const hullW = rad * 1.55;
                const hullH = rad * 1.25;

                ctx.fillStyle = baseColor;
                ctx.beginPath();
                ctx.roundRect(-hullW / 2, -hullH / 2, hullW, hullH, 5);
                ctx.fill();

                // Hull outline & bevel
                ctx.strokeStyle = isMe ? "#ffffff" : darkColor;
                ctx.lineWidth = isMe ? 2.5 : 2;
                ctx.stroke();

                // Engine Ventilation Grille (Rear)
                ctx.fillStyle = "#0f172a";
                ctx.beginPath();
                ctx.roundRect(-hullW / 2 + 3, -hullH / 3, 6, hullH * 0.66, 2);
                ctx.fill();

                // Front armor plating chamfer line
                ctx.strokeStyle = highlightColor;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(hullW / 2 - 4, -hullH / 2 + 3);
                ctx.lineTo(hullW / 2 - 1, 0);
                ctx.lineTo(hullW / 2 - 4, hullH / 2 - 3);
                ctx.stroke();

                ctx.restore(); // end chassis

                // --- 2. ROTATING TURRET & CANNON (aligned with turretAngle) ---
                ctx.save();
                ctx.rotate(turretAngle);

                // Gun Barrel
                const barrelLen = rad * 1.45;
                const barrelW = 5.5;

                ctx.fillStyle = "#334155";
                ctx.strokeStyle = "#0f172a";
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.rect(4, -barrelW / 2, barrelLen, barrelW);
                ctx.fill();
                ctx.stroke();

                // Muzzle Brake at the tip
                ctx.fillStyle = "#1e293b";
                ctx.beginPath();
                ctx.roundRect(4 + barrelLen - 2, -barrelW * 0.85, 7, barrelW * 1.7, 2);
                ctx.fill();
                ctx.stroke();

                // Turret Cupola / Dome
                ctx.fillStyle = darkColor;
                ctx.beginPath();
                ctx.arc(0, 0, rad * 0.55, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = highlightColor;
                ctx.lineWidth = 2;
                ctx.stroke();

                // Commander Hatch
                ctx.fillStyle = "#475569";
                ctx.beginPath();
                ctx.arc(-2, 0, rad * 0.22, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore(); // end turret

                // --- 3. OVERHEAD NAMEPLATE & HEALTH BAR ---
                const hp = Math.max(0, Math.min(100, tank.health !== undefined ? tank.health : 100));
                const barW = 42;
                const barH = 5;
                const barY = -rad - 16;

                // Health Bar Background
                ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
                ctx.fillRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2);

                // Health Bar Fill
                const hpColor = hp > 50 ? "#22c55e" : (hp > 25 ? "#f59e0b" : "#ef4444");
                ctx.fillStyle = hpColor;
                ctx.fillRect(-barW / 2, barY, (barW * hp) / 100, barH);

                // Callsign Label
                ctx.font = "bold 11px Outfit, sans-serif";
                ctx.textAlign = "center";
                ctx.fillStyle = isMe ? "#38bdf8" : "#f1f5f9";
                ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
                ctx.shadowBlur = 4;
                ctx.fillText((isMe ? "★ " : "") + (tank.name || "Tank"), 0, barY - 5);
                ctx.shadowBlur = 0;

                ctx.restore();
            }
        }
    };
})(typeof window !== "undefined" ? window : global);
