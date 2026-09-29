// Pets: hatched from eggs brought home. Each helps in its own way.

import { dropOf } from '../world/blocks.js';
import { PETS } from '../tuning.js';

// cave pets come from cave eggs (and the owl); dinosaurs from dino eggs
export const CAVE_KINDS = ['mole', 'glowbug', 'batbuddy'];
export const DINO_KINDS = ['rex', 'trike'];
export const MOON_KINDS = ['moonpup'];
export const PET_KINDS = [...CAVE_KINDS, ...DINO_KINDS, ...MOON_KINDS];

// A new kind hatches into a pet; a golden egg (or one you already have) is gold.
export function hatch(state, kind) {
  const pets = state.pets ?? [];
  if (PET_KINDS.includes(kind) && !pets.includes(kind)) {
    return { state: { ...state, pets: [...pets, kind] }, pet: kind, gold: 0 };
  }
  const gold = PETS.goldenEggGold;
  return { state: { ...state, bank: { ...state.bank, gold: state.bank.gold + gold } }, pet: null, gold };
}

// The mole's nose: the nearest ore cell within r (in cells), or null.
export function sniff(grid, cx, cy, r) {
  let best = null;
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if (!dropOf(grid.get(x, y))) continue;
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r && (!best || d < best.d)) best = { x, y, d };
    }
  }
  return best ? { x: best.x, y: best.y } : null;
}

// Ease toward a target, never faster than `speed` px/s, never past it.
export function follow(pos, target, dt, speed) {
  const dx = target.x - pos.x;
  const dy = target.y - pos.y;
  const d = Math.hypot(dx, dy);
  if (d < 0.5) {
    pos.x = target.x;
    pos.y = target.y;
    return pos;
  }
  const step = Math.min(d, Math.max(d * 4 * dt, 0), speed * dt);
  pos.x += (dx / d) * step;
  pos.y += (dy / d) * step;
  return pos;
}

// The T-rex's roar: every creature whose middle is within r px of (x, y).
export function roarTargets(enemies, x, y, r) {
  return enemies.filter((e) => Math.hypot(e.x + e.w / 2 - x, e.y + e.h / 2 - y) <= r);
}

export function nearestPickup(pickups, x, y, r) {
  let best = null;
  for (const p of pickups) {
    if (p.delay > 0) continue;
    const d = Math.hypot(p.x - x, p.y - y);
    if (d <= r && (!best || d < best.d)) best = { p, d };
  }
  return best ? best.p : null;
}
