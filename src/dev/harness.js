// Dev-only helpers for driving the game from the browser console or an
// automated check: step frames deterministically, hold keys, save screenshots.

export function installHarness(game) {
  let t = performance.now();
  const h = {
    game,
    advance(ms) {
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
    scene(key) { return game.scene.getScene(key); },
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
