import { describe, it, expect } from 'vitest';
import { jellyLevel, bounce, climbed, JELLY, BOUNCE, JL, STONE_W } from '../../src/game/wonder/jelly.js';
import { cellType } from '../../src/game/wonder/body.js';

const rise = (v) => (v * v) / (2 * JELLY.gravity) / 16; // in blocks

describe('Jelly Planet: the tower', () => {
  const L = jellyLevel();

  it('eight sections of four jelly blocks, a wafer floor on each, the castle floor on top', () => {
    expect(L.stones).toHaveLength(JELLY.sections * 4);
    expect(L.top).toBeGreaterThan(4);
    for (let x = 1; x < JELLY.w - 1; x++) expect(L.level.get(x, L.top)).toBe(JL.WAFER);
    expect(cellType(L.level, 0, 50)).toBe('solid');
    expect(cellType(L.level, JELLY.w - 1, 50)).toBe('solid');
  });

  it('a plain bounce always reaches the next jelly block, and the next floor', () => {
    const plain = rise(BOUNCE.least);
    const floors = [L.ground, ...Array.from({ length: JELLY.sections }, (_, k) => L.ground - (k + 1) * JELLY.section)];
    for (let k = 0; k < JELLY.sections; k++) {
      const mine = L.stones.slice(k * 4, k * 4 + 4);
      expect(mine[0].row).toBe(floors[k] - 1); // (a step up from the floor)
      for (let i = 1; i < 4; i++) expect(plain).toBeGreaterThan(mine[i - 1].row - mine[i].row + 0.5);
      expect(plain).toBeGreaterThan(mine[3].row - floors[k + 1] + 0.3);
      // and the next block is never far to the side
      for (let i = 1; i < 4; i++) expect(Math.abs(mine[i].x0 - mine[i - 1].x0)).toBeLessThanOrEqual(STONE_W);
    }
  });

  it('jelly beans, gummy bears and gumballs sit in open air', () => {
    for (const b of [...L.beans, ...L.gumballs]) expect(cellType(L.level, b.x, b.y), `${b.x},${b.y}`).toBeNull();
    for (const b of L.bears) expect(['solid', 'oneway']).toContain(cellType(L.level, 10, b.y + 1));
    expect(L.beans.length).toBeGreaterThanOrEqual(40);
  });
});

describe('Jelly Planet: bouncing', () => {
  it('a plain bounce keeps most of your fall, but never less than the least', () => {
    expect(bounce(100, false, 2)).toEqual({ vy: -BOUNCE.least, combo: 0 });
    expect(bounce(600, false, 0).vy).toBeCloseTo(-600 * BOUNCE.keep);
  });
  it('holding A: super bounces, each one in a row higher, up to the third', () => {
    let c = 0;
    const vys = [];
    for (let i = 0; i < 5; i++) { const r = bounce(200, true, c); c = r.combo; vys.push(r.vy); }
    expect(vys.slice(0, 3)).toEqual(BOUNCE.supers.map((v) => -v));
    expect(vys[4]).toBe(-BOUNCE.supers[2]);
    expect(c).toBe(3);
    expect(rise(BOUNCE.supers[2])).toBeGreaterThan(JELLY.section);
  });
  it('how far up you are', () => {
    const L = jellyLevel();
    expect(climbed(L.ground * 16, L)).toBe(0);
    expect(climbed(L.top * 16, L)).toBe(1);
    expect(climbed(-50, L)).toBe(1);
  });
});

describe('Jelly Planet: the rocket pad', () => {
  it('stands on clear ground, away from the jelly', () => {
    const L = jellyLevel();
    for (let x = L.pad.x - 3; x <= L.pad.x + 2; x++) for (let y = L.ground - 6; y < L.ground; y++) expect(cellType(L.level, x, y), `${x},${y}`).toBeNull();
  });
});

describe('Jelly Planet: bouncing up through the blocks', () => {
  it('a bounce from one block passes up through the next and lands on it', async () => {
    const { moveBody } = await import('../../src/game/wonder/body.js');
    const L = jellyLevel();
    const [s0, s1] = L.stones;
    const b = { x: (s1.x0 + 0.2) * 16, y: s0.row * 16 - 14, w: 12, h: 14, vx: 0, vy: -BOUNCE.least };
    let landed = null;
    for (let i = 0; i < 90 && !landed; i++) {
      const out = moveBody(b, L.level, 1 / 60, { gravity: JELLY.gravity, maxFall: JELLY.maxFall });
      if (out.floor) landed = out.floor[0];
    }
    expect(landed.y).toBe(s1.row);
  });
});
