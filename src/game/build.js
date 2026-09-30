// The Build Yard: a meadow past the gate at the end of Earth camp where you
// build with the blocks you've found. Blocks unlock by exploring: reach a
// layer (on any planet) and its rock and treasure are yours to build with,
// as many as you like. Pure: the scene draws it and saves it.

import { B, isSolid } from '../world/blocks.js';
import { createGrid } from '../world/grid.js';
import { layersReached } from './trip.js';
import { BUILD, PLAYER, TILE } from '../tuning.js';

// what each layer unlocks (in the order they show on the block bar)
export const UNLOCKS = {
  dirt: [B.GRASS, B.DIRT, B.COAL_DIRT],
  stone: [B.STONE, B.COAL_STONE, B.IRON, B.GRAVEL],
  deep: [B.DEEP, B.GOLD_STONE, B.GOLD_DEEP, B.WATER],
  crystal: [B.CRYSTAL, B.DIAMOND, B.EMERALD, B.GOLD_CRYSTAL, B.DIAMOND_CRYSTAL, B.EMERALD_CRYSTAL],
  dino: [B.SAND, B.AMBER],
  brick: [B.BRICKS, B.BRICK_ORE, B.SPRING],
  meteor: [B.METEOR, B.STAR],
  core: [B.CORE, B.HEART],
  craters: [B.MOONROCK, B.MOONSTONE],
  cheesecaves: [B.CHEESE_ROCK, B.CHEESE],
  mooncrystal: [B.MOON_CRYSTAL, B.SPACE_GEM],
  alienbase: [B.ALIEN_PANEL, B.GIZMO],
  mooncore: [B.MOON_CORE, B.MOON_HEART],
  dunes: [B.MARS_ROCK, B.RUBY],
  rovers: [B.RUST_ROCK, B.BOLT],
  volcano: [B.BASALT, B.OPAL],
  ruins: [B.RUIN_STONE, B.COIN],
  marscore: [B.MARS_CORE, B.MARS_HEART],
  rings: [B.ICE, B.FROST, B.SNOW],
  icecream: [B.SOFTSERVE, B.ICECREAM],
  aurora: [B.AURORA_ROCK, B.PEARL],
  comets: [B.COMET_ROCK, B.COMET],
  saturncore: [B.SATURN_CORE, B.SATURN_HEART],
  jungle: [B.JUNGLE_SOIL, B.JADE],
  bonebeds: [B.FOSSIL_ROCK, B.BONE],
  swamp: [B.SWAMP_MUD, B.TOOTH],
  lavalands: [B.VOLCANIC, B.OBSIDIAN],
  dinocore: [B.DINO_CORE, B.DINO_HEART],
  corona: [B.CORONA_ROCK, B.SUNSTONE],
  sunspots: [B.SUNSPOT_ROCK, B.FLARE],
  plasmasea: [B.PLASMA_ROCK, B.PLASMA],
  radiance: [B.RADIANT_ROCK, B.NOVA],
  fusion: [B.FUSION_ROCK],
  suncore: [B.SUN_CORE, B.SUN_HEART],
};
// always there: grass, dirt, stone and ladders (to climb what you build)
const ALWAYS = [B.GRASS, B.DIRT, B.STONE, B.LADDER];

// Every block you can build with, in bar order.
export function unlockedBlocks(state) {
  const records = state.records ?? {};
  const reached = new Set([...(records.layers ?? []), ...layersReached(records.deepest ?? 0)]);
  const out = [...ALWAYS];
  for (const [layer, blocks] of Object.entries(UNLOCKS)) {
    if (reached.has(layer)) for (const id of blocks) if (!out.includes(id)) out.push(id);
  }
  return out;
}

// The meadow before anyone builds: grass on dirt, bedrock at the very bottom.
function groundAt(y) {
  if (y === BUILD.h - 1) return B.BEDROCK;
  if (y === BUILD.ground) return B.GRASS;
  if (y > BUILD.ground) return B.DIRT;
  return B.AIR;
}

// The yard, with your saved builds on it (`edits`: [x, y, id] for every cell
// that differs from the meadow).
export function createYard(edits = []) {
  const grid = createGrid(BUILD.w, BUILD.h);
  for (let y = 0; y < BUILD.h; y++) for (let x = 0; x < BUILD.w; x++) grid.set(x, y, groundAt(y));
  for (const [x, y, id] of edits) if (canEdit(x, y)) grid.set(x, y, id);
  return grid;
}

// The cells that differ from the meadow (what the save keeps).
export function yardEdits(grid) {
  const out = [];
  for (let y = 0; y < BUILD.h; y++) {
    for (let x = 0; x < BUILD.w; x++) {
      const id = grid.get(x, y);
      if (id !== groundAt(y)) out.push([x, y, id]);
    }
  }
  return out;
}

// the bottom row (and the gate at the left edge) can't be changed
const canEdit = (x, y) => x >= BUILD.gate && x < BUILD.w && y >= 0 && y < BUILD.h - 1;

// Put a block in an empty cell (not inside anyone). Returns true if it went in.
export function placeBlock(grid, x, y, id, bodies = []) {
  if (!canEdit(x, y) || grid.get(x, y) !== B.AIR) return false;
  const cell = { x: x * TILE, y: y * TILE, w: TILE, h: TILE };
  const inside = (p) => p.x < cell.x + cell.w && p.x + PLAYER.w > cell.x && p.y < cell.y + cell.h && p.y + PLAYER.h > cell.y;
  if (isSolid(id) && bodies.some(inside)) return false;
  grid.set(x, y, id);
  return true;
}

// Take a block away. Returns the block that was there, or null.
export function removeBlock(grid, x, y) {
  if (!canEdit(x, y)) return null;
  const id = grid.get(x, y);
  if (id === B.AIR) return null;
  grid.set(x, y, B.AIR);
  return id;
}

// Where a player's block goes: above their head (stick up), under their feet
// (stick down: jump and build a tower under yourself!), or beside them.
export function aimCell(p, moveX = 0, moveY = 0) {
  const cx = Math.floor((p.x + PLAYER.w / 2) / TILE);
  const cy = Math.floor((p.y + PLAYER.h / 2) / TILE);
  if (moveY < -0.5) return { x: cx, y: cy - 1 };
  if (moveY > 0.5) return { x: cx, y: cy + 1 };
  const dir = moveX > 0.5 ? 1 : moveX < -0.5 ? -1 : (p.facing || 1);
  return { x: cx + dir, y: cy };
}

// How tall is the tallest thing you've built (in blocks above the grass)?
export function tallest(grid) {
  for (let y = 0; y < BUILD.ground; y++) {
    for (let x = 0; x < BUILD.w; x++) if (grid.get(x, y) !== B.AIR) return BUILD.ground - y;
  }
  return 0;
}

// How many different kinds of block have you built with?
export const kindsUsed = (grid) => new Set(yardEdits(grid).map(([, , id]) => id).filter((id) => id !== B.AIR)).size;
