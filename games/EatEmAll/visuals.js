/**
 * visuals.js - EatEmAll Cartridge Visual Manifest
 * Implements entity render hooks, color scheme, HUD bindings, and arena backdrop.
 */
(function (global) {
    "use strict";

    global.CartridgeVisuals = {
        title: "Eat 'Em All - Multiplayer 2D Arena",
        world: {
            width: 2000,
            height: 2000
        },
        theme: {
            backgroundColor: "#090d16",
            borderColor: "rgba(56, 189, 248, 0.45)",
            grid: {
                enabled: true,
                size: 50,
                color: "rgba(255, 255, 255, 0.035)"
            }
        },
        hud: {
            showHealth: false,
            stats: [
                { id: "score", label: "Score", key: "score", highlight: true },
                { id: "radius", label: "Mass", key: "radius", format: (r) => Math.round(Math.PI * (r || 20) * (r || 20) / 10) }
            ]
        },
        renderers: {
            // Food Dots Layer
            dots: function (ctx, dot, cam) {
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.radius || 3.5, 0, Math.PI * 2);
                ctx.fillStyle = dot.color || "#38bdf8";
                ctx.fill();
            },

            // Spiky Hazard Viruses
            viruses: function (ctx, v, cam) {
                const spikes = 16;
                const radius = v.radius || 36;
                const innerR = radius * 0.90;
                const outerR = radius * 1.08;
                const rot = v.rot || 0;

                ctx.save();
                ctx.translate(v.x, v.y);
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

                ctx.lineWidth = 3.5;
                ctx.strokeStyle = "#14532d";
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(0, 0, innerR * 0.45, 0, Math.PI * 2);
                ctx.lineWidth = 2;
                ctx.strokeStyle = "rgba(20, 83, 45, 0.4)";
                ctx.stroke();

                ctx.restore();
            },

            // Player Cells (with cute eyes, directional pointer, shields)
            players: function (ctx, p, cam) {
                const rad = p.radius || 20;
                const isMe = (window.__engineApp && window.__engineApp.myPlayerId === p.id);

                // Body Circle
                ctx.beginPath();
                ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
                ctx.fillStyle = p.color || (isMe ? "#38ef7d" : "#4facfe");
                ctx.fill();

                // Shielded State Aura
                if (p.state === "shielded") {
                    ctx.save();
                    const pulse = Math.sin(Date.now() * 0.009) * 2.5;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, rad + 6 + pulse, 0, Math.PI * 2);
                    ctx.strokeStyle = "rgba(0, 242, 254, 0.9)";
                    ctx.lineWidth = 3;
                    ctx.shadowColor = "#00f2fe";
                    ctx.shadowBlur = 10;
                    ctx.setLineDash([7, 4]);
                    ctx.stroke();

                    ctx.font = "bold 10px Outfit, sans-serif";
                    ctx.fillStyle = "#00f2fe";
                    ctx.textAlign = "center";
                    ctx.fillText("🛡️ SHIELDED", p.x, p.y - rad - 8);
                    ctx.restore();
                }

                // Perimeter Outline
                ctx.lineWidth = isMe ? 4 : 2.5;
                ctx.strokeStyle = isMe ? "#ffffff" : "rgba(255, 255, 255, 0.75)";
                ctx.stroke();

                // Direction Indicator & Cute Animated Eyes
                if (p.dir && (p.dir.x !== 0 || p.dir.y !== 0)) {
                    const mag = Math.sqrt(p.dir.x * p.dir.x + p.dir.y * p.dir.y) || 1;
                    const normX = p.dir.x / mag;
                    const normY = p.dir.y / mag;

                    const eyeDist = rad * 0.42;
                    const eyeOffset = rad * 0.28;
                    const eyeRadius = Math.max(3, rad * 0.17);
                    const pupilRadius = Math.max(1.5, eyeRadius * 0.52);

                    const eyeAngle = Math.atan2(normY, normX);
                    const perpAngle = eyeAngle + Math.PI / 2;

                    const leftEyeX = p.x + Math.cos(eyeAngle) * (eyeDist * 0.6) + Math.cos(perpAngle) * eyeOffset;
                    const leftEyeY = p.y + Math.sin(eyeAngle) * (eyeDist * 0.6) + Math.sin(perpAngle) * eyeOffset;

                    const rightEyeX = p.x + Math.cos(eyeAngle) * (eyeDist * 0.6) - Math.cos(perpAngle) * eyeOffset;
                    const rightEyeY = p.y + Math.sin(eyeAngle) * (eyeDist * 0.6) - Math.sin(perpAngle) * eyeOffset;

                    // Eye whites
                    ctx.fillStyle = "#ffffff";
                    ctx.beginPath();
                    ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, Math.PI * 2);
                    ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, Math.PI * 2);
                    ctx.fill();

                    // Looking pupils
                    const pupilShift = eyeRadius * 0.38;
                    ctx.fillStyle = "#0f172a";
                    ctx.beginPath();
                    ctx.arc(leftEyeX + normX * pupilShift, leftEyeY + normY * pupilShift, pupilRadius, 0, Math.PI * 2);
                    ctx.arc(rightEyeX + normX * pupilShift, rightEyeY + normY * pupilShift, pupilRadius, 0, Math.PI * 2);
                    ctx.fill();

                    // Pointer line
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p.x + normX * (rad + 10), p.y + normY * (rad + 10));
                    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }

                // Name Label
                const fontSize = Math.max(11, Math.min(18, rad * 0.42));
                ctx.font = "600 " + fontSize + "px Outfit, sans-serif";
                ctx.textAlign = "center";
                ctx.fillStyle = "#ffffff";
                ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
                ctx.shadowBlur = 4;
                ctx.fillText(p.name || "Player", p.x, p.y + (fontSize * 0.35));
                ctx.shadowBlur = 0;
            }
        }
    };
})(typeof window !== "undefined" ? window : global);
