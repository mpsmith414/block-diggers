# The Moon Skate Park Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A big, lit skate park beside the Moon Heart. It has a half pipe you skate on a smooth curve; A in the air does random tricks, and each landed trick pops out space gems.

**Architecture:**
- **Rules:** pure skating rules in `src/game/skate.js`: the curve geometry, `stepSkate` and tricks.
- **The room:** the Moon generator carves the room and returns `world.skatepark`.
- **The scene:** `src/scenes/mine/skateView.js` draws the pipe, the rack and the boards, mounts players, and renders tricks. `MineScene` skips player physics while `a.skate` is set.

**Tech Stack:** Phaser 3.90, Vite, Vitest (`npx vitest run`), procedural pixel art on canvas.

## Global Constraints

- **Icons and sounds only:** nothing a child needs to read.
- **Gentle:** no crashes, and every landing is safe.
- **Saves:**
  - old saves load with nothing lost;
  - the save format doesn't change;
  - block ids and tileset frames are append-only (this feature adds none).
- **Public repo:** no family names.
- **Gems:** `spacegem`, capped at 15 per trip.
- **Pipe:** `R = 96`, `F = 80`, Moon gravity `g = 405`.
- **Room:** columns 30–46, rows `MOON_H-14` to `MOON_H-3`, floor on row `MOON_H-2`.
- **Stickers:** 229 on 23 pages.

---

### Task 1: Skating rules

**Files:**
- Modify: `src/tuning.js` (add `SKATE`)
- Create: `src/game/skate.js`
- Test: `tests/game/skate.test.js`

**Interfaces:**
- Produces:
  - `SKATE`;
  - `TRICKS`;
  - `createPipe(x0, floor)` → `{ x0, x1, floor, lipY, R, F, q, L }`;
  - `curveAt(pipe, s)` → `{ x, y, tx, ty, angle }`;
  - `sAtX(pipe, x)`;
  - `createSkate(pipe, x)`;
  - `stepSkate(sk, pipe, intent, edges, dt, rng, gemsLeft)` → events `[{ type: 'air' } | { type: 'trick', kind } | { type: 'land', tricks, gems }]`.
  - Inputs: `intent.moveX` is in -1..1; `edges.jump` is a rising edge (A); `gemsLeft` is how many gems are still allowed this trip.

- [ ] **Step 1: Write the failing tests**

