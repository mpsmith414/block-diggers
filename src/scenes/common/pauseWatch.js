// Watches for pause presses (Start / View, or the browser Back button) and
// for a joined controller going missing, and opens the Pause scene over the
// current one.

import { createEdge } from '../../input/intents.js';

export function createPauseWatch(scene) {
  const session = scene.registry.get('input');
  const edges = [createEdge(), createEdge()];
  let lastAt = -Infinity;

  const open = (mode, missing = []) => {
    if (!scene.scene.isActive()) return;
    const now = scene.time.now;
    // one Back press can arrive as a browser Back *and* a pad button
    if (now - lastAt < 300) return;
    lastAt = now;
    scene.scene.pause();
    scene.scene.launch('Pause', { target: scene.sys.settings.key, mode, missing });
  };

  const offBack = session.onBack(() => open('pause'));
  // the phone's book button
  const onBook = () => {
    if (!scene.scene.isActive()) return;
    scene.scene.pause();
    scene.scene.launch('Book', { target: scene.sys.settings.key });
  };
  window.addEventListener('block-diggers:book', onBook);
  scene.events.once('shutdown', () => {
    offBack();
    window.removeEventListener('block-diggers:book', onBook);
  });

  return {
    // Returns true if the game was just paused (skip the rest of the frame).
    update() {
      const missing = session.slots.filter((s) => !s.intent).map((s) => s.slot);
      if (missing.length) {
        open('disconnect', missing);
        return true;
      }
      for (const s of session.slots) {
        if (edges[s.slot](!!s.intent.pause)) {
          open('pause');
          return true;
        }
      }
      return false;
    },
  };
}
