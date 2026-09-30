import Phaser from 'phaser';
import { STICKER_PAGES, pageProgress, CHAPTERS, BOOK_ORDER, chapterOfPage, chapterProgress, bookmarkPage } from '../game/stickers.js';
import { createEdge } from '../input/intents.js';
import { getState } from '../save/store.js';
import { attachAudio } from '../audio/wire.js';

// The sticker book: an open book over the game. One big tab per planet (and
// one for the fun extras), each holding its pages; stickers you've found in
// colour on gold, the rest as silhouettes. It opens at your newest sticker,
// which sparkles. ←/→ turns the page, LB/RB or ↑/↓ jumps a whole planet, B or
// Start closes it.

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
    this.page = data.page ?? null;
  }

  create() {
    this.session = this.registry.get('input');
    this.edges = [0, 1].map(() => ({ b: createEdge(), start: createEdge(), left: createEdge(), right: createEdge(), a: createEdge(), prev: createEdge(), next: createEdge() }));
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

    const state = getState(this.registry);
    this.newest = state.lastSticker ?? null;
    if (this.page == null) this.page = bookmarkPage(state);
    this.tabs = CHAPTERS.map((ch, i) => this.makeTab(ch, i));
    this.content = this.add.container(0, 0);
    this.arrows = [this.add.image(22, 145, 'arrow-l').setScale(2), this.add.image(458, 145, 'arrow-r').setScale(2)];
    this.closeBtn = this.add.image(452, 26, 'btn-b').setScale(1.4);
    this.renderPage(0);

    const book = this.children.list.slice();
    book.forEach((o) => { if (o.y !== undefined) o.y += 280; });
    this.tweens.add({ targets: book, y: '-=280', duration: 380, ease: 'Back.easeOut' });
    this.events.emit('pickerOpen');
  }

  makeTab(chapter, i) {
    // one wide tab per chapter along the book's top edge
    this.tabStep = 396 / CHAPTERS.length;
    const x = 42 + i * this.tabStep;
    const c = this.add.container(x, 30);
    const bg = this.add.graphics();
    const icon = this.add.image(this.tabStep / 2 - 1, 10, chapter.icon, 0);
    icon.setScale(Math.min(2, 17 / Math.max(icon.width, icon.height)));
    const bar = this.add.graphics();
    // a sparkle on the chapter with your newest sticker
    const glint = this.add.image(this.tabStep - 10, 3, 'glint').setTint(0xffe066).setVisible(false);
    c.add([bg, icon, bar, glint]);
    return { c, bg, icon, bar, glint, i };
  }

  drawTabs() {
    const state = getState(this.registry);
    const chapter = chapterOfPage(this.page);
    const newestChapter = this.newest ? chapterOfPage(bookmarkPage(state)) : -1;
    for (const t of this.tabs) {
      const on = t.i === chapter;
      const { have, total } = chapterProgress(state, t.i);
      t.bg.clear();
      const w = this.tabStep - 3;
      t.bg.fillStyle(on ? PAGE : 0xd8c49a, 1).fillRoundedRect(0, on ? -5 : 0, w, on ? 28 : 23, 5);
      t.bg.lineStyle(1, LEATHER_DARK, 1).strokeRoundedRect(0, on ? -5 : 0, w, on ? 28 : 23, 5);
      t.c.y = on ? 27 : 31;
      // how full this planet's pages are (gold when every sticker is found)
      t.bar.clear();
      const bw = w - 12;
      t.bar.fillStyle(0xb8a070, 1).fillRect(6, 19, bw, 3);
      t.bar.fillStyle(have === total ? GOLD : 0x6bbf59, 1).fillRect(6, 19, Math.round((bw * have) / total), 3);
      t.icon.setAlpha(on ? 1 : have ? 0.8 : 0.45);
      t.glint.setVisible(t.i === newestChapter && !on);
    }
    this.tweens.killTweensOf(this.tabs.map((t) => t.glint));
    for (const t of this.tabs) if (t.glint.visible) this.tweens.add({ targets: t.glint, angle: 360, scale: { from: 0.8, to: 1.3 }, duration: 900, yoyo: true, repeat: -1 });
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
      if (found && st.id === this.newest) {
        // the newest sticker: a bigger wobble and a sparkle, so you find it straight away
        this.tweens.add({ targets: icon, scale: icon.scale * 1.2, angle: { from: -8, to: 8 }, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        const glint = this.add.image(x + 44, y + 4, 'glint').setTint(0xffe066).setScale(1.3);
        c.add(glint);
        this.tweens.add({ targets: glint, angle: 360, scale: 1.8, duration: 700, yoyo: true, repeat: -1 });
      } else if (found) {
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
    // which page of this planet you're on: a dot per page
    const pages = CHAPTERS[chapterOfPage(this.page)].pages;
    if (pages.length > 1) {
      pages.forEach((p, i) => {
        const dx = 139 - (pages.length * 12) / 2 + i * 12 + 6;
        c.add(this.add.circle(dx, 234, p === this.page ? 4 : 3, p === this.page ? INK : 0xd8c49a));
      });
    }

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
      // a whole planet at a time: LB/RB, or up/down on the stick
      const up = e.prev(!!intent.prev || intent.moveY < -0.5);
      const down = e.next(!!intent.next || intent.moveY > 0.5);
      if (l || r) {
        // page by page, through every chapter in order
        const n = BOOK_ORDER.length;
        const at = BOOK_ORDER.indexOf(this.page);
        this.page = BOOK_ORDER[(at + (r ? 1 : -1) + n) % n];
        this.renderPage(r ? 1 : -1);
        this.events.emit('pickerMove');
      } else if (up || down) {
        const n = CHAPTERS.length;
        const ch = (chapterOfPage(this.page) + (down ? 1 : -1) + n) % n;
        this.page = CHAPTERS[ch].pages[0];
        this.renderPage(down ? 1 : -1);
        this.events.emit('pickerMove');
      }
      if ((b || st) && this.time.now - this.openedAt > 300) this.close();
    }
  }
}
