# Block Diggers — the Longneck's ceiling nibble — Design

**Date:** 2026-10-01
**Status:** chosen by the owner ("Ceiling nibbler", then "yes go for it").

**The problem:** the Longneck (Dino Planet's pet) used to step you up 2-block ledges. That changed how you move through the mine, which the owner doesn't want (the Yeti Cub's double dig had the same problem). Its new ability leaves walking, climbing and digging exactly as they are.

## The nibble

- **Every `PETS.nibbleEvery` seconds (3)** on a trip, the Longneck looks for ore in the ceiling above its player.
  - **Where it looks:** up to `PETS.nibbleUp` (3) blocks up, in the player's column and the one on either side.
  - **Which ore:** the lowest row first, and straight above before a diagonal.
  - **Only fair ore:** ore the player's drill could dig. It never skips ahead of the upgrades.
  - **Never touched:** anything that isn't ore (rock, air, hearts, chests, eggs).
- **What you see:** the Longneck stretches its long neck up to the ore (a green neck line that grows, then shrinks back), with a crunch and a sparkle.
- **What you get:** the ore goes to the player through `giveOre`, exactly like digging it. If the backpack is full, it drops as loose ore.
- **No holes:** the block becomes its layer's plain rock (`world.hostAt(y)`, or Earth's `HOST[layerAt(y)]`), so the mine's shape never changes.
- **Where it works:** every planet, because pets come on every trip.

## What goes away

- **The step-up:** the `stepUp` perk, the player's `stepUp` option and its 2-block step code, and the step-up's tests.
- **The README:** "The Longneck nibbles ore out of the ceiling above you."

## Code

- **`src/game/pets.js`:** `nibbleTarget(grid, cx, cy, pickLevel)` → `{ x, y, id, drop }` or `null`. It's pure.
- **`src/tuning.js`:** `PETS.nibbleEvery: 3` and `PETS.nibbleUp: 3`.
- **`src/scenes/mine/petsView.js`:** the timer, the neck, swapping the block to rock (redrawn with `mapView.sync`), and `giveOre`.
- **`src/audio/wire.js`:** `nibble` plays `crack`.

## Testing

- **Unit tests:**
  - it picks the lowest ore, straight above first;
  - it ignores sideways and below;
  - it ignores rock and hearts;
  - it ignores ore too hard for the drill;
  - the Longneck no longer steps you up a 2-block ledge.
- **In the browser:**
  - a trip with the Longneck, standing under ore: it nibbles, the block becomes rock, and the ore is in the backpack;
  - with a full backpack, the ore drops as loose ore.
