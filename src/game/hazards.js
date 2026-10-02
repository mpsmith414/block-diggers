// Gentle danger: slimes, bats, falling gravel, lava. Pure step functions.

import { B, isSolid } from '../world/blocks.js';
import { TILE, SLIME, BAT, GRAVEL } from '../tuning.js';
import { layersOf, layerOfRow } from './planets.js';

const T = TILE;

export const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const solidAt = (grid, px, py) => isSolid(grid.get(Math.floor(px / T), Math.floor(py / T)));

// ---- how each creature moves ----

// Every creature has its own way of getting about, so every layer feels
// different. Walkers hop, bounce or leap (a jump every so often), or walk
// along in runs and rests; flyers flap, glide, drift, zigzag, dart, loop or
// jitter.
export const GAITS = {
  hop: { hopEvery: SLIME.hopEvery, hopSpeed: SLIME.hopSpeed, hopDrift: SLIME.hopDrift },
  bounce: { hopEvery: 0.7, hopSpeed: 190, hopDrift: 60 },
  leap: { hopEvery: 2.2, hopSpeed: 220, hopDrift: 115 },
  march: { walk: 22, run: 3, rest: 0.4 },
  scurry: { walk: 55, run: 0.7, rest: 0.6 },
  sprint: { walk: 70, run: 1, rest: 1.2 },
  scuttle: { walk: 45, run: 0.45, rest: 0.45 },
  crawl: { walk: 16, run: 4, rest: 0.6 },
  waddle: { walk: 24, run: 1.6, rest: 0.5, slide: 75 }, // every third run is a belly slide
  flap: { speed: BAT.speed, waveSpeed: BAT.waveSpeed, waveHeight: BAT.waveHeight },
  glide: { speed: 30, waveSpeed: 1.2, waveHeight: 14 },
  drift: { speed: 12, waveSpeed: 1.4, waveHeight: 10 },
  jitter: { speed: 36, waveSpeed: 9, waveHeight: 4 },
  zigzag: { speed: 40, zig: 0.5, zigHeight: 12 },
  dart: { speed: 95, dash: 0.35, hover: 0.9 },
  circle: { speed: 14, radius: 9, spin: 2.4 },
};
export const GAIT_OF = {
  slime: 'hop', moonblob: 'hop', scoop: 'hop', shadow: 'hop',
  dustbunny: 'bounce', sunbunny: 'bounce', frog: 'leap',
  robot: 'march', mouse: 'scurry', raptor: 'sprint', crab: 'scuttle', beetle: 'crawl', newt: 'crawl', penguin: 'waddle',
  bat: 'flap', ptero: 'glide', owl: 'glide',
  jelly: 'drift', plasmajelly: 'drift', snowflake: 'drift', alien: 'drift', martian: 'drift',
  sparky: 'jitter', fairy: 'zigzag', cometling: 'zigzag', dragonfly: 'dart', drone: 'dart',
  moth: 'circle', wisp: 'circle', ember: 'circle', sprite: 'circle',
  rblob: 'hop', rflier: 'drift', // Rainbow Planet's
};
export const WALK_GAITS = ['hop', 'bounce', 'leap', 'march', 'scurry', 'sprint', 'scuttle', 'crawl', 'waddle'];

// ---- slimes (and everything that walks) ----

export function createSlime(x, y, dir, gait = 'hop') {
  return { kind: 'slime', x, y, w: 12, h: 10, vx: 0, vy: 0, dir, hopT: SLIME.hopEvery * 0.5, grounded: false, gait, runT: 0, moving: false, runs: 0, sliding: false };
}

// A wall ahead, or a big drop: time to turn around.
function blockedAhead(s, grid) {
  const aheadX = s.dir > 0 ? s.x + s.w + 4 : s.x - 4;
  const footY = s.y + s.h - 1;
  if (solidAt(grid, aheadX, footY)) return true;
  let drop = 0;
  while (drop < 3 && !solidAt(grid, aheadX, footY + 1 + drop * T)) drop++;
  return drop >= 3;
}

