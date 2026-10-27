// Ocean Planet: Deep Blue Dive. Land on the island, jump in, and swim any
// way the stick points (A is a kick: a quick dash with bubbles; at the
// surface it leaps out). Swim up to a clam and it opens with a pearl.
// Touch a sea turtle to ride it, fast. Jellyfish boing you gently away,
// pufferfish puff up, fish scatter. Twenty pearls open the Giant Clam at
// the bottom of the deep, with the Golden Submarine inside.

import Phaser from 'phaser';
import { oceanLevel, floorRow, OCEAN, SWIM, OC, swimVelocity } from '../../game/wonder/ocean.js';
import { moveBody, touching } from '../../game/wonder/body.js';
import { createRng } from '../../world/rng.js';
import { walkerBody, stepWalker, bakeTiles, flyTo } from './kit.js';
import { TILE } from '../../tuning.js';

const T = TILE;
const FISH_TINTS = [0xff9a3a, 0xffd84a, 0x4ab0ff, 0xff6a9a, 0x6ad07a];

export function createOcean(scene) {
  const L = oceanLevel();
  const { level } = L;
  const S = OCEAN.surface;
  const SY = S * T;
  const W = level.w * T;
  const H = level.h * T;
  const rng = createRng(Date.now() >>> 0);
  let pearls = 0;

  drawBackdrop(scene, W, H, SY);
  const FRAME = { [OC.SAND]: 0, [OC.DEEP]: 1, [OC.ROCK]: 2, [OC.CORAL]: 3, [OC.PLANK]: 4, [OC.GRASS]: 5, [OC.ISLAND]: 6 };
  bakeTiles(scene, level, 'ocean-tiles', (n) => FRAME[n] ?? null, 2);

  // the island's palm tree and dock; the ship's mast; kelp and coral on the seabed
  scene.add.image(2 * T, SY - T, 'ocean-palm').setOrigin(0.5, 1).setDepth(1);
  scene.add.image(11 * T, SY - T, 'ocean-palm').setOrigin(0.5, 1).setDepth(1).setFlipX(true).setScale(0.85);
  scene.add.image(72 * T, L.ship.deck * T, 'ocean-mast').setOrigin(0.5, 1).setDepth(1).setAngle(-8);
  for (const x of L.kelp) {
    const k = scene.add.image(x * T + 8, floorRow(x) * T + 2, 'ocean-kelp').setOrigin(0.5, 1).setDepth(5).setScale(1, 0.8 + (x % 3) * 0.25);
    scene.tweens.add({ targets: k, angle: { from: -6, to: 6 }, duration: 1800 + (x % 5) * 300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  for (const x of [17, 22, 26, 30, 34, 39, 58, 86, 97, 115, 122]) scene.add.image(x * T + 8, floorRow(x) * T + 1, 'ocean-coral', x % 2).setOrigin(0.5, 1).setDepth(4);
  // the waves along the top of the water
  const waves = scene.add.tileSprite(14 * T, SY - 4, W - 14 * T, 6, 'ocean-waves').setOrigin(0).setDepth(40);

  // the clams
  const clams = L.clams.map((c) => ({ ...c, open: false, sprite: scene.add.sprite(c.x * T + 8, (c.y + 1) * T, 'ocean-clam', 0).setOrigin(0.5, 1).setDepth(6) }));
  // the Giant Clam, at the bottom of the deep
  const gx = L.giant.x * T + 8;
  const gy = (L.giant.y + 1) * T;
  // (it sits over the deep's darkness, so it shows up)
  const giant = scene.add.sprite(gx, gy, 'ocean-giantclam', 0).setOrigin(0.5, 1).setDepth(17);
  const sub = scene.add.image(gx, gy - 18, 'wprize-submarine').setScale(2).setDepth(17.5).setVisible(false);
  const giantGlow = scene.add.image(gx, gy - 20, 'light').setTint(0xffe9a0).setScale(2.4).setAlpha(0).setDepth(16.8).setBlendMode(Phaser.BlendModes.ADD);

  // sea life
  const turtles = L.turtles.map((t, k) => ({ ...t, x: (t.x0 + k * 10) * T, y: t.y * T, lineY: t.y * T, dir: 1, rider: null, sprite: scene.add.sprite(0, 0, 'ocean-turtle', 0).setDepth(28) }));
  const jellies = L.jellies.map(([x, y], k) => ({ x: x * T + 8, y: y * T + 8, phase: k, sprite: scene.add.sprite(x * T + 8, y * T + 8, 'ocean-jelly', 0).setDepth(27).setAlpha(0.9) }));
  for (const j of jellies) {
    const glow = scene.add.image(j.x, j.y, 'light').setTint(0xff9ad0).setAlpha(0.3).setScale(0.9).setDepth(26).setBlendMode(Phaser.BlendModes.ADD);
    j.glow = glow;
  }
  const puffers = L.puffers.map(([x, y], k) => ({ x: x * T + 8, y: y * T + 8, phase: k * 2, puffed: false, sprite: scene.add.sprite(x * T + 8, y * T + 8, 'ocean-puffer', 0).setDepth(27) }));
  const angler = { x: 110 * T, dir: 1, sprite: scene.add.image(110 * T, 52 * T, 'ocean-angler').setDepth(27) };
  angler.glow = scene.add.image(0, 0, 'light').setTint(0xffe066).setAlpha(0.5).setScale(0.8).setDepth(26).setBlendMode(Phaser.BlendModes.ADD);
  const schools = [[30, 14], [50, 26], [75, 22], [110, 30]].map(([x, y], k) => ({
    cx: x * T, cy: y * T, home: { x: x * T, y: y * T }, phase: k * 1.7, flee: { x: 0, y: 0 },
    fish: Array.from({ length: 6 }, (_, i) => ({ dx: (i % 3) * 12 - 12 + (i > 2 ? 6 : 0), dy: (i > 2 ? 8 : 0) - 4, sprite: scene.add.image(0, 0, 'ocean-fish').setTint(FISH_TINTS[(k + i) % FISH_TINTS.length]).setDepth(25) })),
  }));
  let partied = false;

  // ---------- the divers ----------

  const spawn = (a) => {
    const at = a.at ?? { x: scene.mod.pad.x + (a.slot ? 14 : -14), y: SY - T };
    a.b = walkerBody(at.x, at.y);
    a.mode = 'air';
    a.dashT = 0;
    a.bounceT = 0;
    a.ride = null;
    a.rideT = 0;
    a.bubbleT = 0;
  };

  const inWater = (b) => b.y + b.h / 2 > SY + 2 && b.x + b.w / 2 > 14 * T;

  const splash = (b) => {
    scene.events.emit('splash');
    scene.events.emit('sfx', 'splash');
    for (let k = 0; k < 6; k++) {
      const d = scene.add.image(b.x + b.w / 2, SY - 2, 'ocean-bubble').setDepth(41);
      scene.tweens.add({ targets: d, x: d.x + (k - 2.5) * 6, y: d.y - 10 - (k % 3) * 4, alpha: 0, duration: 450, onComplete: () => d.destroy() });
    }
  };

  const bubble = (x, y, depth = 24) => {
    const d = scene.add.image(x, y, 'ocean-bubble').setDepth(depth).setScale(0.6 + Math.random() * 0.6);
    scene.tweens.add({ targets: d, y: Math.max(SY + 4, y - 60 - Math.random() * 60), x: x + (Math.random() - 0.5) * 12, alpha: 0, duration: 1600, onComplete: () => d.destroy() });
  };

  const step = (a, i, e, dt, time) => {
    const b = a.b;
    if (!inWater(b)) {
      // on the island, or flying out of a leap
      if (e.a) b.jumpPressed = true;
      const r = stepWalker(b, i, level, dt);
      if (r.jumped) scene.events.emit('jump', a);
      if (inWater(b) && a.mode === 'air' && b.vy > 0) { splash(b); b.vy *= 0.3; }
      a.mode = inWater(b) ? 'swim' : 'air';
      scene.drawCharacter(a, b, dt, time);
      a.sprite.setAngle(0);
      return;
    }
    if (a.mode !== 'swim') splash(b);
    a.mode = 'swim';
    b.grounded = false;
    // riding a turtle: faster, for a while
    a.rideT = Math.max(0, a.rideT - dt);
    if (a.ride && a.rideT <= 0) { a.ride.rider = null; a.ride.again = 1.5; a.ride = null; scene.events.emit('bubblePop'); }
    const mul = a.ride ? SWIM.turtle / SWIM.speed : 1;
    const stick = { x: i.moveX || 0, y: i.moveY || 0 };
    const atTop = b.y + b.h / 2 < SY + 9;
    let v = { x: b.vx, y: b.vy };
    a.dashT = Math.max(0, a.dashT - dt);
    if (a.bounceT > 0) a.bounceT -= dt;
    else if (a.dashT <= 0) v = swimVelocity(v, stick, dt, mul);
    if (e.a) {
      if (atTop) { v.y = -SWIM.leap; b.y = SY - b.h / 2 - 2; scene.events.emit('jump', a); }
      else {
        const len = Math.hypot(stick.x, stick.y);
        const dir = len > 0.2 ? { x: stick.x / len, y: stick.y / len } : { x: b.facing, y: 0 };
        v = { x: dir.x * SWIM.dash * mul, y: dir.y * SWIM.dash * mul };
        a.dashT = SWIM.dashTime;
        scene.events.emit('sfx', 'swim');
        for (let k = 0; k < 4; k++) bubble(b.x + b.w / 2 - dir.x * 8, b.y + b.h / 2 - dir.y * 8 + k * 2, 31);
      }
    }
    // bob at the surface rather than popping out of it
    if (atTop && v.y < 0 && v.y > -SWIM.leap * 0.9) { v.y = 0; b.y = SY + 6 - b.h / 2; }
    b.vx = v.x;
    b.vy = v.y;
    if (v.x) b.facing = Math.sign(v.x) || b.facing;
    const out = moveBody(b, level, dt, {});
    // at the surface by the island: hop up onto it
    if (atTop && (out.left || out.right) && stick.x) { b.vy = -SWIM.leap; b.y = SY - b.h / 2 - 2; }
    // bubbles now and then
    a.bubbleT -= dt;
    if (a.bubbleT <= 0) { a.bubbleT = 0.6 + Math.random() * 0.5; bubble(b.x + b.w / 2 + b.facing * 4, b.y + 2, 31); }

    // clams: swim up to one and it opens
    for (const c of clams) {
      if (c.open || a.hidden) continue;
      if (touching(b, { x: c.x * T, y: c.y * T + 4, w: 16, h: 12 }, 2)) {
        c.open = true;
        c.sprite.setFrame(1);
        scene.events.emit('sfx', 'clam');
        scene.effects.sparkle(c.x * T + 8, c.y * T + 8, 0xffffff, 6);
        flyTo(scene, { x: c.x * T + 8, y: c.y * T + 8 }, b, 'wonder-pearl', 1, () => { pearls++; scene.events.emit('pickup'); });
      }
    }
    // a turtle: hop on
    if (!a.ride && !a.hidden) {
      for (const t of turtles) {
        if (t.rider || (t.again ?? 0) > 0) continue;
        if (touching(b, { x: t.x - 14, y: t.y - 8, w: 28, h: 16 })) {
          t.rider = a;
          a.ride = t;
          a.rideT = SWIM.rideTime;
          scene.events.emit('sfx', 'boing');
          scene.fun();
          break;
        }
      }
    }
    // jellyfish and pufferfish bump you away, gently
    if (a.bounceT <= 0 && !a.ride) {
      for (const j of [...jellies, ...puffers]) {
        const dx = b.x + b.w / 2 - j.sprite.x;
        const dy = b.y + b.h / 2 - j.sprite.y;
        if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
          const len = Math.hypot(dx, dy) || 1;
          b.vx = (dx / len) * 160;
          b.vy = (dy / len) * 160;
          a.bounceT = 0.4;
          scene.events.emit('sfx', 'boing');
          scene.tweens.add({ targets: j.sprite, scaleX: 1.3, scaleY: 0.8, duration: 100, yoyo: true });
          break;
        }
      }
    }
    // the Giant Clam, once it's open
    if (scene.goalDone && !partied && !a.hidden && Math.abs(b.x + b.w / 2 - gx) < 32 && Math.abs(b.y + b.h / 2 - (gy - 16)) < 30) {
      partied = true;
      for (const s of schools) s.party = true;
      scene.prizeParty(gx, gy - 24);
    }

    // drawing: kicking frames, tilted the way you swim
    scene.drawCharacter(a, b, dt, time);
    const moving = Math.hypot(b.vx, b.vy) > 10;
    a.sprite.setFrame(moving ? 1 + (Math.floor(time / (a.dashT > 0 ? 80 : 180)) % 2) : 1);
    a.sprite.setAngle(Phaser.Math.Clamp(b.vy / SWIM.speed, -1, 1) * 25 * (b.facing || 1));
    if (a.ride) a.sprite.setY(a.sprite.y - 2);
  };

  // ---------- the sea ----------

  const update = (dt, time) => {
    waves.tilePositionX += dt * 12;
    for (const t of turtles) {
      t.again = Math.max(0, (t.again ?? 0) - dt);
      if (t.rider) {
        const b = t.rider.b;
        t.x = b.x + b.w / 2;
        t.y = b.y + b.h + 6;
        t.dir = b.facing;
      } else {
        t.x += t.dir * 30 * dt;
        if (t.x > t.x1 * T) t.dir = -1;
        if (t.x < t.x0 * T) t.dir = 1;
        t.y += (t.lineY - t.y) * Math.min(1, dt * 0.8);
      }
      t.sprite.setPosition(t.x, t.y + Math.sin(time / 500) * 2).setFlipX(t.dir < 0).setFrame(Math.floor(time / (t.rider ? 150 : 400)) % 2);
    }
    for (const j of jellies) {
      const y = j.y + Math.sin(time / 700 + j.phase) * 10;
      j.sprite.setPosition(j.x, y).setFrame(Math.floor(time / 500 + j.phase) % 2);
      j.glow.setPosition(j.x, y);
    }
    const divers = scene.avatars.filter((a) => a && !a.hidden && a.mode === 'swim');
    for (const p of puffers) {
      const near = divers.some((a) => Math.hypot(a.b.x + 6 - p.x, a.b.y + 7 - p.y) < 44);
      if (near !== p.puffed) {
        p.puffed = near;
        p.sprite.setFrame(near ? 1 : 0);
        scene.tweens.add({ targets: p.sprite, scale: near ? 1.25 : 1, duration: 150 });
      }
      p.sprite.setPosition(p.x + Math.sin(time / 900 + p.phase) * 16, p.y + Math.sin(time / 600 + p.phase) * 4).setFlipX(Math.cos(time / 900 + p.phase) > 0);
    }
    angler.x += angler.dir * 18 * dt;
    if (angler.x > 124 * T) angler.dir = -1;
    if (angler.x < 96 * T) angler.dir = 1;
    angler.sprite.setPosition(angler.x, 52 * T + Math.sin(time / 800) * 4).setFlipX(angler.dir < 0);
    angler.glow.setPosition(angler.x + (angler.dir < 0 ? -10 : 10), angler.sprite.y - 8).setAlpha(0.4 + Math.sin(time / 300) * 0.1);
    // fish schools: swimming in loops, scattering from divers
    for (const s of schools) {
      const t = time / 3000 + s.phase;
      const tx = s.home.x + Math.sin(t) * 70;
      const ty = s.home.y + Math.sin(t * 2) * 20;
      let fx = 0;
      let fy = 0;
      for (const a of divers) {
        const dx = s.cx - (a.b.x + 6);
        const dy = s.cy - (a.b.y + 7);
        const d = Math.hypot(dx, dy);
        if (d < 60 && d > 0) { fx += (dx / d) * 80; fy += (dy / d) * 80; }
      }
      s.flee.x += (fx - s.flee.x) * Math.min(1, dt * 3);
      s.flee.y += (fy - s.flee.y) * Math.min(1, dt * 3);
      const nx = tx + s.flee.x;
      const ny = Math.max(SY + 10, ty + s.flee.y);
      const dir = nx >= s.cx ? 1 : -1;
      s.cx = nx;
      s.cy = ny;
      s.fish.forEach((f, i) => {
        const swirl = s.party ? Math.sin(time / 200 + i) * 12 : 0;
        f.sprite.setPosition(s.cx + f.dx * dir + swirl, s.cy + f.dy + Math.sin(time / 300 + i) * 2).setFlipX(dir < 0);
      });
    }
    // bubbles rising from the seabed
    if (rng.next() < dt * 2.5) {
      const x = L.kelp[rng.int(0, L.kelp.length - 1)];
      bubble(x * T + 8 + rng.int(-6, 6), floorRow(x) * T - 4, 7);
    }
  };

  // twenty pearls: the Giant Clam opens, glowing gold
  const ready = () => {
    scene.time.delayedCall(800, () => {
      giant.setFrame(1);
      sub.setVisible(true);
      scene.tweens.add({ targets: sub, y: sub.y - 4, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      scene.tweens.add({ targets: giantGlow, alpha: 0.6, duration: 700, yoyo: true, repeat: -1 });
      scene.events.emit('sfx', 'clam');
      for (let k = 0; k < 10; k++) bubble(gx + (k - 5) * 5, gy - 10, 27);
    });
    return { x: gx, y: gy - 40 };
  };

  return {
    world: { w: W, h: H },
    pad: { x: L.pad.x * T + 8, y: SY - T },
    zoom: [1.0, 1.6],
    lead: () => ({ x: 0, y: -10 }),
    goal: () => ({ have: Math.min(pearls, OCEAN.need), need: OCEAN.need }),
    spawn,
    step,
    update,
    focus: (a) => ({ x: a.b.x + a.b.w / 2, y: a.b.y + a.b.h / 2 }),
    place: (a, x, y) => {
      a.b.x = x - a.b.w / 2; a.b.y = y - a.b.h; a.b.vx = 0; a.b.vy = 0;
      if (a.ride) { a.ride.rider = null; a.ride = null; }
    },
    onFoot: (a) => a.mode === 'air' && a.b.grounded,
    ready,
    cheer: (a) => { a.b.vy = -120; },
    debug: { turtles, clams },
  };
}

// The sky over the island; the sea below, sunny turquoise at the top fading
// to deep navy, with sunbeams slanting down and darkness in the deep.
function drawBackdrop(scene, W, H, SY) {
  const g = scene.add.graphics().setDepth(-30);
  g.fillGradientStyle(0x6ac0ff, 0x6ac0ff, 0xbfe8ff, 0xbfe8ff, 1);
  g.fillRect(0, 0, W, SY);
  g.fillGradientStyle(0x3ab8e0, 0x3ab8e0, 0x1a5a9a, 0x1a5a9a, 1);
  g.fillRect(0, SY, W, (H - SY) * 0.45);
  g.fillGradientStyle(0x1a5a9a, 0x1a5a9a, 0x081438, 0x081438, 1);
  g.fillRect(0, SY + (H - SY) * 0.45, W, (H - SY) * 0.55 + 2);
  // the sun and clouds
  scene.add.image(380, 30, 'light').setScrollFactor(0.2, 1).setTint(0xfff2a0).setScale(1.6).setDepth(-29);
  const clouds = scene.add.graphics().setScrollFactor(0.3, 1).setDepth(-29);
  clouds.fillStyle(0xffffff, 0.9);
  for (let x = 40; x < W * 0.3 + 500; x += 160) clouds.fillRoundedRect(x, 30 + (x % 3) * 12, 60, 12, 6).fillRoundedRect(x + 14, 22 + (x % 3) * 12, 30, 12, 6);
  // sunbeams in the water
  for (let k = 0; k < 14; k++) {
    const x = 220 + k * 140;
    const beam = scene.add.polygon(x, SY, [0, 0, 22, 0, 90, 300, 50, 300], 0xffffff, 0.08).setOrigin(0).setDepth(-20);
    scene.tweens.add({ targets: beam, alpha: 0.03, duration: 2000 + k * 170, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  // the deep: a gentle darkness that thickens toward the bottom (over the
  // rock and sand, under the creatures, which glow)
  const dark = scene.add.graphics().setDepth(15);
  dark.fillGradientStyle(0x050a20, 0x050a20, 0x050a20, 0x050a20, 0, 0, 0.55, 0.55);
  dark.fillRect(0, SY + 26 * TILE, W, H - SY - 26 * TILE);
}
