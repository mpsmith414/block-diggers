import { describe, it, expect } from 'vitest';
import { varies, variantOf, varyTile } from '../../src/art/tileVariety.js';
import { B } from '../../src/world/blocks.js';

describe('rock variety', () => {
  it('the same cell always looks the same', () => {
    expect(variantOf(5, 9)).toEqual(variantOf(5, 9));
  });

  it('a wall of rock uses all four looks, mixed about evenly', () => {
    const counts = {};
    for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) {
      const v = variantOf(x, y);
      const k = `${v.flipX}${v.flipY}`;
      counts[k] = (counts[k] ?? 0) + 1;
    }
    expect(Object.keys(counts)).toHaveLength(4);
    for (const n of Object.values(counts)) expect(n).toBeGreaterThan(300);
  });

  it('neighbours often differ (no stripes)', () => {
    let same = 0;
    for (let x = 0; x < 200; x++) {
      const a = variantOf(x, 7);
      const b = variantOf(x + 1, 7);
      if (a.flipX === b.flipX && a.flipY === b.flipY) same++;
    }
    expect(same).toBeLessThan(90);
  });

  it('plain rock and ore vary; things with an up and down never do', () => {
    for (const id of [B.DIRT, B.STONE, B.DEEP, B.MOONROCK, B.MARS_ROCK, B.ICE, B.JUNGLE_SOIL, B.CORONA_ROCK, B.IRON, B.RUBY]) expect(varies(id)).toBe(true);
    for (const id of [B.GRASS, B.LADDER, B.BRICKS, B.WATER, B.LAVA, B.CHEST, B.HEART, B.GOLD_CRYSTAL, B.SNOW, B.FLARE]) expect(varies(id)).toBe(false);
    const tile = { index: B.GRASS, flipX: true, flipY: true };
    varyTile(tile, 3, 3);
    expect(tile).toMatchObject({ flipX: false, flipY: false });
  });
});
