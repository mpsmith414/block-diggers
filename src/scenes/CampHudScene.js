import Phaser from 'phaser';
import { ORES } from '../world/blocks.js';
import { UPGRADE_KINDS, UPGRADES } from '../game/economy.js';
import { getState } from '../save/store.js';

// Camp overlay in screen space (never zoomed): the ore bank, upgrade levels,
// and the blueprint / upgrade picker.

const PAPER = 0xf4e4c1;
const EDGE = 0x8a5a34;
const INK = 0x4a3222;
const RED = 0xd0463a;
const GREEN = 0x4cc24a;
const UPGRADE_ICON = { pick: 'icon-pick', pack: 'icon-bag', lantern: 'icon-lantern' };

function panel(scene, x, y, w, h) {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.25).fillRoundedRect(x + 2, y + 3, w, h, 5);
  g.fillStyle(EDGE, 1).fillRoundedRect(x, y, w, h, 5);
  g.fillStyle(PAPER, 1).fillRoundedRect(x + 2, y + 2, w - 4, h - 4, 4);
  return g;
}

export class CampHudScene extends Phaser.Scene {
  constructor() {
    super('CampHud');
  }

  init(data) {
    this.camp = data.camp;
  }

  create() {
    this.picker = null;
    this.pickerUi = null;
    this.buildBank();
    this.pointer = this.add.container(0, 0).setVisible(false);
    this.pointer.add([this.add.image(0, -12, 'star').setScale(1.5), this.add.image(0, 4, 'arrow-r').setScale(2)]);
  }

  // ---------- bank ----------

  buildBank() {
    const w = 190;
    const x = Math.round((this.scale.width - w) / 2);
    const y = 4;
    this.bank = this.add.container(0, 0);
    this.bank.add(panel(this, x, y, w, 32));
    this.bankIcons = {};
    ORES.forEach((ore, i) => {
      const ox = x + 8 + i * 28;
      const icon = this.add.image(ox, y + 5, `ore-${ore}`).setOrigin(0);
      const num = this.add.bitmapText(ox + 12, y + 7, 'pixel', '0').setTint(INK);
      this.bank.add([icon, num]);
      this.bankIcons[ore] = { icon, num, shown: 0 };
    });
    // upgrade levels: icon + pips
    this.levelPips = {};
    UPGRADE_KINDS.forEach((kind, i) => {
      const ox = x + 146;
      const oy = y + 3 + i * 9;
      const icon = this.add.image(ox, oy, UPGRADE_ICON[kind]).setOrigin(0).setScale(0.66);
      this.bank.add(icon);
      const pips = [0, 1, 2].map((p) => {
        const pip = this.add.rectangle(ox + 11 + p * 6, oy + 3, 4, 4, 0xd8c49a).setOrigin(0);
        this.bank.add(pip);
        return pip;
      });
      this.levelPips[kind] = pips;
    });
    this.syncBank(getState(this.registry).bank);
  }

  syncBank(bank, only = null) {
    for (const ore of ORES) {
      if (only && ore !== only) continue;
      const b = this.bankIcons[ore];
      b.shown = bank[ore];
      b.num.setText(String(bank[ore]));
      b.icon.setAlpha(bank[ore] > 0 ? 1 : 0.4);
      b.num.setAlpha(bank[ore] > 0 ? 1 : 0.4);
    }
    const state = getState(this.registry);
    for (const kind of UPGRADE_KINDS) {
      this.levelPips[kind].forEach((pip, p) => pip.setFillStyle(p <= state.upgrades[kind] ? 0x6bbf59 : 0xd8c49a));
    }
  }

  bump(ore) {
    const b = this.bankIcons[ore];
    b.shown++;
    b.num.setText(String(b.shown));
    b.icon.setAlpha(1);
    b.num.setAlpha(1);
    this.tweens.add({ targets: b.icon, scale: { from: 1.6, to: 1 }, duration: 180, ease: 'Back.easeOut' });
  }

