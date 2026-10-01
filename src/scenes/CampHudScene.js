import Phaser from 'phaser';
import { ORES } from '../world/blocks.js';
import { UPGRADE_KINDS, UPGRADES } from '../game/economy.js';
import { getState } from '../save/store.js';
import { shownOres } from '../game/ores.js';
import { B } from '../world/blocks.js';
import { LAYER_COLORS } from '../tuning.js';
import { layersOf } from '../game/planets.js';
import { BADGE_LAYERS } from '../game/trip.js';

// the elevator at each camp, and each Sun Suit piece's icon
const VEHICLE = { earth: ['cart', 2, -40, 50], moon: ['ufo', 0.6, -44, 44], mars: ['rover-car', 1.5, -44, 48], saturn: ['ski-chair', 2.5, -44, 30], dino: ['ptero-taxi', 1.8, -44, 36], sun: ['sun-lift', 1.8, -44, 36] };
const SUIT_ICON = { helmet: 'suit-helmet-icon', boots: 'suit-boots', gloves: 'suit-gloves', jetpack: 'suit-jetpack', sunHeart: 'sunheart-gem' };

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
    this.pointer.add([this.add.image(0, -13, 'btn-a').setScale(1.5), this.add.image(0, 4, 'arrow-r').setScale(2)]);
  }

  // ---------- bank ----------

  buildBank() {
    const kinds = shownOres(getState(this.registry), this.camp.planet);
    // the Heart of the World sits at the end of the bank once you have one
    if ((getState(this.registry).bank.heart ?? 0) > 0) kinds.push('heart');
    this.bankKinds = kinds.length;
    // big ×2 numbers: one row, or two once there are lots of kinds of ore
    const rows = kinds.length > 5 ? 2 : 1;
    const cols = Math.ceil(kinds.length / rows);
    const SLOT = 44;
    const LEVEL = 34;
    const w = 14 + cols * SLOT + UPGRADE_KINDS.length * LEVEL;
    const h = rows === 2 ? 42 : 26;
    const x = Math.round((this.scale.width - w) / 2);
    const y = 4;
    if (this.bank) this.bank.destroy();
    this.bank = this.add.container(0, 0);
    this.bank.add(panel(this, x, y, w, h));
    this.bankIcons = {};
    kinds.forEach((ore, i) => {
      const ox = x + 8 + (i % cols) * SLOT;
      const oy = y + 7 + Math.floor(i / cols) * 16;
      const icon = this.add.image(ox, oy, `ore-${ore}`).setOrigin(0).setScale(1.2);
      const num = this.add.bitmapText(ox + 15, oy + 1, 'pixel', '0').setScale(2).setTint(INK);
      this.bank.add([icon, num]);
      this.bankIcons[ore] = { icon, num, shown: 0 };
    });
    // upgrade levels: each tool with its level as a number (no long rows of pips)
    this.levelNums = {};
    const lx = x + 10 + cols * SLOT;
    this.bank.add(this.add.rectangle(lx - 5, y + 6, 2, h - 12, EDGE, 0.35).setOrigin(0));
    UPGRADE_KINDS.forEach((kind, i) => {
      const ox = lx + i * LEVEL;
      const cy = y + h / 2;
      this.bank.add(this.add.image(ox + 6, cy, UPGRADE_ICON[kind]));
      const num = this.add.bitmapText(ox + 14, cy - 5, 'pixel', '1').setScale(2).setTint(INK);
      this.bank.add(num);
      this.levelNums[kind] = num;
    });
    this.syncBank(getState(this.registry).bank);
  }

  syncBank(bank, only = null) {
    // a newly found ore makes the bank panel grow
    const heart = (getState(this.registry).bank.heart ?? 0) > 0 ? 1 : 0;
    if (shownOres(getState(this.registry), this.camp.planet).length + heart !== this.bankKinds) this.buildBank();
    for (const ore of [...ORES, 'heart']) {
      if (only && ore !== only) continue;
      const b = this.bankIcons[ore];
      if (!b) continue;
      b.shown = bank[ore];
      b.num.setText(String(bank[ore]));
      b.icon.setAlpha(bank[ore] > 0 ? 1 : 0.45);
      b.num.setAlpha(bank[ore] > 0 ? 1 : 0.45);
    }
    const state = getState(this.registry);
    for (const kind of UPGRADE_KINDS) {
      const text = String(state.upgrades[kind] + 1);
      const num = this.levelNums[kind];
      if (num.text !== text) {
        num.setText(text);
        this.tweens.add({ targets: num, scale: { from: 3, to: 2 }, duration: 250, ease: 'Back.easeOut' });
      }
    }
  }

  bump(ore) {
    const b = this.bankIcons[ore];
    if (!b) return;
    b.shown++;
    b.num.setText(String(b.shown));
    b.icon.setAlpha(1);
    b.num.setAlpha(1);
    this.tweens.add({ targets: b.icon, scale: { from: 1.9, to: 1.2 }, duration: 180, ease: 'Back.easeOut' });
  }

  // Ores fly from each player into the bank, one by one, counting up.
  flyOres(packs, avatars, finalBank) {
    const cam = this.camp.cameras.main;
    this.counting = true;
    const start = {};
    for (const ore of ORES) start[ore] = finalBank[ore] - packs.reduce((n, p) => n + (p[ore] ?? 0), 0);
    for (const ore of ORES) { if (this.bankIcons[ore]) { this.bankIcons[ore].shown = start[ore]; this.bankIcons[ore].num.setText(String(start[ore])); } }
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
            const target = (this.bankIcons[ore] ?? Object.values(this.bankIcons)[0])?.icon;
            if (!target) return;
            const img = this.add.image(sx, sy, `ore-${ore}`).setScale(1.3);
            this.tweens.add({
              targets: img,
              x: target.x + 6,
              y: target.y + 6,
              scale: 1.2,
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
    return delay + 500;
  }

  // side: 1 = something good off to the right, -1 = left, 0 = hide
  pointTo(side, time) {
    if (!side || this.picker) {
      this.pointer.setVisible(false);
      return;
    }
    const wobble = Math.sin(time / 150) * 3;
    this.pointer.list[0].setFlipX(side < 0); // (the A never reads backwards)
    this.pointer.setVisible(true)
      // (high enough to stay clear of a phone's A button in the corner)
      .setPosition(side > 0 ? this.scale.width - 14 + wobble : 14 - wobble, this.scale.height * 0.5)
      .setScale(side > 0 ? 1 : -1, 1);
  }

  // Ores fly from a spot in the world (the garden, a gift box) into the bank.
  flyList(worldX, worldY, ores, finalBank) {
    const cam = this.camp.cameras.main;
    const sx = (worldX - cam.worldView.x) * cam.zoom;
    const sy = (worldY - cam.worldView.y) * cam.zoom;
    ores.forEach((ore, i) => {
      this.time.delayedCall(i * 90, () => {
        const target = (this.bankIcons[ore] ?? this.bankIcons.coal).icon;
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

  // Ores fly out of the bank to someone in the world (a visitor you're helping).
  flyToWorld(ores, worldX, worldY) {
    const cam = this.camp.cameras.main;
    const tx = (worldX - cam.worldView.x) * cam.zoom;
    const ty = (worldY - cam.worldView.y) * cam.zoom;
    ores.forEach((ore, i) => {
      this.time.delayedCall(i * 60, () => {
        const from = (this.bankIcons[ore] ?? this.bankIcons.coal).icon;
        const img = this.add.image(from.x + 5, from.y + 5, `ore-${ore}`);
        this.tweens.add({ targets: img, x: tx, y: ty, scale: 0.6, duration: 450, ease: 'Cubic.easeIn', onComplete: () => img.destroy() });
      });
    });
  }

  // ---------- picker ----------

  openPicker(p) {
    this.closePicker();
    this.picker = { ...p, index: p.index ?? Math.max(0, p.options.findIndex((o) => o.affordable)) };
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
    const w = 190; // (room for "have/need" prices beside the A)
    const h = 128;
    const x = Math.round((this.scale.width - w) / 2);
    const y = 54; // (below the bank, even when it has two rows)
    const c = this.add.container(0, 0);
    this.pickerUi = c;

    // a thick, pulsing green glow when you can have it
    if (opt.affordable) {
      const glow = this.add.graphics();
      glow.fillStyle(GREEN, 1).fillRoundedRect(x - 5, y - 5, w + 10, h + 10, 9);
      c.add(glow);
      this.tweens.add({ targets: glow, alpha: 0.5, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    c.add(panel(this, x, y, w, h));

    const midX = x + w / 2;
    if (pk.kind === 'decor') {
      const key = opt.id.startsWith('trophy') ? opt.id : `deco-${opt.id}`;
      const img = this.add.image(midX, y + 62, key).setOrigin(0.5, 1);
      img.setScale(Math.min(3, 52 / Math.max(img.width, img.height)));
      if (!opt.affordable) img.setAlpha(0.6);
      c.add(img);
      if (opt.stock) {
        // already yours: a bag with how many
        c.add(this.add.image(midX - 12, y + h - 24, 'icon-bag').setScale(2));
        c.add(this.add.bitmapText(midX + 2, y + h - 30, 'pixel', `x${opt.stock}`).setScale(2).setTint(INK));
      }
    } else if (pk.kind === 'elevator') {
      // the layer's badge (or its rock), and a padlock if you haven't been there yet
      const deep = BADGE_LAYERS.indexOf(opt.id);
      const rock = { dirt: B.DIRT, stone: B.STONE, deep: B.DEEP, crystal: B.CRYSTAL }[opt.id];
      const img = deep >= 0 ? this.add.image(midX, y + 40, 'badge', deep).setScale(3.5) : this.add.image(midX, y + 40, 'tiles', rock).setScale(3.5);
      // the minecart at home, the friendly alien's UFO on the Moon, the rover on Mars
      const [key, scale, dx, dy] = VEHICLE[pk.planet ?? 'earth'] ?? VEHICLE.earth;
      c.add(this.add.image(midX + dx, y + dy, key, 0).setScale(scale));
      c.add(img);
      if (!opt.affordable) {
        img.setTint(0x6a5a4a).setAlpha(0.5);
        c.add(this.add.image(midX, y + 40, 'icon-lock').setScale(3));
      }
      // where it is: the layers top to bottom, this one marked
      const names = Object.keys(layersOf(pk.planet ?? 'earth'));
      names.forEach((name, i) => {
        const bx = midX - names.length * 7 + i * 14;
        c.add(this.add.rectangle(bx, y + h - 34, 12, 8, LAYER_COLORS[name]).setOrigin(0).setAlpha(name === opt.id ? 1 : 0.45));
        if (name === opt.id) c.add(this.add.image(bx + 6, y + h - 40, 'arrow-r').setAngle(90));
      });
    } else if (pk.kind === 'blueprint') {
      const img = this.add.image(midX, y + 8, `bld-${opt.id}`).setOrigin(0.5, 0).setScale(0.8);
      if (!opt.affordable) img.setTint(0xb0a090).setAlpha(0.7);
      c.add(img);
      // it also needs a Sun Suit piece (or the Sun's Heart): shown next to it, lit once you have it
      if (opt.needs) {
        const st = getState(this.registry);
        const have = opt.needs === 'sunHeart' ? !!st.sunHeart : (st.suit ?? []).includes(opt.needs);
        const bx = x + w - 26;
        c.add(this.add.circle(bx, y + 24, 13, have ? 0x9ae67a : 0xd8c49a));
        const piece = this.add.image(bx, y + 24, SUIT_ICON[opt.needs] ?? 'suit-helmet-icon').setScale(1.8);
        c.add(piece);
        if (!have) c.add(this.add.image(bx + 8, y + 32, 'icon-lock').setScale(0.9));
      }
    } else {
      const icon = this.add.image(midX, y + 32, UPGRADE_ICON[opt.id]).setScale(3.5);
      if (!opt.affordable && opt.cost) icon.setAlpha(0.6);
      c.add(icon);
      // level pips: filled for current, glowing for the next (in rows of 7, so
      // even the pick's long list fits inside the panel)
      const levels = UPGRADES[opt.id].length + 1;
      const perRow = 7;
      for (let l = 0; l < levels; l++) {
        const filled = l <= opt.level;
        const next = l === opt.level + 1;
        const inRow = Math.min(perRow, levels - Math.floor(l / perRow) * perRow);
        const px = midX - (inRow * 10) / 2 + (l % perRow) * 10 + 1;
        const py = y + 58 + Math.floor(l / perRow) * 9;
        c.add(this.add.rectangle(px, py, 8, 7, filled ? 0x6bbf59 : next ? 0xf0d070 : 0xd8c49a).setOrigin(0));
      }
    }

    // cost row (or a star when maxed)
    const rowY = y + h - 30;
    if ((pk.kind === 'decor' && opt.stock) || pk.kind === 'elevator') {
      // (shown above)
    } else if (!opt.cost) {
      c.add(this.add.image(midX, rowY + 6, 'star').setScale(2));
    } else {
      // each ore it costs; when you're short it shows what you have out of what
      // you need ("3/10", like the backpack count), in red
      const bank = getState(this.registry).bank;
      const entries = Object.entries(opt.cost).map(([ore, n]) => {
        const have = bank[ore] ?? 0;
        const text = have >= n ? String(n) : `${have}/${n}`;
        return { ore, text, enough: have >= n, w: 20 + text.length * 8 };
      });
      const gap = 10;
      let ox = midX - (entries.reduce((sum, e) => sum + e.w, 0) + gap * (entries.length - 1)) / 2;
      for (const e of entries) {
        c.add(this.add.image(ox, rowY, `ore-${e.ore}`).setOrigin(0).setScale(1.4));
        c.add(this.add.bitmapText(ox + 16, rowY + 2, 'pixel', e.text).setScale(2).setTint(e.enough ? INK : RED));
        ox += e.w + gap;
      }
    }

    // arrows and the A button
    if (pk.options.length > 1) {
      c.add(this.add.image(x + 8, y + h / 2 - 10, 'arrow-l').setScale(2));
      c.add(this.add.image(x + w - 8, y + h / 2 - 10, 'arrow-r').setScale(2));
    }
    const a = this.add.image(x + w - 16, y + h - 15, 'btn-a').setScale(opt.affordable ? 2 : 1.6).setAlpha(opt.affordable ? 1 : 0.35);
    c.add(a);
    if (opt.affordable) this.tweens.add({ targets: a, scale: 2.3, duration: 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
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
