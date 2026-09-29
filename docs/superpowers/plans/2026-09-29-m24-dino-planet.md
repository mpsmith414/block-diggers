# M24: Dino Planet — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dino Planet as planet 4, following the Saturn recipe. Spec: `docs/superpowers/specs/2026-09-29-dino-planet-design.md`.

**Architecture:** Data in the planet tables, a generator on `world/planetgen.js`, and two art files. The new rules are dino rides (a powerup), the jetpack and 2-block step-ups (in `stepPlayer`), and three treasure loots.

**Tech Stack:** Phaser 3.90, Vite, Vitest.

## Global Constraints

- Icons and sounds only: nothing a child needs to read.
- Gentle: rides and the jetpack only help.
- Old saves load with nothing lost (v7 → v8).
- Block ids and tileset frames are only ever appended.
- The Earth, the Moon, Mars and Saturn play exactly as before.

---

### Task 1: Dino rules (TDD) — `tests/game/dinoRules.test.js`

**Tuning:**
- blocks 82–93;
- `MINE_TIME` grows to 18 levels;
- `DINO_LAYERS` and `DINO_GEN`;
- `LAYER_COLORS`;
- `BACKPACK` and `LANTERN` get level 8;
- `RIDE`, `JET`, `PERKS.jet`.

**Tables:**
- the recipe, `ROCKET_TO.sun`;
- `DINO_BLUEPRINTS`, and the upgrades for tiers 15–17;
- `HEARTS.dino`, `nestLoot`, `skullLoot`, `stegoLoot`;
- the creatures;
- `BADGE_LAYERS`;
- `DINO_KINDS = ['longneck']`;
- `jetpack(state)` and `stepUp(state)`.

**The player:**
- the powerups `startRide` and `ride`;
- `multipliers().jump`;
- the `stepPlayer` options `jumpMul`, `jetpack` and `stepUp`.

### Task 2: Generator (TDD) — `world/dinoworld.js`, `tests/world/dinoworld.test.js`

### Task 3: Stickers (190 on 19 pages) and save v8 (TDD)

### Task 4: Balance bot `play('dino')` — 12–24 trips, in order

### Task 5: Art

**`art/dinoWorld.js`:**
- tiles and back walls;
- ore icons;
- the creatures;
- decor;
- the parasaur, the nest, the skull and the stego;
- the Heart;
- the worn jetpack;
- the Longneck and its egg colours;
- the drills, badges and icons.

**`art/dinoBase.js`:**
- the four buildings;
- the tree fern, the volcano and the ptero taxi;
- the Dino ship (split from the Dino Rocket).

### Task 6: Scenes

- **`MineScene`:**
  - the sky and lander;
  - rides (mounting, the ride sprite, trampling creatures, dismounting);
  - the jetpack's flames;
  - the Longneck's step-ups.
- **`findsView`:** the nests, the skull and the stego.
- **`CampScene`:** the scenery, the building extras and the ships.
- **The HUD:** the banners.
- **The sounds.**
- **Pets and the suit:** the Longneck's frames, and the jetpack on the characters.
- **Other scenes:** `LaunchScene`, the book, and the title screen.

### Task 7: Verify and polish

- Screenshots go to the owner.
- Iterate until the self-score is at least 8.5.
- Update the README and the memory file.
