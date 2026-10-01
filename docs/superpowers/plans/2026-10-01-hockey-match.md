# Ice Hockey Match Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Saturn's Ice Hockey into a real first-to-3 match against a team of penguins, with a puck you can actually see.

**Architecture:** The rules stay pure in `src/game/hockey.js`: a match phase machine (idle → countdown → play → scored/over), a score per team, and a small penguin-skater brain whose skaters are fed through the same push/shot rules as the players. `src/scenes/mine/hockeyView.js` draws it and turns its events into sounds, effects, stickers and treasure; `src/art/hockey.js` gets the new pictures.

**Tech Stack:** Phaser 3, Vite, Vitest (`npm test`).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-10-01-hockey-match-design.md`.
- First to **3** wins (`HOCKEY.target = 3`). You defend the **left** net, shoot at the **right**.
- 1 penguin skater solo, 2 in co-op, counted at each faceoff.
- No reading needed: pictures and numbers only.
- Sticker ids unchanged (`hockey-rink`, `hockey-goal`, `hockey-save`, `hockey-five`); `hockey-five` is now earned by winning a match.
- Goal treasure unchanged (2 pearls + a comet, up to 12 goals a trip); a win adds 4 pearls + 4 comets, up to 3 wins a trip, shared round-robin among the players on the ice.
- Only existing sounds.
- Never ship without the owner's approval.

---

### Task 1: The match rules

**Files:**
- Modify: `src/tuning.js` (the `HOCKEY` table)
- Modify: `src/game/hockey.js` (rewrite)
- Test: `tests/game/hockey.test.js` (rewrite)

**Interfaces:**
- Produces:
  - `createRink(x0, x1)` → `{ x0, x1, mid, mouthL, mouthR, puck: { x, vx }, goalies: [{ side, x, t, up, hold }], phase, timer, count, winner, score: { us, them }, skaters: [{ x, vx, facing, slipT, cool }], guard }`
  - `stepRink(r, bodies, dt, rng = null)` → events:
    - `{ type: 'countdown', n }`
    - `{ type: 'drop' }`
    - `{ type: 'hit', team }`
    - `{ type: 'shot', team }`
    - `{ type: 'save', side }`
    - `{ type: 'goal', team, side }`
    - `{ type: 'win' }` and `{ type: 'lose' }`
    - `{ type: 'reset' }`
    - `{ type: 'slip', i }`

    `bodies` are the players **in the rink**: `{ x, vx, onIce, facing, shoot }`. An empty list means everyone has left.
  - `hockeyReward()` → `['pearl', 'pearl', 'comet']`
  - `hockeyWinPrize(wins)` → 4 pearls + 4 comets while `wins <= HOCKEY.winCap`, else `[]`

- [ ] **Step 1: Tuning.** Replace the `HOCKEY` table in `src/tuning.js`:

```js
export const HOCKEY = {
  goal: 26, radius: 7, friction: 0.45, max: 340, shot: 300, nudge: 80, touch: 13, reach: 24,
  goalieW: 9, stand: 1.3, hop: 0.9, reset: 1.6, cap: 12,
  // the match: first to `target`, a 3-2-1 `countdown` before each faceoff, `overTime` of cheering after
  target: 3, countdown: 3, overTime: 3, winCap: 3,
  // the penguin skaters: slower than you (72), a weaker shot, and now and then they slip
  skaterSpeed: 50, skaterReach: 20, skaterShot: 220, shootRange: 70, shotCooldown: 1.5,
  slipChance: 0.12, slipTime: 0.8,
  // after a player touches the puck, the penguins can't for a moment (so a steal sticks)
  stealTime: 0.6,
};
```

- [ ] **Step 2: Write the failing tests.** Rewrite `tests/game/hockey.test.js` with the complete test file:

```js
import { describe, it, expect } from 'vitest';
import { createRink, stepRink, hockeyReward, hockeyWinPrize } from '../../src/game/hockey.js';
import { HOCKEY } from '../../src/tuning.js';
import { createRng } from '../../src/world/rng.js';

const DT = 1 / 60;
const rink = () => createRink(480, 752);
// in the rink but in the air: there, without touching the puck
const watcher = { x: 600, vx: 0, onIce: false, facing: 1 };
const skating = { ...watcher, onIce: true };
const run = (r, secs, bodies = () => [watcher], rng = null) => {
  const evs = [];
  for (let t = 0; t < secs; t += DT) evs.push(...stepRink(r, bodies(t), DT, rng));
  return evs;
};
const holdGoalies = (r, up) => { for (const g of r.goalies) g.hold = up; };
const startMatch = (r, players = [skating]) => run(r, HOCKEY.countdown + 0.1, () => players);
// a match with just the puck: no penguin skaters
const puckOnly = (r) => { startMatch(r); r.skaters = []; };

