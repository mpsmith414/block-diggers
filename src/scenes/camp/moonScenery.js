// Moon Base's scenery: a black sky full of stars with the Earth hanging in
// it, grey moon dust, glowing domes, an antenna, the landing pad (where the
// Earth rocket stands) and the hatch down into the Moon.

import Phaser from 'phaser';
import { TILE } from '../../tuning.js';

export function drawMoonBackdrop(scene, { W, top, groundY }) {
  const h = groundY - top;
  const sky = scene.add.graphics().setDepth(-30).setScrollFactor(0.2, 1);
  sky.fillGradientStyle(0x05040f, 0x05040f, 0x1a1a38, 0x1a1a38, 1);
  sky.fillRect(-200, top, W + 400, h);
  // stars, some twinkling
  for (let i = 0; i < 110; i++) {
    const s = scene.add.image((i * 173) % (W + 200) - 100, top + ((i * 61) % (h - 20)), 'pixel')
      .setDepth(-29).setScrollFactor(0.15, 1).setDisplaySize(1, 1).setTint([0xffffff, 0xfff6d0, 0x9ff6ff][i % 3]);
    if (i % 3 === 0) scene.tweens.add({ targets: s, alpha: { from: 0.2, to: 1 }, duration: 800 + (i % 7) * 300, yoyo: true, repeat: -1 });
  }
  // the Earth, gently bobbing
  const earth = scene.add.image(300, groundY - 92, 'earth').setDepth(-28).setScrollFactor(0.1, 1).setScale(1.2);
  scene.tweens.add({ targets: earth, y: earth.y - 3, duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // far grey hills with craters (parallax)
  const far = scene.add.graphics().setDepth(-27).setScrollFactor(0.4, 1);
  far.fillStyle(0x6a6a7e, 1);
  for (let i = 0; i < 12; i++) far.fillCircle(i * 120 - 40, groundY + 20, 60);
  far.fillStyle(0x5a5a6e, 1);
  for (let i = 0; i < 12; i++) far.fillCircle(i * 120 + 10, groundY - 16, 5);
  const near = scene.add.graphics().setDepth(-26).setScrollFactor(0.65, 1);
  near.fillStyle(0x8a8a9c, 1);
  for (let i = 0; i < 14; i++) near.fillCircle(i * 95 - 30, groundY + 30, 46);
}

export function drawMoonProps(scene, { L, groundY }) {
  const at = (cx) => cx * TILE + TILE / 2;
  // the hatch down into the Moon
  scene.add.image(at(L.shaftX), groundY + 4, 'moon-hatch').setOrigin(0.5, 1).setDepth(12);
  // domes and the antenna behind the camp
  scene.add.image(at(2), groundY + 1, 'moon-dome').setOrigin(0.5, 1).setDepth(-4);
  scene.add.image(at(L.plots[L.plots.length - 1] + 11), groundY + 1, 'moon-dome').setOrigin(0.5, 1).setDepth(-4).setScale(0.8);
  const ant = scene.add.image(at(L.lecternX + 1), groundY + 1, 'moon-antenna').setOrigin(0.5, 1).setDepth(-3);
  const blink = scene.add.image(ant.x, ant.y - 47, 'light').setTint(0xff5a5a).setScale(0.3).setDepth(-2).setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({ targets: blink, alpha: { from: 0.1, to: 1 }, duration: 600, yoyo: true, repeat: -1 });
  // the lectern and the upgrade bench (the same as at home)
  scene.add.image(at(L.lecternX), groundY, 'lectern').setOrigin(0.5, 1).setDepth(5);
  scene.add.image(at(L.benchX), groundY, 'bench').setOrigin(0.5, 1).setDepth(5);
  // the landing pad and the Earth rocket standing on it
  const padX = L.padX * TILE + TILE / 2;
  scene.add.image(padX, groundY + 2, 'moon-pad').setOrigin(0.5, 1).setDepth(2);
  scene.padRocket = scene.add.image(padX, groundY - 4, 'rocket-ship').setOrigin(0.5, 1).setDepth(3);
  // little rocks and craters on the dust
  for (let i = 0; i < 40; i++) {
    const x = 12 + ((i * 131) % (L.w * TILE - 24));
    scene.add.image(x, groundY + 1, 'pixel').setOrigin(0.5, 1).setDisplaySize(2 + (i % 3), 1 + (i % 2)).setTint(i % 2 ? 0x9898aa : 0xdcdcea).setDepth(11);
  }
}
