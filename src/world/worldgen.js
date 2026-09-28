// seed → a fresh mine: layered rock, ore veins, gravel, caves, lava, water,
// chests, and things to find (geodes, fossils, boom blocks, boulders, a big
// chest, pet eggs).

import { createRng } from './rng.js';
import { createGrid } from './grid.js';
import { B, isSolid, isBoulder } from './blocks.js';
import {
  MINE_W, MINE_H, SHAFT_X, SHAFT_DEPTH, LAYERS, ORE_VEINS, VEIN_SIZE,
  GRAVEL_POCKETS, CAVES, LAVA_POOLS, CHESTS, FINDS, SILLY,
} from '../tuning.js';

export const HOST = {
  dirt: B.DIRT, stone: B.STONE, deep: B.DEEP, crystal: B.CRYSTAL,
  dino: B.SAND, brick: B.BRICKS, meteor: B.METEOR, core: B.CORE,
};
export const ORE_BLOCK = {
  dirt: { coal: B.COAL_DIRT },
  stone: { coal: B.COAL_STONE, iron: B.IRON, gold: B.GOLD_STONE },
  deep: { gold: B.GOLD_DEEP, diamond: B.DIAMOND, emerald: B.EMERALD },
  crystal: { gold: B.GOLD_CRYSTAL, diamond: B.DIAMOND_CRYSTAL, emerald: B.EMERALD_CRYSTAL },
  dino: { amber: B.AMBER },
  brick: { brick: B.BRICK_ORE },
  meteor: { star: B.STAR },
  core: { star: B.STAR },
};
const BEST_ORE = { dirt: 'coal', stone: 'gold', deep: 'diamond', crystal: 'diamond', dino: 'amber', brick: 'brick', meteor: 'star', core: 'star' };
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DECOR = {
  dirt: { floorChance: 0.45, floor: { grass: 3, flower: 1 }, ceilChance: 0.3, ceil: { roots: 1 } },
  stone: { floorChance: 0.3, floor: { mushroom: 2, pebbles: 1 }, ceilChance: 0, ceil: {} },
  deep: { floorChance: 0.3, floor: { glowshroom: 2, crystal: 1 }, ceilChance: 0.2, ceil: { stalactite: 1 } },
  crystal: { floorChance: 0.4, floor: { moss: 3, giantshroom: 2, crystal: 2, amethyst: 0.35 }, ceilChance: 0.18, ceil: { stalactite: 1, amethyst: 0.3 } },
  dino: { floorChance: 0.4, floor: { fern: 3, bones: 1 }, ceilChance: 0, ceil: {} },
  brick: { floorChance: 0.3, floor: { toyblocks: 2, moss: 1 }, ceilChance: 0, ceil: {} },
  meteor: { floorChance: 0.35, floor: { spacecrystal: 2, moss: 1 }, ceilChance: 0.15, ceil: { stalactite: 1 } },
  core: { floorChance: 0.3, floor: { emberflower: 2, crystal: 1 }, ceilChance: 0.15, ceil: { stalactite: 1 } },
};

