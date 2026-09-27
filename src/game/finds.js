// Toys in the mine: boom blocks, boulders, the big chest, geodes and fossils.

import { B, dropOf } from '../world/blocks.js';
import { LAYERS } from '../tuning.js';

// Things a boom never clears.
const TOUGH = new Set([B.BEDROCK, B.CHEST, B.BIGCHEST, B.BIGCHEST_R, B.BOULDER, B.EGG, B.LADDER, B.WATER, B.LAVA]);

// A boom at (x, y) clears the 3×3 around it. Other boom blocks it reaches are
// returned to be lit, not cleared. Ores from cleared cells come back as drops.
export function explode(grid, x, y) {
  const cleared = [];
  const chain = [];
  grid.set(x, y, B.AIR);
  for (let yy = y - 1; yy <= y + 1; yy++) {
    for (let xx = x - 1; xx <= x + 1; xx++) {
      if (xx === x && yy === y) continue;
      if (!grid.inside(xx, yy)) continue;
      const id = grid.get(xx, yy);
      if (id === B.BOOM) {
        chain.push({ x: xx, y: yy });
        continue;
      }
      if (id === B.AIR || TOUGH.has(id)) continue;
      grid.set(xx, yy, B.AIR);
      cleared.push({ x: xx, y: yy, id, drop: dropOf(id) });
    }
  }
  return { cleared, chain };
}

const open = (id) => id === B.AIR || id === B.WATER;

// Push the boulder at (x, y) one cell in `dir` (±1). It then drops to a floor.
export function pushBoulder(grid, x, y, dir) {
  const nx = x + dir;
  if (!open(grid.get(nx, y))) return { moved: false, x, y, fell: 0 };
  grid.set(x, y, B.AIR);
  let ny = y;
  while (grid.inside(nx, ny + 1) && open(grid.get(nx, ny + 1))) ny++;
  grid.set(nx, ny, B.BOULDER);
  return { moved: true, x: nx, y: ny, fell: ny - y };
}

// In co-op the big chest only opens with both of you at it.
export const bigChestReady = ({ touching, players }) => touching >= Math.min(2, players);

export function geodeLoot(row, rng) {
  const n = rng.int(4, 6);
  let pool = ['gold'];
  if (row > LAYERS.stone.bottom) pool = ['gold', 'diamond', 'emerald'];
  if (row > LAYERS.deep.bottom) pool = ['diamond', 'emerald'];
  return Array.from({ length: n }, () => rng.pick(pool));
}

export const FOSSIL_KINDS = ['shell', 'bone', 'dino'];

export function bigChestLoot(row, rng) {
  const ore = row > LAYERS.stone.bottom ? rng.pick(['diamond', 'emerald']) : 'gold';
  return Array.from({ length: rng.int(8, 12) }, () => ore);
}
