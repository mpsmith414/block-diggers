import { describe, it, expect } from 'vitest';
import { createStorm, stepStorm, windOf } from '../../src/game/storms.js';
import { createRng } from '../../src/world/rng.js';
import { createGrid } from '../../src/world/grid.js';
import { createPlayer, stepPlayer, standAt } from '../../src/game/player.js';
import { B } from '../../src/world/blocks.js';
import { STORM, PLAYER } from '../../src/tuning.js';

// run the storm for `secs`, collecting events with the time they happened
function run(storm, rng, secs, dt = 0.1) {
  const out = [];
  for (let t = 0; t < secs; t += dt) for (const ev of stepStorm(storm, dt, rng)) out.push({ ev, t });
  return out;
}

describe('dust storms', () => {
  it('start calm, and the first storm comes soon', () => {
    const rng = createRng(1);
    const s = createStorm(rng);
    expect(s.phase).toBe('calm');
    expect(windOf(s)).toBe(0);
    const evs = run(s, rng, STORM.first[1] + 0.2);
    expect(evs[0].ev).toBe('warn');
    expect(evs[0].t).toBeGreaterThanOrEqual(STORM.first[0] - 0.2);
  });

  it('cycle: warn, then blow, then calm again', () => {
    const rng = createRng(2);
    const s = createStorm(rng);
    const evs = run(s, rng, 200);
    expect(evs.slice(0, 6).map((e) => e.ev)).toEqual(['warn', 'start', 'end', 'warn', 'start', 'end']);
    expect(evs[1].t - evs[0].t).toBeCloseTo(STORM.warn, 0);
    expect(evs[2].t - evs[1].t).toBeCloseTo(STORM.blow, 0);
    const calm = evs[3].t - evs[2].t;
    expect(calm).toBeGreaterThanOrEqual(STORM.calm[0] - 0.2);
    expect(calm).toBeLessThanOrEqual(STORM.calm[1] + 0.2);
  });

  it('only pushes while it blows, one way per storm', () => {
    const rng = createRng(3);
    const s = createStorm(rng);
    let warned = false;
    for (let i = 0; i < 2000 && s.phase !== 'blow'; i++) {
      stepStorm(s, 0.1, rng);
      if (s.phase === 'warn') { warned = true; expect(windOf(s)).toBe(0); }
    }
    expect(warned).toBe(true);
    expect(Math.abs(s.dir)).toBe(1);
    expect(windOf(s)).toBe(s.dir * STORM.push);
  });
});

describe('the wind on a player', () => {
  const floor = () => {
    const grid = createGrid(40, 10);
    for (let x = 0; x < 40; x++) grid.set(x, 8, B.MARS_ROCK);
    return grid;
  };
  const idle = { moveX: 0, moveY: 0, jump: false };

  it('pushes you along when you stand still', () => {
    const grid = floor();
    const p = createPlayer(standAt(10, 7));
    const x0 = p.x;
    for (let i = 0; i < 60; i++) stepPlayer(p, idle, grid, { dt: 1 / 60, windX: STORM.push });
    expect(p.x - x0).toBeCloseTo(STORM.push, 0);
  });

  it('you can still walk against it (slowly)', () => {
    const grid = floor();
    const p = createPlayer(standAt(20, 7));
    const x0 = p.x;
    for (let i = 0; i < 60; i++) stepPlayer(p, { ...idle, moveX: -1 }, grid, { dt: 1 / 60, windX: STORM.push });
    expect(x0 - p.x).toBeGreaterThan(20);
    expect(x0 - p.x).toBeLessThan(PLAYER.walkSpeed);
  });

  it('a wall stops the push, and so does a ladder', () => {
    const grid = floor();
    grid.set(12, 7, B.MARS_ROCK);
    const p = createPlayer(standAt(11, 7));
    for (let i = 0; i < 60; i++) stepPlayer(p, idle, grid, { dt: 1 / 60, windX: STORM.push });
    expect(p.x + PLAYER.w).toBeLessThanOrEqual(12 * 16 + 0.01);
    const g2 = floor();
    for (let y = 2; y < 8; y++) g2.set(5, y, B.LADDER);
    const q = createPlayer(standAt(5, 5));
    const x0 = q.x;
    for (let i = 0; i < 60; i++) stepPlayer(q, { ...idle, moveY: -1 }, g2, { dt: 1 / 60, windX: STORM.push });
    expect(q.x).toBe(x0);
  });
});

describe('the wind never digs', () => {
  it('pushed into a wall you just lean on it (no stepping up, no digging)', () => {
    const grid = createGrid(20, 10);
    for (let x = 0; x < 20; x++) grid.set(x, 8, B.MARS_ROCK);
    grid.set(6, 7, B.MARS_ROCK);
    const p = createPlayer(standAt(5, 7));
    const y0 = p.y;
    for (let i = 0; i < 120; i++) stepPlayer(p, { moveX: 0, moveY: 0, jump: false }, grid, { dt: 1 / 60, windX: STORM.push, pickLevel: 11 });
    expect(p.y).toBe(y0);
    expect(p.mining).toBe(null);
    expect(grid.get(6, 7)).toBe(B.MARS_ROCK);
  });
});
