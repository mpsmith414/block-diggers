// Browser helpers for TV browsers (Fire TV Silk especially).
// Silk draws a mouse cursor that the stick drives around. These helpers either
// work around it (back guard, focus guard) or try to switch it off (the
// experiments at the bottom, toggled from diag.html).

export function installBackGuard(win, onBack) {
  const push = () => win.history.pushState({ blockDiggers: true }, '');
  push();
  const onPop = () => {
    push();
    onBack();
  };
  win.addEventListener('popstate', onPop);

  // Chromium can drop history entries pushed before any user activation, so
  // Back might still leave the page until the first click/keypress. Re-push
  // once activation happens, then stop listening.
  const onActivate = () => {
    push();
    win.removeEventListener('pointerdown', onActivate, true);
    win.removeEventListener('keydown', onActivate, true);
  };
  win.addEventListener('pointerdown', onActivate, true);
  win.addEventListener('keydown', onActivate, true);

  return () => {
    win.removeEventListener('popstate', onPop);
    win.removeEventListener('pointerdown', onActivate, true);
    win.removeEventListener('keydown', onActivate, true);
  };
}

export function installFocusGuard({ doc, win, intervalMs = 500, onRecover = () => {} }) {
  const overlay = doc.createElement('div');
  overlay.id = 'focus-guard';
  overlay.setAttribute('role', 'button');
  overlay.setAttribute('aria-label', 'Press any button to keep playing');
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:9999', 'display:none',
    'flex-direction:column', 'align-items:center', 'justify-content:center',
    'background:rgba(10,6,20,.85)', 'cursor:pointer', 'color:#fff',
  ].join(';');
  const icon = doc.createElement('div');
  icon.textContent = '🎮';
  icon.style.fontSize = '30vmin';
  // For the grown-up: over Moonlight there's no Silk cursor to click with.
  const hint = doc.createElement('div');
  hint.className = 'hint';
  hint.textContent = "Controllers paused. Click the screen: hold Start for Moonlight's mouse mode.";
  hint.style.cssText = 'font:2.2vmin system-ui,sans-serif;opacity:.75;margin-top:2vmin';
  overlay.append(icon, hint);
  doc.body.appendChild(overlay);

  const show = () => { overlay.style.display = 'flex'; };
  const hide = () => { overlay.style.display = 'none'; };
  const onPress = () => {
    hide();
    win.focus();
    onRecover();
  };
  overlay.addEventListener('pointerdown', onPress);

  const check = () => (doc.hasFocus() ? hide() : show());
  const timer = win.setInterval(check, intervalMs);

  return {
    check,
    visible: () => overlay.style.display !== 'none',
    destroy() {
      win.clearInterval(timer);
      overlay.removeEventListener('pointerdown', onPress);
      overlay.remove();
    },
  };
}

// ---- cursor-suppression experiments ----

export function setCursorHidden(doc, on) {
  let style = doc.getElementById('cursor-hide');
  if (on && !style) {
    style = doc.createElement('style');
    style.id = 'cursor-hide';
    style.textContent = '*, *::before, *::after { cursor: none !important; }';
    doc.head.appendChild(style);
  }
  if (!on && style) style.remove();
  return on;
}

// When streaming (Sunshine captures the PC cursor into the video) an unmoved
// mouse would sit in the middle of the TV. Hide it until the mouse moves,
// and again after idleMs of stillness.
export function installIdleCursor({ doc, win, idleMs = 2000 }) {
  let hidden = setCursorHidden(doc, true);
  let timer = null;
  const onMove = () => {
    if (hidden) hidden = setCursorHidden(doc, false);
    win.clearTimeout(timer);
    timer = win.setTimeout(() => { hidden = setCursorHidden(doc, true); }, idleMs);
  };
  win.addEventListener('pointermove', onMove, true);
  win.addEventListener('pointerdown', onMove, true);
  return {
    hidden: () => hidden,
    destroy() {
      win.clearTimeout(timer);
      win.removeEventListener('pointermove', onMove, true);
      win.removeEventListener('pointerdown', onMove, true);
      hidden = setCursorHidden(doc, false);
    },
  };
}

async function attempt(fn) {
  try {
    const r = fn();
    if (r && typeof r.then === 'function') await r;
    return 'ok';
  } catch (err) {
    return `error: ${(err && (err.name || err.message)) || err}`;
  }
}

export function setPointerLock(doc, el, on) {
  if (on) return el.requestPointerLock ? attempt(() => el.requestPointerLock()) : Promise.resolve('unsupported');
  return doc.exitPointerLock ? attempt(() => doc.exitPointerLock()) : Promise.resolve('unsupported');
}

export function setFullscreen(doc, el, on) {
  if (on) return el.requestFullscreen ? attempt(() => el.requestFullscreen()) : Promise.resolve('unsupported');
  if (!doc.fullscreenElement) return Promise.resolve('ok');
  if (!doc.exitFullscreen) return Promise.resolve('unsupported');
  return attempt(() => doc.exitFullscreen());
}

export function createEventBlocker(win, types) {
  const stop = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  let on = false;
  return {
    set(v) {
      if (v === on) return on;
      on = v;
      for (const t of types) {
        if (v) win.addEventListener(t, stop, { capture: true, passive: false });
        else win.removeEventListener(t, stop, { capture: true });
      }
      return on;
    },
    get on() {
      return on;
    },
  };
}
