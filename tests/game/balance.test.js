import { describe, it, expect } from 'vitest';
import { generateMoon, moonLayerAt } from '../../src/world/moon.js';
import { dropOf, isSolid } from '../../src/world/blocks.js';
import { MOON_LAYERS } from '../../src/tuning.js';
import { UPGRADE_KINDS, nextUpgrade, buyUpgrade, buildOnPlot, canAfford, MOON_BLUEPRINTS, plotsOf, blueprintOk } from '../../src/game/economy.js';
import { cheeseFactoryGift, winSuitPiece, hasSuit } from '../../src/game/perks.js';
import { packCap } from '../../src/game/perks.js';
import { defaultState } from '../../src/save/save.js';

// A simple progression bot for the Moon: each trip it digs about 160 blocks
// in the layer that has what it's saving for (aiming for the glinting ore, so
// it finds about 2.5x what random digging would), picks up a chest and that
// layer's special find, then spends greedily at Moon Base. The Moon should
// take many trips (the deeper world lasted a single 45-minute session).

const DUG_PER_TRIP = 160;
const AIM = 2.5;
const TIER = { craters: 5, cheesecaves: 5, mooncrystal: 6, alienbase: 7, mooncore: 8 };
const SPECIAL = {
  craters: { moonstone: 12 }, // two meteorites
  cheesecaves: { cheese: 9 }, // a cheese party
  mooncrystal: {},
  alienbase: { gizmo: 7, spacegem: 2 }, // the crashed UFO
  mooncore: {},
};
const CHEST = { craters: 'moonstone', cheesecaves: 'cheese', mooncrystal: 'spacegem', alienbase: 'gizmo', mooncore: 'spacegem' };

function densities() {
  const out = {};
  const seeds = [1, 2, 3];
  for (const seed of seeds) {
    const { grid } = generateMoon(seed);
    for (let y = 1; y < grid.h - 1; y++) {
      const layer = moonLayerAt(y);
      const d = (out[layer] ??= { solid: 0, ores: {} });
      for (let x = 1; x < grid.w - 1; x++) {
        const id = grid.get(x, y);
        if (!isSolid(id)) continue;
        d.solid++;
        const ore = dropOf(id);
        if (ore) d.ores[ore] = (d.ores[ore] ?? 0) + 1;
      }
    }
  }
  for (const d of Object.values(out)) for (const o of Object.keys(d.ores)) d.ores[o] /= d.solid;
  return out;
}

function playMoon() {
  const dens = densities();
  let s = { ...defaultState(), upgrades: { pick: 5, pack: 4, lantern: 4 }, plots: ['house', null, null, null, null, null, null, null, null] };
  const needs = () => {
    // the cheapest thing still to get, and the ores it is short of
    const plots = plotsOf(s, 'moon');
    const options = [];
    for (const k of UPGRADE_KINDS) { const n = nextUpgrade(s, k); if (n) options.push(n.cost); }
    for (const b of MOON_BLUEPRINTS) if (!plots.includes(b.id) && blueprintOk(s, b)) options.push(b.cost);
    return options;
  };
  let trips = 0;
  const log = [];
  for (; trips < 60; trips++) {
    // spend: upgrades first, then buildings, as long as anything is affordable
    let bought = true;
    while (bought) {
      bought = false;
      for (const k of UPGRADE_KINDS) {
        const n = nextUpgrade(s, k);
        if (n && Object.keys(n.cost).every((o) => ['moonstone', 'cheese', 'spacegem', 'gizmo'].includes(o)) && canAfford(s.bank, n.cost)) { s = buyUpgrade(s, k); bought = true; log.push(`${trips}:${k}${s.upgrades[k]}`); }
      }
      const plots = plotsOf(s, 'moon');
      for (const b of MOON_BLUEPRINTS) {
        if (plots.includes(b.id) || !blueprintOk(s, b) || !canAfford(s.bank, b.cost)) continue;
        const free = plotsOf(s, 'moon').indexOf(null);
        s = buildOnPlot(s, free, b.id, 'moon');
        bought = true;
        log.push(`${trips}:${b.id}`);
      }
    }
    if (plotsOf(s, 'moon').includes('marsrocket')) break;
    // where to dig: the Heart once the Laser Drill is in hand, else the layer for the scarcest ore we need
    let layer;
    if (s.upgrades.pick >= 8 && !hasSuit(s, 'helmet')) layer = 'mooncore';
    else {
      const short = {};
      for (const cost of needs()) for (const [o, n] of Object.entries(cost)) short[o] = (short[o] ?? 0) + Math.max(0, n - (s.bank[o] ?? 0));
      const reachable = Object.keys(MOON_LAYERS).filter((l) => s.upgrades.pick >= TIER[l]);
      layer = reachable.sort((a, b) => {
        const score = (l) => Object.entries(dens[l].ores).reduce((n, [o, d]) => n + d * (short[o] ?? 0), 0);
        return score(b) - score(a);
      })[0];
    }
    const cap = packCap(s);
    const gain = {};
    for (const [o, d] of Object.entries(dens[layer].ores)) gain[o] = Math.round(d * DUG_PER_TRIP * AIM);
    for (const [o, n] of Object.entries(SPECIAL[layer])) gain[o] = (gain[o] ?? 0) + n;
    gain[CHEST[layer]] = (gain[CHEST[layer]] ?? 0) + 4;
    let total = Object.values(gain).reduce((a, b) => a + b, 0);
    for (const o of Object.keys(gain)) if (total > cap) gain[o] = Math.floor((gain[o] * cap) / total);
    total = Object.values(gain).reduce((a, b) => a + b, 0);
    s = { ...s, bank: { ...s.bank } };
    for (const [o, n] of Object.entries(gain)) s.bank[o] = (s.bank[o] ?? 0) + n;
    if (layer === 'mooncore' && s.upgrades.pick >= 8 && !hasSuit(s, 'helmet')) { s = winSuitPiece(s, 'helmet'); log.push(`${trips}:helmet`); }
    s = cheeseFactoryGift(s).state;
  }
  return { trips, log, s };
}

describe('Moon balance', () => {
  it('takes a good many trips (not one session) to build the Mars Rocket', () => {
    const { trips, log } = playMoon();
    // ~5 minutes a trip plus camp time: 12+ trips is two or three sessions
    expect(trips).toBeGreaterThanOrEqual(12);
    expect(trips).toBeLessThanOrEqual(24);
    // the drills come in order, each opening a new layer
    const order = log.filter((l) => /pick|helmet|marsrocket/.test(l)).map((l) => l.split(':')[1]);
    expect(order).toEqual(['pick6', 'pick7', 'pick8', 'helmet', 'marsrocket']);
  });
});

export { playMoon };
