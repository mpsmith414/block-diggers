import { describe, it, expect } from 'vitest';
import { dragonLevel, flyVelocity, DRAGON, FLY } from '../../src/game/wonder/dragon.js';
import { cellType } from '../../src/game/wonder/body.js';

describe('Dragon Planet: the sky', () => {
  const L = dragonLevel();

  it('thirty balloons, in open sky with room around them', () => {
    expect(L.balloons).toHaveLength(DRAGON.need);
    for (const b of L.balloons) {
      for (const [dx, dy] of [[0, 0], [0, 1], [0, -1]]) expect(cellType(L.level, Math.floor(b.x + dx), Math.floor(b.y + dy)), `${b.x},${b.y}`).toBeNull();
      expect(b.y).toBeLessThan(DRAGON.sea - 2);
    }
  });

  it('rings hang in open sky, three blocks tall', () => {
    for (const r of L.rings) for (let dy = -2; dy <= 2; dy++) expect(cellType(L.level, r.x, r.y + dy), `${r.x},${r.y + dy}`).toBeNull();
  });

  it('the islands never touch each other, or the cloud sea', () => {
    const sorted = [...L.islands].sort((a, b) => a.x0 - b.x0);
    for (let i = 1; i < sorted.length; i++) expect(sorted[i].x0).toBeGreaterThan(sorted[i - 1].x1 + 3);
    for (const is of L.islands) expect(is.top + is.depth + 2).toBeLessThan(DRAGON.sea);
  });

  it('the rocket stands on the first island; the nest on the highest one, at the far end', () => {
    const first = L.islands[0];
    expect(L.pad.x).toBeGreaterThan(first.x0 + 2);
    expect(L.pad.y).toBe(first.top);
    const highest = Math.min(...L.islands.map((i) => i.top));
    const nestIsland = L.islands.find((i) => L.nest.x >= i.x0 && L.nest.x <= i.x1);
    expect(nestIsland.top).toBe(highest);
    expect(L.nest.x).toBeGreaterThan(DRAGON.w * 0.8);
  });
});

describe('Dragon Planet: flying', () => {
  it('eases toward the stick, and hovers when let go', () => {
    let v = { x: 0, y: 0 };
    for (let i = 0; i < 120; i++) v = flyVelocity(v, { x: 1, y: -1 }, 1 / 60);
    expect(v.x).toBeCloseTo(FLY.speed, 0);
    expect(v.y).toBeCloseTo(-FLY.speed, 0);
    for (let i = 0; i < 120; i++) v = flyVelocity(v, { x: 0, y: 0 }, 1 / 60);
    expect(Math.hypot(v.x, v.y)).toBeLessThan(2);
  });
});