export function stepSlime(s, grid, dt) {
  const g = GAITS[s.gait] ?? GAITS.hop;
  if (g.walk) {
    // walkers: a run, then a rest
    s.runT -= dt;
    if (s.runT <= 0) {
      s.moving = !s.moving;
      s.runT = s.moving ? g.run : g.rest;
      if (s.moving) s.runs++;
    }
    if (s.grounded) {
      s.sliding = !!(g.slide && s.moving && s.runs % 3 === 0);
      if (s.moving && blockedAhead(s, grid)) s.dir = -s.dir;
      s.vx = s.moving ? s.dir * (s.sliding ? g.slide : g.walk) : 0;
    }
  } else {
    // hoppers: a jump every so often
    s.hopT -= dt;
    if (s.grounded && s.hopT <= 0) {
      if (blockedAhead(s, grid)) s.dir = -s.dir;
      s.vy = -g.hopSpeed;
      s.vx = s.dir * g.hopDrift;
      s.hopT = g.hopEvery;
      s.grounded = false;
    }
  }

  // x
  if (s.vx) {
    const nx = s.x + s.vx * dt;
    const edge = s.vx > 0 ? nx + s.w - 0.01 : nx;
    if (solidAt(grid, edge, s.y) || solidAt(grid, edge, s.y + s.h - 0.01)) {
      s.dir = -s.dir;
      s.vx = 0;
    } else {
      s.x = nx;
    }
  }

  // y
  s.vy = Math.min(400, s.vy + SLIME.gravity * dt);
  const ny = s.y + s.vy * dt;
  if (s.vy > 0) {
    const row = Math.floor((ny + s.h - 0.01) / T);
    if (solidAt(grid, s.x, row * T) || solidAt(grid, s.x + s.w - 0.01, row * T)) {
      s.y = row * T - s.h;
      s.vy = 0;
      s.vx = 0;
      s.grounded = true;
      return;
    }
  } else if (solidAt(grid, s.x, ny) || solidAt(grid, s.x + s.w - 0.01, ny)) {
    s.vy = 0;
    return;
  }
  s.y = ny;
  s.grounded = false;
}

// 'squash' when landing on top, 'bonk' on any other touch.
export function slimeTouch(box, vy, s) {
  if (!overlaps(box, s)) return null;
  const bottom = box.y + box.h;
  if (vy > 0 && bottom <= s.y + 6) return 'squash';
  return 'bonk';
}

// ---- bats (and everything that flies) ----

export function createBat(x, y, dir, gait = 'flap') {
  return { kind: 'bat', x, y, w: 10, h: 8, dir, baseY: y, t: Math.random() * 6, gait, phaseT: 0, dashing: true };
}

const tri = (u) => 1 - 4 * Math.abs(((u % 1) + 1) % 1 - 0.5); // a zigzag wave, -1..1

export function stepBat(b, grid, dt) {
  const g = GAITS[b.gait] ?? GAITS.flap;
  b.t += dt;
  // how far across this step
  let dx = b.dir * g.speed * dt;
  if (g.dash) {
    // dart: a quick dash, then hover in place
    b.phaseT -= dt;
    if (b.phaseT <= 0) {
      b.dashing = !b.dashing;
      b.phaseT = b.dashing ? g.dash : g.hover;
    }
    dx = b.dashing ? dx : 0;
  } else if (g.radius) {
    // loop-the-loops while drifting along
    dx += -Math.sin(b.t * g.spin) * g.radius * g.spin * dt;
  }
  const nx = b.x + dx;
  const edge = dx > 0 ? nx + b.w : nx;
  if (dx && solidAt(grid, edge, b.y + b.h / 2)) b.dir = -b.dir;
  else b.x = nx;
  // and how high
  let ny;
  if (g.zig) ny = b.baseY + tri(b.t / g.zig) * g.zigHeight;
  else if (g.radius) ny = b.baseY + Math.cos(b.t * g.spin) * g.radius;
  else if (g.dash) ny = b.baseY + Math.sin(b.t * 6) * 2;
  else ny = b.baseY + Math.sin(b.t * g.waveSpeed) * g.waveHeight;
  if (!solidAt(grid, b.x + b.w / 2, ny) && !solidAt(grid, b.x + b.w / 2, ny + b.h)) b.y = ny;
}

// ---- gravel ----

export function triggerGravel(fallers, grid, x, y) {
  if (grid.get(x, y) !== B.GRAVEL) return fallers;
  if (fallers.some((f) => f.cx === x && f.cy === y && f.state === 'shake')) return fallers;
  return [...fallers, { cx: x, cy: y, x: x * T, y: y * T, w: T, h: T, state: 'shake', t: GRAVEL.shake, vy: 0 }];
}

