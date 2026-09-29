# Block Diggers — Mars (planet 2) — Design

**Date:** 2026-09-28
**Status:** Approved by the owner in brainstorming ("go ahead and spec and build"). Built without further input, with screenshots, iterating until the self-score is at least 8.5. Ask before merging to main or pushing (pushing deploys the live site).
**Builds on:** the planets design (`2026-09-28-planets-design.md`): the journey Earth → Moon → Mars → Saturn → Dino Planet → the Sun, one Sun Suit piece per planet.

## Why

The Moon update gave the journey its first planet. Mars is the second: 5 new layers, a new camp (Mars Base), 4 new ores, the **Boots** (Sun Suit piece 2), a new pet, and the Saturn Rocket (Saturn "coming soon"). Mars's special thing is **dust storms that push you**.

## 1. The Mars mine (5 layers, 250 rows, normal gravity)

A butterscotch-pink sky with two tiny moons (Phobos and Deimos) and a tiny blue Earth. Row 251 is bedrock.

| # | Layer (id) | Rows | Host rock | Dig it with | Ore | Creature (gentle) | Something special |
|---|---|---|---|---|---|---|---|
| 1 | **Red Dunes** (`dunes`) | 1–50 | red sandstone | Laser Drill (8) | **ruby** | **dust bunnies** (fluffy red balls, walk) | a windsock at the top; the storms feel strongest here (lots of drifting dust) |
| 2 | **Rover Graveyard** (`rovers`) | 51–100 | rusty rock with old bolts | Laser Drill (8) | **robot bolts** | **scrap crabs** (little metal crabs, walk) | **old rovers**: walk up to one, it beeps, blinks and pops open full of bolts and rubies. The **Rover Bot's egg** (a silver egg with red bolts) is here |
| 3 | **Volcano Caves** (`volcano`) | 101–150 | dark basalt | **Ruby Drill (9)** | **fire opals** | **lava newts** (walk) | **steam geysers**: step on a vent, it rumbles and WHOOSH, shoots you high up. Lava pools (lava monster!) |
| 4 | **Martian City** (`ruins`) | 151–200 | carved sandstone ruins | **Opal Drill (10)** | **Mars coins** | **little Martians** on hover-discs (fly) | **vaults**: a sealed room with an unbreakable door and a glowing **glyph button** outside. Step on the button, the door rumbles open: a chest and a pile of coins inside |
| 5 | **Mars Core** (`marscore`) | 201–250 | glowing orange-red core rock | **Mega Drill (11)** | all four ores | **embers** (float and flicker) | the **Mars Heart**: a 3×3 red gem at the bottom. Dig all 9 cells and carry it home for the **Boots** |

Chests hold their layer's ore. Reaching a Mars layer for the first time shows a banner and earns a badge.

## 2. Dust storms