describe('ice hockey: the match', () => {
  it('waits with the puck in the middle until someone skates onto the ice', () => {
    const r = rink();
    expect(run(r, 2)).toEqual([]);
    expect(r.phase).toBe('idle');
    expect(r.puck).toEqual({ x: r.mid, vx: 0 });
    expect(r.skaters).toHaveLength(1);
  });

  it('skating onto the ice starts a 3-2-1 countdown, then the puck drops', () => {
    const r = rink();
    const evs = startMatch(r);
    expect(evs.filter((e) => e.type === 'countdown').map((e) => e.n)).toEqual([3, 2, 1]);
    const types = evs.map((e) => e.type);
    expect(types.indexOf('drop')).toBeGreaterThan(types.lastIndexOf('countdown'));
    expect(r.phase).toBe('play');
  });

  it('nobody can touch the puck during the countdown', () => {
    const r = rink();
    run(r, 2, () => [{ x: r.mid - 10, vx: 90, onIce: true, facing: 1, shoot: true }]);
    expect(r.phase).toBe('countdown');
    expect(r.puck).toEqual({ x: r.mid, vx: 0 });
  });

  it('one penguin skater solo, two in co-op', () => {
    const solo = rink();
    startMatch(solo);
    expect(solo.skaters).toHaveLength(1);
    const duo = rink();
    startMatch(duo, [skating, { ...skating, x: 560 }]);
    expect(duo.skaters).toHaveLength(2);
  });

  it('the puck slides to a stop on the ice', () => {
    const r = rink();
    puckOnly(r);
    r.puck.vx = 30;
    run(r, 8);
    expect(r.puck.vx).toBe(0);
    expect(r.puck.x).toBeGreaterThan(r.mid + 40);
  });

  it('skating into the puck knocks it along', () => {
    const r = rink();
    puckOnly(r);
    const x = r.puck.x;
    const evs = run(r, 0.1, () => [{ x: x - 12, vx: 90, onIce: true, facing: 1 }]);
    expect(evs).toContainEqual({ type: 'hit', team: 'us' });
    expect(r.puck.vx).toBeGreaterThan(90);
  });

  it('A right by the puck is a big shot, the way you face', () => {
    const r = rink();
    puckOnly(r);
    const evs = stepRink(r, [{ x: r.puck.x + 15, vx: 0, onIce: true, facing: -1, shoot: true }], DT);
    expect(evs).toContainEqual({ type: 'shot', team: 'us' });
    expect(r.puck.vx).toBeLessThan(-HOCKEY.shot * 0.98); // (a hair of ice friction already)
  });

  it('a goal in the right net is yours; then a new faceoff in the middle', () => {
    const r = rink();
    puckOnly(r);
    holdGoalies(r, true);
    r.puck.vx = HOCKEY.shot;
    const evs = run(r, 1.5);
    expect(evs).toContainEqual({ type: 'goal', team: 'us', side: 'right' });
    expect(r.score).toEqual({ us: 1, them: 0 });
    expect(r.phase).toBe('scored');
    const more = run(r, HOCKEY.reset + 0.2);
    expect(more).toContainEqual({ type: 'countdown', n: 3 });
    expect(r.phase).toBe('countdown');
    expect(r.puck).toEqual({ x: r.mid, vx: 0 });
  });

  it('a goal in the left net is the penguins\'', () => {
    const r = rink();
    puckOnly(r);
    holdGoalies(r, true);
    r.puck.vx = -HOCKEY.shot;
    expect(run(r, 1.5)).toContainEqual({ type: 'goal', team: 'them', side: 'left' });
    expect(r.score).toEqual({ us: 0, them: 1 });
  });

  it('a goalie standing in the goal saves it (and the puck bounces back out)', () => {
    const r = rink();
    puckOnly(r);
    holdGoalies(r, false);
    r.puck.vx = -HOCKEY.shot;
    const evs = run(r, 1.2);
    expect(evs).toContainEqual({ type: 'save', side: 'left' });
    expect(evs.some((e) => e.type === 'goal')).toBe(false);
    expect(r.puck.vx).toBeGreaterThan(0);
  });

  it('the goalies hop up and down on their own', () => {
    const r = rink();
    const seen = new Set();
    for (let t = 0; t < 6; t += 0.05) {
      stepRink(r, [watcher], 0.05);
      seen.add(r.goalies[0].up);
    }
    expect(seen).toEqual(new Set([true, false]));
  });

  it('first to 3 wins; after the cheering a fresh match starts at 0-0', () => {
    const r = rink();
    puckOnly(r);
    holdGoalies(r, true);
    r.score.us = 2;
    r.puck.vx = HOCKEY.shot;
    const evs = run(r, 1.5);
    const types = evs.map((e) => e.type);
    expect(types).toContain('win');
    expect(types.indexOf('win')).toBeGreaterThan(types.indexOf('goal'));
    expect(r.phase).toBe('over');
    expect(r.winner).toBe('us');
    const after = run(r, HOCKEY.overTime + 0.2);
    expect(after).toContainEqual({ type: 'reset' });
    expect(r.score).toEqual({ us: 0, them: 0 });
    expect(r.phase).toBe('countdown');
  });

  it('the penguins can win too', () => {
    const r = rink();
    puckOnly(r);
    holdGoalies(r, true);
    r.score.them = 2;
    r.puck.vx = -HOCKEY.shot;
    expect(run(r, 1.5).map((e) => e.type)).toContain('lose');
    expect(r.winner).toBe('them');
  });

  it('everyone leaving resets to 0-0 and sends the skaters to the bench', () => {
    const r = rink();
    startMatch(r);
    r.score.us = 2;
    expect(run(r, 0.1, () => [])).toContainEqual({ type: 'reset' });
    expect(r.phase).toBe('idle');
    expect(r.score).toEqual({ us: 0, them: 0 });
    run(r, 4, () => []);
    expect(r.skaters[0].x).toBeCloseTo(r.mouthR - 14, 0);
  });
});