export function generateMine(seed, { luck = 1, eggKinds = ['mole', 'glowbug', 'batbuddy'], dinoEggKinds = [] } = {}) {
  const rng = createRng(seed);
  const grid = createGrid(MINE_W, MINE_H);
  const inner = (x, y) => x >= 1 && x <= MINE_W - 2 && y >= 1 && y <= MINE_H - 2;
  const lucky = (n) => (luck > 1 ? Math.round(n * 1.5) : n);

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

  // lava pools on deep and core cave floors (static, never spreads)
  const lavaPools = (top, bottom, count) => {
    const spots = floors(top, bottom);
    for (let i = 0; i < count && spots.length; i++) {
      const start = rng.pick(spots);
      const width = rng.int(1, 3);
      for (let dx = 0; dx < width; dx++) {
        const x = start.x + dx;
        if (grid.get(x, start.y) === B.AIR && isSolid(grid.get(x, start.y + 1))) grid.set(x, start.y, B.LAVA);
      }
    }
  };
  lavaPools(LAYERS.deep.top, LAYERS.deep.bottom, LAVA_POOLS);
  lavaPools(LAYERS.core.top, LAYERS.core.bottom - 8, FINDS.coreLava);

  // water on cave floors: glowing pools in the crystal caves (sometimes two
  // deep) and little puddles higher up, so there's always something to drink
  const pools = (top, bottom, count, reach, deepChance) => {
    const spots = floors(top, bottom);
    for (let i = 0; i < count && spots.length; i++) {
      const s = rng.pick(spots);
      const cells = [];
      for (const dir of [-1, 1]) {
        for (let x = dir < 0 ? s.x : s.x + 1; Math.abs(x - s.x) <= reach; x += dir) {
          if (grid.get(x, s.y) !== B.AIR || !isSolid(grid.get(x, s.y + 1))) break;
          cells.push(x);
        }
      }
      const deep = cells.length >= 4 && rng.chance(deepChance);
      const host = HOST[layerAt(s.y + 1)];
      for (const x of cells) {
        grid.set(x, s.y, B.WATER);
        if (deep && grid.get(x, s.y + 1) === host && isSolid(grid.get(x, s.y + 2)) && grid.get(x, s.y + 2) !== B.BEDROCK) {
          grid.set(x, s.y + 1, B.WATER);
        }
      }
    }
  };
  pools(LAYERS.crystal.top, LAYERS.crystal.bottom, FINDS.waterPools, 3, 0.6);
  pools(LAYERS.dirt.top + 3, LAYERS.stone.bottom, FINDS.puddles, 2, 0.3);
  pools(LAYERS.dino.top, LAYERS.brick.bottom, FINDS.oases, 3, 0.5);

  // a floor spot away from lava and water
  const safe = (c) => [B.LAVA, B.WATER].every((bad) => grid.get(c.x - 1, c.y) !== bad && grid.get(c.x + 1, c.y) !== bad);
  const takeSpots = (list, n, minGap) => {
    const out = [];
    for (let attempt = 0; out.length < n && attempt < 400 && list.length; attempt++) {
      const c = rng.pick(list);
      const gap = attempt < 200 ? minGap : 0;
      if (grid.get(c.x, c.y) !== B.AIR || !isSolid(grid.get(c.x, c.y + 1))) continue;
      if (out.every((o) => Math.abs(o.y - c.y) + Math.abs(o.x - c.x) >= gap && (o.x !== c.x || o.y !== c.y))) out.push(c);
    }
    return out;
  };

  // chests: 3 in stone/deep, 1 in the crystal layer
  const chests = [];
  const placeChests = (top, bottom, n) => {
    const got = takeSpots(floors(top, bottom).filter(safe), n, 12);
    while (got.length < n) {
      // no caves to use: dig a one-cell pocket for it
      const x = rng.int(2, MINE_W - 3);
      const y = rng.int(top, bottom - 1);
      if (got.some((o) => o.x === x && o.y === y)) continue;
      grid.set(x, y, B.AIR);
      if (!isSolid(grid.get(x, y + 1))) grid.set(x, y + 1, HOST[layerAt(y + 1)]);
      got.push({ x, y });
    }
    for (const c of got) {
      if (!isSolid(grid.get(c.x, c.y + 1))) grid.set(c.x, c.y + 1, HOST[layerAt(c.y + 1)] ?? B.STONE);
      grid.set(c.x, c.y, B.CHEST);
      chests.push(c);
    }
  };
  placeChests(LAYERS.stone.top, LAYERS.deep.bottom, CHESTS);
  for (const layer of ['crystal', 'dino', 'brick', 'meteor', 'core']) placeChests(LAYERS[layer].top, LAYERS[layer].bottom - (layer === 'core' ? 10 : 0), 1);

  // the big chest: two floor cells side by side
  let bigChest = null;
  const pairs = floors(LAYERS.stone.top, LAYERS.deep.bottom)
    .filter((c) => safe(c) && grid.get(c.x + 1, c.y) === B.AIR && isSolid(grid.get(c.x + 1, c.y + 1)) && grid.get(c.x + 2, c.y) !== B.LAVA);
  if (pairs.length) {
    bigChest = rng.pick(pairs);
    grid.set(bigChest.x, bigChest.y, B.BIGCHEST);
    grid.set(bigChest.x + 1, bigChest.y, B.BIGCHEST_R);
  }

  // pet eggs on deep and crystal cave floors
  const eggs = takeSpots(floors(LAYERS.deep.top, LAYERS.crystal.bottom).filter(safe), lucky(FINDS.eggs), 16)
    .map((c, i) => ({ ...c, kind: eggKinds.length ? eggKinds[i % eggKinds.length] : 'golden' }));
  // dinosaur eggs in the Dino Bone Beds, of the kinds you don't have yet
  if (dinoEggKinds.length) {
    const dinoEggs = takeSpots(floors(LAYERS.dino.top, LAYERS.dino.bottom).filter(safe), 2, 12);
    dinoEggs.forEach((c, i) => eggs.push({ ...c, kind: dinoEggKinds[i % dinoEggKinds.length] }));
  }
  for (const e of eggs) grid.set(e.x, e.y, B.EGG);

  // boulders: at the edge of a cave, in front of a one-block pit with ore
  // beyond it. Push the boulder in to fill the pit and walk over to the ore.
  const boulders = [];
  const boulderSpots = floors(LAYERS.stone.top, LAYERS.core.bottom - 10).filter((c) => safe(c));
  for (let attempt = 0; boulders.length < FINDS.boulders && attempt < 400 && boulderSpots.length; attempt++) {
    const c = rng.pick(boulderSpots);
    const dir = rng.chance(0.5) ? 1 : -1;
    const host = HOST[layerAt(c.y)];
    const px = c.x + dir;
    if (grid.get(c.x, c.y) !== B.AIR || grid.get(c.x - dir, c.y) !== B.AIR) continue;
    if (!isSolid(grid.get(c.x - dir, c.y + 1))) continue; // somewhere to stand and push
    if (![px, px + dir, px + 2 * dir].every((x) => x >= 2 && x <= MINE_W - 3)) continue;
    if (grid.get(px, c.y) !== host || grid.get(px, c.y + 1) !== host || grid.get(px + dir, c.y) !== host || grid.get(px + 2 * dir, c.y) !== host) continue;
    if (!isSolid(grid.get(px, c.y + 2)) || grid.get(px, c.y + 2) === B.BEDROCK) continue;
    // never carve the floor out from under a chest
    if ([B.CHEST, B.BIGCHEST, B.BIGCHEST_R].includes(grid.get(px, c.y - 1))) continue;
    if (boulders.some((o) => Math.abs(o.x - c.x) + Math.abs(o.y - c.y) < 8)) continue;
    grid.set(c.x, c.y, B.BOULDER);
    grid.set(px, c.y, B.AIR);
    grid.set(px, c.y + 1, B.AIR);
    const ore = ORE_BLOCK[layerAt(c.y)][BEST_ORE[layerAt(c.y)]];
    grid.set(px + dir, c.y, ore);
    grid.set(px + 2 * dir, c.y, ore);
    if (grid.get(px + dir, c.y - 1) === host) grid.set(px + dir, c.y - 1, ore);
    boulders.push({ x: c.x, y: c.y, dir });
  }

  // treasures sealed in the rock: replace host rock cells
  const inRock = (top, bottom, n, id) => {
    const out = [];
    for (let attempt = 0; out.length < n && attempt < 2000; attempt++) {
      const x = rng.int(2, MINE_W - 3);
      const y = rng.int(top, bottom);
      if (grid.get(x, y) !== HOST[layerAt(y)]) continue;
      grid.set(x, y, id);
      out.push({ x, y });
    }
    return out;
  };
  inRock(LAYERS.stone.top, LAYERS.core.bottom - 10, lucky(FINDS.geodes), B.GEODE);
  const fossils = [
    ...inRock(LAYERS.dirt.top + 3, LAYERS.stone.bottom, lucky(FINDS.fossils), B.FOSSIL),
    ...inRock(LAYERS.dino.top, LAYERS.dino.bottom, lucky(FINDS.fossils), B.FOSSIL), // the dino layer is full of them
  ].map((f) => ({ ...f, v: rng.int(0, 2) }));
  inRock(LAYERS.stone.top, LAYERS.core.bottom - 10, FINDS.booms, B.BOOM);
  inRock(LAYERS.meteor.top, LAYERS.meteor.bottom, FINDS.meteorites, B.METEORITE);

  // springy blocks in the brick caverns: a cave floor cell becomes a bouncer
  const springSpots = floors(LAYERS.brick.top, LAYERS.brick.bottom).filter((c) => safe(c) && grid.get(c.x, c.y) === B.AIR);
  for (let i = 0; i < FINDS.springs && springSpots.length; i++) {
    const c = rng.pick(springSpots);
    if (grid.get(c.x, c.y + 1) === B.BRICKS || grid.get(c.x, c.y + 1) === B.BRICK_ORE) grid.set(c.x, c.y + 1, B.SPRING);
  }

  // the Heart of the World: a 3x3 gem in a chamber at the very bottom
  const hx = Math.floor(MINE_W / 2) - 1;
  const hy = MINE_H - 5; // resting on the chamber floor
  for (let y = hy - 3; y <= MINE_H - 2; y++) for (let x = hx - 4; x <= hx + 6; x++) grid.set(x, y, B.AIR);
  for (let x = hx - 4; x <= hx + 6; x++) grid.set(x, MINE_H - 2, B.CORE);
  for (let y = hy; y <= hy + 2; y++) for (let x = hx; x <= hx + 2; x++) grid.set(x, y, B.HEART);
  const heart = { x: hx, y: hy };

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

  // dinosaur skeletons on the back walls of dino caves (big, 3x2 cells)
  const skeletonSpots = floors(LAYERS.dino.top, LAYERS.dino.bottom).filter((c) =>
    [0, 1, 2].every((dx) => [0, 1].every((dy) => grid.get(c.x + dx, c.y - dy) === B.AIR)));
  for (let i = 0; i < FINDS.skeletons && skeletonSpots.length; i++) {
    const c = rng.pick(skeletonSpots);
    if (decor.some((d) => d.kind === 'skeleton' && Math.abs(d.x - c.x) < 6 && Math.abs(d.y - c.y) < 4)) continue;
    decor.push({ x: c.x, y: c.y, on: 'wall', kind: 'skeleton', v: rng.int(0, 1) });
  }

  // joke finds, placed last: rubber ducks bobbing on pools, whoopee cushions on floors
  const pondTops = [];
  for (let y = 1; y < MINE_H - 1; y++) {
    for (let x = 1; x < MINE_W - 1; x++) if (grid.get(x, y) === B.WATER && grid.get(x, y - 1) === B.AIR) pondTops.push({ x, y });
  }
  const ducks = [];
  for (let i = 0; i < SILLY.ducks * 4 && ducks.length < SILLY.ducks && pondTops.length; i++) {
    const c = rng.pick(pondTops);
    if (!ducks.some((d) => Math.abs(d.x - c.x) + Math.abs(d.y - c.y) < 6)) ducks.push(c);
  }
  const cushions = takeSpots(
    floors(LAYERS.dirt.top + 2, LAYERS.crystal.bottom).filter((c) => safe(c) && Math.abs(c.x - SHAFT_X) > 1),
    SILLY.cushions, 14,
  );

  return { grid, chests, decor, eggs, bigChest, boulders, fossils, heart, ducks, cushions, spawn: { x: SHAFT_X, y: -1 }, seed };
}

