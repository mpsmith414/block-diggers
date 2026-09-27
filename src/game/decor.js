// Camp decorations: buy them at the stall, carry them, place them anywhere
// that isn't in the way. Immutable: state in, new state out.

import { canAfford, spend } from './economy.js';
import { TILE, CAMP } from '../tuning.js';

export const DECOR_ITEMS = [
  { id: 'lamp', cost: { coal: 3, iron: 1 }, w: 10 },
  { id: 'fence', cost: { coal: 3 }, w: 16 },
  { id: 'flowerbed', cost: { coal: 4 }, w: 24 },
  { id: 'bench', cost: { iron: 3 }, w: 22 },
  { id: 'pumpkin', cost: { gold: 2 }, w: 16 },
  { id: 'mailbox', cost: { iron: 2 }, w: 10 },
  { id: 'pond', cost: { iron: 5 }, w: 32 },
  { id: 'windmill', cost: { iron: 6, gold: 3 }, w: 24 },
  { id: 'crystallamp', cost: { diamond: 2 }, w: 10 },
  ...[0, 1, 2, 3, 4, 5].map((i) => ({ id: `trophy-${i}`, cost: null, w: 12 })),
];
const BY_ID = new Map(DECOR_ITEMS.map((d) => [d.id, d]));
export const decorById = (id) => BY_ID.get(id) ?? null;
export const BUYABLE = DECOR_ITEMS.filter((d) => d.cost);

const GAP = 14; // px between decoration centres

const addStock = (state, id, n) => ({
  ...state,
  decor: { ...state.decor, stock: { ...state.decor.stock, [id]: (state.decor.stock[id] ?? 0) + n } },
});

export function buyDecor(state, id) {
  const item = decorById(id);
  if (!item || !item.cost || !canAfford(state.bank, item.cost)) return null;
  return addStock({ ...state, bank: spend(state.bank, item.cost) }, id, 1);
}

export function takeFromStock(state, id) {
  if ((state.decor.stock[id] ?? 0) <= 0) return null;
  return addStock(state, id, -1);
}

// Pixel ranges (centre x) that must stay clear.
export function blockedRanges(state) {
  const cell = (c, pad = 0) => [c * TILE - pad, (c + 1) * TILE + pad];
  const ranges = [
    cell(CAMP.shaftX, 16), cell(CAMP.benchX, 12), cell(CAMP.lecternX, 4), cell(CAMP.fireX, 6),
    [(CAMP.fireX + 1) * TILE, (CAMP.fireX + 3) * TILE + 4], // the nest
    [CAMP.stallX * TILE - 20, (CAMP.stallX + 1) * TILE + 20],
  ];
  CAMP.plots.forEach((px, i) => {
    if (!state.plots[i]) ranges.push([px * TILE, (px + CAMP.plotW) * TILE]);
  });
  return ranges;
}

export function canPlace(state, id, x) {
  const item = decorById(id);
  if (!item) return false;
  const half = item.w / 2;
  if (x - half < 4 || x + half > CAMP.w * TILE - 4) return false;
  if (blockedRanges(state).some(([a, b]) => x + half > a && x - half < b)) return false;
  return state.decor.placed.every((p) => Math.abs(p.x - x) >= GAP);
}

export function placeDecor(state, id, x) {
  if (!canPlace(state, id, x)) return null;
  return { ...state, decor: { ...state.decor, placed: [...state.decor.placed, { id, x }] } };
}

export function pickUpDecor(state, index) {
  const item = state.decor.placed[index];
  if (!item) return state;
  const placed = state.decor.placed.filter((_, i) => i !== index);
  return addStock({ ...state, decor: { ...state.decor, placed } }, item.id, 1);
}
