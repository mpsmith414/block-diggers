// Dev-only helpers for driving the game from the browser console or an
// automated check: step frames deterministically, hold keys, save screenshots.

export function installHarness(game) {
  let t = performance.now();
  // Phaser's tweens read Date.now(), so stepping frames faster than real time
  // would make tweens crawl. Drive Date.now from the same virtual clock.
  const realNow = Date.now.bind(Date);
  let clockOffset = realNow() - t;
  let virtual = false;
  Date.now = () => (virtual ? Math.floor(t + clockOffset) : realNow());
  // Virtual gamepads, merged into navigator.getGamepads().
  const fakePads = [];
  const realGet = navigator.getGamepads ? navigator.getGamepads.bind(navigator) : () => [];
  navigator.getGamepads = () => {
    const real = Array.from(realGet() || []);
    return [...real, ...fakePads.filter(Boolean)];
  };
  const NAMES = { a: 0, b: 1, x: 2, y: 3, lb: 4, rb: 5, back: 8, start: 9, up: 12, down: 13, left: 14, right: 15 };
  const h = {
    game,
    advance(ms) {
      if (!virtual) {
        virtual = true;
        t = Math.max(t, realNow() - clockOffset);
      }
      for (let i = 0; i < ms; i += 1000 / 60) {
        t += 1000 / 60;
        game.step(t, 1000 / 60);
      }
    },
    down(key) { window.dispatchEvent(new KeyboardEvent('keydown', { key })); },
    up(key) { window.dispatchEvent(new KeyboardEvent('keyup', { key })); },
    hold(key, ms) {
      h.down(key);
      h.advance(ms);
      h.up(key);
      h.advance(50);
    },
    tap(key) { h.hold(key, 50); },
    // pad(i, { a: true, lx: 1 }) sets virtual pad i's state (index 10 + i).
    pad(i, state = {}) {
      const buttons = Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }));
      for (const [k, v] of Object.entries(state)) if (k in NAMES && v) buttons[NAMES[k]] = { pressed: true, value: 1 };
      fakePads[i] = {
        index: 10 + i, id: `Virtual pad ${i}`, mapping: 'standard', connected: true,
        axes: [state.lx ?? 0, state.ly ?? 0, 0, 0], buttons,
      };
    },
    unpad(i) { fakePads[i] = null; },
    padHold(i, state, ms) {
      h.pad(i, state);
      h.advance(ms);
      h.pad(i, {});
      h.advance(50);
    },
    scene(key) { return game.scene.getScene(key); },
    // Join from the title, patch the save, then start a scene: h.quick('Mine', { planet: 'moon' }, { pets: [...] }).
    quick(key, data = {}, save = {}) {
      h.advance(1200);
      for (let i = 0; i < 4 && !game.scene.isActive('Camp'); i++) { h.tap(' '); h.advance(400); }
      const reg = game.registry;
      reg.set('save', { ...reg.get('save'), ...save });
      const from = game.scene.getScenes(true)[0];
      from.scene.start(key, data);
      h.advance(1500);
      return game.scene.getScenes(true).map((s) => s.sys.settings.key);
    },
    // Put player `slot` standing in cell (cx, cy) and snap the camera there.
    goCell(cx, cy, slot = 0) {
      const s = game.scene.getScene('Mine');
      const a = s.avatars[slot];
      a.p.x = cx * 16 + 2; a.p.y = (cy + 1) * 16 - 14; a.p.vx = 0; a.p.vy = 0;
      s.cam.x = cx * 16; s.cam.y = cy * 16;
      return a;
    },
    // Saves a crisp 3× upscale of the current frame to .shots/<name>.png.
    shot(name, scale = 3) {
      const src = game.canvas;
      const c = document.createElement('canvas');
      c.width = game.scale.width * scale;
      c.height = game.scale.height * scale;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(src, 0, 0, c.width, c.height);
      return fetch(`/__shot?name=${encodeURIComponent(name)}`, {
        method: 'POST', body: c.toDataURL('image/png'),
      }).then((r) => r.text());
    },
  };
  window.h = h;
  return h;
}
