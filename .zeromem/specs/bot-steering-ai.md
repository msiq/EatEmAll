# Specification: Reynolds-Style Context Steering Autonomous Bot AI

## 1. Problem Statement
Autonomous AI bots previously recalculated nearest-target queries every tick (30Hz) without angular inertia. When positioned between two equidistant dots, the velocity vector flipped $180^\circ$ back and forth every tick, producing high-frequency vibration in place.

## 2. Multi-Context Steering Model
1. **Velocity Inertia Lerp**: Heading angles do not snap instantaneously. Desired steering vectors are blended with current momentum:
   $$\vec{v}_{\text{next}} = \text{lerp}(\vec{v}_{\text{current}}, \vec{v}_{\text{desired}}, 0.20)$$
2. **Target Commitment Lock (`targetLockUntil`)**: Bots commit to eating a target dot or pursuing prey for 1.2 to 2.2 seconds before re-evaluating targets.
3. **Predator Evasion (Panic Steering)**: When a larger player ($r_{\text{predator}} > 1.15 \times r_{\text{bot}}$) approaches within $260\text{px}$, panic steering vector points directly away from predator with weight $w = 3.5$.
4. **Boundary Repulsion**: Arena walls exert an inward repulsion force within $120\text{px}$ of the perimeter to prevent wall-pinning.
