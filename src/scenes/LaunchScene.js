import Phaser from 'phaser';
import { createRng } from '../world/rng.js';

// Lift-off! A 3-2-1 countdown, flames and smoke, then the rocket climbs up
// into space: the planet you left shrinks away below, the one you're flying
// to grows ahead, and you land at its camp.

const W = 480;
const H = 270;
const TOP = -2600; // the top of the sky, in world pixels
const GROUND = 236;

const lerpColor = (a, b, t) => {
  const ca = Phaser.Display.Color.ValueToColor(a);
  const cb = Phaser.Display.Color.ValueToColor(b);
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(ca, cb, 100, Math.round(t * 100));
  return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
};

export class LaunchScene extends Phaser.Scene {
  constructor() {
    super('Launch');
  }

  init(data) {
    this.from = data?.from ?? 'earth';
    this.to = data?.to ?? 'moon';
    this.ship = data?.ship ?? 'rocket-ship';
  }

  create() {
    const rng = createRng(7);
    this.cameras.main.setBounds(0, TOP, W, H - TOP).setScroll(0, 0);
    this.drawSky(rng);
    this.drawGround();

    this.rocket = this.add.image(W / 2, GROUND, this.ship).setOrigin(0.5, 0.95).setScale(1.5).setDepth(10);
    this.flame = this.add.sprite(W / 2, GROUND, 'rocket-flame', 0).setOrigin(0.5, 0).setScale(1.5).setDepth(9).setVisible(false);
    this.flying = false;
    this.audio = this.registry.get('audio');
    this.cameras.main.fadeIn(400, 20, 12, 30);
    this.countdown();
  }

