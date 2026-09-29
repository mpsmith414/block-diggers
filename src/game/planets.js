// The journey: every planet you can dig, in order. A planet is a recipe of
// layers, ores, gravity, a camp, the buildings that do its perks, its chests
// and the Sun Suit piece at its bottom, so a new planet is mostly a new entry
// here (plus its art and generator).
//
// perks: `reveal` shows every chest on the depth meter, `elevator` takes you
// to any layer you've reached, `gift` makes some ore each trip home.

import { ORES } from '../world/blocks.js';
import {
  LAYERS, MOON_LAYERS, MARS_LAYERS, SATURN_LAYERS, DINO_LAYERS, SUN_LAYERS, MINE_H, MOON_H, MARS_H, SATURN_H, DINO_H, SUN_H, LOW_GRAVITY,
  CAMP, MOON_CAMP, MARS_CAMP, SATURN_CAMP, DINO_CAMP, SUN_CAMP, PERKS, PETS,
} from '../tuning.js';

const tops = (layers, byOre) => Object.fromEntries(Object.entries(byOre).map(([ore, layer]) => [ore, layers[layer].top]));

export const PLANETS = [
  {
    id: 'earth', layers: LAYERS, rows: MINE_H, ores: ORES.slice(0, 8), gravity: 1, suit: null, camp: CAMP, heart: 'earth',
    perks: { reveal: 'tower', elevator: 'minecart', gift: { building: 'dinopark', ore: 'amber', n: PETS.parkAmber } },
  },
  {
    id: 'moon', layers: MOON_LAYERS, rows: MOON_H, ores: ['moonstone', 'cheese', 'spacegem', 'gizmo'], gravity: LOW_GRAVITY, suit: 'helmet', camp: MOON_CAMP, heart: 'moon',
    perks: { reveal: 'telescope', elevator: 'hangar', gift: { building: 'cheesefactory', ore: 'cheese', n: PERKS.factoryCheese } },
    // Moon chests: each layer's own ore (the core has a bit of everything)
    chests: { craters: ['moonstone'], cheesecaves: ['cheese'], mooncrystal: ['spacegem'], alienbase: ['gizmo'], mooncore: ['moonstone', 'spacegem', 'gizmo'] },
    oreRows: tops(MOON_LAYERS, { moonstone: 'craters', cheese: 'cheesecaves', spacegem: 'mooncrystal', gizmo: 'alienbase' }),
  },
  {
    id: 'mars', layers: MARS_LAYERS, rows: MARS_H, ores: ['ruby', 'bolt', 'opal', 'coin'], gravity: 1, suit: 'boots', camp: MARS_CAMP, heart: 'mars',
    perks: { reveal: 'weather', elevator: 'garage', gift: { building: 'robotfactory', ore: 'bolt', n: 3 } },
    chests: { dunes: ['ruby'], rovers: ['bolt'], volcano: ['opal'], ruins: ['coin'], marscore: ['ruby', 'opal', 'coin'] },
    oreRows: tops(MARS_LAYERS, { ruby: 'dunes', bolt: 'rovers', opal: 'volcano', coin: 'ruins' }),
  },
  {
    id: 'saturn', layers: SATURN_LAYERS, rows: SATURN_H, ores: ['frost', 'icecream', 'pearl', 'comet'], gravity: 1, suit: 'gloves', camp: SATURN_CAMP, heart: 'saturn',
    perks: { reveal: 'lighthouse', elevator: 'skilift', gift: { building: 'parlour', ore: 'icecream', n: 3 } },
    chests: { rings: ['frost'], icecream: ['icecream'], aurora: ['pearl'], comets: ['comet'], saturncore: ['frost', 'pearl', 'comet'] },
    oreRows: tops(SATURN_LAYERS, { frost: 'rings', icecream: 'icecream', pearl: 'aurora', comet: 'comets' }),
  },
  {
    id: 'dino', layers: DINO_LAYERS, rows: DINO_H, ores: ['jade', 'bone', 'tooth', 'obsidian'], gravity: 1, suit: 'jetpack', camp: DINO_CAMP, heart: 'dino',
    perks: { reveal: 'treehouse', elevator: 'pteroperch', gift: { building: 'nursery', ore: 'jade', n: 3 } },
    chests: { jungle: ['jade'], bonebeds: ['bone'], swamp: ['tooth'], lavalands: ['obsidian'], dinocore: ['bone', 'tooth', 'obsidian'] },
    oreRows: tops(DINO_LAYERS, { jade: 'jungle', bone: 'bonebeds', tooth: 'swamp', obsidian: 'lavalands' }),
  },
  {
    id: 'sun', finale: true, layers: SUN_LAYERS, rows: SUN_H, ores: ['sunstone', 'flare', 'plasma', 'nova'], gravity: 1, suit: null, camp: SUN_CAMP, heart: 'sun',
    perks: { reveal: 'sundial', elevator: 'sunbeam', gift: { building: 'sunflowers', ore: 'sunstone', n: 3 } },
    chests: { corona: ['sunstone'], sunspots: ['flare'], plasmasea: ['plasma'], radiance: ['nova'], fusion: ['nova', 'plasma'], suncore: ['flare', 'plasma', 'nova'] },
    oreRows: tops(SUN_LAYERS, { sunstone: 'corona', flare: 'sunspots', plasma: 'plasmasea', nova: 'radiance' }),
  },
];

const BY_ID = new Map(PLANETS.map((p) => [p.id, p]));

export const planetById = (id) => BY_ID.get(id) ?? null;
export const layersOf = (id) => planetById(id)?.layers ?? LAYERS;
export const mineRows = (id) => planetById(id)?.rows ?? MINE_H;

// The layer a row is in; above the first layer counts as the first, below the
// last as the last.
export function layerOfRow(row, planet = 'earth') {
  const layers = Object.entries(layersOf(planet));
  for (const [name, { top, bottom }] of layers) if (row >= top && row <= bottom) return name;
  return row < layers[0][1].top ? layers[0][0] : layers[layers.length - 1][0];
}

export function planetOfLayer(layer) {
  const p = PLANETS.find((pl) => pl.layers && layer in pl.layers);
  return p ? p.id : null;
}

// ---- the star map ----

// What unlocks each planet: a rocket built on the planet before it.
const ROCKET_TO = {
  moon: { at: 'earth', id: 'rocket' }, mars: { at: 'moon', id: 'marsrocket' }, saturn: { at: 'mars', id: 'saturnrocket' },
  dino: { at: 'saturn', id: 'dinorocket' }, sun: { at: 'dino', id: 'sunrocket' },
};
export const rocketTo = (planet) => ROCKET_TO[planet] ?? null;
const built = (state, planet, id) => (planet === 'earth' ? state.plots : state.bases?.[planet]?.plots ?? []).includes(id);

// Can you fly from this camp? Earth needs its Rocket Ship; other camps have a landing pad.
export const rocketAt = (state, planet) => (planet === 'earth' ? built(state, 'earth', 'rocket') : true);

export function starMapStops(state, here) {
  return PLANETS.map((p) => {
    const need = ROCKET_TO[p.id];
    const reached = p.id === 'earth' || (need && built(state, need.at, need.id));
    let status = 'locked';
    if (p.id === here) status = 'here';
    else if (reached) status = p.comingSoon ? 'soon' : 'open';
    return { id: p.id, status, suit: p.suit, hasSuit: !!p.suit && (state.suit ?? []).includes(p.suit) };
  });
}
