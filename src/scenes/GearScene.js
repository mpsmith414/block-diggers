import Phaser from 'phaser';
import { createEdge } from '../input/intents.js';
import { getState, setState } from '../save/store.js';
import { attachAudio } from '../audio/wire.js';
import { charFor } from '../game/cast.js';
import { CHARACTER_COLORS } from '../art/characters.js';
import { SLOTS, ownedIn, wornBy, wearGear, gearById } from '../game/gear.js';
import { gearLook } from '../art/gear.js';

// The Gear page (from the pause menu): each player swaps what they're
// wearing, on their own panel with their own controller. Up/down picks a
// body part, left/right flips through what you own for it (and "nothing").
// B or Start goes back to the game, which dresses everyone again.

const PAPER = 0xf4e4c1;
const EDGE = 0x8a5a34;
const INK = 0x4a3222;
const GREEN = 0x4cc24a;

export class GearScene extends Phaser.Scene {
  constructor() {
    super('Gear');
  }

  init(data) {
    this.target = data.target;
  }

  create() {
    this.session = this.registry.get('input');
    this.edges = [0, 1].map(() => ({ b: createEdge(), start: createEdge(), up: createEdge(), down: createEdge(), left: createEdge(), right: createEdge() }));
    // prime: the press that opened the page shouldn't also act in it
    for (const s of this.session.slots) {
      if (!s.intent) continue;
      const e = this.edges[s.slot];
      e.b(!!s.intent.home); e.start(!!s.intent.pause);
      e.up(s.intent.moveY < -0.5); e.down(s.intent.moveY > 0.5); e.left(s.intent.moveX < -0.5); e.right(s.intent.moveX > 0.5);
    }
    this.openedAt = this.time.now;
    attachAudio(this);
    this.add.rectangle(0, 0, 480, 270, 0x120a18, 0.65).setOrigin(0);
    const slots = this.session.slots.map((s) => s.slot).filter((slot) => slot === 0 || slot === 1);
    const players = slots.length ? slots : [0];
    const W = 222;
    this.panels = players.map((slot, i) => ({
      slot,
      x: players.length === 1 ? 240 - W / 2 : 12 + i * (W + 12),
      y: 22,
      w: W,
      h: 230,
      part: 0,
      ui: null,
    }));
    for (const p of this.panels) this.draw(p, true);
  }

  // the choices for one body part: "nothing", then everything you own for it
  choices(part) {
    return [null, ...ownedIn(getState(this.registry), part).map((g) => g.id)];
  }

