// Saturn's Ice Hockey: a giant snowball puck slides on the ice between two
// goals. Skate into it to knock it along, press A right by it for a big shot.
// Each goal has a penguin goalie who hops up and down: shoot while he's up and
// it's a GOAL; while he's down he saves it. Any goal counts for everyone.
// Pure: the mine steps it and draws it.

import { HOCKEY } from '../tuning.js';

export function createRink(x0, x1) {
  const mid = (x0 + x1) / 2;
  const mouthL = x0 + HOCKEY.goal;
  const mouthR = x1 - HOCKEY.goal;
  return {
    x0, x1, mid, mouthL, mouthR,
    puck: { x: mid, vx: 0 },
    goalies: [
      { side: 'left', x: mouthL + 8, t: 0, up: false, hold: null },
      { side: 'right', x: mouthR - 8, t: HOCKEY.stand * 0.6, up: false, hold: null },
    ],
    score: 0, resetT: 0,
  };
}

// Advance the rink. `bodies` are the players: { x (their middle), vx,
// onIce, facing, shoot (A pressed this frame) }. Returns what happened:
// hit, shot, save { side }, goal { side }, drop (the puck back in the middle).
export function stepRink(r, bodies, dt) {
  const out = [];
  // the goalies hop on their own clock (`hold` pins them, for tests)
  for (const g of r.goalies) {
    g.t = (g.t + dt) % (HOCKEY.stand + HOCKEY.hop);
    g.up = g.hold ?? g.t > HOCKEY.stand;
  }
  if (r.resetT > 0) {
    r.resetT -= dt;
    if (r.resetT <= 0) {
      r.puck.x = r.mid;
      r.puck.vx = 0;
      out.push({ type: 'drop' });
    }
    return out;
  }
  const p = r.puck;
  for (const b of bodies) {
    if (!b.onIce) continue;
    const dx = p.x - b.x;
    if (b.shoot && Math.abs(dx) < HOCKEY.reach) {
      p.vx = (b.facing || Math.sign(dx) || 1) * HOCKEY.shot;
      out.push({ type: 'shot' });
    } else if (Math.abs(dx) < HOCKEY.touch) {
      const dir = Math.sign(dx) || b.facing || 1;
      if ((b.vx - p.vx) * dir > 0) {
        p.vx = dir * Math.min(HOCKEY.max, Math.max(Math.abs(b.vx) * 1.4, HOCKEY.nudge));
        out.push({ type: 'hit' });
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
  // into a net: GOAL!
  const side = p.x < r.mouthL ? 'left' : p.x > r.mouthR ? 'right' : null;
  if (side) {
    p.x = side === 'left' ? r.mouthL - 12 : r.mouthR + 12;
    p.vx = 0;
    r.score++;
    r.resetT = HOCKEY.reset;
    out.push({ type: 'goal', side });
  }
  return out;
}

export const hockeyReward = () => ['pearl', 'pearl', 'comet'];
