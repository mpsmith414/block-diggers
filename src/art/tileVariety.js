// So big walls of rock don't look like wallpaper: each cell of plain rock (and
// ore) is drawn mirrored one of four ways (as it is, flipped across, flipped
// up-down, or both), picked from where it is, so the same place always looks
// the same. Blocks that have a real up and down (grass, ladders, bricks,
// crystals, water, lava, chests and the special finds) are always drawn as
// they are.

import { B } from '../world/blocks.js';

const FIXED = new Set([
  B.AIR, B.GRASS, B.LADDER, B.LAVA, B.WATER, B.CHEST, B.BIGCHEST, B.BIGCHEST_R, B.BOULDER, B.EGG, B.BOOM,
  B.BRICKS, B.BRICK_ORE, B.SPRING, B.HEART,
  B.GOLD_CRYSTAL, B.DIAMOND_CRYSTAL, B.EMERALD_CRYSTAL, B.SPACE_CRYSTAL,
  B.CHEESE_WHEEL, B.TELEPORT, B.MOON_HEART, B.UFO, B.ALIEN_PANEL,
  B.RUIN_STONE, B.MARS_HEART, B.GEYSER, B.OLD_ROVER, B.VAULT, B.VAULT_DOOR, B.GLYPH,
  B.SATURN_HEART, B.SNOWBALL, B.SNOW_GLOBE, B.FROZEN_COMET, B.SNOW,
  B.DINO_HEART, B.PARASAUR, B.NEST, B.REX_SKULL, B.STEGO,
  B.FLARE, B.SUN_HEART, B.FIRE_FLOWER, B.FORGE,
]);

export const varies = (id) => !FIXED.has(id);

// How cell (x, y) is mirrored: always the same for the same cell.
export function variantOf(x, y) {
  const h = (Math.imul(x + 1, 73856093) ^ Math.imul(y + 1, 19349663)) >>> 0;
  const k = (h ^ (h >>> 13)) & 3;
  return { flipX: (k & 1) === 1, flipY: (k & 2) === 2 };
}

// Mirror a tilemap tile if its block varies (the back walls always do).
export function varyTile(tile, x, y, always = false) {
  if (!tile) return tile;
  const v = always || varies(tile.index) ? variantOf(x, y) : { flipX: false, flipY: false };
  tile.flipX = v.flipX;
  tile.flipY = v.flipY;
  return tile;
}
