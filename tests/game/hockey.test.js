import { describe, it, expect } from 'vitest';
import { createRink, stepRink, hockeyReward } from '../../src/game/hockey.js';
import { HOCKEY } from '../../src/tuning.js';

const rink = () => createRink(480, 752);
const run = (r, secs, bodies = () => []) => {
  const evs = [];
  for (let t = 0; t < secs; t += 1 / 60) evs.push(...stepRink(r, bodies(t), 1 / 60));
  return evs;
};
const holdGoalies = (r, up) => { for (const g of r.goalies) { g.hold = up; } };

describe('ice hockey', () => {
  it('the big snowball puck starts in the middle and slides to a stop on the ice', () => {
    const r = rink();
    expect(r.puck.x).toBe((480 + 752) / 2);
    r.puck.vx = 30;
    run(r, 8);
    expect(r.puck.vx).toBe(0);
    expect(r.puck.x).toBeGreaterThan(r.mid + 40);
  });

  it('skating into the puck knocks it along', () => {
    const r = rink();
    const x = r.puck.x;
    const evs = run(r, 0.1, () => [{ x: x - 12, vx: 90, onIce: true, facing: 1 }]);
    expect(evs.some((e) => e.type === 'hit')).toBe(true);
    expect(r.puck.vx).toBeGreaterThan(90);
  });

  it('A right by the puck is a big shot, the way you face', () => {
    const r = rink();
    const evs = stepRink(r, [{ x: r.puck.x + 15, vx: 0, onIce: true, facing: -1, shoot: true }], 1 / 60);
    expect(evs.map((e) => e.type)).toContain('shot');
    expect(r.puck.vx).toBeLessThan(-HOCKEY.shot * 0.98); // (a hair of ice friction already)
  });

  it('a shot past a jumping goalie is a GOAL, then the puck drops back in the middle', () => {
    const r = rink();
    holdGoalies(r, true);
    r.puck.vx = HOCKEY.shot;
    const evs = run(r, 1.5);
    const goal = evs.find((e) => e.type === 'goal');
    expect(goal).toEqual({ type: 'goal', side: 'right' });
    expect(r.score).toBe(1);
    const more = run(r, HOCKEY.reset + 0.2);
    expect(more.some((e) => e.type === 'drop')).toBe(true);
    expect(r.puck.x).toBe((480 + 752) / 2);
    expect(r.puck.vx).toBe(0);
  });

  it('a penguin standing in the goal saves it (and the puck bounces back out)', () => {
    const r = rink();
    holdGoalies(r, false);
    r.puck.vx = -HOCKEY.shot;
    const evs = run(r, 1.2);
    expect(evs.find((e) => e.type === 'save')).toEqual({ type: 'save', side: 'left' });
    expect(evs.some((e) => e.type === 'goal')).toBe(false);
    expect(r.puck.vx).toBeGreaterThan(0);
  });

  it('the goalies hop up and down on their own', () => {
    const r = rink();
    const seen = new Set();
    for (let t = 0; t < 6; t += 0.05) {
      stepRink(r, [], 0.05);
      seen.add(r.goalies[0].up);
    }
    expect(seen).toEqual(new Set([true, false]));
  });

  it('a goal gives pearls and a comet', () => {
    expect(hockeyReward()).toEqual(['pearl', 'pearl', 'comet']);
  });
});
