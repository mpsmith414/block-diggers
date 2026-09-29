// The Moon Skate Park's half pipe: a smooth U (two quarter pipes and a flat
// bottom) you ride along on a skateboard. Pure: the mine steps it and draws it.
//
//  - on the pipe, gravity pulls you along the slope; push on the flat, and
//    hold the stick on a wall to pump (you go faster and faster)
//  - fly off a lip and you go straight up (big Moon air), then drop back in
//  - A on the pipe is an ollie; A in the air is a random trick (combo them!)
//  - every landing is safe; each trick landed pops out a gem

import { SKATE } from '../tuning.js';

export const TRICKS = ['kickflip', 'spin360', 'superman', 'grab', 'handstand', 'backflip'];

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// A pipe whose left lip is at x0 (px), with its flat bottom on `floor` (px).
export function createPipe(x0, floor, { R = SKATE.R, F = SKATE.F } = {}) {
  const q = (Math.PI * R) / 2;
  return { x0, x1: x0 + 2 * R + F, floor, lipY: floor - R, R, F, q, L: 2 * q + F };
}

// The point `s` px along the curve from the left lip, and its direction of
// travel (tx, ty) for growing s; `angle` is how far a rider there leans.
export function curveAt(pipe, s) {
  const { x0, floor, R, F, q, L } = pipe;
  const d = clamp(s, 0, L);
  let x;
  let y;
  let tx;
  let ty;
  if (d <= q) {
    const a = d / R;
    x = x0 + R - R * Math.cos(a);
    y = floor - R + R * Math.sin(a);
    tx = Math.sin(a);
    ty = Math.cos(a);
  } else if (d <= q + F) {
    x = x0 + R + (d - q);
    y = floor;
    tx = 1;
    ty = 0;
  } else {
    const b = (d - q - F) / R;
    x = x0 + R + F + R * Math.sin(b);
    y = floor - R + R * Math.cos(b);
    tx = Math.cos(b);
    ty = -Math.sin(b);
  }
  return { x, y, tx, ty, angle: Math.atan2(ty, tx) };
}

// Where along the curve is the point above x?
export function sAtX(pipe, x) {
  const { x0, R, F, q } = pipe;
  const cx = clamp(x, x0, pipe.x1);
  if (cx <= x0 + R) return Math.acos(clamp((x0 + R - cx) / R, -1, 1)) * R;
  if (cx <= x0 + R + F) return q + (cx - x0 - R);
  return q + F + Math.asin(clamp((cx - x0 - R - F) / R, -1, 1)) * R;
}

// Hop on a board at x (on the pipe, standing still).
export function createSkate(pipe, x) {
  const s = sAtX(pipe, x);
  const c = curveAt(pipe, s);
  return { s, v: 0, air: false, x: c.x, y: c.y, vx: 0, vy: 0, angle: c.angle, tricks: [], trick: null, last: null };
}

function takeOff(sk, vx, vy) {
  sk.air = true;
  sk.vx = vx;
  sk.vy = vy;
}

// Advance one step. `intent.moveX` is -1..1; `edges.jump` is true on the frame
// A is pressed. `gemsLeft` caps the gems this landing may give. Returns what
// happened: { type: 'air' }, { type: 'trick', kind }, { type: 'land', tricks, gems }.
export function stepSkate(sk, pipe, intent, edges, dt, rng, gemsLeft = SKATE.gemCap) {
  const out = [];
  const g = SKATE.g;
  const moveX = intent.moveX ?? 0;
  if (!sk.air) {
    let c = curveAt(pipe, sk.s);
    if (edges.jump) {
      // an ollie: pop up off the board, away from the pipe
      takeOff(sk, sk.v * c.tx + c.ty * SKATE.ollie, sk.v * c.ty - c.tx * SKATE.ollie);
      out.push({ type: 'air' });
    } else {
      sk.v += g * c.ty * dt;
      if (Math.abs(c.tx) > 0.95) sk.v += SKATE.push * moveX * dt;
      else if (moveX !== 0 && Math.abs(sk.v) > 5) sk.v += SKATE.pump * Math.sign(sk.v) * dt;
      sk.v -= sk.v * SKATE.friction * dt;
      sk.v = clamp(sk.v, -SKATE.max, SKATE.max);
      sk.s += sk.v * dt;
      if (sk.s < 0 || sk.s > pipe.L) {
        // off the lip: straight up (never higher than the room allows)
        const up = Math.min(Math.abs(sk.v), Math.sqrt(2 * g * SKATE.maxAir));
        sk.s = clamp(sk.s, 0, pipe.L);
        c = curveAt(pipe, sk.s);
        sk.x = c.x + (sk.s === 0 ? 1 : -1);
        sk.y = c.y;
        takeOff(sk, 0, -up);
        out.push({ type: 'air' });
      } else {
        c = curveAt(pipe, sk.s);
        sk.x = c.x;
        sk.y = c.y;
        sk.angle = c.angle;
      }
    }
    if (!sk.air) return out;
  }

  // in the air: tricks, gravity, and landing back on the pipe
  if (sk.trick) {
    sk.trick.t += dt;
    if (sk.trick.t >= SKATE.trickTime) sk.trick = null;
  } else if (edges.jump && out.length === 0) {
    const choices = TRICKS.filter((k) => k !== sk.last);
    const kind = choices[Math.floor(rng.next() * choices.length)];
    sk.trick = { kind, t: 0 };
    sk.last = kind;
    sk.tricks.push(kind);
    out.push({ type: 'trick', kind });
  }
  sk.vy += g * dt;
  sk.x = clamp(sk.x + sk.vx * dt, pipe.x0 + 1, pipe.x1 - 1);
  sk.y += sk.vy * dt;
  const s = sAtX(pipe, sk.x);
  const c = curveAt(pipe, s);
  if (sk.vy > 0 && sk.y >= c.y) {
    sk.air = false;
    sk.s = s;
    sk.x = c.x;
    sk.y = c.y;
    sk.angle = c.angle;
    sk.v = clamp(sk.vx * c.tx + sk.vy * c.ty, -SKATE.max, SKATE.max);
    const n = sk.tricks.length;
    const gems = Math.max(0, Math.min(n + (n >= 3 ? 1 : 0), gemsLeft));
    out.push({ type: 'land', tricks: sk.tricks, gems });
    sk.tricks = [];
    sk.trick = null;
  }
  return out;
}
