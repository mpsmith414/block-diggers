// Load / save / migrate the camp. Storage may be missing or throw (TV
// browsers, private windows): then the game just keeps playing in memory.

import { ORES } from '../world/blocks.js';

export const SAVE_KEY = 'block-diggers-save';
export const VERSION = 2;
const PLOT_COUNT = 6;

const emptyBank = () => Object.fromEntries(ORES.map((o) => [o, 0]));

export function defaultState() {
  return {
    version: VERSION,
    bank: emptyBank(),
    upgrades: { pick: 0, pack: 0, lantern: 0 },
    plots: Array(PLOT_COUNT).fill(null),
    characters: null,
    trips: 0,
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
  // fill anything missing, keep anything unknown
  const d = defaultState();
  return {
    ...d,
    ...s,
    bank: { ...d.bank, ...(s.bank || {}) },
    upgrades: { ...d.upgrades, ...(s.upgrades || {}) },
    plots: Array.from({ length: PLOT_COUNT }, (_, i) => (s.plots && s.plots[i]) || null),
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
