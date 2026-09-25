import { describe, it, expect } from 'vitest';
import { createPlayers } from '../../src/input/players.js';

const st = (id, a = false) => ({ id, buttons: { a } });

describe('createPlayers', () => {
  it('has nobody until a device presses A', () => {
    const p = createPlayers();
    expect(p.update([st('pad0'), st('keyboard')])).toEqual([]);
    expect(p.count).toBe(0);
  });
  it('gives slots in the order devices press A', () => {
    const p = createPlayers();
    p.update([st('pad1', true), st('pad0')]);
    const slots = p.update([st('pad1'), st('pad0', true)]);
    expect(slots.map((s) => [s.slot, s.deviceId])).toEqual([[0, 'pad1'], [1, 'pad0']]);
  });
  it('never gives one device two slots', () => {
    const p = createPlayers();
    p.update([st('pad0', true)]);
    p.update([st('pad0', true)]);
    expect(p.count).toBe(1);
  });
  it('ignores a third device when full', () => {
    const p = createPlayers(2);
    p.update([st('pad0', true), st('pad1', true), st('keyboard', true)]);
    expect(p.count).toBe(2);
  });
  it('keeps the slot with a null state while disconnected, and restores it', () => {
    const p = createPlayers();
    p.update([st('pad0', true)]);
    expect(p.update([])[0]).toEqual({ slot: 0, deviceId: 'pad0', state: null });
    expect(p.update([st('pad0')])[0].state).not.toBeNull();
  });
  it('reset clears all slots', () => {
    const p = createPlayers();
    p.update([st('pad0', true)]);
    p.reset();
    expect(p.count).toBe(0);
  });
});
