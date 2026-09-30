// seed → the Moon: five layers under the grey craters. Crater Plains
// (moonstone), the Cheese Caves (cheese, cheese wheels to roll), the Crystal
// Caves (space gems, singing crystals, the Moon Pup's egg), the Alien Base
// (gizmos, teleport pads, a crashed UFO) and the Moon Core with the Moon
// Heart at the very bottom, and the Skate Park right beside it. Same shape as a mine, so MineScene digs it with
// the same engine.

import { createRng } from './rng.js';
import { B } from './blocks.js';
import { createPlanetGen } from './planetgen.js';
import { MINE_W, SHAFT_X, MOON_H, MOON_LAYERS, MOON_GEN } from '../tuning.js';

export const MOON_HOST = {
  craters: B.MOONROCK, cheesecaves: B.CHEESE_ROCK, mooncrystal: B.MOON_CRYSTAL, alienbase: B.ALIEN_PANEL, mooncore: B.MOON_CORE,
};
const ORE_BLOCK = { moonstone: B.MOONSTONE, cheese: B.CHEESE, spacegem: B.SPACE_GEM, gizmo: B.GIZMO };
const DECOR = {
  craters: { floorChance: 0.22, floor: { pebbles: 2, spacecrystal: 1 }, ceilChance: 0.1, ceil: { stalactite: 1 } },
  cheesecaves: { floorChance: 0.35, floor: { crumbs: 3, mousehole: 1 }, ceilChance: 0.2, ceil: { cheesedrip: 1 } },
  mooncrystal: { floorChance: 0.4, floor: { spacecrystal: 3, pebbles: 1 }, ceilChance: 0.2, ceil: { crystalspike: 1 } },
  alienbase: { floorChance: 0.3, floor: { antenna: 2, blinker: 2 }, ceilChance: 0.2, ceil: { cable: 1 } },
  mooncore: { floorChance: 0.35, floor: { starflower: 2, spacecrystal: 1 }, ceilChance: 0.15, ceil: { stalactite: 1 } },
};
const LAYER_IDS = Object.keys(MOON_LAYERS);

export function moonLayerAt(y) {
  return LAYER_IDS.find((id) => y <= MOON_LAYERS[id].bottom) ?? 'mooncore';
}
export const moonHostAt = (y) => MOON_HOST[moonLayerAt(Math.max(1, y))];

