// One input session for the whole game: devices, who is player 1 and 2, and
// the TV guards. Created once at boot so joined players survive scene changes.

import { createDevices } from './devices.js';
import { createPlayers } from './players.js';
import { toIntent } from './intents.js';
import { installBackGuard, installFocusGuard, installIdleCursor } from './tvGuard.js';

export function createInputSession({ win, doc, maxPlayers = 2, devices, guards = true }) {
  const devs = devices ?? createDevices({ nav: win.navigator, target: win });
  const players = createPlayers(maxPlayers);
  const backListeners = new Set();
  let slots = [];
  let joining = true;

  const teardown = [];
  if (guards) {
    teardown.push(installBackGuard(win, () => backListeners.forEach((fn) => fn())));
    const focus = installFocusGuard({ doc, win });
    teardown.push(() => focus.destroy());
    const cursor = installIdleCursor({ doc, win });
    teardown.push(() => cursor.destroy());
  }

  return {
    // Call once per frame, before scenes read `slots`.
    update() {
      const states = devs.poll();
      // Joining is paused by scenes that don't want new players (e.g. menus).
      const view = joining ? states : states.map((s) => ({ ...s, buttons: { ...s.buttons, a: false } }));
      const bound = players.update(view);
      slots = bound.map(({ slot, deviceId }) => {
        const state = states.find((s) => s.id === deviceId) ?? null;
        return { slot, deviceId, state, intent: state ? toIntent(state) : null };
      });
      return slots;
    },
    get slots() {
      return slots;
    },
    get count() {
      return players.count;
    },
    setJoining(on) {
      joining = on;
    },
    reset() {
      players.reset();
      slots = [];
    },
    onBack(fn) {
      backListeners.add(fn);
      return () => backListeners.delete(fn);
    },
    destroy() {
      teardown.forEach((fn) => fn());
      devs.destroy();
    },
  };
}
