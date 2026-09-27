// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { createTouch, stickFromDrag } from '../../src/input/touch.js';

afterEach(() => { document.body.innerHTML = ''; });

const ev = (type, x, y, id = 1) => Object.assign(new Event(type, { bubbles: true, cancelable: true }), { clientX: x, clientY: y, pointerId: id });

describe('stickFromDrag', () => {
  it('maps a drag to -1..1 axes, clamped to the stick radius', () => {
    expect(stickFromDrag(0, 0, 25, 0, 50)).toEqual({ x: 0.5, y: 0 });
    const far = stickFromDrag(0, 0, 0, 200, 50);
    expect(far.x).toBeCloseTo(0);
    expect(far.y).toBeCloseTo(1);
    const diag = stickFromDrag(0, 0, 100, 100, 50);
    expect(Math.hypot(diag.x, diag.y)).toBeCloseTo(1);
  });
});

describe('createTouch', () => {
  it('reports a normal device state named "touch"', () => {
    const t = createTouch({ doc: document, win: window });
    const s = t.read();
    expect(s.id).toBe('touch');
    expect(s.kind).toBe('touch');
    expect(s.buttons.a).toBe(false);
    expect(s.axes).toEqual({ lx: 0, ly: 0, rx: 0, ry: 0 });
    t.destroy();
  });

  it('left-half drag moves the stick; release recentres it', () => {
    Object.defineProperty(window, 'innerWidth', { value: 800, configurable: true });
    const t = createTouch({ doc: document, win: window, radius: 50 });
    expect(document.getElementById('touch-book')).not.toBeNull();
    const pad = document.getElementById('touch-stick-zone');
    pad.dispatchEvent(ev('pointerdown', 100, 300));
    pad.dispatchEvent(ev('pointermove', 150, 300));
    expect(t.read().axes.lx).toBeCloseTo(1);
    pad.dispatchEvent(ev('pointerup', 150, 300));
    expect(t.read().axes.lx).toBe(0);
    t.destroy();
  });

  it('the A and home buttons press a and b while held; a quick tap still registers once', () => {
    const t = createTouch({ doc: document, win: window });
    const a = document.getElementById('touch-a');
    const home = document.getElementById('touch-home');
    a.dispatchEvent(ev('pointerdown', 0, 0, 2));
    home.dispatchEvent(ev('pointerdown', 0, 0, 3));
    let s = t.read();
    expect(s.buttons.a).toBe(true);
    expect(s.buttons.b).toBe(true);
    a.dispatchEvent(ev('pointerup', 0, 0, 2));
    home.dispatchEvent(ev('pointerup', 0, 0, 3));
    s = t.read();
    expect(s.buttons.a).toBe(false);
    a.dispatchEvent(ev('pointerdown', 0, 0, 4));
    a.dispatchEvent(ev('pointerup', 0, 0, 4));
    expect(t.read().buttons.a).toBe(true);
    expect(t.read().buttons.a).toBe(false);
    t.destroy();
    expect(document.getElementById('touch-a')).toBeNull();
  });
});
