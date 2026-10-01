import Phaser from 'phaser';
import { stickerById } from '../game/stickers.js';
import { createEdge } from '../input/intents.js';
import { CHARACTERS, CHARACTER_COLORS } from '../art/characters.js';
import { LAYER_COLORS } from '../tuning.js';
import { shownOres } from '../game/ores.js';
import { getState } from '../save/store.js';
import { layersOf, mineRows } from '../game/planets.js';

// The "how did we do?" card shown when you get home: what each player brought,
// how deep each of you went (a gold ribbon marks a record), chests, new
// stickers. A closes it, or it tidies itself away after a few seconds; nobody
// can walk around in camp while it's up.

const PAPER = 0xf4e4c1;
const EDGE = 0x8a5a34;
const INK = 0x4a3222;
const SUMMARY_SECONDS = 5;

export class SummaryScene extends Phaser.Scene {
  constructor() {
    super('Summary');
  }

  init(data) {
    this.summary = data.summary;
    this.packs = data.packs;
    this.chars = data.chars;
    this.deepestBy = data.deepestBy ?? [];
    this.onDone = data.onDone;
  }

  create() {
    this.session = this.registry.get('input');
    this.edges = [createEdge(), createEdge()];
    for (const s of this.session.slots) if (s.intent) this.edges[s.slot](!!s.intent.jump);
    this.closing = false;
    this.openedAt = this.time.now;
    const players = this.packs.map((p, slot) => (p ? slot : -1)).filter((slot) => slot >= 0);
    const hasStickers = this.summary.stickers.length > 0;
    const W = 320;
    const H = 34 + players.length * 26 + 36 + (hasStickers ? 28 : 0) + 24;
    const x = (480 - W) / 2;
    const y = Math.max(34, (270 - H) / 2 + 8);
    const c = this.add.container(0, 0);
    this.card = c;
    this.add.rectangle(0, 0, 480, 270, 0x120a18, 0.35).setOrigin(0).setDepth(-1);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRoundedRect(x + 3, y + 4, W, H, 8);
    g.fillStyle(EDGE, 1).fillRoundedRect(x, y, W, H, 8);
    g.fillStyle(PAPER, 1).fillRoundedRect(x + 3, y + 3, W - 6, H - 6, 7);
    c.add(g);

    // header: a house icon (or the rocket, back from another planet)
    c.add(this.add.image(240, y + 14, this.summary.away ? 'icon-rocket' : 'icon-home').setScale(2));

    // each player's haul: their face in their colour, then only the ores they brought
    let ry = y + 34;
    const kinds = shownOres(getState(this.registry), this.summary.planet ?? 'earth');
    players.forEach((slot, row) => {
      const pack = this.packs[slot];
      const char = this.chars[slot] ?? CHARACTERS[slot];
      c.add(this.add.circle(x + 20, ry + 6, 10, CHARACTER_COLORS[char] ?? EDGE, 0.35));
      c.add(this.add.image(x + 20, ry + 6, `char-${char}`, 0));
      const got = kinds.filter((ore) => (pack[ore] ?? 0) > 0);
      if (!got.length) {
        // came home empty-handed: just an empty bag (no zeros)
        c.add(this.add.image(x + 48, ry + 6, 'icon-bag').setScale(1.3).setAlpha(0.5));
      }
      const gap = Math.min(44, (W - 80) / Math.max(1, got.length));
      got.forEach((ore, i) => {
        const ox = x + 46 + i * gap;
        const n = pack[ore];
        c.add(this.add.image(ox, ry + 6, `ore-${ore}`).setScale(1.3));
        const t = this.add.bitmapText(ox + 10, ry + 1, 'pixel', '0').setScale(2).setTint(INK);
        c.add(t);
        // count up
        this.tweens.addCounter({ from: 0, to: n, duration: 600 + n * 20, delay: 200 + row * 150, onUpdate: (tw) => t.setText(String(Math.round(tw.getValue()))) });
      });
      ry += 26;
    });
    // the most ore ever in one trip: the ribbon hangs beside the hauls
    if (this.summary.best.mostOres) this.ribbon(c, x + W - 22, y + 34 + (players.length * 26) / 2 - 7);

    // how deep: the layers as a bar, each player's face at their deepest point
    // (player 1 above the bar, player 2 below), and chests if you found any
    const chests = this.summary.chests;
    const barX = x + 24;
    const barW = W - (chests ? 110 : 60);
    const barY = ry + 14;
    const bar = this.add.graphics();
    const planet = this.summary.planet ?? 'earth';
    const depthH = mineRows(planet);
    const seg = (from, to, color) => bar.fillStyle(color, 1).fillRect(barX + (from / depthH) * barW, barY, ((to - from) / depthH) * barW, 8);
    Object.entries(layersOf(planet)).forEach(([name, l], i) => seg(i === 0 ? 0 : l.top, l.bottom + 1, LAYER_COLORS[name]));
    c.add(bar);
    let deepestX = barX;
    players.forEach((slot, i) => {
      const depth = Math.max(0, this.deepestBy[slot] ?? this.summary.deepest);
      const to = barX + (Math.min(depth, depthH) / depthH) * barW;
      deepestX = Math.max(deepestX, to);
      const my = i === 0 ? barY - 7 : barY + 15;
      const marker = this.add.image(barX, my, `char-${this.chars[slot] ?? CHARACTERS[slot]}`, 0).setScale(0.8);
      c.add(marker);
      this.tweens.add({ targets: marker, x: to, duration: 900, delay: 300 + i * 120, ease: 'Cubic.easeOut' });
    });
    // a new deepest record: the ribbon pops up where you got to
    if (this.summary.best.deepest) {
      const r = this.ribbon(c, deepestX + 13, barY - 7);
      r.setAlpha(0);
      this.tweens.add({ targets: r, alpha: 1, delay: 1200, duration: 200 });
    }
    if (chests) {
      const chestX = x + W - 70;
      c.add(this.add.image(chestX, barY + 4, 'tiles', 16));
      c.add(this.add.bitmapText(chestX + 10, barY, 'pixel', `x${chests}`).setScale(2).setTint(INK));
    }

    // new stickers
    if (hasStickers) {
      const sy = barY + 28;
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

    // A closes it (or it closes by itself, below)
    this.aBtn = this.add.image(x + W - 20, y + H - 18, 'btn-a').setScale(2);
    this.tweens.add({ targets: this.aBtn, scale: 2.4, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    c.setScale(0.85).setAlpha(0);
    c.x = 480 * 0.075;
    c.y = 270 * 0.075;
    this.tweens.add({ targets: c, scale: 1, alpha: 1, x: 0, y: 0, duration: 260, ease: 'Back.easeOut' });
    // nobody can move while it's up, so it doesn't stay long
    this.time.delayedCall(SUMMARY_SECONDS * 1000, () => this.close());
    const audio = this.registry.get('audio');
    if (audio) audio.sfx.play(this.summary.best.deepest || this.summary.best.mostOres ? 'build' : 'upgrade');
  }

  ribbon(c, x, y) {
    const r = this.add.image(x, y, 'ribbon').setScale(1.4);
    c.add(r);
    this.tweens.add({ targets: r, angle: { from: -8, to: 8 }, duration: 400, yoyo: true, repeat: -1 });
    return r;
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
