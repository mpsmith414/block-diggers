// Backpacks and ores lying in the world.

import { ORES, isSolid } from '../world/blocks.js';
import { TILE, PICKUP, LAYERS } from '../tuning.js';
import { layerOfRow } from './planets.js';

export function createBackpack(cap) {
  return { cap, ores: Object.fromEntries(ORES.map((o) => [o, 0])), count: 0 };
}

export const packFull = (pack) => pack.count >= pack.cap;

export function addOre(pack, ore) {
  if (packFull(pack)) return false;
  pack.ores[ore]++;
  pack.count++;
  return true;
}

export function emptyPack(pack) {
  const out = { ...pack.ores };
  for (const o of ORES) pack.ores[o] = 0;
  pack.count = 0;
  return out;
}

// (x, y) is the pickup's centre.
export function createPickup({ x, y, ore, ttl = Infinity, delay = 0, vx = 0, vy = 0 }) {
  return { x, y, ore, ttl, delay, vx, vy };
}

export function stepPickups(list, grid, dt) {
  const half = PICKUP.size / 2;
  const out = [];
  for (const p of list) {
    p.ttl -= dt;
    if (p.ttl <= 0) continue;
    p.delay = Math.max(0, p.delay - dt);
    if (p.vx) {
      const nx = p.x + p.vx * dt;
      const edge = nx + Math.sign(p.vx) * half;
      if (isSolid(grid.get(Math.floor(edge / TILE), Math.floor(p.y / TILE)))) p.vx = 0;
      else p.x = nx;
      p.vx *= Math.max(0, 1 - 4 * dt);
      if (Math.abs(p.vx) < 2) p.vx = 0;
    }
    const col = Math.floor(p.x / TILE);
    const ny = p.y + (p.vy + PICKUP.gravity * dt) * dt;
    const row = Math.floor((ny + half) / TILE);
    if (p.vy >= 0 && isSolid(grid.get(col, row))) {
      p.y = row * TILE - half;
      p.vy = 0;
    } else if (p.vy < 0 && isSolid(grid.get(col, Math.floor((ny - half) / TILE)))) {
      p.vy = 0;
    } else {
      p.vy += PICKUP.gravity * dt;
      p.y = ny;
    }
    out.push(p);
  }
  return out;
}

// box: { x, y, w, h } top-left. Returns the pickups left and the ores collected.
export function collectPickups(list, box, pack) {
  const half = PICKUP.size / 2;
  const collected = [];
  const left = [];
  for (const p of list) {
    const overlaps = p.x + half > box.x && p.x - half < box.x + box.w &&
      p.y + half > box.y && p.y - half < box.y + box.h;
    if (overlaps && p.delay <= 0 && addOre(pack, p.ore)) collected.push(p.ore);
    else left.push(p);
  }
  return { list: left, collected };
}

// Moon chests: each layer's own ore (the core has a bit of everything).
const MOON_CHEST = {
  craters: ['moonstone'], cheesecaves: ['cheese'], mooncrystal: ['spacegem'], alienbase: ['gizmo'], mooncore: ['moonstone', 'spacegem', 'gizmo'],
};

// A treasure chest holds 3-6 of the best ore for its layer.
export function chestLoot(row, rng, planet = 'earth') {
  if (planet === 'moon') {
    const pool = MOON_CHEST[layerOfRow(row, 'moon')];
    return Array.from({ length: rng.int(3, 6) }, () => rng.pick(pool));
  }
  const ore = row > LAYERS.stone.bottom ? rng.pick(['diamond', 'emerald']) : 'gold';
  return Array.from({ length: rng.int(3, 6) }, () => ore);
}

// Loose ore near a player with room in their pack floats into them.
export function attractPickups(list, center, pack, dt, radiusMul = 1) {
  if (packFull(pack)) return;
  for (const p of list) {
    if (p.delay > 0) continue;
    const dx = center.x - p.x;
    const dy = center.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d > PICKUP.magnetRadius * radiusMul || d < 0.5) continue;
    const step = Math.min(d, PICKUP.magnetSpeed * dt);
    p.x += (dx / d) * step;
    p.y += (dy / d) * step;
    p.vx = 0;
    p.vy = 0;
  }
}

// A bonk knocks up to `max` ores out of the pack (random, by how many you hold).
export function scatterOres(pack, rng, max = 3) {
  const out = [];
  while (out.length < max && pack.count > 0) {
    let r = rng.int(1, pack.count);
    for (const ore of ORES) {
      r -= pack.ores[ore];
      if (r <= 0) {
        pack.ores[ore]--;
        pack.count--;
        out.push(ore);
        break;
      }
    }
  }
  return out;
}
