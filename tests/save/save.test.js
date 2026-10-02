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
    expect(state.version).toBe(12);
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
    expect(s.version).toBe(12);
    expect(s.upgrades).toEqual({ pick: 1, pack: 0, lantern: 2 });
    expect(s.plots).toEqual(['house', null, null, null, null, null, null, null, null]);
    expect(s.bank).toEqual({ coal: 3, iron: 0, gold: 0, diamond: 0, emerald: 0, amber: 0, brick: 0, star: 0, heart: 0, cheese: 0, moonstone: 0, spacegem: 0, gizmo: 0, ruby: 0, bolt: 0, opal: 0, coin: 0, frost: 0, icecream: 0, pearl: 0, comet: 0, jade: 0, bone: 0, tooth: 0, obsidian: 0, sunstone: 0, flare: 0, plasma: 0, nova: 0, sparkle: 0 });
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
    expect(s.version).toBe(12);
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
    expect(s.version).toBe(12);
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

describe('save v6 (Mars)', () => {
  it('a v5 save gets an empty Mars Base and the Mars ores, keeping everything', () => {
    const v5 = {
      ...defaultState(), version: 5, planet: 'moon', suit: ['helmet'],
      bank: { coal: 1, moonstone: 40, gizmo: 3, heart: 0, cheese: 2 },
      bases: { moon: { plots: ['cheesefactory', 'telescope', 'hangar', 'marsrocket'] } },
      records: { deepest: 380, mostOres: 90, layers: ['dirt', 'craters'], moonTrips: 12, planetDeepest: { moon: 250 } },
    };
    delete v5.bases.mars;
    const s = migrate(v5);
    expect(s.version).toBe(12);
    expect(s.planet).toBe('moon');
    expect(s.bases.moon.plots).toEqual(['cheesefactory', 'telescope', 'hangar', 'marsrocket']);
    expect(s.bases.mars.plots).toEqual([null, null, null, null]);
    expect(s.bank).toMatchObject({ coal: 1, moonstone: 40, gizmo: 3, cheese: 2, ruby: 0, bolt: 0, opal: 0, coin: 0, frost: 0, icecream: 0, pearl: 0, comet: 0, jade: 0, bone: 0, tooth: 0, obsidian: 0, sunstone: 0, flare: 0, plasma: 0, nova: 0 });
    expect(s.records.planetDeepest).toEqual({ moon: 250 });
    expect(s.suit).toEqual(['helmet']);
  });

  it('a v6 save round-trips with its Mars Base', () => {
    const st = memStorage();
    const s = { ...defaultState(), planet: 'mars', bases: { moon: { plots: [null, null, null, 'marsrocket'] }, mars: { plots: ['weather', null, null, null] }, saturn: { plots: [null, null, null, null] }, dino: { plots: [null, null, null, null] }, sun: { plots: [null, null, null, null, null] }, rainbow: { plots: [null, null, null, null], decor: { stock: {}, placed: [] } } }, suit: ['helmet', 'boots'] };
    saveState(st, s);
    expect(loadState(st)).toEqual({ state: s, status: 'loaded' });
  });
});

describe('save v7 (Saturn)', () => {
  it('a v6 save gets an empty Ring Station and the Saturn ores, keeping everything', () => {
    const v6 = { ...defaultState(), version: 6, planet: 'mars', suit: ['helmet', 'boots'], bank: { ruby: 12, coin: 3 }, bases: { moon: { plots: [null, null, null, 'marsrocket'] }, mars: { plots: ['weather', null, null, 'saturnrocket'] } } };
    const s = migrate(v6);
    expect(s.version).toBe(12);
    expect(s.planet).toBe('mars');
    expect(s.bases.mars.plots).toEqual(['weather', null, null, 'saturnrocket']);
    expect(s.bases.saturn.plots).toEqual([null, null, null, null]);
    expect(s.bank).toMatchObject({ ruby: 12, coin: 3, frost: 0, icecream: 0, pearl: 0, comet: 0, jade: 0, bone: 0, tooth: 0, obsidian: 0, sunstone: 0, flare: 0, plasma: 0, nova: 0 });
    expect(s.suit).toEqual(['helmet', 'boots']);
  });
});

