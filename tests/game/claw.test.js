import { describe, it, expect } from 'vitest';
import { PRIZES, stockPrizes, createClaw, stepClaw, prizeReward } from '../../src/game/claw.js';
import { createRng } from '../../src/world/rng.js';
import { CLAW } from '../../src/tuning.js';

const fixed = (v) => ({ next: () => v, int: (a) => a, pick: (xs) => xs[0], chance: (p) => v < p });
const run = (c, secs, intent = { moveX: 0 }, drop = false, rng = fixed(0.99)) => {
  const evs = [];
  for (let t = 0; t < secs; t += 1 / 60) evs.push(...stepClaw(c, intent, { drop: drop && t === 0 }, 1 / 60, rng));
  return evs;
};

describe('the claw machine', () => {
  it('is stocked with ten prizes, one of them the golden robot, all inside the pile', () => {
    for (let seed = 1; seed < 20; seed++) {
      const prizes = stockPrizes(createRng(seed));
      expect(prizes).toHaveLength(CLAW.prizes);
      expect(prizes.filter((p) => p.kind === 'golden')).toHaveLength(1);
      for (const p of prizes) {
        expect(Object.keys(PRIZES)).toContain(p.kind);
        expect(p.x).toBeGreaterThanOrEqual(CLAW.pile[0]);
        expect(p.x).toBeLessThanOrEqual(CLAW.pile[1]);
      }
    }
  });

  it('moves left and right with the stick, but only inside the glass', () => {
    const c = createClaw([]);
    run(c, 5, { moveX: 1 });
    expect(c.x).toBe(CLAW.glass[1]);
    run(c, 5, { moveX: -1 });
    expect(c.x).toBe(CLAW.glass[0]);
  });

  it('drops, grabs the prize under it, carries it to the chute and lets go', () => {
    const c = createClaw([{ kind: 'robot', x: 80 }, { kind: 'ruby', x: 100 }]);
    c.x = 82;
    const evs = run(c, 8, { moveX: 0 }, true);
    expect(evs.map((e) => e.type)).toEqual(['drop', 'grab', 'prize']);
    expect(evs[2].prize.kind).toBe('robot');
    expect(c.prizes.map((p) => p.kind)).toEqual(['ruby']);
    expect(c.phase).toBe('idle');
    expect(c.x).toBe(CLAW.chute);
  });

  it('comes up empty over a gap (and nothing is lost)', () => {
    const c = createClaw([{ kind: 'coin', x: 110 }]);
    c.x = 60;
    const evs = run(c, 6, { moveX: 0 }, true);
    expect(evs.map((e) => e.type)).toEqual(['drop', 'miss']);
    expect(c.prizes).toHaveLength(1);
    expect(c.phase).toBe('idle');
  });

  it('sometimes a prize slips back into the pile, right below the claw', () => {
    const c = createClaw([{ kind: 'martian', x: 90 }]);
    c.x = 90;
    const evs = run(c, 8, { moveX: 0 }, true, fixed(0));
    expect(evs.map((e) => e.type)).toEqual(['drop', 'grab', 'slip']);
    expect(c.prizes).toEqual([{ kind: 'martian', x: 90 }]);
    expect(evs[2].prize).toBe(evs[1].prize); // the very same prize
  });

  it('ignores the stick while the claw is busy', () => {
    const c = createClaw([{ kind: 'opal', x: 70 }]);
    c.x = 70;
    stepClaw(c, { moveX: 0 }, { drop: true }, 1 / 60, fixed(0.99));
    stepClaw(c, { moveX: 1 }, { drop: false }, 0.5, fixed(0.99));
    expect(c.x).toBe(70);
  });

  it('every prize gives treasure; the toys and the golden robot give a sticker too', () => {
    expect(prizeReward('ruby')).toEqual({ ores: ['ruby', 'ruby', 'ruby'], sticker: null });
    expect(prizeReward('golden').ores).toHaveLength(12);
    expect(prizeReward('golden').sticker).toBe('claw-golden');
    expect(prizeReward('robot').sticker).toBe('claw-robot');
    expect(prizeReward('martian').sticker).toBe('claw-martian');
  });
});
