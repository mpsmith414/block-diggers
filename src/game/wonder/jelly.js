// Jelly Planet: Wobble Tower. The layout (pure, so it's tested) and the
// bounce rules.
//
// A tall tower of jelly. Eight sections, each with a crispy wafer floor
// (a ledge: jump up through it, land on it, and a fall only drops you to the
// one below) and four jelly blocks zig-zagging up, three blocks apart, so a
// plain bounce always reaches the next one (and the next floor). Hold A as
// you land for a super bounce: each one in a row goes higher. The Jelly
// Castle sits on top.

import { createLevel } from './body.js';

export const JELLY = { w: 32, h: 126, section: 14, sections: 8, gravity: 900, maxFall: 480 };
export const BOUNCE = { keep: 0.85, least: 360, supers: [470, 580, 690], bear: 560, wafer: 250, float: 2.4, floatUp: 110 };

// tiles: 1 the ground, 2 a wafer ledge, 3 the tower's walls, 4 jelly (bouncy)
export const JL = { GROUND: 1, WAFER: 2, WALL: 3, JELLY: 4 };
// (jelly is a ledge too: bounce up through the block above, and land on it)
const KINDS = [null, { solid: true }, { solid: true, oneWay: true }, { solid: true }, { solid: true, oneWay: true }];

export const STONE_W = 5;

export function jellyLevel() {
  const { w, h, section, sections } = JELLY;
  const G = h - 3;
  const level = createLevel(w, h, KINDS);
  level.fill(0, G, w - 1, h - 1, JL.GROUND);
  level.fill(0, 0, 0, h - 1, JL.WALL);
  level.fill(w - 1, 0, w - 1, h - 1, JL.WALL);
  const stones = [];
  const beans = [];
  const bears = [];
  const gumballs = [];
  for (let k = 0; k < sections; k++) {
    const floor = G - k * section;
    if (k > 0) level.fill(1, floor, w - 2, floor, JL.WAFER);
    const xs = k % 2 === 0 ? [6, 11, 16, 21] : [21, 16, 11, 6];
    xs.forEach((x0, i) => {
      const row = floor - 1 - i * 3;
      level.fill(x0, row, x0 + STONE_W - 1, row, JL.JELLY);
      stones.push({ x0, row, color: (k + i) % 4 });
      beans.push({ x: x0 + 2, y: row - 2 });
    });
    if (k > 0) {
      bears.push({ x0: 2, x1: w - 3, y: floor - 1 });
      beans.push({ x: k % 2 ? 3 : w - 4, y: floor - 1 }, { x: 15, y: floor - 6 });
    }
    gumballs.push({ x: xs[1] + 2, y: floor - 8 });
  }
  const top = G - sections * section;
  level.fill(1, top, w - 2, top, JL.WAFER);
  return {
    level, stones, beans, bears, gumballs,
    ground: G,
    top,
    pad: { x: 27, y: G },
    castle: { x: 16, y: top },
  };
}

// How fast you leave a jelly block: a plain bounce keeps most of your fall
// (but always at least `least`); holding A makes it a super bounce, and each
// super bounce in a row goes higher. Returns { vy, combo }.
export function bounce(impact, holdingA, combo) {
  if (holdingA) {
    const next = Math.min(combo + 1, BOUNCE.supers.length);
    return { vy: -BOUNCE.supers[next - 1], combo: next };
  }
  return { vy: -Math.max(impact * BOUNCE.keep, BOUNCE.least), combo: 0 };
}

// How far up the tower a feet height (in pixels) is, from 0 at the ground to 1 at the castle.
export function climbed(feetY, layout, T = 16) {
  const g = layout.ground * T;
  const t = layout.top * T;
  return Math.max(0, Math.min(1, (g - feetY) / (g - t)));
}
