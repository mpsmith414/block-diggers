import { describe, it, expect } from 'vitest';
import { explode, pushBoulder, bigChestReady, geodeLoot, FOSSIL_KINDS, meteoriteLoot, heartLeft } from '../../src/game/finds.js';
import { createGrid } from '../../src/world/grid.js';
import { B } from '../../src/world/blocks.js';
import { createRng } from '../../src/world/rng.js';

const CH = { '#': B.STONE, '.': B.AIR, X: B.BEDROCK, T: B.BOOM, c: B.CHEST, O: B.BOULDER, L: B.LADDER, w: B.WATER, i: B.IRON, e: B.EGG };
function makeGrid(rows) {
  const g = createGrid(rows[0].length, rows.length);
  rows.forEach((row, y) => [...row].forEach((ch, x) => g.set(x, y, CH[ch])));
  return g;
}
const row = (g, y) => Array.from({ length: g.w }, (_, x) => g.get(x, y));

describe('explode', () => {
  it('clears 3x3 around the boom, keeping bedrock, chests, boulders, eggs, ladders and water', () => {
    const g = makeGrid(['#####', '#XcO#', '#iTL#', '#we##', '#####']);
    const r = explode(g, 2, 2);
    expect(row(g, 1)).toEqual([B.STONE, B.BEDROCK, B.CHEST, B.BOULDER, B.STONE]);
    expect(row(g, 2)).toEqual([B.STONE, B.AIR, B.AIR, B.LADDER, B.STONE]);
    expect(row(g, 3)).toEqual([B.STONE, B.WATER, B.EGG, B.AIR, B.STONE]);
    expect(r.cleared.map((c) => c.drop).filter(Boolean)).toEqual(['iron']);
    expect(r.chain).toEqual([]);
  });
  it('lights other boom blocks it reaches instead of clearing them', () => {
    const g = makeGrid(['#####', '#.TT#', '#####']);
    const r = explode(g, 2, 1);
    expect(g.get(3, 1)).toBe(B.BOOM);
    expect(r.chain).toEqual([{ x: 3, y: 1 }]);
  });
});

describe('pushBoulder', () => {
  it('rolls one cell into open space', () => {
    const g = makeGrid(['#####', '#.O.#', '#####']);
    expect(pushBoulder(g, 2, 1, 1)).toEqual({ moved: true, x: 3, y: 1, fell: 0 });
    expect(row(g, 1)).toEqual([B.STONE, B.AIR, B.AIR, B.BOULDER, B.STONE]);
  });
  it('falls down to a floor after rolling off a ledge, even through water', () => {
    const g = makeGrid(['#####', '#.O.#', '###.#', '###w#', '#####']);
    expect(pushBoulder(g, 2, 1, 1)).toEqual({ moved: true, x: 3, y: 3, fell: 2 });
    expect(g.get(3, 3)).toBe(B.BOULDER);
    expect(g.get(3, 1)).toBe(B.AIR);
  });
  it('will not move into rock or another boulder', () => {
    const g = makeGrid(['#####', '#.O##', '#####']);
    expect(pushBoulder(g, 2, 1, 1).moved).toBe(false);
    expect(g.get(2, 1)).toBe(B.BOULDER);
  });
});

describe('bigChestReady', () => {
  it('needs both players together in co-op, one when solo', () => {
    expect(bigChestReady({ touching: 1, players: 1 })).toBe(true);
    expect(bigChestReady({ touching: 1, players: 2 })).toBe(false);
    expect(bigChestReady({ touching: 2, players: 2 })).toBe(true);
  });
});

describe('treasure loot', () => {
  it('geodes give 4-6 gems suited to their depth', () => {
    const rng = createRng(3);
    for (let i = 0; i < 30; i++) {
      const stone = geodeLoot(60, rng);
      expect(stone.length).toBeGreaterThanOrEqual(4);
      expect(stone.length).toBeLessThanOrEqual(6);
      stone.forEach((o) => expect(o).toBe('gold'));
      geodeLoot(120, rng).forEach((o) => expect(['gold', 'diamond', 'emerald']).toContain(o));
      geodeLoot(170, rng).forEach((o) => expect(['diamond', 'emerald']).toContain(o));
    }
  });
  it('knows the three fossils', () => {
    expect(FOSSIL_KINDS).toEqual(['shell', 'bone', 'dino']);
  });
});

describe('meteorites', () => {
  it('crack open into a shower of star shards', () => {
    const rng = createRng(9);
    for (let i = 0; i < 20; i++) {
      const loot = meteoriteLoot(rng);
      expect(loot.filter((o) => o === 'star').length).toBeGreaterThanOrEqual(5);
      expect(loot.length).toBeLessThanOrEqual(8);
      loot.forEach((o) => expect(['star', 'diamond']).toContain(o));
    }
  });
});

describe('the Heart of the World', () => {
  it('counts how many of its 9 cells are still there', () => {
    const g = createGrid(8, 8);
    for (let y = 2; y <= 4; y++) for (let x = 2; x <= 4; x++) g.set(x, y, B.HEART);
    const heart = { x: 2, y: 2 };
    expect(heartLeft(g, heart)).toBe(9);
    g.set(3, 3, B.AIR);
    expect(heartLeft(g, heart)).toBe(8);
    for (let y = 2; y <= 4; y++) for (let x = 2; x <= 4; x++) g.set(x, y, B.AIR);
    expect(heartLeft(g, heart)).toBe(0);
  });
});
