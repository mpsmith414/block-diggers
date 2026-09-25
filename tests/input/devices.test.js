import { describe, it, expect } from 'vitest';
import { readPad, createKeyboard, createDevices, BUTTON_INDEX } from '../../src/input/devices.js';

const fakePad = (over = {}) => ({
  index: 0,
  id: 'Xbox Wireless Controller',
  mapping: 'standard',
  connected: true,
  axes: [0, 0, 0, 0],
  buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
  ...over,
});

const press = (pad, name) => { pad.buttons[BUTTON_INDEX[name]] = { pressed: true, value: 1 }; return pad; };

const keyEvent = (type, key) => Object.assign(new Event(type, { cancelable: true }), { key });

describe('readPad', () => {
  it('names the device by gamepad index', () => {
    expect(readPad(fakePad({ index: 1 })).id).toBe('pad1');
  });
  it('reads standard-mapping buttons', () => {
    const s = readPad(press(press(fakePad(), 'a'), 'up'));
    expect(s.buttons.a).toBe(true);
    expect(s.buttons.up).toBe(true);
    expect(s.buttons.b).toBe(false);
  });
  it('reads both sticks', () => {
    const s = readPad(fakePad({ axes: [0.5, -1, 0.25, 0.75] }));
    expect(s.axes).toEqual({ lx: 0.5, ly: -1, rx: 0.25, ry: 0.75 });
  });
  it('treats missing axes and buttons as neutral', () => {
    const s = readPad(fakePad({ axes: [], buttons: [] }));
    expect(s.axes).toEqual({ lx: 0, ly: 0, rx: 0, ry: 0 });
    expect(s.buttons.a).toBe(false);
  });
});

describe('createKeyboard', () => {
  it('holds mapped keys until released', () => {
    const target = new EventTarget();
    const kb = createKeyboard(target);
    target.dispatchEvent(keyEvent('keydown', 'ArrowLeft'));
    target.dispatchEvent(keyEvent('keydown', ' '));
    expect(kb.read().buttons).toMatchObject({ left: true, a: true });
    target.dispatchEvent(keyEvent('keyup', 'ArrowLeft'));
    expect(kb.read().buttons.left).toBe(false);
  });
  it('maps WASD, H, B and Escape case-insensitively', () => {
    const target = new EventTarget();
    const kb = createKeyboard(target);
    for (const k of ['W', 'a', 's', 'd', 'h', 'b', 'Escape']) target.dispatchEvent(keyEvent('keydown', k));
    expect(kb.read().buttons).toMatchObject({ up: true, left: true, down: true, right: true, b: true, y: true, start: true });
  });
  it('prevents default only for mapped keys', () => {
    const target = new EventTarget();
    createKeyboard(target);
    const mapped = keyEvent('keydown', 'ArrowUp');
    const unmapped = keyEvent('keydown', 'q');
    target.dispatchEvent(mapped);
    target.dispatchEvent(unmapped);
    expect(mapped.defaultPrevented).toBe(true);
    expect(unmapped.defaultPrevented).toBe(false);
  });
  it('releases everything on blur', () => {
    const target = new EventTarget();
    const kb = createKeyboard(target);
    target.dispatchEvent(keyEvent('keydown', 'ArrowRight'));
    target.dispatchEvent(new Event('blur'));
    expect(kb.read().buttons.right).toBe(false);
  });
  it('stops listening after destroy', () => {
    const target = new EventTarget();
    const kb = createKeyboard(target);
    kb.destroy();
    target.dispatchEvent(keyEvent('keydown', 'ArrowRight'));
    expect(kb.read().buttons.right).toBe(false);
  });
});

describe('createDevices', () => {
  it('returns connected pads then the keyboard', () => {
    const nav = { getGamepads: () => [null, fakePad({ index: 1 })] };
    const d = createDevices({ nav, target: new EventTarget() });
    expect(d.poll().map((s) => s.id)).toEqual(['pad1', 'keyboard']);
  });
  it('skips pads reporting connected: false', () => {
    const nav = { getGamepads: () => [fakePad({ connected: false })] };
    const d = createDevices({ nav, target: new EventTarget() });
    expect(d.poll().map((s) => s.id)).toEqual(['keyboard']);
  });
  it('survives a browser without the Gamepad API, or one that throws', () => {
    const none = createDevices({ nav: {}, target: new EventTarget() });
    const throws = createDevices({ nav: { getGamepads: () => { throw new Error('blocked'); } }, target: new EventTarget() });
    expect(none.poll().map((s) => s.id)).toEqual(['keyboard']);
    expect(throws.poll().map((s) => s.id)).toEqual(['keyboard']);
  });
});
