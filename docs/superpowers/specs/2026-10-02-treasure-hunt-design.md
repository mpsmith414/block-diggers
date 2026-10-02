# Block Diggers — The Treasure Hunt — Design

**Date:** 2026-10-02
**Status:** designed with the owner in conversation; each choice approved, and the whole design approved.

**Why:** project 3 of the end-game plan (see `2026-10-02-rainbow-planet-design.md`): "maps that send you to an X somewhere deep." It gives every Rainbow trip something to chase, and a collection to show off in the village.

## Owner decisions this spec follows

- **A map every trip, bought in the village.** Not a long torn-map quest.
- **The reward is special:** one-of-a-kind treasures shown in a Treasure Hall, **plus sparkles** in every chest so a map always pays for itself.
- **Guidance is easy:** the X on the depth strip, a compass arrow, and a glowing X on the rock when you're close. No warmer/colder guessing.
- **The map stays until found.** Going home early never wastes it.
- **The Treasure Hall sells the maps** (Polly the parrot by the door) and is **a room you walk into**.
- **The 12 treasures** are the draft list below, unchanged. They come out in random order.
- **The grand prize** is a golden statue of **the robot** (the owner's son always plays the robot; changed during the build at the owner's request).

## The Treasure Hall (Rainbow Village)

- **A fifth plot:** `RAINBOW_CAMP` becomes `{ ...MOON_CAMP, w: 72, plots: [26, 33, 40, 47, 54] }`, the same shape as the Solar Station. The extra 10 cells keep the cleared patch at the end of the village for project 4's stalls. `PLOTS_AT.rainbow` follows.
- **The blueprint:** `{ id: 'treasurehall', cost: { sparkle: 500 } }`, appended to `RAINBOW_BLUEPRINTS`. It's built like any building (no `needs`). It is not a shop, so it isn't in `SHOPS`.
- **Polly the pirate parrot** sits on a perch by the hall's door once it's built. She bobs and flaps now and then.
  - **Press A by Polly** to buy a map for **100 sparkles**. The map flies into the HUD with a little "squawk" and a toast.
  - **One map at a time.** If you already have one, Polly shakes her head and the toast shows the map icon (no sale).
  - **Not enough sparkles:** the normal red-number "not yet" price, as at the shops.
  - **After all 12 treasures**, she sells the **golden map** instead (same price), until the grand prize is found.
- **Press A (or up) at the hall's door** to go inside: the camera fades and `TreasureHallScene` starts, like the Build Yard. A (or up) at the door inside fades back to the village, standing at the hall.

## Inside the hall (`TreasureHallScene`)

- A long room, one screen and a bit wide, that scrolls with the players. Warm gold-and-purple walls, banners in rainbow colours, and a red carpet.
- **12 pedestals** in a row. Each shows its treasure (glowing softly, with a gentle bob) or a faint "?" outline if it's not found yet.
- **The big plinth** at the far end, empty with a "?" until the grand prize is found.
- **New treasures:** a treasure found since the last visit isn't on its pedestal yet. On entering, each new one drops onto its pedestal with a fanfare, a sparkle burst and confetti, one after another.
- Both players can walk around it in co-op. Gear powers work as they do at camp.

## The map in the mine

- **Placing the X:** buying a map marks an X at a **planet row 3–5 layers below your deepest point** (`state.rainbow.deepest`), at a random column. It's stored as absolute planet coordinates, so it waits in the same place across trips.
  - Each trip's stretch is 10 layers, so the X is always inside the first trip's stretch, and closer on every later trip.
- **The X cave:** when a trip's stretch contains the X, `generateRainbow` carves a small sealed cave there, **5 wide and 3 tall**, with the **pirate chest** in the middle of its floor. Gems are kept clear of it, like the starting cave. It never touches the floor of the stretch or the mine's edges (the column is clamped).
- **Passed it:** if `deepest` goes below the X's row and the chest wasn't opened, the X moves to a new spot 3–5 layers below the new deepest, at the start of the next trip. The map is never lost.
- **Finding it:**
  - **the depth strip** shows a red X at the X's depth;
  - **each player's HUD** gets a small compass arrow pointing from them to the X, with the map icon beside it;
  - **within about 8 blocks**, a big glowing painted X shows on the rock over the cave, pulsing gently, so the last bit of digging is easy to aim.
