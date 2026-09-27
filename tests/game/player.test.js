import { describe, it, expect } from 'vitest';
import { createPlayer, stepPlayer, standAt, playerCell, knockback } from '../../src/game/player.js';
import { createGrid } from '../../src/world/grid.js';
import { B } from '../../src/world/blocks.js';
import { TILE, PLAYER } from '../../src/tuning.js';

const CHARS = { '#': B.STONE, d: B.DIRT, '.': B.AIR, L: B.LADDER, D: B.DEEP, X: B.BEDROCK, i: B.IRON, g: B.GRASS };

// Rows of characters -> grid. Everything outside reads as bedrock.
function makeGrid(rows) {
  const g = createGrid(rows[0].length, rows.length);
  rows.forEach((row, y) => [...row].forEach((ch, x) => g.set(x, y, CHARS[ch])));
  return g;
}

const DT = 1 / 60;
const idle = { moveX: 0, moveY: 0, jump: false };
function run(p, intent, grid, seconds, opts = {}) {
  const events = { mined: [], bounced: 0, stepped: 0 };
  for (let t = 0; t < seconds - 1e-9; t += DT) {
    const r = stepPlayer(p, intent, grid, { dt: DT, pickLevel: 0, ...opts });
    events.mined.push(...r.mined);
    if (r.bounced) events.bounced++;
    if (r.stepped) events.stepped++;
  }
  return events;
}
const settle = (p, grid) => run(p, idle, grid, 0.3);

describe('walking and falling', () => {
  it('walks right along flat ground', () => {
    const g = makeGrid(['#########', '#.......#', '#########']);
    const p = createPlayer(standAt(1, 1));
    settle(p, g);
    const x0 = p.x;
    run(p, { ...idle, moveX: 1 }, g, 0.5);
    expect(p.x - x0).toBeCloseTo(PLAYER.walkSpeed * 0.5, 0);
    expect(p.grounded).toBe(true);
  });

  it('falls and lands on the floor', () => {
    const g = makeGrid(['#...#', '#...#', '#...#', '#...#', '#####']);
    const p = createPlayer(standAt(2, 0));
    run(p, idle, g, 1);
    expect(p.grounded).toBe(true);
    expect(p.y).toBe(4 * TILE - PLAYER.h);
  });

  it('jumps about 1.25 blocks, only on the press', () => {
    const g = makeGrid(['#...#', '#...#', '#...#', '#...#', '#####']);
    const p = createPlayer(standAt(2, 3));
    settle(p, g);
    const y0 = p.y;
    let top = y0;
    for (let i = 0; i < 60; i++) {
      stepPlayer(p, { ...idle, jump: true }, g, { dt: DT });
      top = Math.min(top, p.y);
    }
    expect(y0 - top).toBeGreaterThan(TILE);
    expect(y0 - top).toBeLessThan(TILE * 1.6);
    expect(p.grounded).toBe(true); // holding A doesn't bounce again
  });
});

describe('auto-step vs mining sideways', () => {
  it('steps up onto a 1-block ledge without mining it', () => {
    const g = makeGrid([
      '######',
      '#....#',
      '#..#.#',
      '######',
    ]);
    const p = createPlayer(standAt(1, 2));
    settle(p, g);
    const ev = run(p, { ...idle, moveX: 1 }, g, 0.6);
    expect(ev.stepped).toBe(1);
    expect(ev.mined).toHaveLength(0);
    expect(playerCell(p).cy).toBe(1);
    expect(g.get(3, 2)).toBe(B.STONE);
  });

  it('mines a wall that is two blocks high', () => {
    const g = makeGrid([
      '######',
      '#..#.#',
      '#..#.#',
      '######',
    ]);
    const p = createPlayer(standAt(1, 2));
    settle(p, g);
    const ev = run(p, { ...idle, moveX: 1 }, g, 1.0); // walk ~0.25 s, then 0.6 s of stone
    expect(ev.mined[0]).toMatchObject({ x: 3, y: 2, id: B.STONE });
    expect(g.get(3, 2)).toBe(B.AIR); // sideways leaves air
  });
});

describe('mining times and pickaxes', () => {
  const pit = () => makeGrid(['#...#', '#...#', '#ddd#', '#####']);

  it('wood pick takes 0.25 s on dirt, iron 0.2 s', () => {
    let g = pit();
    let p = createPlayer(standAt(2, 1));
    settle(p, g);
    run(p, { ...idle, moveY: 1 }, g, 0.2);
    expect(g.get(2, 2)).toBe(B.DIRT);
    run(p, { ...idle, moveY: 1 }, g, 0.07);
    expect(g.get(2, 2)).toBe(B.LADDER);

    g = pit();
    p = createPlayer(standAt(2, 1));
    settle(p, g);
    run(p, { ...idle, moveY: 1 }, g, 0.22, { pickLevel: 1 });
    expect(g.get(2, 2)).toBe(B.LADDER);
  });

  it('deepslate bounces off a wood pick, once per contact', () => {
    const g = makeGrid(['#...#', '#...#', '#DDD#', '#####']);
    const p = createPlayer(standAt(2, 1));
    settle(p, g);
    const ev = run(p, { ...idle, moveY: 1 }, g, 2);
    expect(ev.bounced).toBe(1);
    expect(g.get(2, 2)).toBe(B.DEEP);
    const ev2 = run(p, { ...idle, moveY: 1 }, g, 1, { pickLevel: 1 });
    expect(ev2.mined).toHaveLength(1);
  });

  it('ore drops come back from the step', () => {
    const g = makeGrid(['#...#', '#...#', '#.i.#', '#####']);
    const p = createPlayer(standAt(2, 1));
    settle(p, g);
    const ev = run(p, { ...idle, moveY: 1 }, g, 1);
    expect(ev.mined[0]).toMatchObject({ drop: 'iron' });
  });
});

