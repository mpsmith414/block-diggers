// The Sun's Firework Launcher: balloons float up from below; jump on one of
// the launch pads to send a firework rocket straight up. A rocket that hits a
// balloon bursts it, and the burst pops any balloons close by too: chain
// reactions! A golden balloon is worth 3. A round lasts FIREWORKS.round
// seconds and gets busier as it goes. Pure: the mine steps it and draws it.

import { FIREWORKS } from '../tuning.js';

const lerp = (a, b, k) => a + (b - a) * k;
const COLORS = ['red', 'blue', 'green', 'pink'];

// The room in px: x0..x1 wide, rockets burst at `top`, balloons start below
// `floor`; `pads` are the launch pads' x positions.
export function createShow(x0, x1, top, floor, pads) {
  return {
    x0, x1, top, floor, pads, padT: pads.map(() => 0),
    balloons: [], rockets: [], time: FIREWORKS.round, spawnT: 0.6, score: 0, over: false,
  };
}

// Launch a rocket from pad i (if it's ready). Returns the rocket, or null.
export function launch(s, i) {
  if (s.padT[i] > 0 || s.over) return null;
  s.padT[i] = FIREWORKS.padCooldown;
  const rocket = { x: s.pads[i], y: s.floor - 6, pad: i };
  s.rockets.push(rocket);
  return rocket;
}

// Advance the show. Returns what happened: spawn { balloon }, pop { balloon,
// pad, chain } (chain: how many popped in that burst so far), fizzle { rocket }
// (burst at the top, hitting nothing), escape { balloon }, end { score }.
export function stepShow(s, dt, rng) {
  const out = [];
  const k = Math.min(1, Math.max(0, 1 - s.time / FIREWORKS.round));
  s.padT = s.padT.map((t) => Math.max(0, t - dt));
  if (!s.over) {
    s.time -= dt;
    s.spawnT -= dt;
    if (s.spawnT <= 0) {
      const kind = rng.next() < FIREWORKS.golden ? 'gold' : COLORS[Math.floor(rng.next() * COLORS.length)];
      const balloon = { x: s.x0 + 20 + rng.next() * (s.x1 - s.x0 - 40), y: s.floor + 10, kind, phase: rng.next() * 6 };
      s.balloons.push(balloon);
      out.push({ type: 'spawn', balloon });
      s.spawnT = lerp(FIREWORKS.every[0], FIREWORKS.every[1], k);
    }
    if (s.time <= 0) {
      s.over = true;
      out.push({ type: 'end', score: s.score });
    }
  }
  // the balloons float up, swaying (and drift away at the top)
  const rise = lerp(FIREWORKS.rise[0], FIREWORKS.rise[1], k);
  s.balloons = s.balloons.filter((b) => {
    b.phase += dt * 2;
    b.x = Math.max(s.x0 + 8, Math.min(s.x1 - 8, b.x + Math.sin(b.phase) * 10 * dt));
    b.y -= rise * dt;
    if (b.y < s.top - 10) {
      out.push({ type: 'escape', balloon: b });
      return false;
    }
    return true;
  });
  // the rockets shoot up: a balloon in the way bursts, and so do its neighbours
  s.rockets = s.rockets.filter((r) => {
    r.y -= FIREWORKS.rocket * dt;
    const hit = s.balloons.find((b) => Math.abs(b.x - r.x) <= FIREWORKS.hitX && Math.abs(b.y - r.y) <= FIREWORKS.hitY);
    if (hit) {
      let chain = 0;
      const burst = [hit];
      while (burst.length) {
        const b = burst.shift();
        if (!s.balloons.includes(b)) continue;
        s.balloons = s.balloons.filter((q) => q !== b);
        chain++;
        s.score += b.kind === 'gold' ? 3 : 1;
        out.push({ type: 'pop', balloon: b, pad: r.pad, chain });
        for (const q of s.balloons) if (Math.hypot(q.x - b.x, q.y - b.y) <= FIREWORKS.chain) burst.push(q);
      }
      return false;
    }
    if (r.y < s.top) {
      out.push({ type: 'fizzle', rocket: r });
      return false;
    }
    return true;
  });
  return out;
}

export const fireworkReward = (kind) => (kind === 'gold' ? ['nova', 'nova', 'nova'] : ['sunstone']);
