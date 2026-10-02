# Rainbow Planet (Endless Mine) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Build a seventh planet past the Sun with an endless mine of random rainbow layers, varied gems up to 8×8, and a village where sparkles are banked.

**Architecture:**
- **Pure rules** in `src/world/rainbow.js` and `src/game/rainbowGems.js`, all deterministic from `(seed, layer)`.
- **The mine:** `MineScene` gets a `rainbow` branch that builds a 10-layer stretch and hands its layer table to `planets.js` (`useRainbowStretch`), so the HUD depth strip, the trip card and creatures work unchanged. A new `src/scenes/mine/rainbowView.js` draws the per-row tints, the gems, the chests and the decorations, and handles big-gem hits.
- **The village** plugs into `CampScene` through its `SCENERY`, `GROUND`, `ROCKETS` and `SHIP` tables, like the other camps.

**Tech Stack:** Phaser 3 (WebGL; tile tints), Vite, Vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-10-02-rainbow-planet-design.md`.
- Block ids and tileset frames are append-only. Old saves must load with nothing lost (save v11).
- **Layers:** 30 rows each. Each trip's stretch is 10 layers. `RAINBOW.digTime` is 0.15 s with every pick.
- **Gems:**

  | Size | Blocks | Per layer | Hits | Sparkles |
  |---|---|---|---|---|
  | tiny | 1×1 | 40–60 | 1 | 1 |
  | chunky | 2×2 | 12–18 | 2 | 6 |
  | big | 4×4 | 3–5 | 5 | 30 |
  | massive | 8×8 | 1–2 | 12 | 150 |

  Massive layers come up about 1 in 6.
- **Chests:** 3–5 per layer, worth 10–25 sparkles each.
- **Sparkles** live in `bank.sparkle`. They never use backpack space.
- **No reading needed.** Never punishing.

---

### Task 1: Rainbow world rules (pure)

**Files:**
- Modify: `src/world/blocks.js` (append `RAINBOW_ROCK` 109, `RAINBOW_GEM` 110, `RAINBOW_GEM_PART` 111, `RAINBOW_FLOOR` 112, `RAINBOW_TOP` 113, `RAINBOW_SOIL` 114)
- Modify: `src/tuning.js` (`MINE_TIME.rainbow`, `RAINBOW`, `RAINBOW_CAMP`)
- Create: `src/world/rainbow.js`, `src/game/rainbowGems.js`
- Test: `tests/world/rainbow.test.js`, `tests/game/rainbowGems.test.js`

**Interfaces it produces:**
- **`RAINBOW`:** `{ seed: 0x7a1b0b, layerRows: 30, stretch: 10, digTime: 0.15, above: 4, cave: { w: 7, h: 3 } }`.
- **`layerLook(seed, n)`** → `{ n, colors: [hex, hex(, hex)], pattern, gem: { shape, color, light, dark, sparkle, size }, decor: [kind, kind], creatures: [{ kind: 'blob'|'flier', color, scale }], twist: null|'bouncy'|'pools'|'shiny'|'floaty' }`.
  - `pattern` is one of `PATTERNS`: speckles, stripes, swirls, dots, bubbles, zigzag.
  - `shape` is one of `GEM_SHAPES`: round, diamond, hex, star, heart, crystal, nugget.
  - `size` is one of `GEM_SIZES`: tiny, chunky, big, massive.
- **`rowColor(look, rowInLayer)`** → the hex colour along the layer's gradient.
- **`layerOfRow(row)`** → `n`, counting layers from 1.
- **`generateRainbow(seed, deepest)`** → `{ top, rows, grid, startCave: { x, y }, spawn: { x, y }, floorRow, layers: [{ n, top, bottom, look }], gems: [{ id, x, y, size, n, hits }], chests: [{ x, y, n, sparkles }], decor: [{ x, y, kind, n, ceiling }], creatures, twists }`.
  - Grid row 0 is the absolute row `top`.
  - `layers[].top` and `layers[].bottom` are **grid** rows.
- **`gemInfo(size)`** → `{ cells, hits, sparkles }`.
- **`hitGem(gem)`** → `{ broken, hitsLeft }` (it mutates `gem.hits`).

- [ ] **Step 1: The tests.**
  - **`layerLook`:**
    - deterministic;
    - adjacent layers differ;
    - over 300 layers every pattern, shape and size appears;
    - massive comes up 8–25% of the time;
    - no colour channel average below 70 (no muddy or near-black colours).
  - **`generateRainbow(RAINBOW.seed, 0)`:**
    - deterministic;
    - `top === 0`;
    - the start cave is air;
    - `floorRow` is all `RAINBOW_FLOOR`;
    - gems fit inside columns 1..46 and rows above the floor, and never overlap each other or the cave;
    - each layer's gem counts are within range for its size;
    - big gem cells are `RAINBOW_GEM_PART`, tiny gem cells are `RAINBOW_GEM`;
    - chests sit on air above solid ground, 3–5 per layer.
  - **`generateRainbow(seed, 400)`:**
    - `top === 396`;
    - the layers include layer 14 (`layerOfRow(400) === 14`);
    - the start cave is at grid row `4 + 1`.
  - **`mineTime`:** every rainbow block except the floor gives 0.15 with pick 0 and pick 20, and the floor gives `Infinity`.
  - **Gems:** `gemInfo` matches the table, and `hitGem` breaks a chunky gem on the 2nd hit and a massive one on the 12th.
- [ ] **Step 2: Watch them fail.** Run `npx vitest run tests/world/rainbow.test.js tests/game/rainbowGems.test.js` and expect them to fail.
- [ ] **Step 3: Implement.**
  - **Generation:** the layer random generator is `createRng(seed ^ Math.imul(n, 0x9e3779b1))`.
  - **Colours:** in HSL, with saturation 0.55–0.9 and lightness 0.55–0.75, converted to hex.
  - **The gem colour** has its hue at least 90° away from the rock's middle colour.
  - **Size weights:** tiny 0.3, chunky 0.29, big 0.27, massive 0.14.
  - **Placing gems:** largest first, by random tries on an occupancy mask, inside each layer's rows. Leave a 1-cell margin from columns 0 and 47 and from the floor, and stay out of the cave.
  - **Caves:**
    - each layer carves 3–5 blob caves with `planetgen`-style random walks (local implementation), so chests, decorations and creatures have air;
    - caves avoid big gems by being carved first and placing gems only in solid rock;
    - chests go on cave floors; decorations go on cave floors and ceilings.
  - **The start cave:** 7×3 centred on `SHAFT_X` at grid row `above + 1` (row 2 on the first trip, where `top = 0` and `start = 2`).
    - In general, `top = max(0, deepest - above)` and the start row is `deepest - top`.
    - The spawn is `(SHAFT_X, startRow + 1)`, the bottom of the cave.
  - **The stretch** runs from `top` to the end of layer `layerOfRow(deepest) + stretch - 1`, plus 1 floor row.
  - **Twists:**
    - `bouncy`: 6 `SPRING` blocks on cave floors;
    - `pools`: 3 small `WATER` pools in caves;
    - `shiny`: the cave floor blocks in that layer are marked in a `shiny` set the view treats as slippery;
    - `floaty`: the layer's grid rows are returned in `twists.floaty`.
- [ ] **Step 4: Watch them pass, then commit** with the message `feat(rainbow): the endless mine's rules (layers, gems, generation)`.

