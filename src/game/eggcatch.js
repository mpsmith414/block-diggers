// Dino Planet's Egg Catch: a pterodactyl flies back and forth across the top
// of the room dropping eggs; run under them with the basket over your head.
// A speckled egg is 1, a golden egg 3, and a rotten egg (pee-yew!) nothing.
// Eggs you miss just splat. A round lasts EGGS.round seconds and gets faster.
// Pure: the mine steps it and draws it.

import { EGGS } from '../tuning.js';

const lerp = (a, b, k) => a + (b - a) * k;

// The room in px: x0..x1 wide, eggs drop from `top`, the floor at `floor`.
export function createEggGame(x0, x1, top, floor) {
  return {
    x0, x1, top, floor,
    ptero: { x: (x0 + x1) / 2, dir: 1 },
    eggs: [], time: EGGS.round, dropT: 1, score: 0, over: false,
  };
}

// Advance the game. `baskets` are where the players' basket rims are
// ({ x, y }). Returns what happened: drop { egg }, catch { egg, basket },
// splat { egg }, end { score }.
export function stepEggGame(g, baskets, dt, rng) {
  const out = [];
  const k = Math.min(1, Math.max(0, 1 - g.time / EGGS.round));
  // the pterodactyl flies on, turning at the walls
  const p = g.ptero;
  p.x += p.dir * EGGS.ptero * dt;
  if (p.x > g.x1 - 20) { p.x = g.x1 - 20; p.dir = -1; }
  if (p.x < g.x0 + 20) { p.x = g.x0 + 20; p.dir = 1; }
  if (!g.over) {
    g.time -= dt;
    g.dropT -= dt;
    if (g.dropT <= 0) {
      const r = rng.next();
      const kind = r < EGGS.golden ? 'golden' : r < EGGS.golden + EGGS.rotten ? 'rotten' : 'egg';
      const egg = { x: p.x, y: g.top, vy: 0, kind };
      g.eggs.push(egg);
      out.push({ type: 'drop', egg });
      g.dropT = lerp(EGGS.every[0], EGGS.every[1], k);
    }
    if (g.time <= 0) {
      g.over = true;
      out.push({ type: 'end', score: g.score });
    }
  }
  // the eggs fall: into a basket, or splat on the floor
  const gravity = lerp(EGGS.gravity[0], EGGS.gravity[1], k);
  g.eggs = g.eggs.filter((egg) => {
    const was = egg.y;
    egg.vy = Math.min(EGGS.maxFall, egg.vy + gravity * dt);
    egg.y += egg.vy * dt;
    const b = baskets.findIndex((bk) => Math.abs(bk.x - egg.x) <= EGGS.catchW && was < bk.y && egg.y >= bk.y);
    if (b >= 0) {
      g.score += egg.kind === 'golden' ? 3 : egg.kind === 'rotten' ? 0 : 1;
      out.push({ type: 'catch', egg, basket: b });
      return false;
    }
    if (egg.y >= g.floor) {
      out.push({ type: 'splat', egg });
      return false;
    }
    return true;
  });
  return out;
}

export const eggReward = (kind) => (kind === 'golden' ? ['obsidian', 'obsidian', 'obsidian'] : kind === 'rotten' ? [] : ['jade']);
