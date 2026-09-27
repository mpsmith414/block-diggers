// seed → a fresh mine: layered rock, ore veins, gravel, caves, lava, chests.

import { createRng } from './rng.js';
import { createGrid } from './grid.js';
import { B, isSolid } from './blocks.js';
import {
  MINE_W, MINE_H, SHAFT_X, SHAFT_DEPTH, LAYERS, ORE_VEINS, VEIN_SIZE,
  GRAVEL_POCKETS, CAVES, LAVA_POOLS, CHESTS,
} from '../tuning.js';

const HOST = { dirt: B.DIRT, stone: B.STONE, deep: B.DEEP };
const ORE_BLOCK = {
  dirt: { coal: B.COAL_DIRT },
  stone: { coal: B.COAL_STONE, iron: B.IRON, gold: B.GOLD_STONE },
  deep: { gold: B.GOLD_DEEP, diamond: B.DIAMOND, emerald: B.EMERALD },
};
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DECOR = {
  dirt: { floorChance: 0.45, floor: { grass: 3, flower: 1 }, ceilChance: 0.3, ceil: { roots: 1 } },
  stone: { floorChance: 0.3, floor: { mushroom: 2, pebbles: 1 }, ceilChance: 0, ceil: {} },
  deep: { floorChance: 0.3, floor: { glowshroom: 2, crystal: 1 }, ceilChance: 0.2, ceil: { stalactite: 1 } },
};

