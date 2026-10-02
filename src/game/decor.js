// Camp decorations: buy them at the stall (or Rainbow Village's Decoration
// Workshop), carry them, place them anywhere that isn't in the way. Earth's
// live in state.decor, Rainbow Village's in state.bases.rainbow.decor.
// Immutable: state in, new state out.

import { canAfford, spend } from './economy.js';
import { TILE, CAMP, RAINBOW_CAMP } from '../tuning.js';

export const TROPHY_COUNT = 26;

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
  // toy bricks, once the Toy Workshop is built
  { id: 'brickcastle', cost: { brick: 8 }, w: 28, needs: 'workshop' },
  { id: 'brickcar', cost: { brick: 5 }, w: 20, needs: 'workshop' },
  { id: 'rainbowarch', cost: { brick: 6 }, w: 26, needs: 'workshop' },
  { id: 'brickrobot', cost: { brick: 5 }, w: 12, needs: 'workshop' },
  // a trophy for every sticker page (keep in step with STICKER_PAGES and the
  // trophy art's TROPHY_GEMS)
  ...Array.from({ length: TROPHY_COUNT }, (_, i) => ({ id: `trophy-${i}`, cost: null, w: 12 })),
];

// Rainbow Village's own, from the Decoration Workshop (bought with sparkles)
const r = (id, sparkle, w) => ({ id, cost: { sparkle }, w, camp: 'rainbow' });
export const RAINBOW_DECOR = [
  r('candytree', 150, 22), r('lollipop', 80, 12), r('gumdrop', 50, 14), r('canefence', 60, 18),
  r('fountain', 400, 30), r('cloudlamp', 120, 12), r('icecream', 100, 12), r('dinostatue', 350, 24),
  r('balloons', 80, 14), r('gempile', 200, 20), r('jellypond', 250, 32), r('cupcake', 300, 26),
];

const BY_ID = new Map([...DECOR_ITEMS, ...RAINBOW_DECOR].map((d) => [d.id, d]));
export const decorById = (id) => BY_ID.get(id) ?? null;
// (the Earth stall's list)
export const BUYABLE = DECOR_ITEMS.filter((d) => d.cost);
export const campOf = (id) => decorById(id)?.camp ?? 'earth';

// each camp's decorations
export const decorOf = (state, planet = 'earth') => (planet === 'earth' ? state.decor : state.bases?.[planet]?.decor ?? { stock: {}, placed: [] });
function withDecor(state, planet, decor) {
  if (planet === 'earth') return { ...state, decor };
  const base = state.bases?.[planet] ?? {};
  return { ...state, bases: { ...(state.bases ?? {}), [planet]: { ...base, decor } } };
}
const LAYOUT = { earth: CAMP, rainbow: RAINBOW_CAMP };

const GAP = 14; // px between decoration centres

const addStock = (state, id, n, planet = 'earth') => {
  const decor = decorOf(state, planet);
  return withDecor(state, planet, { ...decor, stock: { ...decor.stock, [id]: (decor.stock[id] ?? 0) + n } });
};

export const decorUnlocked = (state, id) => {
  const item = decorById(id);
  return !!item && (!item.needs || state.plots.includes(item.needs));
};

// (each camp sells only its own)
export function buyDecor(state, id, planet = 'earth') {
  const item = decorById(id);
  if (!item || !item.cost || campOf(id) !== planet || !decorUnlocked(state, id) || !canAfford(state.bank, item.cost)) return null;
  return addStock({ ...state, bank: spend(state.bank, item.cost) }, id, 1, planet);
}

export function takeFromStock(state, id, planet = 'earth') {
  if ((decorOf(state, planet).stock[id] ?? 0) <= 0) return null;
  return addStock(state, id, -1, planet);
}

// Pixel ranges (centre x) that must stay clear.
export function blockedRanges(state, planet = 'earth') {
  const cell = (c, pad = 0) => [c * TILE - pad, (c + 1) * TILE + pad];
  const L = LAYOUT[planet] ?? CAMP;
  const plots = planet === 'earth' ? state.plots : state.bases?.[planet]?.plots ?? [];
  const ranges = planet === 'earth' ? [
    cell(L.shaftX, 16), cell(L.benchX, 12), cell(L.lecternX, 4), cell(L.fireX, 6),
    [(L.fireX + 1) * TILE, (L.fireX + 3) * TILE + 4], // the nest
    [L.stallX * TILE - 20, (L.stallX + 1) * TILE + 20],
  ] : [
    // the Depth Sign, the lift, the bench, the lectern, the nest and the landing pad
    [0, (L.shaftX - 1) * TILE], cell(L.shaftX, 16), cell(L.benchX, 12), cell(L.lecternX, 4), cell(L.nestX, 8),
    [(L.padX - 2) * TILE, (L.padX + 3) * TILE],
  ];
  L.plots.forEach((px, i) => {
    if (!plots[i]) ranges.push([px * TILE, (px + L.plotW) * TILE]);
  });
  return ranges;
}

export function canPlace(state, id, x, planet = 'earth') {
  const item = decorById(id);
  if (!item || campOf(id) !== planet) return false;
  const L = LAYOUT[planet] ?? CAMP;
  const half = item.w / 2;
  if (x - half < 4 || x + half > L.w * TILE - 4) return false;
  if (blockedRanges(state, planet).some(([a, b]) => x + half > a && x - half < b)) return false;
  return decorOf(state, planet).placed.every((p) => Math.abs(p.x - x) >= GAP);
}

export function placeDecor(state, id, x, planet = 'earth') {
  if (!canPlace(state, id, x, planet)) return null;
  const decor = decorOf(state, planet);
  return withDecor(state, planet, { ...decor, placed: [...decor.placed, { id, x }] });
}

export function pickUpDecor(state, index, planet = 'earth') {
  const decor = decorOf(state, planet);
  const item = decor.placed[index];
  if (!item) return state;
  const placed = decor.placed.filter((_, i) => i !== index);
  return addStock(withDecor(state, planet, { ...decor, placed }), item.id, 1, planet);
}
