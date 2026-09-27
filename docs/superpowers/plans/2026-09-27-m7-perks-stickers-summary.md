# M7 — Save v3, Stickers, Building Perks, Trip Summary — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Buildings help. Every trip ends with a summary card and records. Finding things earns stickers, with a toast.

**Spec:** `docs/superpowers/specs/2026-09-27-expansion-design.md` §1, §2, §5 (earning + toast), §10.

**How this plan is written:** each task fixes the interface and lists the behaviours its tests must cover. Tests are written first.

## Global Constraints

- Save `VERSION = 3`. Migration from v1 and v2 fills the new defaults and keeps unknown fields.
- Perks exactly as in spec §1 (house +10 pack, garden +3/trip up to 12, pen 1 gift/trip up to 3, tower reveals chests, minecart starts at row 42, statue luck ×2).
- Sticker ids are stable strings (`ore-coal`, `creature-slime`, `cave-grass`, `find-geode`, `bld-house`, `friend-bear`, …).
- A trophy is awarded once per completed page.
- Commit messages end with a blank line and `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

### Task 1: save v3
- `defaultState()` gains `records`, `stickers`, `trophiesAwarded`, `pets`, `decor`, `garden`, `pen`, `visitors`.
- **Tests:** v2 → v3 keeps the bank, upgrades and plots, and adds the defaults; v1 still migrates; a v3 save round-trips.

### Task 2: `game/stickers.js`
- `STICKER_PAGES` (6 pages of ids with an icon key each), `ALL_STICKERS`, `award(state, id)` → `{ state, isNew, trophy: pageIndex|null }`, `pageProgress(state, page)` → `{ have, total }`.
- **Tests:** there are 40 stickers across 6 pages, with no duplicates; awarding a new one says `isNew`, and a repeat doesn't; completing a page gives a trophy exactly once (the trophy decoration is added to stock); unknown ids are ignored.

### Task 3: `game/perks.js`
- `packCap(state)`, `luck(state)`, `revealsChests(state)`, `cartStartRow(state)` → a row or null, `growGarden(state, rng)`, `harvestGarden(state)` → `{ state, ores }`, `leavePenGift(state, rng)`, `collectPenGift(state, rng)` → `{ state, ores }`.
- **Tests:** the house adds 10 per player; the garden grows 3 a trip and caps at 12, favouring the ore you have least of; harvesting empties it; the pen caps at 3 gifts and each gift is one of the listed bundles; luck is 2 with the statue; the cart row is null without the minecart.

### Task 4: `game/trip.js`
- `summarizeTrip({ packs, deepest, chests, stickers }, records)` → `{ totals, deepest, chests, stickers, records, best: { deepest, mostOres } }`.
- **Tests:** totals add up across players; a new record sets `best` and updates the records; ties are not records.

### Task 5: scenes
- **Mine:**
  - tracks the deepest row, chests opened and stickers earned;
  - uses `packCap`;
  - starts at the cart row when started by cart;
  - awards stickers for ores, creatures (squash / bump), and decorations when lit;
  - the tower controls the chest dots on the depth meter (without it, dots appear once lit).
- **Toast:** `src/scenes/common/stickerToast.js`: the sticker icon slides in under the HUD with a chime.
- **Camp:**
  - on arrival, grow the garden, leave a pen gift, then show `SummaryScene`, then fly the ores;
  - harvest by walking through the garden;
  - collect gifts by walking over them;
  - "ride the cart" prompt on the minecart plot;
  - building stickers on completion.
- **Sticker art:** icons reuse existing textures (ores, decorations, buildings scaled down, characters) where possible.
- **Verify** in the browser: a trip → summary with a best ribbon → garden harvest → pen gift → cart start at the stone layer. Screenshots.
