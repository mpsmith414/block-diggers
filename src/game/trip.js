// What happened on a trip, for the summary card, and whether it set a record.

import { ORES } from '../world/blocks.js';
import { MOON_LAYERS, MARS_LAYERS, SATURN_LAYERS, DINO_LAYERS } from '../tuning.js';
import { layersOf } from './planets.js';

// Every layer from the top down to the deepest row reached.
export function layersReached(deepest, planet = 'earth') {
  const layers = Object.entries(layersOf(planet));
  return layers.filter(([, l]) => deepest >= l.top).map(([name]) => name);
}

// Earth's four deep layers and every layer of every other planet get a
// banner (and a badge) the first time you get there. The order is the badge
// strip's frame order.
export const BADGE_LAYERS = ['dino', 'brick', 'meteor', 'core', ...Object.keys(MOON_LAYERS), ...Object.keys(MARS_LAYERS), ...Object.keys(SATURN_LAYERS), ...Object.keys(DINO_LAYERS)];
export function discovery(row, known, planet = 'earth') {
  const layers = layersOf(planet);
  const name = BADGE_LAYERS.find((n) => layers[n] && row >= Math.max(1, layers[n].top) && row <= layers[n].bottom);
  return name && !known.includes(name) ? name : null;
}

export function summarizeTrip({ packs, deepest, chests, stickers, planet = 'earth' }, records) {
  const totals = Object.fromEntries(ORES.map((o) => [o, 0]));
  for (const p of packs) if (p) for (const o of ORES) totals[o] += p[o] ?? 0;
  const count = ORES.reduce((n, o) => n + totals[o], 0);
  const onEarth = planet === 'earth';
  const planetDeepest = { ...(records.planetDeepest ?? {}) };
  const before = onEarth ? records.deepest : planetDeepest[planet] ?? 0;
  if (!onEarth) planetDeepest[planet] = Math.max(before, deepest);
  const best = { deepest: deepest > before, mostOres: count > records.mostOres };
  const earthDeepest = onEarth ? Math.max(deepest, records.deepest) : records.deepest;
  return {
    totals,
    count,
    deepest,
    chests,
    stickers,
    best,
    planet,
    moon: planet === 'moon',
    away: !onEarth,
    records: {
      ...records,
      deepest: earthDeepest,
      mostOres: Math.max(count, records.mostOres),
      layers: [...new Set([
        ...(records.layers ?? []),
        ...layersReached(earthDeepest),
        ...(onEarth ? [] : layersReached(planetDeepest[planet], planet)),
      ])],
      planetDeepest,
      moonTrips: (records.moonTrips ?? 0) + (planet === 'moon' ? 1 : 0),
    },
  };
}

