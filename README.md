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

The page itself never reads the **A** button — A only works as Silk's click, on
whatever the on-screen cursor is pointing at. Keep that in mind throughout:
where these steps say "press A", they mean "click", and it only does something
useful if the cursor is over the right spot first.

1. Pair both Xbox controllers with the Fire TV (Settings → Controllers & Bluetooth Devices).
2. Open Silk and go to the controller check URL above.
3. Press **A** once on the page. This is a click: it makes the Back button
   safe (installs the back guard) and focuses the page. If the "Page focus"
   chip still says NO, point the cursor at the page and press A again.
4. Press a button on each controller until the "Controllers" chip reads 2
   (it goes green already at 1).
5. **Baseline:** press **X** to reset counts, then hold the **left stick** in
   circles for about 3 seconds, then the **right stick**, then the **D-pad**.
   Photograph the "What each input does" table. Also photograph the
   Controllers panel while holding **A**, then **B**, then **X**, then **Y**
   in turn — this shows the button mapping and the raw button numbers.
6. **For each cursor fix:** use **LB/RB** to select it and **Y** to flip it.
   If it says "armed", move the on-screen cursor OFF the toggle buttons
   before pressing A once — a click landing on a toggle flips that toggle
   instead of arming/firing the pending one. Wait until the toggle shows
   ON/ok (or an error — photograph that too). THEN press **X** to reset
   counts, repeat the stick/D-pad circles from step 5, photograph the table,
   and note whether the on-screen cursor is still visible. Turn the fix back
   off (**Y**) before moving to the next one.

## Fallback: skip Silk with Web App Tester

If no in-page fix gets rid of the cursor, Amazon's free **Web App Tester** app
(Fire TV Appstore) opens a URL full-screen in Amazon WebView, without Silk's
browser chrome or cursor:

1. Install "Web App Tester" from the Appstore on the Fire TV.
2. Open it → **Hosted Apps** tab → enter the Play URL → **Test App**.
3. Repeat the controller check the same way, using the controller check URL.
