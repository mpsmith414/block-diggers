import { describe, it, expect } from 'vitest';
import { upsideLevel, padFlips, UPSIDE, UD } from '../../src/game/wonder/upside.js';
import { cellType, moveBody, onFloor } from '../../src/game/wonder/body.js';

describe('Upside-Down Planet: the world', () => {
  const L = upsideLevel();

  it('thirty stars, all in open air, none twice', () => {
    expect(L.stars).toHaveLength(UPSIDE.need);
    const seen = new Set();
    for (const s of L.stars) {
      expect(cellType(L.level, s.x, s.y), `${s.x},${s.y}`).toBeNull();
      expect(seen.has(`${s.x},${s.y}`)).toBe(false);
      seen.add(`${s.x},${s.y}`);
    }
  });

  it('closed in: a floor and a ceiling all the way along (and solid below the pit)', () => {
    for (let x = 0; x < UPSIDE.w; x++) {
      expect(cellType(L.level, x, 0)).toBe('solid');
      expect(cellType(L.level, x, UPSIDE.h)).toBe('solid');
    }
  });

  it('every wall leaves a gap at least two blocks tall to get past, at the ceiling or the floor', () => {
    for (let x = 0; x < UPSIDE.w; x++) {
      let run = 0;
      let best = 0;
      for (let y = 0; y < UPSIDE.h; y++) {
        run = cellType(L.level, x, y) === null ? run + 1 : 0;
        best = Math.max(best, run);
      }
      expect(best, `column ${x}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('the pad and the tower stand on clear floor', () => {
    for (let x = L.pad.x - 3; x <= L.pad.x + 3; x++) expect(cellType(L.level, x, UPSIDE.bottom)).toBeNull();
    for (let x = L.tower.x - 2; x <= L.tower.x + 2; x++) for (let y = UPSIDE.top; y <= UPSIDE.bottom; y++) expect(cellType(L.level, x, y)).toBeNull();
  });
});

describe('Upside-Down Planet: flipping', () => {
  it('a flipped player falls up and stands on the ceiling', () => {
    const L = upsideLevel();
    const b = { x: 10 * 16, y: UPSIDE.bottom * 16, w: 12, h: 14, vx: 0, vy: 0 };
    for (let i = 0; i < 90; i++) moveBody(b, L.level, 1 / 60, { gravity: -UPSIDE.gravity, maxFall: UPSIDE.maxFall });
    expect(b.y).toBeCloseTo(UPSIDE.top * 16);
    expect(onFloor(L.level, b, -1)).toBe(true);
  });

  it('flip pads flip you only from their own side', () => {
    expect(padFlips(UD.PAD_UP, 1)).toBe(true);
    expect(padFlips(UD.PAD_UP, -1)).toBe(false);
    expect(padFlips(UD.PAD_DOWN, -1)).toBe(true);
    expect(padFlips(UD.FLOOR, 1)).toBe(false);
  });
});
