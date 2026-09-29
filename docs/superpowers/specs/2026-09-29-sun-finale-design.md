# Block Diggers — The Sun (the finale) — Design

**Date:** 2026-09-29
**Status:** Approved by the owner in brainstorming ("Yes let's go and make it need the suns heart"). Built without further input, with screenshots, iterating until the self-score is at least 8.5. Ask before merging to main or pushing (pushing deploys the live site).
**Builds on:** the planets, Mars, Saturn and Dino Planet designs. It uses the planet recipe and the shared generator helpers.

## Why

The journey Earth → Moon → Mars → Saturn → Dino Planet → **the Sun** ends here. With all four Sun Suit pieces you land on the Sun and become a golden super lava monster. The Sun's Heart brings a **mini-sun home to Earth camp** and plays the **grand finale**. The game carries on after it.

## 1. Landing, and the golden lava monster

- **Opening the Sun:** the Sun Rocket (built at Dino Camp, needing the Jetpack) opens the Sun on the star map. Every rocket needs the previous planet's suit piece, so anyone who can fly there wears the whole Sun Suit.
- **On the Sun, everyone is always a golden super lava monster:**
  - you glow gold;
  - you dig twice as fast;
  - lava is safe;
  - creatures poof when they touch you, and nothing bonks you.
- **The first trip** earns a sticker.

## 2. The Sun mine (6 layers of 40 rows, 240 rows)

| # | Layer (id) | Rows | Host rock | Dig it with | Ore | Creature | Something special |
|---|---|---|---|---|---|---|---|
| 1 | **Corona** (`corona`) | 1–40 | wispy golden sun-rock | Obsidian Drill (17) | **sunstone** | **flame fairies** (fly) | the sky glows; **solar flares** start here |
| 2 | **Sunspots** (`sunspots`) | 41–80 | dark, cool sunspot rock | Obsidian Drill (17) | **flare gems** | **shadow blobs** (walk) | 3 **fire flowers**: touch one and it blooms, popping out flare gems |
| 3 | **Plasma Sea** (`plasmasea`) | 81–120 | glowing pink plasma rock | **Sun Drill (18)** | **plasma orbs** | **plasma jellies** (fly) | big lava lakes you drop right through |
| 4 | **Radiance** (`radiance`) | 121–160 | bright white-gold crystal rock | **Flare Drill (19)** | **nova gems** | **sunbeam bunnies** (walk) | the **Baby Sun Dragon's egg** |
| 5 | **Fusion Forge** (`fusion`) | 161–200 | swirling orange rock | **Flare Drill (19)** | all four | **sparkies** (fly) | the **Solar Forge**: walk up, it hammers, and out pours a pile of treasure |
| 6 | **Sun Core** (`suncore`) | 201–240 | blazing white core rock | **Nova Drill (20)** | all four | sparkies (fly) | **the Sun's Heart**: a 3×3 blazing gem at the very bottom |

Chests hold their layer's ore. The first visit to each layer gives a banner and a badge.

## 3. Solar flares

- **The timing:** like Mars storms, but good. They're calm for 35–55 s (the first comes after 15–25 s), then a 2 s warning (a pulsing sun icon by the depth meter and a rising hum), then 6 s of flare.
- **The flare:** the screen glows gold, sparkles fall, and **sunstones rain down** around each player, one every half second.
- **The first flare** earns a sticker.

## 4. New treasure and tools

**Ores** (appended): **sunstone** (orange gem), **flare** (a white-gold crystal), **plasma** (a glowing pink orb), **nova** (a starry blue-white gem).

| Upgrade | New level | Cost |
|---|---|---|
| Pickaxe | **Sun Drill** (18) | 45 sunstone + 35 flare |
|  | **Flare Drill** (19) | 45 plasma + 45 sunstone |
|  | **Nova Drill** (20) | 55 nova + 45 plasma |
| Backpack | 750 (level 9) | 55 sunstone + 55 flare |
| Lantern | 21 (level 9) | 40 plasma + 35 sunstone |

The balance test aims for about 15–18 trips: the victory lap is a bit shorter than a planet.

## 5. Solar Station (the camp)

- **The scenery:** golden sun-rock ground, a blazing sky with swirling flares, flame fountains, solar panels, golden domes, the landing pad (the Sun Rocket stands on it), the hatch, the bench, the lectern, the nest and 4 plots.

