import { describe, it, expect } from 'vitest';
import { oceanLevel, OCEAN, SWIM, swimVelocity, floorRow } from '../../src/game/wonder/ocean.js';
import { cellType } from '../../src/game/wonder/body.js';

const S = OCEAN.surface;

describe('Ocean Planet: the sea', () => {
  const L = oceanLevel();

  it('twenty clams, each sitting on something, underwater, in open water', () => {
    expect(L.clams).toHaveLength(OCEAN.need);
    const seen = new Set();
    for (const c of L.clams) {
      expect(c.y, `${c.x},${c.y}`).toBeGreaterThan(S);
      expect(cellType(L.level, c.x, c.y), `${c.x},${c.y}`).toBeNull();
      expect(cellType(L.level, c.x, c.y + 1), `${c.x},${c.y}`).toBe('solid');
      expect(seen.has(`${c.x},${c.y}`)).toBe(false);
      seen.add(`${c.x},${c.y}`);
    }
  });

  it('the island stands a block above the water, with the pad on it', () => {
    expect(cellType(L.level, L.pad.x, S - 1)).toBe('solid');
    expect(cellType(L.level, L.pad.x, S - 2)).toBeNull();
    expect(cellType(L.level, 14, S)).toBeNull();
  });

  it('the ship has a hold you can swim into, through the deck and through its side', () => {
    const { ship } = L;
    expect(cellType(L.level, ship.hole[0], ship.deck)).toBeNull();
    expect(cellType(L.level, ship.x1, ship.side[0])).toBeNull();
    expect(cellType(L.level, ship.x0 + 3, ship.deck + 3)).toBeNull();
    expect(cellType(L.level, ship.x0 + 3, ship.floor)).toBe('solid');
  });

  it('the Giant Clam sits on the deep floor; turtles, jellyfish and pufferfish swim in open water', () => {
    expect(cellType(L.level, L.giant.x, L.giant.y + 1)).toBe('solid');
    for (const t of L.turtles) for (let x = t.x0; x <= t.x1; x += 4) expect(cellType(L.level, x, t.y), `turtle ${x}`).toBeNull();
    for (const [x, y] of [...L.jellies, ...L.puffers]) expect(cellType(L.level, x, y), `${x},${y}`).toBeNull();
  });

  it('the seabed gets deeper to the right', () => {
    expect(floorRow(20)).toBeLessThan(floorRow(70));
    expect(floorRow(70)).toBeLessThan(floorRow(110));
  });
});

describe('Ocean Planet: swimming', () => {
  it('eases toward where the stick points, and sinks slowly when let go', () => {
    let v = { x: 0, y: 0 };
    for (let i = 0; i < 120; i++) v = swimVelocity(v, { x: 1, y: 0 }, 1 / 60);
    expect(v.x).toBeCloseTo(SWIM.speed, 0);
    for (let i = 0; i < 120; i++) v = swimVelocity(v, { x: 0, y: 0 }, 1 / 60);
    expect(Math.abs(v.x)).toBeLessThan(2);
    expect(v.y).toBeGreaterThan(0);
    expect(v.y).toBeLessThan(SWIM.speed / 2);
  });
});
