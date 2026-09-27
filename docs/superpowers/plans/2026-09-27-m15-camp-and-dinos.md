# M15: Elevator, New Buildings and Dino Pets — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the deeper world reachable and rewarding from camp: an elevator to any layer you've reached, three new buildings (Dino Park, Toy Workshop, Rocket Ship) on three new plots, and two baby dinosaur pets.

**Architecture:** Pure rules go in `game/` (economy, perks, pets, decor) and `world/worldgen.js` with tests first. Scenes (`CampScene`, `CampHudScene`, `MineScene` views) stay thin. Art for everything new goes in `src/art/` (drawn in code).

**Tech Stack:** Phaser 3.90, Vite, Vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-27-deeper-world-design.md` §4, §5, §6, §9, §10, §11.
- Camp grows to 108 cells; the new plots are at cells 86, 93 and 100; 9 plots in total.
- Costs: Dino Park 20 amber + 10 gold; Toy Workshop 30 brick + 10 gold; Rocket Ship 40 brick + 20 star + 1 Heart.
- The Dino Park gives +2 amber on each trip home. The Toy Workshop unlocks 4 brick decorations (castle, car, rainbow arch, robot) and a wind-up robot in camp.
- The T-rex roars every 8 s and poofs creatures within 5 blocks. The Triceratops counts as a second boulder pusher and lights boom blocks it touches.
- Dino eggs: 2 per mine in the dino layer, of the kinds you don't have yet.
- Icons only: nothing a child must read.
- The repo is public: no family names.

---

### Task 1: Rules (TDD)

**Files:**
- Modify: `src/game/economy.js`, `src/game/perks.js`, `src/game/pets.js`, `src/game/decor.js`, `src/save/save.js`, `src/world/worldgen.js`, `src/tuning.js`
- Test: `tests/game/economy.test.js`, `tests/game/perks.test.js`, `tests/game/pets.test.js`, `tests/game/decor.test.js`, `tests/save/save.test.js`, `tests/world/worldgen.test.js`

**Interfaces:**
- `PLOTS = 9`; `BLUEPRINTS` gains `dinopark`, `workshop`, `rocket`.
- `elevatorStops(state)` returns `[]` without a minecart, otherwise `[{ layer, row, open }]` for all 8 layers (`row` is `null` for dirt, else `LAYERS[layer].top + 1`; `open` when the layer is in `records.layers`, and dirt is always open).
- `dinoParkGift(state)` returns `{ state, ores }` (+2 amber with a park, else unchanged and `[]`).
- `decorUnlocked(state, id)`: brick decorations need the workshop; `BUYABLE` stays the full list and the stall filters it.
- `PET_KINDS` gains `rex` and `trike`; `DINO_KINDS = ['rex', 'trike']`; `roarTargets(enemies, x, y, r)` returns the enemies within `r` px.
- `generateMine(seed, { dinoEggKinds })` puts up to 2 eggs in the dino layer, with those kinds.
- Save: 9 plots; a 6-plot save migrates with its buildings kept.

- [ ] Write the failing tests, run them (FAIL), implement, run them (PASS), then commit.

### Task 2: Art

**Files:**
- Modify: `src/art/camp.js` (Dino Park, Toy Workshop, Rocket, brick decorations, trophies 6–8, padlock, `ore-heart`), `src/art/pets.js` (rex, trike), `src/art/finds.js` (dino egg frames), `src/art/deep.js` (camp robot reuses `toyrobot`)

- [ ] Draw, check in the browser, then commit.

### Task 3: Camp

**Files:**
- Modify: `src/scenes/CampScene.js`, `src/scenes/CampHudScene.js`, `src/scenes/camp/campPets.js`, `src/scenes/camp/perksView.js`

- [ ] Widen the camp: trees and the stall stay put, the new plots come past the meadow.
- [ ] The minecart opens an elevator picker of layer icons (padlocks on locked layers), and the trip starts at that row.
- [ ] The Dino Park gift flies into the bank on arrival; dino pets wander in the park.
- [ ] The workshop unlocks the brick decorations at the stall, and a robot toddles about.
- [ ] The Rocket shows an A prompt (the launch comes in M16).
- [ ] The bank shows the Heart once you have one.

### Task 4: Mine

**Files:**
- Modify: `src/scenes/MineScene.js`, `src/scenes/mine/petsView.js`, `src/scenes/mine/findsView.js`

- [ ] Dino eggs, the T-rex roar and the Triceratops boulder buddy.

### Task 5: Verify

- [ ] Browser: the elevator, each building being built, the dino pets in the mine and the camp. Send the screenshots, then commit.