describe('ice hockey: the penguin skaters', () => {
  it('a skater chases the puck and pushes it toward your (left) net', () => {
    const r = rink();
    startMatch(r);
    holdGoalies(r, false);
    const start = r.puck.x;
    const evs = run(r, 2.5);
    expect(evs).toContainEqual({ type: 'hit', team: 'them' });
    expect(r.puck.x).toBeLessThan(start - 30);
  });

  it('a skater shoots when it is close to your net, then waits before shooting again', () => {
    const r = rink();
    startMatch(r);
    holdGoalies(r, false);
    const shots = [];
    for (let t = 0; t < 12; t += DT) {
      for (const e of stepRink(r, [watcher], DT)) if (e.type === 'shot') shots.push({ t, team: e.team });
    }
    expect(shots.length).toBeGreaterThan(0);
    expect(shots.every((s) => s.team === 'them')).toBe(true);
    for (let i = 1; i < shots.length; i++) expect(shots[i].t - shots[i - 1].t).toBeGreaterThanOrEqual(HOCKEY.shotCooldown - 1e-9);
  });

  it('skating into the puck steals it from a penguin', () => {
    const r = rink();
    startMatch(r);
    r.skaters[0].x = r.puck.x + 11;
    const me = { x: r.puck.x - 12, vx: 90, onIce: true, facing: 1 };
    const evs = run(r, 0.1, () => [me]);
    expect(evs).toContainEqual({ type: 'hit', team: 'us' });
    expect(r.puck.vx).toBeGreaterThan(0);
  });

  it('penguins slip now and then, the same way every time for the same seed', () => {
    const slips = () => {
      const r = rink();
      const rng = createRng(7);
      run(r, 0.1, () => [skating], rng);
      return run(r, 30, () => [watcher], rng).filter((e) => e.type === 'slip');
    };
    expect(slips().length).toBeGreaterThan(0);
    expect(slips()).toEqual(slips());
  });
});

