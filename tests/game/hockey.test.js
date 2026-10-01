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
