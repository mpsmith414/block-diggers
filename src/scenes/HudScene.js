import Phaser from 'phaser';
import { ORES } from '../world/blocks.js';
import { packFull } from '../game/loot.js';
import { B } from '../world/blocks.js';
import { MINE_H, LAYERS, TILE } from '../tuning.js';
import { nextGoal, deepestMissing, oreTopRow } from '../game/goals.js';
import { getState } from '../save/store.js';
import { shownOres } from '../game/ores.js';

// Per-player panels: character face, ore counts, backpack meter. Icons and
// numbers only — nothing a child needs to read.

const PANEL_H = 30;
const PAPER = 0xf4e4c1;
const PAPER_EDGE = 0x8a5a34;
const INK = 0x4a3222;

export class HudScene extends Phaser.Scene {
  constructor() {
    super('Hud');
  }

  init(data) {
    this.source = data.source;
  }

  create() {
    this.panels = [];
    this.buildDepthMeter();
  }

  // A thin strip on the right: the layers top to bottom, a face for each
  // player at their depth, and a gold dot for every chest still to find.
  buildDepthMeter() {
    const x = this.scale.width - 10;
    const top = 44;
    const h = this.scale.height - top - 10;
    this.meter = { x, top, h, scale: h / MINE_H };
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.35).fillRoundedRect(x - 4, top - 4, 9, h + 8, 3);
    const band = (from, to, color) => g.fillStyle(color, 1).fillRect(x - 2, top + from * this.meter.scale, 5, (to - from + 1) * this.meter.scale);
    band(0, 0, 0x5aa63c);
    band(LAYERS.dirt.top, LAYERS.dirt.bottom, 0x8a5a34);
    band(LAYERS.stone.top, LAYERS.stone.bottom, 0x7d7d86);
    band(LAYERS.deep.top, LAYERS.deep.bottom, 0x3f3d4f);
    band(LAYERS.crystal.top, LAYERS.crystal.bottom, 0x6a4fa8);
    this.chestDots = this.source.world.chests.map((c) => this.add.rectangle(x - 4, top + c.y * this.meter.scale, 3, 3, 0xffd84a).setOrigin(0.5));
    this.eggDots = this.source.world.eggs.map((e) => this.add.rectangle(x + 5, top + e.y * this.meter.scale, 3, 4, 0xfff6d0).setOrigin(0.5));
    const bc = this.source.world.bigChest;
    this.bigDot = bc ? this.add.rectangle(x - 4, top + bc.y * this.meter.scale, 4, 3, 0xd08cff).setOrigin(0.5) : null;
    this.carriedEggs = this.add.container(96, 38);
    this.buildGoal();
    this.carriedShown = 0;
    this.faces = [];
  }

  // "We're saving up for…": the next thing to get and the ore it still needs,
  // plus an arrow on the depth meter at the layer where that ore is found.
  buildGoal() {
    this.goalCard = this.add.container(4, 36);
    this.goalArrow = this.add.container(0, 0).setVisible(false);
    this.goalArrow.add([this.add.image(0, 0, 'arrow-r').setScale(1.5), this.add.image(-10, 0, 'ore-iron')]);
    this.goalKey = '';
    this.goalT = 0;
  }

  updateGoal(dt, time) {
    this.goalT -= dt;
    if (this.goalT <= 0) {
      this.goalT = 0.5;
      const state = getState(this.registry);
      const bank = { ...state.bank };
      for (const a of this.source.avatars) if (a) for (const o of ORES) bank[o] += a.pack.ores[o];
      const goal = nextGoal({ ...state, bank });
      const key = goal ? `${goal.id}:${JSON.stringify(goal.missing)}` : 'none';
      if (key !== this.goalKey) {
        this.goalKey = key;
        this.goalCard.removeAll(true);
        this.goal = goal;
        if (goal) {
          const missing = Object.entries(goal.missing);
          const w = 30 + Math.max(1, missing.length) * 28;
          const g = this.add.graphics();
          g.fillStyle(0x8a5a34, 1).fillRoundedRect(0, 0, w, 20, 4);
          g.fillStyle(0xf4e4c1, 1).fillRoundedRect(1, 1, w - 2, 18, 3);
          this.goalCard.add(g);
          const icon = goal.kind === 'blueprint'
            ? this.add.image(12, 10, `bld-${goal.id}`).setScale(0.17)
            : this.add.image(12, 10, { pick: 'icon-pick', pack: 'icon-bag', lantern: 'icon-lantern' }[goal.id]);
          this.goalCard.add(icon);
          if (!missing.length) {
            // enough ore: go home and get it!
            const home = this.add.image(38, 10, 'icon-home');
            this.goalCard.add(home);
            this.tweens.add({ targets: home, scale: 1.3, duration: 400, yoyo: true, repeat: -1 });
          }
          missing.forEach(([ore, n], i) => {
            this.goalCard.add(this.add.image(30 + i * 28, 10, `ore-${ore}`));
            this.goalCard.add(this.add.bitmapText(37 + i * 28, 7, 'pixel', String(n)).setTint(0x4a3222));
          });
        }
      }
    }
    const ore = deepestMissing(this.goal);
    if (ore && ore !== 'coal') {
      const { x, top, scale } = this.meter;
      this.goalArrow.list[1].setTexture(`ore-${ore}`);
      this.goalArrow.setVisible(true).setPosition(x - 12 + Math.sin(time / 200) * 2, top + oreTopRow(ore) * scale);
    } else {
      this.goalArrow.setVisible(false);
    }
  }

  updateDepthMeter(time) {
    const { x, top, scale } = this.meter;
    this.source.world.chests.forEach((c, i) => {
      const open = this.source.grid.get(c.x, c.y) !== B.CHEST;
      const known = this.source.revealAll || this.source.seenChests.has(i);
      this.chestDots[i].setVisible(!open && known).setAlpha(0.6 + Math.sin(time / 300 + i) * 0.4);
    });
    const reveal = this.source.revealAll;
    this.source.finds.eggs.forEach((e, i) => this.eggDots[i].setVisible(reveal && !e.taken));
    if (this.bigDot) {
      const bc = this.source.world.bigChest;
      this.bigDot.setVisible(reveal && this.source.grid.get(bc.x, bc.y) === B.BIGCHEST);
    }
    // eggs you're carrying home
    const carried = this.source.finds.carried;
    if (carried.length !== this.carriedShown) {
      this.carriedShown = carried.length;
      this.carriedEggs.removeAll(true);
      carried.forEach((kind, i) => {
        const img = this.add.image(i * 13 + 6, 7, 'egg', ['mole', 'glowbug', 'batbuddy', 'golden'].indexOf(kind));
        this.carriedEggs.add(img);
        if (i === carried.length - 1) this.tweens.add({ targets: img, scale: { from: 2, to: 1 }, duration: 300, ease: 'Back.easeOut' });
      });
    }
    for (const a of this.source.avatars) {
      if (!a) continue;
      if (!this.faces[a.slot]) {
        this.faces[a.slot] = this.add.image(0, 0, `char-${a.char}`, 0).setScale(0.6);
      }
      const row = Math.max(0, (a.p.y + 7) / TILE);
      this.faces[a.slot].setPosition(x - 10 - a.slot * 9, top + row * scale);
    }
  }

  panelFor(a) {
    const kinds = shownOres(getState(this.registry));
    const old = this.panels[a.slot];
    if (old && old.kinds.length === kinds.length) return old;
    if (old) old.c.destroy();
    const PANEL_W = Math.max(150, 30 + kinds.length * 25);
    const x = a.slot === 0 ? 4 : this.scale.width - PANEL_W - 4;
    const y = 4;
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(PAPER_EDGE, 1).fillRoundedRect(0, 0, PANEL_W, PANEL_H, 4);
    g.fillStyle(PAPER, 1).fillRoundedRect(1, 1, PANEL_W - 2, PANEL_H - 2, 3);
    c.add(g);
    const face = this.add.image(4, 3, `char-${a.char}`, 0).setOrigin(0);
    c.add(face);
    const ores = kinds.map((ore, i) => {
      const ox = 24 + i * 25;
      const icon = this.add.image(ox, 4, `ore-${ore}`).setOrigin(0);
      const num = this.add.bitmapText(ox + 11, 6, 'pixel', '0').setTint(INK);
      c.add([icon, num]);
      return { ore, icon, num };
    });
    const bag = this.add.image(24, 17, 'icon-bag').setOrigin(0);
    const barBg = this.add.rectangle(36, 19, 80, 6, 0xd8c49a).setOrigin(0);
    const bar = this.add.rectangle(36, 19, 0, 6, 0x6bbf59).setOrigin(0);
    const count = this.add.bitmapText(120, 19, 'pixel', '0/20').setTint(INK);
    const full = this.add.image(4, 18, 'icon-full').setOrigin(0).setVisible(false);
    c.add([bag, barBg, bar, count, full]);
    const panel = { c, ores, bar, count, full, bump: 0, kinds };
    this.panels[a.slot] = panel;
    return panel;
  }

  update(time, delta) {
    this.updateDepthMeter(time);
    this.updateGoal(delta / 1000, time);
    for (const a of this.source.avatars) {
      if (!a) continue;
      const p = this.panelFor(a);
      for (const o of p.ores) {
        const n = a.pack.ores[o.ore];
        const text = String(n);
        if (o.num.text !== text) {
          o.num.setText(text);
          this.tweens.add({ targets: o.icon, scale: { from: 1.5, to: 1 }, duration: 200, ease: 'Back.easeOut' });
        }
        const alpha = n > 0 ? 1 : 0.35;
        o.icon.setAlpha(alpha);
        o.num.setAlpha(alpha);
      }
      const frac = a.pack.count / a.pack.cap;
      p.bar.width = Math.round(80 * frac);
      p.bar.fillColor = frac >= 1 ? 0xe0503a : frac > 0.75 ? 0xf0b23a : 0x6bbf59;
      p.count.setText(`${a.pack.count}/${a.pack.cap}`);
      const isFull = packFull(a.pack);
      p.full.setVisible(isFull && Math.floor(time / 300) % 2 === 0);
    }
  }
}
