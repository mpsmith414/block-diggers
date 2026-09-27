import { describe, it, expect } from 'vitest';
import {
  overlaps, createSlime, stepSlime, slimeTouch, createBat, stepBat,
  triggerGravel, stepGravel, lavaEscape, spawnSpot,
} from '../../src/game/hazards.js';
import { createGrid } from '../../src/world/grid.js';
import { B } from '../../src/world/blocks.js';
import { createRng } from '../../src/world/rng.js';
import { TILE, SLIME, GRAVEL } from '../../src/tuning.js';

const CHARS = { '#': B.STONE, '.': B.AIR, G: B.GRAVEL, L: B.LAVA, D: B.DEEP, c: B.CHEST };
function makeGrid(rows) {
  const g = createGrid(rows[0].length, rows.length);
  rows.forEach((row, y) => [...row].forEach((ch, x) => g.set(x, y, CHARS[ch])));
  return g;
}
const DT = 1 / 60;
const steps = (n, fn) => { for (let i = 0; i < n; i++) fn(); };

describe('overlaps', () => {
  it('detects box overlap, not touching edges', () => {
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
  });
});

describe('slimes', () => {
  const room = () => makeGrid(['##########', '#........#', '#........#', '##########']);

  it('fall to the floor and hop toward their direction', () => {
    const g = room();
    const s = createSlime(3 * TILE, TILE, 1);
    steps(30, () => stepSlime(s, g, DT));
    expect(s.y + s.h).toBe(3 * TILE);
    const x0 = s.x;
    steps(Math.ceil((SLIME.hopEvery + 0.6) * 60), () => stepSlime(s, g, DT));
    expect(s.x).toBeGreaterThan(x0);
  });

  it('turn around at a wall', () => {
    const g = room();
    const s = createSlime(7 * TILE + 2, 2 * TILE, 1);
    steps(600, () => stepSlime(s, g, DT));
    expect(s.dir).toBe(-1);
    expect(s.x + s.w).toBeLessThanOrEqual(9 * TILE);
  });

  it('are squashed from above and bonk from the side', () => {
    const s = createSlime(32, 38, 1); // box 32..44 x 38..48
    expect(slimeTouch({ x: 32, y: 26, w: 12, h: 14 }, 100, s)).toBe('squash');
    expect(slimeTouch({ x: 22, y: 34, w: 12, h: 14 }, 0, s)).toBe('bonk');
    expect(slimeTouch({ x: 0, y: 0, w: 12, h: 14 }, 0, s)).toBeNull();
  });
});

describe('bats', () => {
  it('fly along a wave around their base height and turn at walls', () => {
    const g = makeGrid(['##########', '#........#', '#........#', '#........#', '##########']);
    const b = createBat(4 * TILE, 2 * TILE, 1);
    let minY = Infinity;
    let maxY = -Infinity;
    let turned = false;
    steps(600, () => {
      stepBat(b, g, DT);
      minY = Math.min(minY, b.y);
      maxY = Math.max(maxY, b.y);
      if (b.dir === -1) turned = true;
    });
    expect(turned).toBe(true);
    expect(maxY - minY).toBeGreaterThan(4);
    expect(maxY - minY).toBeLessThan(20);
    expect(b.x).toBeGreaterThanOrEqual(TILE);
    expect(b.x + b.w).toBeLessThanOrEqual(9 * TILE);
  });
});

describe('gravel', () => {
  it('shakes, falls, lands as a block again; stacked gravel follows', () => {
    const g = makeGrid(['#G#', '#G#', '#.#', '#.#', '###']);
    let fallers = [];
    fallers = triggerGravel(fallers, g, 1, 1);
    fallers = triggerGravel(fallers, g, 1, 1); // not twice
    expect(fallers).toHaveLength(1);
    let freed = [];
    let landed = [];
    steps(Math.floor(GRAVEL.shake * 60) - 2, () => { ({ fallers } = stepGravel(fallers, g, DT)); });
    expect(g.get(1, 1)).toBe(B.GRAVEL); // still shaking
    steps(200, () => {
      const r = stepGravel(fallers, g, DT);
      fallers = r.fallers;
      freed.push(...r.freed);
      landed.push(...r.landed);
    });
    expect(landed).toEqual([{ x: 1, y: 3 }, { x: 1, y: 2 }]);
    expect(freed.map((c) => c.y).sort()).toEqual([0, 1]);
    expect([0, 1, 2, 3].map((y) => g.get(1, y))).toEqual([B.AIR, B.AIR, B.GRAVEL, B.GRAVEL]);
  });

  it('ignores cells that are not gravel', () => {
    const g = makeGrid(['###', '#.#', '###']);
    expect(triggerGravel([], g, 1, 0)).toEqual([]);
  });
});

describe('lavaEscape', () => {
  it('finds the nearest open, non-lava cell above', () => {
    const g = makeGrid(['#.#', '#.#', '#L#', '###']);
    expect(lavaEscape(g, 1, 2)).toEqual({ cx: 1, cy: 1 });
  });
  it('digs through rock above if it has to', () => {
    const g = makeGrid(['#.#', '###', '#L#', '###']);
    expect(lavaEscape(g, 1, 2)).toEqual({ cx: 1, cy: 0 });
  });
});

describe('spawnSpot', () => {
  const rng = createRng(3);
  const g = createGrid(40, 150);
  for (let y = 0; y < 150; y++) for (let x = 0; x < 40; x++) g.set(x, y, y % 3 === 2 ? B.STONE : B.AIR);
  it('slimes spawn on a floor in rows 1-95, outside the avoid rect', () => {
    for (let i = 0; i < 50; i++) {
      const s = spawnSpot(g, rng, { kind: 'slime', near: { cx: 20, cy: 60 }, avoid: { x0: 15, y0: 55, x1: 25, y1: 65 } });
      if (!s) continue;
      expect(s.cy).toBeGreaterThanOrEqual(1);
      expect(s.cy).toBeLessThanOrEqual(95);
      expect(g.get(s.cx, s.cy)).toBe(B.AIR);
      expect(g.get(s.cx, s.cy + 1)).toBe(B.STONE);
      expect(s.cx >= 15 && s.cx <= 25 && s.cy >= 55 && s.cy <= 65).toBe(false);
    }
  });
  it('bats spawn in open cells in rows 96-148 only', () => {
    expect(spawnSpot(g, rng, { kind: 'bat', near: { cx: 20, cy: 30 }, avoid: null })).toBeNull();
    const b = spawnSpot(g, rng, { kind: 'bat', near: { cx: 20, cy: 110 }, avoid: null });
    expect(b.cy).toBeGreaterThanOrEqual(96);
    expect(g.get(b.cx, b.cy)).toBe(B.AIR);
  });
});
