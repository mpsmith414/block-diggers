// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  installBackGuard, installFocusGuard, setCursorHidden,
  setPointerLock, setFullscreen, createEventBlocker,
} from '../../src/input/tvGuard.js';

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

describe('installBackGuard', () => {
  it('pushes a spare history entry and turns Back into a callback', () => {
    const push = vi.spyOn(window.history, 'pushState');
    const onBack = vi.fn();
    const off = installBackGuard(window, onBack);
    expect(push).toHaveBeenCalledTimes(1);
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledTimes(2);
    off();
    window.dispatchEvent(new PopStateEvent('popstate'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});

describe('installFocusGuard', () => {
  it('shows the overlay only while the page has lost focus', () => {
    const guard = installFocusGuard({ doc: document, win: window, intervalMs: 100000 });
    vi.spyOn(document, 'hasFocus').mockReturnValue(false);
    guard.check();
    expect(guard.visible()).toBe(true);
    document.hasFocus.mockReturnValue(true);
    guard.check();
    expect(guard.visible()).toBe(false);
    guard.destroy();
  });
  it('a press on the overlay hides it, refocuses and calls onRecover', () => {
    const onRecover = vi.fn();
    const focus = vi.spyOn(window, 'focus').mockImplementation(() => {});
    const guard = installFocusGuard({ doc: document, win: window, intervalMs: 100000, onRecover });
    vi.spyOn(document, 'hasFocus').mockReturnValue(false);
    guard.check();
    document.getElementById('focus-guard').dispatchEvent(new Event('pointerdown'));
    expect(guard.visible()).toBe(false);
    expect(focus).toHaveBeenCalled();
    expect(onRecover).toHaveBeenCalledTimes(1);
    guard.destroy();
    expect(document.getElementById('focus-guard')).toBeNull();
  });
});

describe('setCursorHidden', () => {
  it('adds one style element when on and removes it when off', () => {
    setCursorHidden(document, true);
    setCursorHidden(document, true);
    expect(document.querySelectorAll('#cursor-hide')).toHaveLength(1);
    expect(document.getElementById('cursor-hide').textContent).toContain('cursor: none');
    setCursorHidden(document, false);
    expect(document.getElementById('cursor-hide')).toBeNull();
  });
});

describe('setPointerLock / setFullscreen', () => {
  it('reports unsupported when the API is missing', async () => {
    expect(await setPointerLock(document, {}, true)).toBe('unsupported');
    expect(await setFullscreen(document, {}, true)).toBe('unsupported');
  });
  it('reports ok when the request resolves', async () => {
    expect(await setPointerLock(document, { requestPointerLock: () => Promise.resolve() }, true)).toBe('ok');
    expect(await setFullscreen(document, { requestFullscreen: () => undefined }, true)).toBe('ok');
  });
  it('reports the error name when the request fails, sync or async', async () => {
    const sync = { requestPointerLock: () => { const e = new Error('x'); e.name = 'NotAllowedError'; throw e; } };
    const asyncFail = { requestFullscreen: () => Promise.reject(Object.assign(new Error('y'), { name: 'TypeError' })) };
    expect(await setPointerLock(document, sync, true)).toBe('error: NotAllowedError');
    expect(await setFullscreen(document, asyncFail, true)).toBe('error: TypeError');
  });
});

describe('createEventBlocker', () => {
  it('prevents default for the given types only while on', () => {
    const blocker = createEventBlocker(window, ['keydown']);
    blocker.set(true);
    expect(blocker.on).toBe(true);
    const e1 = new KeyboardEvent('keydown', { cancelable: true, bubbles: true });
    document.body.dispatchEvent(e1);
    expect(e1.defaultPrevented).toBe(true);
    blocker.set(false);
    const e2 = new KeyboardEvent('keydown', { cancelable: true, bubbles: true });
    document.body.dispatchEvent(e2);
    expect(e2.defaultPrevented).toBe(false);
  });
});
