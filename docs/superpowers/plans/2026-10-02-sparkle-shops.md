# Spending Sparkles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Rainbow Village gets four sparkle-bought shops, gear with powers (one per body part, swappable from the pause menu), and its own decorations.

**Architecture:**
- **Pure rules:**
  - `src/game/gear.js` holds the catalogue, owning, wearing and powers;
  - `decor.js` becomes per-camp;
  - `player.js` gains the movement powers.
- **Scenes** read a player's powers through `powersOf(state, slot)`:
  - `MineScene` caches them per avatar (`a.gear`) and recomputes on `gearChanged`;
  - `CampScene` reads them when stepping players.
- **`gearView`** (replacing `suitView`) draws each player's own worn items.

**Tech Stack:** Phaser 3, Vite, Vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-10-02-sparkle-shops-design.md`. Prices, ids and captions are copied from its tables.
- Old saves load with nothing lost (save v12). Block ids and tileset frames stay append-only (none are added here).
- Pets are untouched. Story locks read `state.suit`.
- No reading is needed to play: the captions are extra, for grown-ups.
- Never commit `tools/trailer/`.

---

### Task 1: The gear rules (pure)

**Files:** create `src/game/gear.js`; modify `src/tuning.js` (`GEAR`) and `src/save/save.js` (v12); test `tests/game/gear.test.js` and `tests/save/save.test.js`.

**Produces:**
- `SLOTS = ['head', 'back', 'feet', 'hands']`.
- `GEAR`: `[{ id, slot, shop, cost: { sparkle } | null, won: suitPieceId | undefined, power: string | null, caption }]`.
- `gearById(id)`; `shopItems(shopId)` (in catalogue order).
- `ownsGear(state, id)`: a won piece is owned if it's in `state.suit`; otherwise check `state.gear.owned`.
- `buyGear(state, id)` → the new state or `null`.
- `wornBy(state, slot)` → `{ head, back, feet, hands }`.
- `wearGear(state, slot, gearSlot, id | null)` → the new state or `null` (if the id isn't owned or is in the wrong slot).
- `powersOf(state, slot, { off = false } = {})` → `Set`.
- `anyoneWears(state, power)`.
- `wearWon(state, id)`.
- `GEAR` tuning: `{ bouncyJump: 1.42, glideFall: 40, balloonUp: 55, balloonLift: 500, skatesWalk: 1.25, magnetEvery: 3, magnetR: 3, luckyMul: 1.5 }`.
- **Save v12:**
  - `gear: { owned: [], worn: [emptyWorn(), emptyWorn()] }`;
  - `bases.rainbow: { plots: [null × 4], decor: { stock: {}, placed: [] } }`.
  - The migration wears the suit pieces you had; the fill normalises `gear` and `bases.rainbow`.

- [ ] Tests:
  - catalogue checks (slots, shops, captions, costs 100–1,500, won pieces have no cost);
  - buy (spends sparkles; refuses when short, won or already owned);
  - wear (owned only, slot check, `null` takes off, per player);
  - `powersOf` with `off`;
  - `wearWon` (both players);
  - the v11 → v12 migration (with and without suit pieces);
  - a default v12 save round-trips.
- [ ] Implement until green, then commit.

### Task 2: Perks read worn gear

**Files:** modify `src/game/perks.js`; test `tests/game/perks.test.js`.

**Changes:**
- `walkMul(state, slot = 0)`, `stormProof(state, slot = 0)`, `digMul(state, slot = 0)`, `iceGrip(state, slot = 0)` and `jetpack(state, slot = 0)` read `powersOf`.
- `lanternRadius(state)` reads `anyoneWears(state, 'light')`.
- `winSuitPiece` also does `wearWon`, and so does `winSunHeart` (for the crown).
- Existing perk tests that build a state with `suit: [...]` must also wear the pieces. A helper in the test (`suited(state, pieces)`) applies `wearWon` for each piece.

- [ ] Update the tests; implement; run the full suite (`npx vitest run`); commit.

### Task 3: Movement powers in `stepPlayer`

**Files:** modify `src/game/player.js`; test `tests/game/player.test.js`.

**Options:**
- **`glide`:** after normal gravity, if in the air, not climbing, not in water, `intent.jump` held and `vy > 0`: `vy = min(vy, GEAR.glideFall)`.
- **`balloon`:** in the air, not climbing, not knocked, with `jumpHeldT > JET.hold`: `vy = max(-GEAR.balloonUp, vy - GEAR.balloonLift * dt)`. It sets `out.floating`.
- **`gecko`:** after moving x, if `blockedX` and `ix` points the same way, and the player is in the air and not knocked: `vy = -PLAYER.climbSpeed`, and set `out.wallClimb`.
- **`skates`:** `onIce` is true on any floor while grounded (even with `grip`).
- Bouncy Feet and the skate speed are passed by callers through `jumpMul` and `walkMul`.

- [ ] Tests:
  - glide falls slower than without;
  - balloon rises after the hold and doesn't stop (2 s and still rising);
  - gecko climbs a wall column;
  - skates keep sliding after letting go on plain stone;
  - each option is off by default (no behaviour change).
- [ ] Implement, then commit.

### Task 4: Rainbow shops and per-camp decorations (pure)

**Files:** modify `src/tuning.js` (`RAINBOW_CAMP.plots = [26, 33, 40, 47]`), `src/game/economy.js` (`RAINBOW_BLUEPRINTS`), `src/game/decor.js` and `src/game/pets.js` (`magnetTarget`); test `tests/game/economy.test.js`, `tests/game/decor.test.js` and `tests/game/pets.test.js`.

**Produces:**
- `RAINBOW_BLUEPRINTS`: hatshop 300, shoeshop 600, gadgetlab 1,000, decoshop 1,500 (`cost: { sparkle }`).
- `SHOPS = { hatshop: 'hat', shoeshop: 'shoe', gadgetlab: 'gadget', decoshop: 'decor' }`.
- **`decor.js`:**
  - `RAINBOW_DECOR` (12 items, `camp: 'rainbow'`, `cost: { sparkle }`, widths);
  - `decorOf(state, planet = 'earth')`;
  - `itemsFor(planet)`;
  - a `planet` argument on `buyDecor`, `takeFromStock`, `canPlace`, `placeDecor`, `pickUpDecor` and `blockedRanges`. Rainbow's blocked ranges come from `RAINBOW_CAMP`: shaft, bench, lectern, nest, pad, the depth sign `[(shaftX - 4.6) * TILE, (shaftX - 1) * TILE]`, and empty plots;
  - `BUYABLE` stays Earth-only.
- **`magnetTarget(grid, cx, cy, pickLevel, r, ok = dropOf)`:** the nearest cell within the radius whose `ok(id)` is true and that the drill can dig.

- [ ] Tests:
  - blueprints, plots and buying with sparkles;
  - Rainbow decorations buy into `bases.rainbow.decor` and place in the village (and never on the pad or the lift);
  - Earth decoration tests unchanged;
  - `magnetTarget` picks the nearest and respects the radius and the drill.
- [ ] Implement, then commit.

### Task 5: Art

**Files:**
- create `src/art/gear.js` (worn overlays for all new items, the `power-*` pictures, slot icons `slot-head`/`slot-back`/`slot-feet`/`slot-hands`, `icon-hanger`);
- create `src/art/rainbowShops.js` (`bld-hatshop`, `bld-shoeshop`, `bld-gadgetlab`, `bld-decoshop` at 96×80, and `deco-<id>` for the 12 decorations, plus their `decorLook` entries in `src/art/decorItems.js`);
- modify `src/art/textures.js` (font letters; call the new drawers).

**Keys:**
- head overlays: `gear-<id>` at 16×24, origin bottom;
- back/feet/hands overlays: `gear-<id>` as 64×16 strips with frames 0–3;
- the existing suit keys are reused for won pieces (`GEAR_KEY` map in `gearView`).

- [ ] Draw everything. Check it by rendering a contact sheet in the browser (a dev-only harness call) and taking a screenshot. Commit.

### Task 6: `gearView`, plus powers in the mine and the camp

**Files:**
- create `src/scenes/common/gearView.js` (replacing `suitView.js`, which is deleted);
- modify `MineScene.js`, `CampScene.js`, `BuildScene.js` and `src/scenes/mine/bonusViews.js` (`inside(a)`), plus each bonus view's `contains(a)`;
- modify `src/scenes/mine/rainbowView.js` (`pluck(a, x, y)` for the magnet, `xray` glow, lucky sparkles), and `src/audio/sfx.js` (`squeak`, `boop`) plus its wiring.

**Mine:**
- `a.gear = powersOf(state, slot, { off: this.bonus.inside(a) })`, refreshed each step (it's cheap: a small Set).
- The step options come from it.
- `bonk` handles `shell` and `boxing`.
- `openChest(cx, cy, a)` applies `lucky`.
- Each avatar has a magnet timer.
- Effects: confetti on jump, a sparkle trail, and a squeak every other step.

**Camp:** movement powers when stepping players.

**`gearChanged`:** emitted on the target scene by the Gear page. It refreshes `gearView` and the light/x-ray.

- [ ] Wire it in, then check in the browser: each power in the Rainbow mine and on the Moon, and the bonus room off. Commit.

### Task 7: Shops at Rainbow Village

**Files:** modify `CampScene.js` (`shop` zone, picker options, confirm, decorations at Rainbow) and `CampHudScene.js` (`kind: 'gear'` card, the caption, the decor picker by planet).

**The gear picker:**
- options are `{ id, cost, owned, worn, locked, affordable }`;
- A buys and wears, wears an owned item, or takes off a worn one;
- `nope` when locked or short of sparkles.

- [ ] Browser: build all four shops, buy and wear something in each, and place decorations. Commit.

### Task 8: The Gear page

**Files:** create `src/scenes/GearScene.js`; modify `PauseScene.js` (hanger icon) and `src/main.js` (register the scene).

- One panel per joined player. Up/down picks a slot; left/right flips through the owned items and "nothing".
- B or Start closes it: resume the target and emit `gearChanged` on it.

- [ ] Browser: open it from the mine and from camp, in co-op; swap the jetpack for the glider mid-dig. Commit.

### Task 9: Finish

- [ ] Full test suite and `npm run build`.
- [ ] Browser pass with screenshots. Check the console.
- [ ] Update `README.md`'s feature list.
- [ ] Commit. Ask the owner before merging and pushing.
