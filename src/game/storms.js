// Mars dust storms: calm, then a short warning (the windsock wobbles, the
// wind whistles), then a few seconds of red dust blowing one way, gently
// pushing everyone. Pure: the mine steps it and draws it.

import { STORM } from '../tuning.js';

const between = (rng, [lo, hi]) => lo + rng.next() * (hi - lo);

// (solar flares on the Sun use the same cycle with their own `timing`)
export function createStorm(rng, timing = STORM) {
  // the first storm comes soon, so you see one early on
  return { phase: 'calm', t: between(rng, timing.first), dir: 0 };
}

// Advance the storm. Returns what just happened: 'warn', 'start' or 'end'.
export function stepStorm(s, dt, rng, timing = STORM) {
  s.t -= dt;
  if (s.t > 0) return [];
  if (s.phase === 'calm') {
    s.phase = 'warn';
    s.t += timing.warn;
    s.dir = rng.chance(0.5) ? 1 : -1;
    return ['warn'];
  }
  if (s.phase === 'warn') {
    s.phase = 'blow';
    s.t += timing.blow;
    return ['start'];
  }
  s.phase = 'calm';
  s.t += between(rng, timing.calm);
  return ['end'];
}

// The push (px/s) on anyone out in it.
export const windOf = (s) => (s && s.phase === 'blow' ? s.dir * STORM.push : 0);
