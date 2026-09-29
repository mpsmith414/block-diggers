# Block Diggers — The Planets (the Moon, Moon Base and the Star Map) — Design

**Date:** 2026-09-28
**Status:** Approved by the owner in brainstorming ("yes, this looks good", "build this whole thing as usual without any input from me"). Built without further input, with screenshots, iterating until the self-score is at least 8.5.
**Builds on:** the main design, the expansion design and the deeper-world design (cozy feel, no text a child needs to read, gentle hazards).

## Why

The player finished the whole Deeper World and Silly updates in one 45-minute session. He loved the rocket to the Moon, and asked for **more layers**, **rarer gems** and **cool new levels**. So space becomes the game's long-term path: a journey of planets, each with its own layers to dig, its own camp to build, and a bigger rocket to the next planet. It ends at **the Sun**, which he asked for himself, where you need a special heat suit.

This update builds **the planet system and the first planet, the Moon**. Later updates add one planet each.

## 1. The journey (the whole plan; this update builds the Moon)

**Earth → Moon → Mars → Saturn → Dino Planet → the Sun**

| Planet | Its special thing | Layers | Treasure at the bottom |
|---|---|---|---|
| Earth | (the game so far) | 8 | Heart of the World (builds the Moon rocket) |
| **Moon** | low gravity | 5 | **Moon Heart → the Helmet** |
| Mars | dust storms push you | 5 | Mars Heart → Boots |
| Saturn | slippery ice | 5 | Saturn Heart → Gloves |
| Dino Planet | living dinosaurs | 5 | Dino Heart → Jetpack |
| the Sun | the full Sun Suit makes you a super lava monster; solar flares | 6 | the Sun's Heart → a mini-sun for Earth camp and a finale |

- **The Sun Suit** is collected one piece per planet, and each piece shows on your character and gives a power. With all four pieces, the last rocket can land on the Sun.
- **Each planet** has its own camp, about 3 new ores, new creatures, one special thing, and a rocket to the next planet as its last building.
- **The star map** opens at any rocket. It shows the whole path, with the Sun glowing at the end. You can fly to any planet you have reached. Planets you haven't reached have a padlock, and Mars has a "coming soon" sign until its update.

## 2. The planet system

A planet is a recipe: its layers, ores, creatures, camp, buildings, gravity, sky and suit piece. Earth becomes the first recipe and the Moon the second, so adding Mars later means adding a recipe, art and one generator.

- **Where you are is saved.** `state.planet` is the camp you're at, and the game reopens there.
- **Each planet's mine** returns you to that planet's camp: on Earth the rope pulls you up, on the Moon you're beamed up.
- **Layer ids are unique across planets,** so badges, records and elevator stops all share one list.

## 3. The Moon mine (5 layers, 250 rows)

The new Moon mine replaces the short 102-row Moon. It has low gravity everywhere, a black starry sky and the Earth hanging in it.

