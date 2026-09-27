# Block Diggers — Play on the TV via Sunshine + Moonlight — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Block Diggers" Moonlight tile that opens the live game in kiosk Chrome on the PC, and make the game page stream-friendly: hide an idle cursor and give the focus guard a recovery hint.

**Architecture:** A Windows `.cmd` launcher in `tools/sunshine/` starts Chrome in kiosk mode with a dedicated profile and blocks until Chrome exits, so Sunshine can track it and kill it when the stream ends. Game-side, `tvGuard.js` gains `installIdleCursor`, and the focus-guard overlay gains one line of hint text. Docs move streaming to the main TV path.

**Tech Stack:** Windows cmd, Chrome flags, Vitest 5 + jsdom, PowerShell `System.Drawing` (one-off, to draw the cover PNG).

**Spec:** `docs/superpowers/specs/2026-09-26-moonlight-streaming-design.md`

## Global Constraints

- Live Play URL: `https://mpsmith414.github.io/block-diggers/`
- Chrome profile dir: `%LOCALAPPDATA%\BlockDiggers\chrome-profile`
- Chrome flags: `--kiosk --user-data-dir=… --autoplay-policy=no-user-gesture-required --no-first-run --no-default-browser-check --hide-crash-restore-bubble`
- Idle cursor timeout: 2000 ms. The cursor starts hidden.
- Focus-guard hint text, exactly: `Controllers paused. Click the screen: hold Start for Moonlight's mouse mode.`
- The diag page does not install the idle cursor.
- The repo is public: no family names anywhere in code, docs or commit messages.
- Every commit message ends with a blank line and then `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File Map

| File | Responsibility |
|---|---|
| `src/input/tvGuard.js` | + `installIdleCursor`; focus-guard hint line |
| `tests/input/tvGuard.test.js` | tests for both |
| `src/scenes/InputTestScene.js` | installs the idle cursor |
| `tools/sunshine/block-diggers.cmd` | launcher |
| `tools/sunshine/block-diggers.png` | 600×800 tile art |
| `README.md`, `docs/superpowers/specs/2026-09-25-block-diggers-design.md` | docs |

---

### Task 1: Idle cursor

**Files:**
- Modify: `src/input/tvGuard.js` (add after `setCursorHidden`)
- Modify: `src/scenes/InputTestScene.js` (in `create()`)
- Test: `tests/input/tvGuard.test.js`

**Interfaces:**
- Consumes: `setCursorHidden(doc, on)` (existing).
- Produces: `installIdleCursor({ doc, win, idleMs = 2000 }) → { hidden(): boolean, destroy(): void }`.

- [ ] **Step 1: Write the failing test** (append to `tests/input/tvGuard.test.js`, and add `installIdleCursor` to the import)

```js
describe('installIdleCursor', () => {
  afterEach(() => vi.useRealTimers());

  it('starts hidden, shows on movement, hides again after idleMs', () => {
    vi.useFakeTimers();
    const c = installIdleCursor({ doc: document, win: window, idleMs: 2000 });
    expect(c.hidden()).toBe(true);
    expect(document.getElementById('cursor-hide')).not.toBeNull();
    window.dispatchEvent(new Event('pointermove'));
    expect(c.hidden()).toBe(false);
    vi.advanceTimersByTime(1999);
    expect(c.hidden()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(c.hidden()).toBe(true);
    c.destroy();
  });

  it('movement during the idle window restarts the timer', () => {
    vi.useFakeTimers();
    const c = installIdleCursor({ doc: document, win: window, idleMs: 2000 });
    window.dispatchEvent(new Event('pointermove'));
    vi.advanceTimersByTime(1500);
    window.dispatchEvent(new Event('pointerdown'));
    vi.advanceTimersByTime(1500);
    expect(c.hidden()).toBe(false);
    vi.advanceTimersByTime(500);
    expect(c.hidden()).toBe(true);
    c.destroy();
  });

  it('destroy removes listeners and shows the cursor', () => {
    vi.useFakeTimers();
    const c = installIdleCursor({ doc: document, win: window });
    c.destroy();
    expect(document.getElementById('cursor-hide')).toBeNull();
    window.dispatchEvent(new Event('pointermove'));
    vi.advanceTimersByTime(5000);
    expect(document.getElementById('cursor-hide')).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/input/tvGuard.test.js`
Expected: FAIL, `installIdleCursor is not a function`.

- [ ] **Step 3: Implement** (in `src/input/tvGuard.js`, after `setCursorHidden`)

```js
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
```

- [ ] **Step 4: Wire into the game.** In `src/scenes/InputTestScene.js`, import `installIdleCursor` alongside the other guards, and in `create()`:

```js
    const cursor = installIdleCursor({ doc: document, win: window });
```
and inside the `shutdown` handler add `cursor.destroy();`.

- [ ] **Step 5: Run all tests** — `npm test` → all pass.

- [ ] **Step 6: Commit** — `git commit -m "feat(input): hide an idle cursor so it doesn't sit on the streamed TV picture"`

### Task 2: Focus-guard hint

**Files:**
- Modify: `src/input/tvGuard.js` (`installFocusGuard`)
- Test: `tests/input/tvGuard.test.js`

**Interfaces:** `installFocusGuard` signature unchanged. Overlay gets a child `<div class="hint">`, and the emoji moves into a child `<div>`.

- [ ] **Step 1: Failing test** (inside `describe('installFocusGuard')`)

```js
  it('tells the grown-up how to click back in when streaming', () => {
    const guard = installFocusGuard({ doc: document, win: window, intervalMs: 100000 });
    const overlay = document.getElementById('focus-guard');
    expect(overlay.textContent).toContain('🎮');
    expect(overlay.querySelector('.hint').textContent).toBe(
      "Controllers paused. Click the screen: hold Start for Moonlight's mouse mode.",
    );
    guard.destroy();
  });
```

- [ ] **Step 2: Run, expect FAIL** (`.hint` is null).

- [ ] **Step 3: Implement.** Replace `overlay.textContent = '🎮';` and the `cssText` with:

```js
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:9999', 'display:none',
    'flex-direction:column', 'align-items:center', 'justify-content:center',
    'background:rgba(10,6,20,.85)', 'cursor:pointer', 'color:#fff',
  ].join(';');
  const icon = doc.createElement('div');
  icon.textContent = '🎮';
  icon.style.fontSize = '30vmin';
  const hint = doc.createElement('div');
  hint.className = 'hint';
  hint.textContent = "Controllers paused. Click the screen: hold Start for Moonlight's mouse mode.";
  hint.style.cssText = 'font:2.2vmin system-ui,sans-serif;opacity:.75;margin-top:2vmin';
  overlay.append(icon, hint);
```

- [ ] **Step 4: `npm test`** → pass. **Step 5: Commit** — `feat(input): focus guard explains how to click back in over Moonlight`

### Task 3: Launcher, tile art, docs

**Files:**
- Create: `tools/sunshine/block-diggers.cmd`, `tools/sunshine/block-diggers.png`
- Modify: `README.md`, `docs/superpowers/specs/2026-09-25-block-diggers-design.md`

- [ ] **Step 1: Launcher** — `tools/sunshine/block-diggers.cmd` (CRLF line endings):

```bat
@echo off
rem Block Diggers launcher for a Sunshine application tile.
rem Starts Chrome full-screen on the game and waits for it, so Sunshine can
rem close it when the Moonlight stream ends. Optional arg: a URL to open instead.
setlocal
set "URL=%~1"
if "%URL%"=="" set "URL=https://mpsmith414.github.io/block-diggers/"

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" (
  echo Block Diggers: Chrome not found. Install Google Chrome.
  exit /b 1
)

rem Its own profile = its own Chrome process (otherwise the URL is handed to an
rem already-open Chrome and this script exits at once). Saves live here too.
"%CHROME%" --kiosk --user-data-dir="%LOCALAPPDATA%\BlockDiggers\chrome-profile" ^
  --autoplay-policy=no-user-gesture-required --no-first-run ^
  --no-default-browser-check --hide-crash-restore-bubble "%URL%"
```

Add `*.cmd text eol=crlf` to a new `.gitattributes`.

- [ ] **Step 2: Smoke test the launcher** — run `cmd //c "tools\\sunshine\\block-diggers.cmd about:blank"` in the background, confirm a `chrome.exe` process with `BlockDiggers` in its command line appears, then stop it (`Stop-Process` on those PIDs only) and confirm the script exited.

- [ ] **Step 3: Tile art** — draw a 600×800 PNG with PowerShell `System.Drawing` (dark background, grid of dirt/stone blocks with a few ore specks, a pickaxe, "BLOCK DIGGERS" title) to `tools/sunshine/block-diggers.png`. View it to check.

- [ ] **Step 4: README** — new "Play on the TV (Sunshine + Moonlight)" section right after **Play**, with: one-time setup (ViGEmBus, Sunshine web UI → Applications → Add New with the field table from the spec), how to play, how to run the controller check (a second tile whose command passes `https://mpsmith414.github.io/block-diggers/diag.html`). Move "Controller check on the Fire TV Cube", "What we learned in Silk" and "Fallback: skip Silk" under a `## Fire TV Silk (best-effort)` heading.

- [ ] **Step 5: Main spec edits** — Summary main target → Cube via Moonlight streaming from a PC, Silk best-effort; add a "(best-effort — see the streaming spec)" note to the two Silk sections; performance budget → 60 fps in PC Chrome; hands-on checklist → "Fire TV Cube via Moonlight with 2 Xbox controllers".

- [ ] **Step 6: `npm test && npm run build`** → pass. **Commit** — `feat(tools): Sunshine launcher tile for playing over Moonlight; docs`
