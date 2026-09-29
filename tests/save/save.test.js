import { describe, it, expect } from 'vitest';
import { defaultState, loadState, saveState, migrate, SAVE_KEY } from '../../src/save/save.js';

function memStorage(init = {}) {
  const data = { ...init };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
  };
}
const throwing = {
  getItem() { throw new Error('SecurityError'); },
  setItem() { throw new Error('SecurityError'); },
  removeItem() { throw new Error('SecurityError'); },
};

describe('save', () => {
  it('a fresh start is the default state', () => {
    const { state, status } = loadState(memStorage());
    expect(status).toBe('new');
    expect(state).toEqual(defaultState());
    expect(state.version).toBe(5);
    expect(state.plots).toHaveLength(9);
  });

  it('round-trips', () => {
    const st = memStorage();
    const s = { ...defaultState(), bank: { ...defaultState().bank, gold: 7 }, plots: ['garden', null, null, null, null, null, null, null, null] };
    expect(saveState(st, s)).toBe(true);
    const { state, status } = loadState(st);
    expect(status).toBe('loaded');
    expect(state).toEqual(s);
  });

  it('migrates a v1 save and keeps unknown fields', () => {
    const v1 = { version: 1, bank: { coal: 3 }, pick: 1, pack: 0, lantern: 2, buildings: ['house'], petName: 'x' };
    const s = migrate(v1);
    expect(s.version).toBe(5);
    expect(s.upgrades).toEqual({ pick: 1, pack: 0, lantern: 2 });
    expect(s.plots).toEqual(['house', null, null, null, null, null, null, null, null]);
    expect(s.bank).toEqual({ coal: 3, iron: 0, gold: 0, diamond: 0, emerald: 0, amber: 0, brick: 0, star: 0, heart: 0, cheese: 0, moonstone: 0, spacegem: 0, gizmo: 0 });
    expect(s.petName).toBe('x');
    const st = memStorage({ [SAVE_KEY]: JSON.stringify(v1) });
    expect(loadState(st).status).toBe('migrated');
  });

  it('a corrupt save is kept aside and the game starts fresh', () => {
    const st = memStorage({ [SAVE_KEY]: '{not json' });
    const { state, status } = loadState(st);
    expect(status).toBe('corrupt');
    expect(state).toEqual(defaultState());
    expect(st.data[`${SAVE_KEY}-corrupt`]).toBe('{not json');
  });

  it('storage that throws falls back to memory without crashing', () => {
    const { state, status } = loadState(throwing);
    expect(status).toBe('unavailable');
    expect(state).toEqual(defaultState());
    expect(saveState(throwing, state)).toBe(false);
  });

  it('missing storage entirely also works', () => {
    expect(loadState(undefined).status).toBe('unavailable');
    expect(saveState(undefined, defaultState())).toBe(false);
  });
});

describe('save v3', () => {
  it('migrates a v2 save: keeps progress and adds the new defaults', () => {
    const v2 = {
      version: 2, bank: { coal: 5, iron: 1, gold: 0, diamond: 0, emerald: 0 }, upgrades: { pick: 1, pack: 0, lantern: 1 },
      plots: ['garden', null, null, null, null, null], characters: ['fox', 'dino'], trips: 7, muted: true,
    };
    const s = migrate(v2);
    expect(s.version).toBe(5);
    expect(s.bank.coal).toBe(5);
    expect(s.plots[0]).toBe('garden');
    expect(s.trips).toBe(7);
    expect(s.muted).toBe(true);
    expect(s.records).toEqual({ deepest: 0, mostOres: 0, layers: [], moonTrips: 0, planetDeepest: {} });
    expect(s.stickers).toEqual({});
    expect(s.pets).toEqual([]);
    expect(s.decor).toEqual({ stock: {}, placed: [] });
    expect(s.garden).toEqual({ stock: 0 });
    expect(s.pen).toEqual({ gifts: 0 });
    expect(s.visitors).toEqual({ met: [], requests: {}, seen: [] });
    expect(s.trophiesAwarded).toEqual([]);
  });
  it('a v3 save round-trips unchanged', () => {
    const st = memStorage();
    const s = { ...defaultState(), stickers: { 'ore-coal': true }, pets: ['mole'], decor: { stock: { lamp: 1 }, placed: [{ id: 'fence', x: 700 }] } };
    saveState(st, s);
    expect(loadState(st)).toEqual({ state: s, status: 'loaded' });
  });
});

describe('save v4: the deeper world', () => {
  it('a 6-plot save grows to 9 plots and keeps its buildings', () => {
    const s = migrate({ ...defaultState(), version: 3, plots: ['garden', 'house', null, 'pen', null, 'statue'] });
    expect(s.plots).toEqual(['garden', 'house', null, 'pen', null, 'statue', null, null, null]);
  });
  it('an older save knows the layers it has already reached (for the elevator)', () => {
    const s = migrate({ ...defaultState(), version: 3, records: { deepest: 150, mostOres: 30 } });
    expect(s.records.layers).toEqual(['dirt', 'stone', 'deep', 'crystal']);
  });
});

describe('save v5 (the planets)', () => {
  it('a v4 save lands on Earth with an empty Moon Base, no suit, and keeps its cheese', () => {
    const v4 = { version: 4, bank: { coal: 2, cheese: 7, heart: 1 }, plots: ['garden'], records: { deepest: 300, mostOres: 9, layers: ['dirt'], moonTrips: 3 } };
    const s = migrate(v4);
    expect(s.version).toBe(5);
    expect(s.planet).toBe('earth');
    expect(s.bases.moon.plots).toEqual([null, null, null, null]);
    expect(s.suit).toEqual([]);
    expect(s.bank.cheese).toBe(7);
    expect(s.bank.moonstone).toBe(0);
    expect(s.bank.heart).toBe(1);
    expect(s.records.planetDeepest).toEqual({});
    expect(s.records.moonTrips).toBe(3);
  });

  it('the old moon-cheese sticker becomes the cheese ore sticker', () => {
    const s = migrate({ version: 4, stickers: { 'moon-cheese': true, 'ore-coal': true } });
    expect(s.stickers).toEqual({ 'ore-cheese': true, 'ore-coal': true });
  });

  it('a v5 save round-trips: planet, Moon plots and suit are kept', () => {
    const store = new Map();
    const storage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
    const s = { ...defaultState(), planet: 'moon', bases: { moon: { plots: ['telescope', null, 'hangar', null] } }, suit: ['helmet'] };
    saveState(storage, s);
    const { state, status } = loadState(storage);
    expect(status).toBe('loaded');
    expect(state.planet).toBe('moon');
    expect(state.bases.moon.plots).toEqual(['telescope', null, 'hangar', null]);
    expect(state.suit).toEqual(['helmet']);
  });
});