export function stepGravel(fallers, grid, dt) {
  const freed = [];
  const landed = [];
  let out = [];
  for (const f of fallers) {
    if (f.state === 'shake') {
      f.t -= dt;
      if (f.t <= 0) {
        if (grid.get(f.cx, f.cy) !== B.GRAVEL) continue; // mined while shaking
        grid.set(f.cx, f.cy, B.AIR);
        freed.push({ x: f.cx, y: f.cy });
        f.state = 'fall';
      }
      out.push(f);
      continue;
    }
    f.vy = Math.min(GRAVEL.maxFall, f.vy + GRAVEL.gravity * dt);
    const ny = f.y + f.vy * dt;
    const row = Math.floor((ny + T) / T);
    const below = grid.get(f.cx, row);
    if (isSolid(below) || below === B.CHEST) {
      const cy = row - 1;
      grid.set(f.cx, cy, B.GRAVEL);
      landed.push({ x: f.cx, y: cy });
      continue;
    }
    f.y = ny;
    out.push(f);
  }
  // gravel that was resting on a freed cell starts to shake
  for (const c of freed) out = triggerGravel(out, grid, c.x, c.y - 1);
  return { fallers: out, landed, freed };
}

// ---- lava ----

// The nearest cell straight up that is open and not lava (rock is dug out if needed).
export function lavaEscape(grid, cx, cy) {
  for (let y = cy - 1; y >= cy - 20; y--) {
    const id = grid.get(cx, y);
    if (!isSolid(id) && id !== B.LAVA) return { cx, cy: y };
  }
  return { cx, cy: cy - 1 };
}

// ---- spawning ----

// Which creature lives in each layer (on every planet), and whether it walks or flies.
const CREATURES = {
  dirt: 'slime', stone: 'slime', deep: 'bat', crystal: 'bat',
  dino: 'ptero', brick: 'robot', meteor: 'alien', core: 'wisp',
  craters: 'moonblob', cheesecaves: 'mouse', mooncrystal: 'jelly', alienbase: 'drone', mooncore: 'sprite',
  dunes: 'dustbunny', rovers: 'crab', volcano: 'newt', ruins: 'martian', marscore: 'ember',
  rings: 'penguin', icecream: 'scoop', aurora: 'owl', comets: 'cometling', saturncore: 'snowflake',
  jungle: 'dragonfly', bonebeds: 'raptor', swamp: 'frog', lavalands: 'beetle', dinocore: 'moth',
  corona: 'fairy', sunspots: 'shadow', plasmasea: 'plasmajelly', radiance: 'sunbunny', fusion: 'sparky', suncore: 'sparky',
};
const WALKERS = new Set(['slime', 'robot', 'moonblob', 'mouse', 'dustbunny', 'crab', 'newt', 'penguin', 'scoop', 'raptor', 'frog', 'beetle', 'shadow', 'sunbunny']);

export { layerOfRow };

// Rainbow Planet: each layer's own creatures for this trip ({ r12: [{ kind, color, scale }] })
let layerCreatures = {};
export const setLayerCreatures = (map) => { layerCreatures = map; };

export function creatureFor(row, planet = 'earth') {
  if (planet === 'rainbow') {
    const list = layerCreatures[layerOfRow(row, planet)] ?? [];
    const look = list[row % Math.max(1, list.length)] ?? { kind: 'blob', color: 0xffffff, scale: 1 };
    const species = look.kind === 'blob' ? 'rblob' : 'rflier';
    return { species, walker: species === 'rblob', look };
  }
  const species = CREATURES[layerOfRow(row, planet)];
  return { species, walker: WALKERS.has(species) };
}

// A spawn cell near `near`, in the same layer, for a walker (on a floor) or a flyer.
// (`keepOut`: a room creatures never spawn in, like the Moon Skate Park)
export function spawnSpot(grid, rng, { walker, near, avoid, planet = 'earth', keepOut = null }) {
  const layers = layersOf(planet);
  const layer = layers[layerOfRow(near.cy, planet)];
  const top = Math.max(layer.top, Object.values(layers)[0].top + 2);
  const bottom = layer.bottom;
  for (let i = 0; i < 30; i++) {
    const cx = near.cx + rng.int(-20, 20);
    const cy = near.cy + rng.int(-12, 12);
    if (cy < top || cy > bottom || !grid.inside(cx, cy)) continue;
    if (avoid && cx >= avoid.x0 && cx <= avoid.x1 && cy >= avoid.y0 && cy <= avoid.y1) continue;
    if (keepOut && cx >= keepOut.x0 && cx <= keepOut.x1 && cy >= keepOut.top && cy <= keepOut.floor) continue;
    if (grid.get(cx, cy) !== B.AIR) continue;
    if (walker && !isSolid(grid.get(cx, cy + 1))) continue;
    if (!walker && (grid.get(cx, cy + 1) === B.LAVA || grid.get(cx, cy + 1) === B.WATER)) continue;
    return { cx, cy };
  }
  return null;
}