// The minecart station: a little room at `row` to start a trip in. Returns the
// decorations that still have something to stand on or hang from.
export function carveStation(mine, x0, row) {
  const { grid } = mine;
  const hostAt = mine.hostAt ?? ((y) => HOST[layerAt(y)]);
  const keep = new Set([B.CHEST, B.BIGCHEST, B.BIGCHEST_R, B.EGG, B.UFO, B.TELEPORT]);
  for (let y = row - 2; y <= row; y++) {
    for (let x = x0 - 3; x <= x0 + 3; x++) if (!keep.has(grid.get(x, y))) grid.set(x, y, B.AIR);
  }
  for (let x = x0 - 3; x <= x0 + 3; x++) {
    if (!isSolid(grid.get(x, row + 1))) grid.set(x, row + 1, hostAt(row + 1));
  }
  mine.decor = mine.decor.filter((d) => grid.get(d.x, d.y) === B.AIR &&
    isSolid(d.on === 'ceil' ? grid.get(d.x, d.y - 1) : grid.get(d.x, d.y + 1)));
  mine.boulders = (mine.boulders ?? []).filter((b) => isBoulder(grid.get(b.x, b.y)));
  return mine.decor;
}

export function layerAt(y) {
  if (y <= LAYERS.dirt.bottom) return 'dirt';
  if (y <= LAYERS.stone.bottom) return 'stone';
  if (y <= LAYERS.deep.bottom) return 'deep';
  if (y <= LAYERS.crystal.bottom) return 'crystal';
  if (y <= LAYERS.dino.bottom) return 'dino';
  if (y <= LAYERS.brick.bottom) return 'brick';
  if (y <= LAYERS.meteor.bottom) return 'meteor';
  return 'core';
}
