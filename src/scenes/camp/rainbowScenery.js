// Rainbow Village's scenery: a pastel striped sky with a giant rainbow arch,
// fluffy clouds and candy hills, lollipops along the candy ground, the
// landing pad (where the Rainbow Rocket stands), the Rainbow Lift down into
// the endless mine, and the Depth Sign showing the deepest layer you've reached.

import { TILE } from '../../tuning.js';
import { layerOfRow } from '../../world/rainbow.js';

const RAINBOW = [0xff5a6a, 0xffa64a, 0xffe066, 0x6ad07a, 0x4ab0ff, 0x9a7aff];

export function drawRainbowBackdrop(scene, { W, top, groundY }) {
  const h = groundY - top;
  const sky = scene.add.graphics().setDepth(-30).setScrollFactor(0.2, 1);
  sky.fillGradientStyle(0xffc8e8, 0xffc8e8, 0xc8e8ff, 0xc8e8ff, 1);
  sky.fillRect(-200, top, W + 400, h);
  // soft pastel stripes across the sky
  for (let i = 0; i < 6; i++) sky.fillStyle(0xffffff, 0.08 + (i % 2) * 0.06).fillRect(-200, top + 20 + i * 26, W + 400, 12);
  // the giant rainbow arch
  scene.add.image(W * 0.35, groundY - 8, 'rainbow-arch').setOrigin(0.5, 1).setDepth(-29).setScrollFactor(0.15, 1).setScale(3).setAlpha(0.85);
  // fluffy clouds drifting
  for (let i = 0; i < 6; i++) {
    const c = scene.add.graphics().setDepth(-28).setScrollFactor(0.3, 1);
    c.fillStyle(0xffffff, 0.9);
    for (const [dx, dy, r] of [[0, 0, 9], [10, -4, 11], [22, 0, 9], [11, 4, 9]]) c.fillCircle(dx, dy, r);
    c.setPosition(i * 190 - 40, top + 30 + (i % 3) * 28);
    scene.tweens.add({ targets: c, x: c.x + 80, duration: 30000 + i * 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  // candy hills (parallax): strawberry, then mint
  const far = scene.add.graphics().setDepth(-27).setScrollFactor(0.4, 1);
  far.fillStyle(0xf8a8d0, 1);
  for (let i = 0; i < 12; i++) far.fillEllipse(i * 120 - 40, groundY + 4, 190, 80);
  const near = scene.add.graphics().setDepth(-26).setScrollFactor(0.65, 1);
  near.fillStyle(0xa8ecd0, 1);
  for (let i = 0; i < 14; i++) near.fillEllipse(i * 95 - 30, groundY + 18, 150, 56);
}

// The Depth Sign's number and its rainbow bar (it grows a stripe every layer).
export function setDepthSign(scene, deepest, { pop = false } = {}) {
  const sign = scene.depthSign;
  if (!sign) return;
  const n = layerOfRow(deepest);
  sign.num.setText(String(n));
  sign.bar.clear();
  const shown = Math.min(n, 12);
  for (let i = 0; i < shown; i++) sign.bar.fillStyle(RAINBOW[i % RAINBOW.length], 1).fillRect(sign.x + 18 + i * 2.5, sign.y - 25, 2.5, 3);
  if (pop) {
    scene.tweens.add({ targets: sign.num, scale: { from: 4, to: 2.5 }, duration: 400, ease: 'Back.easeOut' });
    scene.effects.confetti(sign.x + 28, sign.y - 36);
  }
}

export function drawRainbowProps(scene, { L, groundY }) {
  const at = (cx) => cx * TILE + TILE / 2;
  // the Rainbow Lift down into the endless mine
  scene.add.image(at(L.shaftX), groundY + 2, 'rainbow-lift').setOrigin(0.5, 1).setDepth(12);
  const glow = scene.add.image(at(L.shaftX), groundY - 4, 'light').setTint(0xff9ad0).setAlpha(0.35).setScale(0.9).setDepth(11);
  scene.tweens.add({ targets: glow, alpha: 0.15, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // the Depth Sign beside it (on the left, clear of the bench): the deepest layer you've reached
  const sx = (L.shaftX - 4.6) * TILE;
  scene.add.image(sx + 28, groundY + 1, 'rainbow-sign').setOrigin(0.5, 1).setDepth(5);
  scene.depthSign = {
    x: sx,
    y: groundY - 14,
    num: scene.add.bitmapText(sx + 34, groundY - 26, 'pixel', '1').setOrigin(0.5).setScale(2.5).setTint(0x4a3222).setDepth(6),
    bar: scene.add.graphics().setDepth(6),
  };
  // the lectern and the upgrade bench (the same as at home)
  scene.add.image(at(L.lecternX), groundY, 'lectern').setOrigin(0.5, 1).setDepth(5);
  scene.add.image(at(L.benchX), groundY, 'bench').setOrigin(0.5, 1).setDepth(5);
  // the landing pad and the Rainbow Rocket standing on it
  const padX = L.padX * TILE + TILE / 2;
  scene.add.image(padX, groundY + 2, 'moon-pad').setOrigin(0.5, 1).setDepth(2).setTint(0xffd8f0);
  scene.padRocket = scene.add.image(padX, groundY - 4, 'rainbow-ship').setOrigin(0.5, 1).setDepth(3);
  // lollipops along the candy ground, swaying
  const lolly = (x, i) => {
    const g = scene.add.graphics().setDepth(i % 2 ? 11 : -3);
    g.fillStyle(0xffffff, 1).fillRect(-1, -14, 2, 14);
    g.fillStyle(0x2a1d2e, 1).fillCircle(0, -18, 6);
    g.fillStyle(RAINBOW[i % RAINBOW.length], 1).fillCircle(0, -18, 5);
    g.fillStyle(0xffffff, 0.7).fillCircle(-2, -20, 1.5);
    g.setPosition(x, groundY + 1).setScale(0.8 + (i % 3) * 0.2);
    scene.tweens.add({ targets: g, angle: { from: -4, to: 4 }, duration: 1600 + (i % 5) * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  };
  const keep = [0, 1, 2, 3, L.shaftX, L.shaftX + 1, L.shaftX + 2, L.shaftX + 3, L.lecternX, L.benchX, L.padX - 2, L.padX - 1, L.padX, L.padX + 1, L.padX + 2,
    ...L.plots.flatMap((px) => Array.from({ length: L.plotW }, (_, i) => px + i))];
  for (let i = 0; i < 18; i++) {
    const x = 10 + ((i * 113) % (L.w * TILE - 20));
    if (keep.includes(Math.floor(x / TILE))) continue;
    lolly(x, i);
  }
}
