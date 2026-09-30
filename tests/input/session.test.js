import { describe, it, expect } from 'vitest';
import { createInputSession } from '../../src/input/session.js';

const state = (id, over = {}) => ({
  id,
  kind: 'pad',
  axes: { lx: 0, ly: 0, rx: 0, ry: 0 },
  buttons: { a: false, b: false, x: false, y: false, start: false, back: false, up: false, down: false, left: false, right: false },
  ...over,
});

function fakeDevices(frames) {
  let i = 0;
  return { poll: () => frames[Math.min(i++, frames.length - 1)], destroy() {} };
}

describe('createInputSession', () => {
  it('joins on A and gives each joined player an intent', () => {
    const pressA = state('pad0', { buttons: { ...state('pad0').buttons, a: true } });
    const moving = state('pad0', { axes: { lx: 1, ly: 0, rx: 0, ry: 0 } });
    const s = createInputSession({ devices: fakeDevices([[state('pad0')], [pressA], [moving]]), guards: false });
    expect(s.update()).toEqual([]);
    expect(s.update()).toHaveLength(1);
    const [p1] = s.update();
    expect(p1.slot).toBe(0);
    expect(p1.intent.moveX).toBe(1);
  });

  it('reports a null intent when a joined device disconnects', () => {
    const pressA = state('pad0', { buttons: { ...state('pad0').buttons, a: true } });
    const s = createInputSession({ devices: fakeDevices([[pressA], []]), guards: false });
    s.update();
    const [p1] = s.update();
    expect(p1.intent).toBeNull();
  });

  it('ignores A for joining while joining is off, but still reports A to joined players', () => {
    const a0 = state('pad0', { buttons: { ...state('pad0').buttons, a: true } });
    const a1 = state('pad1', { buttons: { ...state('pad1').buttons, a: true } });
    const s = createInputSession({ devices: fakeDevices([[a0], [a0, a1]]), guards: false });
    s.update();
    s.setJoining(false);
    const slots = s.update();
    expect(slots).toHaveLength(1);
    expect(slots[0].intent.jump).toBe(true);
  });

  it('a missing player can rest while the other plays on, and wakes when the controller is back', () => {
    const a0 = state('pad0', { buttons: { ...state('pad0').buttons, a: true } });
    const a1 = state('pad1', { buttons: { ...state('pad1').buttons, a: true } });
    const s = createInputSession({ devices: fakeDevices([[a0, a1], [a0], [a0], [a0, state('pad1')]]), guards: false });
    s.update();
    let [, p2] = s.update();
    expect(p2).toMatchObject({ intent: null, resting: false });
    s.rest(1);
    expect(s.slots[1].resting).toBe(true);
    [, p2] = s.update();
    expect(p2).toMatchObject({ intent: null, resting: true });
    [, p2] = s.update();
    expect(p2.resting).toBe(false);
    expect(p2.intent).not.toBeNull();
  });
});
