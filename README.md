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

### What we learned in Silk (2026-09-25)
- The controller shows up (Controllers: 1), but the sticks and D-pad never
  reach the page. Silk uses them to drive its own cursor.
- Hiding the cursor with CSS doesn't work (Silk draws its own). Pointer lock
  fails with `UnknownError`. Back is caught correctly.

## Fallback: skip Silk with Web App Tester

If no in-page fix gets rid of the cursor, Amazon's free **Web App Tester** app
(Fire TV Appstore) opens a URL full-screen in Amazon WebView, without Silk's
browser chrome or cursor:

1. Install "Web App Tester" from the Appstore on the Fire TV.
2. Open it → **Hosted Apps** tab → enter the Play URL → **Test App**.
3. Repeat the controller check the same way, using the controller check URL.
