// Ocean Planet: Deep Blue Dive. The layout (pure, so it's tested) and the
// swimming numbers.
//
// A little island with the rocket pad on the left; then the sea, getting
// deeper to the right: a sunny coral reef with pillars, a slope down to the
// sunken pirate ship (in through the hole in its deck, or the one in its
// side), then the glowing deep with a rock cave, and the Giant Clam on the
// bottom at the far end. Twenty clams sit about with a pearl each.

import { createLevel } from './body.js';

export const OCEAN = { w: 128, h: 60, surface: 8, need: 20 };
export const SWIM = { speed: 82, accel: 340, drag: 3.2, dash: 210, dashTime: 0.35, sink: 8, leap: 270, turtle: 175, rideTime: 6 };

// tiles: 1 sand (the seabed's top), 2 deep sand, 3 rock, 4 coral rock,
// 5 ship planks, 6 the island's grassy top, 7 the island's sand
export const OC = { SAND: 1, DEEP: 2, ROCK: 3, CORAL: 4, PLANK: 5, GRASS: 6, ISLAND: 7 };
const KINDS = [null, ...Array(7).fill({ solid: true })];

// where the seabed's top is, column by column
function floorAt(x) {
  if (x <= 40) return 24;
  if (x <= 55) return 24 + Math.round(((x - 40) / 15) * 20);
  if (x <= 90) return 44;
  if (x <= 94) return 44 + (x - 90) * 3;
  return 56;
}

export function oceanLevel() {
  const { w, h, surface: S } = OCEAN;
  const level = createLevel(w, h, KINDS);
  // the island: grass on top, sand all the way down
  level.fill(0, S - 1, 13, S - 1, OC.GRASS);
  level.fill(0, S, 13, h - 1, OC.ISLAND);
  // the seabed
  for (let x = 14; x < w; x++) {
    const top = floorAt(x);
    level.set(x, top, x > 94 ? OC.DEEP : OC.SAND);
    level.fill(x, top + 1, x, h - 1, x > 94 ? OC.ROCK : OC.DEEP);
  }
  const clams = [];
  const clam = (x, y) => clams.push({ x, y });

  // the reef: coral pillars with clams on top, and clams along the reef
  for (const [x, tall] of [[20, 5], [28, 7], [35, 4]]) level.fill(x, 24 - tall, x + 1, 23, OC.CORAL);
  clam(20, 18); clam(29, 16); clam(35, 19);
  for (const x of [16, 24, 32, 38]) clam(x, 23);
  // a floating rock over the slope, with a clam on it
  level.fill(44, 17, 50, 18, OC.ROCK);
  clam(47, 16);
  // little ledges down the slope
  level.fill(48, 30, 50, 30, OC.CORAL);
  clam(49, 29);
  level.fill(52, 36, 54, 36, OC.CORAL);
  clam(53, 35);

  // the sunken ship: a hull with a hold inside, a hole in the deck and in its side
  const ship = { x0: 60, x1: 84, deck: 34, floor: 43, hole: [70, 73], side: [40, 42] };
  level.fill(ship.x0, ship.deck, ship.x1, ship.floor, OC.PLANK);
  level.fill(ship.x0 + 1, ship.deck + 1, ship.x1 - 1, ship.floor - 1, 0);
  level.fill(ship.hole[0], ship.deck, ship.hole[1], ship.deck, 0);
  level.fill(ship.x1, ship.side[0], ship.x1, ship.side[1], 0);
  clam(63, 42); clam(68, 42); clam(79, 42);
  clam(62, 33);

  // the deep: a rock with a cave under it, and clams on the bottom
  level.fill(100, 46, 110, 49, OC.ROCK);
  clam(105, 45);
  for (const x of [98, 102, 108, 113, 125]) clam(x, 55);

  return {
    level, clams, ship,
    pad: { x: 6, y: S - 1 },
    giant: { x: 120, y: 55 },
    turtles: [{ x0: 16, x1: 56, y: 12 }, { x0: 96, x1: 126, y: 40 }],
    jellies: [[42, 12], [58, 22], [88, 30], [92, 44], [114, 36], [120, 46]],
    puffers: [[30, 13], [66, 28], [104, 52]],
    kelp: [15, 18, 23, 26, 31, 33, 37, 39, 57, 59, 87, 89, 96, 99, 112, 117, 124],
  };
}

export const floorRow = floorAt;

// One frame of swimming: the stick sets where you want to go, you ease
// toward it, and slowly sink when you let go.
export function swimVelocity(v, stick, dt, mul = 1) {
  const want = { x: stick.x * SWIM.speed * mul, y: stick.y * SWIM.speed * mul };
  const k = Math.min(1, SWIM.drag * dt);
  const out = { x: v.x + (want.x - v.x) * k, y: v.y + (want.y - v.y) * k };
  if (!stick.x && !stick.y) out.y += SWIM.sink * dt * 4;
  return out;
}
