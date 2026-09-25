# Block Diggers — Design

**Date:** 2026-09-25
**Status:** Approved in brainstorming, pending written-spec review

## Summary

A co-op, side-view, Minecraft-flavoured mining game for a parent and a 6-year-old
who has never played games before. Dig down through blocky layers, collect ores,
ride home, and spend the loot on buildings that grow your camp across sessions.
Runs in a web browser from GitHub Pages. The main target is a **Fire TV Cube (Silk
browser) with two Xbox controllers on one shared screen**. It also works on a PC
with controllers or keyboard, and single-player on a phone with touch controls.

Design pillars:

1. **Playable with the stick alone.** Push toward a block to mine it. Everything else is optional.
2. **No fail state.** Nothing ends a run. Mistakes cost a few ores or a few seconds, never progress.
3. **Challenge is chosen, not forced.** Deeper means richer and trickier. The child can stay shallow and still contribute.
4. **Readable without reading.** Icons and numbers only.
5. **Progress that sticks.** The camp visibly grows between sessions.

## 1. Gameplay

### The loop (~5 minutes per trip)

1. **Camp** (surface). Both players start here. Walk into the mineshaft to start a trip.
2. **Mine.** A freshly generated mine every trip (new seed).
3. **Go home.** Either player holds B for 2 seconds. A rope appears and both players are pulled up with whatever is in their backpacks.
4. **Build and upgrade** at camp with the shared ore bank.

### The mine

- Grid of 16×16 px blocks, **48 blocks wide × 150 deep**. Bedrock forms the side walls and the floor.
- Layers:

| Layer | Rows | Host rock | Ores | Hazards |
|---|---|---|---|---|
| 1 Dirt | 1–40 | dirt | coal | slimes |
| 2 Stone | 41–95 | stone | coal, iron, gold | slimes, falling gravel |
| 3 Deep | 96–148 | deepslate | gold, diamond, emerald | lava pockets, bats |

Row 0 is the grass surface with the shaft opening, and row 149 is the bedrock floor.

- Caves (open pockets) are carved in every layer. Deeper caves are bigger.
- **Treasure chests:** 3 per mine, placed in caves in layers 2–3. Walk into one to open it. It gives 3–6 of the best ore for its layer. Anything that doesn't fit in the backpack drops on the ground (see the bonk pickup rules).
- An ore block takes as long to mine as its host rock.

### Player body and movement

- Each player is **1 block wide and 1 block tall** (chibi proportions). Every tunnel is therefore 1 block high, which keeps navigation simple.
- **Stick left/right:** walk. If the next cell at foot level is solid:
  - it's a 1-block ledge with open space above it → **auto-step** onto it (no jump needed);
  - otherwise → **mine it** (hold the direction until it breaks).
- **Stick down:** mine the block below. **Stick up:** mine the block above, or climb if you're on a ladder.
- On diagonal input, the axis with the larger value wins.
- **Auto-ladders:** every cell opened by mining up or down becomes a ladder cell. Stick up/down climbs ladders. You can never dig yourself into a hole you can't climb out of.
- **A (or X):** small jump. Optional.

### Mining and upgrades

Mining time is set by the block's hardness and the pickaxe:

| Block | Wood pick | Iron pick | Diamond pick |
|---|---|---|---|
| dirt, gravel | 0.25 s | 0.2 s | 0.12 s |
| stone | 0.6 s | 0.4 s | 0.25 s |
| deepslate | ✗ (bounces off) | 0.7 s | 0.4 s |
| bedrock | ✗ | ✗ | ✗ |

Upgrades are **shared** (they apply to both players) and bought at camp:

| Upgrade | Level 0 (start) | Level 1 | Level 2 |
|---|---|---|---|
| Pickaxe | Wood | Iron: 10 iron + 5 coal | Diamond: 5 diamond + 10 gold |
| Backpack (ores per player) | 20 | 40: 15 coal + 5 iron | 80: 10 iron + 5 gold |
| Lantern (light radius, blocks) | 3 | 5: 10 coal + 5 iron | 7: 5 gold + 2 diamond |

A full backpack shows a "full" icon on that player. Ores they touch stay in the world.

All timing and cost numbers live in one tuning file (`src/tuning.js`) so they can be adjusted after playtests.

### Hazards and the bonk