describe('ladders', () => {
  it('mining up leaves a ladder the player can climb', () => {
    const g = makeGrid(['#####', '##d##', '#...#', '#####']);
    const p = createPlayer(standAt(2, 2));
    settle(p, g);
    run(p, { ...idle, moveY: -1 }, g, 0.4);
    expect(g.get(2, 1)).toBe(B.LADDER);
    run(p, { ...idle, moveY: -1 }, g, 0.5);
    expect(playerCell(p).cy).toBe(1);
  });

  it('diagonal input goes with the larger axis', () => {
    const g = makeGrid(['#...#', '#...#', '#ddd#', '#####']);
    const p = createPlayer(standAt(2, 1));
    settle(p, g);
    run(p, { ...idle, moveX: 0.5, moveY: 0.8 }, g, 0.3);
    expect(g.get(2, 2)).toBe(B.LADDER);
  });

  it('stands on a ladder top without falling in', () => {
    const g = makeGrid(['#...#', '#...#', '##L##', '##L##', '#####']);
    const p = createPlayer(standAt(2, 0));
    run(p, idle, g, 1);
    expect(p.grounded).toBe(true);
    expect(playerCell(p).cy).toBe(1);
  });

  it('can dig down 12 cells and climb all the way back to the surface', () => {
    const rows = ['#...#', '#...#', 'ggggg'];
    for (let i = 0; i < 14; i++) rows.push(i < 6 ? '#ddd#' : '#####');
    rows.push('XXXXX');
    const g = makeGrid(rows);
    const p = createPlayer(standAt(2, 1));
    settle(p, g);
    run(p, { ...idle, moveY: 1 }, g, 12);
    expect(playerCell(p).cy).toBeGreaterThanOrEqual(13);
    run(p, { ...idle, moveY: -1 }, g, 10);
    run(p, idle, g, 0.5);
    expect(playerCell(p).cy).toBe(1);
    expect(p.grounded).toBe(true);
  });

  it('can dig sideways while hanging on a ladder, and walk into the new tunnel', () => {
    const rows = ['#...#', '#...#', 'ggggg'];
    for (let i = 0; i < 8; i++) rows.push('#ddd#');
    rows.push('XXXXX');
    const g = makeGrid(rows);
    const p = createPlayer(standAt(2, 1));
    settle(p, g);
    run(p, { ...idle, moveY: 1 }, g, 1.3); // part-way down the new shaft
    run(p, idle, g, 0.1);
    p.y = Math.floor(p.y / TILE) * TILE + 5; // hanging between two rows
    const { cy } = playerCell(p);
    const ev = run(p, { ...idle, moveX: 1 }, g, 1);
    expect(ev.mined.length).toBeGreaterThan(0);
    expect(g.get(3, cy)).toBe(B.AIR);
    expect(playerCell(p).cx).toBe(3);
  });

  it('hangs on a ladder with no input and catches a fall', () => {
    const g = makeGrid(['#.L.#', '#.L.#', '#.L.#', '#.L.#', '#####']);
    const p = createPlayer({ x: 2 * TILE + 2, y: 0 });
    run(p, idle, g, 0.5);
    expect(p.y).toBeLessThan(TILE);
  });
});

describe('knockback', () => {
  it('pushes the player away even while they push toward the hazard', () => {
    const g = makeGrid(['#########', '#.......#', '#.......#', '#########']);
    const p = createPlayer(standAt(4, 2));
    settle(p, g);
    const x0 = p.x;
    knockback(p, -1);
    run(p, { ...idle, moveX: 1 }, g, 0.2);
    expect(p.x).toBeLessThan(x0);
    run(p, idle, g, 1);
    expect(p.grounded).toBe(true);
  });
});

describe('canMine: false (camp)', () => {
  it('walks but never mines', () => {
    const g = makeGrid(['#...#', '#...#', '#ddd#', '#####']);
    const p = createPlayer(standAt(2, 1));
    settle(p, g);
    const ev = run(p, { ...idle, moveY: 1 }, g, 1, { canMine: false });
    expect(ev.mined).toHaveLength(0);
    expect(g.get(2, 2)).toBe(B.DIRT);
    expect(p.mining).toBeNull();
  });
});

describe('pressing down over a 1-wide hole', () => {
  it('lines up with the hole and drops in, instead of standing across it', () => {
    const g = makeGrid(['#....#', '#....#', '##.###', '######']);
    const p = createPlayer({ x: 2 * TILE + 9, y: 2 * TILE - PLAYER.h }); // straddling cols 2 and 3
    settle(p, g);
    expect(p.grounded).toBe(true);
    run(p, { ...idle, moveY: 1 }, g, 0.6);
    expect(playerCell(p)).toEqual({ cx: 2, cy: 2 });
  });
});
