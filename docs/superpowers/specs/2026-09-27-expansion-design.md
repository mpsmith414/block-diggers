# Block Diggers — Expansion: Reasons to Keep Digging — Design

**Date:** 2026-09-27
**Status:** Implemented 2026-09-27 (M7–M12). See "Changes made while building" at the end.
**Builds on:** `2026-09-25-block-diggers-design.md` (all of it still applies, including the cozy feel and "no text a child needs to read").

## Why

The loop *dig → home → build* runs out after six buildings. This expansion adds:
- **reward** (buildings that help, rare finds, a trip summary with records),
- **fun in the moment** (pets, boom blocks, team-up chests and boulders, water),
- **longevity** (a sticker book, a fourth layer, camp decorating, visitors with requests).

## 1. Buildings that do something

Each building gets a perk. It works from the moment it's built, and is shown by a small icon on its sign when you stand near it.

| Building | Perk |
|---|---|
| Lookout Tower | Chests, eggs and big chests show on the depth meter from the start. Without it, a chest dot appears only once the chest has been lit by a lantern. |
| Cozy House | +10 backpack space for every player. |
| Minecart Loop | Standing in the cart and pressing A starts the trip at the top of the stone layer. You arrive in a lit cave with a cart track. |
| Flower Garden | Grows gem flowers: +3 random ores (weighted to what you have least of) each trip home, up to 12 stored. Walk through the garden to harvest them. |
| Animal Pen | Each trip home, the animals leave 1 gift box (2 iron, or 1 gold, or 3 coal). Walk over it to collect. Up to 3 wait. |
| Diamond Statue | Lucky: doubles the chance of rare finds (geodes, fossils, golden slimes, eggs). |

## 2. Trip summary and records

On arrival at camp, before the ores fly into the bank, a parchment card shows:
- each player's ores (icon + number);
- the deepest row reached, shown as a mini depth bar;
- chests opened;
- new stickers.

A gold "best!" ribbon marks a new record for deepest or most ores. It closes on A, or after 5 s. Records are saved.

## 3. Rare finds and toys in the mine

| Thing | Where | What it does |
|---|---|---|
| **Geode** | stone, deep, crystal (~5 per mine) | Mines like stone. Cracks open with a crystal burst into 4–6 gems (gold / diamond / emerald by layer). |
| **Fossil** (shell, bone, dino skull) | dirt, stone (~4 per mine) | Mines like its host. Gives its sticker and 2 gold. |
| **Golden slime** | 8% of slime spawns (16% with the statue) | Squash it for a burst of 5 gold. |
| **Boom block** | stone and below (~6 per mine) | Digging or touching it lights it: it flashes for 1.5 s, then goes *poof*, clearing a 3×3 area (never bedrock, chests or boulders). Ores from cleared cells drop as pickups. Nearby players get a gentle push. **No** bonk or ore loss. |
| **Big chest** | 1 per mine, stone or deep, in a cave | Two cells wide. In co-op, both players must be touching it at once (a "together!" icon pulses when one is). Solo, one player opens it. Gives 8–12 of the layer's best ore, plus an egg if there are pets left to find. |
| **Boulder** | ~4 per mine in caves, blocking a small alcove of ore | Can't be dug (bounces). Push against it: in co-op it takes both players pushing the same way; solo, one player. It rolls one cell after 0.5 s of pushing, falls if unsupported, and lands as a boulder. |
| **Pet egg** | 2 per mine, in deep or crystal caves, only while pets are still missing | Touch to collect; it hatches at camp. |
| **Water pools** | crystal layer caves | Harmless and glowing. Inside: slow fall, up or A swims up, bubbles. |

The statue doubles geode, fossil, golden slime and egg odds (their counts per mine ×1.5, rounded).

## 4. Pets

There are three pets, each hatched from its own egg colour. Every hatched pet comes on every trip and wanders the camp at home.