- **Bonk:** touching a hazard knocks you back and **scatters up to 3 ores** from your backpack. They stay on the ground for 10 seconds and anyone can pick them up. You're invulnerable for 1.5 s afterwards. Nothing else is lost.
- **Slimes** (layers 1–2) hop slowly left and right. Landing on top of one squashes it: a harmless poof, and it respawns elsewhere later. Touching one from the side is a bonk.
- **Falling gravel** (layer 2+): when the block under gravel is mined, it shakes for 0.5 s, then falls. If it hits a player it's a bonk. It lands and becomes a block again.
- **Lava** (layer 3): static pools that don't spread. Touching lava is a bonk, and the player pops up to the nearest safe open cell above.
- **Bats** (layer 3) fly in wavy lines. They can't be defeated, only avoided. Touching one is a bonk.
- **Enemy cap:** at most 6 slimes and 4 bats active at once, spawned only off-screen.

### Co-op camera

- One shared camera framing both players. It zooms smoothly between **1.0× and 0.5×**. At 0.5× the screen shows about 60×34 blocks, so the whole mine width always fits and players can be up to ~30 rows apart.
- **At maximum zoom-out**, the screen edge acts as a soft wall: a player can't move further out of view.
- **Y button: bubble to partner.** Either player can press Y to float over to the other player in a bubble. They're invulnerable and pass through blocks while bubbled.
- If a player ends up off-screen anyway (knockback, a fall), they are auto-bubbled to their partner.
- *Change from the chat version:* the original rule ("whoever falls behind is bubbled automatically") can't tell who is "behind". With a shallow child and a deep parent, it would keep yanking the child away from their digging. The soft wall plus an on-demand bubble fixes that.

### Camp and blueprints

- The camp is a surface strip with the mineshaft entrance, an upgrade bench, and empty building plots.
- **Blueprints** are pre-designed buildings. Standing at a plot opens a picker with a picture and an icon cost for each blueprint. Affordable ones glow green. Stick left/right browses and A confirms (the upgrade bench works the same way). Either player can use them. Choosing one spends the ores, and the building assembles itself block by block over ~5 seconds.

| Blueprint | Cost |
|---|---|
| Flower Garden | 15 coal |
| Cozy House | 10 coal + 5 iron |
| Animal Pen (pigs and sheep wander) | 10 iron + 5 gold |
| Lookout Tower | 20 iron + 5 gold |
| Minecart Loop (a cart circles the camp) | 10 iron + 10 gold |
| Diamond Statue | 5 diamond + 5 emerald |

- There's one shared **ore bank**. On arriving home, each player's backpack empties into it with a counting-up animation.

### Solo play

Everything works with one player: the camera follows them, and the bubble and the soft wall are inactive.

## 2. Look, sound and menus

- **Original pixel art, drawn in code** at startup: block textures, ores, ladders, characters, buildings, UI icons. No Minecraft assets, no downloaded asset files.
- **Internal resolution 480×270**, scaled up to fill the screen with crisp pixels and letterboxing.
- **Darkness:** below the surface the mine is dark. Each player carries a lantern light circle, and its radius is the lantern upgrade.
- **Characters:** 4 choices (miner, fox, robot, dino), each with a distinct colour. Both players can't pick the same one.
- **HUD:** per-player ore counts (icon + number) and a backpack-fill meter in that player's corner. No text anywhere a child needs to read.
- **Title / join:** big "press A" artwork. The first device to press A is player 1 and the next is player 2. The keyboard counts as a device. On touch devices the touch controls are player 1.
- **Sound:** chiptune SFX synthesised with WebAudio (mining clink, ore ding, bonk boing, rope whoosh, build fanfare) plus a looping chiptune track. Mute toggle on the pause screen. Audio starts only after the first user input.

## 3. Architecture

### Stack and hosting

- **Phaser 3**, plain JavaScript (ES modules), **Vite** dev server and build.
- **Vitest** for unit tests.
- **GitHub Actions** builds on push to `main` and deploys `dist/` to **GitHub Pages**. Vite `base` is `/block-diggers/`, and all asset paths are relative to it.
- Standalone repo at `C:\Users\Matt\Documents\_Code\Projects\block-diggers`, GitHub repo `block-diggers`. **Free Pages needs a public repo, so the repo isn't created or pushed until the owner confirms.** The code has no family names in it.

