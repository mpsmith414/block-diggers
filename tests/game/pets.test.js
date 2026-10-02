import { describe, it, expect } from 'vitest';
import { PET_KINDS, DINO_KINDS, hatch, sniff, follow, nearestPickup, roarTargets } from '../../src/game/pets.js';
import { attractPickups, createPickup, createBackpack } from '../../src/game/loot.js';
import { defaultState } from '../../src/save/save.js';
import { createGrid } from '../../src/world/grid.js';
import { B } from '../../src/world/blocks.js';
import { PICKUP, PETS } from '../../src/tuning.js';

describe('hatch', () => {
  it('a new kind of egg hatches into a new pet', () => {
    const r = hatch(defaultState(), 'mole');
    expect(r.pet).toBe('mole');
    expect(r.state.pets).toEqual(['mole']);
    expect(r.gold).toBe(0);
  });
  it('a golden egg, or one you already have, gives gold instead', () => {
    const s = { ...defaultState(), pets: ['mole'] };
    const dup = hatch(s, 'mole');
    expect(dup.pet).toBeNull();
    expect(dup.gold).toBe(PETS.goldenEggGold);
    expect(dup.state.bank.gold).toBe(PETS.goldenEggGold);
    expect(hatch(s, 'golden').gold).toBe(PETS.goldenEggGold);
  });
  it('knows the ten pets (three cave pets, two dinosaurs, the Moon Pup, the Rover Bot, the Yeti Cub, the Longneck and the Sun Dragon)', () => {
    expect(PET_KINDS).toEqual(['mole', 'glowbug', 'batbuddy', 'rex', 'trike', 'moonpup', 'rover', 'yeti', 'longneck', 'sundragon']);
  });
});

describe('sniff', () => {
  it('finds the nearest ore within range, ignoring plain rock', () => {
    const g = createGrid(20, 20);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) g.set(x, y, B.STONE);
    g.set(15, 10, B.IRON);
    g.set(3, 10, B.GOLD_STONE);
    expect(sniff(g, 5, 10, 10)).toEqual({ x: 3, y: 10 });
    expect(sniff(g, 12, 10, 10)).toEqual({ x: 15, y: 10 });
    expect(sniff(g, 10, 0, 3)).toBeNull();
  });
});

describe('follow', () => {
  it('eases toward the target without overshooting', () => {
    const p = { x: 0, y: 0 };
    follow(p, { x: 100, y: 0 }, 0.1, 50);
    expect(p.x).toBeGreaterThan(0);
    expect(p.x).toBeLessThanOrEqual(5.0001);
    for (let i = 0; i < 200; i++) follow(p, { x: 100, y: 0 }, 0.1, 50);
    expect(p.x).toBeCloseTo(100, 3);
  });
});

describe('nearestPickup and the bat buddy magnet', () => {
  it('finds the nearest collectable pickup within r', () => {
    const list = [
      createPickup({ x: 50, y: 0, ore: 'coal' }),
      createPickup({ x: 20, y: 0, ore: 'iron', delay: 1 }),
      createPickup({ x: 30, y: 0, ore: 'gold' }),
    ];
    expect(nearestPickup(list, 0, 0, 40).ore).toBe('gold');
    expect(nearestPickup(list, 0, 0, 10)).toBeNull();
  });
  it('a radius multiplier pulls from further away', () => {
    const far = PICKUP.magnetRadius * 1.5;
    const p1 = createPickup({ x: far, y: 0, ore: 'coal' });
    attractPickups([p1], { x: 0, y: 0 }, createBackpack(5), 1 / 60);
    expect(p1.x).toBe(far);
    attractPickups([p1], { x: 0, y: 0 }, createBackpack(5), 1 / 60, 2);
    expect(p1.x).toBeLessThan(far);
  });
});

describe('baby dinosaurs', () => {
  it('a T-rex and a Triceratops hatch like the other pets', () => {
    expect(DINO_KINDS).toEqual(['rex', 'trike']);
    for (const k of DINO_KINDS) expect(PET_KINDS).toContain(k);
    expect(hatch(defaultState(), 'rex').pet).toBe('rex');
  });
  it('the T-rex roar poofs the creatures close by', () => {
    const near = { x: 40, y: 0, w: 10, h: 8 };
    const far = { x: 200, y: 0, w: 10, h: 8 };
    expect(roarTargets([near, far], 0, 0, 80)).toEqual([near]);
  });
});

describe('Magnet Mitts', async () => {
  const { magnetTarget } = await import('../../src/game/pets.js');
  const { createGrid } = await import('../../src/world/grid.js');
  const { B } = await import('../../src/world/blocks.js');
  it('finds the nearest ore your drill can dig, within reach', () => {
    const g = createGrid(12, 12);
    for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) g.set(x, y, B.STONE);
    g.set(5, 5, B.AIR);
    expect(magnetTarget(g, 5, 5, 0, 3)).toBeNull();
    g.set(8, 5, B.COAL_STONE);
    g.set(5, 3, B.IRON);
    expect(magnetTarget(g, 5, 5, 0, 3)).toMatchObject({ x: 5, y: 3, id: B.IRON });
    expect(magnetTarget(g, 5, 5, 0, 1)).toBeNull();
    // only what `ok` accepts
    expect(magnetTarget(g, 5, 5, 0, 3, (id) => id === B.COAL_STONE)).toMatchObject({ x: 8, y: 5 });
  });
});