  drawSky(rng) {
    const g = this.add.graphics().setDepth(-10);
    const bands = 240;
    const span = H - TOP;
    const earth = this.from === 'earth';
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1); // 0 = top of the world, 1 = the ground
      // (the Moon has no air: its sky is space all the way down)
      // (Mars's thin air is butterscotch pink near the ground)
      const low = this.from === 'mars' ? 0xf0b890 : 0x8ec5ff;
      const color = t < 0.45 || !(earth || this.from === 'mars') ? lerpColor(0x05040f, 0x1a1a48, Math.min(1, t / 0.45)) : lerpColor(0x1a1a48, low, (t - 0.45) / 0.55);
      g.fillStyle(color, 1).fillRect(0, TOP + (span * i) / bands, W, span / bands + 1);
    }
    // stars up in space, twinkling
    for (let i = 0; i < 140; i++) {
      const y = TOP + rng.int(0, Math.round(span * 0.55));
      const s = this.add.image(rng.int(0, W), y, 'pixel').setTint(rng.pick([0xffffff, 0xfff6d0, 0x9ff6ff])).setDepth(-9);
      s.setAlpha(0.3 + (1 - (y - TOP) / (span * 0.55)) * 0.7);
      if (i % 3 === 0) this.tweens.add({ targets: s, alpha: 0.15, duration: 600 + (i % 7) * 200, yoyo: true, repeat: -1 });
    }
    // fluffy clouds to fly through (only on Earth)
    for (let i = 0; i < (earth ? 14 : 0); i++) {
      const c = this.add.graphics().setDepth(-8);
      c.fillStyle(0xffffff, 0.85);
      const w = rng.int(40, 90);
      c.fillRoundedRect(0, 0, w, 12, 6).fillRoundedRect(w * 0.2, -8, w * 0.5, 12, 6);
      c.setPosition(rng.int(-20, W - 40), rng.int(-1100, -300));
    }
  }

  drawGround() {
    const g = this.add.graphics().setDepth(5);
    const earth = this.from === 'earth';
    const look = { earth: [0x8fb86a, 0x5aa63c, 0x7cc95a], moon: [0x8a8a9c, 0xb8b8c8, 0xdcdcea], mars: [0xb85a3a, 0xc8583a, 0xe8845a], saturn: [0xc8e0f0, 0xf4faff, 0xffffff] }[this.from] ?? [0x8a8a9c, 0xb8b8c8, 0xdcdcea];
    g.fillStyle(look[0], 1);
    for (let i = 0; i < 7; i++) g.fillCircle(i * 90 - 20, GROUND + 6, 44);
    g.fillStyle(look[1], 1).fillRect(0, GROUND, W, H - GROUND);
    g.fillStyle(look[2], 1).fillRect(0, GROUND, W, 3);
    if (this.from === 'saturn') {
      // giant Saturn fills the sky over the snow
      this.add.image(W - 120, 70, 'saturn-big').setScale(1.2).setDepth(-5);
    } else if (this.from === 'mars') {
      // Mars's two little moons over the red ground
      g.fillStyle(0xd8c8b8, 1).fillEllipse(W - 110, 50, 18, 13);
      g.fillStyle(0xd8c8b8, 1).fillCircle(90, 80, 4);
    } else if (!earth) {
      // the Earth hangs in the Moon's sky while you count down
      this.add.image(W - 90, 60, 'earth').setScale(2).setDepth(-5);
      g.fillStyle(0x9898aa, 1);
      for (let i = 0; i < 12; i++) g.fillRect((i * 47) % W, GROUND + 8 + (i % 3) * 6, 6, 2);
    }
    g.fillStyle(0x8a94a8, 1).fillRect(W / 2 - 50, GROUND - 4, 100, 6);
    g.fillStyle(0xf5c629, 1).fillRect(W / 2 - 50, GROUND - 4, 100, 1);
  }

  // 3, 2, 1 in big numbers, then lift-off
  countdown() {
    ['3', '2', '1'].forEach((n, i) => {
      this.time.delayedCall(600 + i * 900, () => {
        const t = this.add.bitmapText(W / 2, H / 2 - 40, 'pixel', n).setOrigin(0.5).setScale(14).setScrollFactor(0).setDepth(50).setTint(0xffe066);
        this.tweens.add({ targets: t, scale: 18, alpha: 0, duration: 800, ease: 'Quad.easeOut', onComplete: () => t.destroy() });
        this.cameras.main.shake(80, 0.002 + i * 0.002);
        if (this.audio) this.audio.sfx.play('tick');
        this.puffs(3 + i * 3);
      });
    });
    this.time.delayedCall(600 + 3 * 900, () => this.liftOff());
  }

  puffs(n) {
    for (let i = 0; i < n; i++) {
      const dir = i % 2 ? 1 : -1;
      const s = this.add.image(this.rocket.x + dir * 10, GROUND - 4, 'smoke').setDepth(11).setScale(1.5).setAlpha(0.9);
      this.tweens.add({ targets: s, x: s.x + dir * (30 + Math.random() * 50), y: s.y - Math.random() * 16, scale: 4 + Math.random() * 2, alpha: 0, duration: 1400, onComplete: () => s.destroy() });
    }
  }

  liftOff() {
    this.flying = true;
    this.flame.setVisible(true);
    this.time.addEvent({ delay: 70, loop: true, callback: () => this.flame.setFrame((Number(this.flame.frame.name) + 1) % 3) });
    this.cameras.main.shake(900, 0.01);
    this.cameras.main.flash(200, 255, 220, 160);
    if (this.audio) { this.audio.sfx.play('boom'); this.audio.sfx.play('whoosh'); }
    this.puffs(16);
    this.tweens.add({ targets: this.rocket, y: TOP + 140, duration: 5200, ease: 'Quad.easeIn' });
    // looking back: the planet you left shrinks away below…
    const look = (id) => (id === 'earth' ? 'earth' : `planet-${id}`);
    this.time.delayedCall(3000, () => {
      const home = this.add.image(W / 2, H + 160, look(this.from)).setScale(12).setScrollFactor(0).setDepth(8);
      this.tweens.add({ targets: home, scale: 2.2, y: H - 34, duration: 2400, ease: 'Cubic.easeOut' });
    });
    // …and the one you're flying to grows ahead
    this.time.delayedCall(3600, () => {
      const there = this.add.image(W / 2 + 60, 40, look(this.to)).setScale(0.3).setScrollFactor(0).setDepth(8).setAlpha(0);
      this.tweens.add({ targets: there, scale: 3, alpha: 1, y: 70, duration: 2000, ease: 'Quad.easeIn' });
    });
    this.time.delayedCall(5400, () => {
      this.cameras.main.fadeOut(600, 5, 4, 15);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Camp', { planet: this.to, landing: true, from: this.from }));
    });
  }

  update() {
    this.flame.setPosition(this.rocket.x, this.rocket.y - 4);
    if (this.flying) {
      // the camera rides along, keeping the rocket low in the view
      this.cameras.main.setScroll(0, Math.min(0, this.rocket.y - H * 0.7));
      if (Math.random() < 0.5) {
        const s = this.add.image(this.rocket.x + (Math.random() - 0.5) * 10, this.rocket.y + 30, 'smoke').setDepth(8).setAlpha(0.7);
        this.tweens.add({ targets: s, scale: 3, alpha: 0, y: s.y + 30, duration: 900, onComplete: () => s.destroy() });
      }
    }
  }
}
