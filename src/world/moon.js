// seed → the Moon: grey cratered moon rock with star shards and moon cheese,
// then glowing space-crystal caves further down. Same shape as a mine, so
// MineScene can dig it with the same engine.

import { createRng } from './rng.js';
import { createGrid } from './grid.js';
import { B, isSolid } from './blocks.js';
import { MINE_W, SHAFT_X } from '../tuning.js';

export const MOON = {
  h: 102,
  rock: { top: 1, bottom: 60 },
  caves: { top: 61, bottom: 100 },
};

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function generateMoon(seed) {
  const rng = createRng((seed ^ 0x4d4f4f4e) >>> 0);
  const H = MOON.h;
  const grid = createGrid(MINE_W, H);
  const inner = (x, y) => x >= 1 && x <= MINE_W - 2 && y >= 1 && y <= H - 2;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < MINE_W; x++) {
      grid.set(x, y, x === 0 || x === MINE_W - 1 || y === H - 1 ? B.BEDROCK : B.MOONROCK);
    }
  }

  // veins: a random walk that only replaces moon rock
  const blob = (id, top, bottom, size) => {
    let x = rng.int(1, MINE_W - 2);
    let y = rng.int(top, bottom);
    for (let i = 0; i < size; i++) {
      if (grid.get(x, y) === B.MOONROCK) grid.set(x, y, id);
      const [dx, dy] = rng.pick(DIRS);
      if (inner(x + dx, y + dy) && y + dy >= top && y + dy <= bottom) { x += dx; y += dy; }
    }
  };
  for (let i = 0; i < 16; i++) blob(B.STAR, MOON.rock.top + 2, MOON.caves.bottom, rng.int(3, 6));
  for (let i = 0; i < 14; i++) blob(B.CHEESE, MOON.rock.top + 1, MOON.caves.bottom, rng.int(4, 8));
  for (let i = 0; i < 18; i++) blob(B.SPACE_CRYSTAL, MOON.caves.top, MOON.caves.bottom, rng.int(3, 6));

  // caves: a wandering round brush (big and floaty in the crystal caves)
  const caves = ({ top, bottom }, count, radius, lenMin, lenMax) => {
    const yMin = top + Math.ceil(radius) + 1;
    const yMax = bottom - Math.ceil(radius) - 1;
    for (let c = 0; c < count; c++) {
      let x = rng.int(3, MINE_W - 4);
      let y = rng.int(yMin, yMax);
      let angle = rng.next() * Math.PI * 2;
      const steps = rng.int(lenMin, lenMax);
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
  caves({ top: MOON.rock.top + 2, bottom: MOON.rock.bottom }, 7, 2, 22, 36);
  caves(MOON.caves, 10, 3, 26, 42);

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

  const floors = (top, bottom) => {
    const out = [];
    for (let y = top; y <= bottom; y++) {
      for (let x = 1; x < MINE_W - 1; x++) {
        if (grid.get(x, y) === B.AIR && isSolid(grid.get(x, y + 1)) && grid.get(x, y + 1) !== B.BEDROCK) out.push({ x, y });
      }
    }
    return out;
  };

  // chests: one in the moon rock, two in the crystal caves
  const chests = [];
  const placeChests = (top, bottom, n) => {
    const spots = floors(top, bottom);
    for (let attempt = 0; chests.length < n && attempt < 300 && spots.length; attempt++) {
      const c = rng.pick(spots);
      if (chests.some((o) => Math.abs(o.x - c.x) + Math.abs(o.y - c.y) < 10)) continue;
      grid.set(c.x, c.y, B.CHEST);
      chests.push({ x: c.x, y: c.y });
    }
  };
  placeChests(MOON.rock.top + 4, MOON.rock.bottom, 1);
  placeChests(MOON.caves.top, MOON.caves.bottom, 3);

  // meteorites buried in the moon rock
  for (let i = 0, tries = 0; i < 4 && tries < 200; tries++) {
    const x = rng.int(2, MINE_W - 3);
    const y = rng.int(MOON.rock.top + 4, MOON.rock.bottom);
    if (grid.get(x, y) !== B.MOONROCK) continue;
    grid.set(x, y, B.METEORITE);
    i++;
  }

  // decorations: space crystals and pebbles on floors, drips from ceilings
  const decor = [];
  for (let y = 2; y < H - 1; y++) {
    for (let x = 1; x < MINE_W - 1; x++) {
      if (grid.get(x, y) !== B.AIR) continue;
      const deep = y >= MOON.caves.top;
      if (isSolid(grid.get(x, y + 1)) && grid.get(x, y + 1) !== B.BEDROCK && rng.chance(deep ? 0.35 : 0.2)) {
        decor.push({ x, y, on: 'floor', kind: deep || rng.chance(0.3) ? 'spacecrystal' : 'pebbles', v: rng.int(0, 2) });
      } else if (isSolid(grid.get(x, y - 1)) && rng.chance(0.12)) {
        decor.push({ x, y, on: 'ceil', kind: 'stalactite', v: rng.int(0, 2) });
      }
    }
  }

  return {
    grid, chests, decor, eggs: [], bigChest: null, boulders: [], fossils: [], heart: null,
    spawn: { x: SHAFT_X, y: -1 }, seed, moon: true,
  };
}
