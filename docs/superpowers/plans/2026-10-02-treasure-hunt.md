# The Treasure Hunt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rainbow Village gets a Treasure Hall where Polly the parrot sells maps; each map marks an X a few layers down in the endless mine, holding a pirate chest with one of 12 treasures (shown in a walk-in hall) plus sparkles; a golden statue is the grand prize.

**Architecture:** Pure rules in `src/game/hunt.js` (placing the X, moving it, buying, opening). `generateRainbow` carves a sealed X cave when the map's X is in the trip's stretch. A mine view (`huntView`) draws the chest and the glowing X and opens it; the mine HUD draws the compass arrow and the X on the depth strip. The camp gets the hall building, Polly and the door; a new `TreasureHallScene` is the room.

**Tech Stack:** Phaser 3.90, Vite, Vitest. All art drawn in code at boot (`src/art/*`).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-10-02-treasure-hunt-design.md`.
- Hall 500 sparkles; map 100; X 3–5 layers below your deepest; chest 150–250 sparkles; golden map / after the grand prize 300–500; glowing X within 8 blocks; X cave 5 wide × 3 tall.
- Block ids are append-only (none needed here). Save goes to **v13**; old saves migrate with nothing lost.
- Gold = rewards, green A = "you can", red numbers = "not yet".
- Never commit `tools/trailer/`. Don't merge or push until the owner says yes.

## File map

- Create `src/game/hunt.js` (rules), `tests/game/hunt.test.js`.
- Create `src/art/hunt.js` (treasures, pirate chest, X, map icon, Polly, hall building, room pieces).
- Create `src/scenes/mine/huntView.js` (chest, X, opening).
- Create `src/scenes/TreasureHallScene.js` (the room).
- Modify `src/tuning.js` (`HUNT`, `RAINBOW_CAMP`), `src/game/economy.js` (blueprint), `src/save/save.js` (v13), `src/game/stickers.js` + `src/game/decor.js` + `src/art/camp.js` (two pages, two trophies), `src/world/rainbow.js` (X cave), `src/scenes/MineScene.js`, `src/scenes/HudScene.js`, `src/scenes/mine/rainbowView.js` (expose `give`), `src/scenes/CampScene.js`, `src/scenes/CampHudScene.js` (map in hand), `src/scenes/common/gearView.js` (gold tint), `src/audio/wire.js`, `src/main.js`, `src/art/textures.js`, `src/dev/harness.js`, `README.md`, tests that pin version 12 / 4 rainbow plots / 26 pages.

---

### Task 1: The rules (`hunt.js`) and `HUNT` tuning

**Files:** Create `src/game/hunt.js`, `tests/game/hunt.test.js`; modify `src/tuning.js`.

**Interfaces — Produces:**
- `HUNT` (tuning): `{ hall: 500, map: 100, layers: [3, 5], inLayer: [8, 24], edge: 4, chest: [150, 250], golden: [300, 500], glow: 8, cave: { w: 5, h: 3 } }`
- `HUNT_TREASURES: string[]` (12 ids), `STATUE = 'statue'`, `TREASURE_NAMES: Record<id, string>`
- `huntOf(state) → { map: null | { row, col, golden }, found: string[], shown: string[] }`
- `placeX(rng, deepest) → { row, col }` (absolute planet row)
- `mapStatus(state) → 'ok' | 'have' | 'poor'`
- `buyMap(state, rng) → state | null`
- `checkPassed(hunt, deepest, rng) → hunt` (same object when nothing changes)
- `openChest(hunt, rng) → { prize: id | 'statue' | null, sparkles, hunt }`
- `newlyFound(hunt) → string[]`, `markShown(hunt) → hunt`, `hasStatue(hunt)`, `allTreasures(hunt)`

- [ ] **Step 1: failing tests** covering: `placeX` lands 3–5 layers below the deepest layer, at rows 8–24 inside its layer, columns 4..43; `buyMap` costs 100, refuses a second map and a poor bank, marks `golden` only after all 12; `checkPassed` keeps the map until `deepest > row`, then moves it 3–5 layers below the new deepest; `openChest` never repeats a treasure across 12 opens, gives 150–250, then the statue with 300–500, then sparkles only (300–500) with `prize: null`; `newlyFound`/`markShown`.
- [ ] **Step 2:** `npx vitest run tests/game/hunt.test.js` → FAIL (module missing).
- [ ] **Step 3:** implement `hunt.js` (pure; imports `layerOfRow` from `world/rainbow.js`, `canAfford`/`spend` from `economy.js`, `RAINBOW`, `MINE_W`, `HUNT` from `tuning.js`):

```js
export function placeX(rng, deepest) {
  const n = layerOfRow(deepest) + rng.int(HUNT.layers[0], HUNT.layers[1]);
  return { row: (n - 1) * RAINBOW.layerRows + rng.int(HUNT.inLayer[0], HUNT.inLayer[1]), col: rng.int(HUNT.edge, MINE_W - 1 - HUNT.edge) };
}
export function openChest(hunt, rng) {
  if (!hunt.map) return null;
  const left = HUNT_TREASURES.filter((t) => !hunt.found.includes(t));
  const prize = left.length ? rng.pick(left) : hasStatue(hunt) ? null : STATUE;
  const range = left.length ? HUNT.chest : HUNT.golden;
  return { prize, sparkles: rng.int(range[0], range[1]), hunt: { ...hunt, map: null, found: prize ? [...hunt.found, prize] : hunt.found } };
}
```
- [ ] **Step 4:** tests pass.
- [ ] **Step 5:** commit `feat(hunt): the treasure hunt's rules`.

