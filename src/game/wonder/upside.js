// Upside-Down Planet: Topsy-Turvy Land. The layout (pure, so it's tested).
//
// A long world closed in by a floor and a ceiling, ten blocks apart. A flips
// gravity: you fall up to the ceiling and walk along it upside down. Walls
// rise from the floor (go over them on the ceiling) and hang from the ceiling
// (go under them on the floor); flip pads flip you as you step on them; a
// pit to drop into; a squeeze; stars floating in a wave to catch mid-flip;
// and the Topsy Tower at the end, standing on its head.

import { createLevel } from './body.js';

export const UPSIDE = { w: 172, h: 16, top: 3, bottom: 12, need: 30, gravity: 900, maxFall: 300, flipAgain: 0.15, funFlips: 10 };

// tiles: 1 ceiling ground, 2 floor ground, 3 a block in the middle,
// 4 a flip pad on the floor, 5 a flip pad on the ceiling
export const UD = { CEIL: 1, FLOOR: 2, BLOCK: 3, PAD_UP: 4, PAD_DOWN: 5 };
const KINDS = [null, { solid: true }, { solid: true }, { solid: true }, { solid: true }, { solid: true }];

export function upsideLevel() {
  const { w, h, top, bottom } = UPSIDE;
  const level = createLevel(w, h, KINDS, { roof: true });
  level.fill(0, 0, w - 1, top - 1, UD.CEIL);
  level.fill(0, bottom + 1, w - 1, h - 1, UD.FLOOR);
  const stars = [];
  const star = (x, y) => stars.push({ x, y });
  const floorWall = (x0, x1, upTo = 6) => level.fill(x0, upTo, x1, bottom, UD.FLOOR);
  const ceilWall = (x0, x1, downTo = 9) => level.fill(x0, top, x1, downTo, UD.CEIL);

  // to start: stars on the ceiling over your head
  for (const x of [15, 17, 19]) star(x, top);
  // a wall from the floor: over it on the ceiling
  floorWall(23, 24);
  for (const x of [22, 25]) star(x, top);
  // a wall from the ceiling: under it on the floor
  ceilWall(30, 31);
  for (const x of [29, 32]) star(x, bottom);
  // flip pads: one on the floor, one on the ceiling
  level.set(37, bottom + 1, UD.PAD_UP);
  level.set(43, top - 1, UD.PAD_DOWN);
  star(40, 7);
  // a block in the middle, with stars on both its sides
  level.fill(47, 7, 51, 8, UD.BLOCK);
  star(49, 6); star(49, 9);
  // the zig-zag: floor, ceiling, floor walls, stars in the gaps mid-way
  floorWall(56, 57);
  ceilWall(61, 62);
  floorWall(66, 67);
  star(59, 7); star(64, 8); star(69, 7);
  // a pit in the floor, with stars at its bottom
  level.fill(73, bottom + 1, 80, h - 1, 0);
  for (const x of [74, 77, 79]) star(x, h - 1);
  // the upside-down house and cow hang here; stars along the ceiling by them
  for (const x of [86, 90, 94]) star(x, top);
  // a little floating block with a flip pad on each side
  level.fill(99, 7, 101, 8, UD.BLOCK);
  star(100, 6); star(100, 9);
  // the squeeze: the ceiling comes down, then the floor comes up
  ceilWall(105, 112, 6);
  floorWall(109, 116, 10);
  star(110, 8); star(114, 8);
  // the star river: stars in a wave to catch as you flip up and down
  for (let k = 0; k < 6; k++) star(121 + k * 3, 4 + Math.round((Math.sin(k * 1.1) + 1) * 3.5));
  // a last double wall
  floorWall(144, 145);
  ceilWall(149, 150);
  star(147, top);

  return {
    level, stars,
    pad: { x: 6, y: bottom + 1 },
    tower: { x: 164 },
    house: { x: 88 },
    cow: { x: 93 },
    trees: [12, 34, 53, 70, 97, 119, 140, 155],
    clouds: [9, 27, 45, 64, 84, 103, 125, 139, 158],
  };
}

// Is this tile a flip pad that flips you when you stand on it with gravity
// pulling you onto it? (+1 gravity stands on the floor's pads, -1 the ceiling's)
export function padFlips(n, gravitySign) {
  return (n === UD.PAD_UP && gravitySign > 0) || (n === UD.PAD_DOWN && gravitySign < 0);
}