export function generateMoon(seed, { pupEgg = true } = {}) {
  const rng = createRng((seed ^ 0x4d4f4f4e) >>> 0);
  const H = MOON_H;
  const gen = createPlanetGen({ rng, H, layers: MOON_LAYERS, hosts: MOON_HOST });
  const { grid, inner, inLayer, free, takeSpots } = gen;

  gen.veins(MOON_GEN.ores, ORE_BLOCK, { craters: 2 });
  gen.allCaves(MOON_GEN.caves, { craters: 2 });

  // craters on the surface: shallow bowls in the top rows
  for (let i = 0; i < 5; i++) {
    const cx = rng.int(4, MINE_W - 5);
    if (Math.abs(cx - SHAFT_X) < 4) continue;
    const r = rng.int(2, 3);
    for (let x = cx - r; x <= cx + r; x++) {
      const depth = Math.round(Math.sqrt(r * r - (x - cx) ** 2) * 0.6);
      for (let y = 0; y < depth; y++) if (inner(x, y) || y === 0) grid.set(x, y, B.AIR);
    }
  }

  // the Moon Heart: a 3x3 gem in a chamber at the very bottom
  const heart = gen.heart(B.MOON_HEART, B.MOON_CORE, 'moon');

  const chests = gen.chests(MOON_GEN.chests);

  // meteorites buried in the crater rock
  for (let i = 0, tries = 0; i < MOON_GEN.meteorites && tries < 300; tries++) {
    const x = rng.int(2, MINE_W - 3);
    const y = rng.int(MOON_LAYERS.craters.top + 4, MOON_LAYERS.craters.bottom);
    if (grid.get(x, y) !== B.MOONROCK) continue;
    grid.set(x, y, B.METEORITE);
    i++;
  }

  // cheese wheels: in pairs on a cave floor, so you can roll them together
  const boulders = [];
  const wheelSpots = inLayer('cheesecaves');
  for (let attempt = 0; boulders.length < MOON_GEN.wheels && attempt < 400 && wheelSpots.length; attempt++) {
    const c = rng.pick(wheelSpots);
    const gap = rng.int(3, 4);
    const run = Array.from({ length: gap + 1 }, (_, i) => ({ x: c.x + i, y: c.y }));
    if (!run.every(free)) continue;
    if (!free({ x: c.x - 1, y: c.y }) && !free({ x: c.x + gap + 1, y: c.y })) continue; // room to push from
    if (boulders.some((o) => Math.abs(o.x - c.x) + Math.abs(o.y - c.y) < 8)) continue;
    for (const x of [c.x, c.x + gap]) {
      grid.set(x, c.y, B.CHEESE_WHEEL);
      boulders.push({ x, y: c.y });
    }
  }

  // the Moon Pup's egg on a crystal-cave floor
  const eggs = pupEgg ? takeSpots(inLayer('mooncrystal'), 1, 0).map((c) => ({ ...c, kind: 'moonpup' })) : [];
  for (const e of eggs) grid.set(e.x, e.y, B.EGG);

  // singing crystals (big ones that chime a note as you pass)
  const chimes = takeSpots(inLayer('mooncrystal'), MOON_GEN.chimes, 6);

  // the crashed UFO: three floor cells in a row, with room above
  let ufo = null;
  const ufoSpots = inLayer('alienbase').filter((c) => [0, 1, 2].every((dx) => free({ x: c.x + dx, y: c.y }) && grid.get(c.x + dx, c.y - 1) === B.AIR));
  if (ufoSpots.length) {
    ufo = rng.pick(ufoSpots);
    grid.set(ufo.x + 1, ufo.y, B.UFO);
  }

  // teleport pads: pairs of floor cells, far apart
  const teleports = [];
  const padOk = (c) => grid.get(c.x, c.y - 1) === B.AIR && !(ufo && c.y === ufo.y && c.x >= ufo.x - 1 && c.x <= ufo.x + 3);
  const padSpots = inLayer('alienbase').filter(padOk);
  for (let attempt = 0; teleports.length < MOON_GEN.teleports && attempt < 300 && padSpots.length; attempt++) {
    const a = rng.pick(padSpots);
    const b = rng.pick(padSpots);
    if (!free(a) || !free(b) || !padOk(a) || !padOk(b)) continue;
    if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) < 12) continue;
    const used = teleports.flatMap((t) => [t.a, t.b]);
    if (used.some((u) => Math.abs(u.x - a.x) + Math.abs(u.y - a.y) < 4 || Math.abs(u.x - b.x) + Math.abs(u.y - b.y) < 4)) continue;
    grid.set(a.x, a.y, B.TELEPORT);
    grid.set(b.x, b.y, B.TELEPORT);
    teleports.push({ a: { x: a.x, y: a.y }, b: { x: b.x, y: b.y } });
  }

  // the Skate Park: a big room right of the Moon Heart's chamber (it opens
  // into it), with a flat floor for the half pipe; nothing else goes in it
  const { room: skatepark, inside: inPark } = gen.bonusRoom(B.MOON_CORE, 15);

  // decorations: little things growing on cave floors and ceilings
  const decor = gen.decor(DECOR, new Set(chimes.map((c) => `${c.x},${c.y}`))).filter((d) => !inPark(d));

  return {
    grid, chests: chests.filter((c) => !inPark(c)), decor, eggs, bigChest: null, boulders, fossils: [], heart, teleports, ufo, chimes,
    ducks: [], cushions: [], skatepark, hostAt: moonHostAt, layerAt: moonLayerAt,
    spawn: { x: SHAFT_X, y: -1 }, seed, moon: true, planet: 'moon',
  };
}
