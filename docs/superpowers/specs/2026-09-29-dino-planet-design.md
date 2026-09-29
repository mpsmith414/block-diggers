# Block Diggers — Dino Planet (planet 4) — Design

**Date:** 2026-09-29
**Status:** Approved by the owner in brainstorming ("Yep go"). Built without further input, with screenshots, iterating until the self-score is at least 8.5. Ask before merging to main or pushing (pushing deploys the live site).
**Builds on:** the planets, Mars and Saturn designs. It uses the planet recipe and the shared generator helpers.

## Why

The journey is Earth → Moon → Mars → Saturn → **Dino Planet** → the Sun. Dino Planet's special thing is **living dinosaurs**. Its bottom treasure, the Dino Heart, gives the **Jetpack**: the fourth and last Sun Suit piece. Its last building, the **Sun Rocket**, makes the Sun "coming soon"; the finale is the next update.

## 1. The Dino Planet mine (5 layers, 250 rows, normal gravity)

The sky is a warm jungle dawn, with a smoking volcano and a pterodactyl flock on the horizon.

| # | Layer (id) | Rows | Host rock | Dig it with | Ore | Creature | Something special |
|---|---|---|---|---|---|---|---|
| 1 | **Fern Jungle** (`jungle`) | 1–50 | leafy jungle soil | Comet Drill (14) | **jade** | **dragonflies** (fly) | **dino rides**: 3 friendly parasaurs |
| 2 | **Bone Beds** (`bonebeds`) | 51–100 | pale fossil rock | Comet Drill (14) | **dino bones** | **baby raptors** (walk) | 2 **dino nests** (walk up: the eggs hatch and the babies toss out bones and jade); the **Longneck's egg** |
| 3 | **Swamp** (`swamp`) | 101–150 | mossy mud rock | **Jungle Drill (15)** | **T-rex teeth** | **frogs** (walk/hop) | swamp water pools; a **giant T-rex skull** (walk in: the jaw drops open and teeth tumble out) |
| 4 | **Lava Lands** (`lavalands`) | 151–200 | dark volcanic rock | **Tooth Drill (16)** | **obsidian** | **fire beetles** (walk) | lava pools; a **sleeping Stegosaurus** (walk up: it wakes, stretches, and shakes obsidian off its back plates) |
| 5 | **Dino Core** (`dinocore`) | 201–250 | glowing amber-green core rock | **Obsidian Drill (17)** | all but jade | **glow moths** (fly) | the **Dino Heart**: a golden 3×3 egg-gem. Carry it home for the **Jetpack** |

Each layer holds its own ore (the core has several). Chests hold their layer's ore. The first visit to each layer gives a banner and a badge.

## 2. Dino rides

- Walk into a parasaur and you hop on. The ride lasts 25 seconds.
- While riding:
  - you run 1.6× faster and jump 1.3× higher;
  - creatures you touch get trampled (they poof);
  - you're never bonked;
  - digging works as usual.
- When the ride ends, you hop off with a sparkle and the parasaur trots away. Each parasaur gives one ride per trip.
- The first ride earns a sticker.

## 3. New treasure and tools

**Ores** (appended): **jade** (a green carved gem), **bone** (a white dino bone), **tooth** (a big cream T-rex tooth), **obsidian** (glossy black-purple glass).

| Upgrade | New level | Cost |
|---|---|---|
| Pickaxe | **Jungle Drill** (15) | 45 jade + 35 bone |
|  | **Tooth Drill** (16) | 45 tooth + 45 jade |
|  | **Obsidian Drill** (17) | 55 obsidian + 45 tooth |
| Backpack | 620 (level 8) | 55 jade + 55 bone |
| Lantern | 19 (level 8) | 40 tooth + 35 jade |

The balance test aims for about 20 trips.

## 4. Dino Camp (the camp)

- **The ground and props:** jungle grass on dirt, tree ferns, a volcano with smoke on the horizon, big leafy plants, the landing pad (the Sun Rocket stands on it), the hatch, the bench, the lectern, the nest and 4 plots.

