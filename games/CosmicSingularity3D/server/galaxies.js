/**
 * Galaxy geometry.
 *
 * The universe is a set of non-overlapping spiral discs separated by void.
 * A galaxy is a CENTRE plus a RADIUS; a body belongs to whichever disc it sits
 * in, derived from position rather than stored on the entity, so nothing extra
 * rides the network snapshot and a black hole that falls through a wormhole
 * simply adopts its new home.
 *
 * ---------------------------------------------------------------------------
 * ARM GEOMETRY IS SHARED WITH THE CLIENT.
 * spiralPoint() below defines where the arms are. visuals.js paints the galaxy
 * texture with the identical formula so that the stardust and planets scattered
 * here land on the arms that are drawn there. If you change the formula, change
 * BOTH - test_cosmicsingularity3d_suite.js pins it against known values.
 * ---------------------------------------------------------------------------
 */

const ARM_INNER = 0.13;   // arms start this fraction out from the core
const ARM_OUTER = 0.87;   // ...and run this much further to the rim
const SPREAD_BASE = 0.034;
const SPREAD_GROWTH = 0.117;

function getGalaxies(config) {
    if (Array.isArray(config.galaxies) && config.galaxies.length > 0) {
        return config.galaxies;
    }
    // Single-galaxy universe: the largest disc that fits the canvas.
    return [{
        name: "Universe",
        x: config.canvas.width / 2,
        y: config.canvas.height / 2,
        radius: Math.min(config.canvas.width, config.canvas.height) / 2,
        palette: "amber",
        arms: 2,
        twist: 2.6,
        seed: 1
    }];
}

/**
 * A point on galaxy g's spiral arm.
 * @param t 0 at the core end of the arm, 1 at the rim.
 */
function spiralPoint(g, t, armIndex) {
    const base = (armIndex / g.arms) * Math.PI * 2;
    const theta = base + t * g.twist * Math.PI;
    const r = g.radius * (ARM_INNER + t * ARM_OUTER);
    return { x: g.x + Math.cos(theta) * r, y: g.y + Math.sin(theta) * r };
}

/** How far off-arm bodies scatter at arm position t - widens toward the rim. */
function armSpread(g, t) {
    return g.radius * (SPREAD_BASE + t * SPREAD_GROWTH);
}

function gaussian(rand) {
    return (rand() + rand() + rand() - 1.5) * 2;
}

/**
 * A random position on the spiral arms, denser toward the core, matching the
 * density the client paints. Always lands inside the disc.
 */
function spawnOnArm(g, rand = Math.random, opts = {}) {
    const t = Math.pow(rand(), opts.concentration || 0.62);
    const arm = Math.floor(rand() * g.arms) % g.arms;
    const p = spiralPoint(g, t, arm);
    const spread = armSpread(g, t) * (opts.spreadScale || 1);

    let x = p.x + gaussian(rand) * spread;
    let y = p.y + gaussian(rand) * spread;
    return clampToDisc(g, x, y, g.radius * 0.97);
}

/** A position anywhere on the disc, ignoring arm structure. */
function spawnInDisc(g, rand = Math.random, inset = 0) {
    const maxR = Math.max(0, g.radius - inset);
    const r = Math.sqrt(rand()) * maxR;      // sqrt keeps it area-uniform
    const th = rand() * Math.PI * 2;
    return { x: g.x + Math.cos(th) * r, y: g.y + Math.sin(th) * r };
}

/** Pull a point back inside the disc, preserving its direction from the core. */
function clampToDisc(g, x, y, maxR) {
    const dx = x - g.x;
    const dy = y - g.y;
    const d = Math.hypot(dx, dy);
    if (d <= maxR || d === 0) return { x, y };
    const s = maxR / d;
    return { x: g.x + dx * s, y: g.y + dy * s };
}

/**
 * The galaxy a point sits in. Discs never overlap, so containment is
 * unambiguous; a body adrift in the void is claimed by the nearest galaxy so
 * the physics tick can pull it back in.
 */
function galaxyAt(galaxies, x, y) {
    let nearest = galaxies[0];
    let bestDist = Infinity;
    for (const g of galaxies) {
        const d = Math.hypot(x - g.x, y - g.y);
        if (d <= g.radius) return g;
        if (d < bestDist) {
            bestDist = d;
            nearest = g;
        }
    }
    return nearest;
}

module.exports = {
    getGalaxies, galaxyAt, spiralPoint, armSpread,
    spawnOnArm, spawnInDisc, clampToDisc,
    ARM_INNER, ARM_OUTER
};
