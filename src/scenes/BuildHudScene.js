// The Build Yard's block bar, in screen space: each player's blocks in a row
// along the bottom, the chosen one in the middle (bigger, with a frame), and
// the LB / RB bumpers either side. Icons only.

import Phaser from 'phaser';
import { CHARACTER_COLORS } from '../art/characters.js';

const SHOWN = 7; // blocks shown in a bar (the chosen one in the middle)
const SHOWN_TWO = 5; // two players: shorter bars, so they never overlap
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

  // Each player's bar is rimmed in their character's colour, so you can tell
  // whose is whose at a glance.
  bar(a, shown) {
    const old = this.bars[a.slot];
    if (old && old.shown === shown) return old;
    if (old) old.c.destroy();
    const color = CHARACTER_COLORS[a.char] ?? 0x8a5a34;
    const half = (shown * SLOT) / 2;
    const c = this.add.container(0, this.scale.height - 22);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.25).fillRoundedRect(-half - 22, -15, shown * SLOT + 48, 36, 8);
    bg.fillStyle(0xf4e4c1, 0.94).fillRoundedRect(-half - 24, -18, shown * SLOT + 48, 36, 8);
    bg.lineStyle(3, color, 1).strokeRoundedRect(-half - 24, -18, shown * SLOT + 48, 36, 8);
    c.add(bg);
    // the shoulder buttons that flip the blocks, at each end
    c.add(this.add.image(-half - 12, 0, 'btn-lb').setScale(1.25));
    c.add(this.add.image(half + 12, 0, 'btn-rb').setScale(1.25));
    const icons = Array.from({ length: shown }, (_, k) => {
      const img = this.add.image((k - (shown - 1) / 2) * SLOT, 0, 'tiles', 2).setScale(1.3);
      c.add(img);
      return img;
    });
    const frame = this.add.graphics();
    frame.lineStyle(3, color, 1).strokeRect(-14, -14, 28, 28);
    c.add(frame);
    // whose bar: a little face above the chosen block
    c.add(this.add.image(0, -24, `char-${a.char}`, 0));
    const b = { c, icons, frame, shown };
    this.bars[a.slot] = b;
    return b;
  }

  update() {
    const blocks = this.yard.blocks;
    const n = blocks.length;
    const players = this.yard.avatars.filter(Boolean);
    const two = players.length > 1;
    const W = this.scale.width;
    players.forEach((a) => {
      const shown = two ? SHOWN_TWO : SHOWN;
      const b = this.bar(a, shown);
      // two players: two bars, side by side
      b.c.x = two ? (a.slot === 0 ? W * 0.25 : W * 0.75) : W / 2;
      b.icons.forEach((img, k) => {
        const off = k - (shown - 1) / 2;
        const id = blocks[(((a.sel + off) % n) + n) % n];
        img.setFrame(id).setScale(off === 0 ? 1.6 : 1.1).setAlpha(Math.abs(off) > 2 ? 0.55 : 1);
        img.setVisible(n > Math.abs(off) * 2 || off === 0);
      });
    });
  }
}
