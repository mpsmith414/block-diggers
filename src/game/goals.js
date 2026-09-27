// "What are we saving up for?" The cheapest building or upgrade still to get,
// and which ores are missing, so the mine can point you the right way.

import { BLUEPRINTS, UPGRADE_KINDS, nextUpgrade } from './economy.js';
import { ORES } from '../world/blocks.js';
import { LAYERS } from '../tuning.js';

// value of an ore, for ranking what's "cheapest"
const WORTH = { coal: 1, iron: 2, gold: 4, diamond: 8, emerald: 8, amber: 10, brick: 12, star: 16, heart: 40 };
const worth = (cost) => Object.entries(cost).reduce((n, [o, k]) => n + WORTH[o] * k, 0);

export function nextGoal(state) {
  const options = [];
  const built = new Set(state.plots.filter(Boolean));
  if (state.plots.some((p) => !p)) {
    for (const b of BLUEPRINTS) if (!built.has(b.id)) options.push({ kind: 'blueprint', id: b.id, cost: b.cost });
  }
  for (const k of UPGRADE_KINDS) {
    const n = nextUpgrade(state, k);
    if (n) options.push({ kind: 'upgrade', id: k, cost: n.cost });
  }
  if (!options.length) return null;
  options.sort((a, b) => worth(a.cost) - worth(b.cost));
  const withMissing = options.map((o) => {
    const missing = {};
    for (const [ore, n] of Object.entries(o.cost)) if ((state.bank[ore] ?? 0) < n) missing[ore] = n - (state.bank[ore] ?? 0);
    return { ...o, missing };
  });
  // something you can already afford is the goal (go home and get it);
  // otherwise the cheapest thing, and what it still needs
  return withMissing.find((o) => !Object.keys(o.missing).length) ?? withMissing[0];
}

export function oreTopRow(ore) {
  if (ore === 'coal') return LAYERS.dirt.top;
  if (ore === 'iron' || ore === 'gold') return LAYERS.stone.top;
  if (ore === 'amber') return 189;
  if (ore === 'brick') return 239;
  if (ore === 'star') return 289;
  if (ore === 'heart') return LAYERS.core.bottom - 5;
  return LAYERS.deep.top;
}

// the missing ore that's deepest (the one worth heading down for)
export function deepestMissing(goal) {
  if (!goal) return null;
  const ores = [...ORES, 'heart'].filter((o) => goal.missing[o]);
  return ores.sort((a, b) => oreTopRow(b) - oreTopRow(a))[0] ?? null;
}
