import { describe, it, expect } from 'vitest';
import { generateMars, marsLayerAt, MARS_HOST } from '../../src/world/mars.js';
import { B, dropOf, isSolid } from '../../src/world/blocks.js';
import { MARS_LAYERS, MARS_H, MARS_GEN, MINE_W } from '../../src/tuning.js';

const count = (grid, y0, y1, pred) => {
  let n = 0;
  for (let y = y0; y <= y1; y++) for (let x = 1; x < grid.w - 1; x++) if (pred(grid.get(x, y))) n++;
  return n;
};

describe('the Mars generator', () => {
  const w = generateMars(42);
  const { grid } = w;

  it('is 252 rows of five layers, each with its own rock and ore', () => {
    expect(grid.h).toBe(MARS_H);
    expect(grid.w).toBe(MINE_W);
    expect(w.planet).toBe('mars');
    const ore = { dunes: 'ruby', rovers: 'bolt', volcano: 'opal', ruins: 'coin', marscore: 'ruby' };
    for (const [layer, { top, bottom }] of Object.entries(MARS_LAYERS)) {
      expect(marsLayerAt(top + 3)).toBe(layer);
      const host = count(grid, top + 2, bottom - 2, (id) => id === MARS_HOST[layer]);
      const solid = count(grid, top + 2, bottom - 2, (id) => isSolid(id));
      expect(host / solid).toBeGreaterThan(0.6);
      expect(count(grid, top, bottom, (id) => dropOf(id) === ore[layer])).toBeGreaterThan(layer === 'marscore' ? 8 : 20);
    }
  });

  it('has bedrock walls and floor', () => {
    for (let y = 0; y < MARS_H; y++) {
      expect(grid.get(0, y)).toBe(B.BEDROCK);
      expect(grid.get(MINE_W - 1, y)).toBe(B.BEDROCK);
    }
    for (let x = 0; x < MINE_W; x++) expect(grid.get(x, MARS_H - 1)).toBe(B.BEDROCK);
  });

  it('keeps the Mars Heart at the bottom: 3x3, on a floor', () => {
    expect(w.heart.kind).toBe('mars');
    for (let y = w.heart.y; y < w.heart.y + 3; y++) for (let x = w.heart.x; x < w.heart.x + 3; x++) expect(grid.get(x, y)).toBe(B.MARS_HEART);
    expect(w.heart.y).toBeGreaterThanOrEqual(MARS_LAYERS.marscore.top);
    expect(isSolid(grid.get(w.heart.x, w.heart.y + 3))).toBe(true);
  });

  it('has steam geysers on volcano cave floors', () => {
    expect(w.geysers.length).toBeGreaterThanOrEqual(4);
    for (const g of w.geysers) {
      expect(grid.get(g.x, g.y)).toBe(B.GEYSER);
      expect(isSolid(grid.get(g.x, g.y + 1))).toBe(true);
      expect(g.y).toBeGreaterThanOrEqual(MARS_LAYERS.volcano.top);
      expect(g.y).toBeLessThanOrEqual(MARS_LAYERS.volcano.bottom);
    }
  });

  it('has lava pools in the volcano caves', () => {
    const lava = count(grid, MARS_LAYERS.volcano.top, MARS_LAYERS.volcano.bottom, (id) => id === B.LAVA);
    expect(lava).toBeGreaterThan(3);
    expect(count(grid, 1, MARS_LAYERS.rovers.bottom, (id) => id === B.LAVA)).toBe(0);
  });

  it('has old rovers to open in the rover graveyard, with room around them', () => {
    expect(w.rovers.length).toBe(MARS_GEN.rovers);
    for (const r of w.rovers) {
      expect(grid.get(r.x + 1, r.y)).toBe(B.OLD_ROVER);
      expect(r.y).toBeGreaterThanOrEqual(MARS_LAYERS.rovers.top);
      expect(r.y).toBeLessThanOrEqual(MARS_LAYERS.rovers.bottom);
      for (const dx of [0, 1, 2]) {
        expect(isSolid(grid.get(r.x + dx, r.y + 1))).toBe(true);
        expect(grid.get(r.x + dx, r.y - 1)).toBe(B.AIR);
      }
    }
  });

  it('has vaults: sealed rooms with a door, a glyph button outside and a chest inside', () => {
    expect(w.vaults.length).toBe(MARS_GEN.vaults);
    for (const v of w.vaults) {
      // the ring of vault wall (the door is part of it)
      for (let x = v.x0; x <= v.x0 + 6; x++) {
        for (const y of [v.y0, v.y0 + 4]) expect([B.VAULT, B.VAULT_DOOR]).toContain(grid.get(x, y));
      }
      for (let y = v.y0; y <= v.y0 + 4; y++) {
        for (const x of [v.x0, v.x0 + 6]) expect([B.VAULT, B.VAULT_DOOR]).toContain(grid.get(x, y));
      }
      expect(v.door).toHaveLength(2);
      for (const d of v.door) expect(grid.get(d.x, d.y)).toBe(B.VAULT_DOOR);
      // the button: outside the room, standing on a floor, with room to walk up to it
      expect(grid.get(v.glyph.x, v.glyph.y)).toBe(B.GLYPH);
      expect(v.glyph.x < v.x0 || v.glyph.x > v.x0 + 6).toBe(true);
      expect(isSolid(grid.get(v.glyph.x, v.glyph.y + 1))).toBe(true);
      expect(grid.get(v.glyph.x, v.glyph.y - 1)).toBe(B.AIR);
      // the chest inside
      expect(grid.get(v.chest.x, v.chest.y)).toBe(B.CHEST);
      expect(v.chest.x).toBeGreaterThan(v.x0);
      expect(v.chest.x).toBeLessThan(v.x0 + 6);
      expect(w.chests).toContainEqual(v.chest);
      expect(v.y0).toBeGreaterThanOrEqual(MARS_LAYERS.ruins.top);
      expect(v.y0 + 4).toBeLessThanOrEqual(MARS_LAYERS.ruins.bottom);
    }
  });

  it('has a chest in every layer', () => {
    for (const { top, bottom } of Object.values(MARS_LAYERS)) {
      expect(w.chests.some((c) => c.y >= top && c.y <= bottom)).toBe(true);
    }
    for (const c of w.chests) expect(grid.get(c.x, c.y)).toBe(B.CHEST);
  });

  it('hides the Rover Bot’s egg in the rover graveyard (until you have the pup)', () => {
    expect(w.eggs).toHaveLength(1);
    expect(w.eggs[0].kind).toBe('rover');
    expect(w.eggs[0].y).toBeGreaterThanOrEqual(MARS_LAYERS.rovers.top);
    expect(w.eggs[0].y).toBeLessThanOrEqual(MARS_LAYERS.rovers.bottom);
    expect(generateMars(42, { roverEgg: false }).eggs).toEqual([]);
  });

  it('is the same every time for the same seed', () => {
    const a = generateMars(7);
    const b = generateMars(7);
    for (let y = 0; y < MARS_H; y++) for (let x = 0; x < MINE_W; x++) expect(a.grid.get(x, y)).toBe(b.grid.get(x, y));
    expect(a.decor).toEqual(b.decor);
    expect(generateMars(8).grid.get(10, 60) === a.grid.get(10, 60) && generateMars(8).decor.length === a.decor.length).toBe(false);
  });

  it('holds up across many seeds', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const m = generateMars(seed);
      expect(m.vaults.length).toBe(MARS_GEN.vaults);
      expect(m.rovers.length).toBe(MARS_GEN.rovers);
      expect(m.geysers.length).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('the Mars arcade', () => {
  it('has a big room beside the Mars Heart for the claw machine, open to its chamber, with nothing in it', () => {
    for (const seed of [3, 42, 777]) {
      const w = generateMars(seed);
      const r = w.arcade;
      expect(r).toEqual({ x0: 30, x1: 46, top: MARS_H - 14, floor: MARS_H - 2 });
      for (let y = r.top; y < r.floor; y++) for (let x = r.x0; x <= r.x1; x++) expect(w.grid.get(x, y)).toBe(B.AIR);
      for (let x = r.x0; x <= r.x1; x++) expect(w.grid.get(x, r.floor)).toBe(B.MARS_CORE);
      expect(w.grid.get(29, r.floor - 1)).toBe(B.AIR);
      const inside = (c) => c.x >= r.x0 && c.x <= r.x1 && c.y >= r.top && c.y <= r.floor;
      expect(w.chests.some(inside)).toBe(false);
      expect(w.decor.some(inside)).toBe(false);
      for (let y = w.heart.y; y < w.heart.y + 3; y++) for (let x = w.heart.x; x < w.heart.x + 3; x++) expect(w.grid.get(x, y)).toBe(B.MARS_HEART);
    }
  });
});
