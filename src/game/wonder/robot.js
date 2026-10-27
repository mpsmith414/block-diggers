// Robot Planet: Mega Bot City. The layout (pure, so it's tested) and the
// Mega Bot's numbers.
//
// The city runs left to right: crate walls to punch through, a conveyor
// belt, a steel tower to climb, springs up to high girders, scrap walls, a
// crate pyramid with a robot inside, a belt running the wrong way, a tall
// building of girders, and the Robot Factory at the end. Twelve broken
// robots wait around it to be fixed.

import { createLevel } from './body.js';

export const ROBOT = { w: 184, h: 24, ground: 20, need: 12 };
export const MECH = { w: 36, h: 44, speed: 78, jump: 360, gravity: 1100, maxFall: 560, stomp: 300, spring: 600, belt: 55 };

// tiles: 1 metal floor, 2 metal under, 3 crate (breaks), 4 scrap wall (breaks),
// 5 steel (doesn't), 6 belt going right, 7 belt going left, 8 spring, 9 girder (a ledge)
export const RB = { FLOOR: 1, UNDER: 2, CRATE: 3, SCRAP: 4, STEEL: 5, BELT_R: 6, BELT_L: 7, SPRING: 8, GIRDER: 9 };
const KINDS = [null, ...Array(7).fill({ solid: true }), { solid: true }, { solid: true, oneWay: true }];
export const breakable = (n) => n === RB.CRATE || n === RB.SCRAP;

export function robotLevel() {
  const { w, h, ground: G } = ROBOT;
  const level = createLevel(w, h, KINDS, { roof: true });
  level.fill(0, G, w - 1, G, RB.FLOOR);
  level.fill(0, G + 1, w - 1, h - 1, RB.UNDER);
  const put = (x0, y0, x1, y1, n) => level.fill(x0, y0, x1, y1, n);
  const robots = [];
  const bot = (x, y) => robots.push({ x, y });

  // 1: behind a crate wall, three high
  put(18, G - 3, 19, G - 1, RB.CRATE);
  bot(23, G - 1);
  // 2: on a steel shelf, a jump up
  put(27, G - 3, 31, G - 3, RB.STEEL);
  bot(29, G - 4);
  // the first conveyor belt, carrying you along
  put(35, G, 46, G, RB.BELT_R);
  // 3: on top of the steel tower (steps up three blocks at a time)
  put(50, G - 3, 57, G - 1, RB.STEEL);
  put(53, G - 6, 57, G - 4, RB.STEEL);
  bot(55, G - 7);
  // 4: a spring up to a high girder
  put(62, G, 62, G, RB.SPRING);
  put(64, G - 9, 72, G - 9, RB.GIRDER);
  bot(69, G - 10);
  // 5 and 6: between scrap walls
  put(78, G - 3, 78, G - 1, RB.SCRAP);
  bot(81, G - 1);
  put(84, G - 3, 84, G - 1, RB.SCRAP);
  bot(87, G - 1);
  // 7: inside the crate pyramid (stomp down through it, or punch in)
  for (let k = 0; k < 4; k++) put(92 + k, G - 1 - k, 104 - k, G - 1 - k, RB.CRATE);
  put(97, G - 1, 99, G - 1, 0);
  put(97, G - 2, 99, G - 2, 0);
  bot(98, G - 1);
  // 8: at the end of a belt that runs the wrong way
  put(108, G, 118, G, RB.BELT_L);
  bot(119, G - 1);
  // 9: at the top of the girder building
  put(124, G - 3, 127, G - 3, RB.GIRDER);
  put(129, G - 6, 132, G - 6, RB.GIRDER);
  put(124, G - 9, 127, G - 9, RB.GIRDER);
  put(129, G - 12, 132, G - 12, RB.GIRDER);
  bot(131, G - 13);
  // 10: under a crate roof
  put(137, G - 4, 141, G - 4, RB.CRATE);
  put(137, G - 3, 137, G - 1, RB.CRATE);
  bot(139, G - 1);
  // 11: a spring up to another girder
  put(146, G, 146, G, RB.SPRING);
  put(148, G - 9, 154, G - 9, RB.GIRDER);
  bot(151, G - 10);
  // 12: behind a double crate wall
  put(157, G - 3, 158, G - 1, RB.CRATE);
  put(160, G - 3, 160, G - 1, RB.SCRAP);
  bot(163, G - 1);

  return {
    level, robots,
    pad: { x: 6, y: G },
    factory: { x: 168, w: 14, door: 175 },
    belts: [{ x0: 35, x1: 46, dir: 1 }, { x0: 108, x1: 118, dir: -1 }],
    springs: [62, 146],
  };
}

// The belt under you: +1, -1 or 0.
export function beltUnder(level, cells) {
  for (const c of cells ?? []) {
    const n = level.get(c.x, c.y);
    if (n === RB.BELT_R) return 1;
    if (n === RB.BELT_L) return -1;
  }
  return 0;
}

// Break the breakable cells in a list; returns the ones broken.
export function smash(level, cells) {
  const out = [];
  for (const c of cells) {
    const n = level.get(c.x, c.y);
    if (breakable(n)) { level.set(c.x, c.y, 0); out.push({ ...c, n }); }
  }
  return out;
}

// A punch: the column of cells in front of the Mega Bot, as tall as it is.
export function punchCells(box, dir, T = 16) {
  const col = dir > 0 ? Math.floor((box.x + box.w + 2) / T) : Math.floor((box.x - 2) / T);
  const out = [];
  for (let r = Math.floor(box.y / T); r <= Math.floor((box.y + box.h - 1) / T); r++) out.push({ x: col, y: r });
  return out;
}

// A stomp: the row of cells under its feet (and one either side).
export function stompCells(box, T = 16) {
  const row = Math.floor((box.y + box.h + 1) / T);
  const out = [];
  for (let c = Math.floor((box.x - 4) / T); c <= Math.floor((box.x + box.w + 3) / T); c++) out.push({ x: c, y: row });
  return out;
}