### Rule for game logic

Game rules live in **plain modules with no Phaser imports** (world gen, grid, mining, economy, save, input mapping, camera math). Phaser scenes are thin: they read input, call the logic, and draw the result. This makes the rules unit-testable in Node.

### Directory layout

```
index.html
src/
  main.js                 Phaser config, scene list, scaling
  tuning.js               every tunable number (times, costs, sizes, caps)
  input/
    devices.js            raw Gamepad API + keyboard + touch → per-device state
    players.js            device ↔ player slot binding, join order
    intents.js            device state → {moveX, moveY, jump, bubble, homeHeld, pause}  (pure)
    tvGuard.js            Silk focus guard + back-button capture
  world/
    rng.js                seeded PRNG (pure)
    worldgen.js           seed → grid of block ids, chests, spawn points  (pure)
    grid.js               block get/set, hardness, mining progress, gravel checks  (pure)
    blocks.js             block type table (id, hardness, drops, texture key)
  game/
    player.js             movement, auto-step, auto-ladder, mining target  (pure step fn)
    hazards.js            slime / bat / gravel / lava behaviour  (pure step fns)
    loot.js               backpack, scatter-on-bonk, pickup timers  (pure)
    camera.js             zoom-to-fit, soft-wall bounds, off-screen bubble trigger  (pure)
    economy.js            blueprints, upgrades, costs, affordability  (pure)
  save/
    save.js               load / save / migrate, versioned, storage-failure fallback
  art/
    textures.js           draws all pixel textures to canvases at boot
  audio/
    sfx.js                WebAudio synth effects
    music.js              chiptune loop
  scenes/
    BootScene.js  TitleScene.js  CampScene.js  MineScene.js  PauseScene.js  HudScene.js
tests/                    Vitest specs for every "(pure)" module
.github/workflows/deploy.yml
```

### Data flow

1. `devices.js` polls every frame. `intents.js` turns each bound device into an intent for its player slot.
2. `MineScene` passes intents to `player.js`. The player step returns movement plus any mining action, which is applied to `grid.js`.
3. Grid and loot changes are emitted as scene events (`oreCollected`, `bonk`, `blockMined`, `gravelFall`). `HudScene` and `sfx.js` listen to them.
4. Going home: backpacks are merged into the bank in `economy.js`, `save.js` writes, and the game switches to `CampScene`.

### Input details

Input is custom (`devices.js`) rather than Phaser's gamepad plugin, so the Fire TV fixes stay under our control.

| Button | Action |
|---|---|
| Left stick / D-pad | Move, mine, climb |
| A, X | Jump |
| B (hold 2 s) | Go home (both players) |
| Y | Bubble to partner |
| Start / Menu, View / Back | Pause |

- **Keyboard** (one player): arrows or WASD, Space to jump, hold H to go home, B for bubble, Esc to pause.
- **Touch** (phone, player 1): floating joystick on the left half of the screen; jump and a hold-to-go-home button on the right.
- Stick deadzone 0.25, then rescaled.

### Fire TV Silk rules

These are lessons from Family Arcade, where each of these was found by hand:

- Silk paints a mouse cursor that the left stick moves. **A press anywhere on the page counts**, and the game canvas fills the viewport with no dead border.
- **Focus guard:** if `document.hasFocus()` goes false (the cursor was pushed into the browser chrome), `getGamepads()` freezes and keys stop. Show a full-screen "press any button" overlay. The press that clicks it restores focus, and requests fullscreen if a pad is connected.
- The controller's **back** button must not leave the page. Capture it (history-state guard) and open Pause instead.
- Storage may be blocked. `save.js` catches every storage call and falls back to in-memory storage.

### Getting rid of the Silk cursor (a goal, not just a workaround)

Family Arcade still has this problem: on the Cube, the left stick drives Silk's on-screen cursor, so steering feels mushy and the cursor wanders off the page and takes focus with it. Family Arcade only *works around* the cursor (press-anywhere + focus guard). It never tries to suppress it. Block Diggers will try to suppress it, in this order. Each step is verified on the Cube before moving on:

