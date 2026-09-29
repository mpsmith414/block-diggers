// seed → Dino Planet: five layers under the jungle. The Fern Jungle (jade,
// friendly parasaurs to ride), the Bone Beds (dino bones, nests of hatching
// eggs, the Longneck's egg), the Swamp (T-rex teeth, pools, a giant T-rex
// skull), the Lava Lands (obsidian, lava, a sleeping stegosaurus) and the
// Dino Core with the Dino Heart at the very bottom.

import { createRng } from './rng.js';
import { B, isSolid } from './blocks.js';
import { createPlanetGen } from './planetgen.js';
import { MINE_W, SHAFT_X, DINO_H, DINO_LAYERS, DINO_GEN } from '../tuning.js';

export const DINO_HOST = {
  jungle: B.JUNGLE_SOIL, bonebeds: B.FOSSIL_ROCK, swamp: B.SWAMP_MUD, lavalands: B.VOLCANIC, dinocore: B.DINO_CORE,
};
const ORE_BLOCK = { jade: B.JADE, bone: B.BONE, tooth: B.TOOTH, obsidian: B.OBSIDIAN };
const DECOR = {
  jungle: { floorChance: 0.4, floor: { fern: 3, flower: 1 }, ceilChance: 0.25, ceil: { vine: 1 } },
  bonebeds: { floorChance: 0.3, floor: { bonepile: 2, pebbles: 1 }, ceilChance: 0.15, ceil: { roots: 1 } },
  swamp: { floorChance: 0.4, floor: { reed: 2, mushroom: 1 }, ceilChance: 0.25, ceil: { vine: 1 } },
  lavalands: { floorChance: 0.3, floor: { emberflower: 2, pebbles: 1 }, ceilChance: 0.15, ceil: { stalactite: 1 } },
  dinocore: { floorChance: 0.35, floor: { ambercrystal: 2, fern: 1 }, ceilChance: 0.15, ceil: { stalactite: 1 } },
};
const LAYER_IDS = Object.keys(DINO_LAYERS);

export function dinoLayerAt(y) {
  return LAYER_IDS.find((id) => y <= DINO_LAYERS[id].bottom) ?? 'dinocore';
}
export const dinoHostAt = (y) => DINO_HOST[dinoLayerAt(Math.max(1, y))];

export function generateDino(seed, { longneckEgg = true } = {}) {
  const rng = createRng((seed ^ 0x44494e4f) >>> 0);
  const H = DINO_H;
  const gen = createPlanetGen({ rng, H, layers: DINO_LAYERS, hosts: DINO_HOST });
  const { grid, inLayer, free, takeSpots } = gen;

  gen.veins(DINO_GEN.ores, ORE_BLOCK, { jungle: 2 });
  gen.allCaves(DINO_GEN.caves, { jungle: 2 });

  const heart = gen.heart(B.DINO_HEART, B.DINO_CORE, 'dino');
  const chests = gen.chests(DINO_GEN.chests);

  // pools on cave floors: swamp water, and lava in the lava lands (static)
  const pools = (layer, block, n) => {
    const spots = inLayer(layer);
    for (let i = 0; i < n && spots.length; i++) {
      const start = rng.pick(spots);
      const width = rng.int(2, 4);
      for (let k = 0; k < width; k++) {
        const x = start.x + k;
        if (grid.get(x, start.y) === B.AIR && isSolid(grid.get(x, start.y + 1))) grid.set(x, start.y, block);
      }
    }
  };
  pools('swamp', B.WATER, DINO_GEN.pools);
  pools('lavalands', B.LAVA, DINO_GEN.lavaPools);

  // three floor cells in a row with two rows of room above (carve a nook if the caves gave none)
  const clearAt = (x, y) => grid.get(x, y) === B.AIR;
  const roomy = (c) => [0, 1, 2].every((d) => free({ x: c.x + d, y: c.y }) && clearAt(c.x + d, c.y - 1) && clearAt(c.x + d, c.y - 2)
    && [-1, 3].every((e) => grid.get(c.x + e, c.y) !== B.LAVA && grid.get(c.x + e, c.y) !== B.WATER));
  const nook = (layer) => {
    const { top, bottom } = DINO_LAYERS[layer];
    const x = rng.int(3, MINE_W - 7);
    const y = rng.int(top + 5, bottom - 2);
    for (let yy = y - 3; yy <= y; yy++) for (let xx = x - 1; xx <= x + 3; xx++) grid.set(xx, yy, B.AIR);
    for (let xx = x - 1; xx <= x + 3; xx++) grid.set(xx, y + 1, DINO_HOST[layer]);
    return { x, y };
  };
  const taken = [];
  const place = (layer, block) => {
    const spots = inLayer(layer).filter((c) => roomy(c) && taken.every((t) => Math.abs(t.x - c.x) + Math.abs(t.y - c.y) >= 10));
    const spot = spots.length ? rng.pick(spots) : nook(layer);
    grid.set(spot.x + 1, spot.y, block);
    const at = { x: spot.x, y: spot.y };
    taken.push(at);
    return at;
  };

  const parasaurs = Array.from({ length: DINO_GEN.parasaurs }, () => place('jungle', B.PARASAUR));
  const nests = Array.from({ length: DINO_GEN.nests }, () => place('bonebeds', B.NEST));
  const skull = place('swamp', B.REX_SKULL);
  const stego = place('lavalands', B.STEGO);

  // the Longneck's egg on a bone-bed floor
  const eggs = longneckEgg ? takeSpots(inLayer('bonebeds'), 1, 0).map((c) => ({ ...c, kind: 'longneck' })) : [];
  for (const e of eggs) grid.set(e.x, e.y, B.EGG);

  const decor = gen.decor(DECOR);

  return {
    grid, chests, decor, eggs, bigChest: null, boulders: [], fossils: [], heart, teleports: [], ufo: null, chimes: [],
    geysers: [], rovers: [], vaults: [], globes: [], comet: null, parasaurs, nests, skull, stego,
    ducks: [], cushions: [], hostAt: dinoHostAt, layerAt: dinoLayerAt, spawn: { x: SHAFT_X, y: -1 }, seed, planet: 'dino',
  };
}
