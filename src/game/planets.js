// The journey: every planet you can dig, in order. A planet is a recipe of
// layers, ores, gravity, a camp and the Sun Suit piece at its bottom, so a
// new planet is mostly a new entry here (plus its art and generator).

import { ORES } from '../world/blocks.js';
import { LAYERS, MOON_LAYERS, MINE_H, MOON_H, LOW_GRAVITY } from '../tuning.js';

export const PLANETS = [
  { id: 'earth', layers: LAYERS, rows: MINE_H, ores: ORES.slice(0, 8), gravity: 1, suit: null },
  { id: 'moon', layers: MOON_LAYERS, rows: MOON_H, ores: ['moonstone', 'cheese', 'spacegem', 'gizmo'], gravity: LOW_GRAVITY, suit: 'helmet' },
  { id: 'mars', comingSoon: true, suit: 'boots' },
  { id: 'saturn', comingSoon: true, suit: 'gloves' },
  { id: 'dino', comingSoon: true, suit: 'jetpack' },
  { id: 'sun', comingSoon: true, finale: true, suit: null },
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
const ROCKET_TO = { moon: { at: 'earth', id: 'rocket' }, mars: { at: 'moon', id: 'marsrocket' } };
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
