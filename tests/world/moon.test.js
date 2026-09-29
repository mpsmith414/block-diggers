import { describe, it, expect } from 'vitest';
import { generateMoon, MOON_HOST } from '../../src/world/moon.js';
import { carveStation } from '../../src/world/worldgen.js';
import { B, isSolid, dropOf } from '../../src/world/blocks.js';
import { MINE_W, MOON_H, MOON_LAYERS } from '../../src/tuning.js';

const SEEDS = [11, 222, 3333, 44444];
const moons = SEEDS.map((s) => generateMoon(s));
const cellsOf = (grid, id, top = 0, bottom = grid.h - 1) => {
  const out = [];
  for (let y = top; y <= bottom; y++) for (let x = 0; x < grid.w; x++) if (grid.get(x, y) === id) out.push({ x, y });
  return out;
};
const count = (grid, ids, top, bottom) => ids.reduce((n, id) => n + cellsOf(grid, id, top, bottom).length, 0);

describe('the Moon: five layers', () => {
  it('is 48 wide and 252 rows deep, with bedrock round the edges', () => {
    for (const { grid } of moons) {
      expect(grid.w).toBe(MINE_W);
      expect(grid.h).toBe(MOON_H);
      for (let x = 0; x < grid.w; x++) expect(grid.get(x, MOON_H - 1)).toBe(B.BEDROCK);
      for (let y = 0; y < grid.h; y++) {
        expect(grid.get(0, y)).toBe(B.BEDROCK);
        expect(grid.get(MINE_W - 1, y)).toBe(B.BEDROCK);
      }
    }
  });

  it('each layer is made of its own rock', () => {
    const ROCK = { craters: B.MOONROCK, cheesecaves: B.CHEESE_ROCK, mooncrystal: B.MOON_CRYSTAL, alienbase: B.ALIEN_PANEL, mooncore: B.MOON_CORE };
    expect(MOON_HOST).toEqual(ROCK);
    for (const { grid } of moons) {
      for (const [layer, rock] of Object.entries(ROCK)) {
        const { top, bottom } = MOON_LAYERS[layer];
        const solid = [];
        for (let y = top; y <= bottom; y++) for (let x = 1; x < MINE_W - 1; x++) if (isSolid(grid.get(x, y))) solid.push(grid.get(x, y));
        const mine = solid.filter((id) => id === rock).length;
        expect(mine / solid.length).toBeGreaterThan(0.6);
      }
    }
  });

  it('is made of moon things only: no dirt, stone, lava or water', () => {
    for (const { grid } of moons) {
      expect(count(grid, [B.DIRT, B.GRASS, B.STONE, B.DEEP, B.LAVA, B.WATER, B.GRAVEL, B.COAL_DIRT, B.STAR])).toBe(0);
    }
  });

  it('each layer has its ore: moonstone, cheese, space gems, gizmos, and all of them in the core', () => {
    for (const { grid } of moons) {
      const L = MOON_LAYERS;
      expect(count(grid, [B.MOONSTONE], L.craters.top, L.craters.bottom)).toBeGreaterThan(15);
      expect(count(grid, [B.CHEESE], L.cheesecaves.top, L.cheesecaves.bottom)).toBeGreaterThan(20);
      expect(count(grid, [B.SPACE_GEM], L.mooncrystal.top, L.mooncrystal.bottom)).toBeGreaterThan(15);
      expect(count(grid, [B.GIZMO], L.alienbase.top, L.alienbase.bottom)).toBeGreaterThan(15);
      for (const id of [B.MOONSTONE, B.SPACE_GEM, B.GIZMO]) expect(count(grid, [id], L.mooncore.top, L.mooncore.bottom)).toBeGreaterThan(0);
      // every ore in the core is one you can dig with the Laser Drill, and drops a Moon ore
      for (const id of [B.MOONSTONE, B.CHEESE, B.SPACE_GEM, B.GIZMO]) expect(['moonstone', 'cheese', 'spacegem', 'gizmo']).toContain(dropOf(id));
    }
  });

  it('has caves in every layer', () => {
    for (const { grid } of moons) {
      for (const { top, bottom } of Object.values(MOON_LAYERS)) {
        expect(count(grid, [B.AIR], top + 2, bottom)).toBeGreaterThan(60);
      }
    }
  });

  it('a chest in every layer, standing on something', () => {
    for (const { grid, chests } of moons) {
      for (const { top, bottom } of Object.values(MOON_LAYERS)) {
        expect(chests.some((c) => c.y >= top && c.y <= bottom)).toBe(true);
      }
      for (const c of chests) {
        expect(grid.get(c.x, c.y)).toBe(B.CHEST);
        expect(isSolid(grid.get(c.x, c.y + 1))).toBe(true);
      }
    }
  });

  it('meteorites in the craters', () => {
    for (const { grid } of moons) expect(count(grid, [B.METEORITE], MOON_LAYERS.craters.top, MOON_LAYERS.craters.bottom)).toBeGreaterThan(0);
  });

  it('cheese wheels (boulders) sit on floors in the cheese caves', () => {
    for (const { grid, boulders } of moons) {
      expect(boulders.length).toBeGreaterThanOrEqual(3);
      for (const b of boulders) {
        expect(grid.get(b.x, b.y)).toBe(B.CHEESE_WHEEL);
        expect(b.y).toBeGreaterThanOrEqual(MOON_LAYERS.cheesecaves.top);
        expect(b.y).toBeLessThanOrEqual(MOON_LAYERS.cheesecaves.bottom);
        expect(isSolid(grid.get(b.x, b.y + 1))).toBe(true);
      }
    }
  });

  it('singing crystals stand on crystal-cave floors', () => {
    for (const { grid, chimes } of moons) {
      expect(chimes.length).toBeGreaterThanOrEqual(4);
      for (const c of chimes) {
        expect(c.y).toBeGreaterThanOrEqual(MOON_LAYERS.mooncrystal.top);
        expect(c.y).toBeLessThanOrEqual(MOON_LAYERS.mooncrystal.bottom);
        expect(grid.get(c.x, c.y)).toBe(B.AIR);
        expect(isSolid(grid.get(c.x, c.y + 1))).toBe(true);
      }
    }
  });

  it('teleport pads come in pairs on alien-base floors, far apart', () => {
    for (const { grid, teleports } of moons) {
      expect(teleports.length).toBeGreaterThanOrEqual(2);
      for (const { a, b } of teleports) {
        for (const p of [a, b]) {
          expect(grid.get(p.x, p.y)).toBe(B.TELEPORT);
          expect(isSolid(grid.get(p.x, p.y + 1))).toBe(true);
          expect(grid.get(p.x, p.y - 1)).toBe(B.AIR); // room to stand
          expect(p.y).toBeGreaterThanOrEqual(MOON_LAYERS.alienbase.top);
          expect(p.y).toBeLessThanOrEqual(MOON_LAYERS.alienbase.bottom);
        }
        expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it('a crashed UFO in the alien base, three cells wide, on the floor', () => {
    for (const { grid, ufo } of moons) {
      expect(ufo).not.toBeNull();
      expect(ufo.y).toBeGreaterThanOrEqual(MOON_LAYERS.alienbase.top);
      for (let dx = 0; dx < 3; dx++) {
        expect(grid.get(ufo.x + dx, ufo.y)).toBe(dx === 1 ? B.UFO : B.AIR);
        expect(isSolid(grid.get(ufo.x + dx, ufo.y + 1))).toBe(true);
        expect(grid.get(ufo.x + dx, ufo.y - 1)).toBe(B.AIR);
      }
    }
  });

  it('the Moon Heart: a 3x3 gem at the very bottom of the core', () => {
    for (const { grid, heart } of moons) {
      expect(heart.kind).toBe('moon');
      expect(heart.y).toBeGreaterThanOrEqual(MOON_LAYERS.mooncore.bottom - 8);
      for (let y = heart.y; y < heart.y + 3; y++) for (let x = heart.x; x < heart.x + 3; x++) expect(grid.get(x, y)).toBe(B.MOON_HEART);
      for (let x = heart.x; x < heart.x + 3; x++) expect(isSolid(grid.get(x, heart.y + 3))).toBe(true);
    }
  });

  it('a Moon Pup egg in the crystal caves, unless you have the pup', () => {
    for (const s of SEEDS) {
      const m = generateMoon(s);
      expect(m.eggs).toHaveLength(1);
      const [e] = m.eggs;
      expect(e.kind).toBe('moonpup');
      expect(e.y).toBeGreaterThanOrEqual(MOON_LAYERS.mooncrystal.top);
      expect(e.y).toBeLessThanOrEqual(MOON_LAYERS.mooncrystal.bottom);
      expect(m.grid.get(e.x, e.y)).toBe(B.EGG);
      expect(generateMoon(s, { pupEgg: false }).eggs).toEqual([]);
    }
  });

  it('decorations have something to stand on or hang from', () => {
    for (const { grid, decor } of moons) {
      expect(decor.length).toBeGreaterThan(50);
      for (const d of decor) {
        expect(grid.get(d.x, d.y)).toBe(B.AIR);
        expect(isSolid(d.on === 'ceil' ? grid.get(d.x, d.y - 1) : grid.get(d.x, d.y + 1))).toBe(true);
      }
    }
  });

  it('works like a mine: you land at the top, next to the hatch', () => {
    const m = moons[0];
    for (const k of ['grid', 'chests', 'decor', 'eggs', 'boulders', 'fossils', 'spawn', 'seed', 'heart']) expect(m).toHaveProperty(k);
    expect(m.moon).toBe(true);
    expect(m.planet).toBe('moon');
    expect(m.bigChest).toBeNull();
    expect(m.spawn.y).toBe(-1);
    expect(isSolid(m.grid.get(m.spawn.x, 0))).toBe(true);
  });

  it('the UFO elevator can carve a station in any Moon layer', () => {
    const m = generateMoon(9);
    const row = MOON_LAYERS.alienbase.top + 1;
    carveStation(m, 24, row);
    for (let x = 21; x <= 27; x++) {
      expect(m.grid.get(x, row)).not.toBe(B.ALIEN_PANEL);
      expect(isSolid(m.grid.get(x, row + 1))).toBe(true);
    }
  });

  it('is the same Moon for the same seed', () => {
    expect(generateMoon(5).grid.cells).toEqual(generateMoon(5).grid.cells);
  });
});

describe('the Moon Skate Park', () => {
  it('has a big skate park beside the Moon Heart, open to its chamber, with nothing in it', () => {
    for (const w of moons) {
      const p = w.skatepark;
      expect(p).toEqual({ x0: 30, x1: 46, top: MOON_H - 14, floor: MOON_H - 2 });
      for (let y = p.top; y < p.floor; y++) for (let x = p.x0; x <= p.x1; x++) expect(w.grid.get(x, y)).toBe(B.AIR);
      for (let x = p.x0; x <= p.x1; x++) expect(w.grid.get(x, p.floor)).toBe(B.MOON_CORE);
      expect(w.grid.get(29, p.floor - 1)).toBe(B.AIR); // walk in from the Heart chamber
      const inside = (c) => c.x >= p.x0 && c.x <= p.x1 && c.y >= p.top && c.y <= p.floor;
      expect(w.chests.some(inside)).toBe(false);
      expect(w.decor.some(inside)).toBe(false);
      for (let y = w.heart.y; y < w.heart.y + 3; y++) for (let x = w.heart.x; x < w.heart.x + 3; x++) expect(w.grid.get(x, y)).toBe(B.MOON_HEART);
    }
  });
});
