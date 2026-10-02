# Longneck Nibble Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the Longneck's 2-block step-up with a ceiling nibble that plucks ore from above.

**Architecture:** A pure `nibbleTarget` in `pets.js` chooses the ore. `petsView` runs it on a timer, swaps the block for its layer's rock and gives the ore with `giveOre`. The step-up perk and its player code are removed.

**Tech Stack:** Phaser 3, Vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-10-01-longneck-nibble-design.md`. `nibbleEvery: 3`, `nibbleUp: 3`.

### Task 1: The rules (and removing the step-up)
- [ ] **Tests.** In `tests/game/dinoRules.test.js`:
  - drop the two `stepUp` expectations and stop importing `stepUp`;
  - replace the "2-block ledge" test with one that checks the Longneck no longer steps you up: the same grid, walking with a Longneck save, ends up at `standAt(5, 9)`;
  - add the `nibbleTarget` tests listed in the spec.
- [ ] **Watch them fail.** Run `npx vitest run tests/game/dinoRules.test.js` and expect it to fail because `nibbleTarget` isn't exported.
- [ ] **Implement:**
  - add `nibbleTarget` to `pets.js` (for `dy` from 1 to `nibbleUp`, then `dx` in `[0, -1, 1]`, return the first cell with `dropOf(id)` where `mineTime(id, pickLevel)` is finite);
  - add `nibbleEvery` and `nibbleUp` to `PETS`;
  - remove `stepUp` from `perks.js`, from `MineScene` (its import, `this.stepUp`, and passing it to `stepPlayer`) and from `player.js` (the option and `canStep2`).
- [ ] **Check and commit.** Run `npm test`, then commit.

### Task 2: The nibble in the mine
- [ ] **The view.** In `petsView`, for the Longneck:
  1. count down `pet.nibbleT`;
  2. when it runs out, call `nibbleTarget(scene.grid, cx, cy, scene.upgrades.pick)`;
  3. if it finds ore, grow a neck line from the pet's head to the block, set the cell to its host rock, call `scene.mapView.sync(x, y)`, sparkle, emit `nibble`, and call `scene.giveOre(a, drop, x, y)`.
- [ ] **The sound.** Wire `nibble` to `crack`.
- [ ] **The README.** Update the Longneck line.
- [ ] **Check it.** Run `npm test` and `npm run build`. In the browser, check the nibble, that the block turns to rock, the full-backpack drop, and the console. Then commit.