- **The cycle:** calm for 40–70 s (the first storm comes 20–30 s after you arrive, so it's seen early), then a 3 s **warning** (a windsock icon wobbles by the HUD, a whistling wind sound, a few wisps of dust), then **8 s of storm** (red dust streaks across the screen, the camera sways a little), then calm again.
- **The push:** during a storm everyone is gently pushed sideways (the direction is picked per storm, and the dust shows it) at about half walking speed. You can walk against it slowly, and walls, ladders and water stop the push. Digging works as usual. It never hurts and never scatters ore.
- **With the Boots** the storm can't push you (the dust still blows, and your boots glow).
- **The Weather Station** (a Mars Base building) makes storms carry rubies: when a storm ends, 3 rubies drop from above near each player.
- Mars Base has little dust wisps drifting past now and then, but no push.

## 3. New treasure and tools

**Ores** (appended to the ore list): **ruby** (a red faceted gem), **bolt** (a silver hex bolt), **opal** (a fire opal: orange with teal flecks), **coin** (a gold Mars coin with a planet stamp).

| Upgrade | New level | Cost |
|---|---|---|
| Pickaxe | **Ruby Drill** (9) | 35 ruby + 25 bolt |
|  | **Opal Drill** (10) | 35 opal + 35 ruby |
|  | **Mega Drill** (11) | 40 coin + 35 opal |
| Backpack | 400 (level 6) | 40 ruby + 40 bolt |
| Lantern | 15 (level 6) | 30 opal + 25 ruby |

The balance bot tunes these to about 3 sessions, like the Moon (trip counts are checked in a test).

## 4. Mars Base (the camp)

The same layout as Moon Base: the hatch, the bench, the lectern, the nest, the landing pad (the Mars Rocket stands on it) and 4 plots. The scenery: red ground with pebbles, butterscotch sky, two small moons, a tiny blue Earth, red dune hills (parallax), a **greenhouse dome** with green plants, a windsock, and the diggers' flag.

| Building | Cost | What it does |
|---|---|---|
| **Robot Factory** | 45 bolt + 20 ruby | little robots build bolts: **+3 bolts** every trip home to Mars Base |
| **Weather Station** | 45 ruby + 15 opal | storms carry rubies (§2), and it shows every chest on Mars's depth meter |
| **Rover Garage** | 30 coin + 30 opal | a rover drives you to the top of any Mars layer you've reached (the elevator) |
| **Saturn Rocket** | 45 coin + 40 opal + 45 ruby + the Boots | lights up Saturn on the star map with a "coming soon" sign |

Gold stars and the edge arrow work as at every camp.

## 5. Travel

- **The star map:** Mars is open once the Mars Rocket is built (no longer "coming soon"). Saturn shows "coming soon" once the Saturn Rocket is built.
- **The Mars Rocket** (a bigger ship with boosters) is the one that flies to and from Mars: it lifts off from the Moon, lands on Mars Base's pad and stands there. The launch from Mars has a red ground and a pink sky.
- **Going home from the Mars mine:** you're beamed up, like on the Moon, with an orange beam.

## 6. The Boots (Sun Suit piece 2)

- **Winning them:** bringing the Mars Heart home to Mars Base makes a big celebration: confetti, a fanfare, and red boots drop onto every character's feet.
- **The look:** red rocket boots with gold soles; little flames puff from the heels when you run.
- **The power:** you run 30% faster on every planet (in the mines and at camps), and dust storms can't push you.
- **The Saturn Rocket** needs the Boots.

## 7. The Rover Bot (a new pet)

- **Where it comes from:** its egg (silver with red bolts) is found in the Rover Graveyard, one per mine until you have it.
- **What it's like:** a tiny robot rover with a round head, an antenna and a little trailer behind it.
- **How it helps:** your backpack holds **50% more**, and the trailer fills up with little ore piles as your backpack fills.
- It hatches in the nest at whichever camp you bring it to.

## 8. Stickers (101 → 130, 14 pages)

- **Mars** (new, 12): ruby, bolt, fire opal, Mars coin, dust bunny, scrap crab, lava newt, Martian, ember, old rover, geyser, vault.
- **Mars Base** (new, 12): Robot Factory, Weather Station, Rover Garage, Saturn Rocket, Mars Heart, Boots, Rover Bot, the first dust storm, the flag on Mars, the two moons, the windsock, and Mars Base (first landing).
- **Journey** (grows from 7 to 12): the five Mars layer badges.
- The sticker book's tabs get narrower so 14 fit.

## 9. Save format v6

- `bases.mars.plots` (4 slots) and `records.planetDeepest.mars`.
- The bank gains `ruby`, `bolt`, `opal` and `coin`.
- Migration fills these in, and nothing is lost.

## 10. Architecture

**Planet recipes, not branches.** Most Moon-only rules are `planet === 'moon' ? … : …` ternaries (about 14 of them). These become per-planet table entries, so Mars and later planets are data:
- `game/planets.js`: each planet gains its camp layout, its perk buildings (`reveal`, `elevator`, `gift: { building, ore, n }`), its chest pools per layer, the top row of each ore, its heart kind, and its creatures.
- `game/economy.js`: `blueprintsFor(planet)` looks up a table (Earth, Moon, Mars).
- `game/perks.js`: `revealsChests`, `elevatorStops` and `campGift(state, planet)` read the recipe. `packCap` adds the Rover Bot, and `walkMul(state)` adds the Boots.
- `game/finds.js`: `HEARTS` (block, loot and sticker per heart kind); `heartLeft` uses it; `roverLoot`, `vaultLoot`.
- `game/storms.js` (new, pure): `createStorm(rng)`, `stepStorm(storm, dt, rng)` → events (`warn`, `start`, `end`), and `windOf(storm)`.
- `game/player.js`: `stepPlayer` takes `windX` (px/s), added to the walk unless climbing, knocked back or in water.
- `world/planetgen.js` (new): the helpers shared by the Moon and Mars generators (veins, caves, floors, spots, decor), moved out of `moon.js`.
- `world/mars.js` (new): the Mars generator. It returns `{ grid, chests, decor, eggs, heart, lavaCells, geysers, rovers, vaults, … }`.
- The badge order (`BADGE_LAYERS`) and pet walkers each live in one place, rather than being copied into the HUDs.

**Scenes:**
- `MineScene` asks the planet for its generator, sky, top and way home.
- A new `scenes/mine/stormView.js` draws the dust, the windsock, and the storm rubies.
- `findsView` gains geysers, old rovers and vaults, and hearts by kind.
- `CampScene`: Mars Base scenery (`scenes/camp/marsScenery.js`), `suitParty(piece)` for any suit piece, and the ship per route.
- `suitView` shows every suit piece you have.
- `StarMapScene` and `LaunchScene` take Mars.
- The HUDs show the badges and the elevator vehicle by planet, and the bank's pips fit 12 levels.

**Art:** `art/marsWorld.js` (tiles, back walls, ore icons, creatures, decor, finds, heart, boots, pet, badges) and `art/marsBase.js` (the 4 buildings, greenhouse, windsock, Mars pad, Mars hatch, the Mars ship, the rover car).

## 11. Testing

- **Unit tests (TDD):**
  - the planet recipes and the star map with Mars open and Saturn "soon";
  - the Mars generator (layers, ores, geysers, rovers, vaults with their buttons outside the door, the Heart, the pup egg, determinism);
  - hardness by tier (9–11);
  - creatures by Mars layer;
  - Mars costs and the Boots-gated Saturn Rocket;
  - Mars perks (the factory gift, the chest reveal, the rover elevator, storm rubies);
  - the Boots' speed and storm immunity, and the Rover Bot's pack bonus;
  - the storm cycle and the wind in `stepPlayer`;
  - v5 → v6 migration;
  - the sticker pages (130).
- **Balance bot:** Mars trip by trip. It checks the drill order (pick 9, 10, 11, the Boots, the Saturn Rocket) and that it takes 12–24 trips.
- **Browser:** each Mars layer, a storm (warning, dust, push), a geyser, an old rover, a vault, Mars Base (empty and fully built), the Mars launch and landing, the Boots celebration, the Rover Bot, the star map, and the sticker book. All screenshotted and sent to the owner.
- **Scoring** with the rubric (fun and novelty for a 6-year-old, clarity without reading, polish, performance, bugs) until it reaches at least 8.5.
