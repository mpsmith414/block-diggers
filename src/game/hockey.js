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
    // close to your net with its shot not ready yet, it waits just behind the
    // puck (in reach, not pushing) instead of dribbling into the goalie
    else if (i === chaser) target = p.x + (s.cool > 0 && p.x - r.mouthL < HOCKEY.shootRange ? HOCKEY.skaterReach - 4 : HOCKEY.touch - 2);
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
