// seed → Mars: five layers under the red dunes. The Red Dunes (rubies), the
// Rover Graveyard (bolts, old rovers to open, the Rover Bot's egg), the
// Volcano Caves (fire opals, lava, steam geysers), the Martian City (Mars
// coins, sealed vaults with glyph buttons) and the Mars Core with the Mars
// Heart at the very bottom. Same shape as a mine, so MineScene digs it with
// the same engine.

import { createRng } from './rng.js';
import { B, isSolid } from './blocks.js';
import { createPlanetGen } from './planetgen.js';
import { MINE_W, SHAFT_X, MARS_H, MARS_LAYERS, MARS_GEN } from '../tuning.js';

export const MARS_HOST = {
  dunes: B.MARS_ROCK, rovers: B.RUST_ROCK, volcano: B.BASALT, ruins: B.RUIN_STONE, marscore: B.MARS_CORE,
};
const ORE_BLOCK = { ruby: B.RUBY, bolt: B.BOLT, opal: B.OPAL, coin: B.COIN };
const DECOR = {
  dunes: { floorChance: 0.25, floor: { dunegrass: 2, pebbles: 2 }, ceilChance: 0.1, ceil: { stalactite: 1 } },
  rovers: { floorChance: 0.3, floor: { scrap: 2, gear: 2 }, ceilChance: 0.15, ceil: { cable: 1 } },
  volcano: { floorChance: 0.3, floor: { emberflower: 2, pebbles: 1 }, ceilChance: 0.15, ceil: { stalactite: 1 } },
  ruins: { floorChance: 0.3, floor: { urn: 2, glyphstone: 1 }, ceilChance: 0.15, ceil: { roots: 1 } },
  marscore: { floorChance: 0.35, floor: { firecrystal: 2, emberflower: 1 }, ceilChance: 0.15, ceil: { stalactite: 1 } },
};
const LAYER_IDS = Object.keys(MARS_LAYERS);

export function marsLayerAt(y) {
  return LAYER_IDS.find((id) => y <= MARS_LAYERS[id].bottom) ?? 'marscore';
}
export const marsHostAt = (y) => MARS_HOST[marsLayerAt(Math.max(1, y))];

