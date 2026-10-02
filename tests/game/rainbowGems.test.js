import { describe, it, expect } from 'vitest';
import { gemInfo, hitGem, crackStage } from '../../src/game/rainbowGems.js';

describe('Rainbow Planet: gems', () => {
  it('come in four sizes, the bigger the more hits and the more sparkles', () => {
    expect(gemInfo('tiny')).toMatchObject({ cells: 1, hits: 1, sparkles: 1, count: [40, 60] });
    expect(gemInfo('chunky')).toMatchObject({ cells: 2, hits: 2, sparkles: 6, count: [12, 18] });
    expect(gemInfo('big')).toMatchObject({ cells: 4, hits: 5, sparkles: 30, count: [3, 5] });
    expect(gemInfo('massive')).toMatchObject({ cells: 8, hits: 12, sparkles: 150, count: [1, 2] });
  });

  it('a chunky gem breaks on the second hit; a massive one on the twelfth', () => {
    const chunky = { size: 'chunky', hits: 2 };
    expect(hitGem(chunky)).toEqual({ broken: false, hitsLeft: 1 });
    expect(hitGem(chunky)).toEqual({ broken: true, hitsLeft: 0 });
    const massive = { size: 'massive', hits: 12 };
    for (let i = 0; i < 11; i++) expect(hitGem(massive).broken).toBe(false);
    expect(hitGem(massive).broken).toBe(true);
  });

  it('the cracks spread as it gets hit', () => {
    const g = { size: 'massive', hits: 12 };
    expect(crackStage(g)).toBe(0);
    for (let i = 0; i < 6; i++) hitGem(g);
    expect(crackStage(g)).toBe(2);
    for (let i = 0; i < 5; i++) hitGem(g);
    expect(crackStage(g)).toBe(3);
  });
});
