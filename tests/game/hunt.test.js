import { describe, it, expect } from 'vitest';
import {
  HUNT_TREASURES, STATUE, TREASURE_NAMES, huntOf, placeX, mapStatus, buyMap, checkPassed, openChest, newlyFound, markShown, hasStatue, allTreasures,
} from '../../src/game/hunt.js';
import { layerOfRow } from '../../src/world/rainbow.js';
import { createRng } from '../../src/world/rng.js';
import { defaultState } from '../../src/save/save.js';
import { HUNT, RAINBOW, MINE_W } from '../../src/tuning.js';

const rich = (sparkle = 1000, extra = {}) => ({ ...defaultState(), bank: { ...defaultState().bank, sparkle }, ...extra });

describe('the treasures', () => {
  it('twelve of them, each with a name', () => {
    expect(HUNT_TREASURES).toHaveLength(12);
    expect(new Set(HUNT_TREASURES).size).toBe(12);
    for (const t of [...HUNT_TREASURES, STATUE]) expect(TREASURE_NAMES[t]).toMatch(/^[A-Z ]+$/);
  });
  it('an empty hunt to start', () => {
    expect(huntOf({})).toEqual({ map: null, found: [], shown: [] });
  });
});

describe('placing the X', () => {
  it('3-5 layers below your deepest layer, inside the layer, away from the sides', () => {
    const rng = createRng(7);
    for (const deepest of [0, 2, 29, 30, 100, 1234]) {
      for (let i = 0; i < 50; i++) {
        const { row, col } = placeX(rng, deepest);
        const down = layerOfRow(row) - layerOfRow(deepest);
        expect(down).toBeGreaterThanOrEqual(HUNT.layers[0]);
        expect(down).toBeLessThanOrEqual(HUNT.layers[1]);
        const inLayer = row % RAINBOW.layerRows;
        expect(inLayer).toBeGreaterThanOrEqual(HUNT.inLayer[0]);
        expect(inLayer).toBeLessThanOrEqual(HUNT.inLayer[1]);
        expect(col).toBeGreaterThanOrEqual(HUNT.edge);
        expect(col).toBeLessThanOrEqual(MINE_W - 1 - HUNT.edge);
      }
    }
  });
});

describe('buying a map', () => {
  it('costs 100 sparkles and marks an X below your deepest', () => {
    const s = rich(250, { rainbow: { deepest: 95 } });
    expect(mapStatus(s)).toBe('ok');
    const next = buyMap(s, createRng(1));
    expect(next.bank.sparkle).toBe(150);
    expect(next.hunt.map.golden).toBe(false);
    expect(layerOfRow(next.hunt.map.row) - layerOfRow(95)).toBeGreaterThanOrEqual(3);
  });
  it('one map at a time', () => {
    const s = buyMap(rich(), createRng(1));
    expect(mapStatus(s)).toBe('have');
    expect(buyMap(s, createRng(2))).toBeNull();
  });
  it('not without the sparkles', () => {
    const s = rich(99);
    expect(mapStatus(s)).toBe('poor');
    expect(buyMap(s, createRng(1))).toBeNull();
  });
  it('a golden map once all twelve treasures are found (until the statue is)', () => {
    const all = { map: null, found: [...HUNT_TREASURES], shown: [] };
    expect(buyMap(rich(1000, { hunt: all }), createRng(1)).hunt.map.golden).toBe(true);
    expect(buyMap(rich(1000, { hunt: { ...all, found: [...HUNT_TREASURES, STATUE] } }), createRng(1)).hunt.map.golden).toBe(false);
  });
});

describe('digging past the X', () => {
  const hunt = { map: { row: 200, col: 10, golden: false }, found: [], shown: [] };
  it('the X waits while you are above it (or level with it)', () => {
    expect(checkPassed(hunt, 150, createRng(1))).toBe(hunt);
    expect(checkPassed(hunt, 200, createRng(1))).toBe(hunt);
    const none = huntOf({});
    expect(checkPassed(none, 999, createRng(1))).toBe(none);
  });
  it('once you are below it, it moves 3-5 layers below you (and stays golden if it was)', () => {
    const moved = checkPassed({ ...hunt, map: { ...hunt.map, golden: true } }, 260, createRng(3));
    expect(layerOfRow(moved.map.row) - layerOfRow(260)).toBeGreaterThanOrEqual(3);
    expect(moved.map.golden).toBe(true);
  });
});

