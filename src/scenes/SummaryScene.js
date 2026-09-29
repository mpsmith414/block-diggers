import Phaser from 'phaser';
import { ORES } from '../world/blocks.js';
import { stickerById } from '../game/stickers.js';
import { createEdge } from '../input/intents.js';
import { LAYER_COLORS } from '../tuning.js';
import { shownOres } from '../game/ores.js';
import { getState } from '../save/store.js';
import { layersOf, mineRows } from '../game/planets.js';

// The "how did we do?" card shown when you get home: ores per player, how
// deep you went (with a gold "best!" ribbon for records), chests, new stickers.

const PAPER = 0xf4e4c1;
const EDGE = 0x8a5a34;
const INK = 0x4a3222;

export class SummaryScene extends Phaser.Scene {
  constructor() {
    super('Summary');
  }

  init(data) {
    this.summary = data.summary;
    this.packs = data.packs;
    this.chars = data.chars;
    this.onDone = data.onDone;
  }

  create() {
    this.session = this.registry.get('input');
    this.edges = [createEdge(), createEdge()];
    for (const s of this.session.slots) if (s.intent) this.edges[s.slot](!!s.intent.jump);
    this.closing = false;
    this.openedAt = this.time.now;
    const W = 300;
    const rows = this.packs.filter(Boolean).length;
    const H = 34 + rows * 26 + 26 + (this.summary.stickers.length ? 28 : 0) + 20;
    const x = (480 - W) / 2;
    const y = Math.max(40, (270 - H) / 2 + 10);
    const c = this.add.container(0, 0);
    this.card = c;
    this.add.rectangle(0, 0, 480, 270, 0x120a18, 0.35).setOrigin(0).setDepth(-1);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRoundedRect(x + 3, y + 4, W, H, 8);
    g.fillStyle(EDGE, 1).fillRoundedRect(x, y, W, H, 8);
    g.fillStyle(PAPER, 1).fillRoundedRect(x + 3, y + 3, W - 6, H - 6, 7);
    c.add(g);

    // header: a house icon and a little rope
    c.add(this.add.image(240, y + 14, this.summary.moon ? 'icon-rocket' : 'icon-home').setScale(2));

    // ores per player
    let ry = y + 34;
    this.packs.forEach((pack, slot) => {
      if (!pack) return;
      c.add(this.add.image(x + 18, ry + 6, `char-${this.chars[slot]}`, 0));
      const kinds = shownOres(getState(this.registry), this.summary.planet ?? 'earth');
      const gap = Math.min(50, 250 / kinds.length);
      kinds.forEach((ore, i) => {
        const ox = x + 42 + i * gap;
        const n = pack[ore] ?? 0;
        c.add(this.add.image(ox, ry + 6, `ore-${ore}`).setScale(1.3).setAlpha(n ? 1 : 0.3));
        const t = this.add.bitmapText(ox + 10, ry + 1, 'pixel', '0').setScale(2).setTint(INK).setAlpha(n ? 1 : 0.3);
        c.add(t);
        // count up
        this.tweens.addCounter({ from: 0, to: n, duration: 600 + n * 20, delay: 200 + slot * 150, onUpdate: (tw) => t.setText(String(Math.round(tw.getValue()))) });
      });
      ry += 26;
    });

    // depth bar with the deepest point, chests
    const barX = x + 20;
    const barW = W - 110;
    const barY = ry + 10;
    const bar = this.add.graphics();
    const planet = this.summary.planet ?? 'earth';
    const depthH = mineRows(planet);
    const seg = (from, to, color) => bar.fillStyle(color, 1).fillRect(barX + (from / depthH) * barW, barY, ((to - from) / depthH) * barW, 8);
    Object.entries(layersOf(planet)).forEach(([name, l], i) => seg(i === 0 ? 0 : l.top, l.bottom + 1, LAYER_COLORS[name]));
    c.add(bar);
    const marker = this.add.image(barX, barY + 4, `char-${this.chars[0]}`, 0).setScale(0.8);
    c.add(marker);
    this.tweens.add({ targets: marker, x: barX + (Math.max(0, this.summary.deepest) / depthH) * barW, duration: 900, delay: 300, ease: 'Cubic.easeOut' });
    if (this.summary.best.deepest) this.ribbon(c, barX + barW + 4, barY - 2);
    const chestX = x + W - 66;
    c.add(this.add.image(chestX, barY + 4, 'tiles', 16));
    c.add(this.add.bitmapText(chestX + 10, barY, 'pixel', `x${this.summary.chests}`).setScale(2).setTint(INK));
    if (this.summary.best.mostOres) this.ribbon(c, x + W - 30, y + 30);

    // new stickers
    if (this.summary.stickers.length) {
      const sy = barY + 20;
      this.summary.stickers.slice(0, 10).forEach((id, i) => {
        const st = stickerById(id);
        if (!st) return;
        const icon = this.add.image(x + 24 + i * 26, sy + 6, st.icon, st.frame);
        icon.setScale(Math.min(1.4, 18 / Math.max(icon.width, icon.height)));
        c.add(icon);
        icon.setAlpha(0);
        this.tweens.add({ targets: icon, alpha: 1, scale: { from: 0.2, to: icon.scale }, delay: 700 + i * 120, duration: 250, ease: 'Back.easeOut' });
      });
    }

    this.aBtn = this.add.image(x + W - 16, y + H - 14, 'btn-a').setScale(1.4);
    this.tweens.add({ targets: this.aBtn, scale: 1.7, duration: 450, yoyo: true, repeat: -1 });
    c.setScale(0.85).setAlpha(0);
    c.x = 480 * 0.075;
    c.y = 270 * 0.075;
    this.tweens.add({ targets: c, scale: 1, alpha: 1, x: 0, y: 0, duration: 260, ease: 'Back.easeOut' });
    this.time.delayedCall(6000, () => this.close());
    const audio = this.registry.get('audio');
    if (audio) audio.sfx.play(this.summary.best.deepest || this.summary.best.mostOres ? 'build' : 'upgrade');
  }

  ribbon(c, x, y) {
    const r = this.add.image(x, y, 'ribbon').setScale(1.4);
    c.add(r);
    this.tweens.add({ targets: r, angle: { from: -8, to: 8 }, duration: 400, yoyo: true, repeat: -1 });
  }

  close() {
    if (this.closing) return;
    this.closing = true;
    this.tweens.add({
      targets: this.card,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        this.scene.stop();
        if (this.onDone) this.onDone();
      },
    });
  }

  update() {
    if (this.time.now - this.openedAt < 500) return;
    for (const { slot, intent } of this.session.slots) {
      if (intent && this.edges[slot](!!intent.jump)) this.close();
    }
  }
}
