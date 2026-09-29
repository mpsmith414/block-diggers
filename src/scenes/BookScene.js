import Phaser from 'phaser';
import { STICKER_PAGES, pageProgress } from '../game/stickers.js';
import { createEdge } from '../input/intents.js';
import { getState } from '../save/store.js';
import { attachAudio } from '../audio/wire.js';

// The sticker book: an open book over the game. Tabs for the six pages,
// stickers you've found in colour on gold, the rest as silhouettes.
// ←/→ turns the page, B or Start closes it.

const LEATHER = 0x7a3f2c;
const LEATHER_DARK = 0x5a2a1c;
const PAGE = 0xf8ecd0;
const PAGE_LINE = 0xe8d8b0;
const GOLD = 0xf5c629;
const INK = 0x4a3222;

export class BookScene extends Phaser.Scene {
  constructor() {
    super('Book');
  }

  init(data) {
    this.target = data.target;
    this.page = data.page ?? 0;
  }

  create() {
    this.session = this.registry.get('input');
    this.edges = [0, 1].map(() => ({ b: createEdge(), start: createEdge(), left: createEdge(), right: createEdge(), a: createEdge() }));
    for (const s of this.session.slots) {
      if (!s.intent) continue;
      const e = this.edges[s.slot];
      e.b(!!s.intent.home); e.start(!!s.intent.pause); e.a(!!s.intent.jump);
    }
    this.openedAt = this.time.now;
    attachAudio(this);
    this.add.rectangle(0, 0, 480, 270, 0x120a18, 0.55).setOrigin(0);

    // the book
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3).fillRoundedRect(34, 44, 420, 214, 10);
    g.fillStyle(LEATHER_DARK, 1).fillRoundedRect(28, 38, 424, 216, 10);
    g.fillStyle(LEATHER, 1).fillRoundedRect(30, 40, 420, 210, 9);
    g.fillStyle(PAGE, 1).fillRoundedRect(40, 46, 198, 198, 4);
    g.fillStyle(PAGE, 1).fillRoundedRect(242, 46, 198, 198, 4);
    g.fillStyle(PAGE_LINE, 1).fillRect(236, 46, 8, 198);
    g.fillStyle(LEATHER_DARK, 1).fillRect(239, 44, 2, 202);

    this.tabs = STICKER_PAGES.map((p, i) => this.makeTab(p, i));
    this.content = this.add.container(0, 0);
    this.arrows = [this.add.image(22, 145, 'arrow-l').setScale(2), this.add.image(458, 145, 'arrow-r').setScale(2)];
    this.closeBtn = this.add.image(452, 26, 'btn-b').setScale(1.4);
    this.renderPage(0);

