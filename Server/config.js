module.exports = {
  gameport: 4444,
  server: {
    frameRate: 30,
  },
  canvas: {
    width: 2000,
    height: 2000,
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
    airResistance: 0.1,
    surfaceResistance: 0.3,
  },
};
