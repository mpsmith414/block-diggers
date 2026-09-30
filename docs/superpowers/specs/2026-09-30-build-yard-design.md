# Block Diggers — the Build Yard — Design

**Date:** 2026-09-30
**Status:** approved by the owner. They asked "What would the free build area look and feel and how would it be accessed?", saw a mockup and this design, and said "Okay go with recommendation". The blocks are unlimited, unlocked by exploring.

## Getting there

- **In:** a wooden gate with a block sign at the right end of Earth camp. Walk through it (keep going right) and the screen fades into the Build Yard.
- **Out:** the same gate at the yard's left edge takes you back, and you arrive at camp's right end.

## The yard

- **The meadow:** 72 × 30 cells, with grass on row 26, dirt below and bedrock at the bottom. That leaves about 25 blocks of sky for tall builds.
- **The sky** follows camp's time of day (and shows the mini-sun after the finale). There are flowers along the grass.
- **Saving:** whatever you build is saved as the cells that differ from the meadow (`state.build.edits: [x, y, block]`). That's save v10; older saves get an empty yard.

## Blocks

- **Unlimited.** Grass, dirt, stone and ladders are always there.
- **Unlocking:** reaching a layer on any planet unlocks its rock and treasure (`UNLOCKS` in `src/game/build.js`). Earth's first layers come from your deepest row.
- **Never available:** lava, boom blocks, chests, eggs and bedrock.

## Building

- **LB/RB** (keyboard Q/E) pick the block. The block bar at the bottom shows 7 blocks with the chosen one framed in the middle, and each player has their own bar.
- **Y** (keyboard B) places the block where you're pointing:
  - beside you (the way you face or push);
  - above your head (stick up);
  - under your feet (stick down, so you can jump and build a pillar under yourself).
- **A see-through preview** and a dashed outline show the spot.
- **You can't place a block inside a player,** but ladders and water are fine.
- **B** (keyboard H) takes the block away, with chunks.
- **Walking and climbing** work as usual: ladders let you climb, springs bounce and water can be swum in.

## Stickers (a new "Build" page)

The page has five stickers, which makes 256 stickers on 26 pages (`TROPHY_COUNT` is 26):
- visiting the yard;
- placing your first block;
- a tower 12 blocks tall;
- using 8 kinds of block;
- placing 100 blocks.

## Code

- **The rules:** `src/game/build.js` has `unlockedBlocks`, `createYard`, `yardEdits`, `placeBlock`, `removeBlock`, `aimCell`, `tallest` and `kindsUsed`. They're tested in `tests/game/build.test.js`.
- **The scenes:** `src/scenes/BuildScene.js` and `src/scenes/BuildHudScene.js` (the bar).
- **The art:** `src/art/build.js`.
- **Input:** `toIntent` gains `prev`/`next` (LB/RB), and the keyboard gains Q/E.
- **The camp gate:** `CampScene.goToYard` and `fromYard`.
