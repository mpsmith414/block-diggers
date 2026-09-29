import { describe, it, expect } from 'vitest';
import { createPipe, curveAt, sAtX, createSkate, stepSkate, TRICKS } from '../../src/game/skate.js';
import { createRng } from '../../src/world/rng.js';
import { SKATE } from '../../src/tuning.js';

const pipe = createPipe(480, 800);
const run = (sk, secs, intent = { moveX: 0 }, press = () => false, rng = createRng(1)) => {
  const evs = [];
  for (let t = 0; t < secs; t += 1 / 60) evs.push(...stepSkate(sk, pipe, intent, { jump: press(t, sk) }, 1 / 60, rng, 99));
  return evs;
};

describe('the half pipe curve', () => {
  it('runs from lip to lip, smooth, with its bottom on the floor', () => {
    expect(curveAt(pipe, 0)).toMatchObject({ x: 480, y: 800 - SKATE.R });
    const end = curveAt(pipe, pipe.L);
    expect(end.x).toBeCloseTo(480 + 2 * SKATE.R + SKATE.F);
    expect(end.y).toBeCloseTo(800 - SKATE.R);
    expect(curveAt(pipe, pipe.L / 2).y).toBeCloseTo(800);
    for (let s = 1; s <= pipe.L; s += 1) {
      const a = curveAt(pipe, s - 1);
      const b = curveAt(pipe, s);
      expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeLessThan(1.05);
    }
    for (const s of [10, 150, 200, 300]) expect(sAtX(pipe, curveAt(pipe, s).x)).toBeCloseTo(s, 3);
  });
});

describe('skating', () => {
  it('rolls back and forth without leaving the pipe when you don’t push', () => {
    const sk = createSkate(pipe, 480 + 30);
    const evs = run(sk, 20);
    expect(evs.some((e) => e.type === 'air')).toBe(false);
    expect(sk.s).toBeGreaterThan(0);
    expect(sk.s).toBeLessThan(pipe.L);
  });

  it('pumping builds up to big air, which stays under the ceiling', () => {
    const sk = createSkate(pipe, pipe.x0 + SKATE.R + 10);
    let top = Infinity;
    for (let t = 0; t < 30; t += 1 / 60) {
      stepSkate(sk, pipe, { moveX: 1 }, { jump: false }, 1 / 60, createRng(2), 99);
      if (sk.air) top = Math.min(top, sk.y);
    }
    expect(top).toBeLessThan(pipe.lipY - 40);
    expect(top).toBeGreaterThanOrEqual(pipe.lipY - SKATE.maxAir - 1);
  });

  it('comes back down off a lip and rolls back into the pipe', () => {
    const sk = createSkate(pipe, pipe.x0 + SKATE.R);
    sk.v = -SKATE.max; // rushing up the left wall
    const evs = [];
    for (let t = 0; t < 4 && !evs.some((e) => e.type === 'land'); t += 1 / 60) evs.push(...stepSkate(sk, pipe, { moveX: 0 }, { jump: false }, 1 / 60, createRng(1), 99));
    expect(evs.map((e) => e.type)).toEqual(['air', 'land']);
    expect(sk.air).toBe(false);
    expect(sk.v).toBeGreaterThan(0); // rolling back down, into the pipe
  });

  it('A on the pipe is an ollie; A in the air is a trick (never the same twice in a row)', () => {
    const sk = createSkate(pipe, pipe.x0 + SKATE.R + 40);
    const evs = run(sk, 3, { moveX: 0 }, (t) => [0.1, 0.3, 0.8].some((p) => Math.abs(t - p) < 0.008));
    expect(evs[0].type).toBe('air');
    const tricks = evs.filter((e) => e.type === 'trick').map((e) => e.kind);
    expect(tricks.length).toBeGreaterThanOrEqual(1);
    for (const k of tricks) expect(TRICKS).toContain(k);
    for (let i = 1; i < tricks.length; i++) expect(tricks[i]).not.toBe(tricks[i - 1]);
  });

  it('landing tricks gives gems: one each, +1 for a combo of 3, never past the cap', () => {
    const sk = createSkate(pipe, pipe.x0 + SKATE.R + 40);
    sk.air = true; sk.x = pipe.x0 + SKATE.R + 40; sk.y = 700; sk.vx = 0; sk.vy = 0;
    sk.tricks = ['kickflip', 'grab', 'superman'];
    const land = run(sk, 2).find((e) => e.type === 'land');
    expect(land.gems).toBe(4);
    const sk2 = createSkate(pipe, pipe.x0 + SKATE.R + 40);
    sk2.air = true; sk2.y = 700; sk2.tricks = ['kickflip', 'grab'];
    const evs = [];
    for (let t = 0; t < 2; t += 1 / 60) evs.push(...stepSkate(sk2, pipe, { moveX: 0 }, { jump: false }, 1 / 60, createRng(1), 1));
    expect(evs.find((e) => e.type === 'land').gems).toBe(1);
  });
});
