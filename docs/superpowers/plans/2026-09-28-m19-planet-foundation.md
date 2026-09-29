# M19: The Planet Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** All the rules for the planet system and the 5-layer Moon, as pure tested modules. The game keeps running at the end of this milestone: scenes are only adapted to the new signatures.

**Architecture:** A planet table (`game/planets.js`) becomes the one place that knows each planet's layers, ores, gravity and camp. Every rule that used Earth's `LAYERS` directly takes a planet id instead, with `'earth'` as the default so existing calls keep working. The Moon generator is rewritten around its 5 layers.

**Tech Stack:** Phaser 3.90, Vite, Vitest.

## Global Constraints

- Icons and sounds only: nothing a child needs to read.
- Gentle hazards: bonks scatter ore and never end a trip.
- Old saves must load, with nothing lost (v4 → v5).
- Block ids and tileset frames are only ever appended.
- The repo is public: no family names.

---

### Task 1: The planet table, ores, blocks and tool tiers
**Files:**
- Create: `src/game/planets.js`, `tests/game/planets.test.js`
- Modify: `src/world/blocks.js`, `src/tuning.js`

**Interfaces (produced):**
- `PLANETS`: an ordered array of `{ id, layers, ores, gravity, suit, comingSoon, camp }`.
  - Earth: `layers: LAYERS`, `gravity: 1`, `suit: null`.
  - Moon: `layers: MOON_LAYERS`, `gravity: LOW_GRAVITY`, `suit: 'helmet'`.
  - Mars, Saturn and Dino Planet: `comingSoon: true`.
  - Sun: `comingSoon: true`, `finale: true`.
- `planetById(id)`, `layersOf(id)`, `layerOfRow(row, id = 'earth')` (clamps above to the first layer and below to the last), `planetOfLayer(layerId)`, `mineRows(id)`.
- `MOON_LAYERS` in tuning: `craters` 1–50, `cheesecaves` 51–100, `mooncrystal` 101–150, `alienbase` 151–200, `mooncore` 201–250; `MOON_H = 252`. `LAYER_COLORS` gains the five Moon layers.
- `ORES` gains `moonstone`, `cheese`, `spacegem` and `gizmo`, in that order.
- New blocks:
  - host rocks: `CHEESE_ROCK`, `MOON_CRYSTAL`, `ALIEN_PANEL`, `MOON_CORE`;
  - ores: `MOONSTONE` (on moon rock), `SPACE_GEM` (on moon crystal), `GIZMO` (on panels);
  - finds: `CHEESE_WHEEL` (a boulder), `TELEPORT` (not solid), `MOON_HEART`, `UFO` (not solid; a special chest).
  - `B.CHEESE` now drops `'cheese'`. `B.SPACE_CRYSTAL` stays (moon-rock ore) and now drops `'spacegem'`.
- New hardnesses: `cheese` (soft-ish, tier 5 fast), `mooncrystal` (tier 6+), `alien` (tier 7+) and `mooncore` (tier 8). Every `MINE_TIME` row grows to 9 tool levels (0–8).
- `BACKPACK` and `LANTERN` each gain a 6th value (320 and 13).
- `isBoulder(id)`: true for `BOULDER` and `CHEESE_WHEEL`.

**Tests:**
- The planet order is earth, moon, mars, saturn, dino, sun.
- `layerOfRow(75, 'moon')` is `'cheesecaves'`, and `layerOfRow(999, 'moon')` is `'mooncore'`.
- `planetOfLayer('alienbase')` is `'moon'`, and layer ids are unique across planets.
- The hardness ladder: Moon crystal needs pick level 6, alien panels 7 and the Moon core 8; the Star Drill (5) digs moon rock and cheese rock.
- Drops: `CHEESE` gives `cheese`, `SPACE_GEM` gives `spacegem`, `GIZMO` gives `gizmo`.

### Task 2: The 5-layer Moon generator
**Files:** `src/world/moon.js` (rewrite), `tests/world/moon.test.js` (rewrite)

**Interfaces (produced):** `generateMoon(seed, { pupEgg = true } = {})` returns `{ grid, chests, decor, eggs, bigChest: null, boulders, fossils: [], heart, teleports, ufo, chimes, spawn, seed, moon: true }`.
- **`heart`:** `{ x, y, kind: 'moon' }`, the 3×3 `MOON_HEART` in the bottom rows of the core.
- **`boulders`:** the cheese wheels, in the cheese caves.
- **`teleports`:** `[{ a: {x, y}, b: {x, y} }]`, 2–3 pairs of pads on alien-base floors.
- **`ufo`:** `{ x, y }`, a 3-wide floor spot in the alien base.
- **`chimes`:** `[{ x, y }]`, singing crystals on crystal-cave floors.
- **`eggs`:** `[{ x, y, kind: 'moonpup' }]` in the crystal caves when `pupEgg` is true.

