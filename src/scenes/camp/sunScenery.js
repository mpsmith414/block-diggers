// Solar Station's scenery: a blazing gold-and-orange sky with flares looping
// up over the horizon and sparkles drifting, golden sun-rock hills, flame
// fountains, solar panels and golden domes, the landing pad (where the Sun
// Rocket stands) and the hatch down into the Sun.

import { TILE } from '../../tuning.js';

export function drawSunBackdrop(scene, { W, top, groundY }) {
  const h = groundY - top;
  const sky = scene.add.graphics().setDepth(-30).setScrollFactor(0.2, 1);
  sky.fillGradientStyle(0xff6a2a, 0xff6a2a, 0xffd88a, 0xffd88a, 1);
  sky.fillRect(-200, top, W + 400, h);
  // flares: glowing loops rising off the horizon
  const arcs = scene.add.graphics().setDepth(-29).setScrollFactor(0.1, 1);
  for (const [x, r] of [[80, 50], [320, 80], [560, 44], [760, 64], [980, 56]]) {
    arcs.lineStyle(10, 0xffb040, 0.7).beginPath().arc(x, groundY - 20, r, Math.PI, 0, false).strokePath();
    arcs.lineStyle(3, 0xfff2a0, 0.9).beginPath().arc(x, groundY - 20, r, Math.PI, 0, false).strokePath();
  }
  scene.tweens.add({ targets: arcs, alpha: 0.5, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  // sparkles drifting up
  for (let i = 0; i < 40; i++) {
    const s = scene.add.image((i * 137) % (W + 200) - 100, top + ((i * 53) % (h - 20)), 'pixel').setDepth(-28).setScrollFactor(0.3, 1)
      .setTint([0xffffff, 0xfff2a0, 0xffd84a][i % 3]).setDisplaySize(i % 4 ? 1 : 2, i % 4 ? 1 : 2);
    scene.tweens.add({ targets: s, y: s.y - 30, alpha: { from: 1, to: 0 }, duration: 2400 + (i % 6) * 400, delay: (i % 9) * 300, repeat: -1 });
  }
  // golden hills (parallax)
  const far = scene.add.graphics().setDepth(-27).setScrollFactor(0.4, 1);
  far.fillStyle(0xe08a2a, 1);
  for (let i = 0; i < 12; i++) far.fillEllipse(i * 120 - 40, groundY + 4, 190, 80);
  const near = scene.add.graphics().setDepth(-26).setScrollFactor(0.65, 1);
  near.fillStyle(0xeca040, 1);
  for (let i = 0; i < 14; i++) near.fillEllipse(i * 95 - 30, groundY + 18, 150, 56);
}

export function drawSunProps(scene, { L, groundY }) {
  const at = (cx) => cx * TILE + TILE / 2;
  // the hatch down into the Sun
  scene.add.image(at(L.shaftX), groundY + 4, 'moon-hatch').setOrigin(0.5, 1).setDepth(12).setTint(0xffe0a0);
  // golden domes and solar panels behind the camp
  const last = L.plots[L.plots.length - 1];
  for (const x of [1.5, last + 10]) scene.add.image(x * TILE, groundY + 1, 'gold-dome').setOrigin(0.5, 1).setDepth(-4);
  for (const x of [last + 13, last + 14.8]) scene.add.image(x * TILE, groundY + 1, 'solar-panel').setOrigin(0.5, 1).setDepth(-4).setScale(0.8);
  // flame fountains, flickering
  for (const x of [7.6, last + 7.5]) {
    const f = scene.add.sprite(x * TILE, groundY + 1, 'flame-fountain', 0).setOrigin(0.5, 1).setDepth(-3);
    scene.time.addEvent({ delay: 160 + x, loop: true, callback: () => f.setFrame(f.frame.name === 0 ? 1 : 0) });
    scene.add.image(x * TILE, groundY - 24, 'light').setTint(0xffa040).setAlpha(0.35).setScale(0.8).setDepth(-3);
  }
  // the lectern and the upgrade bench (the same as at home)
  scene.add.image(at(L.lecternX), groundY, 'lectern').setOrigin(0.5, 1).setDepth(5);
  scene.add.image(at(L.benchX), groundY, 'bench').setOrigin(0.5, 1).setDepth(5);
  // the landing pad and the Sun Rocket standing on it
  const padX = L.padX * TILE + TILE / 2;
  scene.add.image(padX, groundY + 2, 'moon-pad').setOrigin(0.5, 1).setDepth(2).setTint(0xffe8b0);
  scene.padRocket = scene.add.image(padX, groundY - 4, 'sun-ship').setOrigin(0.5, 1).setDepth(3);
  scene.add.image(padX + 44, groundY + 3, 'sun-flag').setOrigin(0.15, 1).setDepth(4);
  // golden crystals and ember flowers along the ground
  for (let i = 0; i < 36; i++) {
    const x = 8 + ((i * 97) % (L.w * TILE - 16));
    const kind = i % 3 ? 'decor-emberflower' : 'decor-suncrystal';
    const f = scene.add.image(x, groundY + 1, kind, i % 3).setOrigin(0.5, 1).setDepth(11).setScale(0.6);
    if (i % 3) scene.tweens.add({ targets: f, angle: { from: -5, to: 5 }, duration: 1400 + (i % 5) * 200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}
