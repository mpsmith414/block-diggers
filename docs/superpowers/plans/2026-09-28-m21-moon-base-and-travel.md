# M21: Moon Base, the Star Map and Travel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Moon's own camp (Moon Base), the star map at every rocket, launches and landings between Earth and the Moon, and the Helmet worn by the characters.

**Architecture:** `CampScene` takes a `planet` and a layout (`CAMP` for Earth, `MOON_CAMP` for the Moon). Its Earth-only systems (stall, visitors, decor, garden, pen, time of day, fire) run only on Earth. The Moon's scenery lives in `scenes/camp/moonScenery.js`. A new `StarMapScene` overlays the camp. `LaunchScene` takes `{ from, to }` and hands over to the destination camp with a landing. The star map's rules are pure (`starMapStops` in `game/planets.js`), with tests.

**Tech Stack:** Phaser 3.90, Vite, Vitest.

## Global Constraints

- Icons and sounds only: nothing to read.
- Old saves reopen on Earth. `state.planet` remembers the camp you're at.
- Earth camp behaves exactly as before.

---

### Task 1: Star map rules (TDD)
- `starMapStops(state, here)` returns one entry per planet: `{ id, status: 'here' | 'open' | 'locked' | 'soon', suit, hasSuit }`.
  - **Earth** is always open.
  - **The Moon** is open once Earth's Rocket Ship is built.
  - **Mars** is `soon` once the Mars Rocket is built on the Moon (it's `comingSoon`), and locked before that.
  - **The rest** are locked.
  - Whichever planet you're on is `here`.
- `rocketAt(state, planet)`: whether that camp has a way to fly. On Earth that's the built `rocket`; on the Moon the landing pad is always there.

### Task 2: Moon Base
- **Layout:** `MOON_CAMP` in tuning, 64 wide, with the ground at row 11 like Earth. It has the hatch, the bench, the lectern, the nest, the landing pad and 4 plots.
- **`CampScene` by planet:** `this.planet`, `this.L` (the layout) and `this.W`. Scenery, zones, prompts, stars and pickers use the layout and `blueprintsFor` / `plotsOf`. The pad zone opens the star map.
- **Scenery (`moonScenery.js`):**
  - the sky: black and starry, with the Earth in it;
  - the ground: grey moon dust;
  - glowing domes and an antenna with a blinking light;
  - the landing pad, with the Earth rocket standing on it;
  - the hatch.
- **Moon buildings (art):** Cheese Factory, Telescope, UFO Hangar and Mars Rocket, each 96×80. Their extras: mice scurrying, a twinkling telescope lens, the UFO hovering, rocket steam.
- **Arriving home on the Moon:**
  - the Cheese Factory gift flies in;
  - Moon Heart → the Helmet celebration: confetti, a fanfare, and the Helmet dropping onto every character;
  - the Moon Pup egg hatches in the Moon Base nest.
- **Trips:** the hatch (down) starts a Moon trip. The UFO Hangar opens the elevator picker with the Moon's layers.

### Task 3: The Helmet on the characters
- `scenes/common/suitView.js` adds a `suit-helmet` overlay that follows each character sprite: position, flip, scale, alpha. It's used in the mine and at both camps.

### Task 4: The star map, launches and landings
- **`StarMapScene`:**
  - the view: space, a dotted path, the planet icons (Earth, Moon, Mars, Saturn, Dino Planet, the Sun), padlocks, the "coming soon" cone and clock, and the suit pieces under each planet;
  - the controls: a cursor, A to fly, B to close, "nope" on locked planets, a bounce on `here`;
  - the `trip-starmap` sticker.
- **`LaunchScene` `{ from, to }`:** the ground and sky match `from`, and the destination grows ahead in space. At the end it starts `Camp` with `{ planet: to, landing: true }`.
- **The camp's landing:** the rocket comes down onto the pad (or Earth's rocket plot) with flames and dust. Everyone pops out, `state.planet = to` is saved, and the first time on the Moon earns the `trip-moonbase` sticker.
- **Title → Camp** uses `state.planet`.

### Task 5: Verify
- Screenshots: Moon Base (empty and fully built), the star map, both launches and landings, the Helmet celebration, the Moon Pup at Moon Base, the Earth camp unchanged, and the sticker book with 12 tabs. Commit.
