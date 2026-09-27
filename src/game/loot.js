// Backpacks and ores lying in the world.

import { ORES, isSolid } from '../world/blocks.js';
import { TILE, PICKUP } from '../tuning.js';

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
