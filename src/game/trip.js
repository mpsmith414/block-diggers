// What happened on a trip, for the summary card, and whether it set a record.

import { ORES } from '../world/blocks.js';
import { LAYERS } from '../tuning.js';

// Every layer from the top down to the deepest row reached.
export function layersReached(deepest) {
  return Object.entries(LAYERS).filter(([, l]) => deepest >= l.top).map(([name]) => name);
}

// The four deep layers each get a banner (and a badge) the first time you get there.
export const BADGE_LAYERS = ['dino', 'brick', 'meteor', 'core'];
export function discovery(row, known) {
  const name = BADGE_LAYERS.find((n) => row >= LAYERS[n].top && row <= LAYERS[n].bottom);
  return name && !known.includes(name) ? name : null;
}

export function summarizeTrip({ packs, deepest, chests, stickers }, records) {
  const totals = Object.fromEntries(ORES.map((o) => [o, 0]));
  for (const p of packs) if (p) for (const o of ORES) totals[o] += p[o] ?? 0;
  const count = ORES.reduce((n, o) => n + totals[o], 0);
  const best = { deepest: deepest > records.deepest, mostOres: count > records.mostOres };
  return {
    totals,
    count,
    deepest,
    chests,
    stickers,
    best,
    records: {
      ...records,
      deepest: Math.max(deepest, records.deepest),
      mostOres: Math.max(count, records.mostOres),
      layers: layersReached(Math.max(deepest, records.deepest)),
    },
  };
}
