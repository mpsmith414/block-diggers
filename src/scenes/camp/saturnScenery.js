// Ring Station's scenery: a starry sky with giant ringed Saturn filling it,
// gently falling snow, snowy hills, igloos, a snowman, the landing pad (where
// the Saturn Rocket stands) and the hatch down into Saturn's rings.

import { TILE } from '../../tuning.js';

export function drawSaturnBackdrop(scene, { W, top, groundY }) {
  const h = groundY - top;
  const sky = scene.add.graphics().setDepth(-30).setScrollFactor(0.2, 1);
  sky.fillGradientStyle(0x0a0a24, 0x0a0a24, 0x2a3a6a, 0x2a3a6a, 1);
  sky.fillRect(-200, top, W + 400, h);
  for (let i = 0; i < 90; i++) {
    const s = scene.add.image((i * 173) % (W + 200) - 100, top + ((i * 61) % (h - 20)), 'pixel')
      .setDepth(-29).setScrollFactor(0.15, 1).setDisplaySize(1, 1).setTint(i % 2 ? 0xffffff : 0xc8f0ff);
    if (i % 3 === 0) scene.tweens.add({ targets: s, alpha: { from: 0.2, to: 1 }, duration: 800 + (i % 7) * 300, yoyo: true, repeat: -1 });
  }
  // giant Saturn, hanging in the sky
  const saturn = scene.add.image(330, groundY - 110, 'saturn-big').setDepth(-28).setScrollFactor(0.1, 1).setScale(1.3);
  scene.tweens.add({ targets: saturn, y: saturn.y - 3, duration: 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // snowy hills (parallax)
  const far = scene.add.graphics().setDepth(-27).setScrollFactor(0.4, 1);
  far.fillStyle(0x9fc8e0, 1);
  for (let i = 0; i < 12; i++) far.fillEllipse(i * 120 - 40, groundY + 4, 190, 70);
  const near = scene.add.graphics().setDepth(-26).setScrollFactor(0.65, 1);
  near.fillStyle(0xd8ecf8, 1);
  for (let i = 0; i < 14; i++) near.fillEllipse(i * 95 - 30, groundY + 18, 150, 50);
  // gently falling snow
  for (let i = 0; i < 40; i++) {
    const x = (i * 97) % W;
    const f = scene.add.image(x, top - 10, 'pixel').setDepth(27).setTint(0xffffff).setDisplaySize(i % 3 ? 1 : 2, i % 3 ? 1 : 2).setAlpha(0.85);
    scene.tweens.add({ targets: f, y: groundY, x: x + ((i % 5) - 2) * 12, duration: 6000 + (i % 7) * 900, delay: (i * 350) % 6000, repeat: -1 });
  }
}

export function drawSaturnProps(scene, { L, groundY }) {
  const at = (cx) => cx * TILE + TILE / 2;
  // the hatch down into the rings
  scene.add.image(at(L.shaftX), groundY + 4, 'moon-hatch').setOrigin(0.5, 1).setDepth(12).setTint(0xd8f0ff);
  // igloos behind the camp
  scene.add.image(at(2), groundY + 1, 'igloo').setOrigin(0.5, 1).setDepth(-4);
  scene.add.image(at(L.plots[L.plots.length - 1] + 11), groundY + 1, 'igloo').setOrigin(0.5, 1).setDepth(-4).setScale(0.8);
  // a snowman, waving
  const man = scene.add.image(at(L.lecternX + 1) + 6, groundY + 1, 'snowman').setOrigin(0.5, 1).setDepth(-3);
  scene.tweens.add({ targets: man, angle: { from: -3, to: 3 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // the lectern and the upgrade bench (the same as at home)
  scene.add.image(at(L.lecternX), groundY, 'lectern').setOrigin(0.5, 1).setDepth(5);
  scene.add.image(at(L.benchX), groundY, 'bench').setOrigin(0.5, 1).setDepth(5);
  // the landing pad and the Saturn Rocket standing on it
  const padX = L.padX * TILE + TILE / 2;
  scene.add.image(padX, groundY + 2, 'moon-pad').setOrigin(0.5, 1).setDepth(2).setTint(0xe0f4ff);
  scene.padRocket = scene.add.image(padX, groundY - 4, 'saturn-ship').setOrigin(0.5, 1).setDepth(3);
  scene.add.image(padX + 44, groundY + 3, 'saturn-flag').setOrigin(0.15, 1).setDepth(4);
  // blocks of ice in the gaps between the plots, and past the last one
  const g = scene.add.graphics().setDepth(4);
  const ice = (x, w, h) => {
    g.fillStyle(0x6a9ab8, 1).fillRect(x - w / 2, groundY - h, w, h);
    g.fillStyle(0xb8e4f8, 1).fillRect(x - w / 2 + 1, groundY - h + 1, w - 2, h - 2);
    g.fillStyle(0xffffff, 1).fillRect(x - w / 2 + 1, groundY - h + 1, 2, 1);
  };
  for (const px of L.plots.slice(1)) ice(px * TILE - TILE / 2, 8, 6);
  ice((L.plots[L.plots.length - 1] + 7) * TILE, 12, 8);
  // sparkles on the snow
  for (let i = 0; i < 30; i++) {
    const s = scene.add.image(12 + ((i * 131) % (L.w * TILE - 24)), groundY + 1, 'pixel').setOrigin(0.5, 1).setDisplaySize(1, 1).setTint(0x9fe0ff).setDepth(11);
    scene.tweens.add({ targets: s, alpha: { from: 0.2, to: 1 }, duration: 600 + (i % 5) * 250, yoyo: true, repeat: -1 });
  }
}
