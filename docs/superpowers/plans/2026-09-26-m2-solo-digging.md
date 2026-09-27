# Block Diggers — Milestone 2: Solo Digging — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A player can press A, walk into a freshly generated mine, dig in four directions with the stick, climb auto-ladders, collect ores into a backpack, see by lantern light, and read ore counts on a HUD.

**Architecture:** Rules live in pure modules (`src/world/*`, `src/game/player.js`, `src/game/loot.js`) that take plain data and are tested in Node. Phaser scenes (`BootScene`, `MineScene`, `HudScene`) read input, call the rules each frame and draw the result. All textures are drawn in code at boot (`src/art/textures.js`).

**Tech Stack:** Phaser 3.90 (tilemap, render texture), Vitest 5.

**Spec:** `docs/superpowers/specs/2026-09-25-block-diggers-design.md` §1 (mine, movement, mining), §2 (look), §3 (architecture).

**How this plan is written:** each task fixes the module's interface and lists every behaviour its tests must pin down. The test file is written first from that list (TDD), then the implementation.

## Global Constraints

- Tile 16 px. Mine 48 × 150 cells. Bedrock at column 0, column 47 and row 149. Row 0 is grass with the shaft opening.
- Layers: dirt rows 1–40 (coal), stone 41–95 (coal, iron, gold), deep 96–148 (gold, diamond, emerald). An ore takes as long to mine as its host rock.
- Mining times (s) for wood/iron/diamond pick: dirt, gravel and grass 0.25/0.2/0.12; stone 0.6/0.4/0.25; deepslate ✗/0.7/0.4; bedrock ✗.
- Player box 12 × 14 px (fits 1-block tunnels). On diagonal input the larger axis wins (ties → horizontal).
- Every cell opened by mining up or down becomes a ladder. Mining down into open air extends the ladder down to the floor.
- Backpack capacity 20 / 40 / 80. Lantern radius 3 / 5 / 7 blocks.
- All tunables live in `src/tuning.js`.
- Modules in `src/world/`, `src/game/`, `src/input/` (except `tvGuard.js`) don't import Phaser and don't touch the DOM.
- Commit messages end with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## File Map

| File | Responsibility |
|---|---|
| `src/tuning.js` | every tunable number |
| `src/world/rng.js` | `createRng(seed)`: mulberry32 → `{ next(), int(a,b), pick(arr), chance(p) }` |
| `src/world/blocks.js` | block ids, table, `isSolid`, `hardnessOf`, `dropOf`, `ORES` |
| `src/world/grid.js` | `createGrid`, `mineTime`, `mineCell` |
| `src/world/worldgen.js` | `generateMine(seed) → { grid, chests, spawn, seed }` |
| `src/game/player.js` | `createPlayer`, `stepPlayer` (movement, auto-step, ladders, mining) |
| `src/game/loot.js` | backpack + pickups |
| `src/art/textures.js` | draws tileset, characters, icons, light brush |
| `src/scenes/BootScene.js`, `MineScene.js`, `HudScene.js` | the game |

---

### Task 1: tuning, rng, blocks, grid

**Interfaces (produces):**
- `createRng(seed:number)` → `{ next():[0,1), int(lo,hi) inclusive, pick(arr), chance(p):bool }`
- `B = { AIR, GRASS, DIRT, STONE, DEEP, BEDROCK, GRAVEL, COAL_DIRT, COAL_STONE, IRON, GOLD_STONE, GOLD_DEEP, DIAMOND, EMERALD, LADDER, LAVA, CHEST }` (0..16)
- `isSolid(id)`, `hardnessOf(id)` → `'soft'|'stone'|'deep'|'bedrock'|null`, `dropOf(id)` → ore name or null, `ORES = ['coal','iron','gold','diamond','emerald']`
- `createGrid(w, h, cells?)` → `{ w, h, cells:Uint8Array, get(x,y), set(x,y,id), inside(x,y) }`. Outside the sides or below the floor reads BEDROCK. Above row 0 reads AIR down to row `-SKY_ROWS`, BEDROCK above that.
- `mineTime(id, pickLevel)` → seconds, or `Infinity`
- `mineCell(grid, x, y, { ladder })` → `{ id, drop }`; sets LADDER (then extends ladders down through AIR below) or AIR.

**Tests must cover:** rng is deterministic per seed and differs across seeds; `int` stays within bounds; the full mining-time table; bedrock is ∞ for every pick; deepslate is ∞ for wood; ore blocks use their host's hardness; `mineCell` drops the ore; ladder vs air; ladders extend down to the floor; out-of-bounds reads.

- [ ] Write `tests/world/grid.test.js` + `tests/world/rng.test.js`, run (FAIL), implement, run (PASS), commit `feat(world): blocks, grid, mining times, seeded rng`.

### Task 2: world generation

**Interface:** `generateMine(seed)` → `{ grid, chests:[{x,y}], spawn:{x,y} (cell), seed }`.

