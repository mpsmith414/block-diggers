// The mine's toys, in the scene: eggs to carry home, boom blocks that light
// on touch, boulders to push (together, in co-op), the big chest, geodes,
// fossils, and bubbles in the water.

import { B, isBoulder } from '../../world/blocks.js';
import {
  explode, pushBoulder, bigChestReady, geodeLoot, bigChestLoot, FOSSIL_KINDS, meteoriteLoot, heartLeft,
  wheelsMeet, cheesePartyLoot, ufoLoot, moonMeteoriteLoot,
} from '../../game/finds.js';
import { cushionPressed } from '../../game/silly.js';
import { knockback, playerCell, standAt } from '../../game/player.js';
import { createPickup } from '../../game/loot.js';
import { overlaps } from '../../game/hazards.js';
import { EGG_KINDS } from '../../art/finds.js';
import { earnSticker } from '../common/stickers.js';
import { TILE, PLAYER, FUSE, PUSH_TIME, SILLY } from '../../tuning.js';

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

  // the Heart of the World (or the Moon Heart): a big glowing gem over its 3x3 cells
  const moonHeart = world.heart?.kind === 'moon';
  const heart = world.heart ? {
    ...world.heart,
    s: scene.add.image((world.heart.x + 1.5) * TILE, (world.heart.y + 1.5) * TILE, moonHeart ? 'moonheart-big' : 'heart-big').setDepth(22),
    left: 9,
  } : null;
  // the Moon: singing crystals, teleport pads and a crashed UFO
  const chimes = (world.chimes ?? []).map((c, i) => ({
    ...c, note: i, t: 0,
    s: scene.add.sprite(c.x * TILE + 8, (c.y + 1) * TILE, 'chime', 0).setOrigin(0.5, 1).setDepth(9),
  }));
  const teleports = world.teleports ?? [];
  const ufo = world.ufo ? {
    ...world.ufo, open: false,
    s: scene.add.sprite((world.ufo.x + 1.5) * TILE, (world.ufo.y + 1) * TILE + 3, 'ufo', 0).setOrigin(0.5, 1).setDepth(9).setAngle(-8),
  } : null;
  // rubber ducks bobbing on pools
  const ducks = (world.ducks ?? []).map((d) => {
    const s = scene.add.image(d.x * TILE + 8, d.y * TILE + 5, 'duck').setDepth(24);
    scene.tweens.add({ targets: s, y: s.y + 1.5, angle: { from: -8, to: 8 }, duration: 800 + Math.random() * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return { ...d, s, found: false };
  });
  // whoopee cushions on cave floors
  const cushions = (world.cushions ?? []).map((c) => ({
    ...c, flat: 0, armed: true, s: scene.add.sprite(c.x * TILE + 8, (c.y + 1) * TILE, 'cushion', 0).setOrigin(0.5, 1).setDepth(23),
  }));
  let hearts = 0;
  let moonHearts = 0;

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
      if (!m || !isBoulder(grid.get(m.cx, m.cy)) || a.bubbling) continue;
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
      // in co-op it takes two (or one and the Triceratops)
      if (same < (coop && !scene.pets?.has('trike') ? 2 : 1)) {
        pushT.delete(k);
        lonely = e;
        continue;
      }
      const t = (pushT.get(k) ?? 0) + dt;
      pushT.set(k, t);
      if (Math.random() < 0.3) scene.effects.sparkle(e.x * TILE + 8, (e.y + 1) * TILE - 2, 0xc8b8a0, 1);
      if (t >= PUSH_TIME) {
        pushT.delete(k);
        const wheel = grid.get(e.x, e.y) === B.CHEESE_WHEEL;
        const r = pushBoulder(grid, e.x, e.y, dir);
        if (r.moved) {
          scene.mapView.sync(e.x, e.y);
          for (let y = e.y; y <= r.y; y++) scene.mapView.sync(r.x, y);
          scene.decor.filled(r.x, r.y);
          scene.effects.chunks(r.x, r.y, wheel ? B.CHEESE : B.STONE);
          scene.cameras.main.shake(100, 0.004);
          for (const a of e.who) a.p.mining = null;
          earnSticker(scene, wheel ? 'find-cheesewheel' : 'find-boulder');
          scene.events.emit('boulder', r);
          const other = wheel && wheelsMeet(grid, r.x, r.y);
          if (other) cheeseParty(r, other);
        }
      }
    }
    return lonely;
  }

  // Two cheese wheels bump together: a cheese party! Both burst into cheese.
  function cheeseParty(a, b) {
    for (const c of [a, b]) {
      grid.set(c.x, c.y, B.AIR);
      scene.mapView.sync(c.x, c.y);
      scene.effects.chunks(c.x, c.y, B.CHEESE);
    }
    const x = ((a.x + b.x) / 2 + 0.5) * TILE;
    const y = a.y * TILE + 8;
    burst(x, y, cheesePartyLoot(scene.rng), 200);
    for (let i = 0; i < 3; i++) scene.time.delayedCall(i * 200, () => scene.effects.confetti(x + (i - 1) * 14, y - 6));
    scene.cameras.main.flash(150, 255, 230, 120);
    scene.events.emit('cheeseParty', { x, y });
  }

  // Singing crystals ring a note as you pass (each one its own note).
  function updateChimes(dt) {
    for (const c of chimes) {
      c.t = Math.max(0, c.t - dt);
      const near = players().some((a) => !a.bubbling && Math.abs(a.p.x + PLAYER.w / 2 - (c.x * TILE + 8)) < 10 && Math.abs(a.p.y + PLAYER.h - (c.y + 1) * TILE) < 20);
      if (near && c.t === 0) {
        c.t = 1.2;
        c.s.setFrame(1);
        scene.tweens.add({ targets: c.s, scaleX: 1.15, duration: 80, yoyo: true, repeat: 3 });
        for (let i = 0; i < 3; i++) {
          const n = scene.add.image(c.s.x + (i - 1) * 6, c.s.y - 26, 'note').setDepth(40).setTint([0xc8b8ff, 0xffe066, 0x9ff6ff][i]);
          scene.tweens.add({ targets: n, y: n.y - 16 - i * 4, alpha: 0, delay: i * 120, duration: 800, onComplete: () => n.destroy() });
        }
        scene.events.emit('chime', c.note);
        earnSticker(scene, 'find-chime');
      } else if (c.t < 0.6) {
        c.s.setFrame(0);
      }
    }
  }

  // Step on a teleport pad: ZAP, you're at the other one.
  function updateTeleports() {
    for (const a of players()) {
      if (a.bubbling) continue;
      const { cx, cy } = playerCell(a.p);
      const pair = teleports.find((t) => (t.a.x === cx && t.a.y === cy) || (t.b.x === cx && t.b.y === cy));
      if (!pair) { a.onPad = false; continue; }
      if (a.onPad || !a.p.grounded) continue;
      const to = pair.a.x === cx && pair.a.y === cy ? pair.b : pair.a;
      const from = { x: a.sprite.x, y: a.sprite.y };
      const pos = standAt(to.x, to.y);
      a.p.x = pos.x;
      a.p.y = pos.y;
      a.p.vx = 0;
      a.p.vy = 0;
      a.p.mining = null;
      a.onPad = true;
      for (const p of [from, { x: to.x * TILE + 8, y: (to.y + 1) * TILE }]) {
        const beam = scene.add.rectangle(p.x, p.y, 14, 40, 0x3affe0, 0.5).setOrigin(0.5, 1).setDepth(52).setBlendMode('ADD');
        scene.tweens.add({ targets: beam, scaleX: 0, alpha: 0, duration: 500, onComplete: () => beam.destroy() });
        scene.effects.sparkle(p.x, p.y - 8, 0x3affe0, 10);
      }
      scene.offscreenGraceUntil = scene.time.now + 800;
      scene.pets.regroup();
      scene.events.emit('teleport', a);
      earnSticker(scene, 'find-teleport');
    }
  }

  // The crashed UFO: walk up to it and its hatch pops open.
  function updateUfo() {
    if (!ufo || ufo.open) return;
    const box = cellBox(ufo.x, ufo.y, 3);
    if (!players().some((a) => !a.bubbling && overlaps(boxOf(a), box))) return;
    ufo.open = true;
    grid.set(ufo.x + 1, ufo.y, B.AIR);
    ufo.s.setFrame(1);
    scene.tweens.add({ targets: ufo.s, angle: 0, duration: 400, ease: 'Back.easeOut' });
    const x = ufo.s.x;
    const y = ufo.s.y - 10;
    burst(x, y, ufoLoot(scene.rng), 200);
    scene.effects.confetti(x, y);
    scene.cameras.main.flash(160, 160, 255, 200);
    earnSticker(scene, 'find-ufo');
    scene.trip.chests++;
    scene.events.emit('ufo', ufo);
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
        earnSticker(scene, e.kind === 'golden' ? 'find-goldegg' : e.kind === 'rex' || e.kind === 'trike' ? 'find-dinoegg' : 'find-egg');
        if (e.kind === 'moonpup') scene.effects.confetti(e.s.x, e.s.y - 6);
        scene.events.emit('egg', e);
        break;
      }
    }
  }

  function updateSilly(dt) {
    for (const d of ducks) {
      if (d.found) continue;
      for (const a of players()) {
        if (a.bubbling || !overlaps(boxOf(a), cellBox(d.x, d.y))) continue;
        d.found = true;
        scene.tweens.killTweensOf(d.s);
        scene.tweens.add({ targets: d.s, y: d.s.y - 26, angle: 360, scale: 1.8, duration: 600, ease: 'Quad.easeOut' });
        scene.tweens.add({ targets: d.s, alpha: 0, delay: 700, duration: 300, onComplete: () => d.s.destroy() });
        scene.effects.sparkle(d.s.x, d.s.y, 0xffd84a, 8);
        scene.events.emit('quack', d);
        earnSticker(scene, 'silly-duck');
        break;
      }
    }
    for (const c of cushions) {
      if (c.flat > 0) {
        c.flat -= dt;
        if (c.flat <= 0) {
          c.s.setFrame(0);
          scene.tweens.add({ targets: c.s, scaleY: { from: 0.6, to: 1 }, duration: 300, ease: 'Back.easeOut' });
        }
        continue;
      }
      const on = players().filter((a) => !a.bubbling && cushionPressed(c, boxOf(a)));
      if (!on.length) { c.armed = true; continue; }
      if (!c.armed) continue;
      c.armed = false;
      c.flat = SILLY.cushionFlat;
      c.s.setFrame(1);
      scene.events.emit('pffbt', c);
      for (let i = 0; i < 5; i++) {
        const p = scene.add.image(c.s.x + (i - 2) * 3, c.s.y - 3, 'smoke').setDepth(30).setScale(0.5).setTint(i % 2 ? 0xc8e8a0 : 0xffd0e0);
        scene.tweens.add({ targets: p, x: p.x + (i - 2) * 5, y: p.y - 10 - Math.random() * 8, scale: 1.2, alpha: 0, duration: 700, onComplete: () => p.destroy() });
      }
      for (const a of on) a.p.vy = -140;
      earnSticker(scene, 'silly-whoopee');
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
    if (moonHeart) moonHearts++;
    else hearts++;
    const s = heart.s;
    scene.tweens.killTweensOf(s);
    s.setAlpha(1).setScale(1);
    scene.tweens.add({ targets: s, scale: 1.6, duration: 500, ease: 'Back.easeOut', yoyo: true, hold: 700 });
    scene.tweens.add({ targets: s, y: s.y - 60, alpha: 0, delay: 1400, duration: 900, ease: 'Quad.easeIn', onComplete: () => s.destroy() });
    for (let i = 0; i < 3; i++) scene.time.delayedCall(i * 300, () => scene.effects.confetti(s.x + (i - 1) * 20, s.y));
    scene.cameras.main.flash(300, 255, 180, 210);
    scene.cameras.main.shake(300, 0.005);
    burst(s.x, s.y, moonHeart
      ? ['moonstone', 'moonstone', 'spacegem', 'spacegem', 'gizmo', 'gizmo', 'cheese', 'cheese']
      : ['star', 'star', 'star', 'diamond', 'emerald', 'gold', 'amber', 'brick'], 220);
    earnSticker(scene, moonHeart ? 'find-moonheart' : 'find-heart');
    scene.events.emit('heart', heart);
    heart.s = null;
  }

  return {
    carried,
    eggs,
    light,
    get hearts() { return hearts; },
    get moonHearts() { return moonHearts; },
    heart,
    chimes,
    ufo,

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
        burst(x, y, scene.moon ? moonMeteoriteLoot(scene.rng) : meteoriteLoot(scene.rng), 150);
        scene.effects.sparkle(x, y, 0xffe066, 14);
        scene.cameras.main.flash(100, 255, 240, 180);
        earnSticker(scene, 'find-meteorite');
        scene.events.emit('meteorite', m);
      } else if ((m.id === B.HEART || m.id === B.MOON_HEART) && heart) {
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
      updateSilly(dt);
      updateChimes(dt);
      updateTeleports();
      updateUfo();
      // "together!": a boulder or the big chest needs both of you
      const spot = chestNeedsTwo ?? (lonely ? { x: lonely.x * TILE + 8, y: lonely.y * TILE - 12 } : null);
      together.setVisible(!!spot);
      if (spot) together.setPosition(spot.x, spot.y + Math.sin(time / 150) * 2).setScale(1 + Math.sin(time / 120) * 0.1);
      for (const e of eggs) if (!e.taken) e.s.setVisible(true);
    },
  };
}