  draw(p, pop = false) {
    if (p.ui) p.ui.destroy();
    const c = this.add.container(0, 0);
    p.ui = c;
    const { x, y, w, h } = p;
    const state = getState(this.registry);
    const worn = wornBy(state, p.slot);
    const char = charFor(this.registry, p.slot);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRoundedRect(x + 3, y + 4, w, h, 8);
    g.fillStyle(EDGE, 1).fillRoundedRect(x, y, w, h, 8);
    g.fillStyle(PAPER, 1).fillRoundedRect(x + 3, y + 3, w - 6, h - 6, 7);
    // whose panel: a stripe in their colour
    g.fillStyle(CHARACTER_COLORS[char] ?? 0xffffff, 1).fillRoundedRect(x + 3, y + 3, w - 6, 8, { tl: 7, tr: 7, bl: 0, br: 0 });
    c.add(g);

    // the four body parts down the left, the chosen one boxed in green
    SLOTS.forEach((part, i) => {
      const sy = y + 24 + i * 44;
      const on = i === p.part;
      const box = this.add.graphics();
      box.fillStyle(on ? 0x9ae67a : 0xe8d4a8, 1).fillRoundedRect(x + 10, sy, 40, 38, 6);
      if (on) box.lineStyle(2, GREEN, 1).strokeRoundedRect(x + 10, sy, 40, 38, 6);
      c.add(box);
      c.add(this.add.image(x + 30, sy + 19, `slot-${part}`).setScale(on ? 2.4 : 2));
      // a little dot when something's on that part
      if (worn[part]) c.add(this.add.circle(x + 46, sy + 5, 3, GREEN));
    });

    // your character, big, wearing everything
    const cx = x + 132;
    const feet = y + 150;
    const S = 5;
    const looks = SLOTS.map((part) => worn[part] && gearLook(worn[part])).filter(Boolean);
    for (const look of looks.filter((l) => l.behind)) c.add(this.add.image(cx, feet, look.key, 0).setOrigin(0.5, 1).setScale(S));
    c.add(this.add.image(cx, feet, `char-${char}`, 0).setOrigin(0.5, 1).setScale(S));
    for (const look of looks.filter((l) => !l.behind)) c.add(this.add.image(cx, feet, look.key, look.framed ? 0 : undefined).setOrigin(0.5, 1).setScale(S));

    // flip through what you own for this part
    const part = SLOTS[p.part];
    const list = this.choices(part);
    const at = list.indexOf(worn[part]);
    if (list.length > 1) {
      c.add(this.add.image(cx - 58, feet - 40, 'arrow-l').setScale(2));
      c.add(this.add.image(cx + 58, feet - 40, 'arrow-r').setScale(2));
    }
    list.forEach((_, i) => c.add(this.add.rectangle(cx - list.length * 4 + i * 8 + 2, feet + 8, 4, 4, i === at ? INK : 0xd8c49a).setOrigin(0)));

    // what it does: its picture and a little line for a grown-up
    const item = worn[part] && gearById(worn[part]);
    if (item) {
      c.add(this.add.circle(x + 72, y + h - 34, 16, 0xffffff, 0.6));
      c.add(this.add.image(x + 72, y + h - 34, `power-${item.power ?? 'looks'}`).setScale(1.8));
      const words = item.caption.split(' ');
      const lines = [''];
      for (const word of words) {
        const line = lines[lines.length - 1];
        if (line && (line.length + 1 + word.length) * 4 > w - 108) lines.push(word);
        else lines[lines.length - 1] = line ? `${line} ${word}` : word;
      }
      lines.forEach((line, i) => c.add(this.add.bitmapText(x + 94, y + h - 44 + i * 7, 'pixel', line).setTint(INK)));
    } else {
      // nothing on: an empty hanger
      c.add(this.add.image(x + 72, y + h - 34, 'icon-hanger').setScale(2).setAlpha(0.5));
    }
    // B to go back
    c.add(this.add.image(x + w - 16, y + 22, 'btn-b').setScale(1.4).setAlpha(0.8));

    if (pop) {
      c.setAlpha(0);
      this.tweens.add({ targets: c, alpha: 1, duration: 160 });
    }
  }

  // flip player `p` to the next thing they own for the chosen part
  flip(p, d) {
    const part = SLOTS[p.part];
    const list = this.choices(part);
    if (list.length < 2) {
      this.events.emit('nope');
      return;
    }
    const state = getState(this.registry);
    const at = Math.max(0, list.indexOf(wornBy(state, p.slot)[part]));
    const id = list[(at + d + list.length) % list.length];
    const next = wearGear(state, p.slot, part, id);
    if (!next) return;
    setState(this.registry, next);
    this.events.emit('pickerMove');
    this.draw(p);
  }

  close() {
    this.events.emit('pickerClose');
    const target = this.scene.get(this.target);
    this.scene.resume(this.target);
    target?.events.emit('gearChanged');
    this.scene.stop();
  }

  update() {
    for (const { slot, intent } of this.session.slots) {
      if (!intent) continue;
      const e = this.edges[slot];
      const p = this.panels.find((q) => q.slot === slot) ?? this.panels[0];
      const b = e.b(!!intent.home);
      const start = e.start(!!intent.pause);
      const up = e.up(intent.moveY < -0.5);
      const down = e.down(intent.moveY > 0.5);
      const left = e.left(intent.moveX < -0.5);
      const right = e.right(intent.moveX > 0.5);
      if ((b || start) && this.time.now - this.openedAt > 250) return this.close();
      if (up || down) {
        p.part = (p.part + (down ? 1 : -1) + SLOTS.length) % SLOTS.length;
        this.events.emit('pickerMove');
        this.draw(p);
      }
      if (left || right) this.flip(p, right ? 1 : -1);
    }
  }
}
