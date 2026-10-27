import { describe, it, expect } from 'vitest';
import { WONDER, isWonder, wonderById, wonderOf, markVisited, winPrize, hasPrize, stickerIds } from '../../src/game/wonder/planets.js';
import { PLANETS } from '../../src/game/planets.js';
import { stickerById } from '../../src/game/stickers.js';
import { defaultState } from '../../src/save/save.js';

describe('the Wonder Galaxy', () => {
  it('eight planets, none of them a journey planet', () => {
    expect(WONDER.map((w) => w.id)).toEqual(['spooky', 'robot', 'ocean', 'upside', 'jelly', 'race', 'dragon', 'tiny']);
    for (const w of WONDER) {
      expect(PLANETS.find((p) => p.id === w.id)).toBeUndefined();
      expect(isWonder(w.id)).toBe(true);
      expect(wonderById(w.id)).toBe(w);
      expect(['count', 'height', 'race']).toContain(w.goal.kind);
      expect(w.goal.need).toBeGreaterThan(0);
    }
    expect(isWonder('earth')).toBe(false);
    expect(new Set(WONDER.map((w) => w.prize)).size).toBe(8);
  });

  it('every planet has its three stickers', () => {
    for (const w of WONDER) {
      const ids = stickerIds(w.id);
      for (const id of Object.values(ids)) expect(stickerById(id), id).toBeTruthy();
    }
  });

  it('landing marks a planet visited, once', () => {
    const s0 = defaultState();
    const a = markVisited(s0, 'jelly');
    expect(a.first).toBe(true);
    expect(wonderOf(a.state).visited).toEqual(['jelly']);
    const b = markVisited(a.state, 'jelly');
    expect(b.first).toBe(false);
    expect(b.state).toBe(a.state);
    expect(markVisited(s0, 'mars').first).toBe(false);
  });

  it('winning a prize is kept, and only counts as new the first time', () => {
    const a = winPrize(defaultState(), 'race');
    expect(a.first).toBe(true);
    expect(hasPrize(a.state, 'race')).toBe(true);
    expect(hasPrize(a.state, 'spooky')).toBe(false);
    expect(winPrize(a.state, 'race').first).toBe(false);
  });

  it('copes with saves that have no Wonder record', () => {
    expect(wonderOf({})).toEqual({ visited: [], prizes: [] });
    expect(markVisited({}, 'tiny').state.wonder).toEqual({ visited: ['tiny'], prizes: [] });
  });
});

describe('the star map page', () => {
  it('every Wonder planet is open from anywhere, the one you are on is here, prizes lit once won', async () => {
    const { wonderStops } = await import('../../src/game/wonder/planets.js');
    const s = winPrize(defaultState(), 'ocean').state;
    const stops = wonderStops(s, 'race');
    expect(stops.map((x) => x.status)).toEqual(['open', 'open', 'open', 'open', 'open', 'here', 'open', 'open']);
    expect(stops.find((x) => x.id === 'ocean').hasPrize).toBe(true);
    expect(stops.find((x) => x.id === 'spooky').hasPrize).toBe(false);
    expect(wonderStops(defaultState(), 'earth').every((x) => x.status === 'open')).toBe(true);
  });
});
