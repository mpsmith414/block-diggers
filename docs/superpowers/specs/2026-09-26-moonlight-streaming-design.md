# Block Diggers on the TV via Sunshine + Moonlight — Design

**Date:** 2026-09-26
**Status:** Approved in brainstorming, pending written-spec review
**Amends:** `2026-09-25-block-diggers-design.md` (TV target, Silk rules, performance budget, hands-on checklist)

## Summary

Play Block Diggers on the TV by streaming it from the PC. Sunshine already runs on the PC,
and Moonlight on the Fire TV Cube already streams Steam games with working controllers.
A new **"Block Diggers" tile in Moonlight's app list** opens the live GitHub Pages build in
a full-screen Chrome window on the PC. Moonlight shows the video on the TV and sends the
controllers back.

Sunshine turns each controller on the Cube into a virtual Xbox controller on the PC
(ViGEmBus). Chrome reads them through the normal Gamepad API, so Silk and its cursor are out of
the picture.

## Decisions

| Question | Choice |
|---|---|
| How the game is started | Its own tile in Moonlight (a Sunshine application). Not through Steam Big Picture, so Steam Input can't remap or double up the controllers. |
| Which copy of the game | The live site, `https://mpsmith414.github.io/block-diggers/`. It always runs whatever was last pushed to `main`. |
| What runs it | Chrome in kiosk mode with its own profile. Edge would also work; Electron is overkill. |
| Silk on the Cube | Best-effort. Streaming becomes the supported TV path. The Silk code that exists stays, but the cursor fix is no longer chased and Silk is no longer tested at every milestone. |

## 1. Launcher

New folder `tools/sunshine/`:

- **`block-diggers.cmd`** starts Chrome and waits for it to exit.
  - Finds `chrome.exe` in this order: `%ProgramFiles%`, `%ProgramFiles(x86)%`, `%LOCALAPPDATA%` (each `\Google\Chrome\Application\chrome.exe`). If none exists, it prints an error and exits with code 1.
  - URL: the first argument if one is given, otherwise the live Play URL. The argument lets a second tile open `diag.html` for the hands-on check.
  - Chrome flags:
    - `--kiosk`: full screen, no browser chrome.
    - `--user-data-dir="%LOCALAPPDATA%\BlockDiggers\chrome-profile"`: a separate Chrome instance. Without it, Chrome hands the URL to an already-running Chrome and exits at once, and Sunshine would think the game quit. Game saves live in this profile.
    - `--autoplay-policy=no-user-gesture-required`: Chrome doesn't count controller presses as a user gesture, so otherwise the game's sound (a later milestone) would never start.
    - `--no-first-run --no-default-browser-check --hide-crash-restore-bubble`: no prompts on the TV. Sunshine kills Chrome when the stream ends, so the next launch would otherwise offer to "restore pages".
  - It runs `chrome.exe` in the foreground (no `start`), so the script lives exactly as long as the Chrome browser process. When you end the stream, Sunshine terminates the script's process tree, which closes Chrome.
- **`block-diggers.png`**: 600×800 cover art for the tile (a pickaxe on a dirt-block pattern with the game name). It's generated once and committed; the generator isn't kept.

The tile is added by hand in Sunshine's web UI (`https://localhost:47990` → Applications → Add New). We don't edit `C:\Program Files\Sunshine\config\apps.json` directly. The README lists the exact fields:

| Field | Value |
|---|---|
| Application Name | Block Diggers |
| Command | full path to `tools\sunshine\block-diggers.cmd` |
| Working Directory | the `tools\sunshine` folder |
| Image | full path to `tools\sunshine\block-diggers.png` |
| Everything else | leave at Sunshine's defaults (the script stays alive while Chrome runs, so auto-detach never triggers) |

## 2. Game-side changes

### Idle cursor hiding

Sunshine captures the PC's mouse cursor into the stream, so without this a cursor would sit in the middle of the TV.

- New export in `src/input/tvGuard.js`: `installIdleCursor({ doc, win, idleMs = 2000 })`.
  - It hides the cursor (via the existing `setCursorHidden`) after `idleMs` with no `pointermove`/`pointerdown`.
  - Any pointer movement shows the cursor again and restarts the timer, so a real mouse, or Moonlight's mouse mode, still works.
  - The cursor starts hidden, because on the TV nobody moves the mouse.
  - It returns a `destroy()` that removes the listeners and the timer and shows the cursor.
- The game page (`InputTestScene`, and later the real scenes' shared setup) installs it next to the back and focus guards.
- `diag.html` does **not** install it. Its "Hide cursor (CSS)" toggle stays under manual control.

### Focus guard hint

If another window takes focus on the PC (a Steam or Windows notification), Chrome stops delivering gamepad data. Code in the page can't take OS focus back, and when streaming there's no Silk cursor to click the overlay with.

- The overlay keeps the big 🎮, and adds one small line of text for the grown-up: *"Controllers paused. Click the screen: hold Start for Moonlight's mouse mode."* The child-facing part stays icon-only.
- Recovery otherwise stays the same: a click on the overlay hides it and refocuses the window.
- The Moonlight gesture ("hold Start to toggle mouse mode") is checked during the hands-on test. If it's different on the Fire TV build of Moonlight, the text is corrected.

Everything else in `tvGuard.js` (back guard, cursor experiments) is unchanged.

## 3. Documentation

- **README**: a new "Play on the TV (Sunshine + Moonlight)" section near the top. It covers:
  - one-time setup: ViGEmBus is installed (it came with Sunshine if Steam games already see controllers), and the tile fields above;
  - how to play: Moonlight → PC → Block Diggers, and end the stream to quit;
  - how to open the controller check (a second tile, or temporarily edit the command to pass the `diag.html` URL).

  The existing Silk and Web App Tester sections move under a "Fire TV Silk (best-effort)" heading.
- **Main design spec** (`2026-09-25-block-diggers-design.md`) is edited to match:
  - Summary: the main target becomes the Fire TV Cube **via Moonlight streaming from a PC**. Silk is best-effort.
  - "Fire TV Silk rules" and "Getting rid of the Silk cursor": marked best-effort, with a pointer to this spec.
  - Performance budget: 60 fps target in **PC Chrome** (the renderer when streaming). The Cube-specific tile-culling and particle limits stay as good practice but aren't hard limits.
  - Hands-on checklist: "Fire TV Cube Silk with 2 Xbox controllers" becomes "Fire TV Cube via Moonlight with 2 Xbox controllers".

## 4. Testing

**Unit tests** (Vitest, jsdom, fake timers) for `installIdleCursor`:
- the cursor starts hidden;
- `pointermove` shows it, and after `idleMs` with no more movement it's hidden again;
- movement during the idle window restarts the timer;
- `destroy()` removes the listeners and shows the cursor.

**Unit test** for the focus guard: the overlay contains the hint text.

**Hands-on on the TV**, done by the user:
1. Launch the tile with the `diag.html` URL. Both controllers connect, and sticks, D-pad and all buttons reach the page (green in "Everything that arrived").
2. Launch the normal tile. Chrome opens full screen with no prompts or bars, and both players can join with A and move.
3. Leave the mouse alone for 2 s. No cursor shows on the TV.
4. Pop up a notification or alt-tab on the PC. The overlay shows the hint, and the Moonlight mouse-mode click brings the controllers back.
5. End the stream in Moonlight. Chrome closes on the PC.

## Out of scope

- A "dev" tile pointing at the local dev server.
- Serving a local or offline build.
- Launching from Steam Big Picture.
- Editing Sunshine's `apps.json` automatically.
- Porting any of this to Family Arcade.
