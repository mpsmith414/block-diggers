// The treasure hunt on Rainbow Planet. Polly the parrot at the Treasure Hall
// sells a map, and it marks an X a few layers below your deepest point. Dig
// down to it for a pirate chest: one of twelve treasures for the hall (in a
// random order) and a pile of sparkles. After all twelve, a golden map leads
// to the grand prize: a golden statue of you. The map waits until you find
// its X; dig past it and the X quietly moves below you. Pure.

import { layerOfRow } from '../world/rainbow.js';
import { canAfford, spend } from './economy.js';
import { RAINBOW, MINE_W, HUNT } from '../tuning.js';

export const HUNT_TREASURES = ['crown', 'bottleship', 'pearl', 'dragonegg', 'goldcoins', 'trophy', 'skull', 'dinobone', 'lamp', 'unicorn', 'globe', 'duck'];
export const STATUE = 'statue';
// (for the grown-ups: a caption under the treasure when you find it)
export const TREASURE_NAMES = {
  crown: 'GOLDEN CROWN', bottleship: 'SHIP IN A BOTTLE', pearl: 'GIANT PEARL', dragonegg: 'DRAGON EGG',
  goldcoins: 'PIRATE GOLD', trophy: 'RAINBOW TROPHY', skull: 'CRYSTAL SKULL', dinobone: 'GOLDEN DINO BONE',
  lamp: 'MAGIC LAMP', unicorn: 'UNICORN HORN', globe: 'TREASURE GLOBE', duck: 'GOLDEN DUCK', statue: 'GOLDEN STATUE',
};

const MAP_COST = { sparkle: HUNT.map };

// The hunt in a save (older saves have none yet).
export function huntOf(state) {
  const h = state?.hunt ?? {};
  return { map: h.map ?? null, found: [...(h.found ?? [])], shown: [...(h.shown ?? [])] };
}
export const hasStatue = (hunt) => hunt.found.includes(STATUE);
export const allTreasures = (hunt) => HUNT_TREASURES.every((t) => hunt.found.includes(t));

// Where an X goes: in a layer 3-5 below the one you're deepest in, away from
// the edges of its layer and the sides of the mine. `row` is a planet row.
export function placeX(rng, deepest) {
  const n = layerOfRow(deepest) + rng.int(HUNT.layers[0], HUNT.layers[1]);
  return {
    row: (n - 1) * RAINBOW.layerRows + rng.int(HUNT.inLayer[0], HUNT.inLayer[1]),
    col: rng.int(HUNT.edge, MINE_W - 1 - HUNT.edge),
  };
}

// What A at Polly does: sell you a map, or not (you have one, or not enough sparkles).
export function mapStatus(state) {
  if (huntOf(state).map) return 'have';
  return canAfford(state.bank, MAP_COST) ? 'ok' : 'poor';
}

export function buyMap(state, rng) {
  if (mapStatus(state) !== 'ok') return null;
  const hunt = huntOf(state);
  const golden = allTreasures(hunt) && !hasStatue(hunt);
  const map = { ...placeX(rng, state.rainbow?.deepest ?? 0), golden };
  return { ...state, bank: spend(state.bank, MAP_COST), hunt: { ...hunt, map } };
}

// At the start of a trip: an X you've dug past moves below you.
export function checkPassed(hunt, deepest, rng) {
  if (!hunt.map || deepest <= hunt.map.row) return hunt;
  return { ...hunt, map: { ...hunt.map, ...placeX(rng, deepest) } };
}

// The pirate chest: a treasure you haven't got yet (then the statue, then
// nothing but sparkles), and the map's used up.
export function openChest(hunt, rng) {
  if (!hunt.map) return null;
  const left = HUNT_TREASURES.filter((t) => !hunt.found.includes(t));
  const prize = left.length ? rng.pick(left) : hasStatue(hunt) ? null : STATUE;
  const [lo, hi] = left.length ? HUNT.chest : HUNT.golden;
  return { prize, sparkles: rng.int(lo, hi), hunt: { ...hunt, map: null, found: prize ? [...hunt.found, prize] : hunt.found } };
}

// The hall: treasures found since you last walked in (they get a fanfare).
export const newlyFound = (hunt) => hunt.found.filter((t) => !hunt.shown.includes(t));
export const markShown = (hunt) => ({ ...hunt, shown: [...hunt.found] });
