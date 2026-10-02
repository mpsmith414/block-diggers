import { describe, it, expect } from 'vitest';
import { layerLook, rowColor, layerOfRow, generateRainbow, PATTERNS, GEM_SHAPES, GEM_SIZES } from '../../src/world/rainbow.js';
import { gemInfo } from '../../src/game/rainbowGems.js';
import { B } from '../../src/world/blocks.js';
import { mineTime } from '../../src/world/grid.js';
import { RAINBOW, MINE_W, SHAFT_X } from '../../src/tuning.js';

const SEED = RAINBOW.seed;
const channels = (c) => [(c >> 16) & 255, (c >> 8) & 255, c & 255];

describe('Rainbow Planet: every layer has its own look', () => {
  it('is always the same for the same layer, and different from the next', () => {
    expect(layerLook(SEED, 12)).toEqual(layerLook(SEED, 12));
    expect(layerLook(SEED, 12)).not.toEqual(layerLook(SEED, 13));
  });

  it('over many layers, every pattern, gem shape and gem size turns up', () => {
    const looks = Array.from({ length: 300 }, (_, i) => layerLook(SEED, i + 1));
    for (const p of PATTERNS) expect(looks.some((l) => l.pattern === p)).toBe(true);
    for (const s of GEM_SHAPES) expect(looks.some((l) => l.gem.shape === s)).toBe(true);
    for (const s of GEM_SIZES) expect(looks.some((l) => l.gem.size === s)).toBe(true);
    const massive = looks.filter((l) => l.gem.size === 'massive').length / looks.length;
    expect(massive).toBeGreaterThan(0.08);
    expect(massive).toBeLessThan(0.25);
  });

  it('its colours are bright or pastel, never muddy or near-black', () => {
    for (let n = 1; n <= 200; n++) {
      const look = layerLook(SEED, n);
      for (const c of [...look.colors, look.gem.color]) {
        const avg = channels(c).reduce((a, b) => a + b, 0) / 3;
        expect(avg).toBeGreaterThan(70);
      }
      expect(look.colors.length === 2 || look.colors.length === 3).toBe(true);
    }
  });

  it('the rock colour shifts down the layer, from the first colour to the last', () => {
    const look = layerLook(SEED, 3);
    expect(rowColor(look, 0)).toBe(look.colors[0]);
    expect(rowColor(look, RAINBOW.layerRows - 1)).toBe(look.colors[look.colors.length - 1]);
  });

  it('layers are 30 rows, counted from 1', () => {
    expect(layerOfRow(0)).toBe(1);
    expect(layerOfRow(29)).toBe(1);
    expect(layerOfRow(30)).toBe(2);
    expect(layerOfRow(400)).toBe(14);
  });
});

describe('Rainbow Planet: a trip builds a stretch of layers below your deepest point', () => {
  const first = generateRainbow(SEED, 0);

  it('is always the same for the same deepest point', () => {
    const again = generateRainbow(SEED, 0);
    expect(again.gems).toEqual(first.gems);
    expect(again.chests).toEqual(first.chests);
  });

  it('the first trip starts near the top, in a little open cave', () => {
    expect(first.top).toBe(0);
    expect(first.spawn).toEqual({ x: SHAFT_X, y: 2 });
    for (let y = 0; y <= 2; y++) for (let x = SHAFT_X - 3; x <= SHAFT_X + 3; x++) expect(first.grid.get(x, y)).toBe(B.AIR);
    expect(first.grid.get(SHAFT_X, 3)).not.toBe(B.AIR);
  });

  it('a later trip starts at your deepest point, in the right layer', () => {
    const w = generateRainbow(SEED, 400);
    expect(w.top).toBe(396);
    expect(w.spawn).toEqual({ x: SHAFT_X, y: 4 });
    expect(w.layers[0].n).toBe(14);
    expect(w.layers.length).toBe(RAINBOW.stretch);
    expect(w.grid.get(SHAFT_X, 4)).toBe(B.AIR);
  });

  it('ends in a glowing floor you cannot dig, with walls at both sides', () => {
    const { grid, floorRow } = first;
    expect(floorRow).toBe(grid.h - 1);
    for (let x = 0; x < MINE_W; x++) expect(grid.get(x, floorRow)).toBe(B.RAINBOW_FLOOR);
    for (let y = 0; y < grid.h; y++) {
      expect(grid.get(0, y)).toBe(B.RAINBOW_FLOOR);
      expect(grid.get(MINE_W - 1, y)).toBe(B.RAINBOW_FLOOR);
    }
    expect(mineTime(B.RAINBOW_FLOOR, 20)).toBe(Infinity);
  });

  it('gems fit inside the mine, never overlap, and keep out of the starting cave', () => {
    const seen = new Set();
    for (const g of first.gems) {
      const k = gemInfo(g.size).cells;
      expect(g.x).toBeGreaterThanOrEqual(1);
      expect(g.x + k - 1).toBeLessThanOrEqual(MINE_W - 2);
      expect(g.y + k - 1).toBeLessThan(first.floorRow);
      for (let y = g.y; y < g.y + k; y++) {
        for (let x = g.x; x < g.x + k; x++) {
          const key = `${x},${y}`;
          expect(seen.has(key)).toBe(false);
          seen.add(key);
          expect(first.grid.get(x, y)).toBe(k === 1 ? B.RAINBOW_GEM : B.RAINBOW_GEM_PART);
          expect(y <= 2 && Math.abs(x - SHAFT_X) <= 3).toBe(false);
        }
      }
    }
  });

  it('each layer has its own size of gem, as many as that size allows', () => {
    const w = generateRainbow(SEED, 0);
    for (const layer of w.layers) {
      const gems = w.gems.filter((g) => g.n === layer.n);
      expect(gems.every((g) => g.size === layer.look.gem.size)).toBe(true);
      const [lo, hi] = gemInfo(layer.look.gem.size).count;
      // (the top layer has the starting cave in it, so it may fit a few fewer)
      expect(gems.length).toBeLessThanOrEqual(hi);
      expect(gems.length).toBeGreaterThanOrEqual(layer.n === 1 ? Math.min(1, lo) : lo);
    }
  });

  it('a few treasure chests per layer, sitting on cave floors', () => {
    for (const layer of first.layers) {
      const chests = first.chests.filter((c) => c.n === layer.n);
      expect(chests.length).toBeGreaterThanOrEqual(3);
      expect(chests.length).toBeLessThanOrEqual(5);
      for (const c of chests) {
        expect(first.grid.get(c.x, c.y)).toBe(B.AIR);
        expect(first.grid.get(c.x, c.y + 1)).not.toBe(B.AIR);
        expect(c.sparkles).toBeGreaterThanOrEqual(10);
        expect(c.sparkles).toBeLessThanOrEqual(25);
      }
    }
  });

  it('every rainbow block digs at the same speed with any drill', () => {
    for (const id of [B.RAINBOW_ROCK, B.RAINBOW_GEM, B.RAINBOW_GEM_PART, B.RAINBOW_SHINY]) {
      expect(mineTime(id, 0)).toBe(RAINBOW.digTime);
      expect(mineTime(id, 20)).toBe(RAINBOW.digTime);
    }
  });
});
