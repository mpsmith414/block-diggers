# Block Diggers — Milestone 1: Skeleton + Silk Cursor Diagnostics — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Phaser + Vite project, a tested input layer (gamepad + keyboard → per-player intents), and a controller-diagnostics page on GitHub Pages. the owner can open the page on the Fire TV Cube to learn exactly how Silk's cursor interferes, and whether a page-side fix removes it.

**Architecture:** Input logic lives in plain ES modules under `src/input/` with no Phaser imports, unit-tested with Vitest. Browser-only helpers (`tvGuard.js`) are tested under jsdom. The Phaser game (`index.html`) is a throwaway "move two coloured blocks" scene that proves input, rendering and scaling on the Cube. The diagnostics page (`diag.html`) is plain DOM, so it doesn't depend on Phaser. GitHub Actions tests, builds and deploys both pages to Pages.

**Tech Stack:** Node 24, npm, Vite 8, Phaser 3.90, Vitest 5, jsdom (tests only), GitHub Actions + GitHub Pages.

**Scope note:** This plan is only milestone 1 of the spec (`docs/superpowers/specs/2026-09-25-block-diggers-design.md`). Milestones 2–6 get their own plans after the Cube results are in, because those results decide the final input design.

## Global Constraints

- Vite `base` is `/block-diggers/`. Every path in HTML and code is relative (`./…`), never `/…`.
- Modules in `src/input/` other than `tvGuard.js` must not import Phaser or touch `window`/`document` at import time.
- Internal game resolution is 480×270, with `pixelArt: true`.
- Stick deadzone is 0.25, rescaled so the edge of the deadzone is 0 and full tilt is 1.
- Button map (standard gamepad indices): A=0, B=1, X=2, Y=3, LB=4, RB=5, Back/View=8, Start/Menu=9, D-pad up=12, down=13, left=14, right=15.
- Intents: `jump` = A or X; `home` = B; `bubble` = Y; `pause` = Start or Back.
- Keyboard map: arrows/WASD move, Space = A, H = B, B = Y, Escape = Start.
- The repo is public: no family names anywhere in code, docs or commit messages.
- Every commit message ends with a blank line and then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- All commands run from the repo root `C:/Users/Matt/Documents/_Code/Projects/block-diggers` in Git Bash.

## File Map

| File | Responsibility |
|---|---|
| `package.json`, `vite.config.js`, `.gitignore` | Project config, scripts, multi-page build, test config |
| `index.html`, `src/main.js` | Game page and Phaser boot |
| `src/scenes/InputTestScene.js` | Throwaway scene: join with A, move a block per player, pause on Back |
| `src/input/intents.js` | Pure: deadzone, device state → intent, hold timer, edge detector |
| `src/input/devices.js` | Gamepad API + keyboard → normalised `DeviceState[]` |
| `src/input/players.js` | Pure: which device is player 1 or 2 (join order) |
| `src/input/tvGuard.js` | Browser helpers: back guard, focus guard, cursor-suppression experiments |
| `diag.html`, `src/diag/diag.js`, `src/diag/diag.css` | Controller diagnostics page for the Cube |
| `tests/input/*.test.js` | Unit tests |
| `.github/workflows/deploy.yml` | Test, build, deploy to Pages |
| `README.md` | How to run, the URLs, how to run the Cube test, the Web App Tester fallback |
| `docs/silk-findings.md` | Results from the Cube (Task 9) |

### Shared shapes (used across tasks)

```js
// DeviceState — produced by devices.js, consumed by intents.js / players.js / diag.js
{
  id: 'pad0' | 'pad1' | … | 'keyboard',
  kind: 'pad' | 'keyboard',
  label: string,                       // gamepad.id or 'Keyboard'
  axes: { lx, ly, rx, ry },            // numbers in [-1, 1]; up is negative y
  buttons: { a, b, x, y, lb, rb, back, start, up, down, left, right }  // booleans
}

// Intent — produced by intents.toIntent
{ moveX, moveY, jump, bubble, home, pause }   // moveX/moveY numbers in [-1,1], rest booleans
```

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `vite.config.js`, `.gitignore`, `index.html`, `src/main.js`

**Interfaces:**
- Produces: `npm run dev`, `npm run build`, `npm test` scripts; `#game` div in `index.html`; Phaser boots from `src/main.js`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "block-diggers",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host",
    "build": "vite build",
    "preview": "vite preview --host",
    "test": "vitest run --passWithNoTests"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install phaser@3.90.0 && npm install -D vite@8 vitest@5 jsdom@30`
Expected: `added N packages`, and `package.json` now has `dependencies.phaser` and `devDependencies.vite/vitest/jsdom`.

- [ ] **Step 3: Create `vite.config.js`**

```js
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: '/block-diggers/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        diag: resolve(import.meta.dirname, 'diag.html'),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
```

`diag.html` doesn't exist until Task 7. Until then, create a stub so the build works:

```html
<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><title>Controller Check</title></head>
<body><p>Coming soon.</p></body></html>
```

Save that as `diag.html`.

- [ ] **Step 4: Create `.gitignore`**

```
node_modules/
dist/
*.log
.DS_Store
```

- [ ] **Step 5: Create `index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>Block Diggers</title>
  <style>
    html, body { margin: 0; height: 100%; background: #000; overflow: hidden; }
    #game { position: fixed; inset: 0; }
    #diag-link {
      position: fixed; top: 8px; right: 8px; z-index: 10;
      color: #fff; font: 16px system-ui, sans-serif; text-decoration: none;
      background: rgba(0, 0, 0, 0.55); padding: 6px 10px; border-radius: 6px;
    }
  </style>
</head>
<body>
  <div id="game"></div>
  <a id="diag-link" href="./diag.html">🎮 Controller check</a>
  <script type="module" src="./src/main.js"></script>
