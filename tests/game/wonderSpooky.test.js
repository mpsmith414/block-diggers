import { describe, it, expect } from 'vitest';
import { spookyLevel, dealSurprises, candyAvailable, openGate, SPOOKY, SP, SURPRISES, HOUSE_W } from '../../src/game/wonder/spooky.js';
import { cellType } from '../../src/game/wonder/body.js';
import { createRng } from '../../src/world/rng.js';

const G = SPOOKY.ground;

describe('Spooky Planet: the street', () => {
  const L = spookyLevel();

  it('ten houses, eight pumpkins, four trees, the gate and the Haunted House, in order along the street', () => {
    expect(L.houses).toHaveLength(10);
    expect(L.pumpkins).toHaveLength(8);
    expect(L.trees).toHaveLength(4);
    expect(L.pad.x).toBeLessThan(L.houses[0].x - 4);
    expect(L.gate[0]).toBeGreaterThan(Math.max(...L.graves));
    expect(L.haunted.x).toBeGreaterThan(L.gate[1]);
    expect(L.haunted.x + L.haunted.w).toBeLessThanOrEqual(SPOOKY.w);
  });

  it('nothing is built on top of anything else', () => {
    const used = new Map();
    const claim = (x0, x1, what) => {
      for (let x = x0; x <= x1; x++) {
        expect(used.get(x), `${what} at ${x} vs ${used.get(x)}`).toBeUndefined();
        used.set(x, what);
      }
    };
    claim(L.pad.x - 3, L.pad.x + 3, 'pad');
    L.houses.forEach((h, i) => {
      claim(h.x, h.x + HOUSE_W - 1, `house${i}`);
      if (h.stairs) claim(h.x - 3, h.x - 1, `stairs${i}`);
    });
    L.trees.forEach((t, i) => claim(t.x - 2, t.x + 2, `tree${i}`));
    L.pumpkins.forEach((p, i) => claim(p.x, p.x, `pumpkin${i}`));
    L.graves.forEach((x, i) => claim(x, x, `grave${i}`));
    claim(L.gate[0], L.gate[1], 'gate');
    claim(L.haunted.x, L.haunted.x + L.haunted.w - 1, 'haunted');
    L.fences.forEach(([a, b], i) => claim(a, b, `fence${i}`));
  });

  it('every loose candy has something to stand on just under it', () => {
    for (const c of L.candies) {
      const under = cellType(L.level, c.x, c.y + 1);
      expect(['solid', 'oneway'], `${c.x},${c.y}`).toContain(under);
      expect(cellType(L.level, c.x, c.y)).toBeNull();
    }
  });

  it('stairs go up a block at a time to the balcony, one block below it', () => {
    for (const h of L.houses.filter((x) => x.stairs)) {
      for (let k = 0; k < 3; k++) expect(L.level.get(h.x - 3 + k, G - 1 - k)).toBe(SP.CRATE);
      expect(L.level.get(h.x, h.balcony)).toBe(SP.LEDGE);
      expect(h.balcony).toBe(G - 4);
    }
  });

  it('the gate shuts the Haunted House off right up to the sky, until it opens', () => {
    const level = spookyLevel().level;
    const layout = spookyLevel();
    for (let y = 0; y < G; y++) expect(cellType(layout.level, layout.gate[0], y)).toBe('solid');
    openGate(layout.level, layout);
    for (let y = 0; y < G; y++) expect(cellType(layout.level, layout.gate[0], y)).toBeNull();
    expect(cellType(level, layout.gate[0], 3)).toBe('solid'); // (a fresh street is shut again)
  });
});

describe('Spooky Planet: the candy', () => {
  it('every door gets a surprise: two candy showers, two of each of the others', () => {
    for (let seed = 1; seed < 40; seed++) {
      const s = dealSurprises(createRng(seed));
      expect(s).toHaveLength(10);
      for (const k of Object.keys(SURPRISES)) expect(s.filter((x) => x === k).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('there is always plenty of candy to fill the bucket without the ghost-only balconies', () => {
    const L = spookyLevel();
    for (let seed = 1; seed < 40; seed++) {
      const all = candyAvailable(dealSurprises(createRng(seed)), L);
      expect(all - 2).toBeGreaterThanOrEqual(SPOOKY.need + 10);
    }
  });
});