export function generateMars(seed, { roverEgg = true } = {}) {
  const rng = createRng((seed ^ 0x4d415253) >>> 0);
  const H = MARS_H;
  const gen = createPlanetGen({ rng, H, layers: MARS_LAYERS, hosts: MARS_HOST });
  const { grid, inner, inLayer, free, takeSpots } = gen;

  gen.veins(MARS_GEN.ores, ORE_BLOCK, { dunes: 2 });
  gen.allCaves(MARS_GEN.caves, { dunes: 2 });

  // soft dips in the dunes at the surface
  for (let i = 0; i < 4; i++) {
    const cx = rng.int(4, MINE_W - 5);
    if (Math.abs(cx - SHAFT_X) < 4) continue;
    const r = rng.int(2, 4);
    for (let x = cx - r; x <= cx + r; x++) {
      const depth = Math.round(Math.sqrt(r * r - (x - cx) ** 2) * 0.5);
      for (let y = 0; y < depth; y++) if (inner(x, y) || y === 0) grid.set(x, y, B.AIR);
    }
  }

  // the Mars Heart: a 3x3 gem in a chamber at the very bottom
  const heart = gen.heart(B.MARS_HEART, B.MARS_CORE, 'mars');

  // vaults in the Martian City: a sealed room of vault wall with a door that
  // faces the middle of the mine, a short passage out to a glyph button, and
  // a chest inside. One in the top half of the layer (left), one lower (right).
  const vaults = [];
  const { top: rTop, bottom: rBottom } = MARS_LAYERS.ruins;
  for (let i = 0; i < MARS_GEN.vaults; i++) {
    const left = i % 2 === 0;
    const x0 = left ? rng.int(2, 10) : rng.int(MINE_W - 19, MINE_W - 9);
    const half = Math.floor((rBottom - rTop) / 2);
    const y0 = i < 2
      ? rng.int(rTop + 2 + (i ? half : 0), rTop + (i ? rBottom - rTop - 6 : half - 6))
      : rng.int(rTop + 2, rBottom - 6);
    // the room: a ring of wall around air
    for (let y = y0; y <= y0 + 4; y++) {
      for (let x = x0; x <= x0 + 6; x++) {
        const ring = y === y0 || y === y0 + 4 || x === x0 || x === x0 + 6;
        grid.set(x, y, ring ? B.VAULT : B.AIR);
      }
    }
    const dx = left ? 1 : -1;
    const xd = left ? x0 + 6 : x0;
    const door = [{ x: xd, y: y0 + 2 }, { x: xd, y: y0 + 3 }];
    for (const d of door) grid.set(d.x, d.y, B.VAULT_DOOR);
    // the passage out, with a floor under it, and the button at its end
    for (let k = 1; k <= 4; k++) {
      const x = xd + dx * k;
      grid.set(x, y0 + 1, isSolid(grid.get(x, y0 + 1)) ? grid.get(x, y0 + 1) : B.RUIN_STONE);
      grid.set(x, y0 + 2, B.AIR);
      grid.set(x, y0 + 3, B.AIR);
      if (!isSolid(grid.get(x, y0 + 4))) grid.set(x, y0 + 4, B.RUIN_STONE);
    }
    const glyph = { x: xd + dx * 4, y: y0 + 3 };
    grid.set(glyph.x, glyph.y, B.GLYPH);
    // the treasure: a chest at the far end of the room
    const chest = { x: left ? x0 + 1 : x0 + 5, y: y0 + 3 };
    grid.set(chest.x, chest.y, B.CHEST);
    vaults.push({ x0, y0, door, glyph, chest });
  }

  const chests = [...gen.chests(MARS_GEN.chests), ...vaults.map((v) => v.chest)];

  // lava pools on volcano cave floors (static, never spreads)
  const lavaSpots = inLayer('volcano');
  for (let i = 0; i < MARS_GEN.lavaPools && lavaSpots.length; i++) {
    const start = rng.pick(lavaSpots);
    const width = rng.int(2, 4);
    for (let k = 0; k < width; k++) {
      const x = start.x + k;
      if (grid.get(x, start.y) === B.AIR && isSolid(grid.get(x, start.y + 1))) grid.set(x, start.y, B.LAVA);
    }
  }

  // a floor spot away from lava, with air above
  const clear = (c) => grid.get(c.x, c.y - 1) === B.AIR && [-1, 1].every((d) => grid.get(c.x + d, c.y) !== B.LAVA);

  // steam geysers: vents on volcano floors
  const geysers = takeSpots(inLayer('volcano'), MARS_GEN.geysers, 6, clear);
  for (const g of geysers) grid.set(g.x, g.y, B.GEYSER);

  // old rovers: three floor cells in a row, with room above (carve a nook if the caves gave none)
  const roverOk = (c) => [0, 1, 2].every((d) => free({ x: c.x + d, y: c.y }) && grid.get(c.x + d, c.y - 1) === B.AIR);
  const rovers = [];
  const { top: vTop, bottom: vBottom } = MARS_LAYERS.rovers;
  for (let i = 0; i < MARS_GEN.rovers; i++) {
    const spots = inLayer('rovers').filter((c) => roverOk(c) && rovers.every((r) => Math.abs(r.x - c.x) + Math.abs(r.y - c.y) >= 10));
    let spot = spots.length ? rng.pick(spots) : null;
    if (!spot) {
      const x = rng.int(3, MINE_W - 7);
      const y = rng.int(vTop + 4, vBottom - 2);
      for (let yy = y - 2; yy <= y; yy++) for (let xx = x - 1; xx <= x + 3; xx++) grid.set(xx, yy, B.AIR);
      for (let xx = x - 1; xx <= x + 3; xx++) grid.set(xx, y + 1, B.RUST_ROCK);
      spot = { x, y };
    }
    grid.set(spot.x + 1, spot.y, B.OLD_ROVER);
    rovers.push({ x: spot.x, y: spot.y });
  }

  // the Rover Bot's egg on a graveyard floor
  const eggs = roverEgg ? takeSpots(inLayer('rovers'), 1, 0, clear).map((c) => ({ ...c, kind: 'rover' })) : [];
  for (const e of eggs) grid.set(e.x, e.y, B.EGG);

  // decorations: little things growing on cave floors and ceilings
  const decor = gen.decor(DECOR);

  return {
    grid, chests, decor, eggs, bigChest: null, boulders: [], fossils: [], heart, teleports: [], ufo: null, chimes: [],
    geysers, rovers, vaults, ducks: [], cushions: [], hostAt: marsHostAt, layerAt: marsLayerAt,
    spawn: { x: SHAFT_X, y: -1 }, seed, planet: 'mars',
  };
}