| # | Layer (id) | Rows | Host rock | Dig it with | Ore | Creature (gentle) | Something special |
|---|---|---|---|---|---|---|---|
| 1 | **Crater Plains** (`craters`) | 1–50 | grey moon rock | Star Drill (5) | **moonstone** (pale blue glow) | moon blobs (walk, jump on them) | craters on the surface, meteorites (star shards → moonstone here), the flag |
| 2 | **Cheese Caves** (`cheesecaves`) | 51–100 | holey yellow cheese rock (soft, fast) | Star Drill (5) | **cheese** (now worth something) | **space mice** in tiny bubble helmets (walk like slimes) | **cheese wheels**: boulders you push, and two pushed together make a cheese party (a burst of cheese) |
| 3 | **Crystal Caves** (`mooncrystal`) | 101–150 | glowing blue-violet crystal rock | **Moon Drill (6)** | **space gems** (violet) | **space jellyfish** (float like bats and glow) | **singing crystals**: big crystals chime a note when you walk past, and the **Moon Pup's egg** is here |
| 4 | **Alien Base** (`alienbase`) | 151–200 | metal panels with blinking lights | **Crystal Drill (7)** | **alien gizmos** | **UFO drones** (float) | **teleport pads** in pairs (step on one, zip to the other), and a **crashed UFO** (walk in, its hatch pops, and it's full of gizmos and space gems) |
| 5 | **Moon Core** (`mooncore`) | 201–250 | glowing white-blue core rock | **Laser Drill (8)** | all four Moon ores | **star sprites** (float and twinkle) | the **Moon Heart**: a giant 3×3 gem at the bottom. Dig all 9 cells and carry it home to get the **Helmet** |

Row 251 is bedrock. Chests hold the best ore of their layer. Reaching a layer for the first time shows a banner and earns a badge, as on Earth.

## 4. New treasure and tools

**Ores** (appended to the ore list, so saves and HUD strips grow as you find them):

| Ore | Looks like |
|---|---|
| moonstone | a pale blue glowing round stone |
| cheese | the existing yellow wedge; it now goes in the backpack like any ore |
| space gem | a violet faceted gem with a pink shine |
| alien gizmo | a little green-and-silver gadget with a blinking light |

**Tools and upgrades** (Moon ores only, bought at either bench):

| Upgrade | New level | Cost |
|---|---|---|
| Pickaxe | **Moon Drill** (6) | 35 moonstone + 25 cheese |
|  | **Crystal Drill** (7) | 35 space gem + 35 moonstone |
|  | **Laser Drill** (8) | 40 gizmo + 35 space gem |
| Backpack | 320 (level 5) | 40 moonstone + 40 cheese |
| Lantern | 13 (level 5) | 30 space gem + 25 moonstone |

Each drill has its own look.

**Balance (changed while building):** the costs here are about 2.5 times the first draft, and the Moon's ore veins are richer. The deeper world was meant to last several sessions but lasted one. A progression bot (`tests/game/balance.test.js`) plays the Moon trip by trip. It gets the first new drill on trip 2, one about every 4 trips after that, the Helmet around trip 11, and the Mars Rocket after about 18 trips, which is two or three sessions. The backpack costs more than the Moon Drill, so a new layer always comes first.

## 5. Moon Base (the Moon's camp)

The Earth rocket now lands at **Moon Base**, not in the mine. Moon Base is 64 cells wide, with grey moon dust ground, a black starry sky, the Earth hanging in the sky, glowing domes and an antenna with a blinking light.

- **Always there:**
  - the **mine hatch** (push down to dig);
  - the **upgrade bench**;
  - the **sticker lectern**;
  - the **landing pad**, where the Earth rocket stands (press A for the star map);
  - a **pet nest**, so Moon Pup eggs hatch here.
- **4 plots and buildings:**

| Building | Cost | What it does |
|---|---|---|
| **Cheese Factory** | 45 cheese + 20 moonstone | space mice run it: **+3 cheese** every trip home to Moon Base |
| **Telescope** | 45 moonstone + 15 space gem | shows every chest on the Moon's depth meter, like Earth's tower |
| **UFO Hangar** | 30 gizmo + 30 space gem | the friendly alien's UFO is the Moon's elevator, to the top of any Moon layer you've reached |
| **Mars Rocket** | 45 gizmo + 40 space gem + 45 moonstone + the Helmet | a bigger rocket with boosters. Building it lights up Mars on the star map with a "coming soon" sign (Mars comes in the next update) |

**Stars and arrows:** gold stars and the edge arrow point at what you can afford, as they do on Earth.

## 6. The star map

Pressing A at a rocket (Earth's Rocket Ship, or the rocket on Moon Base's pad) opens the **star map**, a full-screen view of space.

- **The path:** planets sit along a dotted path: Earth, Moon, Mars, Saturn, Dino Planet, and at the far right a big glowing **Sun**.
- **What each planet looks like:**
  - planets you can fly to are bright;
  - planets you haven't reached are dark silhouettes with a padlock;
  - Mars, once its rocket is built, has a traffic cone and a little clock ("coming soon").
- **Your suit:** under each planet sits its suit piece, lit once you have it and a silhouette until then. This shows the whole suit you're working towards.
- **Controls:** left and right move the cursor, A flies, and B closes the map. Picking the planet you're on does a little "you are here" bounce. Picking a locked planet wobbles "nope".
- **Flying:** the launch cutscene plays, from the planet you're leaving (Earth's grass and sky, or the grey Moon and black sky) with the destination growing ahead. Then the rocket **lands** at the destination camp (flames, dust, door opens, everyone pops out).

## 7. The Helmet (the first Sun Suit piece)

