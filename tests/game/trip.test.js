import { describe, it, expect } from 'vitest';
import { summarizeTrip, layersReached, discovery } from '../../src/game/trip.js';

const zero = { coal: 0, iron: 0, gold: 0, diamond: 0, emerald: 0, amber: 0, brick: 0, star: 0, moonstone: 0, cheese: 0, spacegem: 0, gizmo: 0, ruby: 0, bolt: 0, opal: 0, coin: 0, frost: 0, icecream: 0, pearl: 0, comet: 0 };

describe('summarizeTrip', () => {
  it('adds up every player and reports new records', () => {
    const r = summarizeTrip(
      { packs: [{ ...zero, coal: 5, gold: 1 }, { ...zero, iron: 3 }], deepest: 60, chests: 1, stickers: ['ore-gold'] },
      { deepest: 40, mostOres: 20 },
    );
    expect(r.totals).toEqual({ ...zero, coal: 5, iron: 3, gold: 1 });
    expect(r.count).toBe(9);
    expect(r.best).toEqual({ deepest: true, mostOres: false });
    expect(r.records).toMatchObject({ deepest: 60, mostOres: 20 });
    expect(r.chests).toBe(1);
    expect(r.stickers).toEqual(['ore-gold']);
  });
  it('a tie is not a record', () => {
    const r = summarizeTrip({ packs: [{ ...zero, coal: 20 }], deepest: 40, chests: 0, stickers: [] }, { deepest: 40, mostOres: 20 });
    expect(r.best).toEqual({ deepest: false, mostOres: false });
  });
  it('handles missing packs (an empty slot)', () => {
    const r = summarizeTrip({ packs: [undefined, { ...zero, coal: 1 }], deepest: 0, chests: 0, stickers: [] }, { deepest: 0, mostOres: 0 });
    expect(r.count).toBe(1);
    expect(r.best.mostOres).toBe(true);
  });
});

describe('layers reached', () => {
  it('lists every layer down to the deepest row', () => {
    expect(layersReached(0)).toEqual([]);
    expect(layersReached(30)).toEqual(['dirt']);
    expect(layersReached(200)).toEqual(['dirt', 'stone', 'deep', 'crystal', 'dino']);
    expect(layersReached(388)).toHaveLength(8);
  });
  it('the summary keeps the old records (layers, moon trips) and adds the new layers', () => {
    const r = summarizeTrip(
      { packs: [], deepest: 250, chests: 0, stickers: [] },
      { deepest: 100, mostOres: 5, layers: ['dirt', 'stone', 'deep'], moonTrips: 2 },
    );
    expect(r.records.moonTrips).toBe(2);
    expect(r.records.layers).toEqual(['dirt', 'stone', 'deep', 'crystal', 'dino', 'brick']);
    // a shallow trip never forgets deeper layers
    const r2 = summarizeTrip({ packs: [], deepest: 10, chests: 0, stickers: [] }, r.records);
    expect(r2.records.layers).toEqual(r.records.layers);
  });
});

describe('discovery', () => {
  it('the four deep layers each get a banner the first time you reach them', () => {
    expect(discovery(200, [])).toBe('dino');
    expect(discovery(200, ['dino'])).toBeNull();
    expect(discovery(260, ['dino'])).toBe('brick');
    expect(discovery(300, [])).toBe('meteor');
    expect(discovery(350, [])).toBe('core');
  });
  it('the old layers have no banner', () => {
    expect(discovery(20, [])).toBeNull();
    expect(discovery(160, [])).toBeNull();
  });
});

describe('a trip to the Moon', () => {
  it('counts a moon trip, and moon depth is not an Earth depth record', () => {
    const records = { deepest: 200, mostOres: 5, layers: ['dirt'], moonTrips: 1 };
    const r = summarizeTrip({ packs: [], deepest: 90, chests: 0, stickers: [], planet: 'moon' }, records);
    expect(r.records.moonTrips).toBe(2);
    expect(r.records.deepest).toBe(200);
    expect(r.records.layers).toEqual(['dirt', 'stone', 'deep', 'crystal', 'dino', 'craters', 'cheesecaves']);
    expect(r.records.planetDeepest).toEqual({ moon: 90 });
    expect(r.moon).toBe(true);
  });
});
