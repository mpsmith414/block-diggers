// Earth's Whack-a-Mole: moles pop up out of five molehills; bonk them before
// they duck back down. A round lasts WHACK.round seconds and gets faster as it
// goes; a golden mole now and then is worth 3. Pure: the mine steps it and
// draws it.

import { WHACK } from '../tuning.js';

const lerp = (a, b, k) => a + (b - a) * k;

export function createWhack() {
  return {
    holes: Array.from({ length: WHACK.holes }, () => ({ state: 'down', t: 0, golden: false })),
    time: WHACK.round, spawnT: 0.8, score: 0, over: false,
  };
}

// Advance the round. Returns what happened: { type: 'pop', hole, golden },
// { type: 'hide', hole }, { type: 'end', score }.
export function stepWhack(w, dt, rng) {
  const out = [];
  if (w.over) return out;
  w.time -= dt;
  const k = Math.min(1, Math.max(0, 1 - w.time / WHACK.round)); // 0 → 1 over the round
  w.holes.forEach((h, i) => {
    if (h.state === 'down') return;
    h.t -= dt;
    if (h.t > 0) return;
    if (h.state === 'up') out.push({ type: 'hide', hole: i });
    h.state = 'down';
  });
  if (w.time <= 0) {
    w.over = true;
    w.holes.forEach((h, i) => {
      if (h.state === 'up') out.push({ type: 'hide', hole: i });
      h.state = 'down';
    });
    out.push({ type: 'end', score: w.score });
    return out;
  }
  w.spawnT -= dt;
  const up = w.holes.filter((h) => h.state === 'up').length;
  if (w.spawnT <= 0 && up < WHACK.maxUp) {
    const free = w.holes.map((h, i) => (h.state === 'down' ? i : -1)).filter((i) => i >= 0);
    if (free.length) {
      const i = free[Math.floor(rng.next() * free.length)];
      const golden = rng.next() < WHACK.golden;
      w.holes[i] = { state: 'up', t: lerp(WHACK.up[0], WHACK.up[1], k), golden };
      out.push({ type: 'pop', hole: i, golden });
    }
    w.spawnT = lerp(WHACK.gap[0], WHACK.gap[1], k);
  }
  return out;
}

// Bonk hole i. A mole that's up gets bonked (and counts); anything else is a miss.
export function whack(w, i) {
  const h = w.holes[i];
  if (!h || h.state !== 'up') return { hit: false, golden: false };
  h.state = 'bonked';
  h.t = WHACK.bonked;
  w.score += h.golden ? 3 : 1;
  return { hit: true, golden: h.golden };
}

export const whackReward = (golden) => (golden ? ['diamond', 'diamond', 'diamond'] : ['gold']);
