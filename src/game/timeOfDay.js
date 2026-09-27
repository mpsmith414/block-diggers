// The camp's sky moves on a little with every trip home:
// morning → day → sunset → night → morning…

export const PHASES = {
  morning: {
    skyTop: 0x8fc7ef, skyBottom: 0xfbe3b0, sun: { x: 120, y: 60, color: 0xfff0b0 },
    far: 0xa6b8d8, near: [0x86c46a, 0x74b55c], clouds: 0.9, night: 0, fireflies: 0,
  },
  day: {
    skyTop: 0x5fa8e8, skyBottom: 0xbfe4ff, sun: { x: 420, y: 110, color: 0xfff6c8 },
    far: 0x9ab2d6, near: [0x7cc460, 0x68b050], clouds: 1, night: 0, fireflies: 0,
  },
  sunset: {
    skyTop: 0x5b4b8a, skyBottom: 0xf7a86b, sun: { x: 300, y: 64, color: 0xffd27a },
    far: 0x9a86b8, near: [0x7fb267, 0x6aa258], clouds: 0.85, night: 0, fireflies: 10,
  },
  night: {
    skyTop: 0x141a3a, skyBottom: 0x3a3a6e, moon: { x: 360, y: 100 },
    far: 0x3e4474, near: [0x3d6a4a, 0x31583d], clouds: 0.25, night: 0.45, fireflies: 24,
  },
};

export const PHASE_ORDER = ['morning', 'day', 'sunset', 'night'];

export const phaseForTrips = (trips = 0) => PHASE_ORDER[((trips % 4) + 4) % 4];
