// Blueprints, upgrades and the shared ore bank. Immutable: state in, new state out.

import { ORES } from '../world/blocks.js';

export const PLOTS = 6;

export const UPGRADES = {
  pick: [
    { iron: 10, coal: 5 }, { diamond: 5, gold: 10 },
    { amber: 10, diamond: 5 }, { brick: 20, amber: 10 }, { star: 10, brick: 20 },
  ],
  pack: [{ coal: 15, iron: 5 }, { iron: 10, gold: 5 }, { amber: 10, diamond: 10 }, { brick: 20, star: 5 }],
  lantern: [{ coal: 10, iron: 5 }, { gold: 5, diamond: 2 }, { amber: 10, emerald: 5 }, { brick: 10, star: 5 }],
};
export const UPGRADE_KINDS = ['pick', 'pack', 'lantern'];

export const BLUEPRINTS = [
  { id: 'garden', cost: { coal: 15 } },
  { id: 'house', cost: { coal: 10, iron: 5 } },
  { id: 'pen', cost: { iron: 10, gold: 5 } },
  { id: 'tower', cost: { iron: 20, gold: 5 } },
  { id: 'minecart', cost: { iron: 10, gold: 10 } },
  { id: 'statue', cost: { diamond: 5, emerald: 5 } },
];
const blueprint = (id) => BLUEPRINTS.find((b) => b.id === id);

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

export function buildOnPlot(state, plot, id) {
  const bp = blueprint(id);
  if (!bp || state.plots[plot] || !canAfford(state.bank, bp.cost)) return null;
  const plots = [...state.plots];
  plots[plot] = id;
  return { ...state, bank: spend(state.bank, bp.cost), plots };
}

export function depositPacks(state, packs, { hearts = 0 } = {}) {
  const bank = { ...state.bank };
  for (const pack of packs) for (const ore of ORES) bank[ore] = (bank[ore] ?? 0) + (pack[ore] ?? 0);
  bank.heart = (bank.heart ?? 0) + hearts;
  return { ...state, bank };
}
