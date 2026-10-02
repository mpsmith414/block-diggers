import { describe, it, expect } from 'vitest';
import { shownOres, BASE_ORES } from '../../src/game/ores.js';
import { ORES, B } from '../../src/world/blocks.js';
import { mineTime } from '../../src/world/grid.js';
import { UPGRADES } from '../../src/game/economy.js';
import { oreTopRow } from '../../src/game/goals.js';
import { defaultState, migrate } from '../../src/save/save.js';
import { BACKPACK, LANTERN } from '../../src/tuning.js';

describe('the deeper ores', () => {
  it('the first 5 ores are always shown on Earth, the rest once found', () => {
    expect(ORES).toEqual(['coal', 'iron', 'gold', 'diamond', 'emerald', 'amber', 'brick', 'star', 'moonstone', 'cheese', 'spacegem', 'gizmo', 'ruby', 'bolt', 'opal', 'coin', 'frost', 'icecream', 'pearl', 'comet', 'jade', 'bone', 'tooth', 'obsidian', 'sunstone', 'flare', 'plasma', 'nova']);
    expect(BASE_ORES).toEqual(ORES.slice(0, 5));
    expect(shownOres(defaultState())).toEqual(BASE_ORES);
    const s = { ...defaultState(), stickers: { 'ore-brick': true } };
    expect(shownOres(s)).toEqual([...BASE_ORES, 'brick']);
  });
  it('each deeper rock needs the next tool', () => {
    const tiers = (id) => [0, 1, 2, 3, 4, 5].map((p) => mineTime(id, p) !== Infinity);
    expect(tiers(B.SAND)).toEqual([false, false, true, true, true, true]);
    expect(tiers(B.BRICKS)).toEqual([false, false, false, true, true, true]);
    expect(tiers(B.METEOR)).toEqual([false, false, false, false, true, true]);
    expect(tiers(B.CORE)).toEqual([false, false, false, false, false, true]);
    expect(mineTime(B.AMBER, 2)).toBe(mineTime(B.SAND, 2));
    expect(mineTime(B.STAR, 4)).toBe(mineTime(B.METEOR, 4));
    // better tools are faster on old rock too
    expect(mineTime(B.STONE, 5)).toBeLessThan(mineTime(B.STONE, 2));
  });
  it('tool, backpack and lantern tiers 3-5 cost the new ores', () => {
    expect(UPGRADES.pick.slice(0, 5)).toEqual([
      { iron: 10, coal: 5 }, { diamond: 5, gold: 10 },
      { amber: 10, diamond: 5 }, { brick: 20, amber: 10 }, { star: 10, brick: 20 },
    ]);
    expect(UPGRADES.pack.slice(2, 4)).toEqual([{ amber: 10, diamond: 10 }, { brick: 20, star: 5 }]);
    expect(UPGRADES.lantern.slice(2, 4)).toEqual([{ amber: 10, emerald: 5 }, { brick: 10, star: 5 }]);
    expect(BACKPACK).toEqual([30, 60, 120, 180, 250, 320, 400, 500, 620, 750]);
    expect(LANTERN).toEqual([3, 5, 7, 9, 11, 13, 15, 17, 19, 21]);
  });
  it('the goal arrow knows where the new ores start', () => {
    expect([oreTopRow('amber'), oreTopRow('brick'), oreTopRow('star')]).toEqual([189, 239, 289]);
  });
});

describe('save v4', () => {
  it('adds the new bank keys and records, keeping everything else', () => {
    const v3 = { version: 3, bank: { coal: 4, iron: 0, gold: 0, diamond: 0, emerald: 2 }, stickers: { 'ore-coal': true }, records: { deepest: 60, mostOres: 20 } };
    const s = migrate(v3);
    expect(s.version).toBe(12);
    expect(s.bank).toEqual({ coal: 4, iron: 0, gold: 0, diamond: 0, emerald: 2, amber: 0, brick: 0, star: 0, heart: 0, cheese: 0, moonstone: 0, spacegem: 0, gizmo: 0, ruby: 0, bolt: 0, opal: 0, coin: 0, frost: 0, icecream: 0, pearl: 0, comet: 0, jade: 0, bone: 0, tooth: 0, obsidian: 0, sunstone: 0, flare: 0, plasma: 0, nova: 0, sparkle: 0 });
    expect(s.records).toEqual({ deepest: 60, mostOres: 20, layers: ['dirt', 'stone'], moonTrips: 0, planetDeepest: {} });
    expect(s.stickers).toEqual({ 'ore-coal': true });
  });
});
