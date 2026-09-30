import { describe, it, expect } from 'vitest';
import { createEggGame, stepEggGame, eggReward } from '../../src/game/eggcatch.js';
import { createRng } from '../../src/world/rng.js';
import { EGGS } from '../../src/tuning.js';

const FLOOR = 800;
const TOP = 620;
const game = () => createEggGame(480, 752, TOP, FLOOR);
const run = (g, secs, baskets = () => [], rng = createRng(4)) => {
  const evs = [];
  for (let t = 0; t < secs; t += 1 / 60) for (const e of stepEggGame(g, baskets(t), 1 / 60, rng)) evs.push({ ...e, t });
  return evs;
};

describe('dino egg catch', () => {
  it('the pterodactyl flies back and forth, dropping eggs, faster and faster', () => {
    const g = game();
    const evs = run(g, EGGS.round);
    const drops = evs.filter((e) => e.type === 'drop');
    expect(drops.length).toBeGreaterThan(15);
    const early = drops.filter((e) => e.t < EGGS.round / 3).length;
    const late = drops.filter((e) => e.t > (EGGS.round * 2) / 3).length;
    expect(late).toBeGreaterThan(early);
    for (const d of drops) {
      expect(d.egg.x).toBeGreaterThanOrEqual(480);
      expect(d.egg.x).toBeLessThanOrEqual(752);
    }
  });

  it('an egg nobody catches splats on the floor', () => {
    const g = game();
    g.dropT = 99;
    g.eggs.push({ x: 600, y: TOP, vy: 0, kind: 'egg' });
    const evs = run(g, 5);
    expect(evs.map((e) => e.type)).toEqual(['splat']);
    expect(g.eggs).toHaveLength(0);
    expect(g.score).toBe(0);
  });

  it('a basket under the egg catches it: 1 for an egg, 3 for a golden egg, 0 for a rotten one', () => {
    for (const [kind, points] of [['egg', 1], ['golden', 3], ['rotten', 0]]) {
      const g = game();
      g.dropT = 99;
      g.eggs.push({ x: 600, y: TOP, vy: 0, kind });
      const evs = run(g, 5, () => [{ x: 604, y: FLOOR - 30 }]);
      const c = evs.find((e) => e.type === 'catch');
      expect(c.egg.kind).toBe(kind);
      expect(c.basket).toBe(0);
      expect(g.score).toBe(points);
      expect(evs.some((e) => e.type === 'splat')).toBe(false);
    }
  });

  it('a basket off to the side misses', () => {
    const g = game();
    g.dropT = 99;
    g.eggs.push({ x: 600, y: TOP, vy: 0, kind: 'egg' });
    const evs = run(g, 5, () => [{ x: 640, y: FLOOR - 30 }]);
    expect(evs.map((e) => e.type)).toEqual(['splat']);
  });

  it('the round ends after its time, with the score, and no more eggs drop', () => {
    const g = game();
    const evs = run(g, EGGS.round + 1);
    expect(evs.find((e) => e.type === 'end')).toBeTruthy();
    expect(g.over).toBe(true);
    const after = run(g, 3);
    expect(after.some((e) => e.type === 'drop')).toBe(false);
  });

  it('a caught egg gives jade; a golden one obsidian; a rotten one nothing', () => {
    expect(eggReward('egg')).toEqual(['jade']);
    expect(eggReward('golden')).toEqual(['obsidian', 'obsidian', 'obsidian']);
    expect(eggReward('rotten')).toEqual([]);
  });
});