describe('ice hockey: treasure', () => {
  it('a goal gives pearls and a comet', () => {
    expect(hockeyReward()).toEqual(['pearl', 'pearl', 'comet']);
  });

  it('a win gives 4 pearls and 4 comets, up to 3 wins a trip', () => {
    expect(hockeyWinPrize(1)).toEqual(['pearl', 'pearl', 'pearl', 'pearl', 'comet', 'comet', 'comet', 'comet']);
    expect(hockeyWinPrize(HOCKEY.winCap)).toHaveLength(8);
    expect(hockeyWinPrize(HOCKEY.winCap + 1)).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the tests to see them fail.** Run `npx vitest run tests/game/hockey.test.js`. Expect them to fail on the missing `hockeyWinPrize` export and on the missing match phases.

- [ ] **Step 4: Write the rules.** Rewrite `src/game/hockey.js`:

```js
// Saturn's Ice Hockey: a real match, you against a team of penguins, first to 3.
// You defend the left net and shoot at the right one. Each net has a penguin
// goalie who hops up and down: a shot that gets there while he's up goes in;
// while he's standing he saves it. Penguin skaters chase the puck, push it
// toward your net and shoot; skate into it to steal it back. Pure: the mine
// steps it and draws it.

import { HOCKEY } from '../tuning.js';

const skater = (x) => ({ x, vx: 0, facing: -1, slipT: 0, cool: 0 });
// where the penguin skaters wait: by their own (right) net
const benchX = (r, i) => r.mouthR - 14 - i * 14;

export function createRink(x0, x1) {
  const mid = (x0 + x1) / 2;
  const mouthL = x0 + HOCKEY.goal;
  const mouthR = x1 - HOCKEY.goal;
  const r = {
    x0, x1, mid, mouthL, mouthR,
    puck: { x: mid, vx: 0 },
    goalies: [
      { side: 'left', x: mouthL + 8, t: 0, up: false, hold: null },
      { side: 'right', x: mouthR - 8, t: HOCKEY.stand * 0.6, up: false, hold: null },
    ],
    phase: 'idle', timer: 0, count: 0, winner: null,
    score: { us: 0, them: 0 },
    skaters: [],
    guard: 0,
  };
  r.skaters.push(skater(benchX(r, 0)));
  return r;
}

// The puck to the middle and a 3-2-1 countdown, with one penguin skater per player (up to 2).
function faceoff(r, players, out) {
  r.puck.x = r.mid;
  r.puck.vx = 0;
  r.guard = 0;
  const n = Math.min(2, Math.max(1, players));
  while (r.skaters.length < n) r.skaters.push(skater(benchX(r, r.skaters.length)));
  r.skaters.length = n;
  r.phase = 'countdown';
  r.timer = HOCKEY.countdown;
  r.count = HOCKEY.countdown;
  out.push({ type: 'countdown', n: r.count });
}

// Advance the rink. `bodies` are the players in the rink: { x (their middle),
// vx, onIce, facing, shoot (A pressed this frame) }; an empty list means
// everyone has left. `rng` makes the penguins slip now and then (none without it).
export function stepRink(r, bodies, dt, rng = null) {
  const out = [];
  // the goalies hop on their own clock (`hold` pins them, for tests)
  for (const g of r.goalies) {
    g.t = (g.t + dt) % (HOCKEY.stand + HOCKEY.hop);
    g.up = g.hold ?? g.t > HOCKEY.stand;
  }
  if (!bodies.length) {
    // everyone left: back to 0-0, and the skaters go back to the bench
    if (r.phase !== 'idle') {
      Object.assign(r, { phase: 'idle', timer: 0, winner: null, score: { us: 0, them: 0 }, guard: 0 });
      r.puck.x = r.mid;
      r.puck.vx = 0;
      out.push({ type: 'reset' });
    }
  } else if (r.phase === 'idle') {
    if (bodies.some((b) => b.onIce)) faceoff(r, bodies.length, out);
  } else if (r.phase === 'countdown') {
    r.timer -= dt;
    const n = Math.ceil(r.timer);
    if (r.timer <= 0) {
      r.phase = 'play';
      out.push({ type: 'drop' });
    } else if (n < r.count) {
      r.count = n;
      out.push({ type: 'countdown', n });
    }
  } else if (r.phase === 'scored' || r.phase === 'over') {
    r.timer -= dt;
    if (r.timer <= 0) {
      if (r.phase === 'over') {
        r.score = { us: 0, them: 0 };
        r.winner = null;
        out.push({ type: 'reset' });
      }
      faceoff(r, bodies.length, out);
    }
  }
  const penguins = stepSkaters(r, dt, rng, out);
  if (r.phase === 'play') playPuck(r, [...bodies, ...penguins], dt, out);
  return out;
}

// The penguin skaters' brain. The one nearest the puck chases it (to just
// right of it, so it pushes it left, toward your net); a second one hangs back
// halfway between the puck and your net. Close enough to your net, a chaser
// shoots, then waits. Now and then one slips and spins. Returns them as bodies.
function stepSkaters(r, dt, rng, out) {
  const p = r.puck;
  const playing = r.phase === 'play';
  let chaser = 0;
  r.skaters.forEach((s, i) => { if (Math.abs(s.x - p.x) < Math.abs(r.skaters[chaser].x - p.x)) chaser = i; });
  return r.skaters.map((s, i) => {
    s.cool = Math.max(0, s.cool - dt);
    if (s.slipT > 0) s.slipT -= dt;
    else if (playing && rng?.chance(HOCKEY.slipChance * dt)) {
      s.slipT = HOCKEY.slipTime;
      out.push({ type: 'slip', i });
    }
    if (s.slipT > 0) {
      s.vx = 0;
      return { x: s.x, vx: 0, onIce: false, facing: s.facing, team: 'them' };
    }
    let target;
    if (r.phase === 'idle') target = benchX(r, i);
    else if (r.phase === 'over') target = s.x;
    else if (!playing) target = r.mid + 18 + i * 14;
    else if (i === chaser) target = p.x + HOCKEY.touch - 2;
    else target = (p.x + r.mouthL) / 2;
    const dx = target - s.x;
    s.vx = Math.abs(dx) < 0.5 ? 0 : Math.sign(dx) * Math.min(HOCKEY.skaterSpeed, Math.abs(dx) / dt);
    s.x += s.vx * dt;
    if (s.vx) s.facing = Math.sign(s.vx);
    const shoot = playing && i === chaser && s.cool <= 0 && r.guard <= 0
      && p.x < s.x && s.x - p.x < HOCKEY.skaterReach && p.x - r.mouthL < HOCKEY.shootRange;
    if (shoot) {
      s.cool = HOCKEY.shotCooldown;
      s.facing = -1;
    }
    return { x: s.x, vx: s.vx, onIce: playing, facing: s.facing, shoot, power: HOCKEY.skaterShot, team: 'them' };
  });
}

// The puck: knocked and shot by everyone on the ice, slowed by the ice,
// saved by a standing goalie, and into a net is a goal.
function playPuck(r, bodies, dt, out) {
  const p = r.puck;
  r.guard = Math.max(0, r.guard - dt);
  for (const b of bodies) {
    if (!b.onIce) continue;
    const team = b.team ?? 'us';
    const dx = p.x - b.x;
    // penguins skate around the puck from the wrong side, and leave it alone
    // just after a player touched it (so a steal sticks)
    if (team === 'them' && (dx > 0 || r.guard > 0)) continue;
    if (b.shoot && Math.abs(dx) < HOCKEY.reach) {
      p.vx = (b.facing || Math.sign(dx) || 1) * (b.power ?? HOCKEY.shot);
      out.push({ type: 'shot', team });
      if (team === 'us') r.guard = HOCKEY.stealTime;
    } else if (Math.abs(dx) < HOCKEY.touch) {
      const dir = Math.sign(dx) || b.facing || 1;
      if ((b.vx - p.vx) * dir > 0) {
        p.vx = dir * Math.min(HOCKEY.max, Math.max(Math.abs(b.vx) * 1.4, HOCKEY.nudge));
        out.push({ type: 'hit', team });
        if (team === 'us') r.guard = HOCKEY.stealTime;
      }
      p.x = b.x + dir * HOCKEY.touch;
    }
  }
  p.vx -= p.vx * HOCKEY.friction * dt;
  if (Math.abs(p.vx) < 2) p.vx = 0;
  p.x += p.vx * dt;
  // the goalies: standing in the way, they save it
  for (const g of r.goalies) {
    const toward = g.side === 'left' ? p.vx < 0 : p.vx > 0;
    if (!g.up && toward && Math.abs(p.x - g.x) < HOCKEY.goalieW) {
      const away = g.side === 'left' ? 1 : -1;
      p.vx = away * Math.max(80, Math.abs(p.vx) * 0.7);
      p.x = g.x + away * HOCKEY.goalieW;
      out.push({ type: 'save', side: g.side });
    }
  }
  // into a net: GOAL! The right net is yours to score in, the left the penguins'
  const side = p.x < r.mouthL ? 'left' : p.x > r.mouthR ? 'right' : null;
  if (!side) return;
  p.x = side === 'left' ? r.mouthL - 12 : r.mouthR + 12;
  p.vx = 0;
  const team = side === 'right' ? 'us' : 'them';
  r.score[team]++;
  out.push({ type: 'goal', team, side });
  if (r.score[team] >= HOCKEY.target) {
    r.phase = 'over';
    r.winner = team;
    r.timer = HOCKEY.overTime;
    out.push({ type: team === 'us' ? 'win' : 'lose' });
  } else {
    r.phase = 'scored';
    r.timer = HOCKEY.reset;
  }
}

export const hockeyReward = () => ['pearl', 'pearl', 'comet'];
// a win's prize (`wins` counts this trip's wins, this one included)
export const hockeyWinPrize = (wins) => (wins <= HOCKEY.winCap
  ? ['pearl', 'pearl', 'pearl', 'pearl', 'comet', 'comet', 'comet', 'comet'] : []);
```

- [ ] **Step 5: Run the tests to see them pass.** Run `npx vitest run tests/game/hockey.test.js` and expect all of them to pass. If the slip test sees no slips with seed 7, try a different seed. Don't change `slipChance` for this.

- [ ] **Step 6: Commit** with the message `feat(hockey): a real match against the penguins (rules)`.

---

### Task 2: The new pictures

**Files:**
- Modify: `src/art/hockey.js`

**Interfaces:**
- Produces the texture keys:
  - `hockey-puck` (12×6)
  - `hockey-puck-shadow` (14×3)
  - `hockey-scarf` (32×12: frame 0 blue, frame 1 red; laid over the 16×12 `penguin` frames)
  - `hockey-stick` (8×10, blade forward to the right)
  - `hockey-trophy` (16×18)
  - `hockey-flag` (16×18)
  - `hockey-board` (now 80×36, with no snowball)

  `hockey-ball` stays, because it's the `hockey-goal` sticker's icon.

- [ ] **Step 1: Draw the art.** In `drawHockeyArt`:
  - **Replace the `hockey-board` block** with an 80×36 board (the same border lights, the same tail, no snowball):

```js
  // the scoreboard (80x36): your face and score on the left, a penguin's on the right
  one('hockey-board', 80, 36, (ctx) => {
    rect(ctx, OUT, 0, 0, 80, 32);
    rect(ctx, '#1a2a5a', 2, 2, 76, 28);
    for (let x = 4; x < 78; x += 6) { rect(ctx, x % 12 === 4 ? '#9fe8ff' : '#ffffff', x, 3, 2, 2); rect(ctx, x % 12 === 4 ? '#ffffff' : '#9fe8ff', x, 27, 2, 2); }
    rect(ctx, '#2e4a8a', 39, 7, 2, 18);
    rect(ctx, OUT, 38, 32, 4, 4);
  });
```

  - **Add after the puck block:**

```js
  // the real puck: a flat dark disc with a light-blue rim (12x6), and its shadow
  one('hockey-puck', 12, 6, (ctx) => {
    rect(ctx, OUT, 1, 0, 10, 6);
    rect(ctx, OUT, 0, 1, 12, 4);
    rect(ctx, '#1c2440', 1, 1, 10, 4);
    rect(ctx, '#7ad8ff', 1, 1, 10, 1);
    rect(ctx, '#c8f0ff', 3, 1, 3, 1);
    rect(ctx, '#2e3a60', 1, 4, 10, 1);
  });
  one('hockey-puck-shadow', 14, 3, (ctx) => {
    rect(ctx, 'rgba(20,30,70,0.45)', 2, 0, 10, 3);
    rect(ctx, 'rgba(20,30,70,0.45)', 0, 1, 14, 1);
  });

  // scarves to lay over a penguin (16x12 frames): 0 your team (blue), 1 theirs (red)
  one('hockey-scarf', 32, 12, (ctx, tex) => {
    [['#3a8aff', '#9fd0ff'], ['#e0403a', '#ffb0a0']].forEach(([c, stripe], f) => {
      const x = f * 16;
      rect(ctx, OUT, x + 3, 5, 8, 3);
      rect(ctx, c, x + 4, 5, 6, 2);
      rect(ctx, stripe, x + 6, 5, 1, 2);
      rect(ctx, OUT, x + 1, 6, 3, 4);
      rect(ctx, c, x + 2, 6, 1, 3);
      tex.add(f, 0, x, 0, 16, 12);
    });
  });

  // a little hockey stick (8x10): the blade points forward (right)
  one('hockey-stick', 8, 10, (ctx) => {
    for (let y = 0; y < 8; y++) rect(ctx, '#c08850', 1 + Math.floor(y / 2), y, 1, 1);
    rect(ctx, '#8a5a30', 1, 0, 1, 2);
    rect(ctx, OUT, 4, 8, 4, 2);
    rect(ctx, '#ffffff', 5, 8, 2, 1);
  });

  // the winners' trophy (16x18) and the penguins' flag (16x18)
  one('hockey-trophy', 16, 18, (ctx) => {
    rect(ctx, OUT, 2, 0, 12, 9);
    rect(ctx, '#ffd84a', 3, 1, 10, 7);
    rect(ctx, '#fff2a0', 4, 1, 2, 5);
    rect(ctx, OUT, 0, 2, 3, 4);
    rect(ctx, OUT, 13, 2, 3, 4);
    rect(ctx, '#ffd84a', 1, 3, 1, 2);
    rect(ctx, '#ffd84a', 14, 3, 1, 2);
    rect(ctx, OUT, 6, 9, 4, 4);
    rect(ctx, '#e0a020', 7, 9, 2, 4);
    rect(ctx, OUT, 3, 13, 10, 5);
    rect(ctx, '#3a8aff', 4, 14, 8, 3);
    rect(ctx, '#ffffff', 7, 15, 2, 1);
  });
  one('hockey-flag', 16, 18, (ctx) => {
    rect(ctx, OUT, 0, 0, 2, 18);
    rect(ctx, '#c0c8d8', 0, 0, 1, 18);
    rect(ctx, OUT, 2, 1, 14, 10);
    rect(ctx, '#e0403a', 2, 2, 13, 8);
    rect(ctx, '#2a2a4a', 6, 3, 6, 6);
    rect(ctx, '#ffffff', 7, 5, 4, 4);
    rect(ctx, '#ffffff', 7, 4, 1, 1);
    rect(ctx, '#ffffff', 10, 4, 1, 1);
    rect(ctx, '#ffb030', 8, 6, 2, 1);
  });
```

- [ ] **Step 2: Run the suite.** Run `npm test` and expect it to pass. Nothing asserts on the art yet; this checks that nothing else broke.
- [ ] **Step 3: Commit** with the message `feat(hockey): art for the match (puck, scarves, sticks, trophy, flag, board)`.

---

### Task 3: The rink in the mine

**Files:**
- Modify: `src/scenes/mine/hockeyView.js` (rewrite)
- Modify: `src/audio/wire.js` (new hockey sounds)
- Modify: `README.md` (the Ice Hockey paragraph)

**Interfaces:**
- Consumes everything from Task 1 and the texture keys from Task 2.
- Scene events it emits:
  - `hockeyHit`, `hockeyShot`, `hockeySave`, `hockeyGoal`: existing;
  - `hockeyThem`, `hockeyCountdown`, `hockeyWin`, `hockeyLose`: new.

- [ ] **Step 1: Wire the sounds.** In `src/audio/wire.js`, next to the `hockeyGoal` line:

```js
  hockeyThem: (s) => s.play('squeak'),
  hockeyCountdown: (s) => s.play('beep'),
  hockeyWin: (s) => s.play('party'),
  hockeyLose: (s) => { s.play('squeak'); setTimeout(() => s.play('squeak'), 180); },
```

- [ ] **Step 2: Rewrite `src/scenes/mine/hockeyView.js`.** Keep the `NONE` stub, the room, the aurora, the boards, the nets, the lamps and the `lights()` function as they are. The changes:
  - **The rink and the random generator:** `const rink = createRink(room.x0, room.x1);` and `const rng = createRng((scene.seed ?? 1) ^ 0x40c4e1);`. Pass `rng` to `stepRink`.
  - **Bodies:** only the players whose middle is `inRoom` (and who aren't bubbling) become bodies. The rest of the body logic is unchanged.
  - **The goalies:** each goalie sprite gets a matching `hockey-scarf` sprite: frame 0 for the left goalie, frame 1 for the right. It has the same origin, scale and flip, and is redrawn at the same position, angle and scale every frame.
  - **The skaters:** a pool of 2 penguins, each with a red scarf and a `hockey-stick`, at depth 5, scale 1.2. Each frame, skater `i` is shown if `i < rink.skaters.length`. It's drawn at `(s.x, floorY)` with `flipX = s.facing < 0` and a waddle bob (`-|sin(t*14)|*1.5` while moving). While `slipT > 0` it spins (`angle = slipT * 900`). While the penguins have won (`phase === 'over' && winner === 'them'`) it dances (`-|sin(t*10)|*5`).
  - **Players' sticks:** one `hockey-stick` per avatar, at depth 31. It's shown when the avatar's middle is in the room and its feet are on the ice, at `(a.sprite.x + a.p.facing * 6, floorY)`, with `flipX = a.p.facing < 0`.
  - **The puck:** a `hockey-puck` at `(x, floorY)` with origin `(0.5, 1)` and depth 7, and a `hockey-puck-shadow` at `(x, floorY - 1)` with origin `(0.5, 0)` and depth 6.9. A `trail` Graphics object (depth 6.8) is cleared each frame. When `|vx| > 120` it draws three short light lines behind the puck.
  - **Ice spray:** every hit or shot sparkles `0xdff4ff` at the puck.
  - **The scoreboard:** the 80-wide board at `(mid, floorY - 110)`.
    - The first avatar's `char-<char>` frame 0, at scale 0.6, sits at `mid - 30`, with the `us` number at `mid - 12`.
    - A `penguin` frame 0 at scale 0.8 sits at `mid + 14`, with the `them` number at `mid + 31`.
    - Both numbers are `bitmapText('pixel')` at scale 2. The face texture is set lazily, once an avatar exists.
  - **The countdown:** a `bitmapText` at `(mid, floorY - 56)`, scale 4, depth 40. On `countdown` it shows `n` and pops from scale 6 to 4. On `drop` it hides.
  - **Events:**
    - `hit` and `shot`: as today, plus the spray.
    - `save`: as today, with the goalie's squash also applied to its scarf.
    - `goal`, team `us`: today's celebration (lamp `right`, horn, confetti, `hockey-goal` sticker, goal ores within `HOCKEY.cap`), and the right goalie flops.
    - `goal`, team `them`: emit `hockeyThem`, flash lamp `left`, sparkle, and the left goalie flops.
    - Both goals update the two numbers.
    - `win`:
      - emit `hockeyWin`, then confetti at both nets;
      - the `hockey-trophy` pops in over the right net (scale 0 to 1.5 with a Back ease), then fades out after `overTime`;
      - earn `hockey-five`;
      - `trip.hockeyWins++`; the prize `hockeyWinPrize(trip.hockeyWins)` is dealt round-robin to the players on the ice (or the first avatar) with `flyOres`.
    - `lose`: emit `hockeyLose`. The `hockey-flag` appears over the left net and waves (a `scaleX` yoyo tween), then fades after `overTime`.
    - `reset`: both numbers go to 0.
    - `countdown`: emit `hockeyCountdown`.
  - **Your goalie's dance:** while `phase === 'over' && winner === 'us'`, the left goalie (and its scarf) wiggle (`angle = sin(t*12) * 15`).
  - **`framePoints`:** the bottom becomes `floorY + 12`, so the ice row shows under the puck.
  - **Removed:** the old `HOCKEY.trick` use and the `hockey-ball` image.

- [ ] **Step 3: Update the README.** Replace the Ice Hockey paragraph so it describes the match: you against the penguins, first to 3, your net on the left, a blue-scarf goalie for you, and penguin skaters (1 solo, 2 in co-op) who chase, steal and shoot. List the treasure for a goal and for a win.

- [ ] **Step 4: Run the tests and the build.** Run `npm test && npm run build`. Expect everything to pass and the build to succeed.

- [ ] **Step 5: Check it in the browser.** Start the `dev` preview, then use `h.quick('Mine', { planet: 'saturn' })` and `h.goCell` into `world.rink`. Then:
  1. **The puck:** screenshot the puck on the ice and the scoreboard.
  2. **The countdown:** hold an arrow key onto the ice and screenshot mid-countdown.
  3. **A goal for you:** pin the goalies up (`rink.goalies[i].hold = true`) through a dev handle, shoot right, and screenshot the goal.
  4. **A win:** set `score.us = 2` and score again, then screenshot the trophy.
  5. **A loss:** set `score.them = 2`, let the penguin score (or push the puck left), and screenshot the flag and the dance.
  6. **Co-op:** add a second player with `h.pad(1, { a: true })`, then check that 2 skaters appear at the next faceoff.
  7. **Errors:** check the console for errors.

  To reach the rink state, expose it as `view.rink` from the view object (read-only use in dev).

- [ ] **Step 6: Commit** with the message `feat(hockey): the match in the mine: penguin skaters, sticks, countdown, trophy and flag`.
