// Tiny Planet: Bug-Sized Backyard. You're bug-sized in a giant's garden.
// Walk and jump; climb daisy leaves; bounce on mushroom caps; munch through
// the giant cookie and the sandwich by pushing into them (any way, like
// digging; seeds are baked inside); ride the ants; jump on the sleeping cat's
// tummy to bounce sky-high; stand on the ladybug and she flies you up to the
// high leaves. Twenty-five sunflower seeds get planted in the flower pot at
// the end: a giant sunflower shoots up with you on it, to the Golden Acorn.

import Phaser from 'phaser';
import { tinyLevel, TINY, TY, munchable, bounceOf } from '../../game/wonder/tiny.js';
import { cellType, touching } from '../../game/wonder/body.js';
import { walkerBody, stepWalker, bakeTiles, createPickups, WALK } from './kit.js';
import { TILE } from '../../tuning.js';

const T = TILE;
const ANT_SPEED = 26;
const RIDE_TIME = 2.6;

export function createTiny(scene) {
  const L = tinyLevel();
  const { level } = L;
  const G = TINY.ground;
  const GY = G * T;
  const W = level.w * T;
  const H = level.h * T;
  let seeds = 0;
  let planted = false;

  drawBackdrop(scene, W, GY);
  // decorations behind the tiles: daisies under the leaves, mushroom stems,
  // the picnic blanket, the strawberry, the watering can
  for (const [x, y] of L.leaves) scene.add.image((x + 2) * T, GY + 2, 'tiny-daisy').setOrigin(0.5, 1).setDepth(0).setScale(0.7, (GY - y * T + 40) / 128);
  for (const m of L.mushrooms) scene.add.image((m.x0 + 1.5) * T, GY + 2, 'tiny-stem').setOrigin(0.5, 1).setDepth(1).setScale(1, (GY - (m.row + 0.5) * T) / 48);
  const blanket = scene.add.graphics().setDepth(1);
  for (let x = 114 * T; x < 152 * T; x += 16) blanket.fillStyle((x / 16) % 2 ? 0xe83a3a : 0xffffff, 1).fillRect(x, GY - 3, 16, 5);
  scene.add.image(137 * T, GY, 'tiny-strawberry').setOrigin(0.5, 1).setDepth(1);
  scene.add.image(194 * T, GY, 'tiny-can').setOrigin(0.5, 1).setDepth(1);

  bakeTiles(scene, level, 'tiny-tiles', (n, x, y) => {
    if (n === TY.SOIL) return y === G ? 0 : 1;
    if (n === TY.LEAF) return 2;
    if (n === TY.MUSH) return 3;
    if (n === TY.CUBE) return 9;
    if (n === TY.HOSE) return 10;
    if (n === TY.POT) return y === L.pot.top ? 12 : 11;
    return null;
  }, 2);
  // the cookie and the sandwich are sprites, cell by cell (they get munched)
  const SANDWICH = { [G - 5]: 6, [G - 4]: 7, [G - 3]: 8, [G - 2]: 7, [G - 1]: 6 };
  const bits = new Map();
  for (let y = 0; y < level.h; y++) {
    for (let x = 0; x < level.w; x++) {
      const n = level.get(x, y);
      if (!munchable(n)) continue;
      const frame = n === TY.COOKIE ? ((x * 7 + y * 3) % 3 === 0 ? 5 : 4) : SANDWICH[y] ?? 6;
      bits.set(`${x},${y}`, scene.add.image(x * T, y * T, 'tiny-tiles', frame).setOrigin(0).setDepth(3));
    }
  }
  // the sleeping cat (its back is the bouncy row)
  const cat = scene.add.image(((L.cat.x0 + L.cat.x1) / 2 + 0.5) * T, GY - 5, 'tiny-cat').setOrigin(0.5, 1).setDepth(4);
  scene.tweens.add({ targets: cat, scaleY: 1.03, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  scene.time.addEvent({
    delay: 1600, loop: true, callback: () => {
      const z = scene.add.bitmapText(cat.x + 96, cat.y - 70, 'pixel', 'Z').setScale(2).setTint(0xffffff).setDepth(5);
      scene.tweens.add({ targets: z, x: z.x + 20, y: z.y - 40, alpha: 0, scale: 3, duration: 1800, onComplete: () => z.destroy() });
    },
  });

  // the hose's nozzle sprays a little fountain
  scene.time.addEvent({
    delay: 120, loop: true, callback: () => {
      const d = scene.add.image(77 * T, (L.hose.row + 0.5) * T, 'pixel').setTint(0x8ad8ff).setDisplaySize(2, 2).setDepth(5);
      scene.tweens.add({ targets: d, x: d.x + 30 + Math.random() * 20, duration: 600 });
      scene.tweens.add({ targets: d, y: { value: GY, ease: 'Quad.easeIn' }, duration: 600, onComplete: () => d.destroy() });
    },
  });

  // seeds: out in the open now; the baked-in ones appear when they're munched free
  const pickups = createPickups(scene, L.seeds.filter((s) => !s.hidden).map((s) => ({ x: s.x * T + 8, y: s.y * T + 8, key: 'tiny-seed' })), { size: 12 });
  const hidden = new Map(L.seeds.filter((s) => s.hidden).map((s) => [`${s.x},${s.y}`, s]));
  const freed = [];

  // the ants, marching back and forth with their crumbs
  const ants = Array.from({ length: 5 }, (_, k) => ({ x: (L.ants.x0 + k * 12) * T, dir: k % 2 ? -1 : 1, sprite: scene.add.sprite(0, GY, 'tiny-ant', 0).setOrigin(0.5, 1).setDepth(20) }));
  // the ladybug taxi
  const lb = { home: { x: L.ladybug.x * T, y: GY - 8 }, busy: false, again: 0 };
  lb.sprite = scene.add.sprite(lb.home.x, lb.home.y, 'tiny-ladybug', 0).setDepth(28);
  // the flower pot's glow, the sunflower (hidden until planted)
  const potX = ((L.pot.x0 + L.pot.x1 + 1) / 2) * T;
  const potY = L.pot.top * T;
  const potGlow = scene.add.image(potX, potY - 6, 'light').setTint(0xffe066).setScale(2).setAlpha(0).setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
  const stalk = scene.add.tileSprite(potX, potY, 16, 0, 'tiny-stalk').setOrigin(0.5, 1).setDepth(1).setVisible(false);
  const flower = scene.add.image(potX, potY, 'tiny-sunflower').setDepth(2).setScale(0).setVisible(false);
  let growing = null;

  // ---------- the player ----------

  const spawn = (a) => {
    const at = a.at ?? { x: scene.mod.pad.x + (a.slot ? 14 : -14), y: GY };
    a.b = walkerBody(at.x, at.y);
    a.munch = null;
    a.ant = null;
    a.ride = null;
  };

  const munchTarget = (a, i) => {
    const b = a.b;
    const cols = [Math.floor((b.x + 1) / T), Math.floor((b.x + b.w - 1) / T)];
    const rows = [Math.floor((b.y + 1) / T), Math.floor((b.y + b.h - 1) / T)];
    const pick = (cells) => cells.find((c) => munchable(level.get(c.x, c.y)));
    if ((i.moveX || 0) > 0.5) return pick(rows.map((y) => ({ x: Math.floor((b.x + b.w + 1) / T), y })));
    if ((i.moveX || 0) < -0.5) return pick(rows.map((y) => ({ x: Math.floor((b.x - 1) / T), y })));
    if ((i.moveY || 0) < -0.5) return pick(cols.map((x) => ({ x, y: Math.floor((b.y - 1) / T) })));
    if ((i.moveY || 0) > 0.5 && b.grounded) return pick(cols.map((x) => ({ x, y: Math.floor((b.y + b.h + 1) / T) })));
    return null;
  };

  const munch = (c) => {
    level.set(c.x, c.y, 0);
    const key = `${c.x},${c.y}`;
    bits.get(key)?.destroy();
    bits.delete(key);
    scene.events.emit('sfx', 'munch');
    scene.effects.chunks(c.x, c.y, null, 0xd8a058);
    const s = hidden.get(key);
    if (s) {
      hidden.delete(key);
      const p = createPickups(scene, [{ x: c.x * T + 8, y: c.y * T + 8, key: 'tiny-seed' }], { size: 12 });
      freed.push(p);
      scene.effects.sparkle(c.x * T + 8, c.y * T + 8, 0xffe066, 8);
    }
  };

  const takeSeeds = (b) => {
    for (const p of [pickups, ...freed]) for (const s of p.take(b)) { seeds++; scene.events.emit('pickup'); scene.effects.sparkle(s.x, s.y, 0xffe066, 4); }
  };

  // the ladybug flies you up to the high leaves along a curve
  const ladybugRide = (a) => {
    lb.busy = true;
    a.ride = { t: 0 };
    scene.events.emit('sfx', 'whirr');
    lb.sprite.setFrame(1);
  };
  const ridePoint = (t) => {
    const p0 = lb.home;
    const p2 = { x: L.ladybug.to.x * T + 8, y: (L.ladybug.to.y + 1) * T - 4 };
    const p1 = { x: (p0.x + p2.x) / 2 - 60, y: p2.y - 80 };
    const u = 1 - t;
    return { x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x, y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y };
  };

  const plant = () => {
    planted = true;
    scene.events.emit('sfx', 'hatch');
    stalk.setVisible(true);
    flower.setVisible(true);
    const riders = scene.avatars.filter((a) => a && !a.hidden && a.b.grounded && Math.abs(a.b.y + a.b.h - potY) < 2);
    growing = { t: 0, riders };
    scene.tweens.add({ targets: potGlow, alpha: 0, duration: 300 });
  };

  const step = (a, i, e, dt, time) => {
    const b = a.b;
    // riding the ladybug
    if (a.ride) {
      a.ride.t += dt / RIDE_TIME;
      const p = ridePoint(Math.min(1, a.ride.t));
      lb.sprite.setPosition(p.x, p.y).setFlipX(false).setFrame(Math.floor(time / 60) % 2);
      b.x = p.x - b.w / 2;
      b.y = p.y - 8 - b.h;
      b.vx = 0;
      b.vy = 0;
      if (a.ride.t >= 1) {
        a.ride = null;
        b.y = L.ladybug.to.y * T + T - b.h - 16;
        lb.again = 3;
        scene.tweens.add({ targets: lb.sprite, x: lb.home.x, y: lb.home.y, duration: 1600, ease: 'Sine.easeInOut', onComplete: () => { lb.busy = false; lb.sprite.setFrame(0); } });
      }
      takeSeeds(b);
      scene.drawCharacter(a, b, dt, time);
      return;
    }
    // growing up on the sunflower
    if (growing?.riders.includes(a)) {
      b.vx = 0;
      b.vy = 0;
      b.x = Phaser.Math.Clamp(b.x, potX - 26, potX + 14);
      b.y = flower.y - 30 - b.h;
      scene.drawCharacter(a, b, dt, time);
      return;
    }
    if (e.a) b.jumpPressed = true;
    if (e.a && a.ant) { b.vy = -WALK.jump; a.ant = null; scene.events.emit('jump', a); }
    const out = stepWalker(b, i, level, dt);
    if (out.jumped) scene.events.emit('jump', a);
    // bouncy things under your feet
    const spring = Math.max(0, ...(out.floor ?? []).map((c) => bounceOf(level.get(c.x, c.y))));
    if (spring && (i.moveY || 0) <= 0.5) {
      b.vy = -spring;
      b.grounded = false;
      const onCat = (out.floor ?? []).some((c) => level.get(c.x, c.y) === TY.CAT);
      scene.events.emit('sfx', onCat ? 'purr' : 'boing');
      if (onCat) {
        scene.fun();
        scene.tweens.add({ targets: cat, scaleY: 0.92, duration: 100, yoyo: true });
      }
    }
    // riding an ant
    a.ant = null;
    if (b.vy >= 0 && !a.hidden) {
      for (const ant of ants) {
        const top = GY - 14;
        if (Math.abs(b.y + b.h - top) < 5 && Math.abs(b.x + b.w / 2 - ant.x) < 12) {
          b.y = top - b.h;
          b.vy = 0;
          b.grounded = true;
          b.x += ant.dir * ANT_SPEED * dt;
          a.ant = ant;
        }
      }
    }
    // munching
    const target = !a.hidden ? munchTarget(a, i) : null;
    if (target && a.munch && a.munch.x === target.x && a.munch.y === target.y) {
      a.munch.t += dt;
      if (a.munch.t >= TINY.munch) { munch(target); a.munch = null; }
    } else a.munch = target ? { ...target, t: dt } : null;
    takeSeeds(b);
    // the ladybug: stand on her
    if (!lb.busy && lb.again <= 0 && !a.hidden && touching(b, { x: lb.home.x - 12, y: lb.home.y - 10, w: 24, h: 16 })) ladybugRide(a);
    // the flower pot, once the bucket's full
    if (scene.goalDone && !planted && !a.hidden && b.grounded && Math.abs(b.y + b.h - potY) < 2 && b.x + b.w / 2 > L.pot.x0 * T && b.x + b.w / 2 < (L.pot.x1 + 1) * T) plant();
    scene.drawCharacter(a, b, dt, time);
    if (a.munch) a.sprite.setScale(1, 0.94 + Math.abs(Math.sin(time / 60)) * 0.06);
  };

  const update = (dt, time) => {
    lb.again = Math.max(0, lb.again - dt);
    for (const ant of ants) {
      ant.x += ant.dir * ANT_SPEED * dt;
      if (ant.x > L.ants.x1 * T) ant.dir = -1;
      if (ant.x < L.ants.x0 * T) ant.dir = 1;
      // (they walk round the cookie and the sugar cubes, not through them)
      const ahead = Math.floor((ant.x + ant.dir * 12) / T);
      if (cellType(level, ahead, G - 1) === 'solid') ant.dir = -ant.dir;
      ant.sprite.setPosition(ant.x, GY).setFlipX(ant.dir < 0).setFrame(Math.floor(time / 200 + ant.x) % 2);
    }
    if (!lb.busy) lb.sprite.setPosition(lb.home.x, lb.home.y + Math.sin(time / 500) * 1);
    if (growing) {
      growing.t += dt / 2.2;
      const p = Math.min(1, growing.t);
      const top = potY - 24 - p * 170;
      stalk.height = potY - top;
      flower.setPosition(potX, top).setScale(Math.min(1, p * 3)).setAngle(Math.sin(time / 300) * 4);
      if (p >= 1) {
        // the flower's face is a ledge to stand on now; the party!
        const row = Math.floor((top - 30) / T) + 1;
        level.fill(Math.floor(potX / T) - 2, row, Math.floor(potX / T) + 1, row, TY.LEAF);
        growing = null;
        scene.prizeParty(potX, top - 50);
      }
    }
  };

  const ready = () => {
    scene.time.delayedCall(700, () => scene.tweens.add({ targets: potGlow, alpha: 0.6, duration: 600, yoyo: true, repeat: -1 }));
    return { x: potX, y: potY - 40 };
  };

  return {
    world: { w: W, h: H },
    pad: { x: L.pad.x * T + 8, y: GY },
    zoom: [1.15, 1.6],
    lead: () => ({ x: 0, y: -30 }),
    goal: () => ({ have: Math.min(seeds, TINY.need), need: TINY.need }),
    spawn,
    step,
    update,
    focus: (a) => ({ x: a.b.x + a.b.w / 2, y: a.b.y + a.b.h - 8 }),
    place: (a, x, y) => { a.ride = null; a.b.x = x - a.b.w / 2; a.b.y = Math.min(y, GY) - a.b.h; a.b.vx = 0; a.b.vy = 0; if (lb.busy && !scene.avatars.some((o) => o?.ride)) { lb.busy = false; lb.sprite.setFrame(0); } },
    onFoot: (a) => a.b.grounded && !a.ride,
    ready,
    cheer: (a) => { if (!growing) a.b.vy = -200; },
    debug: { munch },
  };
}

// A summer sky over a giant's garden: far-off giant grass, a fence, flowers.
function drawBackdrop(scene, W, GY) {
  const g = scene.add.graphics().setDepth(-30);
  g.fillGradientStyle(0x6ac0ff, 0x6ac0ff, 0xd8f4ff, 0xd8f4ff, 1);
  g.fillRect(0, 0, W, GY + 64);
  scene.add.image(380, 40, 'light').setScrollFactor(0.1, 0.4).setTint(0xfff2a0).setScale(1.8).setDepth(-29);
  // the giant's fence, far off
  const fence = scene.add.graphics().setScrollFactor(0.3, 0.8).setDepth(-28).setAlpha(0.55);
  for (let x = 0; x < W * 0.3 + 600; x += 90) {
    fence.fillStyle(0xd8b888, 1).fillRect(x, GY - 220, 56, 220);
    fence.fillStyle(0xc8a070, 1).fillRect(x + 46, GY - 220, 10, 220);
    fence.fillStyle(0xd8b888, 1).fillTriangle(x, GY - 220, x + 56, GY - 220, x + 28, GY - 246);
  }
  // giant grass blades, a far row and a near row
  for (let k = 0; k < 90; k++) {
    const x = (k * 53) % (W * 0.6 + 600);
    scene.add.image(x, GY + 10, 'tiny-grass').setOrigin(0.5, 1).setScrollFactor(0.6, 0.9).setDepth(-27).setScale(1, 1.4 + (k % 5) * 0.2).setTint(0xa8d8a0);
  }
  for (let k = 0; k < 70; k++) {
    const x = (k * 97 + 30) % W;
    const blade = scene.add.image(x, GY + 4, 'tiny-grass').setOrigin(0.5, 1).setDepth(-5).setScale(1.2, 1.2 + (k % 4) * 0.25);
    scene.tweens.add({ targets: blade, angle: { from: -2, to: 2 }, duration: 2000 + (k % 5) * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}
