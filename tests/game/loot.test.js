import { describe, it, expect } from 'vitest';
import {
  createBackpack, addOre, packFull, createPickup, stepPickups, collectPickups, chestLoot, emptyPack, attractPickups, scatterOres,
} from '../../src/game/loot.js';
import { createGrid } from '../../src/world/grid.js';
import { B } from '../../src/world/blocks.js';
import { createRng } from '../../src/world/rng.js';
import { TILE, PICKUP } from '../../src/tuning.js';

describe('backpack', () => {
  it('holds up to its cap, then refuses', () => {
    const pack = createBackpack(2);
    expect(addOre(pack, 'coal')).toBe(true);
    expect(addOre(pack, 'iron')).toBe(true);
    expect(packFull(pack)).toBe(true);
    expect(addOre(pack, 'gold')).toBe(false);
    expect(pack.ores).toEqual({ coal: 1, iron: 1, gold: 0, diamond: 0, emerald: 0, amber: 0, brick: 0, star: 0, moonstone: 0, cheese: 0, spacegem: 0, gizmo: 0, ruby: 0, bolt: 0, opal: 0, coin: 0, frost: 0, icecream: 0, pearl: 0, comet: 0, jade: 0, bone: 0, tooth: 0, obsidian: 0 });
    expect(pack.count).toBe(2);
  });
});

describe('pickups', () => {
  const floorGrid = () => {
    const g = createGrid(3, 4);
    for (let x = 0; x < 3; x++) g.set(x, 3, B.STONE);
    return g;
  };

  it('fall and rest on the floor', () => {
    const g = floorGrid();
    let list = [createPickup({ x: 24, y: 8, ore: 'coal' })];
    for (let i = 0; i < 120; i++) list = stepPickups(list, g, 1 / 60);
    expect(list[0].y).toBe(3 * TILE - PICKUP.size / 2);
    expect(list[0].vy).toBe(0);
  });

  it('expire when their ttl runs out; mined ones never do', () => {
    const g = floorGrid();
    let list = [
      createPickup({ x: 24, y: 40, ore: 'coal', ttl: 1 }),
      createPickup({ x: 24, y: 40, ore: 'iron' }),
    ];
    for (let i = 0; i < 70; i++) list = stepPickups(list, g, 1 / 60);
    expect(list.map((p) => p.ore)).toEqual(['iron']);
  });

  it('are collected when overlapping, unless delayed or the pack is full', () => {
    const pack = createBackpack(1);
    const box = { x: 16, y: 32, w: 12, h: 14 };
    let list = [
      createPickup({ x: 22, y: 40, ore: 'gold', delay: 0.5 }),
      createPickup({ x: 22, y: 40, ore: 'coal' }),
      createPickup({ x: 22, y: 40, ore: 'iron' }),
      createPickup({ x: 200, y: 40, ore: 'diamond' }),
    ];
    const r = collectPickups(list, box, pack);
    expect(r.collected).toEqual(['coal']);
    expect(r.list.map((p) => p.ore)).toEqual(['gold', 'iron', 'diamond']);
    expect(packFull(pack)).toBe(true);
  });

  it('delay counts down', () => {
    const g = floorGrid();
    let list = [createPickup({ x: 24, y: 40, ore: 'gold', delay: 0.5 })];
    for (let i = 0; i < 40; i++) list = stepPickups(list, g, 1 / 60);
    expect(list[0].delay).toBe(0);
  });
});

describe('chestLoot', () => {
  it('gives 3-6 of the best ore for the layer', () => {
    const rng = createRng(5);
    for (let i = 0; i < 50; i++) {
      const stone = chestLoot(60, rng);
      expect(stone.length).toBeGreaterThanOrEqual(3);
      expect(stone.length).toBeLessThanOrEqual(6);
      expect(new Set(stone)).toEqual(new Set(['gold']));
      const deep = chestLoot(120, rng);
      expect(deep.every((o) => o === deep[0])).toBe(true);
      expect(['diamond', 'emerald']).toContain(deep[0]);
    }
  });
});

describe('emptyPack', () => {
  it('returns the ores and empties the pack', () => {
    const pack = createBackpack(5);
    addOre(pack, 'coal');
    addOre(pack, 'coal');
    expect(emptyPack(pack)).toMatchObject({ coal: 2, iron: 0 });
    expect(pack.count).toBe(0);
    expect(pack.ores.coal).toBe(0);
  });
});

describe('attractPickups', () => {
  it('pulls nearby, collectable pickups toward the player', () => {
    const near = createPickup({ x: 50, y: 40, ore: 'coal' });
    const far = createPickup({ x: 300, y: 40, ore: 'coal' });
    const delayed = createPickup({ x: 50, y: 40, ore: 'coal', delay: 1 });
    attractPickups([near, far, delayed], { x: 20, y: 40 }, createBackpack(5), 1 / 60);
    expect(near.x).toBeLessThan(50);
    expect(far.x).toBe(300);
    expect(delayed.x).toBe(50);
  });
  it('does nothing when the pack is full', () => {
    const pack = createBackpack(1);
    addOre(pack, 'coal');
    const near = createPickup({ x: 50, y: 40, ore: 'coal' });
    attractPickups([near], { x: 20, y: 40 }, pack, 1 / 60);
    expect(near.x).toBe(50);
  });
  it('a pickup that gets pulled in is collected soon after', () => {
    const pack = createBackpack(5);
    let list = [createPickup({ x: 60, y: 40, ore: 'gold' })];
    const box = { x: 14, y: 33, w: 12, h: 14 };
    let got = [];
    for (let i = 0; i < 60 && !got.length; i++) {
      attractPickups(list, { x: 20, y: 40 }, pack, 1 / 60);
      ({ list, collected: got } = collectPickups(list, box, pack));
    }
    expect(got).toEqual(['gold']);
  });
});

describe('scatterOres', () => {
  it('takes at most 3 ores, and only what the pack has', () => {
    const rng = createRng(1);
    const pack = createBackpack(20);
    for (let i = 0; i < 5; i++) addOre(pack, 'coal');
    addOre(pack, 'gold');
    const out = scatterOres(pack, rng);
    expect(out).toHaveLength(3);
    expect(pack.count).toBe(3);
    const total = pack.ores.coal + pack.ores.gold;
    expect(total).toBe(3);
  });
  it('an almost empty pack loses what it has; an empty one loses nothing', () => {
    const rng = createRng(2);
    const pack = createBackpack(20);
    addOre(pack, 'iron');
    expect(scatterOres(pack, rng)).toEqual(['iron']);
    expect(scatterOres(pack, rng)).toEqual([]);
    expect(pack.count).toBe(0);
  });
});
