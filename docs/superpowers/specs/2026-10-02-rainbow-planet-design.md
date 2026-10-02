# Block Diggers — Rainbow Planet: the endless mine — Design

**Date:** 2026-10-02
**Status:** designed with the owner in conversation. They approved each part ("Yes") and want to read this before it's built.

**Why:** after the Sun finale there's nothing new to come back for. The owner wants something that feels new and fun, with **progress every time they play**.

## The bigger plan (four projects, built in order)

1. **Rainbow Planet and the endless mine.** This spec.
2. **Spending:** camp buildings and decorations, and outfits and hats, bought with sparkles.
3. **The treasure hunt:** maps that send you to an X somewhere deep.
4. **New mini games:** a fairground in the Rainbow Village, where a new stall unlocks every few layers you reach.

Each gets its own spec, plan and build, and is played before the next one starts.

## Owner decisions this spec follows

- **A new stop on the star map, past the Sun.** It's not a hole at Earth camp, and it's not under the other planets.
- **Brand-new rainbow layers:** random colours, gradients and patterns. **No layers, ores or gems are reused** from the other planets.
- **Gems vary per layer** in shape, colour **and size**, from tiny 1×1 gems up to **massive 8×8 gem blocks** that take many hits to break.
- **The treasures and other things** in each layer are random too.
- **Gems are money only.** They all turn into one currency, **sparkles**. There's no gem collection book.
- **No equipment upgrades on this planet:** any drill digs everything.
- **Every trip starts at your deepest point.** No elevator, and no going back over old ground.
- **Mini games live in the Rainbow Village** (project 4), not in the mine.

## Getting there

- **The Rainbow Rocket:** a new building at the Solar Station (the Sun's camp). It's on a **new fifth plot** (`SUN_CAMP.plots` gains one; the other four are full).
  - It needs the **Sun's Heart** (`needs: { sunHeart: true }`).
  - It costs Sun ores: **nova 60, plasma 60, sunstone 60**.
- **The star map:** it gains a **7th stop past the Sun**, a swirly rainbow planet (`planet-rainbow`). The stops are re-spaced so all seven fit on the 480-wide map. It works like the others: locked until the Rainbow Rocket is built, then open.
- **The planet** (`PLANETS` entry `rainbow`):
  - normal gravity;
  - no suit piece and no Heart, because it's endless;
  - camp `RAINBOW_CAMP`;
  - its ores aren't listed (they're sparkles).

## Rainbow Village (the camp)

It starts small. Projects 2 and 4 fill it in.
- **The landing pad:** A opens the star map, as at every camp.
- **The Rainbow Lift:** a glowing hole with a little lift cage. Push down to ride it to your deepest point. It replaces the mine shaft.
- **The Depth Sign:** a big signboard showing the **deepest layer number** you've reached, with a rainbow bar that grows with it.
- **Plots:** four empty plots waiting for project 2, and a cleared patch at the end of the village for project 4's stalls.
- **The top bar** shows your **sparkles**.
- **The look:** candy-coloured ground, a striped sky, and a rainbow arch. It follows the time of day like other camps.

## The endless mine

- **Layers:** every layer is **30 rows** tall. Layer `n` (counting from 1) covers rows `(n-1)*30` to `n*30 - 1`, measured from the top of the planet.
- **Always the same:** the planet has a fixed seed (`RAINBOW.seed`), and each layer's look and contents come from `layerLook(seed, n)` and the layer's own random generator. Layer 12 is always layer 12.
- **No dug state is saved.** You never go back over old ground.
- **Each trip's mine is a 10-layer stretch:**
  - **the start row** is your deepest row (`state.rainbow.deepest`). On the very first trip it's row 2, near the top of layer 1;
  - **a small starting cave** is carved there, 7 wide and 3 tall, with the lift's landing spot;
  - **the grid** runs from 4 rows above the start to the end of the 10th layer below it;
  - **above the start**, the rows are solid rock in that layer's colours;
  - **width:** `MINE_W` (48), the same as every mine.
- **The bottom of the stretch** is a row of glowing rainbow floor that can't be dug. Going home from there means the next trip starts there.
- **Recording depth:** `deepest` is updated whenever a player's feet go below it. It's saved when the trip ends.
- **Digging:**
  - every rainbow block is dug in the same time with any drill, `RAINBOW.digTime` (0.15 s, about what a Sun-level drill does), so nothing ever needs an upgrade;
  - the normal rules apply: ladders appear when you dig up or down, and Earth tools and pets still help;
  - perks that speed up digging (the Gloves, the Yeti Cub) still work.
- **Going home:** hold B for the rope, as everywhere.
- **The depth strip:** it shows the current stretch, with your record marked.
- **A new layer:** the first time you enter one, a banner shows its colour swatch and number. A record also gets a ribbon.

## Each layer's look (`layerLook(seed, n)`)

Everything is rolled from `(seed, n)`, so it's always the same.
- **Rock colours:** a gradient of 2 or 3 random colours from top to bottom of the layer. They're chosen as bright or pastel colours, never muddy or near-black, so the layer is easy to see and cheerful.
  - **How it's drawn:** each tile is a greyscale pattern frame, tinted with the gradient colour for its row.
  - **The back wall** uses the same tints, darker.
