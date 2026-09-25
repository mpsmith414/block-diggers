import { describe, it, expect } from 'vitest';
import { applyDeadzone, toIntent, createHoldTimer, createEdge, DEADZONE } from '../../src/input/intents.js';

const idle = () => ({
  id: 'pad0', kind: 'pad', label: 'test',
  axes: { lx: 0, ly: 0, rx: 0, ry: 0 },
  buttons: { a: false, b: false, x: false, y: false, lb: false, rb: false,
    back: false, start: false, up: false, down: false, left: false, right: false },
});

describe('applyDeadzone', () => {
  it('uses a 0.25 deadzone', () => {
    expect(DEADZONE).toBe(0.25);
  });
  it('zeroes small stick drift', () => {
    expect(applyDeadzone(0.2, 0.1)).toEqual({ x: 0, y: 0 });
  });
  it('rescales so the deadzone edge is ~0 and full tilt is 1', () => {
    expect(applyDeadzone(1, 0).x).toBeCloseTo(1);
    expect(applyDeadzone(0.26, 0).x).toBeCloseTo(0.0133, 3);
  });
  it('never exceeds magnitude 1', () => {
    const v = applyDeadzone(1, 1);
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(1);
  });
});

describe('toIntent', () => {
  it('is all neutral for an idle device', () => {
    expect(toIntent(idle())).toEqual({ moveX: 0, moveY: 0, jump: false, bubble: false, home: false, pause: false });
  });
  it('maps the left stick to movement', () => {
    const s = idle(); s.axes.lx = 1; s.axes.ly = 0;
    expect(toIntent(s).moveX).toBeCloseTo(1);
  });
  it('lets the d-pad override the stick at full strength', () => {
    const s = idle(); s.axes.lx = 0.5; s.buttons.left = true; s.buttons.down = true;
    const i = toIntent(s);
    expect(i.moveX).toBe(-1);
    expect(i.moveY).toBe(1);
  });
  it('jumps on A or X', () => {
    const a = idle(); a.buttons.a = true;
    const x = idle(); x.buttons.x = true;
    expect(toIntent(a).jump).toBe(true);
    expect(toIntent(x).jump).toBe(true);
  });
  it('maps Y to bubble, B to home, Start or Back to pause', () => {
    const s = idle(); s.buttons.y = true; s.buttons.b = true; s.buttons.back = true;
    expect(toIntent(s)).toMatchObject({ bubble: true, home: true, pause: true });
    const t = idle(); t.buttons.start = true;
    expect(toIntent(t).pause).toBe(true);
  });
});

describe('createHoldTimer', () => {
  it('fires once when held for the full duration', () => {
    const h = createHoldTimer(2000);
    expect(h.update(true, 1000)).toBe(false);
    expect(h.progress()).toBeCloseTo(0.5);
    expect(h.update(true, 1000)).toBe(true);
    expect(h.update(true, 500)).toBe(false);
    expect(h.progress()).toBe(1);
  });
  it('resets when released', () => {
    const h = createHoldTimer(2000);
    h.update(true, 1500);
    h.update(false, 16);
    expect(h.progress()).toBe(0);
    expect(h.update(true, 1000)).toBe(false);
  });
});

describe('createEdge', () => {
  it('is true only on the frame a button goes down', () => {
    const e = createEdge();
    expect(e(true)).toBe(true);
    expect(e(true)).toBe(false);
    expect(e(false)).toBe(false);
    expect(e(true)).toBe(true);
  });
});
