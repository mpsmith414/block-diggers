// Spooky Planet: Trick-or-Treat Street. The layout (pure, so it's tested) and
// the rules for what each door gives.
//
// A night street: the rocket pad, five houses, the pumpkin patch, five more
// houses, the graveyard, then the iron gate and the Haunted House. Crates make
// stairs up to some houses' balconies; spooky trees have branches to climb.

import { createLevel } from './body.js';

export const SPOOKY = { w: 172, h: 20, ground: 16, need: 40, ghostTime: 6, ghostAgain: 8 };

// tiles: 1 grass, 2 earth, 3 crate, 4 fence top / balcony (a ledge),
// 5 branch (a ledge, drawn by its tree), 6 the gate (drawn by its sprite)
export const SP = { GRASS: 1, EARTH: 2, CRATE: 3, LEDGE: 4, BRANCH: 5, GATE: 6 };
const KINDS = [null, { solid: true }, { solid: true }, { solid: true }, { solid: true, oneWay: true }, { solid: true, oneWay: true }, { solid: true }];

export const HOUSE_W = 5;
const HOUSES = [14, 25, 36, 47, 58, 86, 97, 108, 119, 130];
const STAIRS = [1, 4, 7]; // houses with crate stairs up to their balcony
const PUMPKINS = [66, 68, 70, 72, 74, 76, 78, 80];
const TREES = [43, 83, 93, 126];
const GRAVES = [138, 141, 144, 147];
const GATE = [151, 152];
const HAUNTED = { x: 155, w: 15, door: 162 };

// What's behind each door: candy (a shower of it), a giggling ghost, a
// dancing skeleton, or a cat in a witch's hat. Every one gives candy.
export const SURPRISES = { candy: 5, ghost: 3, skeleton: 3, cat: 3 };

export function spookyLevel() {
  const { w, h, ground: G } = SPOOKY;
  const level = createLevel(w, h, KINDS, { roof: true });
  level.fill(0, G, w - 1, G, SP.GRASS);
  level.fill(0, G + 1, w - 1, h - 1, SP.EARTH);

  const houses = HOUSES.map((x, i) => ({ x, door: x + 2, balcony: G - 4, stairs: STAIRS.includes(i) }));
  for (const hs of houses) {
    level.fill(hs.x, hs.balcony, hs.x + HOUSE_W - 1, hs.balcony, SP.LEDGE);
    // stairs: 1, 2 and 3 crates high, up the house's left side
    if (hs.stairs) for (let k = 0; k < 3; k++) level.fill(hs.x - 3 + k, G - 1 - k, hs.x - 3 + k, G - 1, SP.CRATE);
  }
  // trees: branches zig-zagging up either side of the trunk, a block apart
  const trees = TREES.map((x) => ({ x, branches: [[x - 2, G - 1], [x + 1, G - 2], [x - 2, G - 3], [x + 1, G - 4]] }));
  for (const t of trees) for (const [bx, by] of t.branches) level.fill(bx, by, bx + 1, by, SP.BRANCH);
  // fences between some houses: a ledge one block up
  const fences = [[31, 34], [113, 117]];
  for (const [a, b] of fences) level.fill(a, G - 1, b, G - 1, SP.LEDGE);
  // the graveyard's tombstones are a block high (stand on them)
  for (const x of GRAVES) level.set(x, G - 1, SP.CRATE);
  // the gate: an iron fence right up to the sky until the bucket is full
  for (const x of GATE) level.fill(x, 0, x, G - 1, SP.GATE);

  // loose candy: on the tree tops, on balconies, on the tombstones
  const candies = [
    ...trees.map((t) => ({ x: t.x + 2, y: G - 5 })),
    ...[1, 3, 4, 7, 9].map((i) => ({ x: houses[i].x + 2, y: G - 5 })),
    ...GRAVES.slice(0, 3).map((x) => ({ x, y: G - 2 })),
  ];
  return {
    level, houses, trees, fences, candies,
    pad: { x: 6, y: G },
    pumpkins: PUMPKINS.map((x) => ({ x, y: G - 1 })),
    graves: GRAVES,
    gate: GATE,
    haunted: HAUNTED,
    ghosts: [{ x0: 28, x1: 52, y: G - 4 }, { x0: 84, x1: 112, y: G - 5 }, { x0: 116, x1: 146, y: G - 4 }],
  };
}

// Deal the surprises to the ten doors: two candy showers and two of each of
// the others, the rest random, shuffled by `rng`.
export function dealSurprises(rng, n = HOUSES.length) {
  const out = ['candy', 'candy', 'ghost', 'ghost', 'skeleton', 'skeleton', 'cat', 'cat'];
  const kinds = Object.keys(SURPRISES);
  while (out.length < n) out.push(kinds[rng.int(0, kinds.length - 1)]);
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, n);
}

// All the candy there is on a visit (doors, pumpkins and loose ones).
export function candyAvailable(surprises, layout) {
  return surprises.reduce((n, s) => n + SURPRISES[s], 0) + layout.pumpkins.length + layout.candies.length;
}

// Open the gate (when the bucket is full).
export function openGate(level, layout) {
  for (const x of layout.gate) level.fill(x, 0, x, SPOOKY.ground - 1, 0);
}
