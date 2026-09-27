import { describe, it, expect } from 'vitest';
import { createRng } from '../../src/world/rng.js';

describe('createRng', () => {
  it('gives the same sequence for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });
  it('gives different sequences for different seeds', () => {
    expect(createRng(1).next()).not.toBe(createRng(2).next());
  });
  it('next() stays in [0, 1)', () => {
    const r = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('int(lo, hi) is inclusive and hits both ends', () => {
    const r = createRng(3);
    const seen = new Set();
    for (let i = 0; i < 500; i++) {
      const v = r.int(2, 5);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(5);
      seen.add(v);
    }
    expect([...seen].sort()).toEqual([2, 3, 4, 5]);
  });
  it('pick and chance', () => {
    const r = createRng(9);
    expect(['a', 'b']).toContain(r.pick(['a', 'b']));
    expect(r.chance(0)).toBe(false);
    expect(r.chance(1)).toBe(true);
  });
  it('weighted picks by weight', () => {
    const r = createRng(11);
    const counts = { a: 0, b: 0 };
    for (let i = 0; i < 2000; i++) counts[r.weighted({ a: 3, b: 1 })]++;
    expect(counts.a).toBeGreaterThan(counts.b * 2);
    expect(counts.b).toBeGreaterThan(0);
  });
});
