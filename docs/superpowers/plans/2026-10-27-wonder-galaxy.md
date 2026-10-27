# The Wonder Galaxy — Plan

Spec: `docs/superpowers/specs/2026-10-27-wonder-galaxy-design.md`. Branch: `feat/wonder-galaxy`.

Each step ends with `npm test` green and a browser check through the dev harness (`h.quick('Wonder', { planet })`, `h.advance`, `h.shot`).

## W1 — The frame

1. **The registry:** `src/game/wonder/planets.js` (pure, tested).
   - `WONDER` is the eight planets in order, each with `{ id, goal: { kind: 'count'|'height'|'race', need, icon }, prize }`.
   - `isWonder(id)`.
   - `wonderOf(state)`.
   - `markVisited(state, id)`.
   - `winPrize(state, id)`.
2. **Save v14:** `state.wonder = { visited: [], prizes: [] }`, with its migration and tests.
3. **Stickers:**
   - pages `wonder`, `wonderprizes` and `wonderfun`;
   - a `wonder` chapter;
   - `TROPHY_COUNT` 31, plus 3 `TROPHY_GEMS`;
   - fix the counts in tests and the README.
4. **The mover:** `src/game/wonder/body.js` (pure, tested).
   - It moves a box against a tile grid.
   - Kinds: empty, solid, one-way (top only), bouncy and breakable.
   - Gravity is signed.
   - It reports contacts: floor, ceiling, walls, and the cells it touched.
5. **The star map:**
   - two pages, with the camera sliding between them;
   - the portal swirl;
   - the 8 planets on page 2, with their prize icons under them;
   - a straight swoop for Wonder trips;
   - `starMapStops` lists the Wonder planets, always open.
6. **The launch:**
   - `LaunchScene` starts `Wonder` when `to` is a Wonder planet;
   - the ground and sky looks for Wonder planets;
   - `shipFor` gives `wonder-ship` for any Wonder trip.
7. **`WonderScene`:**
   - joining, avatars, camera, pause;
   - the landing rocket, and A at the rocket opening the star map;
   - hold-B back to the rocket, catching up stragglers;
   - the prize party;
   - the visit sticker;
   - songs (`songFor('Wonder', planet)`).
   - Module interface: `create(scene)`, `spawn(a)`, `step(a, input, dt)`, `update(dt, time)`, `goal()`, `views`.
8. **`WonderHudScene`:** the counter, the height meter, the race place, the prize silhouette and the hold ring.
9. **Art:**
   - `src/art/wonder/common.js`: the 8 planet icons, the 8 prize icons, the 8 fun-sticker icons, the Wonder Rocket, the portal and the HUD bits.
10. **Music:** eight themes in `src/audio/themes.js`, and a few new sounds (`knock`, `boo`, `honk`, `flip`, `meow`, `purr`).

## W2–W9 — The planets, one at a time

For each planet:

1. A pure generator plus rules: `src/game/wonder/<id>.js`, with tests that the counts are right, everything can be reached, and the goal works.
2. Art: `src/art/wonder/<id>.js`.
3. The scene module: `src/scenes/wonder/<id>.js`.
4. A browser check and screenshots.

The order: Spooky, Robot, Ocean, Upside-Down, Jelly, Race, Dragon, Tiny.

## W10 — Finish

- README and PRODUCT capability list.
- The full test run and a production build.
- A two-player check on every planet.
- Screenshots to the owner.
- No merge or push until the owner says so.
