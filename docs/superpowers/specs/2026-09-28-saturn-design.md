# Block Diggers — Saturn (planet 3) — Design

**Date:** 2026-09-28
**Status:** Approved by the owner in brainstorming ("Yep go for it"). Built without further input, with screenshots, iterating until the self-score is at least 8.5. Ask before merging to main or pushing (pushing deploys the live site).
**Builds on:** the planets design and the Mars design. It uses the planet recipe (`game/planets.js`) and the shared generator helpers (`world/planetgen.js`).

## Why

The journey goes Earth → Moon → Mars → **Saturn** → Dino Planet → the Sun. Saturn's special thing is **slippery ice**, and its bottom treasure, the Saturn Heart, gives the **Gloves** (Sun Suit piece 3). Its last building, the **Dino Rocket**, makes Dino Planet "coming soon".

## 1. The Saturn mine (5 layers, 250 rows, normal gravity)

The sky is deep space, with giant striped Saturn and its rings filling one side. Row 251 is bedrock.

| # | Layer (id) | Rows | Host rock | Dig it with | Ore | Creature (gentle) | Something special |
|---|---|---|---|---|---|---|---|
| 1 | **Frozen Rings** (`rings`) | 1–50 | ring ice (**slippery**) | Mega Drill (11) | **frost gems** | **space penguins** (walk) | **snowballs**: boulders you push. Two pushed together build a **snowman** that bursts into frost gems |
| 2 | **Ice Cream Caves** (`icecream`) | 51–100 | soft-serve rock (soft, fast) | Mega Drill (11) | **ice cream** | **scoop slimes** (bouncy ice-cream scoops, walk) | sprinkles, and drippy cones on the ceilings |
| 3 | **Aurora Caverns** (`aurora`) | 101–150 | deep blue aurora rock | **Frost Drill (12)** | **ring pearls** | **snow owls** (fly) | glowing aurora crystals; **snow globes** (walk up and they shake, and pearls pour out); the **Yeti Cub's egg** |
| 4 | **Comet Cave** (`comets`) | 151–200 | dark comet rock with frozen streaks | **Pearl Drill (13)** | **comet chunks** | **little comets** with tails (fly) | a **frozen comet** (walk up and it cracks open, full of treasure) |
| 5 | **Saturn Core** (`saturncore`) | 201–250 | glowing gold-and-ice core rock | **Comet Drill (14)** | all ores but ice cream | **snowflake sprites** (fly) | the **Saturn Heart**: a 3×3 gem with a ring around it. Carry it home for the **Gloves** |

Each layer holds its own ore, so the rock always matches the ore in it (the core has several). Chests hold their layer's ore. The first visit to each layer shows a banner and earns a badge.

## 2. Slippery ice

- Ring ice and frost-gem blocks are slippery to stand on.
- On them you speed up slowly (about half a second to full speed) and slow down slowly. Let go and you glide about two blocks. Bumping a wall stops you.
- It never hurts. Digging works as usual.
- **With the Gloves**, you grip: no sliding.
- The first slide earns a sticker.
- Ring Station's snowy ground is not slippery.

## 3. New treasure and tools

**Ores** (appended): **frost** (a pale cyan crystal), **icecream** (a pink scoop in a cone), **pearl** (a pink-white ring pearl), **comet** (a blue rock with a little icy tail).

| Upgrade | New level | Cost |
|---|---|---|
| Pickaxe | **Frost Drill** (12) | 35 frost + 25 ice cream |
|  | **Pearl Drill** (13) | 35 pearl + 35 frost |
|  | **Comet Drill** (14) | 40 comet + 35 pearl |
| Backpack | 500 (level 7) | 40 frost + 40 ice cream |
| Lantern | 17 (level 7) | 30 pearl + 25 frost |

The balance test aims for about 19 trips, like Mars.

## 4. Ring Station (Saturn's camp)

- **The ground and props:** snowy ground, an igloo, a snowman, the landing pad (the Saturn Rocket stands on it), the hatch, the bench, the lectern, the nest and 4 plots.
- **The sky:** giant Saturn with its rings, and gently falling snow.

