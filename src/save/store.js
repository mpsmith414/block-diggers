// The game's saved state, kept in the Phaser registry and written to
// localStorage whenever it changes.

import { loadState, saveState } from './save.js';
import { rollBackup, withBackup, BACKUP_EVERY } from './backup.js';

let lastBackup = 0; // (only look at the copies now and then)

function storage() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export function loadIntoRegistry(registry) {
  // (a missing or damaged save comes back from its automatic copy)
  const { state, status } = withBackup(loadState(storage()), storage());
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
  const now = Date.now();
  if (now - lastBackup >= BACKUP_EVERY) {
    rollBackup(storage(), state, now);
    lastBackup = now;
  }
  return state;
}
