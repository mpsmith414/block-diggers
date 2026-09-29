import { describe, it, expect } from 'vitest';
import { B, isSolid, hardnessOf, dropOf, ORES } from '../../src/world/blocks.js';
import { createGrid, mineTime, mineCell } from '../../src/world/grid.js';
import { SKY_ROWS } from '../../src/tuning.js';

describe('blocks', () => {
  it('air, ladders, lava and chests are not solid; rock is', () => {
    for (const id of [B.AIR, B.LADDER, B.LAVA, B.CHEST]) expect(isSolid(id)).toBe(false);
    for (const id of [B.DIRT, B.STONE, B.DEEP, B.BEDROCK, B.GRAVEL, B.GRASS, B.IRON]) expect(isSolid(id)).toBe(true);
  });
  it('ores use their host rock hardness and drop their ore', () => {
    expect(hardnessOf(B.COAL_DIRT)).toBe('soft');
    expect(hardnessOf(B.COAL_STONE)).toBe('stone');
    expect(hardnessOf(B.IRON)).toBe('stone');
    expect(hardnessOf(B.GOLD_STONE)).toBe('stone');
    expect(hardnessOf(B.GOLD_DEEP)).toBe('deep');
    expect(hardnessOf(B.DIAMOND)).toBe('deep');
    expect(hardnessOf(B.EMERALD)).toBe('deep');
    expect(dropOf(B.COAL_DIRT)).toBe('coal');
    expect(dropOf(B.GOLD_DEEP)).toBe('gold');
    expect(dropOf(B.DIRT)).toBeNull();
    expect(ORES).toEqual(['coal', 'iron', 'gold', 'diamond', 'emerald', 'amber', 'brick', 'star', 'moonstone', 'cheese', 'spacegem', 'gizmo', 'ruby', 'bolt', 'opal', 'coin']);
  });
});

describe('mineTime', () => {
  it('matches the table', () => {
    expect([0, 1, 2].map((p) => mineTime(B.DIRT, p))).toEqual([0.25, 0.2, 0.12]);
    expect([0, 1, 2].map((p) => mineTime(B.GRAVEL, p))).toEqual([0.25, 0.2, 0.12]);
    expect([0, 1, 2].map((p) => mineTime(B.GRASS, p))).toEqual([0.25, 0.2, 0.12]);
    expect([0, 1, 2].map((p) => mineTime(B.STONE, p))).toEqual([0.6, 0.4, 0.25]);
    expect([0, 1, 2].map((p) => mineTime(B.DEEP, p))).toEqual([Infinity, 0.7, 0.4]);
    expect([0, 1, 2].map((p) => mineTime(B.BEDROCK, p))).toEqual([Infinity, Infinity, Infinity]);
  });
  it('ore takes as long as its host rock', () => {
    expect(mineTime(B.IRON, 0)).toBe(mineTime(B.STONE, 0));
    expect(mineTime(B.DIAMOND, 1)).toBe(mineTime(B.DEEP, 1));
    expect(mineTime(B.DIAMOND, 0)).toBe(Infinity);
  });
  it('non-solid cells have no mine time', () => {
    expect(mineTime(B.AIR, 2)).toBe(Infinity);
    expect(mineTime(B.LADDER, 2)).toBe(Infinity);
  });
});

describe('createGrid', () => {
  it('reads bedrock outside the sides and below the floor, air in the sky, bedrock above it', () => {
    const g = createGrid(4, 4);
    expect(g.get(-1, 1)).toBe(B.BEDROCK);
    expect(g.get(4, 1)).toBe(B.BEDROCK);
    expect(g.get(1, 4)).toBe(B.BEDROCK);
    expect(g.get(1, -1)).toBe(B.AIR);
    expect(g.get(1, -SKY_ROWS)).toBe(B.AIR);
    expect(g.get(1, -SKY_ROWS - 1)).toBe(B.BEDROCK);
  });
  it('set/get round-trips; set outside is ignored', () => {
    const g = createGrid(4, 4);
    g.set(2, 3, B.STONE);
    expect(g.get(2, 3)).toBe(B.STONE);
    g.set(9, 9, B.STONE);
    expect(g.inside(9, 9)).toBe(false);
  });
});

describe('mineCell', () => {
  const column = (ids) => {
    const g = createGrid(3, ids.length);
    ids.forEach((id, y) => g.set(1, y, id));
    return g;
  };
  it('horizontal mining leaves air and returns the drop', () => {
    const g = column([B.IRON]);
    expect(mineCell(g, 1, 0, { ladder: false })).toEqual({ id: B.IRON, drop: 'iron' });
    expect(g.get(1, 0)).toBe(B.AIR);
  });
  it('vertical mining leaves a ladder', () => {
    const g = column([B.DIRT, B.DIRT]);
    mineCell(g, 1, 0, { ladder: true });
    expect(g.get(1, 0)).toBe(B.LADDER);
    expect(g.get(1, 1)).toBe(B.DIRT);
  });
  it('mining down into open air extends the ladder to the floor', () => {
    const g = column([B.DIRT, B.AIR, B.AIR, B.STONE]);
    mineCell(g, 1, 0, { ladder: true });
    expect([0, 1, 2, 3].map((y) => g.get(1, y))).toEqual([B.LADDER, B.LADDER, B.LADDER, B.STONE]);
  });
  it('ladder extension stops at lava and chests', () => {
    const g = column([B.DIRT, B.AIR, B.LAVA]);
    mineCell(g, 1, 0, { ladder: true });
    expect([0, 1, 2].map((y) => g.get(1, y))).toEqual([B.LADDER, B.LADDER, B.LAVA]);
  });
});

describe('expansion blocks', () => {
  it('keeps the original ids stable', () => {
    expect([B.AIR, B.GRASS, B.DIRT, B.STONE, B.DEEP, B.BEDROCK, B.GRAVEL, B.LADDER, B.LAVA, B.CHEST]).toEqual([0, 1, 2, 3, 4, 5, 6, 14, 15, 16]);
  });
  it('new blocks are solid or open as intended', () => {
    for (const id of [B.CRYSTAL, B.GEODE, B.FOSSIL, B.BOOM, B.BOULDER, B.GOLD_CRYSTAL, B.DIAMOND_CRYSTAL, B.EMERALD_CRYSTAL]) expect(isSolid(id)).toBe(true);
    for (const id of [B.WATER, B.BIGCHEST, B.BIGCHEST_R, B.EGG]) expect(isSolid(id)).toBe(false);
  });
  it('crystal rock and its ores need a diamond pick', () => {
    for (const id of [B.CRYSTAL, B.DIAMOND_CRYSTAL, B.EMERALD_CRYSTAL, B.GOLD_CRYSTAL]) {
      expect([0, 1, 2].map((p) => mineTime(id, p))).toEqual([Infinity, Infinity, 0.6]);
    }
    expect(dropOf(B.DIAMOND_CRYSTAL)).toBe('diamond');
    expect(dropOf(B.GOLD_CRYSTAL)).toBe('gold');
  });
  it('boom blocks and boulders are never mined (the scene handles them)', () => {
    expect(mineTime(B.BOOM, 2)).toBe(Infinity);
    expect(mineTime(B.BOULDER, 2)).toBe(Infinity);
    expect(mineTime(B.GEODE, 0)).toBe(mineTime(B.STONE, 0));
    expect(mineTime(B.FOSSIL, 0)).toBe(mineTime(B.DIRT, 0));
  });
});
