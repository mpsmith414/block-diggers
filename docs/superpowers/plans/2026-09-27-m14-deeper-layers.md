# M14 — Deeper Layers — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Four new layers under the crystal caverns (Dino Bone Beds, Brick Caverns, Meteor Field, the Core), new ores (amber, brick, star shard), tool tiers 3–5, and save v4.

**Spec:** `docs/superpowers/specs/2026-09-27-deeper-world-design.md` §1–3, §10, §11.

## Steps (each committed on its own)
1. **Ores, blocks, tiers and save v4.**
   - `ORES` becomes 8: coal, iron, gold, diamond, emerald, amber, brick, star. `heart` is a separate bank key.
   - Blocks 29–38 are defined with hardness `sand` / `bricks` / `meteor` / `core`, and `MINE_TIME` has 6 tiers.
   - Upgrade costs for L3–L5, backpack 180/250, lantern 9/11.
   - Save v4: 9 plots, the new bank keys, `records.layers` and `records.moonTrips`.

   **Tests:** hardness by tier, costs, migration.
2. **Worldgen for layers 5–8.** Host rock and ores by layer; oases (dino and brick layers); spring blocks (brick); meteorites (meteor); lava in the core; the Heart (3×3) at the bottom of the core; dino skeleton decorations; `MINE_H` becomes 390.

   **Tests:** layers, ores, the Heart, reachability.
3. **Physics:** low gravity in the meteor field (a `gravityAt(row)` passed in); spring blocks bounce you up.

   **Tests.**
4. **Creatures by layer:** pterodactyls (dino), wind-up robots (brick), aliens (meteor), wisps (core). Spawning is table-driven.
5. **Scene and art:**
   - tiles for the new blocks and back walls;
   - the creatures;
   - discovery banners;
   - the depth meter with 8 bands and a deepest-ever flag;
   - HUD / bank / summary show only discovered ores;
   - the Heart item and its sticker;
   - pick tiers 3–5 look (drills spin).
6. **Verify** in the browser, then screenshots.