**Rules:** host rock by layer; ore veins (clusters of 1–4) only replacing host rock of their layer; gravel pockets in stone and deep layers; caves carved by random walkers that stay inside their layer (bigger deeper); lava pools on deep-cave floors; exactly 3 chests on cave floors in rows 41–148, never on lava; shaft column 24 rows 0–3 are ladders; spawn is `{ x: 24, y: -1 }`.

**Tests must cover:** same seed → identical cells; different seeds differ; ores only in their layers (coal rows 1–95, iron 41–95, gold 41–148, diamond and emerald 96–148); bedrock exactly on the walls and floor and nowhere else; exactly 3 chests in rows 41–148, each with a solid, non-lava floor; lava only in rows 96–148; the shaft is ladders; flood fill through non-bedrock from the shaft reaches every non-bedrock cell. Run each over 20 seeds.

- [ ] Test, FAIL, implement, PASS, commit `feat(world): seeded mine generation`.

### Task 3: player movement and mining

**Interface:**
- `createPlayer({ x, y })`: pixel top-left of the box → `{ x, y, vx, vy, grounded, climbing, facing, mining:null|{cx,cy,t,need}, jumpHeld }`
- `stepPlayer(p, intent, grid, { pickLevel, dt })` → `{ mined: [{x, y, id, drop}], bounced: bool, stepped: bool }` (mutates `p` and `grid`)
- `playerCell(p)` → `{ cx, cy }` of the box centre.

**Rules:** larger axis wins. Stick left/right walks; blocked by a solid cell → auto-step if grounded, the cell above it is open and the cell above the player is open; otherwise mine it (hold until broken; target change resets progress). Down mines the cell below (grounded or climbing), or climbs down a ladder. Up mines the cell above (grounded or climbing), or climbs a ladder in or above the player. While climbing: no gravity, x eases to the column centre. Hanging on a ladder cell with no input: no fall. A ladder top acts as a floor unless climbing down. Jump (edge of A/X) only when grounded. Unmineable target → `bounced: true` once per contact.

**Tests must cover:** walking on flat ground; falling and landing; jump height ≈ 1.25 blocks; auto-step onto a 1-high ledge; a 2-high wall is mined instead; mine times with wood vs iron pick; deepslate bounces with wood; mining down and up leaves ladders; diagonal input picks the larger axis; standing on a ladder top; **dig down 12 cells, then holding up returns the player to the surface**.

- [ ] Test, FAIL, implement, PASS, commit `feat(game): player movement, mining, auto-step, auto-ladders`.

### Task 4: backpack and pickups

**Interface:**
- `createBackpack(cap)` → `{ cap, ores:{coal:0,…}, count }`; `addOre(pack, ore)` → bool; `packFull(pack)`.
- `createPickup({ x, y, ore, ttl = Infinity, delay = 0 })`; `stepPickups(list, grid, dt)` → new list (gravity to the floor, expires when `ttl` ≤ 0); `collectPickups(list, box, pack)` → `{ list, collected: [ore] }`. Delayed pickups can't be collected yet. A full pack collects nothing.

**Tests must cover:** cap; full pack refuses; pickups fall and rest on the floor; ttl expiry; delay; collect only overlapping pickups.

- [ ] Test, FAIL, implement, PASS, commit `feat(game): backpack and ore pickups`.

### Task 5: textures, scenes, darkness, HUD

**Files:** `src/art/textures.js`, `src/scenes/BootScene.js`, `src/scenes/MineScene.js`, `src/scenes/HudScene.js`, `src/main.js`, `src/input/session.js` (shared per-scene guard setup).

- `drawTextures(scene)`: tileset `tiles` (one 16 px frame per block id, air blank), characters `char-miner|fox|robot|dino` (2 frames: idle, step), ore icons `ore-<name>` (10 px), `light` radial brush, `pickup-<ore>`, `icon-full`.
- `installSessionGuards(scene, onBack)`: back guard + focus guard + idle cursor, torn down on scene shutdown. Replaces the inline setup in `InputTestScene`, which is deleted.
- `MineScene`: generates a mine from `Date.now()`, builds a Phaser tilemap from the grid (air = empty), joins players with A (players.js), steps each player, applies mined cells to the tilemap, turns mined ores into backpack items (or pickups if full), steps and collects pickups, and follows the player with the camera. Darkness: a render texture covering the mine at ¼ resolution, cleared to near-black below row 1 each frame, with the `light` brush erased at each player (radius = lantern).
- `HudScene` (runs on top): per-player corner with ore icons and counts, a backpack meter, and the full icon when full.

**Verification:** `npm test`, `npm run build`, then run the dev server, open it in the browser pane, press Space (keyboard joins as a player), dig with the arrow keys, and screenshot: tiles render, digging works, ladders appear, the lantern light follows, ore counts go up.

- [ ] Implement, verify in the browser, commit `feat: playable solo mine with lantern darkness and HUD`.
