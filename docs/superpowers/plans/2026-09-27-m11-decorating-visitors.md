# M11 — Camp Decorating and Visitors — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Spend ores on decorations you place anywhere around a wider camp. Friendly visitors move in as the camp grows and ask for ores in exchange for rewards.

**Spec:** `docs/superpowers/specs/2026-09-27-expansion-design.md` §7, §8.

## Tasks
1. **`game/decor.js`** (pure):
   - `DECOR_ITEMS`;
   - `buyDecor(state, id)`;
   - `takeFromStock(state, id)`;
   - `canPlace(state, id, x)`, which uses `BLOCKED_ZONES` and gaps between decorations;
   - `placeDecor(state, id, x)`;
   - `pickUpDecor(state, index)`.

   **Tests:** costs from the spec; buying spends and adds to stock; trophies can't be bought; you can't place in the blocked zones (shaft, bench, lectern, stall, nest, fire) or on an empty plot, but you can in front of a built one; there must be a gap from other decorations; picking up returns an item to stock.
2. **`game/visitors.js`** (pure):
   - `VISITORS`;
   - `presentVisitors(state)` (by buildings count);
   - `makeRequest(state, rng)` (an ore you've found; 5–15, or 3–6 for gems);
   - `refreshRequests(state, rng)`;
   - `fulfill(state, id, rng)` → `{ state, reward }` or null.

   **Tests:** arrival thresholds 2/4/6; requests only use ores you've found; request sizes; fulfilling spends, marks them met and clears the request; the rewards (3 diamonds / a random non-trophy decoration in stock / an egg of a missing pet or golden); not enough ore → null.
3. **Camp:**
   - the camp widens to 84 cells, with the stall at 63;
   - `decorView` draws the placed decorations (windmill blades turn, pond fish jump, lamps glow at night) and handles carrying (the item floats over the carrier's head; A places it, B puts it back in stock; the hand prompt picks up a placed one);
   - the stall picker lists decorations, with "in your bag" for stock items;
   - `visitorsView` shows friends wandering by their home with a request bubble; A fulfils it (ores fly out of the bank to them, hearts, reward), or the numbers go red if you're short.
4. **Verify** in the browser: buy and place several decorations; visitors appear; complete a request of each kind. Screenshots of a decorated camp at night and during the day.
