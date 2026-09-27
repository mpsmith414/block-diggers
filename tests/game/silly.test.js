import { describe, it, expect } from 'vitest';
import { createSneeze, addDust, createFall, trackFall, chestSock, cushionPressed } from '../../src/game/silly.js';
import { createRng } from '../../src/world/rng.js';
import { SILLY, TILE } from '../../src/tuning.js';

describe('sneezing', () => {
  it('lots of dusty digging makes you sneeze, then the dust starts again', () => {
    const rng = createRng(4);
    const s = createSneeze(rng);
    expect(s.at).toBeGreaterThanOrEqual(SILLY.sneezeMin);
    expect(s.at).toBeLessThanOrEqual(SILLY.sneezeMax);
    let sneezes = 0;
    for (let i = 0; i < SILLY.sneezeMax; i++) if (addDust(s, 'soft', rng)) sneezes++;
    expect(sneezes).toBe(1);
    expect(s.dust).toBeLessThan(SILLY.sneezeMax);
  });
  it('only dirt and sand are dusty', () => {
    const rng = createRng(4);
    const s = createSneeze(rng);
    for (let i = 0; i < 100; i++) expect(addDust(s, 'stone', rng)).toBe(false);
    expect(s.dust).toBe(0);
    let hit = false;
    for (let i = 0; i < SILLY.sneezeMax; i++) hit = addDust(s, 'sand', rng) || hit;
    expect(hit).toBe(true);
  });
});

describe('dizzy after a big fall', () => {
  const p = (y, grounded, inWater = false) => ({ y, grounded, inWater });
  it('a long drop onto the ground makes you dizzy', () => {
    const f = createFall();
    expect(trackFall(f, p(0, true))).toBeNull();
    expect(trackFall(f, p(10, false))).toBeNull();
    expect(trackFall(f, p(SILLY.dizzyRows * TILE + 20, false))).toBeNull();
    expect(trackFall(f, p(SILLY.dizzyRows * TILE + 20, true))).toBe('dizzy');
    expect(trackFall(f, p(SILLY.dizzyRows * TILE + 20, true))).toBeNull();
  });
  it('a little hop is not a fall', () => {
    const f = createFall();
    trackFall(f, p(100, true));
    trackFall(f, p(80, false));
    expect(trackFall(f, p(100, true))).toBeNull();
  });
  it('landing in water is soft', () => {
    const f = createFall();
    trackFall(f, p(0, true));
    trackFall(f, p(200, false));
    expect(trackFall(f, p(400, false, true))).toBeNull();
    expect(trackFall(f, p(410, true))).toBeNull();
  });
  it('climbing down a ladder is not a fall', () => {
    const f = createFall();
    trackFall(f, p(0, true));
    for (let y = 0; y < 300; y += 10) trackFall(f, { y, grounded: false, climbing: true });
    expect(trackFall(f, p(300, true))).toBeNull();
  });
  it('it counts from the highest point of a jump', () => {
    const f = createFall();
    trackFall(f, p(500, true));
    trackFall(f, p(400, false)); // jumped up
    expect(trackFall(f, p(400 + SILLY.dizzyRows * TILE, true))).toBe('dizzy');
  });
});

describe('joke finds', () => {
  it('about 1 chest in 5 has a smelly sock', () => {
    const rng = createRng(9);
    let socks = 0;
    for (let i = 0; i < 1000; i++) if (chestSock(rng)) socks++;
    expect(socks).toBeGreaterThan(120);
    expect(socks).toBeLessThan(280);
  });
  it('a whoopee cushion goes PFFBT when you land on it (or walk onto it), not when you are beside it', () => {
    const cushion = { x: 10, y: 5, flat: 0 };
    const cell = { x: 10 * TILE, y: 5 * TILE };
    const on = { x: cell.x + 2, y: cell.y + TILE - 14, w: 12, h: 14 };
    const beside = { x: cell.x + 20, y: cell.y + TILE - 14, w: 12, h: 14 };
    expect(cushionPressed(cushion, on)).toBe(true);
    expect(cushionPressed(cushion, beside)).toBe(false);
    expect(cushionPressed({ ...cushion, flat: 1 }, on)).toBe(false);
  });
});
