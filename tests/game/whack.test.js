import { describe, it, expect } from 'vitest';
import { createWhack, stepWhack, whack, whackReward } from '../../src/game/whack.js';
import { createRng } from '../../src/world/rng.js';
import { WHACK } from '../../src/tuning.js';

const run = (w, secs, rng = createRng(3)) => {
  const evs = [];
  for (let t = 0; t < secs; t += 1 / 60) evs.push(...stepWhack(w, 1 / 60, rng));
  return evs;
};

describe('whack-a-mole', () => {
  it('moles pop up out of the holes, and hide again if you miss them', () => {
    const w = createWhack();
    const evs = run(w, 5);
    const pops = evs.filter((e) => e.type === 'pop');
    expect(pops.length).toBeGreaterThanOrEqual(3);
    for (const p of pops) expect(p.hole).toBeGreaterThanOrEqual(0);
    for (const p of pops) expect(p.hole).toBeLessThan(WHACK.holes);
    expect(evs.some((e) => e.type === 'hide')).toBe(true);
  });

  it('pops come faster as the round goes on', () => {
    const w = createWhack();
    const evs = [];
    const rng = createRng(8);
    for (let t = 0; t < WHACK.round; t += 1 / 60) for (const e of stepWhack(w, 1 / 60, rng)) evs.push({ ...e, t });
    const pops = evs.filter((e) => e.type === 'pop');
    const early = pops.filter((e) => e.t < WHACK.round / 3).length;
    const late = pops.filter((e) => e.t > (WHACK.round * 2) / 3).length;
    expect(late).toBeGreaterThan(early);
  });

  it('a mole is never popped twice at once', () => {
    const w = createWhack();
    const rng = createRng(5);
    for (let t = 0; t < 20; t += 1 / 60) {
      for (const e of stepWhack(w, 1 / 60, rng)) if (e.type === 'pop') expect(w.holes.filter((h) => h.state === 'up').length).toBeLessThanOrEqual(WHACK.maxUp);
    }
  });

  it('whacking a mole that is up bonks it (a golden one is worth 3); an empty hole is a miss', () => {
    const w = createWhack();
    w.holes[2] = { state: 'up', t: 1, golden: false };
    w.holes[4] = { state: 'up', t: 1, golden: true };
    expect(whack(w, 2)).toEqual({ hit: true, golden: false });
    expect(w.holes[2].state).toBe('bonked');
    expect(whack(w, 2)).toEqual({ hit: false, golden: false }); // already bonked
    expect(whack(w, 0)).toEqual({ hit: false, golden: false });
    expect(whack(w, 4)).toEqual({ hit: true, golden: true });
    expect(w.score).toBe(4);
  });

  it('the round ends when the time runs out, with the score; then it waits before the next', () => {
    const w = createWhack();
    w.score = 7;
    const evs = run(w, WHACK.round + 0.5);
    const end = evs.find((e) => e.type === 'end');
    expect(end).toBeTruthy();
    expect(w.over).toBe(true);
    expect(w.holes.every((h) => h.state !== 'up')).toBe(true);
    const after = run(w, 2);
    expect(after.some((e) => e.type === 'pop')).toBe(false); // (no moles after the whistle)
  });

  it('every bonk gives treasure: gold for a mole, diamonds for a golden mole', () => {
    expect(whackReward(false)).toEqual(['gold']);
    expect(whackReward(true)).toEqual(['diamond', 'diamond', 'diamond']);
  });
});
