// What happened on a trip, for the summary card, and whether it set a record.

import { ORES } from '../world/blocks.js';

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
    records: { deepest: Math.max(deepest, records.deepest), mostOres: Math.max(count, records.mostOres) },
  };
}
