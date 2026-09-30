import { describe, it, expect } from 'vitest';
import { createShow, stepShow, launch, fireworkReward } from '../../src/game/fireworks.js';
import { createRng } from '../../src/world/rng.js';
import { FIREWORKS } from '../../src/tuning.js';

const FLOOR = 800;
const TOP = 610;
const PADS = [540, 580, 620, 660, 700];
const show = () => createShow(480, 752, TOP, FLOOR, PADS);
const run = (s, secs, rng = createRng(6)) => {
  const evs = [];
  for (let t = 0; t < secs; t += 1 / 60) for (const e of stepShow(s, 1 / 60, rng)) evs.push({ ...e, t });
  return evs;
};
const quiet = (s) => { s.spawnT = 999; return s; };

describe('the firework launcher', () => {
  it('balloons float up from below, more and more of them as the round goes on', () => {
    const s = show();
    const evs = run(s, FIREWORKS.round);
    const spawns = evs.filter((e) => e.type === 'spawn');
    expect(spawns.length).toBeGreaterThan(12);
    const early = spawns.filter((e) => e.t < FIREWORKS.round / 3).length;
    const late = spawns.filter((e) => e.t > (FIREWORKS.round * 2) / 3).length;
    expect(late).toBeGreaterThan(early);
  });

  it('a balloon nobody pops floats away out of the top', () => {
    const s = quiet(show());
    s.balloons.push({ x: 600, y: FLOOR, kind: 'red', phase: 0 });
    const evs = run(s, 12);
    expect(evs.map((e) => e.type)).toEqual(['escape']);
    expect(s.balloons).toHaveLength(0);
  });

  it('jumping on a pad launches a rocket from it (then the pad needs a moment)', () => {
    const s = quiet(show());
    expect(launch(s, 2)).toMatchObject({ x: 620 });
    expect(launch(s, 2)).toBe(null);
    run(s, FIREWORKS.padCooldown + 0.1);
    expect(launch(s, 2)).not.toBe(null);
  });

  it('a rocket pops the balloon in its path; a rocket that misses bursts at the top', () => {
    const s = quiet(show());
    s.balloons.push({ x: 622, y: 700, kind: 'blue', phase: 0 });
    launch(s, 2);
    launch(s, 0);
    const evs = run(s, 2);
    const pop = evs.find((e) => e.type === 'pop');
    expect(pop.balloon.kind).toBe('blue');
    expect(pop.pad).toBe(2);
    expect(evs.filter((e) => e.type === 'fizzle')).toHaveLength(1);
    expect(s.score).toBe(1);
  });

  it('balloons close to a burst pop too: a chain reaction', () => {
    const s = quiet(show());
    s.balloons.push({ x: 620, y: 700, kind: 'red', phase: 0 }, { x: 645, y: 690, kind: 'green', phase: 0 }, { x: 668, y: 700, kind: 'gold', phase: 0 }, { x: 740, y: 700, kind: 'blue', phase: 0 });
    launch(s, 2);
    const evs = run(s, 1.5);
    const pops = evs.filter((e) => e.type === 'pop');
    expect(pops).toHaveLength(3); // (the far one is too far)
    expect(Math.max(...pops.map((p) => p.chain))).toBe(3);
    expect(s.score).toBe(1 + 1 + 3); // a golden balloon is worth 3
  });

  it('the round ends after its time, and no more balloons come', () => {
    const s = show();
    const evs = run(s, FIREWORKS.round + 0.5);
    expect(evs.find((e) => e.type === 'end')).toBeTruthy();
    expect(run(s, 3).some((e) => e.type === 'spawn')).toBe(false);
  });

  it('a popped balloon gives a sunstone; a golden one three novas', () => {
    expect(fireworkReward('red')).toEqual(['sunstone']);
    expect(fireworkReward('gold')).toEqual(['nova', 'nova', 'nova']);
  });
});
