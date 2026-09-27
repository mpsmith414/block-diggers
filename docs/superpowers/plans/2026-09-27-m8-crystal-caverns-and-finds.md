# M8 — Crystal Caverns and Finds — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A fourth layer (crystal rock, water, giant glowshrooms) and toys to find: geodes, fossils, boom blocks, pushable boulders, big co-op chests, golden slimes and pet eggs.

**Spec:** `docs/superpowers/specs/2026-09-27-expansion-design.md` §3, §6.

## Global Constraints

- Block ids 0–16 stay as they are (they are tileset frames). The new ids are appended: CRYSTAL 17, WATER 18, GEODE 19, FOSSIL 20, BOOM 21, BIGCHEST 22, BIGCHEST_R 23, BOULDER 24, EGG 25, GOLD_CRYSTAL 26, DIAMOND_CRYSTAL 27, EMERALD_CRYSTAL 28.
- Mine: 190 rows; crystal layer rows 149–188; bedrock floor on row 189. Crystal rock is diamond-pick only (0.6 s).
- Chests: 3 in rows 41–148, plus 1 in the crystal layer.
- Per mine: geodes 5, fossils 4, boom 6, boulders 4, big chest 1, eggs 2. With luck 2, geodes, fossils and eggs ×1.5 (rounded).
- Boom and boulder cells are never mined. Touching a boom lights it (the scene handles it); pushing moves a boulder.
- Water: gravity ×0.25, max fall 50, swim up at 70; jump out at the surface.

## Tasks

1. **Blocks and tuning** (ids, hardness `crystal`, specials). Tests: new blocks are solid or not as intended; crystal rock needs a diamond pick; the old ids are unchanged.
2. **Worldgen.** `generateMine(seed, { luck, eggKinds })` also returns `eggs`, `bigChest`, `boulders`, `fossils`. Tests:
   - crystal ores only in rows 149–188; water only in that layer;
   - 4 chests (one in crystal);
   - counts per luck;
   - each boulder has a floor and cave air on one side, with ore behind it;
   - the big chest is two cells on a floor;
   - eggs are on floors in rows 96+, with kinds from `eggKinds`, or golden when none are left;
   - bedrock on row 189;
   - reachability still holds.
3. **`game/finds.js`.** `explode(grid, x, y)`, `pushBoulder(grid, x, y, dir)`, `bigChestOpeners(needed, touching)`, `geodeLoot(row, rng)`, `FOSSIL_KINDS`. Tests:
   - the explosion clears the 3×3 but keeps bedrock, chests, boulders, eggs, ladders and water;
   - other boom blocks it reaches chain;
   - drops come back;
   - a boulder moves into air or water and falls to a floor;
   - a boulder won't move into rock;
   - geode loot suits its layer.
4. **Water physics in `player.js`.** Tests: sinks slowly; swims up; jumps out at the surface.
5. **Scenes and art.** Tiles for the new blocks; the crystal back wall; the crystal-layer decorations; `findsView` (lit booms flashing, boulder push timers, big-chest "together!" icon, eggs carried home); golden slimes; water bubbles; stickers for each find; HUD meter with the crystal band; bats down to row 188. Verify each in the browser with screenshots.
