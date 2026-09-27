// The mine's toys, in the scene: eggs to carry home, boom blocks that light
// on touch, boulders to push (together, in co-op), the big chest, geodes,
// fossils, and bubbles in the water.

import { B } from '../../world/blocks.js';
import { explode, pushBoulder, bigChestReady, geodeLoot, bigChestLoot, FOSSIL_KINDS, meteoriteLoot, heartLeft } from '../../game/finds.js';
import { knockback, playerCell } from '../../game/player.js';
import { createPickup } from '../../game/loot.js';
import { overlaps } from '../../game/hazards.js';
import { EGG_KINDS } from '../../art/finds.js';
import { earnSticker } from '../common/stickers.js';
import { TILE, PLAYER, FUSE, PUSH_TIME } from '../../tuning.js';

const boxOf = (a) => ({ x: a.p.x, y: a.p.y, w: PLAYER.w, h: PLAYER.h });
const cellBox = (x, y, w = 1) => ({ x: x * TILE - 1, y: y * TILE - 1, w: w * TILE + 2, h: TILE + 2 });

export function createFindsView(scene) {
  const { grid, world } = scene;
  const carried = [];
  const lit = [];
  const pushT = new Map();
  const players = () => scene.avatars.filter(Boolean);

  // eggs sit on cave floors as sprites (each has its own colour)
  const eggs = world.eggs.map((e) => {
    const s = scene.add.image(e.x * TILE + TILE / 2, (e.y + 1) * TILE, 'egg', EGG_KINDS.indexOf(e.kind)).setOrigin(0.5, 1).setDepth(24);
    scene.tweens.add({ targets: s, angle: { from: -6, to: 6 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return { ...e, s, taken: false };
  });

  const together = scene.add.image(0, 0, 'icon-together').setDepth(64).setVisible(false);

  // the Heart of the World: a big glowing gem over its 3x3 cells
  const heart = world.heart ? {
    ...world.heart,
    s: scene.add.image((world.heart.x + 1.5) * TILE, (world.heart.y + 1.5) * TILE, 'heart-big').setDepth(22),
    left: 9,
  } : null;
  let hearts = 0;

  const burst = (x, y, ores, spread = 140) => {
    for (const ore of ores) {
      scene.pickups.push(createPickup({
        x, y, ore, delay: 0.4, vx: (scene.rng.next() - 0.5) * spread, vy: -120 - scene.rng.next() * 60,
      }));
    }
  };

  function light(x, y, fuse = FUSE) {
    if (grid.get(x, y) !== B.BOOM || lit.some((b) => b.x === x && b.y === y)) return;
    const s = scene.add.image(x * TILE, y * TILE, 'tiles', B.BOOM).setOrigin(0).setDepth(21);
    lit.push({ x, y, t: fuse, s });
    scene.events.emit('fuse');
  }

  function boom(b) {
    b.s.destroy();
    const { cleared, chain } = explode(grid, b.x, b.y);
    scene.mapView.sync(b.x, b.y);
    const cx = b.x * TILE + TILE / 2;
    const cy = b.y * TILE + TILE / 2;
    for (const c of cleared) {
      scene.mapView.sync(c.x, c.y);
      scene.effects.chunks(c.x, c.y, c.id);
      scene.decor.mined(c.x, c.y);
      scene.hazards.mined(c.x, c.y);
      if (c.drop) burst(c.x * TILE + TILE / 2, c.y * TILE + TILE / 2, [c.drop], 80);
    }
    scene.decor.mined(b.x, b.y);
    scene.hazards.mined(b.x, b.y);
    for (const c of chain) light(c.x, c.y, 0.25);
    // a big friendly poof: flash, ring of sparkles, a gentle push (never a bonk)
    scene.effects.sparkle(cx, cy, 0xffe066, 12);
    scene.effects.confetti(cx, cy);
    scene.cameras.main.shake(220, 0.008);
    scene.cameras.main.flash(120, 255, 230, 180);
    for (const a of players()) {
      const dx = a.p.x + PLAYER.w / 2 - cx;
      const dy = a.p.y + PLAYER.h / 2 - cy;
      if (Math.hypot(dx, dy) < TILE * 2.6 && !a.bubbling) knockback(a.p, Math.sign(dx) || 1);
    }
    earnSticker(scene, 'find-boom');
    scene.events.emit('boom', b);
  }

  function updateBooms(dt, time) {
    for (let i = lit.length - 1; i >= 0; i--) {
      const b = lit[i];
      b.t -= dt;
      const rate = b.t < 0.5 ? 50 : 120;
      if (Math.floor(time / rate) % 2) b.s.setTintFill(0xffffff); else b.s.clearTint();
      b.s.setScale(1 + (FUSE - Math.max(0, b.t)) * 0.06).setPosition(b.x * TILE - (b.s.scale - 1) * 8, b.y * TILE - (b.s.scale - 1) * 8);
      if (Math.random() < 0.4) scene.effects.sparkle(b.x * TILE + 8, b.y * TILE, 0xffb34a, 1);
      if (b.t <= 0) {
        lit.splice(i, 1);
        boom(b);
      }
    }
  }

  function updateBoulders(dt) {
    const coop = players().length > 1;
    const pushing = new Map();
    for (const a of players()) {
      const m = a.p.mining;
      if (!m || grid.get(m.cx, m.cy) !== B.BOULDER || a.bubbling) continue;
      const { cx, cy } = playerCell(a.p);
      if (m.cy !== cy || m.cx === cx) continue;
      const k = `${m.cx},${m.cy}`;
      const dir = Math.sign(m.cx - cx);
      const e = pushing.get(k) ?? { x: m.cx, y: m.cy, dirs: [], who: [] };
      e.dirs.push(dir);
      e.who.push(a);
      pushing.set(k, e);
    }
    let lonely = null;
    for (const [k, e] of pushing) {
      const dir = e.dirs[0];
      const same = e.dirs.filter((d) => d === dir).length;
      if (same < (coop ? 2 : 1)) {
        pushT.delete(k);
        lonely = e;
        continue;
      }
      const t = (pushT.get(k) ?? 0) + dt;
      pushT.set(k, t);
      if (Math.random() < 0.3) scene.effects.sparkle(e.x * TILE + 8, (e.y + 1) * TILE - 2, 0xc8b8a0, 1);
      if (t >= PUSH_TIME) {
        pushT.delete(k);
        const r = pushBoulder(grid, e.x, e.y, dir);
        if (r.moved) {
          scene.mapView.sync(e.x, e.y);
          for (let y = e.y; y <= r.y; y++) scene.mapView.sync(r.x, y);
          scene.decor.filled(r.x, r.y);
          scene.effects.chunks(r.x, r.y, B.STONE);
          scene.cameras.main.shake(100, 0.004);
          for (const a of e.who) a.p.mining = null;
          earnSticker(scene, 'find-boulder');
          scene.events.emit('boulder', r);
        }
      }
    }
    return lonely;
  }

  function updateBigChest() {
    const c = world.bigChest;
    if (!c || grid.get(c.x, c.y) !== B.BIGCHEST) return null;
    const box = cellBox(c.x, c.y, 2);
    const ps = players();
    const touching = ps.filter((a) => !a.bubbling && overlaps(boxOf(a), box)).length;
    if (touching && bigChestReady({ touching, players: ps.length })) {
      grid.set(c.x, c.y, B.AIR);
      grid.set(c.x + 1, c.y, B.AIR);
      scene.mapView.sync(c.x, c.y);
      scene.mapView.sync(c.x + 1, c.y);
      const x = (c.x + 1) * TILE;
      const y = c.y * TILE + 8;
      burst(x, y, bigChestLoot(c.y, scene.rng), 180);
      // a pet egg inside, if there are pets still to find
      if (scene.eggKinds.length) {
        const kind = scene.rng.pick(scene.eggKinds);
        carried.push(kind);
        const s = scene.add.image(x, y, 'egg', EGG_KINDS.indexOf(kind)).setDepth(60).setScale(1.5);
        scene.tweens.add({ targets: s, y: y - 40, alpha: 0, duration: 1200, onComplete: () => s.destroy() });
        earnSticker(scene, 'find-egg');
      }
      scene.effects.confetti(x, y);
      scene.cameras.main.flash(160, 255, 230, 150);
      earnSticker(scene, 'find-bigchest');
      scene.trip.chests++;
      scene.events.emit('chestOpened', c);
      return null;
    }
    return touching === 1 && ps.length > 1 ? { x: (c.x + 1) * TILE, y: c.y * TILE - 12 } : null;
  }

  function updateEggs() {
    for (const e of eggs) {
      if (e.taken) continue;
      for (const a of players()) {
        if (a.bubbling || !overlaps(boxOf(a), cellBox(e.x, e.y))) continue;
        e.taken = true;
        grid.set(e.x, e.y, B.AIR);
        carried.push(e.kind);
        scene.tweens.killTweensOf(e.s);
        scene.tweens.add({ targets: e.s, y: e.s.y - 30, scale: 1.8, alpha: 0, duration: 700, onComplete: () => e.s.destroy() });
        scene.effects.sparkle(e.s.x, e.s.y - 6, 0xfff2a0, 10);
        earnSticker(scene, e.kind === 'golden' ? 'find-goldegg' : 'find-egg');
        scene.events.emit('egg', e);
        break;
      }
    }
  }

  function updateWater(dt) {
    for (const a of players()) {
      if (a.p.inWater && !a.wasInWater) {
        scene.effects.sparkle(a.sprite.x, a.sprite.y - 12, 0xa0f0ff, 6);
        scene.events.emit('splash', a);
      }
      a.wasInWater = a.p.inWater;
      if (!a.p.inWater) continue;
      a.bubbleT = (a.bubbleT ?? 0) - dt;
      if (a.bubbleT <= 0) {
        a.bubbleT = 0.25;
        const b = scene.add.image(a.sprite.x + (Math.random() - 0.5) * 8, a.sprite.y - 12, 'pixel').setTint(0xe0ffff).setDisplaySize(2, 2).setDepth(40);
        scene.tweens.add({ targets: b, y: b.y - 14, alpha: 0, duration: 700, onComplete: () => b.destroy() });
      }
    }
  }

  // All 9 cells dug: the Heart is yours! It floats up and rides home with you.
  function winHeart() {
    hearts++;
    const s = heart.s;
    scene.tweens.killTweensOf(s);
    s.setAlpha(1).setScale(1);
    scene.tweens.add({ targets: s, scale: 1.6, duration: 500, ease: 'Back.easeOut', yoyo: true, hold: 700 });
    scene.tweens.add({ targets: s, y: s.y - 60, alpha: 0, delay: 1400, duration: 900, ease: 'Quad.easeIn', onComplete: () => s.destroy() });
    for (let i = 0; i < 3; i++) scene.time.delayedCall(i * 300, () => scene.effects.confetti(s.x + (i - 1) * 20, s.y));
    scene.cameras.main.flash(300, 255, 180, 210);
    scene.cameras.main.shake(300, 0.005);
    burst(s.x, s.y, ['star', 'star', 'star', 'diamond', 'emerald', 'gold', 'amber', 'brick'], 220);
    earnSticker(scene, 'find-heart');
    scene.events.emit('heart', heart);
    heart.s = null;
  }

  return {
    carried,
    eggs,
    light,
    get hearts() { return hearts; },
    heart,

    // A block was dug: geodes and fossils give their treasure.
    mined(m) {
      const x = m.x * TILE + TILE / 2;
      const y = m.y * TILE + TILE / 2;
      if (m.id === B.GEODE) {
        burst(x, y, geodeLoot(m.y, scene.rng), 120);
        scene.effects.sparkle(x, y, 0xd08cff, 12);
        earnSticker(scene, 'find-geode');
        scene.events.emit('geode', m);
      } else if (m.id === B.FOSSIL) {
        const f = world.fossils.find((q) => q.x === m.x && q.y === m.y);
        const v = f ? f.v : 0;
        const icon = scene.add.image(x, y, 'find-fossil', v).setDepth(60);
        scene.tweens.add({ targets: icon, y: y - 26, scale: 1.6, duration: 500, ease: 'Back.easeOut', yoyo: true, hold: 400, onComplete: () => icon.destroy() });
        burst(x, y, ['gold', 'gold'], 60);
        earnSticker(scene, `find-fossil-${FOSSIL_KINDS[v]}`);
        scene.events.emit('fossil', m);
      } else if (m.id === B.METEORITE) {
        burst(x, y, meteoriteLoot(scene.rng), 150);
        scene.effects.sparkle(x, y, 0xffe066, 14);
        scene.cameras.main.flash(100, 255, 240, 180);
        earnSticker(scene, 'find-meteorite');
        scene.events.emit('meteorite', m);
      } else if (m.id === B.HEART && heart) {
        heart.left = heartLeft(grid, heart);
        scene.effects.sparkle(x, y, 0xff8ab0, 10);
        scene.events.emit('heartChip', m);
        if (heart.left === 0) winHeart();
      }
    },

    update(dt, time) {
      if (heart && heart.s) {
        // it pulses gently, and fades as you dig it free
        heart.s.setScale(1 + Math.sin(time / 300) * 0.04).setAlpha(0.35 + (heart.left / 9) * 0.65);
      }
      updateBooms(dt, time);
      const lonely = updateBoulders(dt);
      const chestNeedsTwo = updateBigChest();
      updateEggs();
      updateWater(dt);
      // "together!": a boulder or the big chest needs both of you
      const spot = chestNeedsTwo ?? (lonely ? { x: lonely.x * TILE + 8, y: lonely.y * TILE - 12 } : null);
      together.setVisible(!!spot);
      if (spot) together.setPosition(spot.x, spot.y + Math.sin(time / 150) * 2).setScale(1 + Math.sin(time / 120) * 0.1);
      for (const e of eggs) if (!e.taken) e.s.setVisible(true);
    },
  };
}
