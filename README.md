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
