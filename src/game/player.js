// Player movement and mining as a pure step function over the grid.
// Position (x, y) is the top-left of a PLAYER.w × PLAYER.h box, in pixels.

import { B, isSolid, isBoulder, isSlippery } from '../world/blocks.js';
import { mineTime, mineCell } from '../world/grid.js';
import { TILE, PLAYER, ICE, JET } from '../tuning.js';

const T = TILE;
const EPS = 0.001;

export function createPlayer({ x, y }) {
  return {
    x, y, vx: 0, vy: 0,
    grounded: false, climbing: false, facing: 1,
    mining: null, jumpHeld: false, knock: null, airJumpsUsed: 0, fuel: JET.fuel, jumpHeldT: 0,
  };
}

// Bonked: fly back a little, away from `dir`'s opposite (dir = -1 pushes left).
export function knockback(p, dir) {
  p.knock = { vx: dir * PLAYER.knockSpeed, t: PLAYER.knockTime };
  p.vy = -PLAYER.knockLift;
  p.mining = null;
  p.climbing = false;
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

export function stepPlayer(p, intent, grid, { pickLevel = 0, dt, canMine = true, digMul = 1, walkMul = 1, gravityMul = 1, airJumps = 0, windX = 0, grip = false,
  jumpMul = 1, jetpack = false,
}) {
  const out = { mined: [], bounced: false, stepped: false, jumped: false, sprung: false, doubleJumped: false, jetting: false };
  const jumpSpeed = PLAYER.jumpSpeed * jumpMul;
  const gravity = PLAYER.gravity * gravityMul;
  const maxFall = PLAYER.maxFall * Math.sqrt(gravityMul);
  let ix = intent.moveX || 0;
  let iy = intent.moveY || 0;
  const knocked = p.knock && p.knock.t > 0;
  if (knocked) {
    p.knock.t -= dt;
    ix = 0;
    iy = 0;
    intent = { ...intent, jump: false };
  }
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
    // standing across a 1-wide hole (held up by its edge): line up and drop in
    if (!isSolid(below) && below !== B.LADDER && p.grounded) snapToColumn();
  }
  if (p.climbing || target) snapToColumn();

  // jump (on the press, not while held)
  const jumpPressed = intent.jump && !p.jumpHeld;
  p.jumpHeld = !!intent.jump;
  p.jumpHeldT = intent.jump ? (p.jumpHeldT ?? 0) + dt : 0;
  if (p.fuel === undefined) p.fuel = JET.fuel;

  // in water: slow sinking, swim up with up or A, hop out at the surface
  // centre or feet in water (bobbing at the surface counts)
  const inWater = grid.get(cx, cy) === B.WATER || grid.get(cx, Math.floor((p.y + PLAYER.h - 1) / T)) === B.WATER;
  p.inWater = inWater;
  if (inWater && !inLadder) {
    const surface = grid.get(cx, cy - 1) !== B.WATER && !isSolid(grid.get(cx, cy - 1));
    if (jumpPressed && surface) {
      p.vy = -jumpSpeed;
      out.jumped = true;
    } else if (iy < 0 || intent.jump) {
      p.vy = Math.max(-PLAYER.swimUp, p.vy - gravity * dt);
    } else {
      p.vy = Math.min(PLAYER.swimMaxFall, p.vy + gravity * PLAYER.swimGravity * dt);
    }
    p.climbing = false;
  } else if (jumpPressed && (p.grounded || inLadder)) {
    p.vy = -jumpSpeed;
    p.climbing = false;
    out.jumped = true;
  } else if (jumpPressed && !p.climbing && p.airJumpsUsed < airJumps) {
    // the Moon Pup's double jump: one more hop in mid-air
    p.vy = -PLAYER.jumpSpeed * PLAYER.airJump;
    p.airJumpsUsed++;
    out.jumped = true;
    out.doubleJumped = true;
  } else if (jetpack && !p.grounded && !p.climbing && !knocked && intent.jump && p.jumpHeldT > JET.hold && p.fuel > 0) {
    // the Jetpack: keep holding jump in the air and you fly up
    p.vy = Math.max(-JET.maxUp, p.vy - JET.thrust * dt);
    p.fuel = Math.max(0, p.fuel - dt);
    out.jetting = true;
  } else if (p.climbing) {
    p.vy = iy * PLAYER.climbSpeed;
  } else if (inLadder && p.vy >= 0) {
    p.vy = 0; // hang on the ladder (also catches a fall)
  } else {
    p.vy = Math.min(maxFall, p.vy + gravity * dt);
  }
  const want = ix * PLAYER.walkSpeed * walkMul * (inWater ? PLAYER.swimSlow : 1);
  // standing on Saturn's ice: slow to speed up, slow to stop (the Gloves grip)
  const onIce = !grip && !knocked && !inWater && p.grounded && columnsOf(p.x).some((c) => isSlippery(grid.get(c, footRow)));
  p.sliding = onIce && Math.abs(p.vx - want) > 1;
  if (knocked) p.vx = p.knock.vx;
  else if (onIce) {
    const rate = (want === 0 || Math.sign(want) !== Math.sign(p.vx) ? ICE.friction : ICE.accel) * dt;
    p.vx = Math.abs(want - p.vx) <= rate ? want : p.vx + Math.sign(want - p.vx) * rate;
  } else p.vx = want;
  // a Mars dust storm pushes you along (not on a ladder, in water or mid-bonk)
  if (windX && !knocked && !p.climbing && !inLadder && !inWater) p.vx += windX;
  // Stepping sideways off a ladder: line up with the row first, so the box
  // doesn't straddle two rows and snag on the one we didn't dig.
  if (ix && inLadder && !p.climbing && p.vy === 0) p.y = (cy + 1) * T - PLAYER.h;

  // move x
  let blockedX = 0;
  if (p.vx) {
    const nx = p.x + p.vx * dt;
    const edge = p.vx > 0 ? nx + PLAYER.w - EPS : nx;
    const col = Math.floor(edge / T);
    if (rowsOf(p.y).some((r) => isSolid(grid.get(col, r)))) {
      p.x = p.vx > 0 ? col * T - PLAYER.w : (col + 1) * T;
      blockedX = Math.sign(p.vx);
      if (!knocked) p.vx = 0; // (a slide on ice stops at the wall)
    } else {
      p.x = nx;
    }
  }

  // blocked sideways: step up a 1-block ledge, or mine it (not when only the wind pushed you there)
  if (blockedX && (ix || knocked) && (p.grounded || inLadder)) {
    const tc = blockedX > 0 ? Math.floor((p.x + PLAYER.w + 0.5) / T) : Math.floor((p.x - 0.5) / T);
    const row = cy;
    if (isSolid(grid.get(tc, row))) {
      const leanOn = isBoulder(grid.get(tc, row)) || grid.get(tc, row) === B.BOOM; // push or light it instead
      const canStep = !leanOn && p.grounded && !isSolid(grid.get(tc, row - 1)) && !isSolid(grid.get(cx, row - 1));
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
        // spring blocks bounce you back up (unless you're pushing down to dig one)
        if (iy <= 0 && cols.some((c) => grid.get(c, row) === B.SPRING)) {
          p.vy = -PLAYER.springSpeed;
          out.sprung = true;
        }
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
  if (p.grounded || p.climbing || inWater) { p.airJumpsUsed = 0; p.fuel = JET.fuel; }

  // mining progress
  if (!canMine) target = null;
  if (target) {
    const m = p.mining;
    if (m && m.cx === target.x && m.cy === target.y) {
      m.t += dt;
      m.need = mineTime(grid.get(target.x, target.y), pickLevel) / digMul; // the pick may have changed
      if (m.need === Infinity) m.t = 0; // bouncing off doesn't bank progress
    } else {
      const need = mineTime(grid.get(target.x, target.y), pickLevel) / digMul;
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
