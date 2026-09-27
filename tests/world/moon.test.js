import { describe, it, expect } from 'vitest';
import { generateMoon, MOON } from '../../src/world/moon.js';
import { B, isSolid } from '../../src/world/blocks.js';
import { MINE_W } from '../../src/tuning.js';

const SEEDS = [11, 222, 3333];
const moons = SEEDS.map((s) => generateMoon(s));
const cellsOf = (grid, id) => {
  const out = [];
  for (let y = 0; y < grid.h; y++) for (let x = 0; x < grid.w; x++) if (grid.get(x, y) === id) out.push({ x, y });
  return out;
};

describe('the Moon', () => {
  it('is 48 wide and 102 rows deep, with bedrock round the edges', () => {
    for (const { grid } of moons) {
      expect(grid.w).toBe(MINE_W);
      expect(grid.h).toBe(MOON.h);
      expect(MOON.h).toBe(102);
      for (let x = 0; x < grid.w; x++) expect(grid.get(x, MOON.h - 1)).toBe(B.BEDROCK);
      for (let y = 0; y < grid.h; y++) {
        expect(grid.get(0, y)).toBe(B.BEDROCK);
        expect(grid.get(MINE_W - 1, y)).toBe(B.BEDROCK);
      }
    }
  });

  it('is made of moon things only: no dirt, grass, stone, lava or water', () => {
    for (const { grid } of moons) {
      for (const id of [B.DIRT, B.GRASS, B.STONE, B.DEEP, B.LAVA, B.WATER, B.GRAVEL, B.COAL_DIRT]) {
        expect(cellsOf(grid, id)).toHaveLength(0);
      }
      expect(cellsOf(grid, B.MOONROCK).length).toBeGreaterThan(1000);
    }
  });

  it('has star shards, space crystals (deeper down) and moon cheese', () => {
    for (const { grid } of moons) {
      expect(cellsOf(grid, B.STAR).length).toBeGreaterThan(10);
      expect(cellsOf(grid, B.CHEESE).length).toBeGreaterThan(10);
      const crystals = cellsOf(grid, B.SPACE_CRYSTAL);
      expect(crystals.length).toBeGreaterThan(10);
      crystals.forEach((c) => expect(c.y).toBeGreaterThanOrEqual(MOON.caves.top));
    }
  });

  it('has caves in the moon rock and bigger caves in the crystal caves', () => {
    for (const { grid } of moons) {
      const air = (top, bottom) => {
        let n = 0;
        for (let y = top; y <= bottom; y++) for (let x = 0; x < grid.w; x++) if (grid.get(x, y) === B.AIR) n++;
        return n;
      };
      expect(air(MOON.rock.top + 2, MOON.rock.bottom)).toBeGreaterThan(80);
      expect(air(MOON.caves.top, MOON.caves.bottom)).toBeGreaterThan(air(MOON.rock.top + 2, MOON.rock.bottom));
    }
  });

  it('has 3 chests and a few meteorites, each where it belongs', () => {
    for (const { grid, chests } of moons) {
      expect(chests).toHaveLength(3);
      for (const c of chests) {
        expect(grid.get(c.x, c.y)).toBe(B.CHEST);
        expect(isSolid(grid.get(c.x, c.y + 1))).toBe(true);
      }
      expect(cellsOf(grid, B.METEORITE).length).toBeGreaterThan(0);
    }
  });

  it('glowing space crystals grow on the cave floors', () => {
    for (const { grid, decor } of moons) {
      expect(decor.some((d) => d.kind === 'spacecrystal')).toBe(true);
      for (const d of decor) {
        expect(grid.get(d.x, d.y)).toBe(B.AIR);
        expect(isSolid(d.on === 'ceil' ? grid.get(d.x, d.y - 1) : grid.get(d.x, d.y + 1))).toBe(true);
      }
    }
  });

  it('works like a mine: same shape, you land at the top', () => {
    const m = moons[0];
    for (const k of ['grid', 'chests', 'decor', 'eggs', 'boulders', 'fossils', 'spawn', 'seed']) expect(m).toHaveProperty(k);
    expect(m.eggs).toEqual([]);
    expect(m.heart).toBeNull();
    expect(m.bigChest).toBeNull();
    expect(m.spawn.y).toBe(-1);
    expect(isSolid(m.grid.get(m.spawn.x, 0))).toBe(true);
  });

  it('is the same Moon for the same seed', () => {
    const a = generateMoon(5);
    const b = generateMoon(5);
    expect(a.grid.cells).toEqual(b.grid.cells);
  });
});
