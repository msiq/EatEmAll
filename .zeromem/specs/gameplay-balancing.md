# Specification: Gameplay Balancing & Mass Growth Dynamics

## 1. Area-Based Mass Growth Formula
Rather than flat linear radius addition (`radius += 0.3`), cell growth is governed by physical mass (area) conservation:

$$A_{\text{new}} = A_{\text{current}} + A_{\text{pellet}}$$
$$r_{\text{new}} = \sqrt{r_{\text{current}}^2 + 2.5}$$

### Progression Dynamics:
* **Early Game ($r=20$)**: 1 pellet adds $+0.062\text{px}$. Reaching $r=21$ requires ~16 pellets. Early progression is smooth, visible, and satisfying.
* **Mid Game ($r=40$)**: 1 pellet adds $+0.031\text{px}$. Reaching $r=41$ requires ~32 pellets.
* **Late Game ($r=80$)**: 1 pellet adds $+0.015\text{px}$. Giant blobs receive negligible growth from ambient pellets and are forced to hunt other players or split.

## 2. Visual Pellet Geometry
* **Radius**: Reduced from `7px` to `3.5px` (7px diameter).
* **Score**: $+2$ points per pellet.
