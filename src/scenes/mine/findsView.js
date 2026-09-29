// The mine's toys, in the scene: eggs to carry home, boom blocks that light
// on touch, boulders to push (together, in co-op), the big chest, geodes,
// fossils, and bubbles in the water. On the Moon: singing crystals, teleport
// pads and a crashed UFO. On Mars: steam geysers, old rovers and vaults.

import { B, isBoulder } from '../../world/blocks.js';
import {
  explode, pushBoulder, bigChestReady, geodeLoot, bigChestLoot, FOSSIL_KINDS, meteoriteLoot, heartLeft,
  boulderPairMeet, cheesePartyLoot, ufoLoot, moonMeteoriteLoot, heartOf, roverLoot, vaultLoot, snowmanLoot, globeLoot, cometLoot, nestLoot, skullLoot, stegoLoot,
  fireFlowerLoot, forgeLoot,
} from '../../game/finds.js';
import { cushionPressed } from '../../game/silly.js';
import { knockback, playerCell, standAt } from '../../game/player.js';
import { createPickup } from '../../game/loot.js';
import { overlaps } from '../../game/hazards.js';
import { EGG_KINDS } from '../../art/finds.js';
import { earnSticker } from '../common/stickers.js';
import { TILE, PLAYER, FUSE, PUSH_TIME, SILLY, GEYSER } from '../../tuning.js';

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

  // the Heart of the World (or the Moon Heart, or the Mars Heart): a big glowing gem over its 3x3 cells
  const heartLook = heartOf(world.heart?.kind);
  const heart = world.heart ? {
    ...world.heart,
    s: scene.add.image((world.heart.x + 1.5) * TILE, (world.heart.y + 1.5) * TILE, heartLook.big).setDepth(22),
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
  // Mars: steam geysers, old rovers, and vaults with glyph buttons
  const geysers = (world.geysers ?? []).map((g) => ({ ...g, state: 'idle', t: 0, puffT: Math.random() * 2 }));
  const rovers = (world.rovers ?? []).map((r) => ({
    ...r, open: false,
    s: scene.add.sprite((r.x + 1.5) * TILE, (r.y + 1) * TILE + 3, 'oldrover', 0).setOrigin(0.5, 1).setDepth(9),
  }));
  const vaults = (world.vaults ?? []).map((v) => ({ ...v, open: false }));
  // Dino Planet: parasaurs to ride, nests, the T-rex skull and the sleeping stego
  const parasaurs = (world.parasaurs ?? []).map((p, i) => ({
    ...p, used: false, home: (p.x + 1.5) * TILE, dir: i % 2 ? -1 : 1, t: Math.random() * 3,
    s: scene.add.sprite((p.x + 1.5) * TILE, (p.y + 1) * TILE, 'parasaur', 0).setOrigin(0.5, 1).setDepth(9),
  }));
  const nests = (world.nests ?? []).map((n) => ({
    ...n, open: false, s: scene.add.sprite((n.x + 1.5) * TILE, (n.y + 1) * TILE, 'dinonest', 0).setOrigin(0.5, 1).setDepth(9),
  }));
  const skull = world.skull ? {
    ...world.skull, open: false, s: scene.add.sprite((world.skull.x + 1.5) * TILE, (world.skull.y + 1) * TILE + 2, 'rexskull', 0).setOrigin(0.5, 1).setDepth(9),
  } : null;
  const stego = world.stego ? {
    ...world.stego, open: false, s: scene.add.sprite((world.stego.x + 1.5) * TILE, (world.stego.y + 1) * TILE + 1, 'stego', 0).setOrigin(0.5, 1).setDepth(9),
  } : null;
  // the Sun: fire flowers and the Solar Forge
  const flowers = (world.flowers ?? []).map((f) => ({
    ...f, open: false, s: scene.add.sprite((f.x + 1.5) * TILE, (f.y + 1) * TILE, 'fireflower', 0).setOrigin(0.5, 1).setDepth(9),
  }));
  for (const f of flowers) scene.tweens.add({ targets: f.s, scaleY: 1.06, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  const forge = world.forge ? {
    ...world.forge, open: false, s: scene.add.sprite((world.forge.x + 1.5) * TILE, (world.forge.y + 1) * TILE, 'forge', 0).setOrigin(0.5, 1).setDepth(9),
  } : null;
  // Saturn: snow globes and the frozen comet
  const globes = (world.globes ?? []).map((g) => ({
    ...g, open: false,
    s: scene.add.sprite((g.x + 1.5) * TILE, (g.y + 1) * TILE, 'snowglobe', 0).setOrigin(0.5, 1).setDepth(9),
  }));
  const comet = world.comet ? {
    ...world.comet, open: false,
    s: scene.add.sprite((world.comet.x + 1.5) * TILE, (world.comet.y + 1) * TILE + 2, 'frozencomet', 0).setOrigin(0.5, 1).setDepth(9),
  } : null;
  let hearts = 0; // the Heart of the World (banked on Earth)
  let moonHearts = 0;
  let suitHearts = 0; // a planet's heart (it brings that planet's Sun Suit piece)

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
        const kind = grid.get(e.x, e.y);
        const r = pushBoulder(grid, e.x, e.y, dir);
        if (r.moved) {
          scene.mapView.sync(e.x, e.y);
          for (let y = e.y; y <= r.y; y++) scene.mapView.sync(r.x, y);
          scene.decor.filled(r.x, r.y);
          scene.effects.chunks(r.x, r.y, { [B.CHEESE_WHEEL]: B.CHEESE, [B.SNOWBALL]: B.SNOWBALL }[kind] ?? B.STONE);
          scene.cameras.main.shake(100, 0.004);
          for (const a of e.who) a.p.mining = null;
          earnSticker(scene, { [B.CHEESE_WHEEL]: 'find-cheesewheel', [B.SNOWBALL]: 'find-snowball' }[kind] ?? 'find-boulder');
          scene.events.emit('boulder', r);
          // two cheese wheels have a cheese party; two snowballs make a snowman
          const other = boulderPairMeet(grid, r.x, r.y);
          if (other && kind === B.CHEESE_WHEEL) cheeseParty(r, other);
          else if (other) snowman(r, other);
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

  // Two snowballs bump together: they stack up into a snowman, and a shower of
  // frost gems bursts out. The snowman stays and waves.
  function snowman(a, b) {
    for (const c of [a, b]) {
      grid.set(c.x, c.y, B.AIR);
      scene.mapView.sync(c.x, c.y);
      scene.effects.chunks(c.x, c.y, B.SNOWBALL);
    }
    const x = ((a.x + b.x) / 2 + 0.5) * TILE;
    const y = (a.y + 1) * TILE;
    const s = scene.add.image(x, y, 'snowman').setOrigin(0.5, 1).setDepth(9).setScale(0.2);
    scene.tweens.add({ targets: s, scale: 1, duration: 500, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: s, angle: { from: -4, to: 4 }, delay: 600, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    burst(x, y - 16, snowmanLoot(scene.rng), 200);
    for (let i = 0; i < 3; i++) scene.time.delayedCall(i * 200, () => scene.effects.confetti(x + (i - 1) * 14, y - 20));
    scene.cameras.main.flash(150, 220, 240, 255);
    earnSticker(scene, 'find-snowman');
    scene.events.emit('snowman', { x, y });
  }

  // A snow globe: walk up to it, it shakes (snow swirling), and pearls pour out.
  function updateGlobes() {
    for (const g of globes) {
      if (g.open || !players().some((a) => !a.bubbling && overlaps(boxOf(a), cellBox(g.x, g.y, 3)))) continue;
      g.open = true;
      grid.set(g.x + 1, g.y, B.AIR);
      g.s.setFrame(1);
      scene.tweens.add({ targets: g.s, angle: { from: -12, to: 12 }, duration: 90, yoyo: true, repeat: 5, onComplete: () => g.s.setAngle(0) });
      scene.events.emit('globe', g);
      scene.time.delayedCall(600, () => {
        burst(g.s.x, g.s.y - 20, globeLoot(scene.rng), 180);
        scene.effects.confetti(g.s.x, g.s.y - 20);
        for (let i = 0; i < 12; i++) scene.effects.sparkle(g.s.x + (Math.random() - 0.5) * 24, g.s.y - 16 - Math.random() * 16, 0xffffff, 1);
      });
      earnSticker(scene, 'find-snowglobe');
      scene.trip.chests++;
    }
  }

  // Parasaurs wander about their spot; walk into one and you hop on for a ride.
  function updateParasaurs(dt, time) {
    for (const p of parasaurs) {
      if (p.used) continue;
      p.t -= dt;
      if (p.t <= 0) { p.t = 1.5 + Math.random() * 2; p.dir = Math.random() < 0.3 ? 0 : (Math.random() < 0.5 ? -1 : 1); }
      const nx = p.s.x + p.dir * 12 * dt;
      if (Math.abs(nx - p.home) < 20) p.s.x = nx; else p.dir = -p.dir;
      p.s.setFlipX(p.dir < 0).setFrame(p.dir ? Math.floor(time / 180) % 2 : 0);
      const box = { x: p.s.x - 12, y: p.s.y - 22, w: 24, h: 22 };
      const rider = players().find((a) => !a.bubbling && a.pu.ride <= 0 && overlaps(boxOf(a), box));
      if (rider && scene.mount(rider)) {
        p.used = true;
        grid.set(p.x + 1, p.y, B.AIR);
        p.s.destroy();
      }
    }
  }

  // A dino nest: walk up and the eggs hatch; the babies toss out treasure.
  function updateNests() {
    for (const n of nests) {
      if (n.open || !players().some((a) => !a.bubbling && overlaps(boxOf(a), cellBox(n.x, n.y, 3)))) continue;
      n.open = true;
      grid.set(n.x + 1, n.y, B.AIR);
      scene.tweens.add({ targets: n.s, angle: { from: -6, to: 6 }, duration: 100, yoyo: true, repeat: 3, onComplete: () => { n.s.setAngle(0); n.s.setFrame(1); } });
      scene.time.delayedCall(500, () => {
        burst(n.s.x, n.s.y - 10, nestLoot(scene.rng), 160);
        scene.effects.confetti(n.s.x, n.s.y - 10);
        scene.events.emit('nest', n);
      });
      earnSticker(scene, 'find-nest');
      scene.trip.chests++;
    }
  }

  // The giant T-rex skull: walk in and its jaw drops open; teeth tumble out.
  function updateSkull() {
    if (!skull || skull.open || !players().some((a) => !a.bubbling && overlaps(boxOf(a), cellBox(skull.x, skull.y, 3)))) return;
    skull.open = true;
    grid.set(skull.x + 1, skull.y, B.AIR);
    skull.s.setFrame(1);
    scene.cameras.main.shake(300, 0.006);
    burst(skull.s.x + 6, skull.s.y - 8, skullLoot(scene.rng), 200);
    scene.effects.confetti(skull.s.x, skull.s.y - 16);
    earnSticker(scene, 'find-rexskull');
    scene.trip.chests++;
    scene.events.emit('skull', skull);
  }

  // A fire flower: touch it and it blooms wide open, popping out flare gems.
  function updateFlowers() {
    for (const f of flowers) {
      if (f.open || !players().some((a) => !a.bubbling && overlaps(boxOf(a), cellBox(f.x, f.y, 3)))) continue;
      f.open = true;
      grid.set(f.x + 1, f.y, B.AIR);
      scene.tweens.add({ targets: f.s, scale: { from: 0.6, to: 1 }, duration: 400, ease: 'Back.easeOut' });
      f.s.setFrame(1);
      burst(f.s.x, f.s.y - 14, fireFlowerLoot(scene.rng), 160);
      scene.effects.sparkle(f.s.x, f.s.y - 12, 0xffb030, 12);
      scene.events.emit('flower', f);
      earnSticker(scene, 'find-fireflower');
      scene.trip.chests++;
    }
  }

  // The Solar Forge: walk up and it hammers away, then out pours a pile of treasure.
  function updateForge() {
    if (!forge || forge.open || !players().some((a) => !a.bubbling && overlaps(boxOf(a), cellBox(forge.x, forge.y, 3)))) return;
    forge.open = true;
    grid.set(forge.x + 1, forge.y, B.AIR);
    for (let i = 0; i < 6; i++) {
      scene.time.delayedCall(i * 180, () => {
        forge.s.setFrame(i % 2 ? 0 : 1);
        if (i % 2 === 0) {
          scene.events.emit('forge', forge);
          scene.effects.sparkle(forge.s.x + 14, forge.s.y - 12, 0xffe066, 5);
          scene.cameras.main.shake(60, 0.003);
        }
      });
    }
    scene.time.delayedCall(1100, () => {
      forge.s.setFrame(1);
      burst(forge.s.x, forge.s.y - 20, forgeLoot(scene.rng), 200);
      scene.effects.confetti(forge.s.x, forge.s.y - 16);
      scene.cameras.main.flash(140, 255, 230, 150);
    });
    earnSticker(scene, 'find-forge');
    scene.trip.chests++;
  }

  // The sleeping stegosaurus: walk up and it wakes, stretches and shakes
  // obsidian off its back plates.
  function updateStego() {
    if (!stego || stego.open || !players().some((a) => !a.bubbling && overlaps(boxOf(a), cellBox(stego.x, stego.y, 3)))) return;
    stego.open = true;
    grid.set(stego.x + 1, stego.y, B.AIR);
    stego.s.setFrame(1);
    scene.events.emit('stego', stego);
    scene.tweens.add({ targets: stego.s, scaleX: { from: 1.1, to: 1 }, x: { from: stego.s.x - 2, to: stego.s.x + 2 }, duration: 80, yoyo: true, repeat: 5 });
    scene.time.delayedCall(500, () => {
      burst(stego.s.x, stego.s.y - 20, stegoLoot(scene.rng), 200);
      scene.effects.sparkle(stego.s.x, stego.s.y - 16, 0xb89aff, 12);
    });
    earnSticker(scene, 'find-stego');
    scene.trip.chests++;
  }

  // The frozen comet: walk up to it and its ice cracks open, full of treasure.
  function updateComet() {
    if (!comet || comet.open) return;
    if (!players().some((a) => !a.bubbling && overlaps(boxOf(a), cellBox(comet.x, comet.y, 3)))) return;
    comet.open = true;
    grid.set(comet.x + 1, comet.y, B.AIR);
    comet.s.setFrame(1);
    scene.cameras.main.shake(250, 0.005);
    scene.cameras.main.flash(160, 200, 230, 255);
    burst(comet.s.x, comet.s.y - 12, cometLoot(scene.rng), 220);
    scene.effects.confetti(comet.s.x, comet.s.y - 12);
    scene.effects.sparkle(comet.s.x, comet.s.y - 12, 0x9fe8ff, 14);
    earnSticker(scene, 'find-frozencomet');
    scene.trip.chests++;
    scene.events.emit('frozenComet', comet);
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

  // A steam geyser: stand on the vent, it rumbles… and WHOOSH, up you go.
  function steam(x, y, n, spread = 6, rise = 40) {
    for (let i = 0; i < n; i++) {
      const p = scene.add.image(x + (Math.random() - 0.5) * spread, y, 'smoke').setDepth(30).setAlpha(0.8).setScale(0.6);
      scene.tweens.add({ targets: p, y: y - rise - Math.random() * rise, x: p.x + (Math.random() - 0.5) * 10, scale: 2.2, alpha: 0, delay: i * 40, duration: 700 + Math.random() * 300, onComplete: () => p.destroy() });
    }
  }
  function updateGeysers(dt) {
    for (const g of geysers) {
      const x = g.x * TILE + 8;
      const y = g.y * TILE + 10;
      const on = players().filter((a) => !a.bubbling && playerCell(a.p).cx === g.x && Math.abs(playerCell(a.p).cy - g.y) <= 1);
      g.puffT -= dt;
      if (g.state === 'idle') {
        if (g.puffT <= 0) { g.puffT = 1.2 + Math.random() * 1.5; steam(x, y, 1, 4, 14); }
        if (on.some((a) => a.p.grounded)) {
          g.state = 'rumble';
          g.t = GEYSER.rumble;
          scene.events.emit('rumble');
          scene.cameras.main.shake(GEYSER.rumble * 1000, 0.002);
        }
      } else if (g.state === 'rumble') {
        g.t -= dt;
        if (Math.random() < 0.5) scene.effects.sparkle(x, y, 0xffa050, 1);
        if (g.t <= 0) {
          g.state = 'rest';
          g.t = GEYSER.rest;
          for (const a of on) {
            a.p.vy = -GEYSER.launch;
            a.p.grounded = false;
            a.p.mining = null;
            a.sprite.setScale(0.7, 1.3);
          }
          steam(x, y, 12, 10, 60);
          scene.events.emit('geyser', g);
          if (on.length) earnSticker(scene, 'find-geyser');
        }
      } else {
        g.t -= dt;
        if (g.t <= 0) g.state = 'idle';
      }
    }
  }

  // An old rover: walk up to it and it wakes up (beep boop), pops open, full of bolts.
  function updateRovers() {
    for (const r of rovers) {
      if (r.open) continue;
      if (!players().some((a) => !a.bubbling && overlaps(boxOf(a), cellBox(r.x, r.y, 3)))) continue;
      r.open = true;
      grid.set(r.x + 1, r.y, B.AIR);
      scene.events.emit('beep');
      // it blinks awake, then pops open
      let n = 0;
      const blink = scene.time.addEvent({ delay: 110, repeat: 5, callback: () => { r.s.setFrame(n++ % 2); } });
      scene.time.delayedCall(720, () => {
        blink.remove();
        r.s.setFrame(1);
        scene.tweens.add({ targets: r.s, scaleY: { from: 1.2, to: 1 }, duration: 300, ease: 'Back.easeOut' });
        burst(r.s.x, r.s.y - 14, roverLoot(scene.rng), 200);
        scene.effects.confetti(r.s.x, r.s.y - 14);
        scene.cameras.main.flash(120, 255, 220, 160);
        scene.events.emit('chestOpened', r);
      });
      earnSticker(scene, 'find-rover');
      scene.trip.chests++;
    }
  }

  // A vault: step on its glyph button and the door rumbles open.
  function updateVaults() {
    for (const v of vaults) {
      if (v.open) continue;
      const pressed = players().some((a) => !a.bubbling && playerCell(a.p).cx === v.glyph.x && playerCell(a.p).cy === v.glyph.y);
      if (!pressed) continue;
      v.open = true;
      scene.events.emit('vault');
      scene.cameras.main.shake(700, 0.004);
      scene.effects.sparkle(v.glyph.x * TILE + 8, v.glyph.y * TILE + 8, 0x5af0ff, 12);
      v.door.forEach((d, i) => {
        scene.time.delayedCall(350 + i * 250, () => {
          grid.set(d.x, d.y, B.AIR);
          scene.mapView.sync(d.x, d.y);
          scene.effects.chunks(d.x, d.y, B.VAULT_DOOR);
          scene.effects.sparkle(d.x * TILE + 8, d.y * TILE + 8, 0xffd84a, 8);
        });
      });
      scene.time.delayedCall(950, () => {
        const x = (v.x0 + 3.5) * TILE;
        const y = (v.y0 + 3) * TILE;
        burst(x, y, vaultLoot(scene.rng), 120);
        scene.effects.confetti(x, y);
        scene.cameras.main.flash(150, 255, 230, 150);
      });
      earnSticker(scene, 'find-vault');
    }
  }

  // All 9 cells dug: the Heart is yours! It floats up and rides home with you.
  function winHeart() {
    if (heart.kind === 'moon') moonHearts++;
    if (heart.kind && heart.kind !== 'earth') suitHearts++;
    else hearts++;
    const s = heart.s;
    scene.tweens.killTweensOf(s);
    s.setAlpha(1).setScale(1);
    scene.tweens.add({ targets: s, scale: 1.6, duration: 500, ease: 'Back.easeOut', yoyo: true, hold: 700 });
    scene.tweens.add({ targets: s, y: s.y - 60, alpha: 0, delay: 1400, duration: 900, ease: 'Quad.easeIn', onComplete: () => s.destroy() });
    for (let i = 0; i < 3; i++) scene.time.delayedCall(i * 300, () => scene.effects.confetti(s.x + (i - 1) * 20, s.y));
    scene.cameras.main.flash(300, 255, 180, 210);
    scene.cameras.main.shake(300, 0.005);
    burst(s.x, s.y, heartLook.loot, 220);
    earnSticker(scene, heartLook.sticker);
    scene.events.emit('heart', heart);
    heart.s = null;
  }

  return {
    carried,
    eggs,
    light,
    get hearts() { return hearts; },
    get moonHearts() { return moonHearts; },
    get suitHearts() { return suitHearts; },
    rovers,
    vaults,
    // little lights: glyph buttons still to press, and hot geyser vents
    lights(view, flicker) {
      const out = [];
      const near = (x, y) => x > view.x - 64 && x < view.right + 64 && y > view.y - 64 && y < view.bottom + 64;
      for (const v of vaults) {
        const x = v.glyph.x * TILE + 8;
        const y = v.glyph.y * TILE + 8;
        if (!v.open && near(x, y)) out.push({ x, y, r: 1.4 * flicker, glow: 0.2, color: 0x5af0ff });
      }
      for (const f of flowers) if (near(f.s.x, f.s.y)) out.push({ x: f.s.x, y: f.s.y - 12, r: (f.open ? 2.2 : 1.4) * flicker, glow: 0.2, color: 0xffa030 });
      if (forge && near(forge.s.x, forge.s.y)) out.push({ x: forge.s.x - 8, y: forge.s.y - 10, r: 2.4 * flicker, glow: 0.22, color: 0xffb040 });
      for (const g of geysers) {
        const x = g.x * TILE + 8;
        const y = g.y * TILE + 12;
        if (near(x, y)) out.push({ x, y, r: (g.state === 'rumble' ? 1.6 : 0.9) * flicker, glow: 0.14, color: 0xff8a2a });
      }
      return out;
    },
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
      } else if (heart && m.id === heartLook.block) {
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
      updateGeysers(dt);
      updateRovers();
      updateGlobes();
      updateComet();
      updateParasaurs(dt, time);
      updateNests();
      updateSkull();
      updateStego();
      updateFlowers();
      updateForge();
      updateVaults();
      // "together!": a boulder or the big chest needs both of you
      const spot = chestNeedsTwo ?? (lonely ? { x: lonely.x * TILE + 8, y: lonely.y * TILE - 12 } : null);
      together.setVisible(!!spot);
      if (spot) together.setPosition(spot.x, spot.y + Math.sin(time / 150) * 2).setScale(1 + Math.sin(time / 120) * 0.1);
      for (const e of eggs) if (!e.taken) e.s.setVisible(true);
    },
  };
}