### Task 2: Save v13, the fifth plot, the hall blueprint, the sticker pages

**Files:** `src/tuning.js`, `src/game/economy.js`, `src/save/save.js`, `src/game/stickers.js`, `src/game/decor.js`, `src/art/camp.js`; tests `tests/save/save.test.js`, `tests/game/economy.test.js`, `tests/game/stickers.test.js`, `tests/game/ores.test.js`, `tests/game/hunt.test.js`.

- `RAINBOW_CAMP = { ...MOON_CAMP, w: 72, plots: [26, 33, 40, 47, 54] }`.
- `RAINBOW_BLUEPRINTS` gains `{ id: 'treasurehall', cost: { sparkle: 500 } }` (not in `SHOPS`).
- Save `VERSION = 13`; `defaultState().hunt = { map: null, found: [], shown: [] }`; migration step `11→12→13` adds nothing but the default; `migrate` fills `hunt: { ...d.hunt, ...(s.hunt || {}) }` with arrays checked. The rainbow plots grow to 5 automatically via `PLOTS_AT.rainbow`.
- Stickers: page 26 `rainbowtreasures` (icon `treasure-crown`): `hunt-<id>` ×12 with icon `treasure-<id>`; page 27 `rainbowvillage` (icon `bld-treasurehall`): `bld-hatshop`, `bld-shoeshop`, `bld-gadgetlab`, `bld-decoshop`, `bld-treasurehall`, `hunt-map` (icon `hunt-map`), `hunt-golden` (icon `hunt-map-golden`), `hunt-statue` (icon `hunt-statue-icon`). New chapter `{ id: 'rainbow', icon: 'planet-rainbow', pages: [26, 27] }`. `TROPHY_COUNT = 28`, two more `TROPHY_GEMS`.
- [ ] Tests first (version 13 via `VERSION`, a v12 save migrates with `hunt` defaults and 5 rainbow plots keeping its 4 shops, `PLOTS_AT.rainbow === 5`, 28 pages / 276 stickers, the rainbow chapter), then code, then green, then commit `feat(hunt): save v13, the fifth village plot, the hall and its sticker pages`.

### Task 3: The X cave in the endless mine

**Files:** `src/world/rainbow.js`, `tests/world/rainbow.test.js`.

