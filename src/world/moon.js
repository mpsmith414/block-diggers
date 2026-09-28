// seed → the Moon: five layers under the grey craters. Crater Plains
// (moonstone), the Cheese Caves (cheese, cheese wheels to roll), the Crystal
// Caves (space gems, singing crystals, the Moon Pup's egg), the Alien Base
// (gizmos, teleport pads, a crashed UFO) and the Moon Core with the Moon
// Heart at the very bottom. Same shape as a mine, so MineScene digs it with
// the same engine.

import { createRng } from './rng.js';
import { createGrid } from './grid.js';
import { B, isSolid } from './blocks.js';
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
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const LAYER_IDS = Object.keys(MOON_LAYERS);

export function moonLayerAt(y) {
  return LAYER_IDS.find((id) => y <= MOON_LAYERS[id].bottom) ?? 'mooncore';
}
export const moonHostAt = (y) => MOON_HOST[moonLayerAt(Math.max(1, y))];

export function generateMoon(seed, { pupEgg = true } = {}) {
  const rng = createRng((seed ^ 0x4d4f4f4e) >>> 0);
  const H = MOON_H;
  const grid = createGrid(MINE_W, H);
  const inner = (x, y) => x >= 1 && x <= MINE_W - 2 && y >= 1 && y <= H - 2;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < MINE_W; x++) {
      grid.set(x, y, x === 0 || x === MINE_W - 1 || y === H - 1 ? B.BEDROCK : moonHostAt(y));
    }
  }

  // veins: a random walk that only replaces the layer's own rock
  const blob = (layer, id, size) => {
    const { top, bottom } = MOON_LAYERS[layer];
    const host = MOON_HOST[layer];
    let x = rng.int(1, MINE_W - 2);
    let y = rng.int(top + (layer === 'craters' ? 2 : 0), bottom);
    for (let i = 0; i < size; i++) {
      if (grid.get(x, y) === host) grid.set(x, y, id);
      const [dx, dy] = rng.pick(DIRS);
      if (inner(x + dx, y + dy) && y + dy >= top && y + dy <= bottom) { x += dx; y += dy; }
    }
  };
  for (const layer of LAYER_IDS) {
    const { veins, weights } = MOON_GEN.ores[layer];
    for (let i = 0; i < veins; i++) blob(layer, ORE_BLOCK[rng.weighted(weights)], rng.int(3, 6));
  }

  // caves: a wandering round brush, staying inside its layer
  const caves = ({ top, bottom }, { count, radius, length }) => {
    const yMin = top + Math.ceil(radius) + 1;
    const yMax = bottom - Math.ceil(radius) - 1;
    for (let c = 0; c < count; c++) {
      let x = rng.int(3, MINE_W - 4);
      let y = rng.int(yMin, yMax);
      let angle = rng.next() * Math.PI * 2;
      const steps = rng.int(length[0], length[1]);
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
  };
  for (const layer of LAYER_IDS) {
    const l = MOON_LAYERS[layer];
    caves({ top: layer === 'craters' ? l.top + 2 : l.top, bottom: l.bottom }, MOON_GEN.caves[layer]);
  }

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
  const hx = Math.floor(MINE_W / 2) - 1;
  const hy = H - 5;
  for (let y = hy - 3; y <= H - 2; y++) for (let x = hx - 4; x <= hx + 6; x++) grid.set(x, y, B.AIR);
  for (let x = hx - 4; x <= hx + 6; x++) grid.set(x, H - 2, B.MOON_CORE);
  for (let y = hy; y <= hy + 2; y++) for (let x = hx; x <= hx + 2; x++) grid.set(x, y, B.MOON_HEART);
  const heart = { x: hx, y: hy, kind: 'moon' };

  // cave floors: open cells with rock underneath (not bedrock)
  const floors = (top, bottom) => {
    const out = [];
    for (let y = Math.max(2, top); y <= bottom; y++) {
      for (let x = 2; x < MINE_W - 2; x++) {
        if (grid.get(x, y) === B.AIR && isSolid(grid.get(x, y + 1)) && grid.get(x, y + 1) !== B.BEDROCK) out.push({ x, y });
      }
    }
    return out;
  };
  const inLayer = (layer) => floors(MOON_LAYERS[layer].top, MOON_LAYERS[layer].bottom - (layer === 'mooncore' ? 10 : 0));
  const free = (c) => grid.get(c.x, c.y) === B.AIR && isSolid(grid.get(c.x, c.y + 1));
  const takeSpots = (list, n, minGap, ok = () => true) => {
    const out = [];
    for (let attempt = 0; out.length < n && attempt < 400 && list.length; attempt++) {
      const c = rng.pick(list);
      if (!free(c) || !ok(c)) continue;
      if (out.every((o) => Math.abs(o.y - c.y) + Math.abs(o.x - c.x) >= minGap)) out.push(c);
    }
    return out;
  };

  // chests: one or two in every layer
  const chests = [];
  for (const layer of LAYER_IDS) {
    for (const c of takeSpots(inLayer(layer), MOON_GEN.chests[layer], 12)) {
      grid.set(c.x, c.y, B.CHEST);
      chests.push(c);
    }
  }

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

  // decorations: little things growing on cave floors and ceilings
  const taken = new Set(chimes.map((c) => `${c.x},${c.y}`));
  const decor = [];
  for (let y = 2; y < H - 1; y++) {
    const kinds = DECOR[moonLayerAt(y)];
    for (let x = 1; x < MINE_W - 1; x++) {
      if (grid.get(x, y) !== B.AIR || taken.has(`${x},${y}`)) continue;
      const below = grid.get(x, y + 1);
      const above = grid.get(x, y - 1);
      if (isSolid(below) && below !== B.BEDROCK && rng.chance(kinds.floorChance)) {
        decor.push({ x, y, on: 'floor', kind: rng.weighted(kinds.floor), v: rng.int(0, 2) });
      } else if (isSolid(above) && above !== B.BEDROCK && rng.chance(kinds.ceilChance)) {
        decor.push({ x, y, on: 'ceil', kind: rng.weighted(kinds.ceil), v: rng.int(0, 2) });
      }
    }
  }

  return {
    grid, chests, decor, eggs, bigChest: null, boulders, fossils: [], heart, teleports, ufo, chimes,
    ducks: [], cushions: [], hostAt: moonHostAt, layerAt: moonLayerAt,
    spawn: { x: SHAFT_X, y: -1 }, seed, moon: true, planet: 'moon',
  };
}