  // Ores fly from each player into the bank, one by one, counting up.
  flyOres(packs, avatars, finalBank) {
    const cam = this.camp.cameras.main;
    this.counting = true;
    const start = {};
    for (const ore of ORES) start[ore] = finalBank[ore] - packs.reduce((n, p) => n + (p[ore] ?? 0), 0);
    for (const ore of ORES) { this.bankIcons[ore].shown = start[ore]; this.bankIcons[ore].num.setText(String(start[ore])); }
    let delay = 0;
    let count = 0;
    const step = Math.max(35, Math.min(120, 2400 / Math.max(1, packs.reduce((n, p) => n + ORES.reduce((m, o) => m + (p[o] ?? 0), 0), 0))));
    packs.forEach((pack, slot) => {
      const a = avatars[slot];
      for (const ore of ORES) {
        for (let k = 0; k < (pack[ore] ?? 0); k++) {
          const idx = count++;
          this.time.delayedCall(delay, () => {
            const sx = a ? (a.sprite.x - cam.worldView.x) * cam.zoom : this.scale.width / 2;
            const sy = a ? (a.sprite.y - 10 - cam.worldView.y) * cam.zoom : this.scale.height / 2;
            const target = this.bankIcons[ore].icon;
            const img = this.add.image(sx, sy, `ore-${ore}`).setScale(1.3);
            this.tweens.add({
              targets: img,
              x: target.x + 5,
              y: target.y + 5,
              scale: 1,
              duration: 450,
              ease: 'Cubic.easeIn',
              onComplete: () => {
                img.destroy();
                this.bump(ore);
                this.camp.events.emit('deposit', ore, idx);
              },
            });
          });
          delay += step;
        }
      }
    });
    this.time.delayedCall(delay + 500, () => {
      this.syncBank(finalBank);
      this.counting = false;
    });
  }

  // side: 1 = something good off to the right, -1 = left, 0 = hide
  pointTo(side, time) {
    if (!side || this.picker) {
      this.pointer.setVisible(false);
      return;
    }
    const wobble = Math.sin(time / 150) * 3;
    this.pointer.setVisible(true)
      .setPosition(side > 0 ? this.scale.width - 14 + wobble : 14 - wobble, this.scale.height * 0.62)
      .setScale(side > 0 ? 1 : -1, 1);
  }

  // Ores fly from a spot in the world (the garden, a gift box) into the bank.
  flyList(worldX, worldY, ores, finalBank) {
    const cam = this.camp.cameras.main;
    const sx = (worldX - cam.worldView.x) * cam.zoom;
    const sy = (worldY - cam.worldView.y) * cam.zoom;
    ores.forEach((ore, i) => {
      this.time.delayedCall(i * 90, () => {
        const target = this.bankIcons[ore].icon;
        const img = this.add.image(sx + (Math.random() - 0.5) * 16, sy, `ore-${ore}`).setScale(1.3);
        this.tweens.add({
          targets: img, x: target.x + 5, y: target.y + 5, scale: 1, duration: 500, ease: 'Cubic.easeIn',
          onComplete: () => {
            img.destroy();
            this.bump(ore);
            this.camp.events.emit('deposit', ore, i);
          },
        });
      });
    });
    this.time.delayedCall(ores.length * 90 + 600, () => this.syncBank(finalBank));
  }

  // ---------- picker ----------

  openPicker(p) {
    this.closePicker();
    this.picker = { ...p, index: Math.max(0, p.options.findIndex((o) => o.affordable)) };
    this.renderPicker(true);
    this.camp.events.emit('pickerOpen');
  }

  closePicker() {
    if (this.picker) this.camp.events.emit('pickerClose');
    if (this.pickerUi) this.pickerUi.destroy();
    this.pickerUi = null;
    this.picker = null;
  }

  pickerMove(d) {
    if (!this.picker) return;
    const n = this.picker.options.length;
    this.picker.index = (this.picker.index + d + n) % n;
    this.renderPicker(false);
    this.camp.events.emit('pickerMove');
  }