- `generateRainbow(seed, deepest = 0, { x = null } = {})`. When `x` is given and `top <= x.row - HUNT.cave.h` and `x.row < floorAbs - 1`: the cave covers grid cells `x.col-2..x.col+2` × `gy-2..gy` (`gy = x.row - top`); a ring one cell wider is `blocked` (like the starting cave) for gems, chests, decorations, pools and nooks. After everything, carve the inside to air, set the ring to `RAINBOW_ROCK` (sealed) and return `huntChest: { x: x.col, y: gy }` (else `null`).
- [ ] Tests: carved only when in the stretch; inside is air, ring is rock, the chest sits on rock; no gem cell, chest or decoration inside the ring; the same seed without `x` is unchanged elsewhere (the layer's gems are the same count). Commit `feat(hunt): the X cave in the endless mine`.

### Task 4: The art (`src/art/hunt.js`)

Textures (all registered from `textures.js` via `drawHuntArt(scene, canvasTexture, rect)`):
- `treasure-<id>` ×12, 16×16 each, gold-and-gem pixel art (crown, ship in a bottle, pearl in clam, spotted dragon egg, coin pile, rainbow trophy, smiling crystal skull, golden bone, magic lamp, spiral unicorn horn, globe on a stand, golden rubber duck).
- `hunt-chest` 2 frames of 24×18 (closed with a gold lock; open with gold spilling and a glow); `hunt-x` 48×32 red painted X; `hunt-map` and `hunt-map-golden` 12×12 rolled parchment with a red X; `hunt-statue-icon` 12×14 golden figure on a plinth.
- `polly` 2 frames 16×16 (sitting, wings up), green-red-yellow parrot with a little pirate hat; `bld-treasurehall` 96×80 (a gold-domed hall with a rainbow banner, columns, a big arched door on the right, Polly's perch post and a price board on the left).
- Room pieces: `hall-pedestal` 16×20, `hall-plinth` 48×16, `hall-banner` 16×32, `hall-column` 12×80, `hall-door` 32×48.
- [ ] Draw, register, boot the dev server and check no console errors; commit `feat(hunt): the treasure hunt's art`.

### Task 5: The hunt in the mine (HUD arrow, depth strip X, the chest)

**Files:** create `src/scenes/mine/huntView.js`; modify `MineScene.js`, `HudScene.js`, `rainbowView.js`, `audio/wire.js`.

- `MineScene.create` (rainbow): `const moved = checkPassed(huntOf(saved), startDeepest, this.rng0)`; save it if it changed; pass `{ x: moved.map }` to `generateRainbow`; `this.huntView = world.huntChest ? createHuntView(this) : null`; call `huntView.update(dt)` in `update`, and add its lights.
- `huntView`: the chest sprite on its cell; the big X centred on the cave, visible (pulsing alpha, a soft glow) while any player is within `HUNT.glow` cells and the chest is shut; walking into the chest opens it → `openChest` on the saved hunt, `setState`, sparkles through `rainbowView.give` (×`GEAR_TUNE.luckyMul` with Lucky Gloves), `trip.chests++`, `chestOpened`, `discover` fanfare, flash, confetti, `earnSticker('hunt-<prize>')`, and `Hud.treasureCard(prize)`. `target()` returns the chest's pixel centre while shut.
- HUD: rainbow panels show `hunt-map` (golden when golden) and an `arrow-r` rotated toward `target()` in the backpack row; the depth strip shows a red X at the chest's row while shut; `treasureCard(prize)`: a big gold-framed card with the treasure (×3) and its name, like `rainbowBanner`.
- [ ] Browser check with the harness (put a map in the save, `h.quick('Mine', { planet: 'rainbow' })`, `h.goCell` near the X, screenshots of the arrow, the X and the open chest). Commit `feat(hunt): the map in the mine: arrow, X and pirate chest`.

### Task 6: The hall and Polly at Rainbow Village

**Files:** `CampScene.js`, `CampHudScene.js`, `audio/wire.js`.

- `addExtras` for `treasurehall`: Polly on her perch (bobbing, flapping now and then), the price board (sparkle icon + `100`, red when you can't afford it; a map icon instead when you hold one).
- `zoneOf`: on the hall's plot, cells 0–1 → `{ kind: 'polly' }`, cells 2–5 → `{ kind: 'halldoor' }`.
- A at Polly: `mapStatus` → `ok`: `buyMap`, save, `syncBank`, a map flies from Polly to the player, `squawk`, sticker `hunt-map` (and `hunt-golden` for a golden one); `have`: Polly shakes her head + `nope`; `poor`: `nope` and the board flashes red.
- A (or up) at the door: fade, `scene.start('Hall')`. Back from the hall: `Camp` with `{ planet: 'rainbow', fromHall: true }` spawns players at the door.
- `CampHudScene`: a small map icon by the sparkles while you hold one.
- [ ] Browser check (build the hall, buy a map, try again, walk in). Commit `feat(hunt): the Treasure Hall and Polly's maps`.

### Task 7: `TreasureHallScene`

**Files:** create `src/scenes/TreasureHallScene.js`; modify `src/main.js`, `audio/wire.js`, `common/gearView.js`.

- A 44-cell-wide room (`HALL = { w: 44, h: 14, ground: 11, door: 3, first: 8, step: 2.5, plinth: 40 }`), walls, gold-purple back wall with banners and columns, a red carpet; the door on the left.
- 12 pedestals: a found and shown treasure bobs and glows; an unfound one shows a faint `?`. The big plinth at the end shows the statue(s): each player's `char-<char>` frame 0, scale 3, gold tint, with their gear via `gearView` (tinted gold through a new `a.gold` field), and a shine sweep.
- New ones (`newlyFound`): one after another, the treasure drops onto its pedestal, sparkles, confetti, `fanfare`; then `markShown` is saved.
- A at the door (or B) → back to camp. Pause and Gear pages work (`gearChanged` re-dresses statues).
- [ ] Browser check (hunt state with some found, some new, then 12 + statue). Commit `feat(hunt): the Treasure Hall room`.

### Task 8: Harness, README, full check

- `h.hunt(patch)` sets `state.hunt` quickly; README gains the treasure hunt.
- [ ] `npx vitest run` all green; full browser pass (build hall → buy map → mine → open chest → hall fanfare → golden map → statue) with screenshots; commit `docs(hunt): README`.