| Pet | Look | Helps by |
|---|---|---|
| **Mole** | brown, pink nose | Every 6 s it sniffs: a trail of sparkles runs from player 1 to the nearest ore within 10 cells. |
| **Glow-bug** | round, glowing yellow | Flies near player 1 and adds +1.5 blocks of light. |
| **Bat buddy** | teal, smiley | Doubles the ore-magnet radius, and swoops to fetch loose ore within 5 blocks for the nearest player. |

**Hatching:** on arrival, each carried egg wobbles at the nest by the campfire, cracks, and the pet pops out with confetti and gets its sticker. Once all 3 pets are found, eggs become **golden eggs** (a burst of 6 gold).

## 5. Sticker book

40 stickers across 6 pages:
1. **Ores:** coal, iron, gold, diamond, emerald.
2. **Creatures:** slime, golden slime, bat, mole, glow-bug, bat buddy.
3. **Cave life:** grass, flower, roots, mushroom, pebbles, glowshroom, crystal, stalactite, giant glowshroom, glow moss, amethyst glow (only in the crystal layer, the rarest).
4. **Treasures:** geode, shell fossil, bone fossil, dino fossil, boom block, big chest, boulder, pet egg, golden egg.
5. **Camp:** the 6 buildings.
6. **Friends:** 3 visitors.

- **Earning:** ores on first collect; creatures on first squash, bump or hatch; cave life when first lit by a lantern; treasures on open or dig; buildings on completion; friends on first request done.
- **New sticker toast:** the sticker slides in at the top centre with a sparkle and a chime. It sits alongside the HUD, never blocking play.
- **The book:** open it from the pause menu (a book icon) or at the camp lectern.
  - Each page is a grid of sticker slots: found ones in colour on a gold-edged slot, missing ones as dark silhouettes.
  - ←/→ turns pages; the tab icons show which page you're on.
  - A progress ring shows each page's completion.
- **Page complete:** a golden trophy decoration for that page is added to your decoration stock for free, with a fanfare.

## 6. Crystal Caverns (layer 4)

- The mine grows to **190 rows**: layer 4 is rows 149–188, and row 189 is the bedrock floor.
- Host rock is **crystal rock**: glossy violet-blue, and only a **diamond pickaxe** can dig it (0.6 s).
- **Ores:** diamond, emerald, gold, richer than the deep layer.
- **Big caves,** with glowing water pools, giant glowshrooms, glow moss, crystal clusters and amethyst glow.
- **Extra chest:** 1 more (4 chests in total; one of them is in the crystal layer).
- **No lava** in the crystal layer. Bats still spawn.

## 7. Camp decorating

- A **market stall** at camp (a striped awning) sells decorations for ores. Standing at it and pressing A opens the same picker style as the bench.

  | Item | Cost |
  |---|---|
  | Lamp post (glows at night) | 3 coal + 1 iron |
  | Fence | 3 coal |
  | Flower bed | 4 coal |
  | Bench | 3 iron |
  | Pumpkin patch | 2 gold |
  | Mailbox | 2 iron |
  | Pond (fish jump) | 5 iron |
  | Windmill (turns) | 6 iron + 3 gold |
  | Crystal lamp | 2 diamond |
  | Trophies | from full sticker pages only |

- **Placing:** a bought item floats over its buyer's head. Walk to a spot and press A to place it (B puts it back in stock).
- **Moving:** standing on a placed decoration with nothing else to do shows a hand icon; A picks it up to move it.
- **Rules:** decorations can't go on the shaft, bench, stall, nest, lectern or an *empty* plot. Stock and placements are saved.
- The camp widens to **84 cells**: the stall is at cell 63, and cells 64–83 are open meadow for decorating.

## 8. Visitors

Friends move in as the camp grows. Each lives by a building and wanders near it.

| Visitor | Arrives after | Lives by | Reward for a done request |
|---|---|---|---|
| **Bear baker** | 2 buildings | house | 3 diamond |
| **Rabbit shopkeeper** | 4 buildings | stall | a random decoration (not a trophy) added to stock |
| **Owl explorer** | 6 buildings | tower | a pet egg if pets are missing, otherwise a golden egg |

