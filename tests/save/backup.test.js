import { describe, it, expect } from 'vitest';
import { rollBackup, latestBackup, exportText, importText, backupFileName, BACKUP_KEYS, BACKUP_EVERY } from '../../src/save/backup.js';
import { defaultState, VERSION } from '../../src/save/save.js';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), map: m };
};
const game = (trips) => ({ ...defaultState(), trips });

describe('automatic backups', () => {
  it('keeps a copy after saving, at most every so often, and the one before it', () => {
    const s = memory();
    expect(rollBackup(s, game(1), 1000)).toBe(true);
    expect(rollBackup(s, game(2), 1000 + BACKUP_EVERY / 2)).toBe(false); // too soon
    expect(latestBackup(s).state.trips).toBe(1);
    expect(rollBackup(s, game(3), 1000 + BACKUP_EVERY + 1)).toBe(true);
    expect(latestBackup(s).state.trips).toBe(3);
    expect(JSON.parse(s.getItem(BACKUP_KEYS[1])).state.trips).toBe(1);
  });

  it('falls back to the older copy if the latest is damaged, and never throws', () => {
    const s = memory();
    rollBackup(s, game(1), 0);
    rollBackup(s, game(2), BACKUP_EVERY + 1);
    s.setItem(BACKUP_KEYS[0], '{broken');
    expect(latestBackup(s).state.trips).toBe(1);
    expect(latestBackup(memory())).toBe(null);
    expect(latestBackup(undefined)).toBe(null);
    const throwing = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); } };
    expect(rollBackup(throwing, game(1), 0)).toBe(false);
  });
});

describe('backup files', () => {
  it('a downloaded game loads back exactly', () => {
    const st = { ...game(42), stickers: { 'ore-coal': true }, build: { edits: [[5, 20, 30]] } };
    const back = importText(exportText(st, 5));
    expect(back.state.trips).toBe(42);
    expect(back.state.stickers).toEqual({ 'ore-coal': true });
    expect(back.state.build.edits).toEqual([[5, 20, 30]]);
    expect(back.state.version).toBe(VERSION);
  });

  it('an older save file is brought up to date; junk is refused', () => {
    expect(importText(JSON.stringify({ version: 3, bank: { coal: 7 } })).state.bank.coal).toBe(7);
    expect(importText('hello').error).toBe('not-json');
    expect(importText('{"game":"block-diggers","state":{"nope":1}}').error).toBe('not-a-save');
    expect(importText(JSON.stringify({ version: VERSION + 5, bank: {} })).error).toBe('not-a-save');
  });

  it('names the file by the date', () => {
    expect(backupFileName(new Date(2026, 8, 30).getTime())).toBe('block-diggers-save-2026-09-30.json');
  });
});

describe('starting the game', () => {
  it('a missing or damaged save comes back from the automatic copy; a good save is left alone', async () => {
    const { withBackup } = await import('../../src/save/backup.js');
    const s = memory();
    rollBackup(s, game(9), 0);
    expect(withBackup({ state: defaultState(), status: 'new' }, s)).toMatchObject({ status: 'restored', state: { trips: 9 } });
    expect(withBackup({ state: defaultState(), status: 'corrupt' }, s).state.trips).toBe(9);
    const good = { state: game(3), status: 'loaded' };
    expect(withBackup(good, s)).toBe(good);
    expect(withBackup({ state: defaultState(), status: 'new' }, memory()).status).toBe('new');
  });
});
