// Rainbow Planet: the endless mine past the Sun. Every layer is 30 rows of
// brand-new rock in its own colours and pattern, with its own gem (a shape, a
// colour and a size, up to massive 8x8 gems), decorations, creatures and
// sometimes a twist. All of it comes from the planet's seed and the layer's
// number, so layer 12 always looks like layer 12. A trip builds a stretch of
// layers starting at your deepest point, ending in a glowing floor. Pure.

import { createGrid } from './grid.js';
import { createRng } from './rng.js';
import { B } from './blocks.js';
import { gemInfo } from '../game/rainbowGems.js';
import { MINE_W, SHAFT_X, RAINBOW } from '../tuning.js';

export const PATTERNS = ['speckles', 'stripes', 'swirls', 'dots', 'bubbles', 'zigzag'];
export const GEM_SHAPES = ['round', 'diamond', 'hex', 'star', 'heart', 'crystal', 'nugget'];
export const GEM_SIZES = ['tiny', 'chunky', 'big', 'massive'];
export const DECOR_KINDS = ['mushroom', 'flower', 'bubble', 'vine', 'crystal'];
const SIZE_WEIGHTS = { tiny: 0.3, chunky: 0.29, big: 0.27, massive: 0.14 };
const TWISTS = ['bouncy', 'pools', 'shiny', 'floaty'];
const SPARKLES = ['twinkle', 'glow', 'shimmer'];

// each layer has its own random numbers: one for its look, one for what's in it
const lookRng = (seed, n) => createRng((seed ^ Math.imul(n, 0x9e3779b1)) >>> 0);
const layoutRng = (seed, n) => createRng((seed ^ Math.imul(n, 0x85ebca6b) ^ 0x5eed) >>> 0);

// HSL (h in degrees, s and l from 0 to 1) to 0xRRGGBB
export function hsl(h, s, l) {
  const hh = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = hh < 60 ? [c, x, 0] : hh < 120 ? [x, c, 0] : hh < 180 ? [0, c, x] : hh < 240 ? [0, x, c] : hh < 300 ? [x, 0, c] : [c, 0, x];
  const to = (v) => Math.round((v + m) * 255);
  return (to(r) << 16) | (to(g) << 8) | to(b);
}

const mix = (a, b, t) => {
  const ch = (c, s) => (c >> s) & 255;
  const lerp = (s) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t);
  return (lerp(16) << 16) | (lerp(8) << 8) | lerp(0);
};

// A layer's look: its colours (top to bottom), rock pattern, gem, decorations,
// creatures and twist. Bright or pastel colours only: cheerful and easy to see.
export function layerLook(seed, n) {
  const rng = lookRng(seed, n);
  const bright = (h) => hsl(h, 0.65 + rng.next() * 0.3, 0.5 + rng.next() * 0.18);
  const hue = rng.next() * 360;
  const hues = [hue];
  const count = rng.chance(0.5) ? 3 : 2;
  for (let i = 1; i < count; i++) hues.push(hues[i - 1] + (rng.chance(0.5) ? -1 : 1) * (40 + rng.next() * 80));
  const colors = hues.map(bright);
  // the gem stands out from the rock: its hue is well away from the rock's
  const gemHue = hues[Math.floor(hues.length / 2)] + 90 + rng.next() * 180;
  const gem = {
    shape: rng.pick(GEM_SHAPES),
    color: hsl(gemHue, 0.85, 0.6),
    light: hsl(gemHue, 0.9, 0.86),
    dark: hsl(gemHue, 0.8, 0.32),
    sparkle: rng.pick(SPARKLES),
    size: rng.weighted(SIZE_WEIGHTS),
  };
  const first = rng.pick(DECOR_KINDS);
  const decor = [first, rng.pick(DECOR_KINDS.filter((k) => k !== first))];
  const kinds = rng.chance(0.5) ? ['blob', 'flier'] : [rng.pick(['blob', 'flier'])];
  const creatures = kinds.map((kind) => ({ kind, color: bright(rng.next() * 360), scale: 0.8 + rng.next() * 0.6 }));
  const pattern = rng.pick(PATTERNS);
  const twist = rng.chance(0.5) ? rng.pick(TWISTS) : null;
  return { n, colors, pattern, gem, decor, creatures, twist };
}