- **Winning it:** bringing the Moon Heart home to Moon Base makes a big celebration: confetti, a fanfare, and the Helmet drops onto every character.
- **The look:** a round glass bubble helmet with a gold rim and a little lamp on top. Your characters wear it everywhere from then on.
- **Its power, a headlamp:** your light is 2 blocks bigger in every mine on every planet.
- **The Mars Rocket** needs the Helmet, so the Moon Heart is the Moon's goal, as the Heart of the World was Earth's.

## 8. The Moon Pup (a new pet)

- **Where it comes from:** its egg, a round silver egg with blue spots, is found in the Crystal Caves, one per mine until you have the pup.
- **What it's like:** a small white puppy in a glass bubble helmet with floppy ears.
- **How it helps:** it gives you a **double jump**. Press jump again in the air for a second hop, with a puff of stars. This works in every mine.
- **Where it lives:** it hatches in the nest at whichever camp you bring it to.

## 9. Smaller pets (the owner's request)

With five pets following you, they cover the screen. Pets are drawn at **70% size** in the mine and at camp, and they trail a little closer and tighter behind you.

## 10. Stickers (76 → 101)

- **Space** (existing page, grows to 12): + moonstone, space gem, alien gizmo, space mouse, space jellyfish, UFO drone.
- **Moon Base** (new, 12): Cheese Factory, Telescope, UFO Hangar, Mars Rocket, star sprite, cheese wheel, singing crystal, teleport pad, crashed UFO, Moon Heart, Helmet, Moon Pup.
- **Journey** (new, 7): the five Moon layer badges, Moon Base (first landing), and the star map (first look).

## 11. Save format v5

- **New keys:**
  - `planet: 'earth'`, the camp you're at;
  - `bases: { moon: { plots: [null, null, null, null] } }`;
  - `suit: []`, the pieces you have, like `'helmet'`;
  - `records.planetDeepest: { moon: 0 }`.
- **The bank** gains `moonstone`, `spacegem` and `gizmo` (`cheese` is already there).
- **Migration** fills all of this in, and nothing is lost. Cheese you already have becomes spendable.

## 12. Architecture

**Pure modules with tests:**
- `game/planets.js` (new): the planet table (id, name, layers, ores, gravity, camp id, suit piece, `comingSoon`), `layersOf`, `layerOfRow(row, planet)`, `starMapStops(state)`.
- `world/moon.js` (rewritten): the 5 Moon layers, with the finds from §3.
- `game/hazards.js`: creatures and spawn spots by planet.
- `game/trip.js`: discovery, layers reached and summaries by planet.
- `game/loot.js` and `game/finds.js`: chest, UFO and cheese-party loot by planet.
- `game/economy.js`: Moon blueprints, tiers 6–8, plots by planet, suit-gated blueprints.
- `game/perks.js`: the Cheese Factory, Telescope and UFO elevator, and the headlamp.
- `game/pets.js`: the Moon Pup.
- `game/player.js`: the double jump.
- `game/stickers.js`: the new pages.
- `save/save.js`: v5.

**Scenes:**
- `MineScene` takes `{ planet }`, and every Earth-only rule asks the planet table.
- `CampScene` takes `{ planet }`. Its scenery is split into `scenes/camp/scenery/earth.js` and `moon.js`. Earth-only camp systems (the stall, visitors, decor, garden, pen, time of day) run only on Earth.
- New `StarMapScene`.
- `LaunchScene` takes `{ from, to }`.
- The camp plays a landing when you arrive by rocket.

## 13. Testing

- **Unit tests:** each rule in §2–§11, TDD:
  - the planet table and star map stops;
  - the Moon generator's layers, ores, finds and Heart;
  - hardness by tier;
  - creatures by Moon layer;
  - the new costs and suit-gated blueprints;
  - Moon perks;
  - the double jump;
  - v4 → v5 migration;
  - the sticker pages (101).
- **Browser:** each Moon layer, Moon Base, the star map, both launches and landings, the Helmet celebration, the Moon Pup, and smaller pets. All screenshotted and sent to the owner.
- **Balance:** a simulation of ores per trip by layer, checked against the costs. The target is about 3 sessions of play on the Moon.
- **Scoring** with a rubric (fun and novelty for a 6-year-old, clarity without reading, polish, performance, bugs) until it reaches at least 8.5.
