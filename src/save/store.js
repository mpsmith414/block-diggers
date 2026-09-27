// The game's saved state, kept in the Phaser registry and written to
// localStorage whenever it changes.

import { loadState, saveState } from './save.js';

function storage() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export function loadIntoRegistry(registry) {
  const { state, status } = loadState(storage());
  registry.set('save', state);
  registry.set('saveStatus', status);
  return state;
}

export function getState(registry) {
  return registry.get('save');
}

export function setState(registry, state) {
  registry.set('save', state);
  saveState(storage(), state);
  return state;
}