| Building | Cost | What it does |
|---|---|---|
| **Sunflower Garden** | 55 flare + 25 sunstone | giant sunflowers: **+3 sunstone** every trip home |
| **Sundial Tower** | 55 sunstone + 20 plasma | shows every chest on the depth meter |
| **Sunbeam Lift** | 40 nova + 40 plasma | the elevator: slide down a sunbeam to any layer you've reached |
| **Hall of Heroes** | 60 nova + 55 plasma + 60 sunstone + **the Sun's Heart** | a golden hall with statues of every pet and suit piece. Press A inside to **replay the finale** |

## 6. The Sun's Heart and the grand finale

Bringing the Sun's Heart home to Solar Station plays the finale:
1. The screen flashes gold, the fanfare plays, and fireworks burst across the sky for several seconds.
2. Every pet you have comes out and does tricks, and the camp friends (bear, rabbit, owl) pop in and hop.
3. A giant gold trophy drops in with a bounce, and a **gold crown** lands on every character. Characters wear it everywhere from now on (a suit overlay).
4. It ends with the finale sticker.

- **The mini-sun:** from then on it hangs over **Earth camp**, gently pulsing and glowing (and it has a sticker).
- **The Hall of Heroes** needs the Sun's Heart. Pressing A inside replays the finale.
- **After the finale:** everything keeps working; the game carries on.

## 7. The Baby Sun Dragon (the last pet)

- **Where it comes from:** its egg (gold with orange flame spots) is in the Radiance layer.
- **What it's like:** a tiny orange dragon with little wings. It flies.
- **How it helps:** it glows so brightly that your light reaches **4 blocks further** on every planet.

## 8. Stickers (190 → 221, 22 pages)

- **The Sun** (12): sunstone, flare, plasma, nova, flame fairy, shadow blob, plasma jelly, sunbeam bunny, sparky, fire flower, the Solar Forge, a solar flare.
- **Solar Station** (12): Sunflower Garden, Sundial Tower, Sunbeam Lift, Hall of Heroes, the Sun's Heart, Baby Sun Dragon, the finale, the crown, the mini-sun, the flag on the Sun, the golden lava monster, Solar Station (first landing).
- **Journey 3** (7): the six Sun layer badges, and the whole Sun Suit.

## 9. Save format v9

- `bases.sun.plots` (4 slots) and `sunHeart: false`.
- The bank gains `sunstone`, `flare`, `plasma` and `nova`.
- Migration fills these in, and nothing is lost.

## 10. Architecture

It follows the planet recipe:
- **The planet entry:** the Sun is no longer `comingSoon`; it keeps `finale: true`, with `suit: null` and `heart: 'sun'`.
- **Tuning:** `SUN_LAYERS`, `SUN_GEN`, `SUN_CAMP` and `FLARE`; blocks 96–108.
- **The generator:** `world/sunworld.js`.
- **The art:** `art/sunWorld.js` and `art/sunBase.js`.
- **Tables:** blueprints (with `needs: { sunHeart: true }`), hearts, creatures, stickers, badges (the strip grows to 30), banners, `VEHICLE`, `GROUND`, `SCENERY`, `SHIP`, and the `crown` suit piece.

**Rules:**
- `createStorm` and `stepStorm` take their timings, so flares reuse them.
- `blueprintOk` understands `needs.sunHeart`.
- `lanternRadius` adds the Sun Dragon's glow.
- `winSunHeart(state)` sets `sunHeart` and adds the `crown`.
- `fireFlowerLoot` and `forgeLoot`.

**Scenes:**
- `MineScene`: the golden lava monster on the Sun, flares, the fire flowers and the forge.
- `CampScene`: `finaleParty()`, the Hall zone, the mini-sun at Earth camp, and Solar Station.

## 11. Testing

- **Unit tests (TDD):**
  - the recipe and the star map;
  - the generator;
  - tiers 18–20;
  - creatures;
  - costs and the Heart-gated Hall;
  - perks;
  - flare timings;
  - the Sun Dragon's light;
  - `winSunHeart`;
  - v8 → v9 migration;
  - 221 stickers.
- **Balance bot:** 12–20 trips, with the drill order pick 18, 19, 20, the Sun's Heart, then the Hall.
- **Browser:** each layer, a flare, the fire flowers, the forge, the golden monster, the Heart and the finale, the mini-sun at Earth camp, the Hall replay, Solar Station, the launch and landing, the star map and the book. Screenshots go to the owner.
