// The HUD over a Wonder planet: the goal card at the top left (the planet's
// collectible and "12/40", or a jelly bean count for the climb, or your place
// in the race) with the prize beside it, dark until the goal is done; and for
// the climb, a height meter down the right-hand side.

import Phaser from 'phaser';

const PAPER = 0xf4e4c1;
const EDGE = 0x8a5a34;
const INK = 0x4a3222;
const PLACE_COLORS = [0xffd84a, 0xd8e0ec, 0xe0985a, 0xb8a8c8];

function panel(g, x, y, w, h) {
  g.fillStyle(0x000000, 0.25).fillRoundedRect(x + 2, y + 3, w, h, 5);
  g.fillStyle(EDGE, 1).fillRoundedRect(x, y, w, h, 5);
  g.fillStyle(PAPER, 1).fillRoundedRect(x + 2, y + 2, w - 4, h - 4, 4);
}

export class WonderHudScene extends Phaser.Scene {
  constructor() {
    super('WonderHud');
  }

  init(data) {
    this.wonder = data.wonder;
  }

  create() {
    this.card = this.add.container(8, 8);
    this.meter = this.add.container(0, 0);
    this.key = null;
    this.bump = 0;
  }

  // the card, redrawn whenever what it shows changes
  drawCard(goal) {
    this.card.removeAll(true);
    const g = this.add.graphics();
    this.card.add(g);
    if (goal.kind === 'race') {
      // your place: a big number on a medal colour
      panel(g, 0, 0, 74, 34);
      const place = goal.place ?? 1;
      g.fillStyle(PLACE_COLORS[place - 1] ?? 0xffffff, 1).fillCircle(18, 17, 12);
      g.lineStyle(2, INK, 1).strokeCircle(18, 17, 12);
      this.card.add(this.add.bitmapText(18, 18, 'pixel', String(place)).setOrigin(0.5).setScale(3).setTint(INK));
      const coin = this.add.image(42, 17, goal.icon).setScale(1.4);
      this.card.add(coin);
      this.card.add(this.add.bitmapText(50, 12, 'pixel', String(goal.coins ?? 0)).setScale(2).setTint(INK));
      return;
    }
    const text = goal.kind === 'height' ? String(goal.beans ?? 0) : `${goal.have}/${goal.need}`;
    const w = 40 + text.length * 10 + 26;
    panel(g, 0, 0, w, 30);
    const icon = this.add.image(15, 15, goal.icon).setScale(2);
    this.card.add(icon);
    this.card.add(this.add.bitmapText(29, 9, 'pixel', text).setScale(2).setTint(goal.done ? 0x2f8f34 : INK));
    // the prize: dark until the goal is done
    const prize = this.add.image(w - 16, 15, `wprize-${goal.prize}`).setScale(1.3);
    if (!goal.done && goal.kind !== 'height') prize.setTintFill(0x8a7a6a).setAlpha(0.7);
    this.card.add(prize);
    if (goal.done) this.tweens.add({ targets: prize, scale: 1.7, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (this.bump) {
      this.tweens.add({ targets: icon, scale: 2.8, duration: 120, yoyo: true });
    }
  }

  // the climb: a tall bar on the right, filling as you go up, with your
  // character's marker and the crown at the top
  drawMeter(goal) {
    this.meter.removeAll(true);
    if (goal.kind !== 'height') return;
    const x = 462;
    const top = 40;
    const h = 180;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRoundedRect(x - 5, top - 3, 14, h + 8, 6);
    g.fillStyle(EDGE, 1).fillRoundedRect(x - 7, top - 5, 14, h + 8, 6);
    g.fillStyle(PAPER, 1).fillRoundedRect(x - 5, top - 3, 10, h + 4, 5);
    const p = Phaser.Math.Clamp(goal.progress ?? 0, 0, 1);
    g.fillStyle(0xff5a8a, 1).fillRoundedRect(x - 3, top + h * (1 - p), 6, h * p, 3);
    this.meter.add(g);
    this.meter.add(this.add.image(x, top - 14, `wprize-${goal.prize}`).setScale(1.3));
    for (const m of goal.marks ?? []) {
      const img = this.add.image(x - 12, top + h * (1 - Phaser.Math.Clamp(m.p, 0, 1)), `char-${m.char}`, 0).setScale(0.8);
      this.meter.add(img);
    }
  }

  update() {
    const w = this.wonder;
    if (!w || !w.scene.isActive() && !w.scene.isPaused()) return;
    const goal = w.goal();
    const key = JSON.stringify([goal.kind, goal.have, goal.need, goal.done, goal.beans, goal.place, goal.coins]);
    if (key !== this.key) {
      this.bump = this.key !== null;
      this.key = key;
      this.drawCard(goal);
    }
    const meterKey = goal.kind === 'height' ? JSON.stringify([Math.round((goal.progress ?? 0) * 90), (goal.marks ?? []).map((m) => Math.round(m.p * 90))]) : null;
    if (meterKey !== this.meterKey) {
      this.meterKey = meterKey;
      this.drawMeter(goal);
    }
  }
}