// The rock's colour at a row of its layer (0 at the top): along the gradient.
export function rowColor(look, rowInLayer) {
  const t = Math.min(1, Math.max(0, rowInLayer / (RAINBOW.layerRows - 1)));
  const segs = look.colors.length - 1;
  const at = t * segs;
  const i = Math.min(segs - 1, Math.floor(at));
  return mix(look.colors[i], look.colors[i + 1], at - i);
}

// The layer a row of the planet is in (counting from 1).
export const layerOfRow = (row) => Math.floor(Math.max(0, row) / RAINBOW.layerRows) + 1;

// A trip's stretch of the mine: from a little above your deepest point down
// to the end of the `stretch`-th layer, then the glowing floor. Grid row 0 is
// the planet's row `top`; `layers` give their rows in grid rows.
export function generateRainbow(seed, deepest = 0) {
  const L = RAINBOW.layerRows;
  const start = Math.max(RAINBOW.cave.h - 1, Math.floor(deepest));
  const top = Math.max(0, start - RAINBOW.above);
  const firstN = layerOfRow(top);
  const lastN = layerOfRow(start) + RAINBOW.stretch - 1;
  const floorAbs = lastN * L;
  const rows = floorAbs - top + 1;
  const floorRow = rows - 1;
  const grid = createGrid(MINE_W, rows);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < MINE_W; x++) grid.set(x, y, x === 0 || x === MINE_W - 1 || y === floorRow ? B.RAINBOW_FLOOR : B.RAINBOW_ROCK);
  }
  const inGrid = (x, y) => x >= 1 && x <= MINE_W - 2 && y >= 0 && y < floorRow;
  // the starting cave (grid rows), where the lift drops you off
  const spawn = { x: SHAFT_X, y: start - top };
  const cave = { x0: SHAFT_X - 3, x1: SHAFT_X + 3, y0: spawn.y - RAINBOW.cave.h + 1, y1: spawn.y };
  const inCave = (x, y) => x >= cave.x0 - 1 && x <= cave.x1 + 1 && y >= cave.y0 - 1 && y <= cave.y1 + 1;

  const layers = [];
  const gems = [];
  const chests = [];
  const decor = [];
  const twists = { floaty: [] };
  for (let n = firstN; n <= lastN; n++) {
    const look = layerLook(seed, n);
    const a0 = (n - 1) * L - top; // the layer's rows, in grid rows (may start above the grid)
    const a1 = n * L - 1 - top;
    layers.push({ n, top: Math.max(0, a0), bottom: Math.min(floorRow - 1, a1), look });
    const rng = layoutRng(seed, n);
    const rock = (x, y) => inGrid(x, y) && grid.get(x, y) === B.RAINBOW_ROCK;

    // caves: a wandering round brush, inside the layer
    const caveCount = rng.int(3, 5);
    for (let c = 0; c < caveCount; c++) {
      let x = rng.int(4, MINE_W - 5);
      let y = rng.int(a0 + 3, a1 - 3);
      let angle = rng.next() * Math.PI * 2;
      const steps = rng.int(18, 36);
      const radius = 1.2 + rng.next() * 0.7;
      for (let s = 0; s < steps; s++) {
        const r = radius + (rng.next() - 0.5) * 0.6;
        for (let yy = Math.floor(y - r); yy <= Math.ceil(y + r); yy++) {
          for (let xx = Math.floor(x - r); xx <= Math.ceil(x + r); xx++) {
            if (yy < a0 + 1 || yy > a1 - 1 || !inGrid(xx, yy)) continue;
            if ((xx - x) ** 2 + (yy - y) ** 2 <= r * r + 0.25) grid.set(xx, yy, B.AIR);
          }
        }
        angle += (rng.next() - 0.5) * 1.2;
        x = Math.min(MINE_W - 5, Math.max(4, x + Math.cos(angle)));
        y = Math.min(a1 - 3, Math.max(a0 + 3, y + Math.sin(angle) * 0.6));
      }
    }

    // the layer's gems, in solid rock only, never in (or touching) the starting cave
    const { size } = look.gem;
    const { cells: k, count, hits } = gemInfo(size);
    const want = rng.int(count[0], count[1]);
    let placed = 0;
    for (let tries = 0; tries < want * 60 && placed < want; tries++) {
      const x = rng.int(1, MINE_W - 1 - k);
      const y = rng.int(a0, a1 - k + 1);
      let ok = true;
      for (let yy = y; yy < y + k && ok; yy++) for (let xx = x; xx < x + k && ok; xx++) ok = rock(xx, yy) && !inCave(xx, yy);
      if (!ok) continue;
      for (let yy = y; yy < y + k; yy++) for (let xx = x; xx < x + k; xx++) grid.set(xx, yy, k === 1 ? B.RAINBOW_GEM : B.RAINBOW_GEM_PART);
      gems.push({ id: `${n}-${placed}`, n, x, y, size, hits });
      placed++;
    }

    // cave floors (air over rock) and ceilings (air under rock), for chests and decorations
    const floors = [];
    const ceilings = [];
    for (let y = Math.max(0, a0); y <= Math.min(floorRow - 1, a1); y++) {
      for (let x = 1; x < MINE_W - 1; x++) {
        if (grid.get(x, y) !== B.AIR || inCave(x, y)) continue;
        if (grid.get(x, y + 1) === B.RAINBOW_ROCK) floors.push({ x, y });
        if (y > 0 && grid.get(x, y - 1) === B.RAINBOW_ROCK) ceilings.push({ x, y });
      }
    }
    const take = (list) => (list.length ? list.splice(rng.int(0, list.length - 1), 1)[0] : null);
    const chestCount = rng.int(3, 5);
    for (let i = 0; i < chestCount; i++) {
      const at = take(floors);
      if (at) chests.push({ ...at, n, sparkles: rng.int(10, 25) });
    }
    // (a layer with too few caves still gets its chests: in a little nook)
    for (let tries = 0; tries < 500 && chests.filter((c) => c.n === n).length < 3; tries++) {
      const x = rng.int(3, MINE_W - 4);
      const y = rng.int(Math.max(1, a0 + 2), Math.min(floorRow - 2, a1 - 1));
      if (inCave(x, y) || grid.get(x, y) !== B.RAINBOW_ROCK || grid.get(x, y + 1) !== B.RAINBOW_ROCK) continue;
      grid.set(x, y, B.AIR);
      chests.push({ x, y, n, sparkles: rng.int(10, 25) });
    }
    const decorCount = rng.int(6, 10);
    for (let i = 0; i < decorCount; i++) {
      const ceiling = rng.chance(0.35) && ceilings.length > 0;
      const at = take(ceiling ? ceilings : floors);
      if (at) decor.push({ ...at, n, kind: look.decor[i % 2], ceiling });
    }

    // the twist
    if (look.twist === 'bouncy') {
      for (let i = 0; i < 6; i++) {
        const at = take(floors);
        if (at) grid.set(at.x, at.y + 1, B.SPRING);
      }
    } else if (look.twist === 'pools') {
      for (let i = 0; i < 3; i++) {
        const at = take(floors);
        if (!at) continue;
        for (let dx = -1; dx <= 1; dx++) if (grid.get(at.x + dx, at.y) === B.AIR && !inCave(at.x + dx, at.y)) grid.set(at.x + dx, at.y, B.WATER);
      }
    } else if (look.twist === 'shiny') {
      for (const f of floors) grid.set(f.x, f.y + 1, B.RAINBOW_SHINY);
    } else if (look.twist === 'floaty') {
      twists.floaty.push([Math.max(0, a0), Math.min(floorRow - 1, a1)]);
    }
  }

  // the starting cave, on a floor of rock
  for (let y = Math.max(0, cave.y0); y <= cave.y1; y++) for (let x = cave.x0; x <= cave.x1; x++) grid.set(x, y, B.AIR);
  for (let x = cave.x0; x <= cave.x1; x++) if (grid.get(x, cave.y1 + 1) !== B.RAINBOW_FLOOR) grid.set(x, cave.y1 + 1, B.RAINBOW_ROCK);

  return {
    top, rows, grid, floorRow, layers, gems, twists, spawn,
    // (its own chests and decorations: the mine's usual ones are for the other planets)
    rchests: chests, rdecor: decor,
    startCave: { x: SHAFT_X, y: spawn.y },
    // (what the rest of the mine expects a world to have)
    chests: [], decor: [], eggs: [], bigChest: null, boulders: [], fossils: [], heart: null, teleports: [], ufo: null, chimes: [],
    geysers: [], rovers: [], vaults: [], globes: [], ducks: [], cushions: [],
  };
}
