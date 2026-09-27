// What each building does for you. Immutable: state in, new state out.

import { BACKPACK, PERKS, LAYERS, PETS } from '../tuning.js';

const has = (state, id) => state.plots.includes(id);

export const packCap = (state) => BACKPACK[state.upgrades.pack] + (has(state, 'house') ? PERKS.houseBonus : 0);
export const luck = (state) => (has(state, 'statue') ? 2 : 1);
export const revealsChests = (state) => has(state, 'tower');
export const cartStartRow = (state) => (has(state, 'minecart') ? PERKS.cartRow : null);

// ---- minecart: an elevator to the top of any layer you've reached ----

export function elevatorStops(state) {
  if (!has(state, 'minecart')) return [];
  const reached = state.records?.layers ?? [];
  return Object.entries(LAYERS).map(([layer, l]) => ({
    layer,
    row: layer === 'dirt' ? null : l.top + 1,
    open: layer === 'dirt' || reached.includes(layer),
  }));
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
