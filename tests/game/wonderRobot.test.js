import { describe, it, expect } from 'vitest';
import { robotLevel, ROBOT, MECH, RB, breakable, smash, punchCells, stompCells, beltUnder } from '../../src/game/wonder/robot.js';
import { cellType, moveBody, createLevel } from '../../src/game/wonder/body.js';

const G = ROBOT.ground;

describe('Robot Planet: the city', () => {
  const L = robotLevel();

  it('twelve broken robots, each standing on something, in open air, in order along the city', () => {
    expect(L.robots).toHaveLength(ROBOT.need);
    for (const r of L.robots) {
      expect(cellType(L.level, r.x, r.y), `${r.x},${r.y}`).toBeNull();
      expect(['solid', 'oneway']).toContain(cellType(L.level, r.x, r.y + 1));
      expect(r.x).toBeGreaterThan(L.pad.x + 4);
      expect(r.x).toBeLessThan(L.factory.x);
    }
  });

  it('the robot in the pyramid is shut in by crates (punch or stomp your way to it)', () => {
    const r = L.robots[6];
    expect(L.level.get(r.x, r.y - 2)).toBe(RB.CRATE);
    expect(L.level.get(r.x - 2, r.y)).toBe(RB.CRATE);
    expect(L.level.get(r.x + 2, r.y)).toBe(RB.CRATE);
  });

  it('a Mega Bot can jump three blocks, and a spring throws it above the high girders', () => {
    const jump = (MECH.jump * MECH.jump) / (2 * MECH.gravity);
    expect(jump).toBeGreaterThan(3 * 16 + 4);
    expect(jump).toBeLessThan(4 * 16);
    const spring = (MECH.spring * MECH.spring) / (2 * MECH.gravity);
    expect(spring).toBeGreaterThan(9 * 16 + 8);
    for (const x of L.springs) expect(L.level.get(x, G)).toBe(RB.SPRING);
  });

  it('the pad and the factory are clear ground', () => {
    for (let x = L.pad.x - 3; x <= L.pad.x + 3; x++) expect(cellType(L.level, x, G - 1)).toBeNull();
    for (let x = L.factory.x; x < L.factory.x + L.factory.w; x++) for (let y = G - 4; y < G; y++) expect(cellType(L.level, x, y)).toBeNull();
  });
});

describe('Robot Planet: smashing', () => {
  it('only crates and scrap break', () => {
    expect(breakable(RB.CRATE)).toBe(true);
    expect(breakable(RB.SCRAP)).toBe(true);
    expect(breakable(RB.STEEL)).toBe(false);
    expect(breakable(RB.FLOOR)).toBe(false);
  });

  it('a punch breaks the wall in front, as tall as the Mega Bot', () => {
    const L = robotLevel();
    const box = { x: 18 * 16 - MECH.w - 1, y: G * 16 - MECH.h, w: MECH.w, h: MECH.h };
    const broken = smash(L.level, punchCells(box, 1));
    expect(broken).toHaveLength(3);
    for (let y = G - 3; y < G; y++) expect(L.level.get(18, y)).toBe(0);
    expect(L.level.get(19, G - 1)).toBe(RB.CRATE);
  });

  it('a stomp breaks the crates under your feet, one layer at a time', () => {
    const L = robotLevel();
    const box = { x: 97 * 16, y: (G - 4) * 16 - MECH.h, w: MECH.w, h: MECH.h };
    const broken = smash(L.level, stompCells(box));
    expect(broken.length).toBeGreaterThanOrEqual(3);
    expect(broken.every((c) => c.y === G - 4)).toBe(true);
  });

  it('knows which way the belt under you runs', () => {
    const L = robotLevel();
    expect(beltUnder(L.level, [{ x: 40, y: G }])).toBe(1);
    expect(beltUnder(L.level, [{ x: 110, y: G }])).toBe(-1);
    expect(beltUnder(L.level, [{ x: 10, y: G }])).toBe(0);
  });

  it('a Mega Bot standing on the floor fits under three blocks of headroom', () => {
    const level = createLevel(10, 10, [null, { solid: true }]);
    level.fill(0, 9, 9, 9, 1);
    level.fill(0, 5, 9, 5, 1);
    const b = { x: 40, y: 9 * 16 - MECH.h, w: MECH.w, h: MECH.h, vx: 60, vy: 0 };
    for (let i = 0; i < 30; i++) moveBody(b, level, 1 / 60, { gravity: MECH.gravity });
    expect(b.x).toBeGreaterThan(40);
    expect(b.y + b.h).toBeCloseTo(9 * 16);
  });
});