    const book = this.children.list.slice();
    book.forEach((o) => { if (o.y !== undefined) o.y += 280; });
    this.tweens.add({ targets: book, y: '-=280', duration: 380, ease: 'Back.easeOut' });
    this.events.emit('pickerOpen');
  }

  makeTab(page, i) {
    // the tabs share the book's top edge (narrower as pages are added)
    this.tabStep = Math.min(36, 396 / STICKER_PAGES.length);
    const x = 42 + i * this.tabStep;
    const c = this.add.container(x, 30);
    const bg = this.add.graphics();
    const icon = this.add.image(this.tabStep / 2 - 1, 11, page.icon, 0);
    icon.setScale(Math.min(1, 16 / Math.max(icon.width, icon.height)));
    const bar = this.add.graphics();
    c.add([bg, icon, bar]);
    return { c, bg, icon, bar, i };
  }

  drawTabs() {
    const state = getState(this.registry);
    for (const t of this.tabs) {
      const on = t.i === this.page;
      const { have, total } = pageProgress(state, t.i);
      t.bg.clear();
      const w = this.tabStep - 2;
      t.bg.fillStyle(on ? PAGE : 0xd8c49a, 1).fillRoundedRect(0, on ? -4 : 0, w, on ? 26 : 22, 4);
      t.bg.lineStyle(1, LEATHER_DARK, 1).strokeRoundedRect(0, on ? -4 : 0, w, on ? 26 : 22, 4);
      t.c.y = on ? 28 : 31;
      t.bar.clear();
      const bw = this.tabStep - 10;
      t.bar.fillStyle(0xb8a070, 1).fillRect(4, 19, bw, 2);
      t.bar.fillStyle(have === total ? GOLD : 0x6bbf59, 1).fillRect(4, 19, Math.round((bw * have) / total), 2);
      t.icon.setAlpha(on ? 1 : 0.7);
    }
  }

  renderPage(dir) {
    this.drawTabs();
    const state = getState(this.registry);
    const page = STICKER_PAGES[this.page];
    const old = this.content;
    const c = this.add.container(0, 0);
    this.content = c;
    // six slots per side, three across, two down (the cave page needs 11)
    // short pages spread across both sides; long ones fill left then right
    const n = page.stickers.length;
    const leftCount = n <= 6 ? Math.ceil(n / 2) : 6;
    page.stickers.forEach((st, i) => {
      const side = i < leftCount ? 0 : 1;
      const k = side ? i - leftCount : i;
      const x = (side ? 262 : 60) + (k % 3) * 56;
      const y = (n <= 6 ? 96 : 62) + Math.floor(k / 3) * 70;
      const found = !!state.stickers[st.id];
      const slot = this.add.graphics();
      if (found) {
        slot.fillStyle(0x000000, 0.12).fillRoundedRect(x + 2, y + 3, 48, 48, 7);
        slot.fillStyle(GOLD, 1).fillRoundedRect(x, y, 48, 48, 7);
        slot.fillStyle(0xfffaf0, 1).fillRoundedRect(x + 3, y + 3, 42, 42, 5);
      } else {
        slot.lineStyle(2, 0xc8b890, 1).strokeRoundedRect(x, y, 48, 48, 7);
      }
      c.add(slot);
      const icon = this.add.image(x + 24, y + 24, st.icon, st.frame);
      icon.setScale(Math.min(2.5, 32 / Math.max(icon.width, icon.height)));
      if (!found) icon.setTintFill(0x6a5a4a).setAlpha(0.35);
      c.add(icon);
      if (found) {
        this.tweens.add({ targets: icon, angle: { from: -4, to: 4 }, duration: 900 + i * 60, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      } else {
        c.add(this.add.bitmapText(x + 20, y + 16, 'pixel', '?').setScale(3).setTint(0xb8a888));
      }
    });
    // progress and the trophy for a full page
    const { have, total } = pageProgress(state, this.page);
    const done = have === total;
    c.add(this.add.bitmapText(262, 216, 'pixel', `${have}/${total}`).setScale(2).setTint(INK));
    const trophy = this.add.image(410, 214, `trophy-${this.page}`).setScale(2);
    if (!done) trophy.setTintFill(0x6a5a4a).setAlpha(0.3);
    else this.tweens.add({ targets: trophy, scale: 2.3, duration: 500, yoyo: true, repeat: -1 });
    c.add(trophy);

    if (old) {
      if (dir) {
        c.x = dir * 40;
        c.alpha = 0;
        this.tweens.add({ targets: c, x: 0, alpha: 1, duration: 200, ease: 'Quad.easeOut' });
        this.tweens.add({ targets: old, x: -dir * 40, alpha: 0, duration: 150, onComplete: () => old.destroy() });
      } else {
        old.destroy();
      }
    }
  }

  close() {
    if (this.closing) return;
    this.closing = true;
    this.events.emit('pickerClose');
    this.tweens.add({
      targets: this.children.list,
      alpha: 0,
      duration: 180,
      onComplete: () => {
        if (this.target) this.scene.resume(this.target);
        this.scene.stop();
      },
    });
  }

  update() {
    if (this.closing) return;
    for (const { slot, intent } of this.session.slots) {
      if (!intent) continue;
      const e = this.edges[slot];
      const l = e.left(intent.moveX < -0.5);
      const r = e.right(intent.moveX > 0.5);
      const b = e.b(!!intent.home);
      const st = e.start(!!intent.pause);
      e.a(!!intent.jump);
      if (l || r) {
        const n = STICKER_PAGES.length;
        this.page = (this.page + (r ? 1 : -1) + n) % n;
        this.renderPage(r ? 1 : -1);
        this.events.emit('pickerMove');
      }
      if ((b || st) && this.time.now - this.openedAt > 300) this.close();
    }
  }
}
