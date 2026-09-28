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