  pickerNope() {
    if (!this.pickerUi) return;
    this.tweens.add({ targets: this.pickerUi, x: { from: -4, to: 0 }, duration: 60, yoyo: true, repeat: 2 });
  }

  renderPicker(pop) {
    if (this.pickerUi) this.pickerUi.destroy();
    const pk = this.picker;
    const opt = pk.options[pk.index];
    const w = 170;
    const h = 128;
    const x = Math.round((this.scale.width - w) / 2);
    const y = 48;
    const c = this.add.container(0, 0);
    this.pickerUi = c;

    // green glow when affordable
    if (opt.affordable) {
      const glow = this.add.graphics();
      glow.fillStyle(GREEN, 0.5).fillRoundedRect(x - 3, y - 3, w + 6, h + 6, 7);
      c.add(glow);
      this.tweens.add({ targets: glow, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
    }
    c.add(panel(this, x, y, w, h));

    const midX = x + w / 2;
    if (pk.kind === 'blueprint') {
      const img = this.add.image(midX, y + 8, `bld-${opt.id}`).setOrigin(0.5, 0).setScale(0.8);
      if (!opt.affordable) img.setTint(0xb0a090).setAlpha(0.7);
      c.add(img);
    } else {
      const icon = this.add.image(midX, y + 36, UPGRADE_ICON[opt.id]).setScale(4);
      if (!opt.affordable && opt.cost) icon.setAlpha(0.6);
      c.add(icon);
      // level pips: filled for current, glowing for the next
      const levels = UPGRADES[opt.id].length + 1;
      for (let l = 0; l < levels; l++) {
        const filled = l <= opt.level;
        const next = l === opt.level + 1;
        const pip = this.add.rectangle(midX - (levels * 10) / 2 + l * 10 + 1, y + 66, 8, 8, filled ? 0x6bbf59 : next ? 0xf0d070 : 0xd8c49a).setOrigin(0);
        c.add(pip);
      }
    }

    // cost row (or a star when maxed)
    const rowY = y + h - 30;
    if (!opt.cost) {
      c.add(this.add.image(midX, rowY + 6, 'star').setScale(2));
    } else {
      const bank = getState(this.registry).bank;
      const entries = Object.entries(opt.cost);
      const each = 40;
      const startX = midX - (entries.length * each) / 2;
      entries.forEach(([ore, n], i) => {
        const ox = startX + i * each;
        c.add(this.add.image(ox + 4, rowY, `ore-${ore}`).setOrigin(0).setScale(1.4));
        const enough = (bank[ore] ?? 0) >= n;
        c.add(this.add.bitmapText(ox + 20, rowY + 2, 'pixel', String(n)).setScale(2).setTint(enough ? INK : RED));
      });
    }

    // arrows and the A button
    if (pk.options.length > 1) {
      c.add(this.add.image(x + 8, y + h / 2 - 10, 'arrow-l').setScale(2));
      c.add(this.add.image(x + w - 8, y + h / 2 - 10, 'arrow-r').setScale(2));
    }
    const a = this.add.image(x + w - 14, y + h - 12, 'btn-a').setScale(1.4).setAlpha(opt.affordable ? 1 : 0.35);
    c.add(a);
    // page dots
    pk.options.forEach((_, i) => {
      c.add(this.add.rectangle(midX - pk.options.length * 4 + i * 8 + 2, y + h - 8, 4, 4, i === pk.index ? INK : 0xd8c49a).setOrigin(0));
    });

    if (pop) {
      c.setScale(0.8).setAlpha(0);
      c.x = (this.scale.width / 2) * 0.2;
      c.y = (y + h / 2) * 0.2;
      this.tweens.add({ targets: c, scale: 1, alpha: 1, x: 0, y: 0, duration: 180, ease: 'Back.easeOut' });
    }
  }
}
