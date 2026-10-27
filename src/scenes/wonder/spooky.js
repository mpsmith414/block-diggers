// Spooky Planet: Trick-or-Treat Street. Knock on doors for surprises and
// candy, carve pumpkins, jump for candy on the trees and balconies, and touch
// a friendly ghost to turn into one (floaty jumps for 6 seconds). Forty
// candies open the gate to the Haunted House, where the Pumpkin King throws
// a party and the Golden Pumpkin is waiting.

import Phaser from 'phaser';
import { spookyLevel, dealSurprises, openGate, SPOOKY, SP, SURPRISES } from '../../game/wonder/spooky.js';
import { touching } from '../../game/wonder/body.js';
import { createRng } from '../../world/rng.js';
import { HOUSE_LOOK_COUNT } from '../../art/wonder/spooky.js';
import { walkerBody, stepWalker, bakeTiles, createPickups, createPrompt, flyTo, middleOf, WALK } from './kit.js';
import { TILE } from '../../tuning.js';

const T = TILE;
const GHOST_FALL = 0.35;
const CANDY_FRAMES = 4;

export function createSpooky(scene) {
  const L = spookyLevel();
  const { level } = L;
  const G = SPOOKY.ground;
  const GY = G * T;
  const W = level.w * T;
  const H = level.h * T;
  const rng = createRng(Date.now() >>> 0);
  const surprises = dealSurprises(rng);
  let candy = 0;
  const addCandy = (n = 1) => { candy += n; scene.events.emit('pickup'); };

  drawBackdrop(scene, W, H, GY);

  // the street
  bakeTiles(scene, level, 'spooky-tiles', (n, x, y) => {
    if (n === SP.GRASS) return 0;
    if (n === SP.EARTH) return 1;
    if (n === SP.CRATE) return L.graves.includes(x) ? 4 : 2;
    if (n === SP.LEDGE && y === G - 1) return 3; // (fences; balconies are drawn by their house)
    return null;
  }, 2);
  for (const x of [10, 33, 64, 84, 117, 136, 149]) {
    scene.add.image(x * T + 8, GY + 1, 'spooky-lamp').setOrigin(0.5, 1).setDepth(1);
    const glow = scene.add.image(x * T + 8, GY - 45, 'light').setTint(0xffd860).setAlpha(0.35).setScale(1.4).setDepth(1).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: glow, alpha: 0.22, duration: 900 + (x % 5) * 120, yoyo: true, repeat: -1 });
  }
  for (const t of L.trees) scene.add.image(t.x * T + 8, GY, 'spooky-tree').setOrigin(0.5, 1).setDepth(1);

  // the houses and their doors
  const doors = L.houses.map((hs, i) => {
    scene.add.image(hs.x * T + 40, GY, `spooky-house-${i % HOUSE_LOOK_COUNT}`).setOrigin(0.5, 1).setDepth(0);
    const x = hs.door * T + 8;
    const sprite = scene.add.sprite(x, GY - 1, 'spooky-door', 0).setOrigin(0.5, 1).setDepth(3);
    return { x, sprite, kind: surprises[i], open: false };
  });

  // pumpkins in the patch
  const pumpkins = L.pumpkins.map((p) => {
    const sprite = scene.add.sprite(p.x * T + 8, GY, 'spooky-pumpkin', 0).setOrigin(0.5, 1).setDepth(4);
    return { x: p.x * T + 8, sprite, carved: false, glow: null };
  });

  // the gate (two halves) and the Haunted House behind it
  const gateX = L.gate[0] * T;
  const gate = [0, 1].map((f) => scene.add.image(gateX + f * 32, GY, 'spooky-gate', f).setOrigin(f ? 1 : 0, 1).setDepth(5));
  // (the gate is two cells wide: each half covers one)
  gate[0].setDisplaySize(16, 160);
  gate[1].setDisplaySize(16, 160);
  const hauntedDoor = L.haunted.door * T + 8;
  scene.add.image(hauntedDoor, GY, 'spooky-haunted').setOrigin(0.5, 1).setDepth(0);
  const king = scene.add.image(hauntedDoor, GY - 150, 'spooky-king').setScale(0).setDepth(6);
  const doorGlow = scene.add.image(hauntedDoor, GY - 20, 'light').setTint(0xffb04a).setScale(1.6).setAlpha(0).setDepth(1).setBlendMode(Phaser.BlendModes.ADD);

  // loose candy
  const pickups = createPickups(scene, L.candies.map((c, k) => ({ x: c.x * T + 8, y: c.y * T + 8, key: 'spooky-candy', frame: k % CANDY_FRAMES })));

  // the friendly ghosts, floating to and fro
  const ghosts = L.ghosts.map((g, k) => ({
    ...g, phase: k * 2.1, speed: 0.25 + k * 0.05,
    sprite: scene.add.sprite(g.x0 * T, g.y * T, 'spooky-ghost', 0).setDepth(40).setAlpha(0.9),
  }));
  let partied = false;

  // ---------- the player ----------

  const spawn = (a) => {
    const at = a.at ?? { x: scene.mod.pad.x + (a.slot ? 14 : -14), y: GY };
    a.b = walkerBody(at.x, at.y);
    a.ghostT = 0;
    a.ghostAgain = 0;
    a.prompt = createPrompt(scene);
    a.sheet = scene.add.image(0, 0, 'spooky-sheet').setOrigin(0.5, 1).setDepth(31).setVisible(false);
  };

  // what's in reach to use with A: a door to knock on, a pumpkin to carve
  const usable = (a) => {
    if (!a.b.grounded || a.b.y + a.b.h < GY - 2) return null;
    const cx = a.b.x + a.b.w / 2;
    const door = doors.find((d) => !d.open && Math.abs(d.x - cx) < 10);
    if (door) return { door, x: door.x, y: GY - 40 };
    const p = pumpkins.find((q) => !q.carved && Math.abs(q.x - cx) < 12);
    if (p) return { pumpkin: p, x: p.x, y: GY - 28 };
    return null;
  };

  const knock = (a, d) => {
    d.open = true;
    scene.events.emit('sfx', 'knock');
    scene.tweens.add({ targets: d.sprite, x: d.x + 1, duration: 50, yoyo: true, repeat: 3 });
    scene.time.delayedCall(450, () => {
      d.sprite.setFrame(1);
      const from = { x: d.x, y: GY - 14 };
      const n = SURPRISES[d.kind];
      const give = (delay) => scene.time.delayedCall(delay, () => flyTo(scene, from, a.b, 'spooky-candy', n, () => addCandy(1), { spread: 22 }));
      if (d.kind === 'candy') {
        scene.events.emit('sfx', 'trick');
        scene.effects.confetti(d.x, GY - 20);
        give(0);
      } else if (d.kind === 'ghost') {
        const g = scene.add.sprite(d.x, GY - 10, 'spooky-ghost', 0).setDepth(50).setScale(0.3);
        scene.events.emit('sfx', 'boo');
        scene.tweens.add({ targets: g, scale: 1.4, y: GY - 34, duration: 400, ease: 'Back.easeOut' });
        scene.time.delayedCall(900, () => scene.events.emit('sfx', 'giggle'));
        scene.tweens.add({ targets: g, y: GY - 140, x: d.x + 30, alpha: 0, duration: 1400, delay: 1100, onComplete: () => g.destroy() });
        give(700);
      } else if (d.kind === 'skeleton') {
        const s = scene.add.sprite(d.x, GY, 'spooky-skeleton', 0).setOrigin(0.5, 1).setDepth(50).setScale(1, 0);
        scene.tweens.add({ targets: s, scaleY: 1, duration: 250, ease: 'Back.easeOut' });
        for (let k = 0; k < 8; k++) scene.time.delayedCall(250 + k * 200, () => { s.setFrame(k % 2); s.setFlipX(k % 4 >= 2); if (k % 2 === 0) scene.events.emit('sfx', 'rattle'); });
        scene.tweens.add({ targets: s, y: GY - 4, duration: 100, yoyo: true, repeat: 7, delay: 250 });
        scene.tweens.add({ targets: s, scaleY: 0, duration: 250, delay: 2100, onComplete: () => s.destroy() });
        give(600);
      } else {
        const c = scene.add.sprite(d.x, GY, 'spooky-cat', 0).setOrigin(0.5, 1).setDepth(50).setAlpha(0);
        scene.tweens.add({ targets: c, alpha: 1, duration: 200 });
        scene.events.emit('sfx', 'meow');
        scene.time.delayedCall(500, () => c.setFrame(1));
        scene.tweens.add({ targets: c, x: d.x + 24, duration: 600, delay: 900, onComplete: () => scene.tweens.add({ targets: c, alpha: 0, duration: 300, onComplete: () => c.destroy() }) });
        give(400);
      }
    });
  };

  const carve = (a, p) => {
    p.carved = true;
    scene.events.emit('sfx', 'crack');
    p.sprite.setFrame(1 + (Math.round(p.x) % 2));
    scene.tweens.add({ targets: p.sprite, scaleY: 1.2, duration: 100, yoyo: true });
    p.glow = scene.add.image(p.x, GY - 8, 'light').setTint(0xffb04a).setAlpha(0.45).setScale(0.8).setDepth(3).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: p.glow, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });
    scene.effects.sparkle(p.x, GY - 8, 0xffe066, 6);
    flyTo(scene, { x: p.x, y: GY - 10 }, a.b, 'spooky-candy', 1, () => addCandy(1));
  };

  const ghostMode = (a, on) => {
    if (on) {
      a.ghostT = SPOOKY.ghostTime;
      scene.events.emit('sfx', 'boo');
      scene.effects.sparkle(a.b.x + 6, a.b.y + 4, 0xffffff, 10);
      scene.fun();
    } else {
      a.ghostT = 0;
      a.ghostAgain = SPOOKY.ghostAgain;
      scene.effects.sparkle(a.b.x + 6, a.b.y + 4, 0xffffff, 8);
      scene.events.emit('bubblePop');
    }
  };

  const step = (a, i, e, dt, time) => {
    const spot = !a.hidden && !scene.partying ? usable(a) : null;
    a.prompt.show(spot, time);
    if (e.a && spot) {
      if (spot.door) knock(a, spot.door);
      else carve(a, spot.pumpkin);
    } else if (e.a) a.b.jumpPressed = true;

    const ghost = a.ghostT > 0;
    const r = stepWalker(a.b, i, level, dt, ghost
      ? { gravity: WALK.gravity * GHOST_FALL, maxFall: 90, airJumps: 3, jump: 150 }
      : {});
    if (r.jumped) scene.events.emit('jump', a);
    if (ghost) {
      a.ghostT -= dt;
      if (a.ghostT <= 0) ghostMode(a, false);
    } else if (a.ghostAgain > 0) a.ghostAgain -= dt;

    // candy lying about
    for (const p of pickups.take(a.b)) { addCandy(1); scene.effects.sparkle(p.x, p.y, 0xffe066, 5); }
    // a friendly ghost: become one too
    if (!a.hidden && a.ghostT <= 0 && a.ghostAgain <= 0) {
      for (const g of ghosts) {
        if (touching(a.b, { x: g.sprite.x - 7, y: g.sprite.y - 7, w: 14, h: 14 })) { ghostMode(a, true); break; }
      }
    }
    // the Haunted House's door, once the gate is open
    if (scene.goalDone && !partied && !a.hidden && Math.abs(a.b.x + a.b.w / 2 - hauntedDoor) < 14 && a.b.grounded) party();

    scene.drawCharacter(a, a.b, dt, time);
    a.sprite.setAlpha(ghost ? 0.55 : 1);
    a.sheet.setVisible(ghost && !a.hidden).setPosition(a.sprite.x, a.sprite.y + 1).setFlipX(a.sprite.flipX)
      .setAlpha(ghost && a.ghostT < 1.5 ? 0.5 + 0.5 * Math.abs(Math.sin(time / 90)) : 1);
  };

  // ---------- the world ----------

  const update = (dt, time) => {
    for (const g of ghosts) {
      const t = time / 1000 * g.speed + g.phase;
      const u = (Math.sin(t) + 1) / 2;
      const x = (g.x0 + (g.x1 - g.x0) * u) * T;
      g.sprite.setFlipX(Math.cos(t) < 0);
      g.sprite.setPosition(x, g.y * T + Math.sin(time / 400 + g.phase) * 6);
      g.sprite.setFrame(Math.floor(time / 300 + g.phase) % 2);
    }
  };

  // the bucket's full: the gate swings open, and the Haunted House's door glows
  const ready = () => {
    openGate(level, L);
    scene.time.delayedCall(700, () => {
      scene.events.emit('sfx', 'rumble');
      scene.tweens.add({ targets: gate[0], scaleX: gate[0].scaleX * 0.2, duration: 900, ease: 'Cubic.easeOut' });
      scene.tweens.add({ targets: gate[1], scaleX: gate[1].scaleX * 0.2, duration: 900, ease: 'Cubic.easeOut' });
      scene.tweens.add({ targets: doorGlow, alpha: 0.5, duration: 600, yoyo: true, repeat: -1, hold: 300 });
      for (let k = 0; k < 5; k++) scene.time.delayedCall(k * 150, () => scene.effects.sparkle(gateX + 16, GY - 20 - k * 25, 0xb0ff6a, 5));
    });
    return { x: gateX + 60, y: GY - 60 };
  };

  // The party at the Haunted House: the Pumpkin King rises over the door,
  // skeletons dance, bats swirl, and the Golden Pumpkin!
  const party = () => {
    partied = true;
    scene.tweens.add({ targets: king, scale: 1.4, y: GY - 150, duration: 900, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: king, angle: { from: -5, to: 5 }, duration: 400, yoyo: true, repeat: -1, delay: 900 });
    for (let k = 0; k < 4; k++) {
      const s = scene.add.sprite(hauntedDoor - 60 + k * 40, GY, 'spooky-skeleton', 0).setOrigin(0.5, 1).setDepth(7).setScale(1, 0);
      scene.tweens.add({ targets: s, scaleY: 1, duration: 300, delay: 300 + k * 150, ease: 'Back.easeOut' });
      scene.time.addEvent({ delay: 220, loop: true, callback: () => { s.setFrame((Number(s.frame.name) + 1) % 2); s.y = s.y === GY ? GY - 3 : GY; } });
    }
    for (let k = 0; k < 6; k++) {
      const bat = scene.add.sprite(hauntedDoor, GY - 100, 'bat', 0).setDepth(60);
      scene.time.addEvent({ delay: 120, loop: true, callback: () => bat.setFrame((Number(bat.frame.name) + 1) % 2) });
      const rad = 60 + k * 12;
      scene.tweens.addCounter({ from: 0, to: Math.PI * 2, duration: 2600 + k * 300, repeat: -1, onUpdate: (tw) => {
        const v = tw.getValue() + k;
        bat.setPosition(hauntedDoor + Math.cos(v) * rad, GY - 110 + Math.sin(v) * rad * 0.4);
      } });
    }
    scene.events.emit('sfx', 'boo');
    scene.prizeParty(hauntedDoor, GY - 30);
  };

  const cheer = (a) => { a.b.vy = -200; };

  return {
    world: { w: W, h: H },
    pad: { x: L.pad.x * T + 8, y: GY },
    zoom: [1.15, 1.6],
    lead: () => ({ x: 0, y: -44 }),
    goal: () => ({ have: Math.min(candy, SPOOKY.need), need: SPOOKY.need }),
    spawn,
    step,
    update,
    focus: (a) => ({ x: a.b.x + a.b.w / 2, y: a.b.y + a.b.h - 8 }),
    place: (a, x, y) => { a.b.x = x - a.b.w / 2; a.b.y = Math.min(y, GY) - a.b.h; a.b.vx = 0; a.b.vy = 0; },
    onFoot: (a) => a.b.grounded,
    ready,
    cheer,
    middle: (a) => middleOf(a.b),
  };
}

