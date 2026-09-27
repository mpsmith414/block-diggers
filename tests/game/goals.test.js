import { describe, it, expect } from 'vitest';
import { nextGoal, oreTopRow, deepestMissing } from '../../src/game/goals.js';
import { defaultState } from '../../src/save/save.js';

const bank = (o) => ({ coal: 0, iron: 0, gold: 0, diamond: 0, emerald: 0, ...o });

describe('nextGoal', () => {
  it('starts with the cheapest thing: the garden, needing coal', () => {
    const g = nextGoal(defaultState());
    expect(g).toMatchObject({ kind: 'blueprint', id: 'garden', missing: { coal: 15 } });
  });
  it('once coal is plentiful, points at what needs iron', () => {
    const s = { ...defaultState(), plots: ['garden', null, null, null, null, null], bank: bank({ coal: 120 }) };
    const g = nextGoal(s);
    expect(Object.keys(g.missing)).toEqual(['iron']);
  });
  it('when something is affordable, that is the goal (go home and get it)', () => {
    const s = { ...defaultState(), bank: bank({ coal: 20 }) };
    expect(nextGoal(s)).toMatchObject({ id: 'garden', missing: {} });
  });
  it('with everything done there is no goal', () => {
    const s = {
      ...defaultState(),
      plots: ['garden', 'house', 'pen', 'tower', 'minecart', 'statue'],
      upgrades: { pick: 5, pack: 4, lantern: 4 },
    };
    expect(nextGoal(s)).toBeNull();
  });
});

describe('oreTopRow', () => {
  it('knows where each ore starts', () => {
    expect(oreTopRow('coal')).toBe(1);
    expect(oreTopRow('iron')).toBe(41);
    expect(oreTopRow('gold')).toBe(41);
    expect(oreTopRow('diamond')).toBe(96);
    expect(oreTopRow('emerald')).toBe(96);
  });
});

describe('the Heart goal', () => {
  it('when the rocket needs the Heart, the arrow points at the bottom of the Core', () => {
    const goal = { kind: 'blueprint', id: 'rocket', missing: { heart: 1, brick: 5 } };
    expect(deepestMissing(goal)).toBe('heart');
    expect(oreTopRow('heart')).toBeGreaterThan(380);
  });
});