describe('save v8 (Dino Planet)', () => {
  it('a v7 save gets an empty Dino Camp and the Dino ores, keeping everything', () => {
    const v7 = { ...defaultState(), version: 7, planet: 'saturn', suit: ['helmet', 'boots', 'gloves'], bank: { frost: 12, comet: 3 }, bases: { saturn: { plots: ['parlour', null, null, 'dinorocket'] } } };
    const s = migrate(v7);
    expect(s.version).toBe(12);
    expect(s.bases.saturn.plots).toEqual(['parlour', null, null, 'dinorocket']);
    expect(s.bases.dino.plots).toEqual([null, null, null, null]);
    expect(s.bank).toMatchObject({ frost: 12, comet: 3, jade: 0, bone: 0, tooth: 0, obsidian: 0, sunstone: 0, flare: 0, plasma: 0, nova: 0 });
    expect(s.suit).toEqual(['helmet', 'boots', 'gloves']);
  });
});

describe('save v9 (the Sun)', () => {
  it('a v8 save gets an empty Solar Station, the Sun ores and no Sun’s Heart yet, keeping everything', () => {
    const v8 = { ...defaultState(), version: 8, planet: 'dino', suit: ['helmet', 'boots', 'gloves', 'jetpack'], bank: { jade: 12, tooth: 3 }, bases: { dino: { plots: ['nursery', null, null, 'sunrocket'] } } };
    delete v8.sunHeart;
    const s = migrate(v8);
    expect(s.version).toBe(12);
    expect(s.bases.dino.plots).toEqual(['nursery', null, null, 'sunrocket']);
    expect(s.bases.sun.plots).toEqual([null, null, null, null, null]);
    expect(s.sunHeart).toBe(false);
    expect(s.bank).toMatchObject({ jade: 12, tooth: 3, sunstone: 0, flare: 0, plasma: 0, nova: 0 });
    expect(s.suit).toEqual(['helmet', 'boots', 'gloves', 'jetpack']);
  });
});

describe('save v10: the Build Yard', () => {
  it('a v9 save gets an empty Build Yard, keeping everything', async () => {
    const { migrate } = await import('../../src/save/save.js');
    const s = migrate({ version: 9, trips: 12, bank: { coal: 3 }, stickers: { 'ore-coal': true } });
    expect(s.version).toBe(12);
    expect(s.build).toEqual({ edits: [] });
    expect(s.trips).toBe(12);
    expect(s.bank.coal).toBe(3);
    const kept = migrate({ ...s, build: { edits: [[5, 20, 30]], placed: 1 } });
    expect(kept.build).toEqual({ edits: [[5, 20, 30]], placed: 1 });
  });
});

describe('save v12: gear', () => {
  it('a v11 save wears the Sun Suit pieces it had, on both players, and gets an empty Rainbow Village', () => {
    const v11 = { ...defaultState(), version: 11, suit: ['helmet', 'boots', 'jetpack', 'crown'], bank: { sparkle: 40 } };
    delete v11.gear;
    delete v11.bases.rainbow;
    const s = migrate(v11);
    expect(s.version).toBe(12);
    const worn = { head: 'helmet', back: 'jetpack', feet: 'boots', hands: null };
    expect(s.gear).toEqual({ owned: [], worn: [worn, worn] });
    expect(s.bases.rainbow).toEqual({ plots: [null, null, null, null], decor: { stock: {}, placed: [] } });
    expect(s.bank.sparkle).toBe(40);
  });
  it('the crown goes on when there is no helmet; no suit means nothing worn', () => {
    expect(migrate({ ...defaultState(), version: 11, suit: ['crown'] }).gear.worn[0].head).toBe('crown');
    const bare = migrate({ version: 11, trips: 3 });
    expect(bare.gear.worn[1]).toEqual({ head: null, back: null, feet: null, hands: null });
  });
  it('a v12 save round-trips its gear and Rainbow Village', () => {
    const s = { ...defaultState(), gear: { owned: ['glider'], worn: [{ head: null, back: 'glider', feet: null, hands: null }, { head: 'partyhat', back: null, feet: null, hands: null }] } };
    s.bases.rainbow = { plots: ['hatshop', null, null, null], decor: { stock: { lollipop: 2 }, placed: [{ id: 'gumdrop', x: 300 }] } };
    const back = migrate(JSON.parse(JSON.stringify(s)));
    expect(back.gear).toEqual(s.gear);
    expect(back.bases.rainbow).toEqual(s.bases.rainbow);
  });
});
