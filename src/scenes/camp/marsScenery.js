// Mars Base's scenery: a butterscotch sky with two little moons and a tiny
// blue Earth, red dunes, the greenhouse domes, a windsock, the landing pad
// (where the Mars Rocket stands) and the hatch down into Mars. Now and then
// a wisp of red dust drifts by.

import Phaser from 'phaser';
import { TILE } from '../../tuning.js';

export function drawMarsBackdrop(scene, { W, top, groundY }) {
  const h = groundY - top;
  const sky = scene.add.graphics().setDepth(-30).setScrollFactor(0.2, 1);
  sky.fillGradientStyle(0xb8604a, 0xb8604a, 0xf0c090, 0xf0c090, 1);
  sky.fillRect(-200, top, W + 400, h);
  // Phobos and Deimos, and the Earth: a tiny blue dot
  const moons = scene.add.graphics().setDepth(-29).setScrollFactor(0.1, 1);
  moons.fillStyle(0xd8c8b8, 1).fillEllipse(120, groundY - 120, 16, 12);
  moons.fillStyle(0xa89888, 1).fillCircle(116, groundY - 122, 3);
  moons.fillStyle(0xd8c8b8, 1).fillCircle(380, groundY - 96, 4);
  const earth = scene.add.image(250, groundY - 130, 'earth').setDepth(-29).setScrollFactor(0.1, 1).setScale(0.3);
  scene.tweens.add({ targets: earth, alpha: 0.6, duration: 1500, yoyo: true, repeat: -1 });
  // far and near dunes (parallax)
  const far = scene.add.graphics().setDepth(-27).setScrollFactor(0.4, 1);
  far.fillStyle(0xb85a3a, 1);
  for (let i = 0; i < 12; i++) far.fillEllipse(i * 120 - 40, groundY + 4, 190, 70);
  const near = scene.add.graphics().setDepth(-26).setScrollFactor(0.65, 1);
  near.fillStyle(0xd0704a, 1);
  for (let i = 0; i < 14; i++) near.fillEllipse(i * 95 - 30, groundY + 18, 150, 50);
  // wisps of red dust drifting across
  for (let i = 0; i < 8; i++) {
    const d = scene.add.image(-20, groundY - 10 - (i * 37) % 70, 'pixel').setDepth(27).setTint(i % 2 ? 0xe0784a : 0xf0a070)
      .setDisplaySize(6 + (i % 3) * 4, 1).setAlpha(0.6);
    scene.tweens.add({ targets: d, x: W + 20, duration: 7000 + i * 900, delay: i * 1700, repeat: -1, repeatDelay: 3000 + i * 500 });
  }
}

export function drawMarsProps(scene, { L, groundY }) {
  const at = (cx) => cx * TILE + TILE / 2;
  // the hatch down into Mars
  scene.add.image(at(L.shaftX), groundY + 4, 'moon-hatch').setOrigin(0.5, 1).setDepth(12).setTint(0xffd0b0);
  // greenhouse domes behind the camp
  scene.add.image(at(2), groundY + 1, 'mars-dome').setOrigin(0.5, 1).setDepth(-4);
  scene.add.image(at(L.plots[L.plots.length - 1] + 11), groundY + 1, 'mars-dome').setOrigin(0.5, 1).setDepth(-4).setScale(0.8);
  // the windsock, flapping
  const sock = scene.add.sprite(at(L.lecternX + 1) + 4, groundY + 1, 'mars-windsock', 0).setOrigin(0.1, 1).setDepth(-3);
  scene.time.addEvent({ delay: 260, loop: true, callback: () => sock.setFrame(sock.frame.name === 0 ? 1 : 0) });
  // the lectern and the upgrade bench (the same as at home)
  scene.add.image(at(L.lecternX), groundY, 'lectern').setOrigin(0.5, 1).setDepth(5);
  scene.add.image(at(L.benchX), groundY, 'bench').setOrigin(0.5, 1).setDepth(5);
  // the landing pad and the Mars Rocket standing on it
  const padX = L.padX * TILE + TILE / 2;
  scene.add.image(padX, groundY + 2, 'moon-pad').setOrigin(0.5, 1).setDepth(2).setTint(0xffd8c0);
  scene.padRocket = scene.add.image(padX, groundY - 4, 'mars-ship').setOrigin(0.5, 1).setDepth(3);
  // the diggers' flag, planted in the red dust by the pad
  scene.add.image(padX + 44, groundY + 3, 'mars-flag').setOrigin(0.15, 1).setDepth(4);
  // red rocks in the gaps between the plots, and past the last one
  const g = scene.add.graphics().setDepth(4);
  const rock = (x, w, h) => {
    g.fillStyle(0x7a2a1a, 1).fillRect(x - w / 2, groundY - h, w, h);
    g.fillStyle(0xc8583a, 1).fillRect(x - w / 2 + 1, groundY - h + 1, w - 2, h - 2);
    g.fillStyle(0xe8845a, 1).fillRect(x - w / 2 + 1, groundY - h + 1, w - 3, 1);
  };
  for (const px of L.plots.slice(1)) rock(px * TILE - TILE / 2, 8, 5);
  rock((L.plots[L.plots.length - 1] + 7) * TILE, 12, 7);
  rock((L.plots[L.plots.length - 1] + 8) * TILE + 4, 6, 4);
  // pebbles on the dust
  for (let i = 0; i < 40; i++) {
    const x = 12 + ((i * 131) % (L.w * TILE - 24));
    scene.add.image(x, groundY + 1, 'pixel').setOrigin(0.5, 1).setDisplaySize(2 + (i % 3), 1 + (i % 2)).setTint(i % 2 ? 0x8a3a2a : 0xe8845a).setDepth(11);
  }
  // a little glow in the greenhouse
  const glow = scene.add.image(at(2), groundY - 14, 'light').setTint(0x9affb0).setScale(0.8).setAlpha(0.25).setDepth(-3).setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({ targets: glow, alpha: 0.12, duration: 1600, yoyo: true, repeat: -1 });
}
