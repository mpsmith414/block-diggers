import { describe, it, expect } from 'vitest';
import { generateDino, dinoLayerAt, DINO_HOST } from '../../src/world/dinoworld.js';
import { B, dropOf, isSolid } from '../../src/world/blocks.js';
import { DINO_LAYERS, DINO_H, DINO_GEN, MINE_W } from '../../src/tuning.js';

const count = (grid, y0, y1, pred) => {
  let n = 0;
  for (let y = y0; y <= y1; y++) for (let x = 1; x < grid.w - 1; x++) if (pred(grid.get(x, y))) n++;
  return n;
};
const inLayer = (c, layer) => c.y >= DINO_LAYERS[layer].top && c.y <= DINO_LAYERS[layer].bottom;
const roomy = (grid, c) => [0, 1, 2].every((dx) => isSolid(grid.get(c.x + dx, c.y + 1)) && grid.get(c.x + dx, c.y - 1) === B.AIR);

describe('the Dino Planet generator', () => {
  const w = generateDino(42);
  const { grid } = w;

  it('is 252 rows of five layers, each with its own rock and ore', () => {
    expect(grid.h).toBe(DINO_H);
    expect(w.planet).toBe('dino');
    const ore = { jungle: 'jade', bonebeds: 'bone', swamp: 'tooth', lavalands: 'obsidian', dinocore: 'tooth' };
    for (const [layer, { top, bottom }] of Object.entries(DINO_LAYERS)) {
      expect(dinoLayerAt(top + 3)).toBe(layer);
      const host = count(grid, top + 2, bottom - 2, (id) => id === DINO_HOST[layer]);
      const solid = count(grid, top + 2, bottom - 2, (id) => isSolid(id));
      expect(host / solid).toBeGreaterThan(0.6);
      expect(count(grid, top, bottom, (id) => dropOf(id) === ore[layer])).toBeGreaterThan(layer === 'dinocore' ? 8 : 20);
    }
  });

  it('keeps the Dino Heart at the bottom', () => {
    expect(w.heart.kind).toBe('dino');
    for (let y = w.heart.y; y < w.heart.y + 3; y++) for (let x = w.heart.x; x < w.heart.x + 3; x++) expect(grid.get(x, y)).toBe(B.DINO_HEART);
  });

  it('has parasaurs to ride in the jungle, with room', () => {
    expect(w.parasaurs.length).toBe(DINO_GEN.parasaurs);
    for (const p of w.parasaurs) {
      expect(inLayer(p, 'jungle')).toBe(true);
      expect(grid.get(p.x + 1, p.y)).toBe(B.PARASAUR);
      expect(roomy(grid, p)).toBe(true);
    }
  });

  it('has nests in the bone beds, a T-rex skull in the swamp and a stego in the lava lands', () => {
    expect(w.nests.length).toBe(DINO_GEN.nests);
    for (const n of w.nests) {
      expect(inLayer(n, 'bonebeds')).toBe(true);
      expect(grid.get(n.x + 1, n.y)).toBe(B.NEST);
    }
    expect(inLayer(w.skull, 'swamp')).toBe(true);
    expect(grid.get(w.skull.x + 1, w.skull.y)).toBe(B.REX_SKULL);
    expect(roomy(grid, w.skull)).toBe(true);
    expect(inLayer(w.stego, 'lavalands')).toBe(true);
    expect(grid.get(w.stego.x + 1, w.stego.y)).toBe(B.STEGO);
    expect(roomy(grid, w.stego)).toBe(true);
  });

  it('has swamp water and lava in their layers', () => {
    expect(count(grid, DINO_LAYERS.swamp.top, DINO_LAYERS.swamp.bottom, (id) => id === B.WATER)).toBeGreaterThan(3);
    expect(count(grid, DINO_LAYERS.lavalands.top, DINO_LAYERS.lavalands.bottom, (id) => id === B.LAVA)).toBeGreaterThan(3);
    expect(count(grid, 1, DINO_LAYERS.bonebeds.bottom, (id) => id === B.LAVA || id === B.WATER)).toBe(0);
  });

  it('hides the Longneck’s egg in the bone beds (until you have it), and a chest in every layer', () => {
    expect(w.eggs).toHaveLength(1);
    expect(w.eggs[0].kind).toBe('longneck');
    expect(inLayer(w.eggs[0], 'bonebeds')).toBe(true);
    expect(generateDino(42, { longneckEgg: false }).eggs).toEqual([]);
    for (const layer of Object.keys(DINO_LAYERS)) expect(w.chests.some((c) => inLayer(c, layer))).toBe(true);
  });

  it('is the same for the same seed, and holds up across seeds', () => {
    const a = generateDino(7);
    const b = generateDino(7);
    for (let y = 0; y < DINO_H; y++) for (let x = 0; x < MINE_W; x++) expect(a.grid.get(x, y)).toBe(b.grid.get(x, y));
    for (let seed = 1; seed <= 12; seed++) {
      const d = generateDino(seed);
      expect(d.parasaurs.length).toBe(DINO_GEN.parasaurs);
      expect(d.nests.length).toBe(DINO_GEN.nests);
      expect(d.skull).not.toBe(null);
      expect(d.stego).not.toBe(null);
    }
  });
});

describe('the Dino Egg Grove', () => {
  it('has a big room beside the Dino Heart for Egg Catch, open to its chamber, with nothing in it', () => {
    for (const seed of [5, 42, 321]) {
      const w = generateDino(seed);
      const r = w.grove;
      expect(r).toEqual({ x0: 30, x1: 46, top: DINO_H - 14, floor: DINO_H - 2 });
      for (let y = r.top; y < r.floor; y++) for (let x = r.x0; x <= r.x1; x++) expect(w.grid.get(x, y)).toBe(B.AIR);
      for (let x = r.x0; x <= r.x1; x++) expect(w.grid.get(x, r.floor)).toBe(B.JUNGLE_SOIL);
      expect(w.grid.get(29, r.floor - 1)).toBe(B.AIR);
      const inside = (c) => c.x >= r.x0 && c.x <= r.x1 && c.y >= r.top && c.y <= r.floor;
      expect(w.chests.some(inside)).toBe(false);
      expect(w.decor.some(inside)).toBe(false);
    }
  });
});
