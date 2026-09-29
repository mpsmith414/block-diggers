// Toys in the mine: boom blocks, boulders, the big chest, geodes and fossils.

import { B, dropOf, isBoulder } from '../world/blocks.js';
import { LAYERS } from '../tuning.js';

// Things a boom never clears.
const TOUGH = new Set([
  B.BEDROCK, B.CHEST, B.BIGCHEST, B.BIGCHEST_R, B.BOULDER, B.CHEESE_WHEEL, B.EGG, B.LADDER, B.WATER, B.LAVA, B.TELEPORT, B.UFO,
  B.GEYSER, B.OLD_ROVER, B.VAULT, B.VAULT_DOOR, B.GLYPH,
]);

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
  const id = grid.get(x, y);
  if (!open(grid.get(nx, y))) return { moved: false, x, y, fell: 0 };
  grid.set(x, y, B.AIR);
  let ny = y;
  while (grid.inside(nx, ny + 1) && open(grid.get(nx, ny + 1))) ny++;
  grid.set(nx, ny, isBoulder(id) ? id : B.BOULDER);
  return { moved: true, x: nx, y: ny, fell: ny - y };
}

// Two cheese wheels side by side have a cheese party: the other wheel, or false.
export function wheelsMeet(grid, x, y) {
  if (grid.get(x, y) !== B.CHEESE_WHEEL) return false;
  for (const dx of [1, -1]) if (grid.get(x + dx, y) === B.CHEESE_WHEEL) return { x: x + dx, y };
  return false;
}

export const cheesePartyLoot = (rng) => Array.from({ length: rng.int(8, 10) }, () => 'cheese');

// The crashed UFO: its hatch pops open, full of alien gizmos and space gems.
export const ufoLoot = (rng) => [
  ...Array.from({ length: rng.int(6, 8) }, () => 'gizmo'),
  ...Array.from({ length: rng.int(2, 3) }, () => 'spacegem'),
];

// An old Mars rover: it beeps, blinks and pops open, full of bolts.
export const roverLoot = (rng) => [...Array.from({ length: rng.int(6, 8) }, () => 'bolt'), 'ruby', 'ruby'];

// A Martian vault: a pile of Mars coins behind its door.
export const vaultLoot = (rng) => Array.from({ length: rng.int(8, 10) }, () => 'coin');

// On the Moon, meteorites crack open into moonstone.
export const moonMeteoriteLoot = (rng) => Array.from({ length: rng.int(5, 7) }, () => 'moonstone');

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

// A meteorite cracks open into a shower of star shards (and sometimes a diamond).
export function meteoriteLoot(rng) {
  const loot = Array.from({ length: rng.int(5, 7) }, () => 'star');
  if (rng.chance(0.4)) loot.push('diamond');
  return loot;
}

// The 3x3 treasure at the bottom of each planet: its block, the big gem, the
// shower of ore when it's dug free, its sticker and its glow.
export const HEARTS = {
  earth: { block: B.HEART, big: 'heart-big', loot: ['star', 'star', 'star', 'diamond', 'emerald', 'gold', 'amber', 'brick'], sticker: 'find-heart', color: 0xff6a9a },
  moon: { block: B.MOON_HEART, big: 'moonheart-big', loot: ['moonstone', 'moonstone', 'spacegem', 'spacegem', 'gizmo', 'gizmo', 'cheese', 'cheese'], sticker: 'find-moonheart', color: 0x6ad0ff },
  mars: { block: B.MARS_HEART, big: 'marsheart-big', loot: ['ruby', 'ruby', 'bolt', 'bolt', 'opal', 'opal', 'coin', 'coin'], sticker: 'find-marsheart', color: 0xff5a3a },
};
export const heartOf = (kind) => HEARTS[kind] ?? HEARTS.earth;

// How many of the Heart's 9 cells are still in the rock.
export function heartLeft(grid, heart) {
  const id = heartOf(heart.kind).block;
  let n = 0;
  for (let y = heart.y; y < heart.y + 3; y++) for (let x = heart.x; x < heart.x + 3; x++) if (grid.get(x, y) === id) n++;
  return n;
}

export function bigChestLoot(row, rng) {
  const ore = row > LAYERS.stone.bottom ? rng.pick(['diamond', 'emerald']) : 'gold';
  return Array.from({ length: rng.int(8, 12) }, () => ore);
}
