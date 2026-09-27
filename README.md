# Block Diggers

A co-op, side-view, blocky mining game for a grown-up and a young kid. Dig for ores,
ride home, build up your camp. Plays in a web browser with Xbox controllers,
a keyboard, or (single-player) a phone.

**Play:** https://mpsmith414.github.io/block-diggers/
**Controller check:** https://mpsmith414.github.io/block-diggers/diag.html

Design: `docs/superpowers/specs/2026-09-25-block-diggers-design.md`

## Play on the TV (Sunshine + Moonlight)

The supported way to play on the TV. The game runs in Chrome on the PC, and
Moonlight on the Fire TV Cube shows it and sends the controllers back. Sunshine
turns each controller into a virtual Xbox controller on the PC, so the game
reads them like controllers plugged straight in.

### One-time setup (on the PC)

1. Sunshine must have **ViGEmBus** installed for virtual controllers. If Steam
   games already see your controllers over Moonlight, it's installed.
2. Google Chrome must be installed.
3. Open Sunshine's web UI at `https://localhost:47990` → **Applications** →
   **Add New**, and fill in:

   | Field | Value |
   |---|---|
   | Application Name | Block Diggers |
   | Command | full path to `tools\sunshinelock-diggers.cmd` in this repo |
   | Working Directory | full path to the `tools\sunshine` folder |
   | Image | full path to `tools\sunshinelock-diggers.png` |
   | Everything else | leave the defaults |

4. Save.

### Playing

On the TV: Moonlight → your PC → **Block Diggers**. Chrome opens full screen on
the live game. Each player presses **A** to join. To quit, end the stream in
Moonlight; Chrome closes on the PC.

Saves live in a Chrome profile just for the game
(`%LOCALAPPDATA%\BlockDiggers\chrome-profile`), separate from your own Chrome.

If a notification or another window grabs focus on the PC, a 🎮 screen appears
and the controllers pause. Hold **Start** to switch Moonlight into mouse mode,
click the screen once, then hold **Start** again to switch back.

### Controller check over Moonlight

Add a second application the same way, named "Block Diggers check", with the
command set to the launcher followed by the controller check URL:

```
"C:ull\path	o	ools\sunshinelock-diggers.cmd" https://mpsmith414.github.io/block-diggers/diag.html
```

## Develop

```bash
npm install
npm run dev      # http://localhost:5173/block-diggers/
npm test
npm run build    # outputs dist/
```

Pushing to `main` runs the tests, builds, and deploys to GitHub Pages.

## Fire TV Silk (best-effort)

Playing in Silk directly on the Cube is best-effort: Silk's cursor gets in the
way of the controllers. Use Moonlight (above) instead.

### Controller check in Silk

The "Everything that arrived" tally counts every input the page receives,
whatever its source: controller sticks and buttons (through the browser's
Gamepad API), key presses, and cursor moves/clicks. Green = something arrived,
red = nothing did. One controller is enough.

1. Open the controller check URL in Silk and click once on the page (point the
   cursor at it, press **A**) so the page has focus.
2. Click **Reset (X)**.
3. Slowly: wiggle the **left stick**, then the **right stick**, press each
   **D-pad** direction, then press **A, B, X, Y, LB, RB, LT, RT, View, Menu**
   once each.
4. Take a photo of the screen.

#### What we learned in Silk (2026-09-25)
- The controller shows up (Controllers: 1), but the sticks and D-pad never
  reach the page. Silk uses them to drive its own cursor.
- Hiding the cursor with CSS doesn't work (Silk draws its own). Pointer lock
  fails with `UnknownError`. Back is caught correctly.

### Fallback: skip Silk with Web App Tester

If no in-page fix gets rid of the cursor, Amazon's free **Web App Tester** app
(Fire TV Appstore) opens a URL full-screen in Amazon WebView, without Silk's
browser chrome or cursor:

1. Install "Web App Tester" from the Appstore on the Fire TV.
2. Open it → **Hosted Apps** tab → enter the Play URL → **Test App**.
3. Repeat the controller check the same way, using the controller check URL.
