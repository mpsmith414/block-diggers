// The building blocks every planet's generator shares: a grid of layered host
// rock, ore veins, wandering caves, cave floors, spread-out spots, the 3x3
// Heart at the very bottom, and little decorations. Each planet's generator
// (moon.js, mars.js) calls these in its own order with its own seed.

import { createGrid } from './grid.js';
import { B, isSolid } from './blocks.js';
import { MINE_W } from '../tuning.js';

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function createPlanetGen({ rng, H, layers, hosts }) {
  const ids = Object.keys(layers);
  const layerAt = (y) => ids.find((id) => y <= layers[id].bottom) ?? ids[ids.length - 1];
  const hostAt = (y) => hosts[layerAt(Math.max(1, y))];
  const grid = createGrid(MINE_W, H);
  const inner = (x, y) => x >= 1 && x <= MINE_W - 2 && y >= 1 && y <= H - 2;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < MINE_W; x++) {
      grid.set(x, y, x === 0 || x === MINE_W - 1 || y === H - 1 ? B.BEDROCK : hostAt(y));
    }
  }

  // veins: a random walk that only replaces the layer's own rock
  const blob = (layer, id, size, skipTop = 0) => {
    const { top, bottom } = layers[layer];
    const host = hosts[layer];
    let x = rng.int(1, MINE_W - 2);
    let y = rng.int(top + skipTop, bottom);
    for (let i = 0; i < size; i++) {
      if (grid.get(x, y) === host) grid.set(x, y, id);
      const [dx, dy] = rng.pick(DIRS);
      if (inner(x + dx, y + dy) && y + dy >= top && y + dy <= bottom) { x += dx; y += dy; }
    }
  };
  // every layer's veins, from { layer: { veins, weights } } and ore → block
  const veins = (ores, oreBlock, skipTop = {}) => {
    for (const layer of ids) {
      const { veins: n, weights } = ores[layer];
      for (let i = 0; i < n; i++) blob(layer, oreBlock[rng.weighted(weights)], rng.int(3, 6), skipTop[layer] ?? 0);
    }
  };

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
  const allCaves = (spec, skipTop = {}) => {
    for (const layer of ids) {
      const l = layers[layer];
      caves({ top: l.top + (skipTop[layer] ?? 0), bottom: l.bottom }, spec[layer]);
    }
  };

  // the Heart: a 3x3 gem in a chamber at the very bottom, on a floor of core rock
  const heart = (block, floor, kind) => {
    const hx = Math.floor(MINE_W / 2) - 1;
    const hy = H - 5;
    for (let y = hy - 3; y <= H - 2; y++) for (let x = hx - 4; x <= hx + 6; x++) grid.set(x, y, B.AIR);
    for (let x = hx - 4; x <= hx + 6; x++) grid.set(x, H - 2, floor);
    for (let y = hy; y <= hy + 2; y++) for (let x = hx; x <= hx + 2; x++) grid.set(x, y, block);
    return { x: hx, y: hy, kind };
  };

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
  const last = ids[ids.length - 1];
  // a layer's floors (the bottom layer keeps clear of the Heart's chamber)
  const inLayer = (layer) => floors(layers[layer].top, layers[layer].bottom - (layer === last ? 10 : 0));
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

  // one or two chests in every layer
  const chests = (counts) => {
    const out = [];
    for (const layer of ids) {
      for (const c of takeSpots(inLayer(layer), counts[layer], 12)) {
        grid.set(c.x, c.y, B.CHEST);
        out.push(c);
      }
    }
    return out;
  };

  // decorations: little things growing on cave floors and ceilings
  const decor = (kindsByLayer, taken = new Set()) => {
    const out = [];
    for (let y = 2; y < H - 1; y++) {
      const kinds = kindsByLayer[layerAt(y)];
      for (let x = 1; x < MINE_W - 1; x++) {
        if (grid.get(x, y) !== B.AIR || taken.has(`${x},${y}`)) continue;
        const below = grid.get(x, y + 1);
        const above = grid.get(x, y - 1);
        if (isSolid(below) && below !== B.BEDROCK && rng.chance(kinds.floorChance)) {
          out.push({ x, y, on: 'floor', kind: rng.weighted(kinds.floor), v: rng.int(0, 2) });
        } else if (isSolid(above) && above !== B.BEDROCK && rng.chance(kinds.ceilChance)) {
          out.push({ x, y, on: 'ceil', kind: rng.weighted(kinds.ceil), v: rng.int(0, 2) });
        }
      }
    }
    return out;
  };

  return { grid, inner, layerAt, hostAt, blob, veins, caves, allCaves, heart, floors, inLayer, free, takeSpots, chests, decor };
}
