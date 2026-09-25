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
  return () => win.removeEventListener('popstate', onPop);
}

export function installFocusGuard({ doc, win, intervalMs = 500, onRecover = () => {} }) {
  const overlay = doc.createElement('div');
  overlay.id = 'focus-guard';
  overlay.setAttribute('role', 'button');
  overlay.setAttribute('aria-label', 'Press any button to keep playing');
  overlay.textContent = '🎮';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:9999', 'display:none',
    'align-items:center', 'justify-content:center', 'font-size:30vmin',
    'background:rgba(10,6,20,.85)', 'cursor:pointer',
  ].join(';');
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
  if (!doc.fullscreenElement || !doc.exitFullscreen) return Promise.resolve('ok');
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