export function generateMine(seed) {
  const rng = createRng(seed);
  const grid = createGrid(MINE_W, MINE_H);
  const inner = (x, y) => x >= 1 && x <= MINE_W - 2 && y >= 1 && y <= MINE_H - 2;

  // host rock
  for (let y = 0; y < MINE_H; y++) {
    for (let x = 0; x < MINE_W; x++) {
      let id;
      if (x === 0 || x === MINE_W - 1 || y === MINE_H - 1) id = B.BEDROCK;
      else if (y === 0) id = B.GRASS;
      else id = HOST[layerAt(y)];
      grid.set(x, y, id);
    }
  }

  // blobs grown by random walk, only replacing `host` inside the layer
  const blob = (layer, id, size, host = HOST[layer]) => {
    const { top, bottom } = LAYERS[layer];
    let x = rng.int(1, MINE_W - 2);
    let y = rng.int(top, bottom);
    for (let i = 0; i < size; i++) {
      if (grid.get(x, y) === host) grid.set(x, y, id);
      const [dx, dy] = rng.pick(DIRS);
      const nx = x + dx;
      const ny = y + dy;
      if (inner(nx, ny) && ny >= top && ny <= bottom) { x = nx; y = ny; }
    }
  };

  for (const layer of Object.keys(LAYERS)) {
    const { top, bottom } = LAYERS[layer];
    const area = (bottom - top + 1) * (MINE_W - 2);
    const veins = Math.round((area / 1000) * ORE_VEINS[layer].per1000);
    for (let i = 0; i < veins; i++) {
      const ore = rng.weighted(ORE_VEINS[layer].weights);
      blob(layer, ORE_BLOCK[layer][ore], rng.int(VEIN_SIZE.min, VEIN_SIZE.max));
    }
    for (let i = 0; i < (GRAVEL_POCKETS[layer] || 0); i++) {
      blob(layer, B.GRAVEL, rng.int(GRAVEL_POCKETS.size.min, GRAVEL_POCKETS.size.max));
    }
  }

  // caves: a wandering walker carves a round brush, staying inside its layer
  for (const layer of Object.keys(CAVES)) {
    const { count, length, radius } = CAVES[layer];
    const { top, bottom } = LAYERS[layer];
    const yMin = top + Math.ceil(radius) + (layer === 'dirt' ? 3 : 1);
    const yMax = bottom - Math.ceil(radius) - 1;
    for (let c = 0; c < count; c++) {
      let x = rng.int(3, MINE_W - 4);
      let y = rng.int(yMin, yMax);
      let angle = rng.next() * Math.PI * 2;
      const steps = rng.int(length.min, length.max);
      for (let s = 0; s < steps; s++) {
        const r = radius + (rng.next() - 0.5) * 0.8;
        for (let yy = Math.floor(y - r); yy <= Math.ceil(y + r); yy++) {
          for (let xx = Math.floor(x - r); xx <= Math.ceil(x + r); xx++) {
            if (!inner(xx, yy) || yy < top || yy > bottom) continue;
            if ((xx - x) ** 2 + (yy - y) ** 2 <= r * r + 0.25) grid.set(xx, yy, B.AIR);
          }
        }
        angle += (rng.next() - 0.5) * 1.2;
        x = Math.min(MINE_W - 4, Math.max(3, x + Math.cos(angle)));
        y = Math.min(yMax, Math.max(yMin, y + Math.sin(angle) * 0.6));
      }
    }
  }

  // cave floors: open cells with solid rock underneath
  const floors = (top, bottom) => {
    const out = [];
    for (let y = top; y <= bottom; y++) {
      for (let x = 1; x < MINE_W - 1; x++) {
        if (grid.get(x, y) === B.AIR && isSolid(grid.get(x, y + 1)) && grid.get(x, y + 1) !== B.BEDROCK) out.push({ x, y });
      }
    }
    return out;
  };

  // lava pools on deep cave floors (static, never spreads)
  const deepFloors = floors(LAYERS.deep.top, LAYERS.deep.bottom);
  for (let i = 0; i < LAVA_POOLS && deepFloors.length; i++) {
    const start = rng.pick(deepFloors);
    const width = rng.int(1, 3);
    for (let dx = 0; dx < width; dx++) {
      const x = start.x + dx;
      if (grid.get(x, start.y) === B.AIR && isSolid(grid.get(x, start.y + 1))) grid.set(x, start.y, B.LAVA);
    }
  }

  // chests on cave floors in layers 2-3, spread apart
  const chests = [];
  const candidates = floors(LAYERS.stone.top, LAYERS.deep.bottom).filter(
    (c) => grid.get(c.x, c.y) === B.AIR && grid.get(c.x - 1, c.y) !== B.LAVA && grid.get(c.x + 1, c.y) !== B.LAVA,
  );
  for (let attempt = 0; chests.length < CHESTS && attempt < 400; attempt++) {
    const c = candidates.length ? rng.pick(candidates) : null;
    const minGap = attempt < 200 ? 12 : 0;
    if (c && chests.every((o) => Math.abs(o.y - c.y) + Math.abs(o.x - c.x) >= minGap && (o.x !== c.x || o.y !== c.y))) {
      chests.push(c);
    }
  }
  while (chests.length < CHESTS) {
    // no caves to use: dig a one-cell pocket for it
    const x = rng.int(2, MINE_W - 3);
    const y = rng.int(LAYERS.stone.top, LAYERS.deep.bottom - 1);
    if (chests.some((o) => o.x === x && o.y === y)) continue;
    grid.set(x, y + 1, grid.get(x, y + 1) === B.AIR ? HOST[layerAt(y + 1)] : grid.get(x, y + 1));
    chests.push({ x, y });
  }
  for (const c of chests) {
    if (!isSolid(grid.get(c.x, c.y + 1))) grid.set(c.x, c.y + 1, HOST[layerAt(c.y + 1)] ?? B.STONE);
    grid.set(c.x, c.y, B.CHEST);
  }

  // the shaft: a short ladder down through the grass
  for (let y = 0; y < SHAFT_DEPTH; y++) grid.set(SHAFT_X, y, B.LADDER);

  // cave decorations: little things growing on cave floors and ceilings
  const decor = [];
  for (let y = 1; y < MINE_H - 1; y++) {
    const kinds = DECOR[layerAt(y)];
    for (let x = 1; x < MINE_W - 1; x++) {
      if (grid.get(x, y) !== B.AIR) continue;
      const below = grid.get(x, y + 1);
      const above = grid.get(x, y - 1);
      if (isSolid(below) && below !== B.BEDROCK && rng.chance(kinds.floorChance)) {
        decor.push({ x, y, on: 'floor', kind: rng.weighted(kinds.floor), v: rng.int(0, 2) });
      } else if (isSolid(above) && above !== B.BEDROCK && y > 1 && rng.chance(kinds.ceilChance)) {
        decor.push({ x, y, on: 'ceil', kind: rng.weighted(kinds.ceil), v: rng.int(0, 2) });
      }
    }
  }

  return { grid, chests, decor, spawn: { x: SHAFT_X, y: -1 }, seed };
}

// The minecart station: a little room at `row` to start a trip in. Returns the
// decorations that still have something to stand on or hang from.
export function carveStation(mine, x0, row) {
  const { grid } = mine;
  for (let y = row - 2; y <= row; y++) {
    for (let x = x0 - 3; x <= x0 + 3; x++) if (grid.get(x, y) !== B.CHEST) grid.set(x, y, B.AIR);
  }
  for (let x = x0 - 3; x <= x0 + 3; x++) {
    if (!isSolid(grid.get(x, row + 1))) grid.set(x, row + 1, HOST[layerAt(row + 1)]);
  }
  mine.decor = mine.decor.filter((d) => grid.get(d.x, d.y) === B.AIR &&
    isSolid(d.on === 'floor' ? grid.get(d.x, d.y + 1) : grid.get(d.x, d.y - 1)));
  return mine.decor;
}

export function layerAt(y) {
  if (y <= LAYERS.dirt.bottom) return 'dirt';
  if (y <= LAYERS.stone.bottom) return 'stone';
  return 'deep';
}