**Tests:**
- The grid is 252 rows. Each layer's host rock dominates its rows, and each layer's ore is present in it.
- Walls and the floor are bedrock.
- The Heart is 3×3, inside the core, with bedrock underneath.
- Teleport pads come in pairs, each on a floor, and at least 8 cells apart.
- The UFO spot has room.
- There's 1 pup egg with `pupEgg` and none without.
- Chests are in every layer.
- Everything is deterministic by seed.

### Task 3: Planet-aware rules
**Files:**
- `src/game/hazards.js`, `src/game/trip.js`, `src/game/loot.js`, `src/game/finds.js`, `src/game/perks.js`, `src/game/economy.js`, `src/game/pets.js`, `src/game/player.js`, `src/game/ores.js`
- Their tests.

**Interfaces (produced):**
- **Creatures:**
  - `creatureFor(row, planet = 'earth')` gives the Moon's `moonblob` (walks), `mouse` (walks), `jelly` (flies), `drone` (flies) and `sprite` (flies).
  - `spawnSpot(grid, rng, { walker, near, avoid, planet })` uses the planet's layers.
- **Layers and trips:**
  - `layersReached(deepest, planet = 'earth')`.
  - `discovery(row, known, planet = 'earth')`: badge layers are Earth's four deep ones plus all five Moon layers.
  - `summarizeTrip({ ..., planet })` keeps Earth's `records.deepest` and adds `records.planetDeepest[planet]`, adds that planet's layers to `records.layers`, and counts `moonTrips`.
- **Loot:**
  - `chestLoot(row, rng, planet = 'earth')`: Moon chests hold their layer's ore.
  - `ufoLoot(rng)`: 6–8 gizmos plus 2–3 space gems.
  - `cheesePartyLoot(rng)`: 8–10 cheese.
  - `moonMeteoriteLoot(rng)`: moonstone.
  - `pushBoulder` keeps the pushed block's own id.
  - `boulderMeet(grid, x, y)`: true when two cheese wheels touch side by side.
  - `heartLeft(grid, heart)` counts `MOON_HEART` for a Moon heart.
- **Economy:**
  - `UPGRADES.pick` gets tiers 6–8, and `pack` and `lantern` each get one more level.
  - `MOON_BLUEPRINTS`, with costs from the spec; `marsrocket` has `needs: { suit: 'helmet' }`.
  - `blueprintsFor(planet)`, `plotsOf(state, planet)`, `buildOnPlot(state, plot, id, planet = 'earth')` (moon plots are `state.bases.moon.plots`), `blueprintOk(state, bp)`.
- **Perks:**
  - `hasBuilt(state, id, planet)`.
  - `lanternRadius(state)` = `LANTERN[level] + (suit has helmet ? 2 : 0)`.
  - `elevatorStops(state, planet = 'earth')`: the Moon uses `hangar`.
  - `cheeseFactoryGift(state)`: +3 cheese.
  - `revealsChests(state, planet)`: the tower on Earth, the telescope on the Moon.
  - `winSuitPiece(state, piece)`.
- **Pets and the player:**
  - `MOON_KINDS = ['moonpup']`, added to `PET_KINDS`.
  - `stepPlayer(..., { airJumps })`: one extra jump in mid-air when `airJumps > 0`, reset on landing. The step returns `doubleJumped`.
- **HUD:** `shownOres(state, planet = 'earth')`: Earth shows its 5 plus the deep ores found; the Moon shows the Moon ores found.

**Tests:** one or more for each function above, including the Mars rocket being refused without the Helmet and allowed with it.

### Task 4: Stickers and save v5
**Files:** `src/game/stickers.js`, `src/save/save.js` and their tests.
- **Stickers:** Space grows to 12, and there are new Moon Base (12) and Journey (7) pages, making 101 stickers on 12 pages.
- **Save v5:** `planet: 'earth'`, `bases.moon.plots` (4 slots), `suit: []`, `records.planetDeepest: {}`. The bank fills new ores with 0 and keeps cheese.
- **Tests:** a v4 save migrates with cheese kept; a v5 save round-trips.

### Task 5: Keep the game running
- Adapt the scene call sites to the new signatures (`MineScene` and the others pass `planet`; the Moon uses `generateMoon` and `MOON_H`).
- Remove the special case for Moon cheese: it's an ore now.
- Scale pets to `PETS.scale = 0.7`, and trail them closer.
- Run `npm test` and `npm run build` (both must be green). Smoke-test the Earth mine and the Moon mine in the browser. Commit.
