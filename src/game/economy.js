// Blueprints, upgrades and the shared ore bank. Immutable: state in, new state out.

import { ORES } from '../world/blocks.js';
import { SUN_CAMP, RAINBOW_CAMP, HUNT } from '../tuning.js';

export const PLOTS = 9;

export const UPGRADES = {
  pick: [
    { iron: 10, coal: 5 }, { diamond: 5, gold: 10 },
    { amber: 10, diamond: 5 }, { brick: 20, amber: 10 }, { star: 10, brick: 20 },
    // the Moon: Moon Drill, Crystal Drill, Laser Drill
    // (playtest 2026-09-28: the deeper world lasted one 45-minute session, so
    // the Moon asks for about 2.5x as much, to last two or three)
    { moonstone: 35, cheese: 25 }, { spacegem: 35, moonstone: 35 }, { gizmo: 40, spacegem: 35 },
    // Mars: Ruby Drill, Opal Drill, Mega Drill
    { ruby: 35, bolt: 25 }, { opal: 35, ruby: 35 }, { coin: 40, opal: 35 },
    // Saturn: Frost Drill, Pearl Drill, Comet Drill
    // (a little dearer: by now your backpack is big)
    { frost: 45, icecream: 30 }, { pearl: 45, frost: 45 }, { comet: 50, pearl: 45 },
    // Dino Planet: Jungle Drill, Tooth Drill, Obsidian Drill
    { jade: 45, bone: 35 }, { tooth: 45, jade: 45 }, { obsidian: 55, tooth: 45 },
    // the Sun: Sun Drill, Flare Drill, Nova Drill
    { sunstone: 45, flare: 35 }, { plasma: 40, sunstone: 40 }, { nova: 45, plasma: 40 },
  ],
  pack: [
    { coal: 15, iron: 5 }, { iron: 10, gold: 5 }, { amber: 10, diamond: 10 }, { brick: 20, star: 5 }, { moonstone: 40, cheese: 40 },
    { ruby: 40, bolt: 40 }, { frost: 50, icecream: 50 }, { jade: 55, bone: 55 }, { sunstone: 45, flare: 45 },
  ],
  lantern: [
    { coal: 10, iron: 5 }, { gold: 5, diamond: 2 }, { amber: 10, emerald: 5 }, { brick: 10, star: 5 }, { spacegem: 30, moonstone: 25 },
    { opal: 30, ruby: 25 }, { pearl: 40, frost: 30 }, { tooth: 40, jade: 35 }, { plasma: 30, sunstone: 25 },
  ],
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

// Moon Base (and every camp after it): four plots of its own. The Mars Rocket needs the Helmet.
export const MOON_PLOTS = 4;
export const MOON_BLUEPRINTS = [
  { id: 'cheesefactory', cost: { cheese: 45, moonstone: 20 } },
  { id: 'telescope', cost: { moonstone: 45, spacegem: 15 } },
  { id: 'hangar', cost: { gizmo: 30, spacegem: 30 } },
  { id: 'marsrocket', cost: { gizmo: 45, spacegem: 40, moonstone: 45 }, needs: { suit: 'helmet' } },
];

// Mars Base: four plots too. The Saturn Rocket needs the Boots.
export const MARS_BLUEPRINTS = [
  { id: 'robotfactory', cost: { bolt: 45, ruby: 20 } },
  { id: 'weather', cost: { ruby: 45, opal: 15 } },
  { id: 'garage', cost: { coin: 30, opal: 30 } },
  { id: 'saturnrocket', cost: { coin: 45, opal: 40, ruby: 45 }, needs: { suit: 'boots' } },
];

// Ring Station: four plots. The Dino Rocket needs the Gloves.
export const SATURN_BLUEPRINTS = [
  { id: 'parlour', cost: { icecream: 55, frost: 25 } },
  { id: 'lighthouse', cost: { frost: 55, pearl: 20 } },
  { id: 'skilift', cost: { comet: 40, pearl: 40 } },
  { id: 'dinorocket', cost: { comet: 60, pearl: 50, frost: 60 }, needs: { suit: 'gloves' } },
];

// Dino Camp: four plots. The Sun Rocket needs the Jetpack.
export const DINO_BLUEPRINTS = [
  { id: 'nursery', cost: { bone: 55, jade: 25 } },
  { id: 'treehouse', cost: { jade: 55, tooth: 20 } },
  { id: 'pteroperch', cost: { obsidian: 40, tooth: 40 } },
  { id: 'sunrocket', cost: { obsidian: 60, tooth: 55, jade: 60 }, needs: { suit: 'jetpack' } },
];

// Solar Station: four plots. The Hall of Heroes needs the Sun's Heart.
export const SUN_BLUEPRINTS = [
  { id: 'sunflowers', cost: { flare: 40, sunstone: 20 } },
  { id: 'sundial', cost: { sunstone: 40, plasma: 15 } },
  { id: 'sunbeam', cost: { nova: 30, plasma: 30 } },
  { id: 'hall', cost: { nova: 45, plasma: 40, sunstone: 45 }, needs: { sunHeart: true } },
  // the fifth plot: the Rainbow Rocket, to the endless Rainbow Planet
  { id: 'rainbowrocket', cost: { nova: 60, plasma: 60, sunstone: 60 }, needs: { sunHeart: true } },
];

// Rainbow Village: four shops, bought with sparkles. Each one opens its shop.
// And the Treasure Hall, where Polly sells treasure maps and the treasures go.
export const RAINBOW_BLUEPRINTS = [
  { id: 'hatshop', cost: { sparkle: 300 } },
  { id: 'shoeshop', cost: { sparkle: 600 } },
  { id: 'gadgetlab', cost: { sparkle: 1000 } },
  { id: 'decoshop', cost: { sparkle: 1500 } },
  { id: 'treasurehall', cost: { sparkle: HUNT.hall } },
];
export const SHOPS = ['hatshop', 'shoeshop', 'gadgetlab', 'decoshop'];

const BLUEPRINTS_OF = { earth: BLUEPRINTS, moon: MOON_BLUEPRINTS, mars: MARS_BLUEPRINTS, saturn: SATURN_BLUEPRINTS, dino: DINO_BLUEPRINTS, sun: SUN_BLUEPRINTS, rainbow: RAINBOW_BLUEPRINTS };
export const blueprintsFor = (planet = 'earth') => BLUEPRINTS_OF[planet] ?? BLUEPRINTS;
const blueprint = (id, planet) => blueprintsFor(planet).find((b) => b.id === id);

// The plots of a planet's camp (Earth's are `state.plots`).
// how many plots each camp has (the Solar Station grew a fifth, for the Rainbow Rocket)
export const PLOTS_AT = { moon: MOON_PLOTS, mars: MOON_PLOTS, saturn: MOON_PLOTS, dino: MOON_PLOTS, sun: SUN_CAMP.plots.length, rainbow: RAINBOW_CAMP.plots.length };

export function plotsOf(state, planet = 'earth') {
  if (planet === 'earth') return state.plots;
  const have = state.bases?.[planet]?.plots ?? [];
  return Array.from({ length: PLOTS_AT[planet] ?? MOON_PLOTS }, (_, i) => have[i] ?? null);
}
function withPlots(state, planet, plots) {
  if (planet === 'earth') return { ...state, plots };
  return { ...state, bases: { ...(state.bases ?? {}), [planet]: { ...(state.bases?.[planet] ?? {}), plots } } };
}

// Anything else a blueprint needs besides ore (a Sun Suit piece).
// Anything else a blueprint needs besides ore: a Sun Suit piece, or the Sun's Heart.
export const blueprintOk = (state, bp) => (!bp.needs?.suit || (state.suit ?? []).includes(bp.needs.suit))
  && (!bp.needs?.sunHeart || !!state.sunHeart);

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
  // Rainbow Planet's sparkles (never in the ore list: they don't take backpack space)
  for (const pack of packs) bank.sparkle = (bank.sparkle ?? 0) + (pack.sparkle ?? 0);
  bank.heart = (bank.heart ?? 0) + hearts;
  return { ...state, bank };
}
