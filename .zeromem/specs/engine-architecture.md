# Specification: Decoupled 2D ECS Engine Architecture

## 1. Architectural Boundary

```mermaid
graph TD
    subgraph "Core Engine (/Server/)"
        GC[GameClass.js<br/>Tick Loop & ECS Entity Store]
        SS[SubSystems.js<br/>Quadtree & Newtonian Physics]
        AB[Abilities.js<br/>Generic ECS Components]
        FSM[GameState.js & PlayerState.js<br/>FSM Framework]
        GS[GameServer.js<br/>Socket.IO & Network Sync]
    end

    subgraph "Game Cartridge (Game.js)"
        Rules[Eating Hooks & Predator Margins]
        Cartridge[Player, Dot, Virus Entities]
        AI[Reynolds Context Steering AI]
        States[Lobby, RoundActive, Shielded States]
    end

    Cartridge -->|attaches| AB
    Cartridge -->|registers in| GC
    Rules -->|hooks into| SS
    States -->|extends| FSM
```

## 2. Decoupling Guarantees
* **Zero Hardcoded Entity Names in Core**: `/Server/SubSystems.js` and `/Server/GameClass.js` contain zero references to `"dot"`, `"virus"`, or game-specific eating ratios.
* **Generic ECS Flags**:
  - `Collidable.isTrigger`: Bypasses Newtonian physical bounce calculation (used for items, sensors, and pickups).
  - `Collidable.isStatic`: Prevents displacement during positional separation (infinite mass).
* **Static Layer Delte Synchronization**: Background items (e.g. food fields) are marked via `game.markLayerStatic('dots')`. Full snapshots are transmitted once on join; during game ticks, only changed entities (`dotsDelta`) are synced.
