import { describe, it, expect } from 'vitest';
import { createLevel, moveBody, onFloor, cellType, overlapsSolid, touching, cellsUnder } from '../../src/game/wonder/body.js';

const KINDS = [null, { solid: true }, { solid: true, oneWay: true }];
const T = 16;
const box = (x, y, w = 12, h = 14) => ({ x, y, w, h, vx: 0, vy: 0 });
const run = (b, level, secs, opts) => {
  let last = null;
  for (let t = 0; t < secs; t += 1 / 60) last = moveBody(b, level, 1 / 60, opts);
  return last;
};

describe('the Wonder mover', () => {
  it('falls and lands on a solid floor, flush, reporting the floor and the impact', () => {
    const level = createLevel(10, 10, KINDS);
    level.fill(0, 8, 9, 8, 1);
    const b = box(20, 10);
    let landed = null;
    for (let i = 0; i < 120 && !landed; i++) {
      const r = moveBody(b, level, 1 / 60, { gravity: 900, maxFall: 420 });
      if (r.floor) landed = r;
    }
    expect(landed.floor[0].y).toBe(8);
    expect(landed.impact).toBeGreaterThan(100);
    expect(b.y + b.h).toBeCloseTo(8 * T);
    expect(b.vy).toBe(0);
    expect(onFloor(level, b, 900)).toBe(true);
  });

  it('stops at walls and says which side', () => {
    const level = createLevel(10, 10, KINDS);
    level.fill(5, 0, 5, 9, 1);
    const b = box(20, 20);
    b.vx = 200;
    const r = run(b, level, 0.5, {});
    expect(b.x + b.w).toBeCloseTo(5 * T);
    expect(r.right ?? null).toBeNull(); // (stopped, so later steps don't hit)
    b.vx = 200;
    expect(moveBody(b, level, 1 / 60, {}).right).toBeTruthy();
  });

  it('jumps up through a one-way ledge and then stands on it', () => {
    const level = createLevel(10, 12, KINDS);
    level.fill(0, 11, 9, 11, 1);
    level.fill(0, 8, 9, 8, 2);
    const b = box(20, 11 * T - 14);
    b.vy = -400;
    let stood = false;
    for (let i = 0; i < 120; i++) {
      const r = moveBody(b, level, 1 / 60, { gravity: 900, maxFall: 420 });
      if (r.floor && r.floor[0].y === 8) stood = true;
    }
    expect(stood).toBe(true);
    expect(b.y + b.h).toBeCloseTo(8 * T);
  });

  it('drops through a one-way ledge when asked', () => {
    const level = createLevel(10, 12, KINDS);
    level.fill(0, 11, 9, 11, 1);
    level.fill(0, 8, 9, 8, 2);
    const b = box(20, 8 * T - 14);
    run(b, level, 1, { gravity: 900, maxFall: 420, drop: true });
    expect(b.y + b.h).toBeCloseTo(11 * T);
  });

  it('falls up with negative gravity and stands on the ceiling', () => {
    const level = createLevel(10, 10, KINDS, { roof: true });
    level.fill(0, 1, 9, 1, 1);
    level.fill(0, 8, 9, 8, 1);
    const b = box(20, 100);
    const r = run(b, level, 1, { gravity: -900, maxFall: 420 });
    expect(b.y).toBeCloseTo(2 * T);
    expect(r.floor).toBeTruthy(); // the ceiling is the floor now
    expect(onFloor(level, b, -900)).toBe(true);
    expect(onFloor(level, b, 900)).toBe(false);
  });

  it('a one-way ledge holds you from below when gravity points up', () => {
    const level = createLevel(10, 10, KINDS, { roof: true });
    level.fill(0, 3, 9, 3, 2);
    const b = box(20, 100);
    run(b, level, 1, { gravity: -900, maxFall: 420 });
    expect(b.y).toBeCloseTo(4 * T);
  });

  it("very fast boxes don't tunnel through a thin floor", () => {
    const level = createLevel(10, 40, KINDS);
    level.fill(0, 30, 9, 30, 1);
    const b = box(20, 0);
    b.vy = 3000;
    moveBody(b, level, 1 / 10, { gravity: 0 });
    expect(b.y + b.h).toBeLessThanOrEqual(30 * T + 0.01);
  });

  it('the sides and bottom outside the grid are walls; the sky is open unless roofed', () => {
    const open = createLevel(4, 4, KINDS);
    expect(cellType(open, -1, 2)).toBe('solid');
    expect(cellType(open, 4, 2)).toBe('solid');
    expect(cellType(open, 2, 4)).toBe('solid');
    expect(cellType(open, 2, -1)).toBeNull();
    expect(cellType(createLevel(4, 4, KINDS, { roof: true }), 2, -1)).toBe('solid');
  });

  it('overlap helpers', () => {
    const level = createLevel(4, 4, KINDS);
    level.set(1, 1, 1);
    expect(overlapsSolid(level, box(16, 16))).toBe(true);
    expect(overlapsSolid(level, box(40, 40, 8, 8))).toBe(false);
    expect(touching(box(0, 0), box(11, 13))).toBe(true);
    expect(touching(box(0, 0), box(13, 0))).toBe(false);
    expect(cellsUnder(box(10, 10, 12, 14))).toHaveLength(4);
  });
});
