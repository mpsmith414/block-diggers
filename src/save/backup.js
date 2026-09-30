// Keeping the game safe. Two automatic copies live next to the save (the
// latest, and the one before it, at least BACKUP_EVERY apart), so a damaged or
// missing save comes back on its own. And a grown-up can download the whole
// game as a file, and load it back (on another computer, or after clearing
// the browser).

import { migrate, VERSION } from './save.js';

export const BACKUP_KEYS = ['block-diggers-backup', 'block-diggers-backup-older'];
export const BACKUP_EVERY = 10 * 60 * 1000; // ms between automatic copies

const looksLikeSave = (s) => !!s && typeof s === 'object' && typeof s.version === 'number' && s.version <= VERSION
  && !!s.bank && typeof s.bank === 'object';

function read(storage, key) {
  try {
    const b = JSON.parse(storage.getItem(key));
    return b && typeof b.time === 'number' && looksLikeSave(b.state) ? b : null;
  } catch {
    return null;
  }
}

// After a save: refresh the automatic copies (if the latest is old enough).
// Returns true when a new copy was made.
export function rollBackup(storage, state, now = Date.now()) {
  if (!storage) return false;
  try {
    const latest = read(storage, BACKUP_KEYS[0]);
    if (latest && now - latest.time < BACKUP_EVERY) return false;
    if (latest) storage.setItem(BACKUP_KEYS[1], JSON.stringify(latest));
    storage.setItem(BACKUP_KEYS[0], JSON.stringify({ time: now, state }));
    return true;
  } catch {
    return false;
  }
}

// The newest automatic copy there is ({ time, state }), or null.
export function latestBackup(storage) {
  if (!storage) return null;
  return read(storage, BACKUP_KEYS[0]) ?? read(storage, BACKUP_KEYS[1]);
}

// The whole game as a file's text.
export const exportText = (state, now = Date.now()) => JSON.stringify({ game: 'block-diggers', time: now, state });

export function backupFileName(now = Date.now()) {
  const d = new Date(now);
  const pad = (n) => String(n).padStart(2, '0');
  return `block-diggers-save-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

// Read a backup file back in: { state } (brought up to date), or { error }.
export function importText(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return { error: 'not-json' };
  }
  const state = raw && raw.game === 'block-diggers' ? raw.state : raw;
  if (!looksLikeSave(state)) return { error: 'not-a-save' };
  return { state: migrate(state) };
}

// When the game starts: if the save is missing or damaged but an automatic
// copy is there, use the copy instead.
export function withBackup(loaded, storage) {
  if (loaded.status !== 'new' && loaded.status !== 'corrupt') return loaded;
  const b = latestBackup(storage);
  return b ? { state: migrate(b.state), status: 'restored' } : loaded;
}
