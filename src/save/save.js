// Load / save / migrate the camp. Storage may be missing or throw (TV
// browsers, private windows): then the game just keeps playing in memory.

import { ORES } from '../world/blocks.js';
import { layersReached } from '../game/trip.js';
import { MOON_PLOTS } from '../game/economy.js';

export const SAVE_KEY = 'block-diggers-save';
export const VERSION = 10;
const PLOT_COUNT = 9;

// the Heart of the World and moon cheese are kept in the bank too
const emptyBank = () => ({ ...Object.fromEntries(ORES.map((o) => [o, 0])), heart: 0, cheese: 0 });

export function defaultState() {
  return {
    version: VERSION,
    bank: emptyBank(),
    upgrades: { pick: 0, pack: 0, lantern: 0 },
    plots: Array(PLOT_COUNT).fill(null),
    characters: null,
    trips: 0,
    records: { deepest: 0, mostOres: 0, layers: [], moonTrips: 0, planetDeepest: {} },
    stickers: {},
    trophiesAwarded: [],
    pets: [],
    decor: { stock: {}, placed: [] },
    garden: { stock: 0 },
    pen: { gifts: 0 },
    visitors: { met: [], requests: {}, seen: [] },
    // the planets: where you are, each planet's camp, and the Sun Suit pieces you have
    planet: 'earth',
    bases: { moon: { plots: Array(MOON_PLOTS).fill(null) }, mars: { plots: Array(MOON_PLOTS).fill(null) }, saturn: { plots: Array(MOON_PLOTS).fill(null) }, dino: { plots: Array(MOON_PLOTS).fill(null) }, sun: { plots: Array(MOON_PLOTS).fill(null) } },
    sunHeart: false, // the finale: the Sun's Heart came home (a mini-sun over Earth camp)
    suit: [],
    // the Build Yard: every cell that differs from the meadow, as [x, y, block]
    build: { edits: [] },
  };
}

export function migrate(raw) {
  let s = { ...raw };
  if (!s.version || s.version === 1) {
    const { pick = 0, pack = 0, lantern = 0, buildings = [], ...rest } = s;
    const plots = Array(PLOT_COUNT).fill(null);
    buildings.slice(0, PLOT_COUNT).forEach((id, i) => { plots[i] = id; });
    s = { ...defaultState(), ...rest, version: 2, upgrades: { pick, pack, lantern }, plots };
  }
  if (s.version === 2) {
    s = { ...s, version: 3 };
  }
  if (s.version === 3) {
    s = { ...s, version: 4 };
  }
  if (s.version === 4) {
    // moon cheese is an ore now: its old sticker becomes the ore sticker
    const stickers = { ...(s.stickers || {}) };
    if (stickers['moon-cheese']) { stickers['ore-cheese'] = true; delete stickers['moon-cheese']; }
    s = { ...s, version: 5, stickers };
  }
  if (s.version === 5) {
    // Mars: its base and its ores are filled in below
    s = { ...s, version: 6 };
  }
  if (s.version === 6) {
    // Saturn: the same
    s = { ...s, version: 7 };
  }
  if (s.version === 7) {
    // Dino Planet: the same
    s = { ...s, version: 8 };
  }
  if (s.version === 8) {
    // the Sun: the same (and sunHeart starts false)
    s = { ...s, version: 9 };
  }
  if (s.version === 9) {
    // the Build Yard starts as an empty meadow (filled in below)
    s = { ...s, version: 10 };
  }
  // fill anything missing, keep anything unknown
  const d = defaultState();
  const records = { ...d.records, ...(s.records || {}) };
  // saves from before the deeper world: the layers you've reached come from your deepest row
  records.layers = [...new Set([...layersReached(records.deepest), ...records.layers])];
  return {
    ...d,
    ...s,
    bank: { ...d.bank, ...(s.bank || {}) },
    upgrades: { ...d.upgrades, ...(s.upgrades || {}) },
    plots: Array.from({ length: PLOT_COUNT }, (_, i) => (s.plots && s.plots[i]) || null),
    records,
    decor: { ...d.decor, ...(s.decor || {}) },
    visitors: { ...d.visitors, ...(s.visitors || {}) },
    bases: {
      ...d.bases,
      ...(s.bases || {}),
      moon: { plots: Array.from({ length: MOON_PLOTS }, (_, i) => s.bases?.moon?.plots?.[i] || null) },
      mars: { plots: Array.from({ length: MOON_PLOTS }, (_, i) => s.bases?.mars?.plots?.[i] || null) },
      saturn: { plots: Array.from({ length: MOON_PLOTS }, (_, i) => s.bases?.saturn?.plots?.[i] || null) },
      dino: { plots: Array.from({ length: MOON_PLOTS }, (_, i) => s.bases?.dino?.plots?.[i] || null) },
      sun: { plots: Array.from({ length: MOON_PLOTS }, (_, i) => s.bases?.sun?.plots?.[i] || null) },
    },
    suit: [...new Set(s.suit || [])],
    build: { ...(s.build || {}), edits: Array.isArray(s.build?.edits) ? s.build.edits : [] },
  };
}

export function loadState(storage) {
  let text;
  try {
    if (!storage) throw new Error('no storage');
    text = storage.getItem(SAVE_KEY);
  } catch {
    return { state: defaultState(), status: 'unavailable' };
  }
  if (text == null) return { state: defaultState(), status: 'new' };
  try {
    const raw = JSON.parse(text);
    if (!raw || typeof raw !== 'object') throw new Error('bad save');
    const wasCurrent = raw.version === VERSION;
    return { state: migrate(raw), status: wasCurrent ? 'loaded' : 'migrated' };
  } catch {
    try { storage.setItem(`${SAVE_KEY}-corrupt`, text); } catch { /* keep going */ }
    return { state: defaultState(), status: 'corrupt' };
  }
}

export function saveState(storage, state) {
  try {
    if (!storage) return false;
    storage.setItem(SAVE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
