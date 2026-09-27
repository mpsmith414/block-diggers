// Gentle danger: slimes, bats, falling gravel, lava. Pure step functions.

import { B, isSolid } from '../world/blocks.js';
import { TILE, SLIME, BAT, GRAVEL, LAYERS } from '../tuning.js';

const T = TILE;

export const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const solidAt = (grid, px, py) => isSolid(grid.get(Math.floor(px / T), Math.floor(py / T)));

// ---- slimes ----

export function createSlime(x, y, dir) {
  return { kind: 'slime', x, y, w: 12, h: 10, vx: 0, vy: 0, dir, hopT: SLIME.hopEvery * 0.5, grounded: false };
}

export function stepSlime(s, grid, dt) {
  // hop
  s.hopT -= dt;
  if (s.grounded && s.hopT <= 0) {
    // look ahead: wall, or a big drop → turn around first
    const aheadX = s.dir > 0 ? s.x + s.w + 4 : s.x - 4;
    const footY = s.y + s.h - 1;
    const wall = solidAt(grid, aheadX, footY);
    let drop = 0;
    while (drop < 3 && !solidAt(grid, aheadX, footY + 1 + drop * T)) drop++;
    if (wall || drop >= 3) s.dir = -s.dir;
    s.vy = -SLIME.hopSpeed;
    s.vx = s.dir * SLIME.hopDrift;
    s.hopT = SLIME.hopEvery;
    s.grounded = false;
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

// ---- bats ----

export function createBat(x, y, dir) {
  return { kind: 'bat', x, y, w: 10, h: 8, dir, baseY: y, t: Math.random() * 6 };
}

export function stepBat(b, grid, dt) {
  b.t += dt;
  const nx = b.x + b.dir * BAT.speed * dt;
  const edge = b.dir > 0 ? nx + b.w : nx;
  if (solidAt(grid, edge, b.y + b.h / 2)) b.dir = -b.dir;
  else b.x = nx;
  const ny = b.baseY + Math.sin(b.t * BAT.waveSpeed) * BAT.waveHeight;
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

export function spawnSpot(grid, rng, { kind, near, avoid }) {
  const [top, bottom] = kind === 'bat' ? [LAYERS.deep.top, LAYERS.deep.bottom] : [LAYERS.dirt.top + 2, LAYERS.stone.bottom];
  for (let i = 0; i < 30; i++) {
    const cx = near.cx + rng.int(-20, 20);
    const cy = near.cy + rng.int(-12, 12);
    if (cy < top || cy > bottom || !grid.inside(cx, cy)) continue;
    if (avoid && cx >= avoid.x0 && cx <= avoid.x1 && cy >= avoid.y0 && cy <= avoid.y1) continue;
    if (grid.get(cx, cy) !== B.AIR) continue;
    if (kind === 'slime' && !isSolid(grid.get(cx, cy + 1))) continue;
    if (kind === 'bat' && grid.get(cx, cy + 1) === B.LAVA) continue;
    return { cx, cy };
  }
  return null;
}