### Task 2: Planet, rocket, star map, save, bank, creatures

**Files:**
- Modify: `src/game/planets.js`:
  - add the `rainbow` planet: `rows: 0`, `layers: {}`, ores `['sparkle']`, `gravity: 1`, `camp: RAINBOW_CAMP`, and no suit, heart or perks;
  - add `ROCKET_TO.rainbow = { at: 'sun', id: 'rainbowrocket' }`;
  - add `useRainbowStretch(layers, rows)`, which makes `layersOf('rainbow')` and `mineRows('rainbow')` return the current stretch. Its keys are `r<n>`, and it registers `LAYER_COLORS['r<n>']` with the layer's middle colour.
- Modify: `src/game/economy.js`: the `rainbowrocket` blueprint in `SUN_BLUEPRINTS`, costing `{ nova: 60, plasma: 60, sunstone: 60 }` with `needs: { sunHeart: true }`. `plotsOf` pads to the camp's plot count. `depositPacks` adds `pack.sparkle` into `bank.sparkle`.
- Modify: `src/tuning.js`: `SUN_CAMP` gets plots `[26, 33, 40, 47, 54]`. `RAINBOW_CAMP` is `{ ...MOON_CAMP }`.
- Modify: `src/save/save.js`: v11 adds `rainbow: { deepest: 0 }` and `bank.sparkle = 0`.
- Modify: `src/game/ores.js`: `shownOres(state, 'rainbow')` returns `['sparkle']`.
- Modify: `src/game/hazards.js`: `CREATURES` and `GAITS` accept the species `rblob` (a walker, using the slime's gait) and `rflier` (using the jelly's gait). Add `setLayerCreatures(map)`.
- Modify: `src/scenes/StarMapScene.js`: 7 `SPOTS` re-spaced, and `LOOK.rainbow = 'planet-rainbow'`.
- Test: `tests/game/rainbowPlanet.test.js`.

- [ ] **Step 1: The tests.**
  - the star map stop is locked, then open once the rocket is built at the Sun;
  - `blueprintOk` needs the Sun's Heart;
  - `plotsOf(old sun save)` has length 5;
  - the v10 → v11 migration;
  - `depositPacks` with sparkles;
  - `shownOres`;
  - `layersOf('rainbow')` after `useRainbowStretch`.
