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
    expect(state.version).toBe(2);
    expect(state.plots).toHaveLength(6);
  });

  it('round-trips', () => {
    const st = memStorage();
    const s = { ...defaultState(), bank: { ...defaultState().bank, gold: 7 }, plots: ['garden', null, null, null, null, null] };
    expect(saveState(st, s)).toBe(true);
    const { state, status } = loadState(st);
    expect(status).toBe('loaded');
    expect(state).toEqual(s);
  });

  it('migrates a v1 save and keeps unknown fields', () => {
    const v1 = { version: 1, bank: { coal: 3 }, pick: 1, pack: 0, lantern: 2, buildings: ['house'], petName: 'x' };
    const s = migrate(v1);
    expect(s.version).toBe(2);
    expect(s.upgrades).toEqual({ pick: 1, pack: 0, lantern: 2 });
    expect(s.plots).toEqual(['house', null, null, null, null, null]);
    expect(s.bank).toEqual({ coal: 3, iron: 0, gold: 0, diamond: 0, emerald: 0 });
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
