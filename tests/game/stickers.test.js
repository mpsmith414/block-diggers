import { describe, it, expect } from 'vitest';
import { STICKER_PAGES, ALL_STICKERS, award, pageProgress, stickerById } from '../../src/game/stickers.js';
import { defaultState } from '../../src/save/save.js';

describe('sticker catalog', () => {
  it('has 40 unique stickers over 6 pages, each with an icon', () => {
    expect(STICKER_PAGES).toHaveLength(6);
    expect(ALL_STICKERS).toHaveLength(40);
    expect(new Set(ALL_STICKERS.map((s) => s.id)).size).toBe(40);
    for (const s of ALL_STICKERS) expect(typeof s.icon).toBe('string');
    expect(stickerById('ore-coal').icon).toBe('ore-coal');
  });
});

describe('award', () => {
  it('new stickers are new once', () => {
    let r = award(defaultState(), 'ore-coal');
    expect(r.isNew).toBe(true);
    expect(r.state.stickers['ore-coal']).toBe(true);
    r = award(r.state, 'ore-coal');
    expect(r.isNew).toBe(false);
  });
  it('ignores unknown ids', () => {
    const s = defaultState();
    const r = award(s, 'nope');
    expect(r.isNew).toBe(false);
    expect(r.state).toBe(s);
  });
  it('completing a page gives its trophy once, into decoration stock', () => {
    let s = defaultState();
    let trophy = null;
    for (const st of STICKER_PAGES[0].stickers) ({ state: s, trophy } = award(s, st.id));
    expect(trophy).toBe(0);
    expect(s.trophiesAwarded).toEqual([0]);
    expect(s.decor.stock['trophy-0']).toBe(1);
    expect(pageProgress(s, 0)).toEqual({ have: 5, total: 5 });
    // awarding again doesn't give another
    ({ state: s, trophy } = award(s, STICKER_PAGES[0].stickers[0].id));
    expect(trophy).toBeNull();
    expect(s.decor.stock['trophy-0']).toBe(1);
  });
  it('page progress counts what you have', () => {
    const { state } = award(defaultState(), 'cave-grass');
    expect(pageProgress(state, 2)).toEqual({ have: 1, total: 11 });
  });
});