- **Rock pattern:** one of `speckles`, `stripes`, `swirls`, `dots`, `bubbles` or `zigzag`. Each pattern has 4 greyscale tile variants drawn at boot.
- **The gem:**
  - **shape:** one of `round`, `diamond`, `hex`, `star`, `heart`, `crystal` or `nugget`;
  - **colour:** a random colour, contrasting with the rock, with a light highlight and a dark edge;
  - **sparkle style:** `twinkle`, `glow` or `shimmer`;
  - **size:** one of `tiny`, `chunky`, `big` or `massive`. Massive comes up about 1 layer in 6; the rest are spread evenly.
- **Decorations:** 2 kinds per layer from `mushroom`, `flower`, `bubble`, `vine` and `crystal`, tinted in the layer's colours.
- **Creatures:** 1 or 2 kinds per layer from a gentle blob (it hops) and a gentle flier (it drifts). They're two new creatures, drawn in greys so they tint cleanly. Each gets a random colour and a size from 0.8 to 1.4. Like every creature in the game, they only bump you.
- **Twist:** about half the layers get one of:
  - `bouncy`: some spring pads;
  - `pools`: little water pockets;
  - `shiny`: some slippery floors that work like ice;
  - `floaty`: low gravity in that layer.

## Gems (`src/game/rainbowGems.js`)

| Size | Blocks | How many per layer | Hits to break | Sparkles |
|---|---|---|---|---|
| tiny | 1×1 | 40–60 | 1 | 1 |
| chunky | 2×2 | 12–18 | 2 | 6 |
| big | 4×4 | 3–5 | 5 | 30 |
| massive | 8×8 | 1–2 | 12 | 150 |

- **Placement:** a gem larger than 1×1 is **one object** covering its blocks. Gems never overlap each other, the starting cave or the floor of the stretch, and never stick out of the mine.
- **Hitting a big gem:** digging any of its blocks is **one hit** on the whole gem. Each hit takes the normal dig time. It shows a crack stage (cracks spread with each hit) and a small shake.
- **The last hit:** the gem shatters. All its blocks become air, sparkles burst out, the screen flashes softly for a massive gem, and its sparkles go to the player who broke it.
- **Tiny gems** are ordinary 1-block digs, worth 1 sparkle.

## Sparkles and treasure

- **The sparkle jar:** gems go **straight into it**, shown on the HUD for each player. It has no limit and uses no backpack space.
- **Going home:** the jar goes into the bank as `bank.sparkle` (like `bank.heart`), counted up on the trip card. The Rainbow Village top bar shows it.
- **Treasure chests:** 3–5 per layer, in the layer's colours. Opening one gives 10–25 sparkles.
- **Spending:** none yet. That's project 2.

## Saving

- **Save v11:**
  - `state.rainbow = { deepest: 0 }` and `bank.sparkle = 0`;
  - the Rainbow Rocket goes in the Sun's plots like any building;
  - the star map status comes from it.
- **Migration:** older saves get the default, with nothing lost.

## Code

- **`src/world/rainbow.js`** (pure, tested):
  - `layerLook(seed, n)`;
  - `layerOfRow(row)`;
  - `generateRainbow(seed, fromRow)` → `{ grid, top, gems, chests, decor, creatures, twists, floorRow, startCave }`.
- **`src/game/rainbowGems.js`** (pure, tested): gem sizes, hits, `hitGem` → `{ broken, cells, sparkles }`, and the sparkle values.
- **`src/art/rainbow.js`:**
  - the greyscale rock pattern tiles;
  - the gem art for every shape at every size, drawn white and tinted per layer, with crack overlays;
  - decorations, the lift, the depth sign and the planet icon.
- **Blocks:** new appended block ids (rules: append-only): `RAINBOW_ROCK`, `RAINBOW_GEM` (tiny), `RAINBOW_GEM_PART` (a block belonging to a big gem) and `RAINBOW_FLOOR` (can't be dug).
- **Hooking it in:**
  - `planets.js`: the planet and `ROCKET_TO.rainbow`;
  - `economy.js`: the Rainbow Rocket blueprint;
  - `tuning.js`: `RAINBOW`, `RAINBOW_CAMP` and the fifth Sun plot;
  - `StarMapScene`: the 7th stop;
  - `CampScene`: Rainbow Village, the lift and the depth sign;
  - `MineScene`: the rainbow stretch, row tints, big gem hits, the jar, banners and the depth record;
  - the HUD: the jar, plus sparkles at camp;
  - `save.js`: v11.

## Testing

- **Unit tests:**
  - `layerLook` is the same for the same `(seed, n)`, differs between layers, and every option appears across 200 layers;
  - massive gems come up about 1 layer in 6;
  - `generateRainbow`:
    - it's the same for the same input;
    - the starting cave is open;
    - the floor row can't be dug;
    - gems are inside the mine and never overlap;
    - each size's count is within range;
  - big gems take the right hit counts and pay the right sparkles;
  - every rainbow block digs at `RAINBOW.digTime` with pick 0 and pick 20;
  - the v10 → v11 migration;
  - the star map shows the Rainbow stop locked until the rocket is built.
- **In the browser:**
  - build the rocket (debug save);
  - fly to Rainbow Village and ride the lift down;
  - smash a massive gem;
  - open a chest;
  - go home and see sparkles counted on the card;
  - start the next trip deeper;
  - take screenshots of at least 4 different layers (including tiny and massive gem layers) and the village;
  - check the console for errors.
