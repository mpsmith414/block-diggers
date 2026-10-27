// Jelly Planet: Wobble Tower. Everything bounces: land on jelly and it
// throws you back up (and wobbles). Hold A as you land for a super bounce,
// higher each time in a row. Wafer ledges catch you (jump on them with A).
// Gummy bears boing you upward, and a gumball blows a bubble that floats you
// up a long way. Jelly beans line the climb. At the top: the Jelly Castle,
// and the Jelly Crown.

import Phaser from 'phaser';
import { jellyLevel, bounce, climbed, JELLY, BOUNCE, JL, STONE_W } from '../../game/wonder/jelly.js';
import { moveBody, touching } from '../../game/wonder/body.js';
import { walkerBody, stepWalker, bakeTiles, createPickups } from './kit.js';
import { TILE } from '../../tuning.js';

const T = TILE;
const BEAN_TINTS = [0xff5a6a, 0xffd84a, 0x6ad07a, 0x4ab0ff, 0xb07ae0, 0xff9a3a, 0xff8ac8];
const BEAR_TINTS = [0xff5a6a, 0x6ad07a, 0xffb04a, 0x4ab0ff];

export function createJelly(scene) {
  const L = jellyLevel();
  const { level } = L;
  const W = level.w * T;
  const H = level.h * T;
  const GY = L.ground * T;
  let beans = 0;
  let partied = false;

  drawBackdrop(scene, W, H);
  bakeTiles(scene, level, 'jelly-tiles', (n) => ({ [JL.GROUND]: 0, [JL.WAFER]: 1, [JL.WALL]: 2 }[n] ?? null), 2);
  // the jelly blocks are sprites, so they can wobble
  const stones = L.stones.map((s) => ({ ...s, sprite: scene.add.image(s.x0 * T, (s.row + 1) * T, 'jelly-block', s.color).setOrigin(0, 1).setDepth(3) }));
  const stoneAt = (x, y) => stones.find((s) => y === s.row && x >= s.x0 && x < s.x0 + STONE_W);
  // lollipops along the walls
  for (let y = L.ground; y > L.top; y -= 9) {
    scene.add.image(T + 6, y * T, 'jelly-lolly').setOrigin(0.5, 1).setDepth(1).setAlpha(0.9);
    scene.add.image(W - T - 6, (y - 4) * T, 'jelly-lolly').setOrigin(0.5, 1).setDepth(1).setAlpha(0.9).setFlipX(true);
  }
  // the castle on top
  const cx = L.castle.x * T;
  scene.add.image(cx, L.top * T, 'jelly-castle').setOrigin(0.5, 1).setDepth(1);

  const pickups = createPickups(scene, L.beans.map((b, k) => ({ x: b.x * T + 8, y: b.y * T + 8, key: 'jelly-bean', tint: BEAN_TINTS[k % BEAN_TINTS.length], scale: 1.4 })), { size: 12 });
  const bears = L.bears.map((b, k) => ({ ...b, x: (b.x0 + (k * 7) % (b.x1 - b.x0)) * T, dir: k % 2 ? -1 : 1, sprite: scene.add.sprite(0, 0, 'jelly-bear', 0).setOrigin(0.5, 1).setDepth(25).setTint(BEAR_TINTS[k % BEAR_TINTS.length]).setAlpha(0.92) }));
  const gumballs = L.gumballs.map((g) => ({ ...g, back: 0, sprite: scene.add.image(g.x * T + 8, g.y * T + 8, 'jelly-gumball').setDepth(24) }));
  for (const g of gumballs) scene.tweens.add({ targets: g.sprite, y: g.sprite.y - 4, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  // ---------- the bouncers ----------

  const spawn = (a) => {
    const at = a.at ?? { x: scene.mod.pad.x + (a.slot ? 14 : -14), y: GY };
    a.b = walkerBody(at.x, at.y);
    a.combo = 0;
    a.floatT = 0;
    a.best = a.b.y + a.b.h;
    a.bubble = scene.add.image(0, 0, 'jelly-bubble').setDepth(32).setVisible(false);
  };

  const wobble = (s, hard) => {
    scene.tweens.killTweensOf(s.sprite);
    s.sprite.setScale(1);
    scene.tweens.add({ targets: s.sprite, scaleY: hard ? 0.6 : 0.78, duration: 70, yoyo: true, ease: 'Quad.easeOut', onComplete: () => {
      scene.tweens.add({ targets: s.sprite, scaleY: 1.08, duration: 90, yoyo: true, repeat: 1 });
    } });
  };

  const pop = (a) => {
    a.floatT = 0;
    a.bubble.setVisible(false);
    scene.events.emit('bubblePop');
    scene.effects.sparkle(a.b.x + 6, a.b.y + 4, 0xff8ac8, 8);
  };

  const step = (a, i, e, dt, time) => {
    const b = a.b;
    if (a.floatT > 0) {
      // floating up in a bubblegum bubble
      a.floatT -= dt;
      b.vx = (i.moveX || 0) * 70;
      if (i.moveX) b.facing = Math.sign(i.moveX);
      b.vy = -BOUNCE.floatUp;
      const out = moveBody(b, level, dt, {});
      if (a.floatT <= 0 || out.ceiling) pop(a);
      b.grounded = false;
    } else {
      if (e.a) b.jumpPressed = true;
      const out = stepWalker(b, i, level, dt, { gravity: JELLY.gravity, maxFall: JELLY.maxFall, jump: BOUNCE.wafer });
      if (out.jumped) scene.events.emit('jump', a);
      const jelly = out.floor?.map((c) => stoneAt(c.x, c.y)).find(Boolean);
      if (jelly) {
        const r = bounce(out.impact, !!i.jump, a.combo);
        b.vy = r.vy;
        b.grounded = false;
        const superB = r.combo > 0;
        if (superB && r.combo > a.combo) scene.effects.sparkle(b.x + 6, b.y + b.h, 0xffe066, 4 + r.combo * 3);
        a.combo = r.combo;
        wobble(jelly, superB);
        scene.events.emit('sfx', superB ? 'superbounce' : 'boing');
        if (a.combo === BOUNCE.supers.length) scene.fun();
      } else if (out.floor) a.combo = 0;
    }
    // jelly beans
    for (const p of pickups.take(b)) { beans++; scene.events.emit('pickup'); scene.effects.sparkle(p.x, p.y, p.tint, 4); }
    // gummy bears boing you up
    for (const bear of bears) {
      if (a.floatT <= 0 && b.vy >= 0 && touching(b, { x: bear.x - 6, y: (bear.y + 1) * T - 14, w: 12, h: 14 })) {
        b.vy = -BOUNCE.bear;
        scene.events.emit('sfx', 'boing');
        scene.tweens.add({ targets: bear.sprite, scaleY: 0.6, scaleX: 1.3, duration: 90, yoyo: true });
      }
    }
    // a gumball: blow a bubble and float up
    for (const g of gumballs) {
      if (g.back > 0 || a.floatT > 0) continue;
      if (touching(b, { x: g.x * T + 1, y: g.y * T + 1, w: 14, h: 14 })) {
        g.back = 6;
        g.sprite.setVisible(false);
        a.floatT = BOUNCE.float;
        a.combo = 0;
        scene.events.emit('sfx', 'blorp');
      }
    }
    a.best = Math.min(a.best, b.y + b.h);
    // the castle!
    if (!partied && !a.hidden && b.grounded && Math.abs(b.y + b.h - L.top * T) < 2) {
      partied = true;
      scene.prizeParty(cx, L.top * T - 40);
    }
    scene.drawCharacter(a, b, dt, time);
    // stretched going up fast, squashed coming down
    if (a.floatT <= 0 && !b.grounded) a.sprite.setScale(1 - Math.min(0.15, Math.abs(b.vy) / 4000), 1 + Math.min(0.2, Math.abs(b.vy) / 3000));
    a.bubble.setVisible(a.floatT > 0 && !a.hidden).setPosition(a.sprite.x, a.sprite.y - 8);
  };

  const update = (dt, time) => {
    for (const bear of bears) {
      bear.x += bear.dir * 22 * dt;
      if (bear.x > bear.x1 * T) bear.dir = -1;
      if (bear.x < bear.x0 * T) bear.dir = 1;
      bear.sprite.setPosition(bear.x, (bear.y + 1) * T).setFlipX(bear.dir < 0).setFrame(Math.floor(time / 300) % 2);
    }
    for (const g of gumballs) {
      if (g.back <= 0) continue;
      g.back -= dt;
      if (g.back <= 0) { g.sprite.setVisible(true).setScale(0); scene.tweens.add({ targets: g.sprite, scale: 1, duration: 300, ease: 'Back.easeOut' }); }
    }
  };

  const awake = () => scene.avatars.filter((a) => a && !a.hidden);

  return {
    world: { w: W, h: H },
    pad: { x: L.pad.x * T + 8, y: GY },
    zoom: [1.15, 1.5],
    lead: () => ({ x: 0, y: -30 }),
    goal: () => {
      const all = awake();
      const progress = Math.max(0, ...all.map((a) => climbed(a.best, L)));
      return { progress, beans, marks: all.map((a) => ({ char: a.char, p: climbed(a.b.y + a.b.h, L) })) };
    },
    spawn,
    step,
    update,
    focus: (a) => ({ x: a.b.x + a.b.w / 2, y: a.b.y + a.b.h / 2 }),
    place: (a, x, y) => { a.b.x = x - a.b.w / 2; a.b.y = Math.min(y, GY) - a.b.h; a.b.vx = 0; a.b.vy = 0; if (a.floatT > 0) pop(a); },
    onFoot: (a) => a.b.grounded,
    cheer: (a) => { a.b.vy = -300; },
  };
}

// A pink sky, lilac higher up, with candy clouds drifting.
function drawBackdrop(scene, W, H) {
  const g = scene.add.graphics().setDepth(-30);
  g.fillGradientStyle(0xc8a0f0, 0xc8a0f0, 0xffc8e0, 0xffc8e0, 1);
  g.fillRect(0, 0, W, H);
  for (let k = 0; k < 26; k++) {
    const c = scene.add.image((k * 137) % W, (k * 97) % H, 'upside-cloud').setDepth(-29).setTint(k % 2 ? 0xffe0f0 : 0xfff0ff).setAlpha(0.7).setScale(0.8 + (k % 3) * 0.3).setScrollFactor(0.6, 0.85);
    scene.tweens.add({ targets: c, x: c.x + 40, duration: 6000 + k * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}