1. **Measure first.** A diagnostic page (milestone 1) shows live gamepad axes and buttons, `keydown` events, `pointermove` events and `document.hasFocus()` side by side. This tells us exactly what Silk does with each stick and the D-pad: does the page still get axis data while the cursor moves, and does the right stick or D-pad avoid the cursor?
2. **In-page suppression, tried one at a time from toggles on that page:**
   - `cursor: none` on the whole document (Chromium maps CSS cursors to the Android pointer icon, which may hide Silk's cursor);
   - `requestPointerLock()` on the canvas (locks and hides the pointer if Silk honours it);
   - `requestFullscreen()`;
   - `preventDefault()` on the stick's `keydown` and `pointermove` events.

   Whatever works gets folded into `tvGuard.js` and switched on when the first controller press arrives.
3. **Controls that dodge the cursor.** If the diagnostics show Silk only hijacks some inputs (for example the left stick but not the D-pad or right stick), movement also accepts those inputs, and the join screen suggests them on Fire TV.
4. **Fallback: skip Silk entirely.** Launch the game through Amazon's **Web App Tester** app (free on the Fire TV Appstore). It opens a URL in Amazon WebView full-screen, with no browser chrome. Amazon documents that WebView supports the standard Gamepad API. If that also shows no cursor, it becomes the recommended way to play on the TV, and a short how-to goes in the README.

Whatever fix works here is written up so it can be ported to Family Arcade's KidKit afterwards. That port is a separate task and not part of Block Diggers.

### Performance budget (Fire TV Cube)

- Phaser tilemap layer with built-in culling. Only visible tiles are drawn.
- Darkness is one render texture per frame with light circles erased from it.
- Enemy caps as above. No particle systems with more than 30 particles.
- Target 60 fps on the Cube, and 30 fps is the floor. If it misses, drop the lantern soft edge first.

## 4. Error handling

| Situation | Behaviour |
|---|---|
| Controller disconnects | Game pauses and shows a controller icon for that player slot. Their character stands still and can't be hurt. Resumes on reconnect. |
| Page loses focus (Silk cursor) | Focus-guard overlay (see above) |
| Back button pressed | Pause menu, never navigation |
| Storage unavailable or save corrupt | Start fresh in memory and keep playing. A corrupt save is renamed with a `-corrupt` suffix, not deleted. |
| Old save version | `save.js` migrates it forward. Unknown fields are kept. |
| Any window size or orientation | Letterbox scale. On a phone in portrait, a "rotate" picture is shown. |

## 5. Testing

**Unit tests (Vitest)** for the pure modules:

- `worldgen`: the same seed gives an identical grid; ore types appear only in their layers; bedrock only on the walls and floor; exactly 3 chests in layers 2–3; every non-bedrock cell is reachable from the shaft.
- `grid` / `player`: mining times per pickaxe; deepslate bounces off a wood pickaxe; auto-step vs mine decision; mining up or down leaves ladders; you can always climb back to the surface from anywhere you dug.
- `loot`: backpack cap; scatter takes ≤ 3 ores; pickup timers expire at 10 s.
- `economy`: costs, affordability, spending, upgrade level caps.
- `save`: round-trip; migration from v1; corrupt-save fallback; storage-throws fallback.
- `intents`: fake gamepad states map to the right intents; deadzone; hold-B timing.
- `camera`: zoom-to-fit maths; soft-wall bounds; off-screen triggers the bubble.

**Hands-on checklist**, run at each milestone on three setups: PC Chrome with 2 Xbox controllers; a phone in landscape; the Fire TV Cube Silk with 2 Xbox controllers.

## 6. Build order (each milestone is playable)

1. **Skeleton + Silk cursor diagnostics.** Vite + Phaser project, the input module, and the diagnostic page from "Getting rid of the Silk cursor", with its suppression toggles. Deploy to Pages, test on the Cube, and pick the fix before any gameplay is built on top of the input.
2. **Solo digging.** World gen, grid, player movement, mining, auto-ladders, ores, backpack, lantern darkness, HUD.
3. **Co-op.** Join flow, second player, zoom camera, soft wall, bubble.
4. **Hazards.** Slimes, gravel, lava, bats, bonk and scatter.
5. **Camp.** Go home, ore bank, blueprints, upgrades, saving.
6. **Polish.** SFX, music, touch controls, title and character select, pause menu.

## Out of scope for v1

Online multiplayer, free-form block placement, multiple save slots, story or quests,
spreading lava or water, crafting beyond blueprints, offline/PWA install.
