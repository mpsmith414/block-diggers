// Reads raw devices (Gamepad API + keyboard) into DeviceState snapshots.
// We poll navigator.getGamepads() ourselves instead of using Phaser's plugin
// so Fire TV quirks stay under our control.

export const BUTTON_INDEX = {
  a: 0, b: 1, x: 2, y: 3, lb: 4, rb: 5, back: 8, start: 9,
  up: 12, down: 13, left: 14, right: 15,
};

const noButtons = () => Object.fromEntries(Object.keys(BUTTON_INDEX).map((k) => [k, false]));
const noAxes = () => ({ lx: 0, ly: 0, rx: 0, ry: 0 });

export function readPad(gp) {
  const buttons = noButtons();
  for (const [name, i] of Object.entries(BUTTON_INDEX)) {
    buttons[name] = !!(gp.buttons[i] && gp.buttons[i].pressed);
  }
  const ax = (i) => gp.axes[i] ?? 0;
  return {
    id: `pad${gp.index}`,
    kind: 'pad',
    label: gp.id,
    axes: { lx: ax(0), ly: ax(1), rx: ax(2), ry: ax(3) },
    buttons,
  };
}

export const KEYMAP = {
  arrowleft: 'left', a: 'left',
  arrowright: 'right', d: 'right',
  arrowup: 'up', w: 'up',
  arrowdown: 'down', s: 'down',
  ' ': 'a',
  h: 'b',
  b: 'y',
  escape: 'start',
};

export function createKeyboard(target) {
  const held = new Set();
  const keyOf = (e) => String(e.key).toLowerCase();
  const onDown = (e) => {
    const key = keyOf(e);
    if (!KEYMAP[key]) return;
    held.add(key);
    e.preventDefault();
  };
  const onUp = (e) => {
    const key = keyOf(e);
    if (KEYMAP[key]) held.delete(key);
  };
  const onBlur = () => held.clear();
  target.addEventListener('keydown', onDown);
  target.addEventListener('keyup', onUp);
  target.addEventListener('blur', onBlur);
  return {
    read() {
      const buttons = noButtons();
      for (const key of held) buttons[KEYMAP[key]] = true;
      return { id: 'keyboard', kind: 'keyboard', label: 'Keyboard', axes: noAxes(), buttons };
    },
    destroy() {
      target.removeEventListener('keydown', onDown);
      target.removeEventListener('keyup', onUp);
      target.removeEventListener('blur', onBlur);
    },
  };
}

export function createDevices({ nav = globalThis.navigator, target = globalThis.window } = {}) {
  const keyboard = target ? createKeyboard(target) : null;
  return {
    poll() {
      let pads = [];
      try {
        pads = nav && nav.getGamepads ? Array.from(nav.getGamepads()) : [];
      } catch {
        pads = [];
      }
      const states = pads.filter((gp) => gp && gp.connected !== false).map(readPad);
      if (keyboard) states.push(keyboard.read());
      return states;
    },
    destroy() {
      if (keyboard) keyboard.destroy();
    },
  };
}
