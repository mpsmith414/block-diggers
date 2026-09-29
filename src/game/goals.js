// "What are we saving up for?" The cheapest building or upgrade still to get,
// and which ores are missing, so the mine can point you the right way.

import { UPGRADE_KINDS, nextUpgrade, blueprintsFor, plotsOf, blueprintOk } from './economy.js';
import { ORES } from '../world/blocks.js';
import { LAYERS, MOON_LAYERS } from '../tuning.js';
import { planetById } from './planets.js';

// value of an ore, for ranking what's "cheapest"
const WORTH = {
  coal: 1, iron: 2, gold: 4, diamond: 8, emerald: 8, amber: 10, brick: 12, star: 16, heart: 40,
  moonstone: 18, cheese: 18, spacegem: 22, gizmo: 26,
};
const worth = (cost) => Object.entries(cost).reduce((n, [o, k]) => n + WORTH[o] * k, 0);

// On another planet the goal is something you buy with that planet's ores.
export function nextGoal(state, planet = 'earth') {
  const options = [];
  const plots = plotsOf(state, planet);
  const built = new Set(plots.filter(Boolean));
  if (plots.some((p) => !p)) {
    for (const b of blueprintsFor(planet)) if (!built.has(b.id) && blueprintOk(state, b)) options.push({ kind: 'blueprint', id: b.id, cost: b.cost });
  }
  const local = planetById(planet)?.ores ?? ORES;
  for (const k of UPGRADE_KINDS) {
    const n = nextUpgrade(state, k);
    if (n && Object.keys(n.cost).every((o) => local.includes(o))) options.push({ kind: 'upgrade', id: k, cost: n.cost });
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

const MOON_ORE_ROW = { moonstone: MOON_LAYERS.craters.top, cheese: MOON_LAYERS.cheesecaves.top, spacegem: MOON_LAYERS.mooncrystal.top, gizmo: MOON_LAYERS.alienbase.top };

export function oreTopRow(ore, planet = 'earth') {
  if (planet === 'moon') return MOON_ORE_ROW[ore] ?? MOON_LAYERS.craters.top;
  if (ore === 'coal') return LAYERS.dirt.top;
  if (ore === 'iron' || ore === 'gold') return LAYERS.stone.top;
  if (ore === 'amber') return 189;
  if (ore === 'brick') return 239;
  if (ore === 'star') return 289;
  if (ore === 'heart') return LAYERS.core.bottom - 5;
  return LAYERS.deep.top;
}

// the missing ore that's deepest (the one worth heading down for)
export function deepestMissing(goal, planet = 'earth') {
  if (!goal) return null;
  const ores = [...ORES, 'heart'].filter((o) => goal.missing[o]);
  return ores.sort((a, b) => oreTopRow(b, planet) - oreTopRow(a, planet))[0] ?? null;
}
