// Dragon Planet: Sky Dragons. Everyone rides a baby dragon and flies any
// way the stick points. A breathes a fireball that pops balloons (flying
// into them pops them too). Golden rings sparkle when you fly through them;
// the cloud sea bounces you back up; islands are solid to bump along. Thirty
// balloons wake Mama Dragon on the highest island, and her nest holds the
// Golden Dragon Egg.

import Phaser from 'phaser';
import { dragonLevel, flyVelocity, DRAGON, FLY, DG } from '../../game/wonder/dragon.js';
import { moveBody, cellType } from '../../game/wonder/body.js';
import { bakeTiles } from './kit.js';
import { TILE } from '../../tuning.js';

const T = TILE;
const BALLOON_TINTS = [0xff4a6a, 0xffd84a, 0x4ab0ff, 0x6ad07a, 0xff8ac8, 0xb07ae0, 0xff9a3a];

export function createDragon(scene) {
  const L = dragonLevel();
  const { level } = L;
  const W = level.w * T;
  const H = level.h * T;
  const seaY = DRAGON.sea * T;
  let popped = 0;
  let partied = false;

  drawBackdrop(scene, W, H);
  bakeTiles(scene, level, 'dragon-tiles', (n, x, y) => {
    if (n === DG.GRASS) return 0;
    if (n === DG.EARTH) return 1;
    if (n === DG.UNDER) return 2;
    if (n === DG.SEA) return 3;
    return null;
  }, 2);
  // the cloud sea's puffy top
  for (let x = 0; x < W; x += 28) {
    const puff = scene.add.ellipse(x, seaY + 2, 40, 18, 0xffffff, 1).setDepth(3);
    scene.tweens.add({ targets: puff, y: puff.y - 3, duration: 1400 + (x % 7) * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  // waterfalls off some islands, castles on others
  const falls = [];
  for (const i of [0, 4, 7, 10]) {
    const is = L.islands[i];
    const x = is.x1 * T - 10;
    const top = (is.top + 1) * T;
    falls.push(scene.add.tileSprite(x, top, 8, seaY - top, 'dragon-water').setOrigin(0.5, 0).setDepth(1).setAlpha(0.85));
  }
  for (const i of [3, 8, 11]) {
    const is = L.islands[i];
    scene.add.image(((is.x0 + is.x1) / 2) * T, is.top * T, 'dragon-castle').setOrigin(0.5, 1).setDepth(1);
  }

  // balloons and rings
  const balloons = L.balloons.map((b, k) => {
    const sprite = scene.add.image(b.x * T + 8, b.y * T + 8, 'dragon-balloon').setOrigin(0.5, 0.3).setTint(BALLOON_TINTS[k % BALLOON_TINTS.length]).setDepth(20);
    scene.tweens.add({ targets: sprite, y: sprite.y - 4, angle: { from: -5, to: 5 }, duration: 1100 + (k % 5) * 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return { ...b, sprite, popped: false };
  });
  const rings = L.rings.map((r) => ({ ...r, cx: r.x * T + 8, cy: r.y * T + 8, done: new Set(), sprite: scene.add.image(r.x * T + 8, r.y * T + 8, 'dragon-ring').setDepth(31) }));
  for (const r of rings) scene.tweens.add({ targets: r.sprite, scaleX: 0.8, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

  // Mama Dragon, asleep in her nest
  const nx = L.nest.x * T;
  const ny = L.nest.y * T;
  scene.add.image(nx, ny + 4, 'dragon-nest').setOrigin(0.5, 1).setDepth(6);
  const mama = scene.add.sprite(nx - 10, ny - 2, 'dragon-mama', 0).setOrigin(0.5, 1).setDepth(5).setScale(1.5);
  scene.tweens.add({ targets: mama, scaleY: 1.55, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  const nestGlow = scene.add.image(nx, ny - 20, 'light').setTint(0xffe066).setScale(2.4).setAlpha(0).setDepth(4).setBlendMode(Phaser.BlendModes.ADD);
  const fires = [];

  // ---------- the riders ----------

  const spawn = (a) => {
    const at = a.at ?? { x: scene.mod.pad.x + (a.slot ? 20 : -20), y: L.pad.y * T };
    a.b = { x: at.x - FLY.w / 2, y: at.y - FLY.h - 4, w: FLY.w, h: FLY.h, vx: 0, vy: 0, facing: 1 };
    a.dragon = scene.add.sprite(0, 0, 'dragon-baby', (a.slot % 2) * 2).setDepth(30);
    a.sprite.setDepth(30.5);
    a.fireT = 0;
  };

  const pop = (bl) => {
    bl.popped = true;
    popped++;
    scene.tweens.killTweensOf(bl.sprite);
    scene.tweens.add({ targets: bl.sprite, scale: 1.8, alpha: 0, duration: 150, onComplete: () => bl.sprite.destroy() });
    scene.events.emit('sfx', 'pop');
    scene.events.emit('pickup');
    scene.effects.sparkle(bl.sprite.x, bl.sprite.y, 0xffffff, 6);
    scene.effects.confetti(bl.sprite.x, bl.sprite.y);
  };

  const breathe = (a) => {
    a.fireT = FLY.fireAgain;
    scene.events.emit('sfx', 'fire');
    const b = a.b;
    const x = b.x + b.w / 2 + b.facing * 16;
    const y = b.y + 2;
    fires.push({ x, y, vx: b.facing * FLY.fire + b.vx * 0.5, vy: b.vy * 0.3, life: FLY.fireLife, sprite: scene.add.sprite(x, y, 'dragon-fire', 0).setDepth(32).setFlipX(b.facing < 0) });
  };

  const step = (a, i, e, dt, time) => {
    const b = a.b;
    const v = flyVelocity({ x: b.vx, y: b.vy }, { x: i.moveX || 0, y: i.moveY || 0 }, dt);
    b.vx = v.x;
    b.vy = v.y;
    if (Math.abs(i.moveX || 0) > 0.2) b.facing = Math.sign(i.moveX);
    moveBody(b, level, dt, {});
    // the cloud sea bounces you up
    if (b.y + b.h > seaY - 4) {
      b.y = seaY - 4 - b.h;
      b.vy = -FLY.seaBounce;
      scene.events.emit('sfx', 'boing');
      scene.effects.sparkle(b.x + b.w / 2, seaY - 4, 0xffffff, 4);
    }
    a.fireT = Math.max(0, a.fireT - dt);
    if (e.a && a.fireT <= 0 && !a.hidden) breathe(a);
    if (!a.hidden) {
      // fly into balloons
      for (const bl of balloons) {
        if (!bl.popped && Math.abs(bl.sprite.x - (b.x + b.w / 2)) < 14 && Math.abs(bl.sprite.y - (b.y + b.h / 2)) < 14) pop(bl);
      }
      // through a ring
      for (const r of rings) {
        if (r.done.has(a.slot)) continue;
        if (Math.abs(b.x + b.w / 2 - r.cx) < 7 && Math.abs(b.y + b.h / 2 - r.cy) < 18) {
          r.done.add(a.slot);
          scene.events.emit('sfx', 'whoosh');
          scene.events.emit('sfx', 'chime', 5);
          for (let k = 0; k < 8; k++) scene.time.delayedCall(k * 40, () => scene.effects.sparkle(r.cx, r.cy - 20 + k * 5, 0xffe066, 2));
          scene.tweens.add({ targets: r.sprite, scale: 1.4, duration: 150, yoyo: true });
          scene.fun();
        }
      }
      // Mama's nest, once she's awake
      if (scene.goalDone && !partied && Math.abs(b.x + b.w / 2 - nx) < 40 && Math.abs(b.y + b.h / 2 - (ny - 16)) < 36) {
        partied = true;
        scene.prizeParty(nx, ny - 20);
      }
    }
    // the dragon flaps (faster when going up), and you ride on its back
    const flap = Math.floor(time / (b.vy < -20 ? 90 : 200)) % 2;
    const bob = Math.sin(time / 300 + a.slot) * 1.5;
    const cx = Math.round(b.x + b.w / 2);
    const cy = Math.round(b.y + b.h / 2 + bob);
    a.dragon.setFrame((a.slot % 2) * 2 + flap).setPosition(cx, cy - 2).setFlipX(b.facing < 0).setVisible(!a.hidden)
      .setAngle(Phaser.Math.Clamp(b.vy / FLY.speed, -1, 1) * 12 * b.facing);
    a.sprite.setPosition(cx - b.facing * 2, cy - 4).setFlipX(b.facing < 0).setFrame(0).setScale(1).setVisible(!a.hidden).setAngle(a.dragon.angle);
  };

  const update = (dt) => {
    for (const f of falls) f.tilePositionY -= dt * 120;
    for (let k = fires.length - 1; k >= 0; k--) {
      const f = fires[k];
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.life -= dt;
      f.sprite.setPosition(f.x, f.y).setFrame(Math.floor(f.life * 12) % 2).setAlpha(Math.min(1, f.life * 4));
      // (a fireball puffs out against an island)
      let hit = f.life <= 0 || cellType(level, Math.floor(f.x / T), Math.floor(f.y / T)) === 'solid';
      if (hit && f.life > 0) scene.effects.sparkle(f.x, f.y, 0xffb02a, 4);
      for (const bl of balloons) {
        if (!bl.popped && Math.abs(bl.sprite.x - f.x) < 12 && Math.abs(bl.sprite.y - f.y) < 14) { pop(bl); hit = true; }
      }
      if (hit) {
        f.sprite.destroy();
        fires.splice(k, 1);
      }
    }
  };

  // thirty balloons: Mama Dragon wakes up with a roar, and the nest glows
  const ready = () => {
    scene.time.delayedCall(800, () => {
      mama.setFrame(1);
      scene.events.emit('sfx', 'roar');
      scene.cameras.main.shake(300, 0.006);
      scene.tweens.add({ targets: nestGlow, alpha: 0.6, duration: 700, yoyo: true, repeat: -1 });
    });
    return { x: nx, y: ny - 30 };
  };

  return {
    world: { w: W, h: H },
    pad: { x: L.pad.x * T + 8, y: L.pad.y * T },
    zoom: [1.0, 1.4],
    goal: () => ({ have: Math.min(popped, DRAGON.need), need: DRAGON.need }),
    spawn,
    step,
    update,
    focus: (a) => ({ x: a.b.x + a.b.w / 2, y: a.b.y + a.b.h / 2 }),
    place: (a, x, y) => { a.b.x = x - a.b.w / 2; a.b.y = y - a.b.h - 4; a.b.vx = 0; a.b.vy = 0; },
    onFoot: (a) => Math.hypot(a.b.vx, a.b.vy) < 40,
    ready,
    cheer: (a) => { a.b.vy = -140; },
  };
}

// A bright sky, paler down by the clouds, with far clouds and a rainbow.
function drawBackdrop(scene, W, H) {
  const g = scene.add.graphics().setDepth(-30);
  g.fillGradientStyle(0x4ab8f0, 0x4ab8f0, 0xc8f4ff, 0xc8f4ff, 1);
  g.fillRect(0, 0, W, H);
  scene.add.image(360, 50, 'light').setScrollFactor(0.1, 0.3).setTint(0xfff2a0).setScale(1.8).setDepth(-29);
  scene.add.image(900, 300, 'rainbow-arch').setScrollFactor(0.3, 0.6).setDepth(-28).setScale(2).setAlpha(0.55);
  const far = scene.add.graphics().setScrollFactor(0.4, 0.7).setDepth(-28);
  far.fillStyle(0xffffff, 0.8);
  for (let x = 0; x < W * 0.4 + 600; x += 150) far.fillRoundedRect(x, 80 + (x % 5) * 40, 70, 16, 8).fillRoundedRect(x + 16, 70 + (x % 5) * 40, 36, 16, 8);
  // little birds flapping past
  scene.time.addEvent({
    delay: 2500, loop: true, callback: () => {
      const cam = scene.cameras.main;
      const bird = scene.add.graphics().setDepth(-27);
      bird.lineStyle(2, 0x2a1d2e, 0.8).beginPath().moveTo(0, 0).lineTo(4, 3).lineTo(8, 0).strokePath();
      bird.setPosition(cam.worldView.x - 20, cam.worldView.y + 30 + Math.random() * 80);
      scene.tweens.add({ targets: bird, x: cam.worldView.right + 40, y: bird.y - 20, duration: 7000, onComplete: () => bird.destroy() });
    },
  });
}
