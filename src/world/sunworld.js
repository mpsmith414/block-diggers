// seed → the Sun: six layers of blazing rock. The Corona (sunstone), the
// Sunspots (flare gems, fire flowers), the Plasma Sea (plasma orbs, lava
// lakes), the Radiance (nova gems, the Sun Dragon's egg), the Fusion Forge
// (every ore, the Solar Forge) and the Sun Core with the Sun's Heart at the
// very bottom.

import { createRng } from './rng.js';
import { B, isSolid } from './blocks.js';
import { createPlanetGen } from './planetgen.js';
import { MINE_W, SHAFT_X, SUN_H, SUN_LAYERS, SUN_GEN } from '../tuning.js';

export const SUN_HOST = {
  corona: B.CORONA_ROCK, sunspots: B.SUNSPOT_ROCK, plasmasea: B.PLASMA_ROCK, radiance: B.RADIANT_ROCK, fusion: B.FUSION_ROCK, suncore: B.SUN_CORE,
};
const ORE_BLOCK = { sunstone: B.SUNSTONE, flare: B.FLARE, plasma: B.PLASMA, nova: B.NOVA };
const DECOR = {
  corona: { floorChance: 0.3, floor: { emberflower: 2, firecrystal: 1 }, ceilChance: 0.15, ceil: { stalactite: 1 } },
  sunspots: { floorChance: 0.25, floor: { pebbles: 2, emberflower: 1 }, ceilChance: 0.12, ceil: { stalactite: 1 } },
  plasmasea: { floorChance: 0.3, floor: { firecrystal: 2, pebbles: 1 }, ceilChance: 0.15, ceil: { stalactite: 1 } },
  radiance: { floorChance: 0.4, floor: { suncrystal: 3, starflower: 1 }, ceilChance: 0.2, ceil: { crystalspike: 1 } },
  fusion: { floorChance: 0.3, floor: { firecrystal: 2, suncrystal: 1 }, ceilChance: 0.15, ceil: { stalactite: 1 } },
  suncore: { floorChance: 0.35, floor: { suncrystal: 2, starflower: 1 }, ceilChance: 0.15, ceil: { crystalspike: 1 } },
};
const LAYER_IDS = Object.keys(SUN_LAYERS);

export function sunLayerAt(y) {
  return LAYER_IDS.find((id) => y <= SUN_LAYERS[id].bottom) ?? 'suncore';
}
export const sunHostAt = (y) => SUN_HOST[sunLayerAt(Math.max(1, y))];

export function generateSun(seed, { dragonEgg = true } = {}) {
  const rng = createRng((seed ^ 0x53554e21) >>> 0);
  const H = SUN_H;
  const gen = createPlanetGen({ rng, H, layers: SUN_LAYERS, hosts: SUN_HOST });
  const { grid, inLayer, free, takeSpots } = gen;

  gen.veins(SUN_GEN.ores, ORE_BLOCK, { corona: 2 });
  gen.allCaves(SUN_GEN.caves, { corona: 2 });

  const heart = gen.heart(B.SUN_HEART, B.SUN_CORE, 'sun');
  const chests = gen.chests(SUN_GEN.chests);

  // lava lakes on plasma-sea floors (you're a lava monster here: drop right through)
  const lavaSpots = inLayer('plasmasea');
  for (let i = 0; i < SUN_GEN.lavaPools && lavaSpots.length; i++) {
    const start = rng.pick(lavaSpots);
    const width = rng.int(3, 6);
    for (let k = 0; k < width; k++) {
      const x = start.x + k;
      if (grid.get(x, start.y) === B.AIR && isSolid(grid.get(x, start.y + 1))) grid.set(x, start.y, B.LAVA);
    }
  }

  // three floor cells in a row with room above (carve a nook if the caves gave none)
  const clearAt = (x, y) => grid.get(x, y) === B.AIR;
  const roomy = (c) => [0, 1, 2].every((d) => free({ x: c.x + d, y: c.y }) && clearAt(c.x + d, c.y - 1))
    && [-1, 3].every((e) => grid.get(c.x + e, c.y) !== B.LAVA);
  const nook = (layer) => {
    const { top, bottom } = SUN_LAYERS[layer];
    const x = rng.int(3, MINE_W - 7);
    const y = rng.int(top + 5, bottom - 2);
    for (let yy = y - 2; yy <= y; yy++) for (let xx = x - 1; xx <= x + 3; xx++) grid.set(xx, yy, B.AIR);
    for (let xx = x - 1; xx <= x + 3; xx++) grid.set(xx, y + 1, SUN_HOST[layer]);
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
  const flowers = Array.from({ length: SUN_GEN.flowers }, () => place('sunspots', B.FIRE_FLOWER));
  const forge = place('fusion', B.FORGE);

  // the Baby Sun Dragon's egg on a radiance floor
  const eggs = dragonEgg ? takeSpots(inLayer('radiance'), 1, 0).map((c) => ({ ...c, kind: 'sundragon' })) : [];
  for (const e of eggs) grid.set(e.x, e.y, B.EGG);

  const decor = gen.decor(DECOR);

  return {
    grid, chests, decor, eggs, bigChest: null, boulders: [], fossils: [], heart, teleports: [], ufo: null, chimes: [],
    geysers: [], rovers: [], vaults: [], globes: [], comet: null, parasaurs: [], nests: [], skull: null, stego: null,
    flowers, forge, ducks: [], cushions: [], hostAt: sunHostAt, layerAt: sunLayerAt, spawn: { x: SHAFT_X, y: -1 }, seed, planet: 'sun',
  };
}