| Building | Cost | What it does |
|---|---|---|
| **Ice Cream Parlour** | 45 ice cream + 20 frost | **+3 ice cream** every trip home |
| **Ice Lighthouse** | 45 frost + 15 pearl | its beam shows every chest on the depth meter |
| **Ski Lift** | 30 comet + 30 pearl | the elevator: a chairlift down to any layer you've reached |
| **Dino Rocket** | 45 comet + 40 pearl + 45 frost + the Gloves | lights up Dino Planet on the star map with a "coming soon" sign |

## 5. Travel

- **The star map:** Saturn is open once the Saturn Rocket is built.
- **The ships:** the Saturn Rocket (cream and gold) flies to and from Saturn. Each flight uses the rocket of the farther planet.
- **The launch from Saturn:** snowy ground under a starry sky.
- **Going home from the Saturn mine:** you're beamed up with an icy-blue beam.

## 6. The Gloves (Sun Suit piece 3)

- **Winning them:** bringing the Saturn Heart home to Ring Station makes the celebration, and puffy gold gloves drop onto every character.
- **The look:** gold mittens on the characters' hands, drawn for every animation frame.
- **The power:** you dig **25% faster on every planet**, and you never slip on ice.
- **The Dino Rocket** needs the Gloves.

## 7. The Yeti Cub (a new pet)

- **Where it comes from:** its egg (white and fluffy with blue spots) is in the Aurora Caverns, one per mine until you have it.
- **What it's like:** a small white furry yeti with blue cheeks.
- **How it helps:** it digs with you. When you dig a block sideways, the Yeti also digs the block above it (if your drill can), so your tunnels come out two tall and you get more ore.
- It hatches in the nest at whichever camp you bring it to.

## 8. Stickers (130 → 160, 17 pages)

- **Saturn** (12): frost, ice cream, pearl, comet, penguin, scoop slime, snow owl, little comet, snowflake sprite, snowman, snow globe, frozen comet.
- **Ring Station** (12): Ice Cream Parlour, Ice Lighthouse, Ski Lift, Dino Rocket, Saturn Heart, Gloves, Yeti Cub, the first slide, the flag on Saturn, Saturn's rings, snowball, Ring Station (first landing).
- **Journey 2** (6): the five Saturn layer badges and the aurora.
- The book's tabs shrink to fit 17.

## 9. Save format v7

- `bases.saturn.plots` (4 slots). The bank gains `frost`, `icecream`, `pearl` and `comet`.
- Migration fills these in, and nothing is lost.

## 10. Architecture

It follows the Mars recipe:
- **The planet entry** gets its recipe fields, and `ROCKET_TO.dino = { at: 'saturn', id: 'dinorocket' }`.
- **Tuning:** `SATURN_LAYERS`, `SATURN_GEN` and `SATURN_CAMP`; blocks 68–80.
- **The generator:** `world/saturn.js`, built on planetgen.
- **The art:** `art/saturnWorld.js` and `art/saturnBase.js`.
- **Tables:**
  - `BLUEPRINTS_OF.saturn`;
  - `HEARTS.saturn`;
  - the creatures;
  - the stickers;
  - the badges (the strip grows to 19);
  - the HUD banner looks;
  - the elevator `VEHICLE`;
  - the camp `GROUND`;
  - `suitView` `PIECES` (the Gloves);
  - the ships by route.
- **New pure rules, with tests:**
  - `isSlippery(id)`;
  - the ice slide in `stepPlayer` (`grip` option);
  - `digMul(state)` for the Gloves;
  - `yetiDig(grid, mined, pickLevel)`;
  - `boulderPairMeet` (cheese wheels make a cheese party, snowballs make a snowman);
  - `globeLoot`, `cometLoot` and `snowmanLoot`.

## 11. Testing

- **Unit tests (TDD):**
  - the recipe and the star map;
  - the generator (layers, ores, snowball pairs, globes, the frozen comet, the Yeti egg, the Heart, determinism);
  - hardness tiers 12–14;
  - creatures;
  - costs and the Gloves-gated Dino Rocket;
  - perks;
  - the ice slide and the Gloves' grip;
  - the Yeti's dig;
  - v6 → v7 migration;
  - 160 stickers.
- **Balance bot:** 12–24 trips, with the drill order pick 12, 13, 14, the Gloves, then the Dino Rocket.
- **Browser:** each Saturn layer, sliding on ice, a snowman, a snow globe, the frozen comet, the Heart and the Gloves, Ring Station (empty and built), the launch and landing, the star map and the book. Screenshots go to the owner.
