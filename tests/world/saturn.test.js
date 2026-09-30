import { describe, it, expect } from 'vitest';
import { generateSaturn, saturnLayerAt, SATURN_HOST } from '../../src/world/saturn.js';
import { B, dropOf, isSolid } from '../../src/world/blocks.js';
import { SATURN_LAYERS, SATURN_H, SATURN_GEN, MINE_W } from '../../src/tuning.js';

const count = (grid, y0, y1, pred) => {
  let n = 0;
  for (let y = y0; y <= y1; y++) for (let x = 1; x < grid.w - 1; x++) if (pred(grid.get(x, y))) n++;
  return n;
};

describe('the Saturn generator', () => {
  const w = generateSaturn(42);
  const { grid } = w;

  it('is 252 rows of five layers, each with its own rock and ore', () => {
    expect(grid.h).toBe(SATURN_H);
    expect(w.planet).toBe('saturn');
    const ore = { rings: 'frost', icecream: 'icecream', aurora: 'pearl', comets: 'comet', saturncore: 'pearl' };
    for (const [layer, { top, bottom }] of Object.entries(SATURN_LAYERS)) {
      expect(saturnLayerAt(top + 3)).toBe(layer);
      const host = count(grid, top + 2, bottom - 2, (id) => id === SATURN_HOST[layer]);
      const solid = count(grid, top + 2, bottom - 2, (id) => isSolid(id));
      expect(host / solid).toBeGreaterThan(0.6);
      // (the core is small, and the ice rink takes a bite out of it)
      expect(count(grid, top, bottom, (id) => dropOf(id) === ore[layer])).toBeGreaterThan(layer === 'saturncore' ? 2 : 20);
    }
  });

  it('keeps the Saturn Heart at the bottom: 3x3, on a floor', () => {
    expect(w.heart.kind).toBe('saturn');
    for (let y = w.heart.y; y < w.heart.y + 3; y++) for (let x = w.heart.x; x < w.heart.x + 3; x++) expect(grid.get(x, y)).toBe(B.SATURN_HEART);
    expect(isSolid(grid.get(w.heart.x, w.heart.y + 3))).toBe(true);
  });

  it('puts snowballs in pairs on the ring ice', () => {
    expect(w.boulders.length).toBeGreaterThanOrEqual(4);
    expect(w.boulders.length % 2).toBe(0);
    for (const b of w.boulders) {
      expect(grid.get(b.x, b.y)).toBe(B.SNOWBALL);
      expect(b.y).toBeLessThanOrEqual(SATURN_LAYERS.rings.bottom);
    }
  });

  it('has snow globes in the aurora caverns and a frozen comet in the comet cave, with room', () => {
    expect(w.globes.length).toBe(SATURN_GEN.globes);
    for (const g of w.globes) {
      expect(grid.get(g.x + 1, g.y)).toBe(B.SNOW_GLOBE);
      expect(g.y).toBeGreaterThanOrEqual(SATURN_LAYERS.aurora.top);
      expect(g.y).toBeLessThanOrEqual(SATURN_LAYERS.aurora.bottom);
      for (const dx of [0, 1, 2]) expect(isSolid(grid.get(g.x + dx, g.y + 1))).toBe(true);
    }
    const c = w.comet;
    expect(grid.get(c.x + 1, c.y)).toBe(B.FROZEN_COMET);
    expect(c.y).toBeGreaterThanOrEqual(SATURN_LAYERS.comets.top);
    expect(c.y).toBeLessThanOrEqual(SATURN_LAYERS.comets.bottom);
    for (const dx of [0, 1, 2]) {
      expect(isSolid(grid.get(c.x + dx, c.y + 1))).toBe(true);
      expect(grid.get(c.x + dx, c.y - 1)).toBe(B.AIR);
    }
  });

  it('has a chest in every layer', () => {
    for (const { top, bottom } of Object.values(SATURN_LAYERS)) expect(w.chests.some((c) => c.y >= top && c.y <= bottom)).toBe(true);
  });

  it('hides the Yeti Cub’s egg in the aurora caverns (until you have it)', () => {
    expect(w.eggs).toHaveLength(1);
    expect(w.eggs[0].kind).toBe('yeti');
    expect(w.eggs[0].y).toBeGreaterThanOrEqual(SATURN_LAYERS.aurora.top);
    expect(w.eggs[0].y).toBeLessThanOrEqual(SATURN_LAYERS.aurora.bottom);
    expect(generateSaturn(42, { yetiEgg: false }).eggs).toEqual([]);
  });

  it('has bedrock walls and floor, and is the same for the same seed', () => {
    for (let y = 0; y < SATURN_H; y++) expect(grid.get(0, y)).toBe(B.BEDROCK);
    const a = generateSaturn(7);
    const b = generateSaturn(7);
    for (let y = 0; y < SATURN_H; y++) for (let x = 0; x < MINE_W; x++) expect(a.grid.get(x, y)).toBe(b.grid.get(x, y));
  });

  it('holds up across many seeds', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const s = generateSaturn(seed);
      expect(s.globes.length).toBe(SATURN_GEN.globes);
      expect(s.comet).not.toBe(null);
      expect(s.boulders.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('the Saturn ice rink', () => {
  it('has a big icy room beside the Saturn Heart for Ice Hockey, open to its chamber, with nothing in it', () => {
    for (const seed of [2, 42, 900]) {
      const w = generateSaturn(seed);
      const r = w.rink;
      expect(r).toEqual({ x0: 30, x1: 46, top: SATURN_H - 14, floor: SATURN_H - 2 });
      for (let y = r.top; y < r.floor; y++) for (let x = r.x0; x <= r.x1; x++) expect(w.grid.get(x, y)).toBe(B.AIR);
      for (let x = r.x0; x <= r.x1; x++) expect(w.grid.get(x, r.floor)).toBe(B.ICE);
      expect(w.grid.get(29, r.floor - 1)).toBe(B.AIR);
      const inside = (c) => c.x >= r.x0 && c.x <= r.x1 && c.y >= r.top && c.y <= r.floor;
      expect(w.chests.some(inside)).toBe(false);
      expect(w.decor.some(inside)).toBe(false);
    }
  });
});
