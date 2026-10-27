import { describe, it, expect } from 'vitest';
import { tinyLevel, TINY, TY, munchable, bounceOf } from '../../src/game/wonder/tiny.js';
import { cellType } from '../../src/game/wonder/body.js';

const G = TINY.ground;
const rise = (v) => (v * v) / (2 * 900) / 16;

describe('Tiny Planet: the garden', () => {
  const L = tinyLevel();

  it('more seeds than the bucket needs, a few baked into the cookie and the sandwich', () => {
    expect(L.seeds.length).toBeGreaterThanOrEqual(TINY.need + 2);
    const hidden = L.seeds.filter((s) => s.hidden);
    expect(hidden.length).toBeGreaterThanOrEqual(6);
    for (const s of hidden) expect(munchable(L.level.get(s.x, s.y)), `${s.x},${s.y}`).toBe(true);
    for (const s of L.seeds.filter((x) => !x.hidden)) expect(cellType(L.level, s.x, s.y), `${s.x},${s.y}`).toBeNull();
  });

  it('every seed out in the open is reachable: something to stand on close below, or a bounce under it', () => {
    for (const s of L.seeds.filter((x) => !x.hidden)) {
      let ok = false;
      for (let dy = 1; dy <= 2 && !ok; dy++) if (cellType(L.level, s.x, s.y + dy)) ok = true;
      // or right above a bouncy thing, within its bounce
      for (let dx = -2; dx <= 2 && !ok; dx++) {
        for (let y = s.y + 1; y <= G && !ok; y++) {
          const b = bounceOf(L.level.get(s.x + dx, y));
          if (b && rise(b) > y - s.y) ok = true;
        }
      }
      expect(ok, `${s.x},${s.y}`).toBe(true);
    }
  });

  it('mushrooms bounce you onto the hose, the cat and the flower pot; the cat bounces you up to the high seeds', () => {
    const mush = rise(TINY.mush);
    expect(mush).toBeGreaterThan(G - 2 - L.cat.row + 0.5); // (from a mushroom onto the cat)
    const lastMush = L.mushrooms[L.mushrooms.length - 1];
    expect(mush).toBeGreaterThan(lastMush.row - L.pot.top + 0.5); // (and onto the pot)
    expect(rise(TINY.cat)).toBeGreaterThan(L.cat.row - (G - 13) + 0.5);
  });

  it('stairs go up a block at a time', () => {
    for (const [x, y] of L.cubes) {
      const height = G - y;
      if (height > 1) expect(cellType(L.level, x - 1, G - 1) === 'solid' || cellType(L.level, x - 2, G - 1) === 'solid').toBe(true);
    }
  });

  it('the pad is clear, and the pot sits at the far end', () => {
    for (let x = L.pad.x - 3; x <= L.pad.x + 3; x++) expect(cellType(L.level, x, G - 1)).toBeNull();
    expect(L.pot.x0).toBeGreaterThan(TINY.w * 0.85);
    expect(L.level.get(L.pot.x0 + 3, L.pot.top)).toBe(TY.POT);
  });
});
