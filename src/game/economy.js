// Blueprints, upgrades and the shared ore bank. Immutable: state in, new state out.

import { ORES } from '../world/blocks.js';

export const PLOTS = 9;

export const UPGRADES = {
  pick: [
    { iron: 10, coal: 5 }, { diamond: 5, gold: 10 },
    { amber: 10, diamond: 5 }, { brick: 20, amber: 10 }, { star: 10, brick: 20 },
    // the Moon: Moon Drill, Crystal Drill, Laser Drill
    { moonstone: 15, cheese: 10 }, { spacegem: 15, moonstone: 15 }, { gizmo: 15, spacegem: 15 },
  ],
  pack: [{ coal: 15, iron: 5 }, { iron: 10, gold: 5 }, { amber: 10, diamond: 10 }, { brick: 20, star: 5 }, { moonstone: 12, cheese: 12 }],
  lantern: [{ coal: 10, iron: 5 }, { gold: 5, diamond: 2 }, { amber: 10, emerald: 5 }, { brick: 10, star: 5 }, { spacegem: 10, moonstone: 8 }],
};
export const UPGRADE_KINDS = ['pick', 'pack', 'lantern'];

export const BLUEPRINTS = [
  { id: 'garden', cost: { coal: 15 } },
  { id: 'house', cost: { coal: 10, iron: 5 } },
  { id: 'pen', cost: { iron: 10, gold: 5 } },
  { id: 'tower', cost: { iron: 20, gold: 5 } },
  { id: 'minecart', cost: { iron: 10, gold: 10 } },
  { id: 'statue', cost: { diamond: 5, emerald: 5 } },
  { id: 'dinopark', cost: { amber: 20, gold: 10 } },
  { id: 'workshop', cost: { brick: 30, gold: 10 } },
  { id: 'rocket', cost: { brick: 40, star: 20, heart: 1 } },
];

// Moon Base: four plots of its own. The Mars Rocket needs the Helmet.
export const MOON_PLOTS = 4;
export const MOON_BLUEPRINTS = [
  { id: 'cheesefactory', cost: { cheese: 20, moonstone: 10 } },
  { id: 'telescope', cost: { moonstone: 20, spacegem: 5 } },
  { id: 'hangar', cost: { gizmo: 12, spacegem: 10 } },
  { id: 'marsrocket', cost: { gizmo: 25, spacegem: 20, moonstone: 20 }, needs: { suit: 'helmet' } },
];

export const blueprintsFor = (planet = 'earth') => (planet === 'moon' ? MOON_BLUEPRINTS : BLUEPRINTS);
const blueprint = (id, planet) => blueprintsFor(planet).find((b) => b.id === id);

// The plots of a planet's camp (Earth's are `state.plots`).
export function plotsOf(state, planet = 'earth') {
  if (planet === 'earth') return state.plots;
  return state.bases?.[planet]?.plots ?? Array(MOON_PLOTS).fill(null);
}
function withPlots(state, planet, plots) {
  if (planet === 'earth') return { ...state, plots };
  return { ...state, bases: { ...(state.bases ?? {}), [planet]: { ...(state.bases?.[planet] ?? {}), plots } } };
}

// Anything else a blueprint needs besides ore (a Sun Suit piece).
export const blueprintOk = (state, bp) => !bp.needs?.suit || (state.suit ?? []).includes(bp.needs.suit);

export const canAfford = (bank, cost) => Object.entries(cost).every(([ore, n]) => (bank[ore] ?? 0) >= n);

export function spend(bank, cost) {
  if (!canAfford(bank, cost)) throw new Error('not enough ore');
  const out = { ...bank };
  for (const [ore, n] of Object.entries(cost)) out[ore] -= n;
  return out;
}

export function nextUpgrade(state, kind) {
  const level = state.upgrades[kind];
  const cost = UPGRADES[kind][level];
  return cost ? { level: level + 1, cost } : null;
}

export function buyUpgrade(state, kind) {
  const next = nextUpgrade(state, kind);
  if (!next || !canAfford(state.bank, next.cost)) return null;
  return { ...state, bank: spend(state.bank, next.cost), upgrades: { ...state.upgrades, [kind]: next.level } };
}

export function buildOnPlot(state, plot, id, planet = 'earth') {
  const bp = blueprint(id, planet);
  const current = plotsOf(state, planet);
  if (!bp || current[plot] || !canAfford(state.bank, bp.cost) || !blueprintOk(state, bp)) return null;
  const plots = [...current];
  plots[plot] = id;
  return withPlots({ ...state, bank: spend(state.bank, bp.cost) }, planet, plots);
}

export function depositPacks(state, packs, { hearts = 0 } = {}) {
  const bank = { ...state.bank };
  for (const pack of packs) for (const ore of ORES) bank[ore] = (bank[ore] ?? 0) + (pack[ore] ?? 0);
  bank.heart = (bank.heart ?? 0) + hearts;
  return { ...state, bank };
}
