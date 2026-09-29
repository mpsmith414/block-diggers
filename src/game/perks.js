// What each building does for you. Immutable: state in, new state out.

import { BACKPACK, LANTERN, PERKS } from '../tuning.js';
import { plotsOf } from './economy.js';
import { layersOf, planetById } from './planets.js';

const has = (state, id) => state.plots.includes(id);
export const hasBuilt = (state, id, planet = 'earth') => plotsOf(state, planet).includes(id);
// the building that does a planet's perk (`reveal`, `elevator`)
const perkBuilt = (state, perk, planet) => {
  const id = planetById(planet)?.perks?.[perk];
  return !!id && hasBuilt(state, id, planet);
};

// the Rover Bot pulls a little trailer: half as much again
export const packCap = (state) => {
  const cap = BACKPACK[state.upgrades.pack] + (has(state, 'house') ? PERKS.houseBonus : 0);
  return (state.pets ?? []).includes('rover') ? Math.round(cap * PERKS.roverPack) : cap;
};
export const luck = (state) => (has(state, 'statue') ? 2 : 1);
export const revealsChests = (state, planet = 'earth') => perkBuilt(state, 'reveal', planet);

// ---- the Sun Suit: one piece from the bottom of each planet ----

export const hasSuit = (state, piece) => (state.suit ?? []).includes(piece);
export const winSuitPiece = (state, piece) => (hasSuit(state, piece) ? state : { ...state, suit: [...(state.suit ?? []), piece] });

// the Helmet's headlamp: 2 more blocks of light, in every mine
export const lanternRadius = (state) => LANTERN[state.upgrades.lantern] + (hasSuit(state, 'helmet') ? PERKS.headlamp : 0);
// the Boots: faster everywhere (and dust storms can't push you)
export const walkMul = (state) => (hasSuit(state, 'boots') ? PERKS.bootsSpeed : 1);
export const stormProof = (state) => hasSuit(state, 'boots');
// the Weather Station: storms on Mars carry rubies
export const stormRubies = (state) => (hasBuilt(state, 'weather', 'mars') ? PERKS.stormRubies : 0);
export const cartStartRow = (state) => (has(state, 'minecart') ? PERKS.cartRow : null);

// ---- the elevator (the minecart, the Moon's UFO, the Mars rover): to the top of any layer you've reached ----

export function elevatorStops(state, planet = 'earth') {
  if (!perkBuilt(state, 'elevator', planet)) return [];
  const reached = state.records?.layers ?? [];
  return Object.entries(layersOf(planet)).map(([layer, l], i) => ({
    layer,
    row: i === 0 ? null : l.top + 1,
    open: i === 0 || reached.includes(layer),
  }));
}

// ---- each camp's gift while you're away: the dino park digs up amber, the
// space mice make cheese, the Mars robots build bolts ----

export function campGift(state, planet = 'earth') {
  const gift = planetById(planet)?.perks?.gift;
  if (!gift || !hasBuilt(state, gift.building, planet)) return { state, ores: [] };
  const ores = Array(gift.n).fill(gift.ore);
  return { state: { ...state, bank: { ...state.bank, [gift.ore]: (state.bank[gift.ore] ?? 0) + ores.length } }, ores };
}
export const cheeseFactoryGift = (state) => campGift(state, 'moon');
export const dinoParkGift = (state) => campGift(state, 'earth');

// ---- garden: gem flowers grow while you're away ----

export function growGarden(state) {
  if (!has(state, 'garden')) return state;
  return { ...state, garden: { stock: Math.min(PERKS.gardenMax, state.garden.stock + PERKS.gardenPerTrip) } };
}

const GARDEN_ORES = ['coal', 'iron', 'gold'];

export function harvestGarden(state, rng) {
  const bank = { ...state.bank };
  const ores = [];
  for (let i = 0; i < state.garden.stock; i++) {
    // favour whatever you have least of
    const weights = Object.fromEntries(GARDEN_ORES.map((o) => [o, 1 / (1 + bank[o])]));
    const ore = rng.weighted(weights);
    bank[ore]++;
    ores.push(ore);
  }
  return { state: { ...state, bank, garden: { stock: 0 } }, ores };
}

// ---- pen: the animals leave a little gift ----

export const PEN_GIFTS = [{ iron: 2 }, { gold: 1 }, { coal: 3 }];

export function leavePenGift(state) {
  if (!has(state, 'pen')) return state;
  return { ...state, pen: { gifts: Math.min(PERKS.penMax, state.pen.gifts + 1) } };
}

export function collectPenGift(state, rng) {
  if (state.pen.gifts <= 0) return { state, ores: [] };
  const gift = rng.pick(PEN_GIFTS);
  const bank = { ...state.bank };
  const ores = [];
  for (const [ore, n] of Object.entries(gift)) {
    bank[ore] += n;
    for (let i = 0; i < n; i++) ores.push(ore);
  }
  return { state: { ...state, bank, pen: { gifts: state.pen.gifts - 1 } }, ores };
}
