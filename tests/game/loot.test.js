import { describe, it, expect } from 'vitest';
import {
  createBackpack, addOre, packFull, createPickup, stepPickups, collectPickups,
} from '../../src/game/loot.js';
import { createGrid } from '../../src/world/grid.js';
import { B } from '../../src/world/blocks.js';
import { TILE, PICKUP } from '../../src/tuning.js';

describe('backpack', () => {
  it('holds up to its cap, then refuses', () => {
    const pack = createBackpack(2);
    expect(addOre(pack, 'coal')).toBe(true);
    expect(addOre(pack, 'iron')).toBe(true);
    expect(packFull(pack)).toBe(true);
    expect(addOre(pack, 'gold')).toBe(false);
    expect(pack.ores).toEqual({ coal: 1, iron: 1, gold: 0, diamond: 0, emerald: 0 });
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