| Building | Cost | What it does |
|---|---|---|
| **Dino Nursery** | 55 bone + 25 jade | baby dinos dig up **+3 jade** every trip home |
| **Treehouse** | 55 jade + 20 tooth | a lookout: shows every chest on the depth meter |
| **Ptero Perch** | 40 obsidian + 40 tooth | the elevator: a friendly pterodactyl flies you down to any layer you've reached |
| **Sun Rocket** | 60 obsidian + 55 tooth + 60 jade + the Jetpack | lights up the Sun on the star map with a "coming soon" sign |

## 5. Travel

- **The star map:** Dino Planet is open once the Dino Rocket is built.
- **The ship:** the Dino Rocket (green with spikes) flies to and from Dino Planet.
- **The launch:** from Dino Planet it has a green jungle ground.
- **Going home:** you're beamed home with a leaf-green beam.

## 6. The Jetpack (Sun Suit piece 4)

- **Winning it:** bringing the Dino Heart home makes the celebration, and a little red jetpack drops onto every character's back.
- **The power:** on every planet, hold jump in the air (after the jump itself) to fly upward, with flames. There's about 1.2 seconds of fuel, and it refills as soon as you land.
- **The Sun Rocket** needs the Jetpack. With all four pieces the Sun Suit is complete; the Sun itself is the next update.

## 7. The Longneck (a new pet)

- **Where it comes from:** its egg (green with yellow spots) is in the Bone Beds.
- **What it's like:** a baby Brachiosaurus with a long neck.
- **How it helps:** it gives you a boost, so you step up ledges **2 blocks high** instead of 1 (on every planet).

## 8. Stickers (160 → 190, 19 pages)

- **Dino Planet** (12): jade, bone, tooth, obsidian, dragonfly, raptor, frog, fire beetle, glow moth, parasaur, dino nest, T-rex skull.
- **Dino Camp** (12): Dino Nursery, Treehouse, Ptero Perch, Sun Rocket, Dino Heart, Jetpack, Longneck, sleeping Stegosaurus, the first dino ride, the flag on Dino Planet, the volcano, Dino Camp (first landing).
- **Journey 2** grows from 6 to 12: the five Dino Planet badges, and flying with the Jetpack.

## 9. Save format v8

- `bases.dino.plots` (4 slots). The bank gains `jade`, `bone`, `tooth` and `obsidian`.
- Migration fills these in, and nothing is lost.

## 10. Architecture

**It follows the Saturn recipe:**
- **The planet entry** gets its recipe fields (Dino Planet is no longer `comingSoon`), and `ROCKET_TO.sun = { at: 'dino', id: 'sunrocket' }`.
- **Tuning:** `DINO_LAYERS`, `DINO_GEN` and `DINO_CAMP`; blocks 82–93.
- **The generator:** `world/dinoworld.js`.
- **The art:** `art/dinoWorld.js` and `art/dinoBase.js`.
- **Tables:**
  - the blueprints;
  - `HEARTS.dino`;
  - the creatures;
  - the stickers;
  - the badges (the strip grows to 24);
  - the banners;
  - `VEHICLE`;
  - `GROUND`;
  - `SCENERY`;
  - the suit `PIECES` (the Jetpack worn on the back);
  - `SHIP` and `SHIP_X`.

**New pure rules, with tests:**
- `startRide` / `stepPowerups` (`ride`), and `multipliers` gets `jump`;
- `stepPlayer` options `jumpMul`, `jetpack` (hold jump in the air: thrust, fuel, refill on landing) and `stepUp` (2-block ledges);
- `nestLoot`, `skullLoot`, `stegoLoot`;
- `jetpack(state)` and `stepUp(state)`.

## 11. Testing

- **Unit tests (TDD):**
  - the recipe and the star map (the Sun "soon");
  - the generator (layers, ores, parasaurs, nests, the skull, the stego, the Longneck egg, the Heart, determinism);
  - tiers 15–17;
  - creatures;
  - costs and the Jetpack-gated Sun Rocket;
  - perks;
  - rides;
  - the jetpack's flight, fuel and refill;
  - 2-block step-ups;
  - v7 → v8 migration;
  - 190 stickers.
- **Balance bot:** 12–24 trips, with the drill order pick 15, 16, 17, the Jetpack, then the Sun Rocket.
- **Browser:** each layer, a dino ride, a nest, the skull, the stego, the Heart and the Jetpack flying, Dino Camp (empty and built), the launch and landing, the star map and the book. Screenshots go to the owner.
