// Player movement and mining as a pure step function over the grid.
// Position (x, y) is the top-left of a PLAYER.w × PLAYER.h box, in pixels.

import { B, isSolid } from '../world/blocks.js';
import { mineTime, mineCell } from '../world/grid.js';
import { TILE, PLAYER } from '../tuning.js';

const T = TILE;
const EPS = 0.001;

export function createPlayer({ x, y }) {
  return {
    x, y, vx: 0, vy: 0,
    grounded: false, climbing: false, facing: 1,
    mining: null, jumpHeld: false,
  };
}

// Top-left pixel position that stands a player on the floor of cell (cx, cy).
export function standAt(cx, cy) {
  return { x: cx * T + (T - PLAYER.w) / 2, y: (cy + 1) * T - PLAYER.h };
}

export function playerCell(p) {
  return {
    cx: Math.floor((p.x + PLAYER.w / 2) / T),
    cy: Math.floor((p.y + PLAYER.h / 2) / T),
  };
}

const ladderTop = (grid, cx, cy) => grid.get(cx, cy) === B.LADDER && grid.get(cx, cy - 1) !== B.LADDER;
const columnsOf = (x) => {
  const a = Math.floor(x / T);
  const b = Math.floor((x + PLAYER.w - EPS) / T);
  return a === b ? [a] : [a, b];
};
const rowsOf = (y) => {
  const out = [];
  for (let r = Math.floor(y / T); r <= Math.floor((y + PLAYER.h - EPS) / T); r++) out.push(r);
  return out;
};

export function stepPlayer(p, intent, grid, { pickLevel = 0, dt }) {
  const out = { mined: [], bounced: false, stepped: false };
  let ix = intent.moveX || 0;
  let iy = intent.moveY || 0;
  if (Math.abs(iy) > Math.abs(ix)) ix = 0;
  else iy = 0;
  if (ix) p.facing = Math.sign(ix);

  const { cx, cy } = playerCell(p);
  const footRow = Math.floor((p.y + PLAYER.h + 0.5) / T);
  const footInLadder = grid.get(cx, Math.floor((p.y + PLAYER.h - 0.5) / T)) === B.LADDER;
  const inLadder = grid.get(cx, cy) === B.LADDER || footInLadder;
  const snapToColumn = () => { p.x = cx * T + (T - PLAYER.w) / 2; };

  let target = null; // { x, y, ladder }
  p.climbing = false;

  if (iy < 0) {
    const above = grid.get(cx, cy - 1);
    if (inLadder || above === B.LADDER) p.climbing = true;
    if (isSolid(above) && (p.grounded || inLadder)) target = { x: cx, y: cy - 1, ladder: true };
  } else if (iy > 0) {
    const below = grid.get(cx, footRow);
    if (inLadder || below === B.LADDER) p.climbing = true;
    if (isSolid(below) && (p.grounded || inLadder)) target = { x: cx, y: footRow, ladder: true };
  }
  if (p.climbing || target) snapToColumn();

  // jump (on the press, not while held)
  const jumpPressed = intent.jump && !p.jumpHeld;
  p.jumpHeld = !!intent.jump;

  // vertical speed
  if (jumpPressed && (p.grounded || inLadder)) {
    p.vy = -PLAYER.jumpSpeed;
    p.climbing = false;
  } else if (p.climbing) {
    p.vy = iy * PLAYER.climbSpeed;
  } else if (inLadder && p.vy >= 0) {
    p.vy = 0; // hang on the ladder (also catches a fall)
  } else {
    p.vy = Math.min(PLAYER.maxFall, p.vy + PLAYER.gravity * dt);
  }
  p.vx = ix * PLAYER.walkSpeed;

  // move x
  let blockedX = 0;
  if (p.vx) {
    const nx = p.x + p.vx * dt;
    const edge = p.vx > 0 ? nx + PLAYER.w - EPS : nx;
    const col = Math.floor(edge / T);
    if (rowsOf(p.y).some((r) => isSolid(grid.get(col, r)))) {
      p.x = p.vx > 0 ? col * T - PLAYER.w : (col + 1) * T;
      blockedX = Math.sign(p.vx);
    } else {
      p.x = nx;
    }
  }

  // blocked sideways: step up a 1-block ledge, or mine it
  if (blockedX && (p.grounded || inLadder)) {
    const tc = blockedX > 0 ? Math.floor((p.x + PLAYER.w + 0.5) / T) : Math.floor((p.x - 0.5) / T);
    const row = cy;
    if (isSolid(grid.get(tc, row))) {
      const canStep = p.grounded && !isSolid(grid.get(tc, row - 1)) && !isSolid(grid.get(cx, row - 1));
      if (canStep) {
        p.y = row * T - PLAYER.h;
        p.x = blockedX > 0 ? tc * T + 4 - PLAYER.w : (tc + 1) * T - 4;
        p.vy = 0;
        out.stepped = true;
      } else {
        target = { x: tc, y: row, ladder: false };
      }
    }
  }

  // move y
  const prevBottom = p.y + PLAYER.h;
  if (p.vy) {
    const ny = p.y + p.vy * dt;
    const cols = columnsOf(p.x);
    if (p.vy > 0) {
      const row = Math.floor((ny + PLAYER.h - EPS) / T);
      const hitsSolid = cols.some((c) => isSolid(grid.get(c, row)));
      const onLadderTop = iy <= 0 && prevBottom <= row * T + EPS && cols.some((c) => ladderTop(grid, c, row));
      if (hitsSolid || onLadderTop) {
        p.y = row * T - PLAYER.h;
        p.vy = 0;
      } else {
        p.y = ny;
      }
    } else {
      const row = Math.floor(ny / T);
      if (cols.some((c) => isSolid(grid.get(c, row)))) {
        p.y = (row + 1) * T;
        p.vy = 0;
      } else {
        p.y = ny;
      }
    }
  }

  // grounded: feet exactly on a solid cell or a ladder top
  const bottom = p.y + PLAYER.h;
  const underRow = Math.round(bottom / T);
  p.grounded = Math.abs(bottom - underRow * T) < 0.01 &&
    columnsOf(p.x).some((c) => isSolid(grid.get(c, underRow)) || (iy <= 0 && ladderTop(grid, c, underRow)));

  // mining progress
  if (target) {
    const m = p.mining;
    if (m && m.cx === target.x && m.cy === target.y) {
      m.t += dt;
      m.need = mineTime(grid.get(target.x, target.y), pickLevel); // the pick may have changed
      if (m.need === Infinity) m.t = 0; // bouncing off doesn't bank progress
    } else {
      const need = mineTime(grid.get(target.x, target.y), pickLevel);
      p.mining = { cx: target.x, cy: target.y, t: dt, need, ladder: target.ladder };
      if (need === Infinity) out.bounced = true;
    }
    if (p.mining.t >= p.mining.need) {
      const { id, drop } = mineCell(grid, target.x, target.y, { ladder: target.ladder });
      out.mined.push({ x: target.x, y: target.y, id, drop });
      p.mining = null;
    }
  } else {
    p.mining = null;
  }

  return out;
}
