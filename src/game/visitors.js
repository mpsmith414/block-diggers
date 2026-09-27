// Friends who move in as the camp grows, each with a little request.

import { ORES } from '../world/blocks.js';
import { canAfford, spend } from './economy.js';
import { BUYABLE } from './decor.js';
import { PET_KINDS } from './pets.js';

export const VISITORS = [
  { id: 'bear', after: 2, home: 'house' },
  { id: 'rabbit', after: 4, home: 'stall' },
  { id: 'owl', after: 6, home: 'tower' },
];

export const presentVisitors = (state) => {
  const built = state.plots.filter(Boolean).length;
  return VISITORS.filter((v) => built >= v.after).map((v) => v.id);
};

const GEMS = new Set(['diamond', 'emerald']);

export function makeRequest(state, rng) {
  const found = ORES.filter((o) => state.stickers[`ore-${o}`]);
  const ore = found.length ? rng.pick(found) : 'coal';
  const n = GEMS.has(ore) ? rng.int(3, 6) : rng.int(5, 15);
  return { ore, n };
}

export function refreshRequests(state, rng) {
  const requests = {};
  for (const id of presentVisitors(state)) requests[id] = makeRequest(state, rng);
  return { ...state, visitors: { ...state.visitors, requests } };
}

export function fulfill(state, id, rng) {
  const req = state.visitors.requests[id];
  if (!req) return null;
  const cost = { [req.ore]: req.n };
  if (!canAfford(state.bank, cost)) return null;
  const requests = { ...state.visitors.requests };
  delete requests[id];
  const met = state.visitors.met.includes(id) ? state.visitors.met : [...state.visitors.met, id];
  let next = { ...state, bank: spend(state.bank, cost), visitors: { ...state.visitors, met, requests } };
  let reward;
  if (id === 'bear') {
    reward = { kind: 'ore', ore: 'diamond', n: 3 };
    next = { ...next, bank: { ...next.bank, diamond: next.bank.diamond + 3 } };
  } else if (id === 'rabbit') {
    const item = rng.pick(BUYABLE).id;
    reward = { kind: 'decor', id: item };
    next = { ...next, decor: { ...next.decor, stock: { ...next.decor.stock, [item]: (next.decor.stock[item] ?? 0) + 1 } } };
  } else {
    const missing = PET_KINDS.filter((k) => !(next.pets ?? []).includes(k));
    reward = { kind: 'egg', egg: missing.length ? rng.pick(missing) : 'golden' };
  }
  return { state: next, reward };
}