- **Opening the chest:** walk into it, like every chest. It opens with a big burst and a jingle. Whoever opens it gets the sparkles in their jar; the treasure is the team's.
- **Gear:** the **Lucky Gloves** boost the chest's sparkles (as for any chest), and the **X-ray goggles** show it through rock with a stronger glow.
- **Co-op:** one shared map. Both players see their own arrow.

## The chest

- **Normal map:** one random treasure you haven't found yet, plus **150–250 sparkles**.
- **Golden map** (after all 12): the **grand prize**, plus **300–500 sparkles**.
- **After the grand prize:** maps keep working forever, and each chest gives **300–500 sparkles**.
- A toast shows the treasure's picture and name ("GOLDEN CROWN!"). The trip card at home lists it.

### The 12 treasures (`HUNT_TREASURES`)

| id | Treasure |
|---|---|
| `crown` | golden crown |
| `bottleship` | ship in a bottle |
| `pearl` | giant pearl in a clam |
| `dragonegg` | dragon egg (it wobbles) |
| `goldcoins` | pirate's gold coins |
| `trophy` | rainbow trophy |
| `skull` | crystal skull (friendly, smiling) |
| `dinobone` | golden dino bone |
| `lamp` | magic lamp |
| `unicorn` | unicorn horn |
| `globe` | treasure globe |
| `duck` | golden rubber duck |

- Each one earns a sticker on a new **"Rainbow Treasures"** page (12 stickers: a page holds at most 12).
- A second new page, **"Rainbow Village"**, has the four shops, the Treasure Hall, your first map, your golden map and the statue (8 stickers). Both pages sit in a new Rainbow chapter of the book.

### The grand prize

- A **giant golden statue of the robot**, on the big plinth.
- It's the robot's own art turned to gold (every pixel mapped onto a gold ramp by its brightness), wearing whatever gear the robot's player is wearing now (player 1's if nobody is the robot), also in gold, with a shine sweeping across it now and then.

## Saving

- **Save v13:**
  - `state.hunt = { map: null | { row, col, golden }, found: [], grand: false }`;
  - `bases.rainbow.plots` grows to 5 entries.
- **Migration:** older saves get the defaults; nothing is lost.
- **When things save:** buying a map saves at once, and so does a treasure the moment its chest opens (like stickers). The chest's sparkles go in the jar and bank when the trip ends. A trip that ends without finding the X keeps the map.

## Code

- **`src/game/hunt.js`** (pure, tested):
  - `HUNT_TREASURES`, prices and payouts;
  - `placeX(rng, deepest)` → `{ row, col }`, 3–5 layers down, column clamped;
  - `checkPassed(hunt, deepest, rng)` → the same map, or one moved below;
  - `canBuyMap(state)` and `buyMap(state, rng)`: price, one at a time, golden after 12;
  - `openChest(hunt, rng)` → `{ treasure | 'grand' | null, sparkles }`, picking a random unfound treasure.
- **`src/world/rainbow.js`:** `generateRainbow(seed, fromRow, { x })` carves the X cave when the X is in the stretch and returns `huntChest`. Gems stay clear of it.
- **`src/scenes/mine/huntView.js`:** the pirate chest, the glowing X, opening, and the arrow and depth-strip data the HUD reads.
- **HUD:** the per-player compass arrow and map icon; the X on the depth strip.
- **`src/scenes/TreasureHallScene.js`:** the room, pedestals, the plinth and statue, and the "new treasure" fanfares.
- **`src/scenes/camp/rainbowScenery.js` / `CampScene`:** the hall building, Polly and her map sale, and the door into the hall.
- **`src/art/hunt.js`:** the 12 treasures, the pirate chest, the X, the map icon, Polly, the hall building and the hall's room pieces.
- **Stickers:** the new page in `src/game/stickers.js`.
- **`tuning.js`:** `HUNT` (prices, payouts, the 3–5 layer range, the 8-block glow distance) and the wider `RAINBOW_CAMP`.
- **`save.js`:** v13.

## Testing

- Unit tests for `hunt.js`: placement range and clamping, moving when passed, one map at a time, the golden map after 12, never repeating a treasure, payouts in range, and after the grand prize.
- `rainbow.test.js`: the X cave is carved when (and only when) the X is in the stretch, is sealed, and no gem overlaps it.
- Save migration test for v13.
- Browser check with the dev harness: buying from Polly, the arrow and glowing X, opening the chest, the fanfare in the hall, the golden map and the statue (with the harness jumping `found` to 12).