</body>
</html>
```

- [ ] **Step 6: Create `src/main.js` (placeholder scene, replaced in Task 6)**

```js
import Phaser from 'phaser';

class HelloScene extends Phaser.Scene {
  constructor() { super('Hello'); }
  create() {
    this.add.text(240, 135, 'Block Diggers', { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' })
      .setOrigin(0.5);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 480,
  height: 270,
  pixelArt: true,
  backgroundColor: '#1b1428',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { gamepad: false },
  scene: [HelloScene],
});
```

- [ ] **Step 7: Verify build and test scripts**

Run: `npm run build`
Expected: finishes with `✓ built in …` and creates `dist/index.html` and `dist/diag.html`.

Run: `npm test`
Expected: exits 0 with "No test files found" (allowed by `--passWithNoTests`).

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vite.config.js .gitignore index.html diag.html src/main.js
git commit -m "chore: scaffold Vite + Phaser project

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Intents (pure input mapping)

**Files:**
- Create: `src/input/intents.js`
- Test: `tests/input/intents.test.js`

**Interfaces:**
- Consumes: `DeviceState` shape (see Shared shapes).
- Produces:
  - `DEADZONE = 0.25`
  - `applyDeadzone(x: number, y: number, dz?: number) → { x, y }`
  - `toIntent(state: DeviceState) → Intent`
  - `createHoldTimer(durationMs: number) → { update(isDown: boolean, dtMs: number): boolean /* true once, on the frame the hold completes */, progress(): number /* 0..1 */ }`
  - `createEdge() → (isDown: boolean) => boolean /* true only on the frame it goes down */`

- [ ] **Step 1: Write the failing tests**

`tests/input/intents.test.js`:

```js
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
```

- [ ] **Step 2: Run the tests to make sure they fail**

Run: `npx vitest run tests/input/intents.test.js`
Expected: FAIL, "Failed to resolve import ../../src/input/intents.js".

- [ ] **Step 3: Implement `src/input/intents.js`**

```js
// Pure input mapping: device state in, intent out. No DOM, no Phaser.

export const DEADZONE = 0.25;

export function applyDeadzone(x, y, dz = DEADZONE) {
  const mag = Math.hypot(x, y);
  if (mag < dz) return { x: 0, y: 0 };
  const scaled = Math.min(1, (mag - dz) / (1 - dz));
  return { x: (x / mag) * scaled, y: (y / mag) * scaled };
}

export function toIntent(state) {
  const b = state.buttons;
  const stick = applyDeadzone(state.axes.lx, state.axes.ly);
  let moveX = stick.x;
  let moveY = stick.y;
  if (b.left) moveX = -1;
  else if (b.right) moveX = 1;
  if (b.up) moveY = -1;
  else if (b.down) moveY = 1;
  return {
    moveX: moveX || 0,
    moveY: moveY || 0,
    jump: !!(b.a || b.x),
    bubble: !!b.y,
    home: !!b.b,
    pause: !!(b.start || b.back),
  };
}

export function createHoldTimer(durationMs) {
  let held = 0;
  let fired = false;
  return {
    update(isDown, dtMs) {
      if (!isDown) {
        held = 0;
        fired = false;
        return false;
      }
      held += dtMs;
      if (!fired && held >= durationMs) {
        fired = true;
        return true;
      }
      return false;
    },
    progress() {
      return Math.min(1, held / durationMs);
    },
  };
}

export function createEdge() {
  let was = false;
  return (isDown) => {
    const pressed = isDown && !was;
    was = isDown;
    return pressed;
  };
}
```

(`moveX || 0` turns `-0` into `0` so that `toEqual` against `0` passes.)

- [ ] **Step 4: Run the tests to make sure they pass**

Run: `npx vitest run tests/input/intents.test.js`
Expected: PASS, 12 tests.

- [ ] **Step 5: Commit**

```bash
git add src/input/intents.js tests/input/intents.test.js
git commit -m "feat(input): pure intent mapping, deadzone, hold timer, edge detector

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Devices (gamepad + keyboard → DeviceState)

**Files:**
- Create: `src/input/devices.js`
- Test: `tests/input/devices.test.js`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `BUTTON_INDEX` — `{ a:0, b:1, x:2, y:3, lb:4, rb:5, back:8, start:9, up:12, down:13, left:14, right:15 }`
  - `readPad(gamepad) → DeviceState` (id `pad<index>`)
  - `KEYMAP` — lower-cased `KeyboardEvent.key` → button name
  - `createKeyboard(target: EventTarget) → { read(): DeviceState /* id 'keyboard' */, destroy(): void }`
  - `createDevices({ nav?, target? }) → { poll(): DeviceState[] /* pads first, keyboard last */, destroy(): void }`

- [ ] **Step 1: Write the failing tests**

`tests/input/devices.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { readPad, createKeyboard, createDevices, BUTTON_INDEX } from '../../src/input/devices.js';

const fakePad = (over = {}) => ({
  index: 0,
  id: 'Xbox Wireless Controller',
  mapping: 'standard',
  connected: true,
  axes: [0, 0, 0, 0],
  buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
  ...over,
});

const press = (pad, name) => { pad.buttons[BUTTON_INDEX[name]] = { pressed: true, value: 1 }; return pad; };

const keyEvent = (type, key) => Object.assign(new Event(type, { cancelable: true }), { key });

describe('readPad', () => {
  it('names the device by gamepad index', () => {
    expect(readPad(fakePad({ index: 1 })).id).toBe('pad1');
  });
  it('reads standard-mapping buttons', () => {
    const s = readPad(press(press(fakePad(), 'a'), 'up'));
    expect(s.buttons.a).toBe(true);
    expect(s.buttons.up).toBe(true);
    expect(s.buttons.b).toBe(false);
  });
  it('reads both sticks', () => {
    const s = readPad(fakePad({ axes: [0.5, -1, 0.25, 0.75] }));
    expect(s.axes).toEqual({ lx: 0.5, ly: -1, rx: 0.25, ry: 0.75 });
  });
  it('treats missing axes and buttons as neutral', () => {
    const s = readPad(fakePad({ axes: [], buttons: [] }));
    expect(s.axes).toEqual({ lx: 0, ly: 0, rx: 0, ry: 0 });
    expect(s.buttons.a).toBe(false);
  });
});

describe('createKeyboard', () => {
  it('holds mapped keys until released', () => {
    const target = new EventTarget();
    const kb = createKeyboard(target);
    target.dispatchEvent(keyEvent('keydown', 'ArrowLeft'));
    target.dispatchEvent(keyEvent('keydown', ' '));
    expect(kb.read().buttons).toMatchObject({ left: true, a: true });
    target.dispatchEvent(keyEvent('keyup', 'ArrowLeft'));
    expect(kb.read().buttons.left).toBe(false);
  });
  it('maps WASD, H, B and Escape case-insensitively', () => {
    const target = new EventTarget();
    const kb = createKeyboard(target);
    for (const k of ['W', 'a', 's', 'd', 'h', 'b', 'Escape']) target.dispatchEvent(keyEvent('keydown', k));
    expect(kb.read().buttons).toMatchObject({ up: true, left: true, down: true, right: true, b: true, y: true, start: true });
  });
  it('prevents default only for mapped keys', () => {
    const target = new EventTarget();
    createKeyboard(target);
    const mapped = keyEvent('keydown', 'ArrowUp');
    const unmapped = keyEvent('keydown', 'q');
    target.dispatchEvent(mapped);
    target.dispatchEvent(unmapped);
    expect(mapped.defaultPrevented).toBe(true);
    expect(unmapped.defaultPrevented).toBe(false);
  });
  it('releases everything on blur', () => {
    const target = new EventTarget();
    const kb = createKeyboard(target);
    target.dispatchEvent(keyEvent('keydown', 'ArrowRight'));
    target.dispatchEvent(new Event('blur'));
    expect(kb.read().buttons.right).toBe(false);
  });
  it('stops listening after destroy', () => {
    const target = new EventTarget();
    const kb = createKeyboard(target);
    kb.destroy();
    target.dispatchEvent(keyEvent('keydown', 'ArrowRight'));
    expect(kb.read().buttons.right).toBe(false);
  });
});

describe('createDevices', () => {
  it('returns connected pads then the keyboard', () => {
    const nav = { getGamepads: () => [null, fakePad({ index: 1 })] };
    const d = createDevices({ nav, target: new EventTarget() });
    expect(d.poll().map((s) => s.id)).toEqual(['pad1', 'keyboard']);
  });
  it('skips pads reporting connected: false', () => {
    const nav = { getGamepads: () => [fakePad({ connected: false })] };
    const d = createDevices({ nav, target: new EventTarget() });
    expect(d.poll().map((s) => s.id)).toEqual(['keyboard']);
  });
  it('survives a browser without the Gamepad API, or one that throws', () => {
    const none = createDevices({ nav: {}, target: new EventTarget() });
    const throws = createDevices({ nav: { getGamepads: () => { throw new Error('blocked'); } }, target: new EventTarget() });
    expect(none.poll().map((s) => s.id)).toEqual(['keyboard']);
    expect(throws.poll().map((s) => s.id)).toEqual(['keyboard']);
  });
});
```

- [ ] **Step 2: Run the tests to make sure they fail**

Run: `npx vitest run tests/input/devices.test.js`
Expected: FAIL, "Failed to resolve import ../../src/input/devices.js".

- [ ] **Step 3: Implement `src/input/devices.js`**

```js
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
  const nameOf = (e) => KEYMAP[String(e.key).toLowerCase()];
  const onDown = (e) => {
    const name = nameOf(e);
    if (!name) return;
    held.add(name);
    e.preventDefault();
  };
  const onUp = (e) => {
    const name = nameOf(e);
    if (name) held.delete(name);
  };
  const onBlur = () => held.clear();
  target.addEventListener('keydown', onDown);
  target.addEventListener('keyup', onUp);
  target.addEventListener('blur', onBlur);
  return {
    read() {
      const buttons = noButtons();
      for (const name of held) buttons[name] = true;
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
```

- [ ] **Step 4: Run the tests to make sure they pass**

Run: `npx vitest run tests/input/devices.test.js`
Expected: PASS, 12 tests.

- [ ] **Step 5: Commit**

```bash
git add src/input/devices.js tests/input/devices.test.js
git commit -m "feat(input): read gamepads and keyboard into DeviceState

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Players (join order)

**Files:**
- Create: `src/input/players.js`
- Test: `tests/input/players.test.js`

**Interfaces:**
- Consumes: `DeviceState[]` from `devices.poll()` (only `.id` and `.buttons.a` are read).
- Produces: `createPlayers(max = 2) → { update(states): Array<{ slot: number, deviceId: string, state: DeviceState | null }>, count: number /* getter */, reset(): void }`. `state` is `null` while that player's device is disconnected. The slot is kept.

- [ ] **Step 1: Write the failing tests**

`tests/input/players.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { createPlayers } from '../../src/input/players.js';

const st = (id, a = false) => ({ id, buttons: { a } });

describe('createPlayers', () => {
  it('has nobody until a device presses A', () => {
    const p = createPlayers();
    expect(p.update([st('pad0'), st('keyboard')])).toEqual([]);
    expect(p.count).toBe(0);
  });
  it('gives slots in the order devices press A', () => {
    const p = createPlayers();
    p.update([st('pad1', true), st('pad0')]);
    const slots = p.update([st('pad1'), st('pad0', true)]);
    expect(slots.map((s) => [s.slot, s.deviceId])).toEqual([[0, 'pad1'], [1, 'pad0']]);
  });
  it('never gives one device two slots', () => {
    const p = createPlayers();
    p.update([st('pad0', true)]);
    p.update([st('pad0', true)]);
    expect(p.count).toBe(1);
  });
  it('ignores a third device when full', () => {
    const p = createPlayers(2);
    p.update([st('pad0', true), st('pad1', true), st('keyboard', true)]);
    expect(p.count).toBe(2);
  });
  it('keeps the slot with a null state while disconnected, and restores it', () => {
    const p = createPlayers();
    p.update([st('pad0', true)]);
    expect(p.update([])[0]).toEqual({ slot: 0, deviceId: 'pad0', state: null });
    expect(p.update([st('pad0')])[0].state).not.toBeNull();
  });
  it('reset clears all slots', () => {
    const p = createPlayers();
    p.update([st('pad0', true)]);
    p.reset();
    expect(p.count).toBe(0);
  });
});
```

- [ ] **Step 2: Run the tests to make sure they fail**

Run: `npx vitest run tests/input/players.test.js`
Expected: FAIL, "Failed to resolve import ../../src/input/players.js".

- [ ] **Step 3: Implement `src/input/players.js`**

```js
// Which device is which player. First device to press A is player 1.

export function createPlayers(max = 2) {
  const slots = [];
  return {
    update(states) {
      for (const s of states) {
        if (s.buttons.a && !slots.includes(s.id) && slots.length < max) slots.push(s.id);
      }
      return slots.map((deviceId, slot) => ({
        slot,
        deviceId,
        state: states.find((s) => s.id === deviceId) ?? null,
      }));
    },
    get count() {
      return slots.length;
    },
    reset() {
      slots.length = 0;
    },
  };
}
```

- [ ] **Step 4: Run the tests to make sure they pass**

Run: `npx vitest run tests/input/players.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/input/players.js tests/input/players.test.js
git commit -m "feat(input): join order for up to two players

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: TV guard (back, focus, cursor-suppression experiments)

**Files:**
- Create: `src/input/tvGuard.js`
- Test: `tests/input/tvGuard.test.js` (jsdom)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `installBackGuard(win, onBack: () => void) → () => void /* uninstall */`. Pushes a spare history entry. Every `popstate` re-pushes it and calls `onBack`.
  - `installFocusGuard({ doc, win, intervalMs = 500, onRecover = () => {} }) → { check(): void, visible(): boolean, destroy(): void }`. Shows a full-screen 🎮 overlay (`#focus-guard`) while `doc.hasFocus()` is false. A `pointerdown` on it hides it, calls `win.focus()` and then `onRecover()`.
  - `setCursorHidden(doc, on: boolean) → boolean`. Adds or removes `<style id="cursor-hide">` that sets `cursor: none !important` on everything.
  - `setPointerLock(doc, el, on: boolean) → Promise<'ok' | 'unsupported' | string /* 'error: <name>' */>`
  - `setFullscreen(doc, el, on: boolean) → Promise<'ok' | 'unsupported' | string>`
  - `createEventBlocker(win, types: string[]) → { set(on: boolean): boolean, on: boolean /* getter */ }`. While on, a capturing listener calls `preventDefault()` and `stopPropagation()` for those event types.

- [ ] **Step 1: Write the failing tests**

`tests/input/tvGuard.test.js`:

```js
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
```

- [ ] **Step 2: Run the tests to make sure they fail**

Run: `npx vitest run tests/input/tvGuard.test.js`
Expected: FAIL, "Failed to resolve import ../../src/input/tvGuard.js".

- [ ] **Step 3: Implement `src/input/tvGuard.js`**

```js
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
```

- [ ] **Step 4: Run the tests to make sure they pass**

Run: `npx vitest run tests/input/tvGuard.test.js`
Expected: PASS, 8 tests.

- [ ] **Step 5: Run the whole suite**

Run: `npm test`
Expected: PASS, 38 tests in 4 files.

- [ ] **Step 6: Commit**

```bash
git add src/input/tvGuard.js tests/input/tvGuard.test.js
git commit -m "feat(input): TV guards and cursor-suppression experiments

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Input test scene (the Phaser page)

**Files:**
- Create: `src/scenes/InputTestScene.js`
- Modify: `src/main.js` (replace the whole file)

**Interfaces:**
- Consumes: `createDevices` (Task 3), `createPlayers` (Task 4), `toIntent`, `createEdge` (Task 2), `installBackGuard`, `installFocusGuard` (Task 5).
- Produces: `InputTestScene` (Phaser scene key `'InputTest'`). It's throwaway and gets replaced in milestone 2.

- [ ] **Step 1: Create `src/scenes/InputTestScene.js`**

```js
import Phaser from 'phaser';
import { createDevices } from '../input/devices.js';
import { createPlayers } from '../input/players.js';
import { toIntent, createEdge } from '../input/intents.js';
import { installBackGuard, installFocusGuard } from '../input/tvGuard.js';

// Throwaway milestone-1 scene: press A to join, move a coloured block.
// Proves input, scaling and frame rate on the Fire TV Cube.

const COLORS = [0x4aa3ff, 0xffa94a];
const SPEED = 120; // game pixels per second at full tilt

export class InputTestScene extends Phaser.Scene {
  constructor() {
    super('InputTest');
  }

  create() {
    this.devices = createDevices();
    this.players = createPlayers(2);
    this.avatars = [];
    this.pauseEdges = [createEdge(), createEdge()];
    this.paused = false;

    this.prompt = this.add
      .text(240, 135, 'Press A', { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' })
      .setOrigin(0.5);
    this.pausedText = this.add
      .text(240, 40, 'PAUSED', { fontFamily: 'monospace', fontSize: '20px', color: '#ffe066' })
      .setOrigin(0.5)
      .setVisible(false);
    this.fpsText = this.add.text(4, 256, '', { fontFamily: 'monospace', fontSize: '10px', color: '#8a80a0' });

    const removeBack = installBackGuard(window, () => this.togglePause());
    const guard = installFocusGuard({ doc: document, win: window });
    this.events.once('shutdown', () => {
      removeBack();
      guard.destroy();
      this.devices.destroy();
    });
  }

  togglePause() {
    this.paused = !this.paused;
    this.pausedText.setVisible(this.paused);
  }

  update(_time, dtMs) {
    const slots = this.players.update(this.devices.poll());
    for (const { slot, state } of slots) {
      if (!this.avatars[slot]) {
        this.avatars[slot] = this.add.rectangle(200 + slot * 80, 135, 16, 16, COLORS[slot]);
      }
      if (!state) continue;
      const intent = toIntent(state);
      if (this.pauseEdges[slot](intent.pause)) this.togglePause();
      if (this.paused) continue;
      const a = this.avatars[slot];
      a.x = Phaser.Math.Clamp(a.x + (intent.moveX * SPEED * dtMs) / 1000, 8, 472);
      a.y = Phaser.Math.Clamp(a.y + (intent.moveY * SPEED * dtMs) / 1000, 8, 262);
      a.setScale(intent.jump ? 1.4 : 1);
    }
    this.prompt.setVisible(this.players.count < 2);
    this.prompt.setText(this.players.count === 0 ? 'Press A' : 'Player 2: press A');
    this.fpsText.setText(`${Math.round(this.game.loop.actualFps)} fps`);
  }
}
```

- [ ] **Step 2: Replace `src/main.js`**

```js
import Phaser from 'phaser';
import { InputTestScene } from './scenes/InputTestScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 480,
  height: 270,
  pixelArt: true,
  backgroundColor: '#1b1428',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { gamepad: false },
  scene: [InputTestScene],
});
```

- [ ] **Step 3: Check it in a browser**

Run `npm run dev` in the background and open `http://localhost:5173/block-diggers/` in the browser pane.
- You should see "Press A" on a dark purple background, scaled to fill the pane with letterboxing.
- Press Space: a blue block appears. Arrow keys move it. Escape shows PAUSED, and Escape again hides it.
- The bottom-left shows about 60 fps.
- There are no errors in the console (check with the read_console_messages tool).

- [ ] **Step 4: Build, then commit**

Run: `npm run build && npm test`
Expected: the build succeeds and 38 tests pass.

```bash
git add src/scenes/InputTestScene.js src/main.js
git commit -m "feat: throwaway input test scene — join with A, move a block

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Controller diagnostics page

**Files:**
- Modify: `diag.html` (replace the stub from Task 1)
- Create: `src/diag/diag.js`, `src/diag/diag.css`

**Interfaces:**
- Consumes: `readPad`, `BUTTON_INDEX` (Task 3), `applyDeadzone`, `createEdge` (Task 2), `installBackGuard`, `setCursorHidden`, `setPointerLock`, `setFullscreen`, `createEventBlocker` (Task 5).
- Produces: `/block-diggers/diag.html`, which measures what Silk does with each input and lets you toggle each suppression experiment.

**What the page shows:**

1. **Status chips:** page focus, controller count, cursor (pointer) events per second, key events per second, pointer lock state, fullscreen state, Back presses.
2. **Arena:** three dots, **L** moved by the left stick, **R** by the right stick, and **D** by the D-pad, plus a white ring where the page last saw the cursor. This makes "the stick moves the dot and/or the cursor" visible from the couch.
3. **"What each input does" table.** For each of left stick, right stick and D-pad, it counts frames where the input reached the game, cursor events that happened while it was held, and key events while it was held. It then gives a verdict:
   - ✅ clean
   - ⚠️ also moves cursor
   - ⚠️ also sends keys
   - ❌ never reaches game
   - — not tried
4. **Cursor fixes:** five toggles.
   - Controls: LB/RB select a toggle, Y flips it; you can also click a toggle, or press keys 1–5.
   - Pointer lock and Fullscreen need a user gesture. If flipping one fails, it becomes *armed*, and the next click or key press anywhere on the page retries it.
   - X resets the counts, so each toggle can be measured cleanly.
5. **Controllers:** per pad, the id, the mapping, axis values, which named buttons are lit, and the raw pressed indices (to catch a non-standard mapping).
6. **Last keys:** the last 8 `keydown` events, with key, code and keyCode.

- [ ] **Step 1: Replace `diag.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Block Diggers · Controller Check</title>
</head>
<body>
  <main id="app"></main>
  <script type="module" src="./src/diag/diag.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `src/diag/diag.css`**

```css
html, body { margin: 0; background: #141020; color: #f3efe6; font: 20px/1.4 system-ui, sans-serif; }
main { max-width: 1100px; margin: 0 auto; padding: 16px; }
h1 { font-size: 28px; margin: 0 0 12px; }
h2 { font-size: 20px; margin: 20px 0 8px; color: #c9b8ff; }
.stats { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { padding: 4px 10px; border-radius: 999px; background: #2a2140; }
.chip.good { background: #1f4d2b; }
.chip.bad { background: #5c1f24; }
.arena { display: block; width: 100%; max-width: 960px; aspect-ratio: 8 / 3; background: #221a33; border-radius: 8px; margin-top: 12px; }
table.verdict { border-collapse: collapse; width: 100%; max-width: 960px; }
table.verdict th, table.verdict td { border-bottom: 1px solid #332a4a; padding: 6px 10px; text-align: left; }
.toggles { display: flex; flex-wrap: wrap; gap: 10px; }
.toggle { font: inherit; color: inherit; background: #2a2140; border: 3px solid transparent; border-radius: 10px; padding: 10px 14px; cursor: pointer; min-width: 180px; text-align: left; }
.toggle.on { background: #1f4d2b; }
.toggle.selected { border-color: #ffe066; }
.toggle small { display: block; opacity: 0.75; font-size: 15px; }
.pads pre, .keylog { background: #1b1528; border-radius: 8px; padding: 10px; font: 16px/1.4 ui-monospace, monospace; white-space: pre-wrap; }
.keylog { list-style: none; margin: 0; }
button.reset { font: inherit; margin-left: 8px; }
```

- [ ] **Step 3: Create `src/diag/diag.js`**

```js
import './diag.css';
import { readPad, BUTTON_INDEX } from '../input/devices.js';
import { applyDeadzone, createEdge } from '../input/intents.js';
import {
  installBackGuard, setCursorHidden, setPointerLock, setFullscreen, createEventBlocker,
} from '../input/tvGuard.js';

// Controller diagnostics for the Fire TV Cube's Silk browser.
// Answers: which inputs reach the page, which ones drive Silk's cursor,
// and whether any page-side trick switches the cursor off.

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const setHTML = (node, html) => { if (node.innerHTML !== html) node.innerHTML = html; };

// ---------- layout ----------
const app = document.getElementById('app');
const statsBox = el('div', 'stats');
const arena = el('canvas', 'arena');
arena.width = 640;
arena.height = 240;
const table = el('table', 'verdict');
const resetBtn = el('button', 'reset', 'Reset counts (X)');
const tableHeading = el('h2', null, 'What each input does ');
tableHeading.append(resetBtn);
const togglesBox = el('div', 'toggles');
const padsBox = el('div', 'pads');
const keyLogBox = el('ol', 'keylog');
app.append(
  el('h1', null, 'Block Diggers · Controller Check'),
  statsBox, arena,
  tableHeading, table,
  el('h2', null, 'Cursor fixes: LB/RB pick · Y flips · or click · or keys 1–5'), togglesBox,
  el('h2', null, 'Controllers'), padsBox,
  el('h2', null, 'Last keys'), keyLogBox,
);

// ---------- measurements ----------
const INPUTS = ['leftStick', 'rightStick', 'dpad'];
const LABEL = { leftStick: 'Left stick', rightStick: 'Right stick', dpad: 'D-pad' };
const blankSeen = () => Object.fromEntries(INPUTS.map((k) => [k, { game: 0, pointer: 0, keys: 0 }]));
let seen = blankSeen();
let active = { leftStick: false, rightStick: false, dpad: false };
let lastPointer = null;
let backCount = 0;
const keyLog = [];
const rate = { pointer: 0, keys: 0 };
const windowCount = { pointer: 0, keys: 0 };
let windowStart = performance.now();

// Registered before any blocker so these always see the events.
window.addEventListener('pointermove', (e) => {
  windowCount.pointer++;
  lastPointer = { x: e.clientX, y: e.clientY };
  for (const k of INPUTS) if (active[k]) seen[k].pointer++;
}, { capture: true });

window.addEventListener('keydown', (e) => {
  windowCount.keys++;
  for (const k of INPUTS) if (active[k]) seen[k].keys++;
  keyLog.unshift(`${JSON.stringify(e.key)}  code=${e.code || '-'}  keyCode=${e.keyCode}`);
  keyLog.length = Math.min(keyLog.length, 8);
  const n = Number(e.key);
  if (n >= 1 && n <= TOGGLES.length) flip(n - 1);
  else fireArmed();
}, { capture: true });

window.addEventListener('pointerdown', (e) => {
  if (e.target.closest && e.target.closest('.toggle')) return; // the button's own click handles it
  fireArmed();
}, { capture: true });

installBackGuard(window, () => { backCount++; });
resetBtn.addEventListener('click', () => { seen = blankSeen(); });

// ---------- cursor-fix toggles ----------
const blockKeys = createEventBlocker(window, ['keydown', 'keyup']);
const blockPointer = createEventBlocker(window, ['pointermove', 'mousemove']);
const TOGGLES = [
  { name: 'Hide cursor (CSS)', on: false, result: '', apply: (on) => (setCursorHidden(document, on), 'ok') },
  { name: 'Pointer lock', on: false, result: '', gesture: true, apply: (on) => setPointerLock(document, arena, on) },
  { name: 'Fullscreen', on: false, result: '', gesture: true, apply: (on) => setFullscreen(document, document.documentElement, on) },
  { name: 'Block key defaults', on: false, result: '', apply: (on) => (blockKeys.set(on), 'ok') },
  { name: 'Block pointer moves', on: false, result: '', apply: (on) => (blockPointer.set(on), 'ok') },
];
let selected = 0;
let armed = null;

// apply() runs synchronously inside flip(), so a flip called from a click or
// keydown handler still counts as a user gesture for pointer lock / fullscreen.
async function flip(i) {
  const t = TOGGLES[i];
  const want = !t.on;
  const result = await t.apply(want);
  if (result === 'ok') {
    t.on = want;
    t.result = 'ok';
    if (armed === i) armed = null;
  } else if (t.gesture && want) {
    t.result = `${result} · armed: click or press any key`;
    armed = i;
  } else {
    t.result = result;
  }
  renderToggles();
}

function fireArmed() {
  if (armed == null) return;
  const i = armed;
  armed = null;
  flip(i);
}

const toggleButtons = TOGGLES.map((t, i) => {
  const b = el('button', 'toggle');
  b.addEventListener('click', () => flip(i));
  togglesBox.append(b);
  return b;
});

function renderToggles() {
  TOGGLES.forEach((t, i) => {
    const b = toggleButtons[i];
    b.className = `toggle${t.on ? ' on' : ''}${i === selected ? ' selected' : ''}`;
    setHTML(b, `${i + 1}. ${t.name}: <b>${t.on ? 'ON' : 'off'}</b><small>${t.result || '&nbsp;'}</small>`);
  });
}
renderToggles();

// ---------- per-frame ----------
const dots = {
  leftStick: { x: 110, y: 120, color: '#4aa3ff', tag: 'L' },
  rightStick: { x: 320, y: 120, color: '#ffa94a', tag: 'R' },
  dpad: { x: 530, y: 120, color: '#5fd35f', tag: 'D' },
};
const lbEdge = createEdge();
const rbEdge = createEdge();
const yEdge = createEdge();
const xEdge = createEdge();
const wrap = (v, max) => ((v % max) + max) % max;
let last = performance.now();

function move(k, v, dt, next) {
  if (v.x === 0 && v.y === 0) return;
  next[k] = true;
  seen[k].game++;
  const d = dots[k];
  d.x = wrap(d.x + v.x * 240 * dt, arena.width);
  d.y = wrap(d.y + v.y * 240 * dt, arena.height);
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (now - windowStart >= 1000) {
    rate.pointer = windowCount.pointer;
    rate.keys = windowCount.keys;
    windowCount.pointer = 0;
    windowCount.keys = 0;
    windowStart = now;
  }

  let pads = [];
  try { pads = Array.from(navigator.getGamepads ? navigator.getGamepads() : []).filter(Boolean); } catch { pads = []; }

  const next = { leftStick: false, rightStick: false, dpad: false };
  let lb = false; let rb = false; let y = false; let x = false;
  for (const gp of pads) {
    const s = readPad(gp);
    move('leftStick', applyDeadzone(s.axes.lx, s.axes.ly), dt, next);
    move('rightStick', applyDeadzone(s.axes.rx, s.axes.ry), dt, next);
    move('dpad', {
      x: (s.buttons.right ? 1 : 0) - (s.buttons.left ? 1 : 0),
      y: (s.buttons.down ? 1 : 0) - (s.buttons.up ? 1 : 0),
    }, dt, next);
    lb ||= s.buttons.lb; rb ||= s.buttons.rb; y ||= s.buttons.y; x ||= s.buttons.x;
  }
  active = next;

  if (lbEdge(lb)) { selected = (selected + TOGGLES.length - 1) % TOGGLES.length; renderToggles(); }
  if (rbEdge(rb)) { selected = (selected + 1) % TOGGLES.length; renderToggles(); }
  if (yEdge(y)) flip(selected);
  if (xEdge(x)) seen = blankSeen();

  renderStats(pads.length);
  renderTable();
  renderPads(pads);
  drawArena();
  requestAnimationFrame(frame);
}

function chip(label, value, good) {
  const cls = good === undefined ? 'chip' : `chip ${good ? 'good' : 'bad'}`;
  return `<span class="${cls}">${label}: <b>${value}</b></span>`;
}

function renderStats(padCount) {
  const focus = document.hasFocus();
  setHTML(statsBox, [
    chip('Page focus', focus ? 'yes' : 'NO', focus),
    chip('Controllers', padCount, padCount > 0),
    chip('Cursor events/s', rate.pointer, rate.pointer === 0),
    chip('Keys/s', rate.keys),
    chip('Pointer lock', document.pointerLockElement ? 'on' : 'off'),
    chip('Fullscreen', document.fullscreenElement ? 'on' : 'off'),
    chip('Back presses', backCount),
  ].join(''));
}

function verdict(s) {
  if (s.game === 0 && s.pointer === 0 && s.keys === 0) return '— not tried';
  if (s.game === 0) return '❌ never reaches game';
  if (s.pointer > 0) return '⚠️ also moves cursor';
  if (s.keys > 0) return '⚠️ also sends keys';
  return '✅ clean';
}

function renderTable() {
  const rows = INPUTS.map((k) => {
    const s = seen[k];
    return `<tr><td>${LABEL[k]}</td><td>${s.game}</td><td>${s.pointer}</td><td>${s.keys}</td><td>${verdict(s)}</td></tr>`;
  }).join('');
  setHTML(table, `<tr><th>Input</th><th>Game frames</th><th>Cursor events</th><th>Key events</th><th>Verdict</th></tr>${rows}`);
}

function renderPads(pads) {
  if (pads.length === 0) {
    setHTML(padsBox, '<pre>No controllers seen yet. Press a button on each controller.</pre>');
    return;
  }
  const html = pads.map((gp) => {
    const s = readPad(gp);
    const lit = Object.keys(BUTTON_INDEX).filter((k) => s.buttons[k]).join(' ') || '-';
    const raw = gp.buttons.map((b, i) => (b && b.pressed ? i : null)).filter((i) => i !== null).join(',') || '-';
    const axes = gp.axes.map((a) => a.toFixed(2)).join('  ');
    return `<pre>#${gp.index} ${gp.id}\nmapping: ${gp.mapping || '(none)'}  buttons: ${gp.buttons.length}  axes: ${gp.axes.length}\naxes: ${axes}\npressed: ${lit}   raw: ${raw}</pre>`;
  }).join('');
  setHTML(padsBox, html);
}