- **Requests:** each has a speech bubble showing one request, "ore icon × N", scaled to the camp (5–15 of an ore you've found). Requests refresh each trip home.
- **Doing one:** stand by them and press A. If the bank has enough, the ores fly over, they cheer (hearts), you get the reward and their sticker. If not, the numbers in their bubble go red.

## 9. Phone polish

- Bigger touch targets: A 96 px, home 70 px, joystick radius 60.
- A **Y bubble** button isn't needed (touch is single-player).
- A **book** button (top-left) opens the sticker book.

## 10. Save format v3

v2 → v3 adds:
- `records: { deepest, mostOres }`
- `stickers: { [id]: true }`
- `trophiesAwarded: [page]`
- `pets: [kind]`
- `decor: { stock: { [id]: n }, placed: [{ id, x }] }`
- `garden: { stock }`
- `pen: { gifts }`
- `visitors: { met: [id], requests: { [id]: { ore, n } } }`

Migration fills the defaults. Unknown fields are kept.

## 11. Architecture

Everything new that is a rule lives in pure modules with tests:

| Module | Contents |
|---|---|
| `game/perks.js` | building perks: backpack bonus, luck, start row, garden growth, pen gifts |
| `game/trip.js` | trip stats → summary + new records |
| `game/stickers.js` | catalog, award, page progress, trophies |
| `game/pets.js` | pet catalog, hatching, follow maths, sniff target |
| `game/finds.js` | boom explosion, boulder push, big-chest rule, geode / fossil loot |
| `game/decor.js` | shop, stock, placement rules |
| `game/visitors.js` | arrival, requests, fulfilling |
| `world/worldgen.js` | layer 4, water, new blocks, placement counts |
| `game/player.js` | water physics |

Phaser scenes stay thin. New scenes and views:
- `BookScene` (the sticker book, over the current scene)
- `SummaryScene` (the trip card, over the camp)
- mine views: `petsView`, `findsView`
- camp views: `decorView`, `visitorsView`

## 12. Testing

- **Unit tests** for every pure module above:
  - worldgen: layer 4 host rock and ores, water only in the crystal layer, bedrock on row 189, 4 chests, rare-find counts, boulders with a floor, eggs only when pets are missing;
  - water physics;
  - boom clearing rules;
  - boulder push with 1 vs 2 players;
  - big-chest together rule;
  - perks;
  - trip summary records;
  - sticker award / page completion / trophy once;
  - pet sniff target;
  - decoration placement rules;
  - visitor arrival and request fulfilment;
  - save v2 → v3 migration.
- **Browser (dev harness):** each feature driven and screenshotted, and the balance bot re-run over several trips.
- **Scoring:** the same honest 0–10 pass as before, iterating until ≥ 8.5.

## Changes made while building (2026-09-27)

Found by playtesting (screenshots, the dev harness, and a bot that plays several trips and spends like a player):

- **Boulders** sit at a cave edge in front of a one-block **pit**, with ore beyond it. You push the boulder into the pit and walk over it. (In the first version the ore was *behind* the boulder, so pushing it from the only reachable side went into solid rock.) Players never auto-step onto boulders or boom blocks; they lean on them, pushing or lighting.
- **Goal hint** (new): the cheapest building or upgrade you can't afford yet, the ore it still needs (counting what's in your pack), and an arrow on the depth meter at the layer where that ore is found. Without it, a bot filled up on coal in the dirt layer every trip and never went deeper for iron. With it, the house is built on trip 2.
- **Visitors** that are new to you walk in from just outside the view (not from the far edge of the camp), and remember that they've arrived (`visitors.seen`).
- **Leaving camp** mid-hatch hatches the remaining eggs at once. The mine waits while a trip's summary and deposit are still running.
- **The phone's book button** opens the sticker book directly.
- **Fix:** scene event listeners outlive a scene restart. The mine's sticker listener is now removed at the end of each trip (before the fix, it doubled up every trip).
