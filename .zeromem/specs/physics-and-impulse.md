# Specification: 2D Newtonian Collision & Impulse Physics

## 1. Mathematical Formulation

### 1.1 Positional Separation (Anti-Sinking)
When two dynamic circles overlap ($	ext{dist} < r_A + r_B$), positional correction displaces each entity inversely proportional to its physical mass ($m \propto r^2$):

$$\text{sep}_A = \text{overlap} \times \frac{1/m_A}{1/m_A + 1/m_B}, \quad \text{sep}_B = \text{overlap} \times \frac{1/m_B}{1/m_A + 1/m_B}$$

### 1.2 Normal Impulse with Restitution ($e$)
The normal relative velocity along the collision normal $\hat{n} = (\vec{p}_B - \vec{p}_A) / \text{dist}$ is:
$$v_{\text{rel}} = (\vec{v}_A - \vec{v}_B) \cdot \hat{n}$$

If $v_{\text{rel}} \le 0$ (approaching), normal impulse $J_n$ is computed conserving linear momentum:
$$J_n = \frac{-(1 + e) v_{\text{rel}}}{\frac{1}{m_A} + \frac{1}{m_B}}$$

### 1.3 Coulomb Tangential Friction ($J_t$)
Along the collision tangent $\hat{t} = (-n_y, n_x)$, tangential relative velocity is:
$$v_t = (\vec{v}_A - \vec{v}_B) \cdot \hat{t}$$

Friction impulse is bounded by Coulomb's friction cone:
$$|J_t| \le \mu J_n$$

### 1.4 Velocity Resolution
$$\vec{v}_A' = \vec{v}_A + \frac{J_n \hat{n} + J_t \hat{t}}{m_A}$$
$$\vec{v}_B' = \vec{v}_B - \frac{J_n \hat{n} + J_t \hat{t}}{m_B}$$
