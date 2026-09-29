// Mars dust storms: calm, then a short warning (the windsock wobbles, the
// wind whistles), then a few seconds of red dust blowing one way, gently
// pushing everyone. Pure: the mine steps it and draws it.

import { STORM } from '../tuning.js';

const between = (rng, [lo, hi]) => lo + rng.next() * (hi - lo);

export function createStorm(rng) {
  // the first storm comes soon, so you see one early on
  return { phase: 'calm', t: between(rng, STORM.first), dir: 0 };
}

// Advance the storm. Returns what just happened: 'warn', 'start' or 'end'.
export function stepStorm(s, dt, rng) {
  s.t -= dt;
  if (s.t > 0) return [];
  if (s.phase === 'calm') {
    s.phase = 'warn';
    s.t += STORM.warn;
    s.dir = rng.chance(0.5) ? 1 : -1;
    return ['warn'];
  }
  if (s.phase === 'warn') {
    s.phase = 'blow';
    s.t += STORM.blow;
    return ['start'];
  }
  s.phase = 'calm';
  s.t += between(rng, STORM.calm);
  return ['end'];
}

// The push (px/s) on anyone out in it.
export const windOf = (s) => (s && s.phase === 'blow' ? s.dir * STORM.push : 0);
