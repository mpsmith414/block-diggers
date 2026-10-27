// Tiny Planet: Bug-Sized Backyard. The layout (pure, so it's tested).
//
// You're bug-sized in a giant's garden. Daisy leaves to climb, mushroom caps
// that bounce you, a giant cookie and a sandwich to munch through (seeds are
// hidden inside), a garden hose to walk along, ants to ride, sugar cubes for
// steps, a sleeping cat whose tummy bounces you sky-high, a ladybug who flies
// you up to the high leaves, and the flower pot at the end where the seeds
// get planted.

import { createLevel } from './body.js';

export const TINY = { w: 200, h: 30, ground: 26, need: 25, mush: 360, cat: 540, munch: 0.25 };

// tiles: 1 soil, 2 a leaf (a ledge), 3 a mushroom cap (a bouncy ledge), 4 cookie
// (munch it), 5 sandwich (munch it), 6 a sugar cube, 7 the hose (a ledge),
// 8 the cat's back (a bouncy ledge), 9 the flower pot
export const TY = { SOIL: 1, LEAF: 2, MUSH: 3, COOKIE: 4, BREAD: 5, CUBE: 6, HOSE: 7, CAT: 8, POT: 9 };
const KINDS = [
  null, { solid: true }, { solid: true, oneWay: true }, { solid: true, oneWay: true }, { solid: true },
  { solid: true }, { solid: true }, { solid: true, oneWay: true }, { solid: true, oneWay: true }, { solid: true },
];
export const munchable = (n) => n === TY.COOKIE || n === TY.BREAD;
export const bounceOf = (n) => (n === TY.MUSH ? TINY.mush : n === TY.CAT ? TINY.cat : 0);

export function tinyLevel() {
  const { w, h, ground: G } = TINY;
  const level = createLevel(w, h, KINDS, { roof: true });
  level.fill(0, G, w - 1, h - 1, TY.SOIL);
  const put = (x0, y0, x1, y1, n) => level.fill(x0, y0, x1, y1, n);
  const seeds = [];
  const seed = (x, y, hidden = false) => seeds.push({ x, y, hidden });
  const mushrooms = [];
  const mush = (x0, row) => { put(x0, row, x0 + 2, row, TY.MUSH); mushrooms.push({ x0, row }); };

  // daisy leaves, stepping up
  const leaves = [[14, G - 2], [19, G - 4], [24, G - 6]];
  for (const [x, y] of leaves) put(x, y, x + 3, y, TY.LEAF);
  seed(15, G - 3); seed(20, G - 5); seed(25, G - 7); seed(20, G - 1);
  // a mushroom
  mush(30, G - 2);
  seed(31, G - 4);
  // the giant cookie (seeds baked inside)
  put(38, G - 5, 43, G - 5, TY.COOKIE);
  put(36, G - 4, 45, G - 2, TY.COOKIE);
  put(37, G - 1, 44, G - 1, TY.COOKIE);
  seed(38, G - 3, true); seed(41, G - 2, true); seed(44, G - 4, true); seed(40, G - 5, true);
  // the garden hose, up on a mushroom
  mush(47, G - 2);
  put(50, G - 3, 76, G - 3, TY.HOSE);
  seed(56, G - 4); seed(64, G - 4); seed(72, G - 4);
  seed(60, G - 1); seed(85, G - 1);
  // sugar cube steps
  put(81, G - 1, 82, G - 1, TY.CUBE);
  put(83, G - 2, 84, G - 1, TY.CUBE);
  seed(84, G - 3);
  // the sleeping cat (its back bounces you high), with a mushroom to get on
  mush(88, G - 2);
  seed(89, G - 6);
  put(93, G - 4, 105, G - 4, TY.CAT);
  seed(98, G - 11); seed(101, G - 13);
  put(110, G - 10, 114, G - 10, TY.LEAF);
  seed(112, G - 11);
  // the picnic: a sandwich (seeds in the filling), the blanket
  put(122, G - 5, 129, G - 1, TY.BREAD);
  seed(124, G - 3, true); seed(127, G - 2, true); seed(125, G - 5, true);
  seed(118, G - 1); seed(148, G - 1);
  // the ladybug flies you up to the high leaves
  put(158, G - 14, 163, G - 14, TY.LEAF);
  put(165, G - 12, 170, G - 12, TY.LEAF);
  seed(160, G - 15); seed(162, G - 15); seed(167, G - 13);
  // the flower pot, with a sugar cube and a mushroom to get up on it
  put(171, G - 1, 173, G - 1, TY.CUBE);
  put(174, G - 2, 175, G - 1, TY.CUBE);
  mush(174, G - 3);
  put(178, G - 6, 188, G - 1, TY.POT);

  return {
    level, seeds, leaves, mushrooms,
    pad: { x: 6, y: G },
    cookie: { x0: 36, x1: 45 },
    sandwich: { x0: 122, x1: 129 },
    hose: { x0: 50, x1: 76, row: G - 3 },
    cubes: [[81, G - 1, 2, 1], [83, G - 2, 2, 2], [171, G - 1, 3, 1], [174, G - 2, 2, 2]],
    cat: { x0: 93, x1: 105, row: G - 4 },
    ants: { x0: 52, x1: 118 },
    ladybug: { x: 152, to: { x: 160, y: G - 15 } },
    pot: { x0: 178, x1: 188, top: G - 6 },
  };
}
