# Master Specification: Eat 'Em All & 2D ECS Game Engine

## 1. Executive Summary & Vision
**Eat 'Em All** is a high-performance, server-authoritative 2D multiplayer arena game powered by a decoupled micro-engine built with Node.js, WebSockets (Socket.IO), and HTML5 Canvas.

The project is architected with a strict separation between:
1. **Core 2D Engine (`/Server/`)**: A pure, game-agnostic Entity-Component-System (ECS) engine with Quadtree spatial partitioning, Newtonian impulse physics, Finite State Machines, and delta-sync networking.
2. **Game Cartridge (`Game.js`)**: The specific "Eat 'Em All" rules, entity constructors (Player, Dot, Virus), scoring, bot AI, and round lifecycle.

---

## 2. Technical Performance Budgets
* **Server Tick Rate**: 30–33 TPS steady under load.
* **Server Tick Computation Time**: < 4.0ms per tick (breaking point threshold: 25.0ms).
* **Heap Memory Footprint**: < 60MB standard load, strict tripwire ceiling at 1,400MB.
* **Network Protocol**: WebSocket delta updates (only moving entities + eaten/respawned dot deltas).
* **Client Render Performance**: 60 FPS smooth interpolation using `requestAnimationFrame`.

---

## 3. Core Gameplay Rules
* **Feeding**: Collect ambient nutrient pellets (radius 3.5px) to increase physical mass via area conservation ($A = \pi r^2$).
* **Predation**: Players with radius $> 1.15 	imes$ prey radius can swallow smaller players whole, absorbing their mass and score.
* **Elastic Bouncing**: Players within similar mass ranges ($0.87 	imes \le r \le 1.15 	imes$) bounce realistically with momentum conservation ($m_1 v_1 + m_2 v_2 = m_1 v_1' + m_2 v_2'$) and tangential friction.
* **Hazards (Viruses)**: Spiky green hazard obstacles that shatter large blobs into smaller cell fragments upon impact.
* **Spawn Protection**: Newly spawned players receive a glowing cyan protective forcefield for 3.5 seconds to eliminate spawn-camping.
* **Match Rounds**: 3-minute timed rounds with live leaderboard scoring, victory banners, and arena resets.

---

## 4. Key Roadmap Capabilities
* **Spacebar Splitting**: Eject half cell mass forward as a high-speed projectile for surprise long-range ambushes.
* **'W' Mass Ejection**: Eject small nutrient pellets forward to bait opponents or feed viruses.
* **Binary Serialization**: Migrate WebSocket payloads to TypedArrays / FlatBuffers for ultra-low bandwidth usage.
