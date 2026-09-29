// What each building does for you. Immutable: state in, new state out.

import { BACKPACK, LANTERN, PERKS, PETS } from '../tuning.js';
import { plotsOf } from './economy.js';
import { layersOf } from './planets.js';

const has = (state, id) => state.plots.includes(id);
export const hasBuilt = (state, id, planet = 'earth') => plotsOf(state, planet).includes(id);

export const packCap = (state) => BACKPACK[state.upgrades.pack] + (has(state, 'house') ? PERKS.houseBonus : 0);
export const luck = (state) => (has(state, 'statue') ? 2 : 1);
export const revealsChests = (state, planet = 'earth') => hasBuilt(state, planet === 'moon' ? 'telescope' : 'tower', planet);

// ---- the Sun Suit: one piece from the bottom of each planet ----

export const hasSuit = (state, piece) => (state.suit ?? []).includes(piece);
export const winSuitPiece = (state, piece) => (hasSuit(state, piece) ? state : { ...state, suit: [...(state.suit ?? []), piece] });

// the Helmet's headlamp: 2 more blocks of light, in every mine
export const lanternRadius = (state) => LANTERN[state.upgrades.lantern] + (hasSuit(state, 'helmet') ? PERKS.headlamp : 0);
export const cartStartRow = (state) => (has(state, 'minecart') ? PERKS.cartRow : null);

// ---- minecart (the UFO on the Moon): an elevator to the top of any layer you've reached ----

export function elevatorStops(state, planet = 'earth') {
  if (!hasBuilt(state, planet === 'moon' ? 'hangar' : 'minecart', planet)) return [];
  const reached = state.records?.layers ?? [];
  return Object.entries(layersOf(planet)).map(([layer, l], i) => ({
    layer,
    row: i === 0 ? null : l.top + 1,
    open: i === 0 || reached.includes(layer),
  }));
}

// ---- cheese factory: the space mice make cheese while you're away ----

export function cheeseFactoryGift(state) {
  if (!hasBuilt(state, 'cheesefactory', 'moon')) return { state, ores: [] };
  const ores = Array(PERKS.factoryCheese).fill('cheese');
  return { state: { ...state, bank: { ...state.bank, cheese: (state.bank.cheese ?? 0) + ores.length } }, ores };
}

// ---- dino park: the baby dinosaurs dig up amber while you're away ----

export function dinoParkGift(state) {
  if (!has(state, 'dinopark')) return { state, ores: [] };
  const ores = Array(PETS.parkAmber).fill('amber');
  return { state: { ...state, bank: { ...state.bank, amber: (state.bank.amber ?? 0) + ores.length } }, ores };
}

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
