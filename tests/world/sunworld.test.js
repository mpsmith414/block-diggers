import { describe, it, expect } from 'vitest';
import { generateSun, sunLayerAt, SUN_HOST } from '../../src/world/sunworld.js';
import { B, dropOf, isSolid } from '../../src/world/blocks.js';
import { SUN_LAYERS, SUN_H, SUN_GEN, MINE_W } from '../../src/tuning.js';

const count = (grid, y0, y1, pred) => {
  let n = 0;
  for (let y = y0; y <= y1; y++) for (let x = 1; x < grid.w - 1; x++) if (pred(grid.get(x, y))) n++;
  return n;
};
const inLayer = (c, layer) => c.y >= SUN_LAYERS[layer].top && c.y <= SUN_LAYERS[layer].bottom;
const roomy = (grid, c) => [0, 1, 2].every((dx) => isSolid(grid.get(c.x + dx, c.y + 1)) && grid.get(c.x + dx, c.y - 1) === B.AIR);

describe('the Sun generator', () => {
  const w = generateSun(42);
  const { grid } = w;

  it('is 242 rows of six layers, each with its own rock and ore', () => {
    expect(grid.h).toBe(SUN_H);
    expect(w.planet).toBe('sun');
    const ore = { corona: 'sunstone', sunspots: 'flare', plasmasea: 'plasma', radiance: 'nova', fusion: 'nova', suncore: 'nova' };
    for (const [layer, { top, bottom }] of Object.entries(SUN_LAYERS)) {
      expect(sunLayerAt(top + 3)).toBe(layer);
      const host = count(grid, top + 2, bottom - 2, (id) => id === SUN_HOST[layer]);
      const solid = count(grid, top + 2, bottom - 2, (id) => isSolid(id));
      expect(host / solid).toBeGreaterThan(0.55);
      expect(count(grid, top, bottom, (id) => dropOf(id) === ore[layer])).toBeGreaterThan(['fusion', 'suncore'].includes(layer) ? 5 : 15);
    }
  });

  it('keeps the Sun’s Heart at the bottom', () => {
    expect(w.heart.kind).toBe('sun');
    for (let y = w.heart.y; y < w.heart.y + 3; y++) for (let x = w.heart.x; x < w.heart.x + 3; x++) expect(grid.get(x, y)).toBe(B.SUN_HEART);
  });

  it('has fire flowers in the sunspots and the Solar Forge in the fusion forge, with room', () => {
    expect(w.flowers.length).toBe(SUN_GEN.flowers);
    for (const f of w.flowers) {
      expect(inLayer(f, 'sunspots')).toBe(true);
      expect(grid.get(f.x + 1, f.y)).toBe(B.FIRE_FLOWER);
    }
    expect(inLayer(w.forge, 'fusion')).toBe(true);
    expect(grid.get(w.forge.x + 1, w.forge.y)).toBe(B.FORGE);
    expect(roomy(grid, w.forge)).toBe(true);
  });

  it('has lava lakes in the plasma sea (and none in the corona)', () => {
    expect(count(grid, SUN_LAYERS.plasmasea.top, SUN_LAYERS.plasmasea.bottom, (id) => id === B.LAVA)).toBeGreaterThan(5);
    expect(count(grid, 1, SUN_LAYERS.corona.bottom, (id) => id === B.LAVA)).toBe(0);
  });

  it('hides the Sun Dragon’s egg in the radiance (until you have it), and a chest in every layer', () => {
    expect(w.eggs).toHaveLength(1);
    expect(w.eggs[0].kind).toBe('sundragon');
    expect(inLayer(w.eggs[0], 'radiance')).toBe(true);
    expect(generateSun(42, { dragonEgg: false }).eggs).toEqual([]);
    for (const layer of Object.keys(SUN_LAYERS)) expect(w.chests.some((c) => inLayer(c, layer))).toBe(true);
  });

  it('is the same for the same seed, and holds up across seeds', () => {
    const a = generateSun(7);
    const b = generateSun(7);
    for (let y = 0; y < SUN_H; y++) for (let x = 0; x < MINE_W; x++) expect(a.grid.get(x, y)).toBe(b.grid.get(x, y));
    for (let seed = 1; seed <= 12; seed++) {
      const s = generateSun(seed);
      expect(s.flowers.length).toBe(SUN_GEN.flowers);
      expect(s.forge).not.toBe(null);
    }
  });
});
