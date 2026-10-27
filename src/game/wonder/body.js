// The Wonder planets' mover: a box (top-left x, y, size w × h, in pixels)
// moving against a little tile grid of its own. Pure, so it's tested.
//
// A level is a grid of tile numbers; `kinds[n]` says what tile n is:
//   { solid: true }              a wall from every side
//   { solid: true, oneWay: true } a ledge: solid from above only (you jump up through it)
// anything else is empty. Outside the grid, the sides and the bottom are
// solid and the sky above is open (unless the level says `roof`).
//
// Gravity is signed: negative gravity falls up (the Upside-Down Planet), and
// then a one-way ledge is solid from below instead.

import { TILE } from '../../tuning.js';

const T = TILE;
const EPS = 0.001;

export function createLevel(w, h, kinds, { roof = false } = {}) {
  const cells = new Uint8Array(w * h);
  const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  return {
    w, h, kinds, roof, cells,
    get(x, y) {
      if (inside(x, y)) return cells[y * w + x];
      return -1; // (outside)
    },
    set(x, y, n) {
      if (inside(x, y)) cells[y * w + x] = n;
    },
    fill(x0, y0, x1, y1, n) {
      for (let y = Math.max(0, y0); y <= Math.min(h - 1, y1); y++) for (let x = Math.max(0, x0); x <= Math.min(w - 1, x1); x++) cells[y * w + x] = n;
    },
  };
}

// What a cell is to a mover: 'solid', 'oneway' or null.
export function cellType(level, x, y) {
  const n = level.get(x, y);
  if (n === -1) {
    if (x < 0 || x >= level.w || y >= level.h) return 'solid';
    return level.roof ? 'solid' : null;
  }
  const k = level.kinds[n];
  if (!k || !k.solid) return null;
  return k.oneWay ? 'oneway' : 'solid';
}

const cols = (b) => {
  const out = [];
  for (let c = Math.floor(b.x / T); c <= Math.floor((b.x + b.w - EPS) / T); c++) out.push(c);
  return out;
};
const rows = (b) => {
  const out = [];
  for (let r = Math.floor(b.y / T); r <= Math.floor((b.y + b.h - EPS) / T); r++) out.push(r);
  return out;
};

// Does the box overlap anything solid where it is now? (one-ways don't count)
export function overlapsSolid(level, b) {
  for (const r of rows(b)) for (const c of cols(b)) if (cellType(level, c, r) === 'solid') return true;
  return false;
}

// Move the box by its velocity for dt seconds, with gravity. Returns what it
// hit: `floor` / `ceiling` (the cells landed on or bumped, by the way gravity
// points: `floor` is always "the ground under your feet"), `left` / `right`,
// and `impact`, how fast you were falling when you landed.
//
// opts: gravity (px/s², signed), maxFall, drop (fall through one-way ledges).
export function moveBody(b, level, dt, { gravity = 0, maxFall = Infinity, drop = false } = {}) {
  const out = { floor: null, ceiling: null, left: null, right: null, impact: 0 };
  const g = Math.sign(gravity) || 1;
  b.vy += gravity * dt;
  if (g > 0) b.vy = Math.min(b.vy, maxFall);
  else b.vy = Math.max(b.vy, -maxFall);

  // small steps, so nothing fast tunnels through a tile
  const dist = Math.max(Math.abs(b.vx), Math.abs(b.vy)) * dt;
  const n = Math.max(1, Math.ceil(dist / (T / 2)));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    if (b.vx) stepX(b, level, b.vx * h, out);
    if (b.vy) stepY(b, level, b.vy * h, out, g, drop);
  }
  return out;
}

function stepX(b, level, dx, out) {
  const nx = b.x + dx;
  const edge = dx > 0 ? nx + b.w - EPS : nx;
  const col = Math.floor(edge / T);
  const hit = rows(b).filter((r) => cellType(level, col, r) === 'solid');
  if (hit.length) {
    b.x = dx > 0 ? col * T - b.w : (col + 1) * T;
    out[dx > 0 ? 'right' : 'left'] = hit.map((r) => ({ x: col, y: r }));
    b.vx = 0;
  } else b.x = nx;
}

function stepY(b, level, dy, out, g, drop) {
  const ny = b.y + dy;
  const down = dy > 0;
  const edge = down ? ny + b.h - EPS : ny;
  const row = Math.floor(edge / T);
  // a one-way ledge stops you only when you come at it from its top (the
  // side gravity pulls you onto), having been clear of it before this step
  const before = down ? b.y + b.h : b.y;
  const clear = down ? before <= row * T + EPS : before >= (row + 1) * T - EPS;
  const towardGravity = down === g > 0;
  const hit = cols(b).filter((c) => {
    const t = cellType(level, c, row);
    return t === 'solid' || (t === 'oneway' && towardGravity && clear && !drop);
  });
  if (hit.length) {
    const speed = Math.abs(b.vy);
    b.y = down ? row * T - b.h : (row + 1) * T;
    const cells = hit.map((c) => ({ x: c, y: row }));
    if (towardGravity) { out.floor = cells; out.impact = speed; } else out.ceiling = cells;
    b.vy = 0;
  } else b.y = ny;
}

// Standing on something? (feet against a floor, by gravity's direction)
export function onFloor(level, b, gravity = 1) {
  const down = gravity >= 0;
  const edge = down ? b.y + b.h + 0.5 : b.y - 0.5;
  const row = Math.floor(edge / T);
  const flush = down ? Math.abs(b.y + b.h - row * T) < 0.6 : Math.abs(b.y - (row + 1) * T) < 0.6;
  if (!flush) return false;
  return cols(b).some((c) => {
    const t = cellType(level, c, row);
    return t === 'solid' || t === 'oneway';
  });
}

// The cells a box overlaps (for picking things up, touching tiles).
export function cellsUnder(b) {
  const out = [];
  for (const r of rows(b)) for (const c of cols(b)) out.push({ x: c, y: r });
  return out;
}

// Two boxes overlap?
export const touching = (a, b, pad = 0) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
