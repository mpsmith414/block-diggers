import { describe, it, expect } from 'vitest';
import { generateMoon } from '../../src/world/moon.js';
import { generateMars } from '../../src/world/mars.js';
import { generateSaturn } from '../../src/world/saturn.js';
import { generateDino } from '../../src/world/dinoworld.js';
import { dropOf, isSolid } from '../../src/world/blocks.js';
import { MOON_LAYERS, MARS_LAYERS, SATURN_LAYERS, DINO_LAYERS } from '../../src/tuning.js';
import { UPGRADE_KINDS, nextUpgrade, buyUpgrade, buildOnPlot, canAfford, blueprintsFor, plotsOf, blueprintOk } from '../../src/game/economy.js';
import { campGift, winSuitPiece, hasSuit, packCap } from '../../src/game/perks.js';
import { planetById, layerOfRow } from '../../src/game/planets.js';
import { defaultState } from '../../src/save/save.js';

// A simple progression bot: each trip it digs about 160 blocks in the layer
// that has what it's saving for (aiming for the glinting ore, so it finds
// about 2.5x what random digging would), picks up a chest and that layer's
// special find, then spends greedily at the planet's camp. Each planet should
// take many trips (the deeper world lasted a single 45-minute session).

const DUG_PER_TRIP = 160;
const AIM = 2.5;

const PLANET = {
  moon: {
    generate: generateMoon,
    layers: MOON_LAYERS,
    tier: { craters: 5, cheesecaves: 5, mooncrystal: 6, alienbase: 7, mooncore: 8 },
    special: {
      craters: { moonstone: 12 }, // two meteorites
      cheesecaves: { cheese: 9 }, // a cheese party
      mooncrystal: {},
      alienbase: { gizmo: 7, spacegem: 2 }, // the crashed UFO
      mooncore: {},
    },
    chest: { craters: 'moonstone', cheesecaves: 'cheese', mooncrystal: 'spacegem', alienbase: 'gizmo', mooncore: 'spacegem' },
    start: { upgrades: { pick: 5, pack: 4, lantern: 4 }, suit: [] },
    heartLayer: 'mooncore',
    rocket: 'marsrocket',
  },
  mars: {
    generate: generateMars,
    layers: MARS_LAYERS,
    tier: { dunes: 8, rovers: 8, volcano: 9, ruins: 10, marscore: 11 },
    special: {
      dunes: {},
      rovers: { bolt: 14, ruby: 4 }, // two old rovers
      volcano: {},
      ruins: { coin: 18 + 9 }, // two vaults: their coin piles and chests
      marscore: {},
    },
    chest: { dunes: 'ruby', rovers: 'bolt', volcano: 'opal', ruins: 'coin', marscore: 'opal' },
    start: { upgrades: { pick: 8, pack: 5, lantern: 5 }, suit: ['helmet'] },
    heartLayer: 'marscore',
    rocket: 'saturnrocket',
  },
  saturn: {
    generate: generateSaturn,
    layers: SATURN_LAYERS,
    tier: { rings: 11, icecream: 11, aurora: 12, comets: 13, saturncore: 14 },
    special: {
      rings: { frost: 9 }, // a snowman
      icecream: {},
      aurora: { pearl: 7 * 2, frost: 2 * 2 }, // two snow globes
      comets: { comet: 7, pearl: 2 }, // the frozen comet
      saturncore: {},
    },
    chest: { rings: 'frost', icecream: 'icecream', aurora: 'pearl', comets: 'comet', saturncore: 'pearl' },
    start: { upgrades: { pick: 11, pack: 6, lantern: 6 }, suit: ['helmet', 'boots'] },
    heartLayer: 'saturncore',
    rocket: 'dinorocket',
  },
  dino: {
    generate: generateDino,
    layers: DINO_LAYERS,
    tier: { jungle: 14, bonebeds: 14, swamp: 15, lavalands: 16, dinocore: 17 },
    special: {
      jungle: {},
      bonebeds: { bone: 6 * 2, jade: 2 * 2 }, // two nests
      swamp: { tooth: 8 }, // the T-rex skull
      lavalands: { obsidian: 8 }, // the sleeping stego
      dinocore: {},
    },
    chest: { jungle: 'jade', bonebeds: 'bone', swamp: 'tooth', lavalands: 'obsidian', dinocore: 'tooth' },
    start: { upgrades: { pick: 14, pack: 7, lantern: 7 }, suit: ['helmet', 'boots', 'gloves'] },
    heartLayer: 'dinocore',
    rocket: 'sunrocket',
  },
};

