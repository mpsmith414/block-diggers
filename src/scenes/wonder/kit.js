// Bits every Wonder planet module shares: a walking body (walk, jump, step
// up a ledge, drop through a ledge by holding down), baked tile art, things
// to pick up, and the A prompt over things you can use.

import Phaser from 'phaser';
import { moveBody, onFloor, cellType } from '../../game/wonder/body.js';
import { TILE, PLAYER } from '../../tuning.js';

const T = TILE;
export const WALK = { speed: 84, jump: 190, gravity: 900, maxFall: 420 };

// A player-sized body, standing with its feet at (x, y).
export function walkerBody(x, y) {
  return { x: x - PLAYER.w / 2, y: y - PLAYER.h, w: PLAYER.w, h: PLAYER.h, vx: 0, vy: 0, facing: 1, grounded: false, climbing: false, mining: null, airJumps: 0, downT: 0 };
}

// One frame of walking about. Returns what moveBody hit, plus `jumped`.
// opts: speed, jump, gravity (signed), maxFall, airJumps (extra jumps in the air).
export function stepWalker(b, i, level, dt, opts = {}) {
  const o = { ...WALK, ...opts };
  const g = Math.sign(o.gravity) || 1;
  const wasGrounded = onFloor(level, b, o.gravity);
  b.vx = (i.moveX || 0) * o.speed;
  if (i.moveX) b.facing = Math.sign(i.moveX);
  // hold down a moment to drop through the ledge you're on
  b.downT = (i.moveY || 0) > 0.5 ? b.downT + dt : 0;
  let jumped = false;
  if (b.jumpPressed) {
    if (wasGrounded) { b.vy = -g * o.jump; jumped = true; b.airJumps = 0; }
    else if (b.airJumps < (o.airJumps ?? 0)) { b.vy = -g * o.jump * 0.85; b.airJumps++; jumped = true; }
  }
  b.jumpPressed = false;
  const out = moveBody(b, level, dt, { gravity: o.gravity, maxFall: o.maxFall, drop: b.downT > 0.2 });
  // walked into a one-block step: hop up onto it (as at camp)
  const blocked = out.left || out.right;
  if (blocked && wasGrounded && i.moveX && g > 0) {
    const col = blocked[0].x;
    const foot = Math.floor((b.y + b.h - 1) / T);
    const free = (c, r) => cellType(level, c, r) !== 'solid';
    if (!free(col, foot) && free(col, foot - 1) && free(col, foot - 2) && free(Math.floor((b.x + b.w / 2) / T), foot - 1)) {
      b.y = foot * T - b.h;
      b.x += Math.sign(i.moveX) * 3;
      b.vy = 0;
    }
  }
  b.grounded = onFloor(level, b, o.gravity);
  if (b.grounded) b.airJumps = 0;
  out.jumped = jumped;
  return out;
}

// Bake a level's tiles into big textures, a chunk at a time. `frameOf(n, x, y)`
// gives the frame of `key` to draw for tile n at (x, y), or null for none.
export function bakeTiles(scene, level, key, frameOf, depth = 0) {
  const CH = 32; // tiles per chunk side (512 px)
  const out = [];
  for (let cy = 0; cy < level.h; cy += CH) {
    for (let cx = 0; cx < level.w; cx += CH) {
      const w = Math.min(CH, level.w - cx);
      const h = Math.min(CH, level.h - cy);
      let rt = null;
      for (let y = cy; y < cy + h; y++) {
        for (let x = cx; x < cx + w; x++) {
          const f = frameOf(level.get(x, y), x, y);
          if (f === null || f === undefined) continue;
          if (!rt) {
            rt = scene.add.renderTexture(cx * T, cy * T, w * T, h * T).setOrigin(0).setDepth(depth);
            rt.beginDraw();
          }
          rt.batchDrawFrame(key, f, (x - cx) * T, (y - cy) * T);
        }
      }
      if (rt) { rt.endDraw(); out.push(rt); }
    }
  }
  return out;
}

// Things to pick up: each bobs gently; touching one takes it. `items` are
// { x, y, key, frame?, tint?, value? } in pixels (the middle of the thing).
export function createPickups(scene, items, { depth = 20, size = 12 } = {}) {
  const list = items.map((it) => {
    const img = scene.add.image(it.x, it.y, it.key, it.frame).setDepth(depth);
    if (it.tint) img.setTint(it.tint);
    if (it.scale) img.setScale(it.scale);
    scene.tweens.add({ targets: img, y: it.y - 2, duration: 700 + ((it.x * 7) % 400), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return { ...it, img, taken: false };
  });
  return {
    list,
    // the pickups this box touches now (and takes them)
    take(box) {
      const got = [];
      for (const p of list) {
        if (p.taken) continue;
        if (Math.abs(p.x - (box.x + box.w / 2)) < (box.w + size) / 2 && Math.abs(p.y - (box.y + box.h / 2)) < (box.h + size) / 2) {
          p.taken = true;
          got.push(p);
          scene.tweens.killTweensOf(p.img);
          scene.tweens.add({ targets: p.img, y: p.y - 14, scale: (p.scale ?? 1) * 1.6, alpha: 0, duration: 300, onComplete: () => p.img.destroy() });
        }
      }
      return got;
    },
    left() { return list.filter((p) => !p.taken).length; },
  };
}

// The A prompt: one bobbing button over the nearest usable spot.
export function createPrompt(scene) {
  const img = scene.add.image(0, 0, 'btn-a').setScale(1.4).setDepth(75).setVisible(false);
  let shown = null;
  return {
    // call once a frame with the spot to prompt at (or null)
    show(spot, time) {
      shown = spot;
      img.setVisible(!!spot);
      if (spot) img.setPosition(spot.x, spot.y + Math.sin(time / 200) * 2);
    },
    get spot() { return shown; },
  };
}

// Little floaty things flying from a spot to a player (candy into the bucket,
// pearls into your pouch); calls `done` as each arrives.
export function flyTo(scene, from, toBox, key, n, done, { tint = null, spread = 18 } = {}) {
  for (let k = 0; k < n; k++) {
    const img = scene.add.image(from.x, from.y, key).setDepth(85);
    if (tint) img.setTint(Array.isArray(tint) ? tint[k % tint.length] : tint);
    const mx = from.x + Phaser.Math.Between(-spread, spread);
    const my = from.y - Phaser.Math.Between(18, 34);
    scene.tweens.add({
      targets: img, x: mx, y: my, duration: 260, delay: k * 90, ease: 'Quad.easeOut',
      onComplete: () => scene.tweens.add({
        targets: img, x: toBox.x + toBox.w / 2, y: toBox.y, scale: 0.6, duration: 260, ease: 'Quad.easeIn',
        onComplete: () => { img.destroy(); done(k); },
      }),
    });
  }
}

export const feetOf = (b) => ({ x: b.x + b.w / 2, y: b.y + b.h });
export const middleOf = (b) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
