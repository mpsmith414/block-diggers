# Block Diggers

A co-op, side-view, blocky mining game for a grown-up and a young kid. Dig for ores,
ride home, build up your camp. Plays in a web browser with Xbox controllers,
a keyboard, or (single-player) a phone.

**Play:** https://mpsmith414.github.io/block-diggers/
**Controller check:** https://mpsmith414.github.io/block-diggers/diag.html

Design: `docs/superpowers/specs/2026-09-25-block-diggers-design.md`

## How to play

1. **Title:** each player presses **A** to join, picks a friend (miner, fox,
   robot or dino) with left/right, and presses **A** again when ready.
2. **Camp:** walk to the mine entrance and push **down** to start a trip.
3. **Mine:** push the stick toward a block to dig it. Digging up or down leaves
   a ladder, so you can always climb back. Ores fly into your backpack.
   Twinkles in the dark are ores and treasure chests. The strip on the right
   shows how deep you are, with gold dots for chests still to find.
4. **Go home:** hold **B** for 2 seconds. A rope pulls everyone up and the
   ores count into the shared bank.
5. **Build:** a gold star shows what you can afford. Stand at the bench or an
   empty plot and press **A**: left/right to browse, **A** to buy, **B** to close.

Hazards are gentle: slimes (jump on them!), bats, falling gravel and lava only
knock you back and drop up to 3 ores. Nothing is ever lost for good.

| Button | Action |
|---|---|
| Left stick / D-pad | walk, dig, climb |
| A (or X) | jump / join / choose |
| B (hold) | go home |
| Y | float in a bubble to your partner |
| Start or View | pause (resume, sound on/off, go home, change characters) |

Keyboard: arrows or WASD, Space = A, H = B, B = Y, Esc = pause.
Phones get on-screen controls.

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
   | Command | full path to `tools\sunshine\block-diggers.cmd` in this repo |
   | Working Directory | full path to the `tools\sunshine` folder |
   | Image | full path to `tools\sunshine\block-diggers.png` |
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
"C:\full\path\to\tools\sunshine\block-diggers.cmd" https://mpsmith414.github.io/block-diggers/diag.html
```

## Develop

```bash
npm install
npm run dev      # http://localhost:5173/block-diggers/
npm test
npm run build    # outputs dist/
```

Pushing to `main` runs the tests, builds, and deploys to GitHub Pages.

In dev mode, `window.h` is a test harness for the browser console: `h.advance(ms)`
steps the game frame by frame, `h.hold('ArrowDown', 1000)` holds a key,
`h.pad(0, { a: true })` plugs in a virtual controller, and `h.shot('name')`
saves a 3× screenshot to `.shots/name.png`.

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
