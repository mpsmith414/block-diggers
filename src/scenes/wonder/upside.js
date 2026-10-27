// Upside-Down Planet: Topsy-Turvy Land. A flips gravity: you fall up to the
// ceiling and walk along it upside down, and flip again whenever you like
// (even in mid-air). Glowing arrow pads flip you as you step on them. Thirty
// stars wait on the floor, on the ceiling and in mid-air to catch as you
// flip. Then the Topsy Tower, standing on its head at the end, flips the
// right way up, and the Topsy Trophy is inside.

import Phaser from 'phaser';
import { upsideLevel, padFlips, UPSIDE, UD } from '../../game/wonder/upside.js';
import { walkerBody, stepWalker, bakeTiles, createPickups } from './kit.js';
import { TILE } from '../../tuning.js';

const T = TILE;

export function createUpside(scene) {
  const L = upsideLevel();
  const { level } = L;
  const W = level.w * T;
  const H = level.h * T;
  const ceilY = UPSIDE.top * T;
  const floorY = (UPSIDE.bottom + 1) * T;
  let stars = 0;
  let mooAgain = 0;

  drawBackdrop(scene, W, ceilY, floorY);
  bakeTiles(scene, level, 'upside-tiles', (n, x, y) => {
    if (n === UD.CEIL) return level.get(x, y + 1) === 0 ? 0 : 1;
    if (n === UD.FLOOR) return level.get(x, y - 1) === 0 ? 2 : 3;
    if (n === UD.BLOCK) return 4;
    if (n === UD.PAD_UP) return 5;
    if (n === UD.PAD_DOWN) return 6;
    return null;
  }, 2);
  // glowing pads
  for (let x = 0; x < level.w; x++) {
    for (let y = 0; y < level.h; y++) {
      const n = level.get(x, y);
      if (n !== UD.PAD_UP && n !== UD.PAD_DOWN) continue;
      const glow = scene.add.image(x * T + 8, n === UD.PAD_UP ? y * T : (y + 1) * T, 'light').setTint(0xffe066).setScale(0.8).setAlpha(0.4).setDepth(3).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: glow, alpha: 0.15, duration: 600, yoyo: true, repeat: -1 });
    }
  }

  // the things hanging from the ceiling: trees, the house and the cow
  for (const x of L.trees) {
    if (level.get(x, UPSIDE.top) !== 0) continue;
    scene.add.image(x * T + 8, ceilY, 'upside-tree').setOrigin(0.5, 0).setFlipY(true).setDepth(1);
  }
  scene.add.image(L.house.x * T, ceilY, 'upside-house').setOrigin(0.5, 0).setFlipY(true).setDepth(1);
  const cow = scene.add.image(L.cow.x * T, ceilY, 'upside-cow').setOrigin(0.5, 0).setFlipY(true).setDepth(1);
  // the rainbow, smiling up from the cloud floor
  scene.add.image(60 * T, floorY + 2, 'rainbow-arch').setOrigin(0.5, 0).setFlipY(true).setDepth(1).setScale(0.8).setY(floorY - 52);
  // clouds drifting low over the floor
  L.clouds.forEach((x, k) => {
    const c = scene.add.image(x * T, floorY - 10 - (k % 3) * 18, 'upside-cloud').setDepth(1).setAlpha(0.85).setScale(0.8 + (k % 3) * 0.2);
    scene.tweens.add({ targets: c, x: c.x + 30 + (k % 2) * 20, duration: 4000 + k * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  });

  // the Topsy Tower, hanging on its head from the ceiling
  const tx = L.tower.x * T + 8;
  const tower = scene.add.image(tx, ceilY, 'upside-tower').setOrigin(0.5, 1).setAngle(180).setDepth(1);
  const towerGlow = scene.add.image(tx, floorY - 30, 'light').setTint(0xffe066).setScale(2).setAlpha(0).setDepth(0.5).setBlendMode(Phaser.BlendModes.ADD);

  // the stars
  const pickups = createPickups(scene, L.stars.map((s) => ({ x: s.x * T + 8, y: s.y * T + 8, key: 'wonder-star', scale: 1.3 })), { size: 14 });
  for (const p of pickups.list) scene.tweens.add({ targets: p.img, angle: { from: -12, to: 12 }, duration: 900 + (p.x % 300), yoyo: true, repeat: -1 });
  let partied = false;
  let towerUp = false;

  // ---------- the players ----------

  const spawn = (a) => {
    const at = a.at ?? { x: scene.mod.pad.x + (a.slot ? 14 : -14), y: floorY };
    a.b = walkerBody(at.x, at.y);
    a.g = 1;
    a.flipT = 0;
    a.flips = 0;
  };

  const flip = (a) => {
    a.g = -a.g;
    a.flipT = UPSIDE.flipAgain;
    a.b.vy = a.g * 60;
    a.flips++;
    scene.events.emit('sfx', 'flip');
    scene.effects.sparkle(a.b.x + 6, a.b.y + 7, 0xffe066, 5);
    if (a.flips === UPSIDE.funFlips) scene.fun();
  };

  const step = (a, i, e, dt, time) => {
    const b = a.b;
    a.flipT = Math.max(0, a.flipT - dt);
    if (e.a && a.flipT <= 0) flip(a);
    stepWalker(b, { moveX: i.moveX, moveY: 0 }, level, dt, { gravity: a.g * UPSIDE.gravity, maxFall: UPSIDE.maxFall });
    // a flip pad under your feet
    if (b.grounded && a.flipT <= 0) {
      const row = a.g > 0 ? Math.floor((b.y + b.h + 1) / T) : Math.floor((b.y - 1) / T);
      const cols = [Math.floor((b.x + 2) / T), Math.floor((b.x + b.w - 2) / T)];
      if (cols.some((c) => padFlips(level.get(c, row), a.g))) {
        flip(a);
        a.flipT = 0.4;
        scene.events.emit('sfx', 'boing');
      }
    }
    for (const p of pickups.take(b)) { stars++; scene.events.emit('pickup'); scene.effects.sparkle(p.x, p.y, 0xffe066, 6); }
    // the cow moos when you pass under (or over) it
    mooAgain = Math.max(0, mooAgain - dt / 2);
    if (mooAgain <= 0 && !a.hidden && Math.abs(b.x - cow.x) < 30) {
      mooAgain = 3;
      scene.events.emit('sfx', 'moo');
      scene.tweens.add({ targets: cow, scaleX: 1.15, duration: 150, yoyo: true, repeat: 1 });
    }
    // into the tower, once it's the right way up
    if (scene.goalDone && !partied && !a.hidden && Math.abs(b.x + b.w / 2 - tx) < 22 && towerUp) {
      partied = true;
      scene.prizeParty(tx, floorY - 30);
    }
    scene.drawCharacter(a, b, dt, time, { flipY: a.g < 0 });
  };

  const update = () => {};

  // all thirty stars: the tower flips over and lands the right way up
  const ready = () => {
    scene.time.delayedCall(800, () => {
      scene.events.emit('sfx', 'whoosh');
      scene.tweens.add({ targets: tower, angle: 360, y: floorY, duration: 1300, ease: 'Back.easeInOut', onComplete: () => {
        towerUp = true;
        scene.events.emit('sfx', 'stomp');
        scene.cameras.main.shake(150, 0.006);
        scene.tweens.add({ targets: towerGlow, alpha: 0.5, duration: 700, yoyo: true, repeat: -1 });
        for (let k = 0; k < 8; k++) scene.effects.sparkle(tx + (k - 4) * 8, floorY - 4, 0xffffff, 3);
      } });
    });
    return { x: tx, y: (ceilY + floorY) / 2 };
  };

  return {
    world: { w: W, h: H },
    pad: { x: L.pad.x * T + 8, y: floorY },
    zoom: [1.06, 1.35],
    goal: () => ({ have: Math.min(stars, UPSIDE.need), need: UPSIDE.need }),
    spawn,
    step,
    update,
    // (the camera always shows the floor and the ceiling together)
    focus: (a) => ({ x: a.b.x + a.b.w / 2, y: (ceilY + floorY) / 2 }),
    place: (a, x, y) => { a.g = 1; a.b.x = x - a.b.w / 2; a.b.y = Math.min(y, floorY) - a.b.h; a.b.vx = 0; a.b.vy = 0; },
    onFoot: (a) => a.g > 0 && a.b.grounded,
    ready,
    cheer: (a) => flip(a),
  };
}

// The band between ceiling and floor is sky: blue, paler near the clouds.
function drawBackdrop(scene, W, ceilY, floorY) {
  const g = scene.add.graphics().setDepth(-30);
  g.fillGradientStyle(0x6ab0f0, 0x6ab0f0, 0xd8f0ff, 0xd8f0ff, 1);
  g.fillRect(0, 0, W, floorY + 48);
  // far-off upside-down hills hanging from the top, a sun low down
  const hills = scene.add.graphics().setScrollFactor(0.5, 1).setDepth(-29);
  hills.fillStyle(0x8ad08a, 0.6);
  for (let x = -40; x < W * 0.5 + 500; x += 80) hills.fillCircle(x, ceilY - 10, 40 + ((x * 7) % 20));
  scene.add.image(300, floorY - 40, 'light').setScrollFactor(0.2, 1).setTint(0xfff2a0).setScale(1.4).setDepth(-29);
}