function densities(planet) {
  const out = {};
  for (const seed of [1, 2, 3]) {
    const { grid } = PLANET[planet].generate(seed);
    for (let y = 1; y < grid.h - 1; y++) {
      const layer = layerOfRow(y, planet);
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

function play(planet) {
  const P = PLANET[planet];
  const { ores, suit: piece } = planetById(planet);
  const dens = densities(planet);
  const blueprints = blueprintsFor(planet);
  let s = { ...defaultState(), ...P.start, plots: ['house', null, null, null, null, null, null, null, null] };
  const needs = () => {
    // the cheapest things still to get, and the ores they're short of
    const plots = plotsOf(s, planet);
    const options = [];
    for (const k of UPGRADE_KINDS) { const n = nextUpgrade(s, k); if (n) options.push(n.cost); }
    for (const b of blueprints) if (!plots.includes(b.id) && blueprintOk(s, b)) options.push(b.cost);
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
        if (n && Object.keys(n.cost).every((o) => ores.includes(o)) && canAfford(s.bank, n.cost)) { s = buyUpgrade(s, k); bought = true; log.push(`${trips}:${k}${s.upgrades[k]}`); }
      }
      for (const b of blueprints) {
        if (plotsOf(s, planet).includes(b.id) || !blueprintOk(s, b) || !canAfford(s.bank, b.cost)) continue;
        s = buildOnPlot(s, plotsOf(s, planet).indexOf(null), b.id, planet);
        bought = true;
        log.push(`${trips}:${b.id}`);
      }
    }
    if (plotsOf(s, planet).includes(P.rocket)) break;
    // where to dig: the Heart once the best drill is in hand, else the layer for the scarcest ore we need
    let layer;
    const best = P.tier[P.heartLayer];
    if (s.upgrades.pick >= best && !hasSuit(s, piece)) layer = P.heartLayer;
    else {
      const short = {};
      for (const cost of needs()) for (const [o, n] of Object.entries(cost)) short[o] = (short[o] ?? 0) + Math.max(0, n - (s.bank[o] ?? 0));
      const reachable = Object.keys(P.layers).filter((l) => s.upgrades.pick >= P.tier[l]);
      layer = reachable.sort((a, b) => {
        const score = (l) => Object.entries(dens[l].ores).reduce((n, [o, d]) => n + d * (short[o] ?? 0), 0);
        return score(b) - score(a);
      })[0];
    }
    const cap = packCap(s);
    const gain = {};
    for (const [o, d] of Object.entries(dens[layer].ores)) gain[o] = Math.round(d * DUG_PER_TRIP * AIM);
    for (const [o, n] of Object.entries(P.special[layer])) gain[o] = (gain[o] ?? 0) + n;
    gain[P.chest[layer]] = (gain[P.chest[layer]] ?? 0) + 4;
    const total = Object.values(gain).reduce((a, b) => a + b, 0);
    for (const o of Object.keys(gain)) if (total > cap) gain[o] = Math.floor((gain[o] * cap) / total);
    s = { ...s, bank: { ...s.bank } };
    for (const [o, n] of Object.entries(gain)) s.bank[o] = (s.bank[o] ?? 0) + n;
    if (layer === P.heartLayer && s.upgrades.pick >= best && !hasSuit(s, piece)) { s = winSuitPiece(s, piece); log.push(`${trips}:${piece}`); }
    s = campGift(s, planet).state;
  }
  return { trips, log, s };
}

const order = (log, pattern) => log.filter((l) => pattern.test(l)).map((l) => l.split(':')[1]);

describe('Moon balance', () => {
  it('takes a good many trips (not one session) to build the Mars Rocket', () => {
    const { trips, log } = play('moon');
    // ~5 minutes a trip plus camp time: 12+ trips is two or three sessions
    expect(trips).toBeGreaterThanOrEqual(12);
    expect(trips).toBeLessThanOrEqual(24);
    // the drills come in order, each opening a new layer
    expect(order(log, /pick|helmet|marsrocket/)).toEqual(['pick6', 'pick7', 'pick8', 'helmet', 'marsrocket']);
  });
});

describe('Mars balance', () => {
  it('takes a good many trips to build the Saturn Rocket, with the drills in order', () => {
    const { trips, log } = play('mars');
    expect(trips).toBeGreaterThanOrEqual(12);
    expect(trips).toBeLessThanOrEqual(24);
    expect(order(log, /pick|boots|saturnrocket/)).toEqual(['pick9', 'pick10', 'pick11', 'boots', 'saturnrocket']);
  });

  it('the Rover Bot’s trailer makes it quicker (but not too quick)', () => {
    const plain = play('mars').trips;
    PLANET.mars.start = { ...PLANET.mars.start, pets: ['rover'] };
    const withRover = play('mars').trips;
    PLANET.mars.start = { upgrades: { pick: 8, pack: 5, lantern: 5 }, suit: ['helmet'] };
    expect(withRover).toBeLessThanOrEqual(plain);
    expect(withRover).toBeGreaterThanOrEqual(10);
  });
});

describe('Saturn balance', () => {
  it('takes a good many trips to build the Dino Rocket, with the drills in order', () => {
    const { trips, log } = play('saturn');
    expect(trips).toBeGreaterThanOrEqual(12);
    expect(trips).toBeLessThanOrEqual(24);
    expect(order(log, /pick|gloves|dinorocket/)).toEqual(['pick12', 'pick13', 'pick14', 'gloves', 'dinorocket']);
  });
});

describe('Dino Planet balance', () => {
  it('takes a good many trips to build the Sun Rocket, with the drills in order', () => {
    const { trips, log } = play('dino');
    expect(trips).toBeGreaterThanOrEqual(12);
    expect(trips).toBeLessThanOrEqual(24);
    expect(order(log, /pick|jetpack|sunrocket/)).toEqual(['pick15', 'pick16', 'pick17', 'jetpack', 'sunrocket']);
  });
});

export { play };