// A night sky: deep purple fading down, stars, the big moon (drifting slowly
// with the camera), far-off hills and fog.
function drawBackdrop(scene, W, H, GY) {
  const g = scene.add.graphics().setDepth(-30);
  g.fillGradientStyle(0x120a24, 0x120a24, 0x3a1a5a, 0x3a1a5a, 1);
  g.fillRect(0, 0, W, GY);
  const rng = createRng(31);
  for (let i = 0; i < 160; i++) {
    const s = scene.add.image(rng.int(0, W), rng.int(0, GY - 80), 'pixel').setTint(rng.pick([0xffffff, 0xfff6d0, 0xd8c8ff])).setDepth(-29).setAlpha(0.4 + rng.next() * 0.6);
    if (i % 5 === 0) scene.tweens.add({ targets: s, alpha: 0.15, duration: 800 + (i % 7) * 150, yoyo: true, repeat: -1 });
  }
  scene.add.image(300, 70, 'spooky-moon').setScrollFactor(0.15, 0.3).setDepth(-28).setScale(1.3);
  const glow = scene.add.image(300, 70, 'light').setScrollFactor(0.15, 0.3).setDepth(-28.5).setTint(0xfff2b0).setScale(4).setAlpha(0.25).setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({ targets: glow, alpha: 0.18, duration: 2400, yoyo: true, repeat: -1 });
  // far hills with little crooked houses
  const hills = scene.add.graphics().setScrollFactor(0.5, 1).setDepth(-27);
  hills.fillStyle(0x24163a, 1);
  for (let x = -40; x < W * 0.6 + 400; x += 70) hills.fillCircle(x, GY + 10, 50 + ((x * 13) % 30));
  for (let x = 30; x < W * 0.6 + 400; x += 190) {
    hills.fillRect(x, GY - 58, 18, 20);
    hills.fillTriangle(x - 3, GY - 58, x + 21, GY - 58, x + 9, GY - 72);
    hills.fillStyle(0xffd860, 0.8).fillRect(x + 7, GY - 52, 4, 4).fillStyle(0x24163a, 1);
  }
  // bats flapping past the moon now and then
  scene.time.addEvent({
    delay: 3500, loop: true, callback: () => {
      const bat = scene.add.sprite(-20, 50 + Math.random() * 40, 'bat', 0).setScrollFactor(0.15, 0.3).setDepth(-27.5).setScale(0.7);
      const flap = scene.time.addEvent({ delay: 120, loop: true, callback: () => bat.setFrame((Number(bat.frame.name) + 1) % 2) });
      scene.tweens.add({ targets: bat, x: 600, y: bat.y + (Math.random() - 0.5) * 40, duration: 6000, onComplete: () => { flap.remove(); bat.destroy(); } });
    },
  });
  // fog along the street
  for (let k = 0; k < 16; k++) {
    const f = scene.add.image(k * 180, GY - 2, 'light').setTint(0xd8c8ff).setScale(7, 1.1).setAlpha(0.16).setDepth(35);
    scene.tweens.add({ targets: f, x: f.x + 60, alpha: 0.08, duration: 5000 + k * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}
