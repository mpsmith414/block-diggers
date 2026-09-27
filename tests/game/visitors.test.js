import { describe, it, expect } from 'vitest';
import { VISITORS, presentVisitors, makeRequest, refreshRequests, fulfill } from '../../src/game/visitors.js';
import { defaultState } from '../../src/save/save.js';
import { createRng } from '../../src/world/rng.js';

const built = (n) => ({ ...defaultState(), plots: ['garden', 'house', 'pen', 'tower', 'minecart', 'statue'].map((id, i) => (i < n ? id : null)) });

describe('visitors', () => {
  it('arrive as the camp grows: bear at 2 buildings, rabbit at 4, owl at 6', () => {
    expect(VISITORS.map((v) => v.id)).toEqual(['bear', 'rabbit', 'owl']);
    expect(presentVisitors(built(1))).toEqual([]);
    expect(presentVisitors(built(2))).toEqual(['bear']);
    expect(presentVisitors(built(4))).toEqual(['bear', 'rabbit']);
    expect(presentVisitors(built(6))).toEqual(['bear', 'rabbit', 'owl']);
  });

  it('only ask for ores you have found, in sensible amounts', () => {
    const rng = createRng(2);
    const s = { ...built(2), stickers: { 'ore-coal': true, 'ore-diamond': true } };
    for (let i = 0; i < 40; i++) {
      const r = makeRequest(s, rng);
      expect(['coal', 'diamond']).toContain(r.ore);
      if (r.ore === 'coal') { expect(r.n).toBeGreaterThanOrEqual(5); expect(r.n).toBeLessThanOrEqual(15); }
      else { expect(r.n).toBeGreaterThanOrEqual(3); expect(r.n).toBeLessThanOrEqual(6); }
    }
    expect(makeRequest({ ...built(2), stickers: {} }, rng).ore).toBe('coal');
  });

  it('refreshRequests gives every present visitor a request', () => {
    const s = refreshRequests({ ...built(4), stickers: { 'ore-iron': true } }, createRng(3));
    expect(Object.keys(s.visitors.requests).sort()).toEqual(['bear', 'rabbit']);
  });

  it('fulfilling spends the ores, marks them met, clears the request and gives a reward', () => {
    const rng = createRng(4);
    let s = { ...built(6), bank: { coal: 20, iron: 0, gold: 0, diamond: 0, emerald: 0 } };
    s = { ...s, visitors: { met: [], requests: { bear: { ore: 'coal', n: 10 }, rabbit: { ore: 'coal', n: 5 }, owl: { ore: 'coal', n: 5 } } } };
    const bear = fulfill(s, 'bear', rng);
    expect(bear.state.bank.coal).toBe(10);
    expect(bear.state.bank.diamond).toBe(3);
    expect(bear.reward).toEqual({ kind: 'ore', ore: 'diamond', n: 3 });
    expect(bear.state.visitors.met).toEqual(['bear']);
    expect(bear.state.visitors.requests.bear).toBeUndefined();
    const rabbit = fulfill(bear.state, 'rabbit', rng);
    expect(rabbit.reward.kind).toBe('decor');
    expect(rabbit.reward.id.startsWith('trophy')).toBe(false);
    expect(rabbit.state.decor.stock[rabbit.reward.id]).toBe(1);
    const owl = fulfill({ ...rabbit.state, pets: ['mole'] }, 'owl', rng);
    expect(owl.reward.kind).toBe('egg');
    expect(['glowbug', 'batbuddy']).toContain(owl.reward.egg);
    const owl2 = fulfill({ ...rabbit.state, pets: ['mole', 'glowbug', 'batbuddy'] }, 'owl', rng);
    expect(owl2.reward.egg).toBe('golden');
  });

  it('not enough ore, or no request: nothing happens', () => {
    const s = { ...built(2), visitors: { met: [], requests: { bear: { ore: 'gold', n: 5 } } } };
    expect(fulfill(s, 'bear', createRng(1))).toBeNull();
    expect(fulfill({ ...s, visitors: { met: [], requests: {} } }, 'bear', createRng(1))).toBeNull();
  });
});
