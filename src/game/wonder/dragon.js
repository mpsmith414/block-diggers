// Dragon Planet: Sky Dragons. The layout (pure, so it's tested) and the
// flying numbers.
//
// A wide sky of floating islands over a sea of clouds. The rocket stands on
// the first island. Bunches of balloons float all about, golden rings wait
// to be flown through, and Mama Dragon's nest sits on the highest island at
// the far end.

import { createLevel } from './body.js';

export const DRAGON = { w: 240, h: 40, sea: 37, need: 30 };
export const FLY = { speed: 120, ease: 4, w: 22, h: 14, fire: 260, fireLife: 0.8, fireAgain: 0.35, seaBounce: 200 };

// tiles: 1 grassy top, 2 earth, 3 the rounded underside, 4 the cloud sea
export const DG = { GRASS: 1, EARTH: 2, UNDER: 3, SEA: 4 };
const KINDS = [null, { solid: true }, { solid: true }, { solid: true }, { solid: true }];

// floating islands: [x0, x1, top row, how deep]
const ISLANDS = [
  [2, 14, 22, 4], [24, 32, 16, 3], [40, 50, 26, 3], [58, 66, 12, 3], [74, 86, 20, 4],
  [96, 104, 28, 3], [112, 120, 14, 3], [130, 142, 22, 4], [152, 160, 9, 3], [168, 178, 25, 3],
  [186, 196, 16, 4], [204, 212, 27, 3], [220, 236, 7, 4],
];

export function dragonLevel() {
  const { w, h, sea } = DRAGON;
  const level = createLevel(w, h, KINDS, { roof: true });
  level.fill(0, sea, w - 1, h - 1, DG.SEA);
  const islands = ISLANDS.map(([x0, x1, top, depth]) => {
    level.fill(x0, top, x1, top, DG.GRASS);
    level.fill(x0, top + 1, x1, top + depth - 1, DG.EARTH);
    // the underside narrows, so the island looks like a floating rock
    level.fill(x0 + 1, top + depth, x1 - 1, top + depth, DG.UNDER);
    level.fill(x0 + 3, top + depth + 1, x1 - 3, top + depth + 1, DG.UNDER);
    return { x0, x1, top, depth };
  });

  // balloons, in bunches of three to five, in open sky between the islands
  const bunches = [
    [19, 14, 3], [36, 9, 3], [45, 18, 3], [54, 24, 2], [70, 8, 3], [91, 14, 3], [108, 22, 2],
    [125, 9, 3], [147, 18, 2], [164, 14, 2], [182, 24, 2], [200, 10, 2],
  ];
  const balloons = [];
  for (const [x, y, n] of bunches) for (let i = 0; i < n; i++) balloons.push({ x: x + (i % 3) - 1 + (i > 2 ? 0.5 : 0), y: y - (i > 2 ? 2 : (i % 2) * 1.2), bunch: `${x},${y}` });
  return {
    level, islands, balloons,
    rings: [{ x: 28, y: 10 }, { x: 62, y: 6 }, { x: 92, y: 24 }, { x: 116, y: 8 }, { x: 158, y: 4 }, { x: 192, y: 10 }],
    pad: { x: 8, y: 22 },
    nest: { x: 228, y: 7 },
  };
}

// Easing a dragon's speed toward where the stick points.
export function flyVelocity(v, stick, dt) {
  const k = Math.min(1, FLY.ease * dt);
  return { x: v.x + (stick.x * FLY.speed - v.x) * k, y: v.y + (stick.y * FLY.speed - v.y) * k };
}