```js
import { describe, it, expect } from 'vitest';
import { createPipe, curveAt, sAtX, createSkate, stepSkate, TRICKS } from '../../src/game/skate.js';
import { createRng } from '../../src/world/rng.js';
import { SKATE } from '../../src/tuning.js';

const pipe = createPipe(480, 800);
const run = (sk, secs, intent = { moveX: 0 }, press = () => false, rng = createRng(1)) => {
  const evs = [];
  for (let t = 0; t < secs; t += 1 / 60) evs.push(...stepSkate(sk, pipe, intent, { jump: press(t, sk) }, 1 / 60, rng, 99));
  return evs;
};

describe('the half pipe curve', () => {
  it('runs from lip to lip, smooth, with its bottom on the floor', () => {
    expect(curveAt(pipe, 0)).toMatchObject({ x: 480, y: 800 - SKATE.R });
    const end = curveAt(pipe, pipe.L);
    expect(end.x).toBeCloseTo(480 + 2 * SKATE.R + SKATE.F);
    expect(end.y).toBeCloseTo(800 - SKATE.R);
    expect(curveAt(pipe, pipe.L / 2).y).toBeCloseTo(800);
    for (let s = 1; s <= pipe.L; s += 1) {
      const a = curveAt(pipe, s - 1);
      const b = curveAt(pipe, s);
      expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeLessThan(1.05);
    }
    for (const s of [10, 150, 200, 300]) expect(sAtX(pipe, curveAt(pipe, s).x)).toBeCloseTo(s, 3);
  });
});

describe('skating', () => {
  it('rolls back and forth without leaving the pipe when you don’t push', () => {
    const sk = createSkate(pipe, 480 + 30);
    const evs = run(sk, 20);
    expect(evs.some((e) => e.type === 'air')).toBe(false);
    expect(sk.s).toBeGreaterThan(0);
    expect(sk.s).toBeLessThan(pipe.L);
  });

  it('pumping builds up to big air, which stays under the ceiling', () => {
    const sk = createSkate(pipe, pipe.x0 + SKATE.R + 10);
    let top = Infinity;
    for (let t = 0; t < 30; t += 1 / 60) {
      stepSkate(sk, pipe, { moveX: 1 }, { jump: false }, 1 / 60, createRng(2), 99);
      if (sk.air) top = Math.min(top, sk.y);
    }
    expect(top).toBeLessThan(pipe.lipY - 40);
    expect(top).toBeGreaterThanOrEqual(pipe.lipY - SKATE.maxAir - 1);
  });

  it('comes back down off a lip and rolls back into the pipe', () => {
    const sk = createSkate(pipe, pipe.x0 + SKATE.R);
    sk.v = -SKATE.max; // rushing up the left wall
    const evs = run(sk, 4);
    expect(evs.map((e) => e.type).slice(0, 2)).toEqual(['air', 'land']);
    expect(sk.air).toBe(false);
    expect(sk.v).toBeGreaterThan(0);
  });

  it('A on the pipe is an ollie; A in the air is a trick (never the same twice in a row)', () => {
    const sk = createSkate(pipe, pipe.x0 + SKATE.R + 40);
    const evs = run(sk, 3, { moveX: 0 }, (t) => [0.1, 0.3, 0.8].some((p) => Math.abs(t - p) < 0.008));
    expect(evs[0].type).toBe('air');
    const tricks = evs.filter((e) => e.type === 'trick').map((e) => e.kind);
    expect(tricks.length).toBeGreaterThanOrEqual(1);
    for (const k of tricks) expect(TRICKS).toContain(k);
    for (let i = 1; i < tricks.length; i++) expect(tricks[i]).not.toBe(tricks[i - 1]);
  });

  it('landing tricks gives gems: one each, +1 for a combo of 3, never past the cap', () => {
    const sk = createSkate(pipe, pipe.x0 + SKATE.R + 40);
    sk.air = true; sk.x = pipe.x0 + SKATE.R + 40; sk.y = 700; sk.vx = 0; sk.vy = 0;
    sk.tricks = ['kickflip', 'grab', 'superman'];
    const land = run(sk, 2).find((e) => e.type === 'land');
    expect(land.gems).toBe(4);
    const sk2 = createSkate(pipe, pipe.x0 + SKATE.R + 40);
    sk2.air = true; sk2.y = 700; sk2.tricks = ['kickflip', 'grab'];
    const evs = [];
    for (let t = 0; t < 2; t += 1 / 60) evs.push(...stepSkate(sk2, pipe, { moveX: 0 }, { jump: false }, 1 / 60, createRng(1), 1));
    expect(evs.find((e) => e.type === 'land').gems).toBe(1);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails.** Run `npx vitest run tests/game/skate.test.js`. Expected: FAIL (the module is missing).

- [ ] **Step 3: Implement.** In `src/tuning.js`:

```js
// the Moon Skate Park's half pipe (px): two quarter pipes of radius R with a
// flat bottom F; Moon gravity; pushing, pumping, big air, tricks
export const SKATE = {
  R: 96, F: 80, g: 405, push: 260, pump: 150, friction: 0.12, max: 420, maxAir: 84, ollie: 210, trickTime: 0.45, gemCap: 15,
};
```

In `src/game/skate.js`:
- `createPipe`: `q = πR/2`, `L = 2q + F`.
- `curveAt`:
  - left quarter (`a = s/R`): point `(x0 + R - R cos a, floor - R + R sin a)`, tangent `(sin a, cos a)`;
  - flat: tangent `(1, 0)`;
  - right quarter (`b = (s - q - F)/R`): point `(x0 + R + F + R sin b, floor - R + R cos b)`, tangent `(cos b, -sin b)`;
  - `angle = atan2(ty, tx)`.
- `sAtX`: the analytic inverse (acos on the left, asin on the right).
- `stepSkate`, on the pipe:
  - `v += g·ty·dt`;
  - on the flat, `v += push·moveX·dt`;
  - on a wall (`|tx| < 0.95`) while moving, holding the stick pumps: `v += pump·sign(v)·dt`;
  - friction, then cap at `max`, then `s += v·dt`;
  - past a lip, take off straight up with `|vy| ≤ sqrt(2·g·maxAir)`;
  - an A edge ollies along the inward normal `(ty, -tx)`.
- `stepSkate`, in the air:
  - gravity, with `x` clamped inside the pipe;
  - an A edge with no trick running starts a random new trick;
  - land when `vy > 0` and `y ≥ curveAt(sAtX(x)).y`, then `v = vx·tx + vy·ty`;
  - gems = `n + (n ≥ 3 ? 1 : 0)`, capped by `gemsLeft`.

- [ ] **Step 4: Run it and confirm it passes.** Run `npx vitest run tests/game/skate.test.js`. Expected: PASS.

- [ ] **Step 5: Commit** with the message `feat(skate): the half pipe and skating rules`.

### Task 2: The skate park room on the Moon

**Files:**
- Modify: `src/world/moon.js`
- Test: `tests/world/moon.test.js`

**Interfaces:**
- Produces: `world.skatepark = { x0: 30, x1: 46, top, floor }` (cells). The floor is row `MOON_H-2`.

- [ ] **Step 1: Write the failing test**

```js
it('has a big skate park beside the Moon Heart, open to its chamber, with nothing in it', () => {
  const w = generateMoon(42);
  const p = w.skatepark;
  expect(p).toEqual({ x0: 30, x1: 46, top: MOON_H - 14, floor: MOON_H - 2 });
  for (let y = p.top; y < p.floor; y++) for (let x = p.x0; x <= p.x1; x++) expect(w.grid.get(x, y)).toBe(B.AIR);
  for (let x = p.x0; x <= p.x1; x++) expect(w.grid.get(x, p.floor)).toBe(B.MOON_CORE);
  expect(w.grid.get(29, p.floor - 1)).toBe(B.AIR); // walk in from the Heart chamber
  expect(w.chests.some((c) => c.x >= p.x0 && c.x <= p.x1 && c.y >= p.top && c.y <= p.floor)).toBe(false);
  expect(w.decor.some((d) => d.x >= p.x0 && d.x <= p.x1 && d.y >= p.top && d.y <= p.floor)).toBe(false);
  expect(w.heart).toEqual(generateMoon(42).heart);
});
```

- [ ] **Step 2: Run it and confirm it fails** (`skatepark` is undefined).
- [ ] **Step 3: Implement.** After the Heart, the chests and the other finds are placed, and before the decor:
  - carve the room to `AIR`;
  - lay the `MOON_CORE` floor;
  - filter out chests inside the room;
  - filter the decor output by the room's rectangle;
  - return `skatepark`.
- [ ] **Step 4: Run it and confirm it passes.** Also run `npx vitest run tests/world`.
- [ ] **Step 5: Commit** with the message `feat(skate): the skate park room beside the Moon Heart`.

### Task 3: Skate Park stickers and art

**Files:**
- Modify: `src/game/stickers.js`, `tests/game/stickers.test.js` (the counts become 229/23)
- Create: `src/art/skate.js`
- Modify: `src/art/textures.js` (call `drawSkateArt`)

**Interfaces:**
- Produces:
  - the page `skatepark` (icon `skateboard`);
  - stickers: `skate-park` (`icon-skatepark`), `skate-board` (`skateboard`), and `trick-<kind>` (`trick-<kind>`) for each of the 6 tricks;
  - textures:
    - `halfpipe` (272x112): the lips at y 16, the floor at the bottom, a neon rim and painted stars;
    - `skateboard` (16x6);
    - `skate-rack` (32x20);
    - `skate-lamp` (12x10);
    - `icon-skatepark`;
    - `trick-kickflip`, `trick-spin360`, `trick-superman`, `trick-grab`, `trick-handstand`, `trick-backflip` (16x16).

- [ ] **Step 1:** Update the sticker test counts to 229 and 23. Run it and confirm it fails.
- [ ] **Step 2:** Add the page:

```js
page('skatepark', 'skateboard', [
  ['skate-park', 'icon-skatepark'], ['skate-board', 'skateboard'],
  ['trick-kickflip', 'trick-kickflip'], ['trick-spin360', 'trick-spin360'], ['trick-superman', 'trick-superman'],
  ['trick-grab', 'trick-grab'], ['trick-handstand', 'trick-handstand'], ['trick-backflip', 'trick-backflip'],
]),
```

- [ ] **Step 3:** Draw the art in `src/art/skate.js` (the same `one(key, w, h, fn)` pattern as `sunWorld.js`). Hook it into `textures.js`.
- [ ] **Step 4:** Run the tests and the build, and confirm both pass.
- [ ] **Step 5: Commit** with the message `feat(skate): Skate Park stickers and art`.

### Task 4: Skating in the mine

**Files:**
- Create: `src/scenes/mine/skateView.js`
- Modify: `src/scenes/MineScene.js`, `src/audio/wire.js`, `src/audio/sfx.js`

**Interfaces:**
- Consumes: `createPipe`, `createSkate`, `stepSkate`, `curveAt`, `SKATE`, and `world.skatepark`.
- Produces: `createSkateView(scene)` → `{ update(dt, time), riding(a), stepOff(a), lights(view, flicker) }`.
- The scene sets `a.skate` while someone is skating.

- [ ] **Step 1: Write `skateView.js`.**
  - **Setup:** if `world.skatepark` is set:
    - make `pipe = createPipe(x0·TILE, floor·TILE)` (272 px across all 17 cells);
    - add the `halfpipe` image at depth 1 (behind the players), four `skate-lamp` sprites on the ceiling, and the `skate-rack` with two `skateboard` sprites at the pipe's bottom centre;
    - earn the `skate-park` sticker when a player first enters the room.
  - **`update`:**
    - **Hopping on:** a player who isn't skating or bubbling, overlaps a board on the rack, and has left the rack area since their last ride, hops on:
      - `a.skate = createSkate(pipe, x)`;
      - earn `skate-board`;
      - emit `skateOn`.
    - **While skating:**
      - step with `intent.moveX` and a jump edge;
      - set `a.p.x/y` from the skate position (`x - PLAYER.w/2`, `y - PLAYER.h`);
      - handle events: `air` → emit `skatePop`; `trick` → emit `skateTrick` and a star trail; `land` → emit `skateLand`, confetti, and a burst of `spacegem` pickups, plus the `trick-<kind>` sticker for each trick landed.
    - **Stepping off:** a down edge steps off; the board tweens back to the rack.
  - **Drawing:** on each frame while skating, the board sits under the sprite, and the sprite is tilted by the curve's `angle`. Each trick has its own pose:
    - kickflip flips the board's `scaleY`;
    - spin360 flips `scaleX` twice;
    - superman lays you flat above the board (angle ±90, lifted);
    - grab tucks you (`scaleY` 0.8, board at hand);
    - handstand turns you upside down (angle 180);
    - backflip is a full 360° rotation.

- [ ] **Step 2: Wire it into `MineScene`.**
  - Create the view in `create()`.
  - In the slot loop, if `a.skate`, call `this.skateView.step(a, intent, dt)` instead of `stepAvatar`.
  - In `drawAvatar`, the skate view adjusts the sprite after `animateCharacter`.
  - `bonk` ignores skaters, as it does riders.
  - Stepping off happens before `startBubble` and `goHome`.
  - Skip `softWall` for skaters.
  - Add the lamp lights in `drawLights`.
  - Track the trip's gem count on `this.trip.skateGems`.

- [ ] **Step 3: Add sounds:** `skatePop` → a new `pop`/`boing`-style `ollie`, `skateTrick` → `whoosh`, `skateLand` → a new `ding`, `skateOn` → `join`.

- [ ] **Step 4: Check it in the browser** (with the `window.h` harness):
  - walk in, hop on, pump to big air, do tricks, get the landing gems, step off, and try co-op;
  - take screenshots.

- [ ] **Step 5: Commit** with the message `feat(skate): skating in the Moon Skate Park`.

### Task 5: Polish, README, memory, ship

- [ ] Iterate on the looks until the self-score is at least 8.5, and send screenshots to the owner.
- [ ] README: a Skate Park bullet under the Moon, and the sticker count 229 on 23 pages.
- [ ] Memory: write `skatepark-progress.md` and add its `MEMORY.md` line.
- [ ] Commit, then ask the owner before merging and pushing.
