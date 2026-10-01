# Build Yard Cloud Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Riding a magic cloud in the Build Yard lets a young child fly anywhere, through their builds, and put or take blocks in the square they're in.

**Architecture:** The pure movement and placement helpers go in `src/game/build.js`: `flyStep`, `cellOf` and `popUp`. `BuildScene` switches a player between walking (`stepPlayer`) and riding (`flyStep`), on a second Y in the air. While riding, A and B act on `cellOf(p)`, and holding them paints.

**Tech Stack:** Phaser 3, Vite, Vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-10-01-build-cloud-design.md`.
- **Hop on and off:** Y in the air (or on a ladder) hops on; Y on the cloud hops off.
- **Speed:** `BUILD.flySpeed = 90` px/s. Riders never enter the bedrock row or leave the yard.
- **Riders** never block building.
- **The gate:** it only works within 2 squares of the grass.
- **Saves and sounds:** no change to the save format. Only existing sounds (whoosh, pop).

---

### Task 1: The pure helpers

**Files:**
- Modify: `src/tuning.js:463` (`BUILD` gains `flySpeed: 90`)
- Modify: `src/game/build.js` (add `flyStep`, `cellOf`, `popUp`)
- Test: `tests/game/build.test.js` (new `describe` block)

**Interfaces:**
- Produces:
  - `flyStep(p, moveX, moveY, dt)`: mutates `p` and returns nothing;
  - `cellOf(p)` → `{ x, y }`;
  - `popUp(grid, p)` → `boolean`.

- [ ] **Step 1: Write the failing tests.** Add `flyStep`, `cellOf` and `popUp` to the import line, add `createPlayer` and `standAt` from `../../src/game/player.js`, and add:

```js
describe('the build yard: the magic cloud', () => {
  const at = (cx, cy) => createPlayer(standAt(cx, cy));

  it('flies any way the stick points, at the fly speed (diagonals no faster)', () => {
    const p = at(20, 20);
    const x0 = p.x;
    const y0 = p.y;
    flyStep(p, 1, 0, 1);
    expect(p.x - x0).toBeCloseTo(BUILD.flySpeed);
    const q = at(20, 20);
    flyStep(q, 1, -1, 1);
    expect(Math.hypot(q.x - x0, q.y - y0)).toBeCloseTo(BUILD.flySpeed);
    expect(q.y).toBeLessThan(y0);
    expect(q.facing).toBe(1);
    const r = at(20, 20);
    flyStep(r, -1, 0, 0.1);
    expect(r.facing).toBe(-1);
  });

  it('stays inside the yard: not off the ends, not above the sky, never into the bedrock', () => {
    const p = at(10, 10);
    flyStep(p, -1, -1, 100);
    expect(p.x).toBeGreaterThanOrEqual(0);
    expect(p.y).toBeGreaterThanOrEqual(0);
    flyStep(p, 1, 1, 100);
    expect(p.x + PLAYER.w).toBeLessThanOrEqual(BUILD.w * TILE);
    expect(p.y + PLAYER.h).toBeLessThanOrEqual((BUILD.h - 1) * TILE);
  });

  it('knows which square you are in (your middle)', () => {
    expect(cellOf(at(12, 7))).toEqual({ x: 12, y: 7 });
  });

  it('hopping off inside a build pops you up on top of it', () => {
    const g = createYard();
    const p = at(10, BUILD.ground - 1);
    g.set(10, BUILD.ground - 1, B.STONE);
    expect(popUp(g, p)).toBe(true);
    expect(cellOf(p)).toEqual({ x: 10, y: BUILD.ground - 2 });
    // a tall pillar: all the way to the top of it
    for (let y = BUILD.ground - 6; y < BUILD.ground; y++) g.set(20, y, B.BRICKS);
    const q = at(20, BUILD.ground - 3);
    expect(popUp(g, q)).toBe(true);
    expect(cellOf(q)).toEqual({ x: 20, y: BUILD.ground - 7 });
    // in open air: left alone
    const r = at(30, 10);
    const y = r.y;
    expect(popUp(g, r)).toBe(false);
    expect(r.y).toBe(y);
  });

  it('a ladder or water is not "inside" anything', () => {
    const g = createYard();
    g.set(10, BUILD.ground - 1, B.LADDER);
    expect(popUp(g, at(10, BUILD.ground - 1))).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to see them fail.** Run `npx vitest run tests/game/build.test.js` and expect failures because `flyStep` and the others aren't exported yet.

- [ ] **Step 3: Implement.** In `src/tuning.js`, change the line to `export const BUILD = { w: 72, h: 30, ground: 26, gate: 3, flySpeed: 90 };`. In `src/game/build.js`, after `aimCell`, add:

```js
// ---- the magic cloud: fly anywhere (even through your builds) and build
// right where you are ----

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Fly a cloud rider the way the stick points (diagonals no faster), inside
// the yard: not off the ends, not above the sky, never into the bedrock.
export function flyStep(p, moveX, moveY, dt) {
  const len = Math.hypot(moveX, moveY);
  const k = len > 1 ? 1 / len : 1;
  p.vx = moveX * k * BUILD.flySpeed;
  p.vy = moveY * k * BUILD.flySpeed;
  p.x = clamp(p.x + p.vx * dt, 0, BUILD.w * TILE - PLAYER.w);
  p.y = clamp(p.y + p.vy * dt, 0, (BUILD.h - 1) * TILE - PLAYER.h);
  if (Math.abs(moveX) > 0.3) p.facing = Math.sign(moveX);
  p.grounded = false;
  p.climbing = false;
}

// The square a player's middle is in.
export const cellOf = (p) => ({ x: Math.floor((p.x + PLAYER.w / 2) / TILE), y: Math.floor((p.y + PLAYER.h / 2) / TILE) });

// Hopping off inside a build: up to stand in the nearest free square above.
// Returns true if it moved you.
export function popUp(grid, p) {
  const x0 = Math.floor(p.x / TILE);
  const x1 = Math.floor((p.x + PLAYER.w - 1) / TILE);
  const solidRow = (y0, y1) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (isSolid(grid.get(x, y))) return true;
    return false;
  };
  const top = Math.floor(p.y / TILE);
  const feet = Math.floor((p.y + PLAYER.h - 1) / TILE);
  if (!solidRow(top, feet)) return false;
  let row = feet;
  while (row > 0 && solidRow(row, row)) row--;
  p.y = (row + 1) * TILE - PLAYER.h;
  p.vy = 0;
  return true;
}
```

- [ ] **Step 4: Run the tests to see them pass.** Run `npx vitest run tests/game/build.test.js` and expect them all to pass.
- [ ] **Step 5: Commit** with the message `feat(build): the magic cloud's rules (fly, the square you're in, pop up)`.

---

### Task 2: Riding the cloud in the yard

**Files:**
- Modify: `src/art/build.js` (`yard-cloud`, `btn-y`)
- Modify: `src/audio/wire.js` (the `BUILD` table: `cloudOn` plays whoosh, `cloudOff` plays pop)
- Modify: `src/scenes/BuildScene.js`
- Modify: `README.md` (the Build Yard section)

**Interfaces:**
- Consumes `flyStep`, `cellOf` and `popUp` from Task 1.

- [ ] **Step 1: Draw the art.** In `drawBuildArt`, add:

```js
  // the magic cloud you ride to build anywhere (22x9)
  one('yard-cloud', 22, 9, (ctx) => {
    for (const [x, y, r] of [[5, 5, 4], [11, 4, 5], [17, 5, 4]]) {
      ctx.fillStyle = '#9ab4d8';
      ctx.beginPath(); ctx.arc(x, y + 0.5, r, 0, Math.PI * 2); ctx.fill();
    }
    for (const [x, y, r] of [[5, 5, 3.4], [11, 4, 4.4], [17, 5, 3.4]]) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    rect(ctx, '#dce8f8', 3, 7, 16, 1);
  });
  // a yellow Y button, for the hint (10x10)
  one('btn-y', 10, 10, (ctx) => drawMap(ctx, 0, 0, [
    '..oooooo..',
    '.oyyyyyyo.',
    'oyywYYwyyo',
    'oyywYYwyyo',
    'oyyYwwYyyo',
    'oyyYwwYyyo',
    'oyyYwwYyyo',
    'oyyyyyyyYo',
    '.oYYYYYYo.',
    '..oooooo..',
  ], { o: '#5a4a10', y: '#ffd84a', Y: '#d8a820', w: '#ffffff' }));
```

- [ ] **Step 2: Wire the sounds.** In the `BUILD` table in `src/audio/wire.js`, add `cloudOn: (s) => s.play('whoosh'),` and `cloudOff: (s) => s.play('pop'),`.

- [ ] **Step 3: Update `BuildScene`.**
  - **Each avatar gets:**
    - `cloud`: an image `yard-cloud`, origin `(0.5, 0)`, depth 29.5, hidden;
    - `hint`: a container (depth 33, hidden) holding `btn-y` at `(-7, 0)` and a `yard-cloud` at `(8, 1)`, scale 0.6;
    - `riding = false`, `rodeCloud = false`, `yLock = false`, `paintKey = null`;
    - an edge `y: createEdge()`.
  - **The Y edge:** compute `e.y = a.edges.y(!!i.bubble)`.
  - **Hopping off:** if `riding && e.y`:
    - set `riding = false` and `a.yLock = true`;
    - call `popUp(this.grid, a.p)` (sparkle if it returned true);
    - set `a.p.vy = 0`;
    - emit `cloudOff`.
  - **Hopping on:** else if `!riding && e.y && !a.p.grounded`:
    - set `riding = true`, `rodeCloud = true` and `a.p.vy = 0`;
    - emit `cloudOn`;
    - sparkle white.
  - **Releasing Y:** clear `a.yLock` when `!i.bubble`.
  - **Riding:**
    - call `flyStep(a.p, i.moveX, i.moveY, dt)`, with the target `cellOf(a.p)`;
    - **A held** (`i.jump`): if the cell key differs from `a.paintKey`, `this.place(a, cell, true)` and set `a.paintKey`;
    - **B held** (`i.home`): if the key differs, `this.dig(cell)` and set the key;
    - when neither is held, set `a.paintKey = null`;
    - the prompts and the ghost use `cell`, not `aimCell`.
  - **Walking:** as today. The move's jump is `!!i.bubble && !a.yLock`, and the A/B edges use `aimCell`.
  - **The gate:** `atGate` additionally needs `a.p.y + PLAYER.h >= GROUND_Y - 2 * TILE`.
  - **Who blocks building:** `place()` passes `bodies` from the avatars where `!o.riding` only. A quiet `place(a, aim, painting)` skips the `nope` sound when `painting`, so painting into a full square is silent.
  - **Drawing:**
    - while riding, call `animateCharacter` with `{ ...a.p, vx: 0, vy: 0, grounded: true }`, so the rider stands;
    - the cloud is shown at `(a.sprite.x, a.sprite.y - 1 + sin(time/300))`;
    - the hint is shown while `!a.rodeCloud && !a.riding && !a.p.grounded && !a.p.climbing`, at `(a.sprite.x, a.sprite.y - 30)`.
  - **The file's top comment** mentions the cloud.

- [ ] **Step 4: Update the README.** In the Build Yard section, add: "**The magic cloud:** jump, then press Y again in the air to hop on a cloud. Fly anywhere (even through your builds): A puts a block in the square you're in, B takes it away, and holding A (or B) while you fly paints a line. Y hops off (you pop up on top if you're inside a build)."

- [ ] **Step 5: Run the tests and the build.** Run `npm test && npm run build` and expect everything to pass and the build to succeed.

- [ ] **Step 6: Check it in the browser.** Use `h.quick('Build')` (or start the scene from Camp), then:
  1. jump and Y again to hop on;
  2. fly up and paint a horizontal line by holding A;
  3. put a block in the square you're in;
  4. erase with B;
  5. hop off inside the line, then check you pop up on top;
  6. try a second player on a pad with two clouds;
  7. press A high over the gate and check it does nothing, then near the grass and check it goes back to camp;
  8. take screenshots and check the console for errors.

- [ ] **Step 7: Commit** with the message `feat(build): ride a magic cloud to build anywhere`.
