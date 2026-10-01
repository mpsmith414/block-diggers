# Block Diggers — the Build Yard's magic cloud — Design

**Date:** 2026-10-01
**Status:** chosen by the owner ("A sounds great", then "yes go for it").

**The problem:** building in the Build Yard is hard for a 6-year-old.
- **Building where you stand:** you can't put a block in the square you're in. Under your feet is the ground unless you jump, push down and press A in mid-air.
- **Reach:** you can only reach the 4 squares touching you.
- **Getting around:** your builds get in your way. Walls block you, and getting up on top needs lots of ladders.

## The idea

A magic cloud to ride. Riding it works like a paintbrush: float anywhere, even through your builds, and put blocks right where you are. Hop off to walk, jump and climb on what you made.

## Getting on and off

- **Hop on:** **Y** jumps (as today). A second **Y** while you're in the air (or on a ladder) puts a fluffy cloud under you, with a whoosh.
- **Hop off:** on the cloud, **Y** hops you off and you fall normally.
  - If you're inside a build at that moment, you **pop up** to the nearest free spot on top of it, so you never get stuck.
  - A Y that's still held after hopping off doesn't jump. Let go first.
- **Discovering it:** until you've ridden the cloud on this visit, every jump shows a small hint over your head while you're in the air: a Y button and a cloud.
- **Arriving:** you always arrive in the yard on foot. The cloud isn't saved.

## On the cloud

- **Flying:** the stick moves you in any direction, diagonals included, at `BUILD.flySpeed` (90 px/s; walking is 72). There's no gravity, and you drift through blocks; you're drawn in front of them, with the cloud under your feet.
- **Limits:** you stay inside the yard: from the top row of the sky, down into the dirt, never into the bedrock row, and never off either end.
- **Building:**
  - **A** puts your chosen block in **the square you're in** (your middle), if it's empty.
  - **B** takes away the block in the square you're in.
  - The same outline, see-through block, green A and red B as today show that square.
- **Painting:** **holding A** while you fly puts a block in each new empty square you pass through, and **holding B** takes blocks away as you go. Each square is done once per press, so holding still doesn't re-place or flicker.
- **The other player:** a player on a cloud never stops anyone building. A player standing or walking in a square still can't have a block put on them.
- **The gate:** A at the gate goes back to camp only when your feet are near the grass (within 2 squares). Flying high over the gate never sends you home.
- **Picking blocks:** LB/RB pick the block as usual.
- **Co-op:** each player has their own cloud.

## On foot (unchanged)

Walking, jumping (Y), ladders, springs and water work as now. A and B still build beside you, above your head (stick up) or under your feet (stick down).

## Art and sound

- **`yard-cloud`** (22×9): a fluffy white cloud with light-blue shading. It bobs gently under the rider.
- **`btn-y`** (10×10): a yellow Y button, in the style of `btn-a`, for the hint.
- **Sounds** use the existing whoosh (hopping on) and pop (hopping off). They're wired as `cloudOn` and `cloudOff` in the Build sound table.
- **The rider's pose:** standing, not walking, with the cloud under their feet.

## Code

- **`src/game/build.js`** (pure, tested):
  - `flyStep(p, moveX, moveY, dt)`: moves a rider in any direction, kept inside the yard;
  - `cellOf(p)`: the square a player's middle is in;
  - `popUp(grid, p)`: if a player overlaps a solid block, lifts them to stand in the nearest free square above, and returns whether it moved them.
- **`src/tuning.js`:** `BUILD.flySpeed: 90`.
- **`src/scenes/BuildScene.js`:**
  - the Y edge for hopping on and off, the cloud sprite, and the hint;
  - flying instead of `stepPlayer` while riding;
  - painting with A or B held;
  - leaving riders out of the bodies that block building;
  - the gate rule.
- **`src/art/build.js`:** `yard-cloud` and `btn-y`.
- **`src/audio/wire.js`:** `cloudOn` and `cloudOff`.
- **`README.md`:** the Build Yard section mentions the cloud.

## Testing

- **Unit tests:**
  - `flyStep` moves in 8 directions at the fly speed (diagonals aren't faster) and is clamped at every edge, never reaching the bedrock;
  - `cellOf`;
  - `popUp` lifts a player out of a single block and out of a tall pillar, and leaves a player in open air alone.
- **In the browser:**
  - hop on, fly up high, and paint a line;
  - put a block in the square you're in;
  - hop off inside a build and pop up on top;
  - try co-op with two clouds;
  - the gate only works near the grass;
  - screenshots.
