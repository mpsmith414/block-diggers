import { describe, it, expect } from 'vitest';
import { frameCamera, wallLimits, applySoftWall, isOffscreen } from '../../src/game/camera.js';
import { stepBubble } from '../../src/game/bubble.js';
import { BUBBLE } from '../../src/tuning.js';

const VIEW = { w: 480, h: 270 };
const OPTS = { minZoom: 0.5, maxZoom: 1.5, margin: 40 };

describe('frameCamera', () => {
  it('one player: max zoom, centred on them', () => {
    expect(frameCamera([{ x: 100, y: 50 }], VIEW, OPTS)).toEqual({ zoom: 1.5, x: 100, y: 50 });
  });
  it('close players: max zoom, centred on the midpoint', () => {
    const f = frameCamera([{ x: 100, y: 50 }, { x: 140, y: 70 }], VIEW, OPTS);
    expect(f).toEqual({ zoom: 1.5, x: 120, y: 60 });
  });
  it('players further apart: zoom out just enough to fit them plus the margin', () => {
    const f = frameCamera([{ x: 0, y: 0 }, { x: 0, y: 300 }], VIEW, OPTS);
    expect(f.zoom).toBeCloseTo(270 / 380, 5);
    expect(f.y).toBe(150);
  });
  it('very far apart: clamped at min zoom', () => {
    expect(frameCamera([{ x: 0, y: 0 }, { x: 0, y: 2000 }], VIEW, OPTS).zoom).toBe(0.5);
  });
});

describe('soft wall', () => {
  const limits = wallLimits(VIEW, OPTS);
  it('limits are the min-zoom view minus the margin on both sides', () => {
    expect(limits).toEqual({ dx: 480 / 0.5 - 80, dy: 270 / 0.5 - 80 });
  });
  it('reverts only the axis that pushes past the limit', () => {
    const partner = { x: 0, y: 0 };
    const prev = { x: 10, y: limits.dy - 1 };
    const next = { x: 14, y: limits.dy + 3 };
    expect(applySoftWall(prev, next, partner, limits)).toEqual({ x: 14, y: limits.dy - 1 });
  });
  it('always allows moving back toward the partner', () => {
    const partner = { x: 0, y: 0 };
    const prev = { x: 0, y: limits.dy + 50 };
    const next = { x: 0, y: limits.dy + 40 };
    expect(applySoftWall(prev, next, partner, limits)).toEqual(next);
  });
});

describe('isOffscreen', () => {
  const rect = { x: 0, y: 0, right: 100, bottom: 100 };
  it('inside is on screen, outside by more than the pad is off', () => {
    expect(isOffscreen({ x: 50, y: 50 }, rect)).toBe(false);
    expect(isOffscreen({ x: 105, y: 50 }, rect)).toBe(false);
    expect(isOffscreen({ x: 120, y: 50 }, rect)).toBe(true);
    expect(isOffscreen({ x: 50, y: -20 }, rect)).toBe(true);
  });
});

describe('stepBubble', () => {
  it('floats toward the target at bubble speed, then arrives and snaps', () => {
    const p = { x: 0, y: 0, vx: 5, vy: 5 };
    const target = { x: 100, y: 0 };
    expect(stepBubble(p, target, 0.1)).toBe(false);
    expect(p.x).toBeCloseTo(BUBBLE.speed * 0.1, 5);
    let arrived = false;
    for (let i = 0; i < 100 && !arrived; i++) arrived = stepBubble(p, target, 0.1);
    expect(arrived).toBe(true);
    expect(p).toMatchObject({ x: 100, y: 0, vx: 0, vy: 0 });
  });
});