function drawArena() {
  const ctx = arena.getContext('2d');
  ctx.clearRect(0, 0, arena.width, arena.height);
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const d of Object.values(dots)) {
    ctx.fillStyle = d.color;
    ctx.beginPath();
    ctx.arc(d.x, d.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#141020';
    ctx.fillText(d.tag, d.x, d.y + 1);
  }
  if (lastPointer) {
    const r = arena.getBoundingClientRect();
    const px = ((lastPointer.x - r.left) / r.width) * arena.width;
    const py = ((lastPointer.y - r.top) / r.height) * arena.height;
    if (px >= 0 && px <= arena.width && py >= 0 && py <= arena.height) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py, 18, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

requestAnimationFrame(frame);
```

- [ ] **Step 4: Check it in a browser**

With `npm run dev` running, open `http://localhost:5173/block-diggers/diag.html` in the browser pane.
- The chips show "Controllers: 0" (red) and "Page focus: yes" (green).
- Moving the mouse over the page raises "Cursor events/s" above 0, and a white ring follows the mouse inside the arena.
- Press `1`: toggle 1 turns ON (green), and the mouse cursor disappears over the page. Press `1` again to turn it off.
- Press `3`: Fullscreen either turns ON, or shows `error: …` and then "armed". A second key press retries it.
- The "Last keys" list shows each key you press.
- The table shows "— not tried" for all three rows (there's no gamepad in the pane).
- There are no console errors (check with read_console_messages).

- [ ] **Step 5: Build, then commit**

Run: `npm run build && npm test`
Expected: the build succeeds (`dist/diag.html` exists) and 38 tests pass.

```bash
git add diag.html src/diag/diag.js src/diag/diag.css
git commit -m "feat: controller diagnostics page for the Fire TV Silk cursor

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Deploy to GitHub Pages + README

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`

**Interfaces:**
- Consumes: `npm test` and `npm run build` from Task 1.
- Produces: the live URLs `https://mpsmith414.github.io/block-diggers/` and `https://mpsmith414.github.io/block-diggers/diag.html`.

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v4
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Create `README.md`**

````markdown
# Block Diggers

A co-op, side-view, blocky mining game for a grown-up and a young kid. Dig for ores,
ride home, build up your camp. Plays in a web browser with Xbox controllers,
a keyboard, or (single-player) a phone.

**Play:** https://mpsmith414.github.io/block-diggers/
**Controller check:** https://mpsmith414.github.io/block-diggers/diag.html

Design: `docs/superpowers/specs/2026-09-25-block-diggers-design.md`

## Develop

```bash
npm install
npm run dev      # http://localhost:5173/block-diggers/
npm test
npm run build    # outputs dist/
```

Pushing to `main` runs the tests, builds, and deploys to GitHub Pages.

## Controller check on the Fire TV Cube

1. Pair both Xbox controllers with the Fire TV (Settings → Controllers & Bluetooth Devices).
2. Open Silk and go to the controller check URL above.
3. Press a button on each controller until "Controllers: 2" goes green.
4. Hold the **left stick** in circles for about 3 seconds. Then do the same with the **right stick**, then the **D-pad**.
5. Take a photo of the "What each input does" table.
6. For each cursor fix (LB/RB to pick, Y to flip; if it says "armed", press A once more):
   press **X** to reset the counts, turn the fix on, repeat step 4, and take a photo.
   Also note whether the on-screen cursor is still visible.
7. Turn each fix back off before trying the next one.

## Fallback: skip Silk with Web App Tester

If no in-page fix gets rid of the cursor, Amazon's free **Web App Tester** app
(Fire TV Appstore) opens a URL full-screen in Amazon WebView, without Silk's
browser chrome or cursor:

1. Install "Web App Tester" from the Appstore on the Fire TV.
2. Open it → **Hosted Apps** tab → enter the Play URL → **Test App**.
3. Repeat the controller check the same way, using the controller check URL.
````

- [ ] **Step 3: Enable Pages with GitHub Actions as the source (before pushing, so the first deploy works)**

Run: `gh api -X POST repos/mpsmith414/block-diggers/pages -f build_type=workflow`
Expected: JSON containing `"build_type": "workflow"`. If it answers `409` (Pages already exists), run `gh api -X PUT repos/mpsmith414/block-diggers/pages -f build_type=workflow` instead.

- [ ] **Step 4: Commit, push, and watch the deploy**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "ci: test, build and deploy to GitHub Pages; README

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```

Run: `gh run list --workflow deploy.yml --limit 1 --json databaseId,status -q '.[0]'`
Expected: one run, status `queued` or `in_progress`. If the list is empty, the run hasn't registered yet, so run the command again.

Run: `gh run watch --exit-status <databaseId from above>`
Expected: both the build and deploy jobs finish with ✓.

- [ ] **Step 5: Verify live**

Run: `curl -s -o /dev/null -w "%{http_code}\n" https://mpsmith414.github.io/block-diggers/ && curl -s -o /dev/null -w "%{http_code}\n" https://mpsmith414.github.io/block-diggers/diag.html`
Expected: `200` and `200`.

Open both URLs in the browser pane. The game shows "Press A", and the diag page renders with no console errors (this proves the `/block-diggers/` base path is right).

---

### Task 9: Cube test (owner, on the TV) and record the findings

**Files:**
- Create: `docs/silk-findings.md`

This task is a checkpoint with the owner, not coding. Nothing in milestone 2 starts until it's done.

- [ ] **Step 1: Ask the owner to run the "Controller check on the Fire TV Cube" steps from the README.** Send both URLs and ask for with photos of the table and pads panel (baseline, then one per fix), plus whether the cursor was visible each time.

- [ ] **Step 2: Also ask the owner to try the game URL** (`/block-diggers/`) on the Cube with two controllers: both join, both blocks move, what the fps counter reads, and whether Back pauses instead of leaving.

- [ ] **Step 3: Record the results in `docs/silk-findings.md`**

Use this structure and fill every cell from the owner's photos and notes:

```markdown
# Fire TV Cube · Silk findings (YYYY-MM-DD)

Device: Fire TV Cube (gen ?), Silk version ?, 2× Xbox controller (model ?)

## Baseline (no fixes)
| Input | Game frames | Cursor events | Key events | Verdict | Cursor visible? |
|---|---|---|---|---|---|
| Left stick | | | | | |
| Right stick | | | | | |
| D-pad | | | | | |

Gamepad mapping reported: …   Raw button indices for A/B/X/Y: …

## With each fix
| Fix | Worked? (result text) | Left stick verdict | Cursor visible? | Notes |
|---|---|---|---|---|
| Hide cursor (CSS) | | | | |
| Pointer lock | | | | |
| Fullscreen | | | | |
| Block key defaults | | | | |
| Block pointer moves | | | | |

## Game page
Both joined: …  FPS: …  Back pauses: …

## Decision
Which fix (or combination, or Web App Tester fallback) goes into tvGuard for milestone 2, and why.
```

- [ ] **Step 4: Commit**

```bash
git add docs/silk-findings.md
git commit -m "docs: Fire TV Silk controller findings

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push
```
