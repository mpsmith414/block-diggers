// The Build Yard's block bar, in screen space: each player's blocks in a row
// along the bottom, the chosen one in the middle (bigger, with a frame), and
// LB/RB arrows either side. Icons only.

import Phaser from 'phaser';

const SHOWN = 7; // blocks shown in a bar (the chosen one in the middle)
const SLOT = 30;

export class BuildHudScene extends Phaser.Scene {
  constructor() {
    super('BuildHud');
  }

  init(data) {
    this.yard = data.yard;
  }

  create() {
    this.bars = [];
  }

  bar(slot) {
    if (this.bars[slot]) return this.bars[slot];
    const W = this.scale.width;
    const H = this.scale.height;
    const two = slot === 1;
    const cx = this.yard.avatars.filter(Boolean).length > 1 || two ? (two ? W * 0.75 : W * 0.25) : W / 2;
    const y = H - 22;
    const c = this.add.container(cx, y);
    const bg = this.add.graphics();
    bg.fillStyle(0xf4e4c1, 0.92).fillRoundedRect(-(SHOWN * SLOT) / 2 - 24, -18, SHOWN * SLOT + 48, 36, 8);
    bg.lineStyle(2, 0x8a5a34, 1).strokeRoundedRect(-(SHOWN * SLOT) / 2 - 24, -18, SHOWN * SLOT + 48, 36, 8);
    c.add(bg);
    c.add(this.add.image(-(SHOWN * SLOT) / 2 - 12, 0, 'arrow-r').setFlipX(true).setScale(1.3));
    c.add(this.add.image((SHOWN * SLOT) / 2 + 12, 0, 'arrow-r').setScale(1.3));
    const icons = Array.from({ length: SHOWN }, (_, k) => {
      const img = this.add.image((k - (SHOWN - 1) / 2) * SLOT, 0, 'tiles', 2).setScale(1.3);
      c.add(img);
      return img;
    });
    const frame = this.add.graphics();
    frame.lineStyle(3, slot === 0 ? 0xffd84a : 0x5ad0ff, 1).strokeRect(-14, -14, 28, 28);
    c.add(frame);
    const b = { c, icons, frame, cx };
    this.bars[slot] = b;
    return b;
  }

  update() {
    const blocks = this.yard.blocks;
    const n = blocks.length;
    const players = this.yard.avatars.filter(Boolean);
    players.forEach((a) => {
      const b = this.bar(a.slot);
      // two players: two bars, side by side
      const W = this.scale.width;
      b.c.x = players.length > 1 ? (a.slot === 0 ? W * 0.27 : W * 0.73) : W / 2;
      b.icons.forEach((img, k) => {
        const off = k - (SHOWN - 1) / 2;
        const id = blocks[(((a.sel + off) % n) + n) % n];
        img.setFrame(id).setScale(off === 0 ? 1.6 : 1.1).setAlpha(Math.abs(off) > 2 ? 0.55 : 1);
        img.setVisible(n > Math.abs(off) * 2 || off === 0);
      });
    });
  }
}
