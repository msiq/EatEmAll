module.exports = {
  gameport: 4444,
  server: {
    frameRate: 100,
  },
  canvas: {
    width: 4000,
    height: 4000,
  },
  dots: {
    minRad: 15,
    maxRad: 25,
  },
  player: {
    fps: 30,
    speed: 2,
    ease: 0.2,
    rad: 20,
    turn: 2,
  },
  env: {
    gravity: 9.8,
    airResistance: 0.15,
    surfaceResistance: 0.85,
  },
};
