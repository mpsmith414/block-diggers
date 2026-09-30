// The Mars claw machine: a glass cabinet full of prizes and a claw on a rail.
// Move the claw with the stick, press A to drop it: it grabs whatever is
// right below, lifts it (now and then the prize slips back), carries it to
// the chute and lets go. Pure: the mine steps it and draws it.

import { CLAW } from '../tuning.js';

// what each prize gives (and the toys give a sticker)
export const PRIZES = {
  ruby: { ores: { ruby: 3 } },
  bolt: { ores: { bolt: 3 } },
  coin: { ores: { coin: 3 } },
  opal: { ores: { opal: 3 } },
  robot: { ores: { bolt: 2, coin: 2 }, sticker: 'claw-robot' },
  martian: { ores: { ruby: 2, opal: 2 }, sticker: 'claw-martian' },
  golden: { ores: { ruby: 4, opal: 4, coin: 4 }, sticker: 'claw-golden' },
};

export const prizeReward = (kind) => ({
  ores: Object.entries(PRIZES[kind].ores).flatMap(([ore, n]) => Array(n).fill(ore)),
  sticker: PRIZES[kind].sticker ?? null,
});

// A fresh pile: the golden robot, two robots, two martians and the rest ores,
// spread along the bottom in a random order.
export function stockPrizes(rng) {
  const kinds = ['golden', 'robot', 'robot', 'martian', 'martian'];
  while (kinds.length < CLAW.prizes) kinds.push(rng.pick(['ruby', 'bolt', 'coin', 'opal']));
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  const [x0, x1] = CLAW.pile;
  const step = (x1 - x0) / (kinds.length - 1);
  return kinds.map((kind, i) => ({ kind, x: Math.round(x0 + i * step) }));
}

export function createClaw(prizes) {
  return { x: Math.round((CLAW.glass[0] + CLAW.glass[1]) / 2), y: CLAW.top, phase: 'idle', t: 0, held: null, slipChecked: false, prizes };
}

// Advance the claw. `intent.moveX` is -1..1; `edges.drop` is true on the frame
// A is pressed. Returns what happened: { type: 'drop' | 'grab' | 'miss' |
// 'slip' | 'prize', prize? }.
export function stepClaw(c, intent, edges, dt, rng) {
  const out = [];
  if (c.phase === 'idle') {
    c.x = Math.max(CLAW.glass[0], Math.min(CLAW.glass[1], c.x + (intent.moveX ?? 0) * CLAW.move * dt));
    if (edges.drop) {
      c.phase = 'down';
      out.push({ type: 'drop' });
    }
  } else if (c.phase === 'down') {
    c.y = Math.min(CLAW.grabY, c.y + CLAW.drop * dt);
    if (c.y >= CLAW.grabY) {
      c.phase = 'close';
      c.t = 0;
    }
  } else if (c.phase === 'close') {
    c.t += dt;
    if (c.t >= CLAW.close) {
      // whatever is right below the claw
      let best = null;
      for (const p of c.prizes) if (Math.abs(p.x - c.x) <= CLAW.reach && (!best || Math.abs(p.x - c.x) < Math.abs(best.x - c.x))) best = p;
      if (best) {
        c.prizes = c.prizes.filter((p) => p !== best);
        c.held = best;
        out.push({ type: 'grab', prize: best });
      } else {
        out.push({ type: 'miss' });
      }
      c.slipChecked = false;
      c.phase = 'up';
    }
  } else if (c.phase === 'up') {
    c.y = Math.max(CLAW.top, c.y - CLAW.drop * dt);
    if (c.held && !c.slipChecked && c.y <= (CLAW.top + CLAW.grabY) / 2) {
      c.slipChecked = true;
      if (rng.next() < CLAW.slip) {
        // (the same prize, back on the pile right below)
        const prize = c.held;
        prize.x = Math.round(c.x);
        c.prizes.push(prize);
        c.held = null;
        out.push({ type: 'slip', prize });
      }
    }
    if (c.y <= CLAW.top) c.phase = c.held ? 'carry' : 'idle';
  } else if (c.phase === 'carry') {
    c.x = Math.max(CLAW.chute, c.x - CLAW.move * dt);
    if (c.x <= CLAW.chute) {
      out.push({ type: 'prize', prize: c.held });
      c.held = null;
      c.phase = 'open';
      c.t = 0;
    }
  } else if (c.phase === 'open') {
    c.t += dt;
    if (c.t >= CLAW.open) c.phase = 'idle';
  }
  return out;
}