describe('opening the chest', () => {
  it('twelve chests give the twelve treasures, never twice, with 150-250 sparkles each', () => {
    const rng = createRng(11);
    let hunt = huntOf({});
    for (let i = 0; i < 12; i++) {
      const r = openChest({ ...hunt, map: { row: 1, col: 1, golden: false } }, rng);
      expect(HUNT_TREASURES).toContain(r.prize);
      expect(hunt.found).not.toContain(r.prize);
      expect(r.sparkles).toBeGreaterThanOrEqual(HUNT.chest[0]);
      expect(r.sparkles).toBeLessThanOrEqual(HUNT.chest[1]);
      expect(r.hunt.map).toBeNull();
      hunt = r.hunt;
    }
    expect(allTreasures(hunt)).toBe(true);
    // then the golden map: the statue, and a bigger pile
    const grand = openChest({ ...hunt, map: { row: 1, col: 1, golden: true } }, rng);
    expect(grand.prize).toBe(STATUE);
    expect(grand.sparkles).toBeGreaterThanOrEqual(HUNT.golden[0]);
    expect(hasStatue(grand.hunt)).toBe(true);
    // after that: sparkles only
    const after = openChest({ ...grand.hunt, map: { row: 1, col: 1, golden: false } }, rng);
    expect(after.prize).toBeNull();
    expect(after.sparkles).toBeGreaterThanOrEqual(HUNT.golden[0]);
    expect(after.sparkles).toBeLessThanOrEqual(HUNT.golden[1]);
    expect(after.hunt.found).toHaveLength(13);
  });
  it('no map, no chest', () => {
    expect(openChest(huntOf({}), createRng(1))).toBeNull();
  });
});

describe('the hall', () => {
  it('knows which treasures are new since your last visit', () => {
    const hunt = { map: null, found: ['crown', 'duck', 'pearl'], shown: ['crown'] };
    expect(newlyFound(hunt)).toEqual(['duck', 'pearl']);
    expect(newlyFound(markShown(hunt))).toEqual([]);
  });
});

describe('save v13', async () => {
  const { migrate, VERSION } = await import('../../src/save/save.js');
  const { plotsOf, blueprintsFor } = await import('../../src/game/economy.js');
  const { STICKER_PAGES, stickerById } = await import('../../src/game/stickers.js');
  it('a v12 save gets an empty hunt and a fifth village plot, keeping its shops', () => {
    const v12 = { ...defaultState(), version: 12, bank: { sparkle: 900 }, bases: { rainbow: { plots: ['hatshop', 'shoeshop', 'gadgetlab', 'decoshop'], decor: { stock: { gumdrop: 1 }, placed: [] } } } };
    delete v12.hunt;
    const s = migrate(v12);
    expect(s.version).toBe(VERSION);
    expect(VERSION).toBe(13);
    expect(s.hunt).toEqual({ map: null, found: [], shown: [] });
    expect(plotsOf(s, 'rainbow')).toEqual(['hatshop', 'shoeshop', 'gadgetlab', 'decoshop', null]);
    expect(s.bases.rainbow.decor.stock.gumdrop).toBe(1);
    expect(s.bank.sparkle).toBe(900);
  });
  it('a hunt in progress survives a load', () => {
    const hunt = { map: { row: 300, col: 9, golden: false }, found: ['duck'], shown: [] };
    expect(migrate({ ...defaultState(), hunt }).hunt).toEqual(hunt);
  });
  it('the Treasure Hall costs 500 sparkles', () => {
    expect(blueprintsFor('rainbow').find((b) => b.id === 'treasurehall').cost).toEqual({ sparkle: HUNT.hall });
  });
  it('a sticker for every treasure and the statue', () => {
    for (const t of [...HUNT_TREASURES, STATUE]) expect(stickerById(`hunt-${t}`)).toBeTruthy();
    expect(STICKER_PAGES.find((p) => p.name === 'rainbowtreasures').stickers).toHaveLength(12);
  });
});