- [ ] **Step 2: Watch them fail, implement, watch them pass, then commit** with the message `feat(rainbow): the planet, its rocket, the star map stop and save v11`.

### Task 3: Art

**Files:**
- Create: `src/art/rainbow.js`, wired from `textures.js`.
- **Tileset:** append frames after `BACK`:
  - `RAINBOW_TILES.pattern(p, v)`: 6 patterns × 4 variants, greyscale with light values from 150 to 255;
  - `RAINBOW_TILES.back(p)`: 6 darker greyscale backs;
  - the block frames for `RAINBOW_ROCK`, `RAINBOW_GEM`, `RAINBOW_GEM_PART`, `RAINBOW_FLOOR`, `RAINBOW_TOP` and `RAINBOW_SOIL` (the camp's candy ground, with a striped top).
- **Textures:**
  - `rgem-<shape>-<size>`: white and light-grey facets with a dark edge, at 16, 32, 64 or 128 px;
  - `rgem-crack`: a 4-frame overlay drawn per size by scaling;
  - `rchest` (2 frames);
  - `rdecor-<kind>` for mushroom, flower, bubble, vine and crystal;
  - `rblob` and `rflier` (2-frame sheets in greys);
  - `ore-sparkle`;
  - `planet-rainbow`;
  - `bld-rainbowrocket` (96×80) and `rainbow-ship`;
  - `rainbow-lift`;
  - `rainbow-sign`;
  - a rainbow arch for the village.
- [ ] **Check and commit.** Run `npm test` and `npm run build`, then commit with the message `feat(rainbow): art`.

### Task 4: The mine

**Files:**
- Create: `src/scenes/mine/rainbowView.js`.
- Modify: `MineScene.js`, `mapView.js`, `HudScene.js`, `petsView.js` (giving ore on rainbow), `audio/wire.js`.

**The rainbow branch in `MineScene`:**
- `generateRainbow(RAINBOW.seed, state.rainbow.deepest)` builds the world.
- `useRainbowStretch` and `setLayerCreatures` are called.
- No sky: the camera's bounds start at row 0.
- No `carveStation`. The start is `world.spawn`.
- `drawLander` is replaced with the lift cage at the spawn.
- `goHome` beams up in rainbow colours (`BEAM.rainbow`).
- `arriveHome` adds `rainbowDeepest: top + trip.deepest`, and the packs carry `sparkle`.
- The `floaty` twist sets gravity in its rows.
- The `shiny` twist feeds a grip override for its cells.

**`mapView`** gets an optional `tile(x, y, id)` hook that returns `{ index, tint }`. The rainbow world uses it for its rock (a pattern frame tinted with `rowColor`) and back walls.

**`rainbowView`:**
- tiny gem overlays: a tinted `rgem-<shape>-tiny` for each `RAINBOW_GEM` cell, removed when dug;
- big gem images;
- chests: walking into one opens it and gives sparkles;
- decorations;
- the first time in each layer: a banner with a swatch of the layer's colours, the layer number, and a ribbon for a record;
- `giveSparkles(a, n, x, y)`: sparkles fly to the player, and `a.pack.ores.sparkle` goes up without using backpack space.

**Digging a gem:**
- **A tiny gem** (an `afterMined` hook): 1 sparkle.
- **A big gem:** the mining target on a `RAINBOW_GEM_PART` cell is intercepted. When the dig finishes, don't clear the cell. Instead call `hitGem`: crack stage, shake and chips. On `broken`, clear all its cells (sync them), burst, and award its sparkles.

**The HUD:** the jar shows through `shownOres` (sparkle). The bag meter is hidden on rainbow. The depth flag is at `state.rainbow.deepest - world.top`.

- [ ] **Check in the browser:**
  - layers look different and the gradient shows;
  - all gem sizes, including smashing a massive one;
  - chests;
  - the banner;
  - going home.

  Then commit with the message `feat(rainbow): the endless mine`.

### Task 5: Rainbow Village

**Files:**
- Create: `src/scenes/camp/rainbowScenery.js` (backdrop: a striped sky and the rainbow arch; props: the lift over the shaft and the depth sign).
- Modify: `CampScene.js`:
  - the `GROUND`, `SCENERY`, `ROCKETS`, `SHIP` and `SHIP_X` entries;
  - the depth sign's number is `layerOfRow(state.rainbow.deepest)`;
  - on arrival, `rainbow.deepest = max(old, arrived.rainbowDeepest)` is saved.
- Modify: `SummaryScene` if needed (the sparkle row comes through `shownOres`).
- Modify: `README.md`.

- [ ] **Check in the browser:**
  1. a debug save with the Sun's Heart;
  2. build the Rainbow Rocket;
  3. fly there;
  4. ride the lift;
  5. dig;
  6. go home and see sparkles counted;
  7. the next trip starts deeper;
  8. screenshots;
  9. the console.

  Then run `npm test` and `npm run build`, and commit with the message `feat(rainbow): Rainbow Village`.
