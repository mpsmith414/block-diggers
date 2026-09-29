// Dino Camp's scenery: a warm jungle dawn with a smoking volcano and
// pterodactyls gliding by, jungle hills, tree ferns, the landing pad (where
// the Dino Rocket stands) and the hatch down into Dino Planet.

import { TILE } from '../../tuning.js';

export function drawDinoBackdrop(scene, { W, top, groundY }) {
  const h = groundY - top;
  const sky = scene.add.graphics().setDepth(-30).setScrollFactor(0.2, 1);
  sky.fillGradientStyle(0xf08a5a, 0xf08a5a, 0xffd8a0, 0xffd8a0, 1);
  sky.fillRect(-200, top, W + 400, h);
  // the volcano, puffing smoke
  const volcano = scene.add.image(340, groundY - 12, 'volcano-big').setOrigin(0.5, 1).setDepth(-29).setScrollFactor(0.1, 1).setScale(1.4);
  for (let i = 0; i < 4; i++) {
    const s = scene.add.image(volcano.x, volcano.y - 84, 'smoke').setDepth(-29).setScrollFactor(0.1, 1).setTint(0x8a7a70).setAlpha(0.8);
    scene.tweens.add({ targets: s, y: top + 10, x: s.x + 40, scale: 5, alpha: 0, duration: 6000, delay: i * 1500, repeat: -1 });
  }
  // pterodactyls gliding by
  for (let i = 0; i < 3; i++) {
    const p = scene.add.sprite(-60, top + 30 + i * 22, 'ptero', 0).setDepth(-28).setScrollFactor(0.3, 1).setScale(0.9 - i * 0.15);
    scene.tweens.add({ targets: p, x: W + 60, duration: 18000 + i * 4000, delay: i * 5000, repeat: -1 });
    scene.time.addEvent({ delay: 220, loop: true, callback: () => p.setFrame(p.frame.name === 0 ? 1 : 0) });
  }
  // jungle hills (parallax)
  const far = scene.add.graphics().setDepth(-27).setScrollFactor(0.4, 1);
  far.fillStyle(0x3a7a3a, 1);
  for (let i = 0; i < 12; i++) far.fillEllipse(i * 120 - 40, groundY + 4, 190, 80);
  const near = scene.add.graphics().setDepth(-26).setScrollFactor(0.65, 1);
  near.fillStyle(0x4a9a3a, 1);
  for (let i = 0; i < 14; i++) near.fillEllipse(i * 95 - 30, groundY + 18, 150, 56);
}

export function drawDinoProps(scene, { L, groundY }) {
  const at = (cx) => cx * TILE + TILE / 2;
  // the hatch down into Dino Planet
  scene.add.image(at(L.shaftX), groundY + 4, 'moon-hatch').setOrigin(0.5, 1).setDepth(12).setTint(0xd8f0c0);
  // tree ferns behind the camp
  for (const x of [1.5, 8, 14.5, L.plots[L.plots.length - 1] + 9, L.plots[L.plots.length - 1] + 13]) {
    const f = scene.add.image(x * TILE, groundY + 1, 'treefern').setOrigin(0.5, 1).setDepth(-4);
    scene.tweens.add({ targets: f, angle: { from: -1.5, to: 1.5 }, duration: 2200 + x * 30, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  // the lectern and the upgrade bench (the same as at home)
  scene.add.image(at(L.lecternX), groundY, 'lectern').setOrigin(0.5, 1).setDepth(5);
  scene.add.image(at(L.benchX), groundY, 'bench').setOrigin(0.5, 1).setDepth(5);
  // the landing pad and the Dino Rocket standing on it
  const padX = L.padX * TILE + TILE / 2;
  scene.add.image(padX, groundY + 2, 'moon-pad').setOrigin(0.5, 1).setDepth(2).setTint(0xe8f0d0);
  scene.padRocket = scene.add.image(padX, groundY - 4, 'dino-ship').setOrigin(0.5, 1).setDepth(3);
  scene.add.image(padX + 44, groundY + 3, 'dino-flag').setOrigin(0.15, 1).setDepth(4);
  // ferns and flowers along the ground
  for (let i = 0; i < 40; i++) {
    const x = 8 + ((i * 97) % (L.w * TILE - 16));
    const f = scene.add.image(x, groundY + 1, i % 3 ? 'decor-fern' : 'flower', i % 3).setOrigin(0.5, 1).setDepth(11).setScale(i % 3 ? 0.6 : 1);
    scene.tweens.add({ targets: f, angle: { from: -5, to: 5 }, duration: 1400 + (i % 5) * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}
