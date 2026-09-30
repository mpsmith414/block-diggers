import { describe, it, expect } from 'vitest';
import {
  overlaps, createSlime, stepSlime, slimeTouch, createBat, stepBat,
  triggerGravel, stepGravel, lavaEscape, spawnSpot, creatureFor, GAITS as GAITS_,
} from '../../src/game/hazards.js';
import { createGrid } from '../../src/world/grid.js';
import { B } from '../../src/world/blocks.js';
import { createRng } from '../../src/world/rng.js';
import { TILE, SLIME, GRAVEL } from '../../src/tuning.js';

const CHARS = { '#': B.STONE, '.': B.AIR, G: B.GRAVEL, L: B.LAVA, D: B.DEEP, c: B.CHEST };
function makeGrid(rows) {
  const g = createGrid(rows[0].length, rows.length);
  rows.forEach((row, y) => [...row].forEach((ch, x) => g.set(x, y, CHARS[ch])));
  return g;
}
const DT = 1 / 60;
const steps = (n, fn) => { for (let i = 0; i < n; i++) fn(); };

describe('overlaps', () => {
  it('detects box overlap, not touching edges', () => {
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
    expect(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
  });
});

describe('slimes', () => {
  const room = () => makeGrid(['##########', '#........#', '#........#', '##########']);

  it('fall to the floor and hop toward their direction', () => {
    const g = room();
    const s = createSlime(3 * TILE, TILE, 1);
    steps(30, () => stepSlime(s, g, DT));
    expect(s.y + s.h).toBe(3 * TILE);
    const x0 = s.x;
    steps(Math.ceil((SLIME.hopEvery + 0.6) * 60), () => stepSlime(s, g, DT));
    expect(s.x).toBeGreaterThan(x0);
  });

  it('turn around at a wall', () => {
    const g = room();
    const s = createSlime(7 * TILE + 2, 2 * TILE, 1);
    steps(600, () => stepSlime(s, g, DT));
    expect(s.dir).toBe(-1);
    expect(s.x + s.w).toBeLessThanOrEqual(9 * TILE);
  });

  it('are squashed from above and bonk from the side', () => {
    const s = createSlime(32, 38, 1); // box 32..44 x 38..48
    expect(slimeTouch({ x: 32, y: 26, w: 12, h: 14 }, 100, s)).toBe('squash');
    expect(slimeTouch({ x: 22, y: 34, w: 12, h: 14 }, 0, s)).toBe('bonk');
    expect(slimeTouch({ x: 0, y: 0, w: 12, h: 14 }, 0, s)).toBeNull();
  });
});

describe('bats', () => {
  it('fly along a wave around their base height and turn at walls', () => {
    const g = makeGrid(['##########', '#........#', '#........#', '#........#', '##########']);
    const b = createBat(4 * TILE, 2 * TILE, 1);
    let minY = Infinity;
    let maxY = -Infinity;
    let turned = false;
    steps(600, () => {
      stepBat(b, g, DT);
      minY = Math.min(minY, b.y);
      maxY = Math.max(maxY, b.y);
      if (b.dir === -1) turned = true;
    });
    expect(turned).toBe(true);
    expect(maxY - minY).toBeGreaterThan(4);
    expect(maxY - minY).toBeLessThan(20);
    expect(b.x).toBeGreaterThanOrEqual(TILE);
    expect(b.x + b.w).toBeLessThanOrEqual(9 * TILE);
  });
});

describe('gravel', () => {
  it('shakes, falls, lands as a block again; stacked gravel follows', () => {
    const g = makeGrid(['#G#', '#G#', '#.#', '#.#', '###']);
    let fallers = [];
    fallers = triggerGravel(fallers, g, 1, 1);
    fallers = triggerGravel(fallers, g, 1, 1); // not twice
    expect(fallers).toHaveLength(1);
    let freed = [];
    let landed = [];
    steps(Math.floor(GRAVEL.shake * 60) - 2, () => { ({ fallers } = stepGravel(fallers, g, DT)); });
    expect(g.get(1, 1)).toBe(B.GRAVEL); // still shaking
    steps(200, () => {
      const r = stepGravel(fallers, g, DT);
      fallers = r.fallers;
      freed.push(...r.freed);
      landed.push(...r.landed);
    });
    expect(landed).toEqual([{ x: 1, y: 3 }, { x: 1, y: 2 }]);
    expect(freed.map((c) => c.y).sort()).toEqual([0, 1]);
    expect([0, 1, 2, 3].map((y) => g.get(1, y))).toEqual([B.AIR, B.AIR, B.GRAVEL, B.GRAVEL]);
  });

  it('ignores cells that are not gravel', () => {
    const g = makeGrid(['###', '#.#', '###']);
    expect(triggerGravel([], g, 1, 0)).toEqual([]);
  });
});

describe('lavaEscape', () => {
  it('finds the nearest open, non-lava cell above', () => {
    const g = makeGrid(['#.#', '#.#', '#L#', '###']);
    expect(lavaEscape(g, 1, 2)).toEqual({ cx: 1, cy: 1 });
  });
  it('digs through rock above if it has to', () => {
    const g = makeGrid(['#.#', '###', '#L#', '###']);
    expect(lavaEscape(g, 1, 2)).toEqual({ cx: 1, cy: 0 });
  });
});

describe('creatureFor', () => {
  it('each layer has its own creature: walkers on floors, flyers in the air', () => {
    expect(creatureFor(20)).toEqual({ species: 'slime', walker: true });
    expect(creatureFor(60)).toEqual({ species: 'slime', walker: true });
    expect(creatureFor(120)).toEqual({ species: 'bat', walker: false });
    expect(creatureFor(170)).toEqual({ species: 'bat', walker: false });
    expect(creatureFor(200)).toEqual({ species: 'ptero', walker: false });
    expect(creatureFor(260)).toEqual({ species: 'robot', walker: true });
    expect(creatureFor(310)).toEqual({ species: 'alien', walker: false });
    expect(creatureFor(360)).toEqual({ species: 'wisp', walker: false });
  });
});

describe('spawnSpot', () => {
  const rng = createRng(3);
  const g = createGrid(40, 300);
  for (let y = 0; y < 300; y++) for (let x = 0; x < 40; x++) g.set(x, y, y % 3 === 2 ? B.STONE : B.AIR);
  it('walkers spawn on a floor in the same layer, outside the avoid rect', () => {
    for (let i = 0; i < 50; i++) {
      const s = spawnSpot(g, rng, { walker: true, near: { cx: 20, cy: 60 }, avoid: { x0: 15, y0: 55, x1: 25, y1: 65 } });
      if (!s) continue;
      expect(s.cy).toBeGreaterThanOrEqual(1);
      expect(s.cy).toBeLessThanOrEqual(95);
      expect(g.get(s.cx, s.cy)).toBe(B.AIR);
      expect(g.get(s.cx, s.cy + 1)).toBe(B.STONE);
      expect(s.cx >= 15 && s.cx <= 25 && s.cy >= 55 && s.cy <= 65).toBe(false);
    }
  });
  it('flyers spawn in open cells of the same layer (they stay in their layer)', () => {
    for (let i = 0; i < 30; i++) {
      const b = spawnSpot(g, rng, { walker: false, near: { cx: 20, cy: 110 }, avoid: null });
      if (!b) continue;
      expect(b.cy).toBeGreaterThanOrEqual(96);
      expect(b.cy).toBeLessThanOrEqual(148);
      expect(g.get(b.cx, b.cy)).toBe(B.AIR);
    }
  });
});

describe('the skate park keeps creatures out', () => {
  it('never spawns a creature inside a keep-out room', async () => {
    const { spawnSpot } = await import('../../src/game/hazards.js');
    const { generateMoon } = await import('../../src/world/moon.js');
    const { createRng } = await import('../../src/world/rng.js');
    const w = generateMoon(5);
    const p = w.skatepark;
    const rng = createRng(9);
    for (let i = 0; i < 200; i++) {
      const spot = spawnSpot(w.grid, rng, { walker: i % 2 === 0, near: { cx: 38, cy: p.floor - 3 }, planet: 'moon', keepOut: p });
      if (spot) expect(spot.cx >= p.x0 && spot.cx <= p.x1 && spot.cy >= p.top && spot.cy <= p.floor).toBe(false);
    }
  });
});

describe('every creature moves its own way', () => {
  const hall = () => makeGrid(['##############################', '#............................#', '#............................#', '#............................#', '##############################']);

  it('each species has a gait that fits it (walkers walk, flyers fly)', async () => {
    const hz = await import('../../src/game/hazards.js');
    for (const row of [10, 60, 110, 160, 200, 220, 260, 300, 350]) {
      for (const planet of ['earth', 'moon', 'mars', 'saturn', 'dino', 'sun']) {
        const { species, walker } = hz.creatureFor(row, planet);
        if (!species) continue;
        const gait = hz.GAIT_OF[species] ?? (walker ? 'hop' : 'flap');
        expect(hz.GAITS[gait]).toBeTruthy();
        expect(hz.WALK_GAITS.includes(gait)).toBe(walker);
      }
    }
  });

  it('a marching robot walks along the floor without hopping', () => {
    const g = hall();
    const s = createSlime(3 * TILE, 3 * TILE - 10, 1, 'march');
    steps(30, () => stepSlime(s, g, DT));
    const x0 = s.x;
    let airborne = 0;
    steps(120, () => { stepSlime(s, g, DT); if (!s.grounded) airborne++; });
    expect(airborne).toBe(0);
    expect(Math.abs(s.x - x0)).toBeGreaterThan(20);
  });

  it('a scurrying mouse stops for little rests', () => {
    const g = hall();
    const s = createSlime(3 * TILE, 3 * TILE - 10, 1, 'scurry');
    let still = 0;
    let prev = s.x;
    steps(300, () => { stepSlime(s, g, DT); if (s.grounded && s.x === prev) still++; prev = s.x; });
    expect(still).toBeGreaterThan(30);
  });

  it('a frog leaps farther than a slime hops', () => {
    const jump = (gait) => {
      const g = hall();
      const s = createSlime(3 * TILE, 3 * TILE - 10, 1, gait);
      steps(20, () => stepSlime(s, g, DT));
      s.hopT = 0;
      const x0 = s.x;
      steps(60, () => stepSlime(s, g, DT));
      return s.x - x0;
    };
    expect(jump('leap')).toBeGreaterThan(jump('hop') * 1.5);
  });

  it('a penguin sometimes belly-slides, faster than it waddles', () => {
    const g = hall();
    const s = createSlime(3 * TILE, 3 * TILE - 10, 1, 'waddle');
    let slide = 0;
    let waddle = 0;
    steps(900, () => {
      const x0 = s.x;
      stepSlime(s, g, DT);
      const d = Math.abs(s.x - x0);
      if (s.sliding) slide = Math.max(slide, d);
      else waddle = Math.max(waddle, d);
    });
    expect(slide).toBeCloseTo(GAITS_.waddle.slide * DT, 1);
    expect(slide).toBeGreaterThan(waddle * 2);
  });

  it('a jelly drifts slower than a bat flaps; a dragonfly dashes then hovers', () => {
    const g = hall();
    const move = (gait, secs) => {
      const b = createBat(10 * TILE, 2 * TILE, 1, gait);
      const x0 = b.x;
      steps(secs * 60, () => stepBat(b, g, DT));
      return Math.abs(b.x - x0);
    };
    expect(move('drift', 1)).toBeLessThan(move('flap', 1));
    const d = createBat(10 * TILE, 2 * TILE, 1, 'dart');
    const xs = [];
    steps(120, () => { stepBat(d, g, DT); xs.push(d.x); });
    const still = xs.filter((x, i) => i && x === xs[i - 1]).length;
    expect(still).toBeGreaterThan(20); // hovering
    expect(still).toBeLessThan(115); // and dashing
  });
});
