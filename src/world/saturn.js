// seed → Saturn: five layers down through its icy rings. The Frozen Rings
// (frost gems, slippery ice, snowballs to roll into snowmen), the Ice Cream
// Caves (ice cream), the Aurora Caverns (ring pearls, snow globes, the Yeti
// Cub's egg), the Comet Cave (comet chunks, a frozen comet) and the Saturn
// Core with the Saturn Heart at the very bottom.

import { createRng } from './rng.js';
import { B } from './blocks.js';
import { createPlanetGen } from './planetgen.js';
import { MINE_W, SHAFT_X, SATURN_H, SATURN_LAYERS, SATURN_GEN } from '../tuning.js';

export const SATURN_HOST = {
  rings: B.ICE, icecream: B.SOFTSERVE, aurora: B.AURORA_ROCK, comets: B.COMET_ROCK, saturncore: B.SATURN_CORE,
};
const ORE_BLOCK = { frost: B.FROST, icecream: B.ICECREAM, pearl: B.PEARL, comet: B.COMET };
const DECOR = {
  rings: { floorChance: 0.25, floor: { snowdrift: 2, icecrystal: 1 }, ceilChance: 0.2, ceil: { icicle: 1 } },
  icecream: { floorChance: 0.35, floor: { sprinkles: 3, cone: 1 }, ceilChance: 0.2, ceil: { icedrip: 1 } },
  aurora: { floorChance: 0.35, floor: { auroracrystal: 3, snowdrift: 1 }, ceilChance: 0.2, ceil: { icicle: 1 } },
  comets: { floorChance: 0.25, floor: { pebbles: 2, icecrystal: 1 }, ceilChance: 0.15, ceil: { icicle: 1 } },
  saturncore: { floorChance: 0.35, floor: { starflower: 2, icecrystal: 1 }, ceilChance: 0.15, ceil: { icicle: 1 } },
};
const LAYER_IDS = Object.keys(SATURN_LAYERS);

export function saturnLayerAt(y) {
  return LAYER_IDS.find((id) => y <= SATURN_LAYERS[id].bottom) ?? 'saturncore';
}
export const saturnHostAt = (y) => SATURN_HOST[saturnLayerAt(Math.max(1, y))];

export function generateSaturn(seed, { yetiEgg = true } = {}) {
  const rng = createRng((seed ^ 0x53415455) >>> 0);
  const H = SATURN_H;
  const gen = createPlanetGen({ rng, H, layers: SATURN_LAYERS, hosts: SATURN_HOST });
  const { grid, inLayer, free, takeSpots } = gen;

  gen.veins(SATURN_GEN.ores, ORE_BLOCK, { rings: 2 });
  gen.allCaves(SATURN_GEN.caves, { rings: 2 });

  const heart = gen.heart(B.SATURN_HEART, B.SATURN_CORE, 'saturn');
  const chests = gen.chests(SATURN_GEN.chests);

  // snowballs: in pairs on a ring-ice floor, so you can roll them into a snowman
  const boulders = [];
  const ballSpots = inLayer('rings');
  for (let attempt = 0; boulders.length < SATURN_GEN.snowballs && attempt < 400 && ballSpots.length; attempt++) {
    const c = rng.pick(ballSpots);
    const gap = rng.int(3, 4);
    const run = Array.from({ length: gap + 1 }, (_, i) => ({ x: c.x + i, y: c.y }));
    if (!run.every(free)) continue;
    if (!free({ x: c.x - 1, y: c.y }) && !free({ x: c.x + gap + 1, y: c.y })) continue; // room to push from
    if (boulders.some((o) => Math.abs(o.x - c.x) + Math.abs(o.y - c.y) < 8)) continue;
    for (const x of [c.x, c.x + gap]) {
      grid.set(x, c.y, B.SNOWBALL);
      boulders.push({ x, y: c.y });
    }
  }

  // three floor cells in a row with room above (carve a nook if the caves gave none)
  const roomy = (c) => [0, 1, 2].every((d) => free({ x: c.x + d, y: c.y }) && grid.get(c.x + d, c.y - 1) === B.AIR);
  const nook = (layer, host) => {
    const { top, bottom } = SATURN_LAYERS[layer];
    const x = rng.int(3, MINE_W - 7);
    const y = rng.int(top + 4, bottom - 2);
    for (let yy = y - 2; yy <= y; yy++) for (let xx = x - 1; xx <= x + 3; xx++) grid.set(xx, yy, B.AIR);
    for (let xx = x - 1; xx <= x + 3; xx++) grid.set(xx, y + 1, host);
    return { x, y };
  };
  const place = (layer, block, taken) => {
    const spots = inLayer(layer).filter((c) => roomy(c) && taken.every((t) => Math.abs(t.x - c.x) + Math.abs(t.y - c.y) >= 10));
    const spot = spots.length ? rng.pick(spots) : nook(layer, SATURN_HOST[layer]);
    grid.set(spot.x + 1, spot.y, block);
    return { x: spot.x, y: spot.y };
  };

  // snow globes in the aurora caverns, and the frozen comet in the comet cave
  const globes = [];
  for (let i = 0; i < SATURN_GEN.globes; i++) globes.push(place('aurora', B.SNOW_GLOBE, globes));
  const comet = place('comets', B.FROZEN_COMET, []);

  // the Yeti Cub's egg on an aurora-cavern floor
  const eggs = yetiEgg ? takeSpots(inLayer('aurora'), 1, 0).map((c) => ({ ...c, kind: 'yeti' })) : [];
  for (const e of eggs) grid.set(e.x, e.y, B.EGG);

  const decor = gen.decor(DECOR);

  return {
    grid, chests, decor, eggs, bigChest: null, boulders, fossils: [], heart, teleports: [], ufo: null, chimes: [],
    geysers: [], rovers: [], vaults: [], globes, comet, ducks: [], cushions: [], hostAt: saturnHostAt, layerAt: saturnLayerAt,
    spawn: { x: SHAFT_X, y: -1 }, seed, planet: 'saturn',
  };
}
