import { describe, it, expect } from 'vitest';
import { generateMine } from '../../src/world/worldgen.js';
import { B, isSolid } from '../../src/world/blocks.js';
import { MINE_W, MINE_H, SHAFT_X, SHAFT_DEPTH } from '../../src/tuning.js';

const SEEDS = Array.from({ length: 20 }, (_, i) => 1000 + i * 7919);
const mines = SEEDS.map((s) => generateMine(s));

const cellsOf = (grid, id) => {
  const out = [];
  for (let y = 0; y < grid.h; y++) for (let x = 0; x < grid.w; x++) if (grid.get(x, y) === id) out.push({ x, y });
  return out;
};

describe('generateMine', () => {
  it('has the spec size', () => {
    const { grid } = mines[0];
    expect(grid.w).toBe(MINE_W);
    expect(grid.h).toBe(MINE_H);
  });

  it('is deterministic per seed, and seeds differ', () => {
    expect(generateMine(SEEDS[0]).grid.cells).toEqual(mines[0].grid.cells);
    expect(mines[1].grid.cells).not.toEqual(mines[0].grid.cells);
  });

  it('puts ores only in their layers', () => {
    const rows = {
      [B.COAL_DIRT]: [1, 40],
      [B.COAL_STONE]: [41, 95],
      [B.IRON]: [41, 95],
      [B.GOLD_STONE]: [41, 95],
      [B.GOLD_DEEP]: [96, 148],
      [B.DIAMOND]: [96, 148],
      [B.EMERALD]: [96, 148],
    };
    for (const { grid } of mines) {
      for (const [id, [top, bottom]] of Object.entries(rows)) {
        for (const c of cellsOf(grid, Number(id))) {
          expect(c.y).toBeGreaterThanOrEqual(top);
          expect(c.y).toBeLessThanOrEqual(bottom);
        }
      }
    }
    // and every ore actually shows up somewhere across the seeds
    for (const id of Object.keys(rows)) {
      expect(mines.some(({ grid }) => cellsOf(grid, Number(id)).length > 0)).toBe(true);
    }
  });

  it('has bedrock exactly on the walls and floor', () => {
    for (const { grid } of mines) {
      for (let y = 0; y < grid.h; y++) {
        for (let x = 0; x < grid.w; x++) {
          const edge = x === 0 || x === grid.w - 1 || y === grid.h - 1;
          expect(grid.get(x, y) === B.BEDROCK).toBe(edge);
        }
      }
    }
  });

  it('has exactly 3 chests in rows 41-148, each on a solid floor', () => {
    for (const { grid, chests } of mines) {
      expect(chests).toHaveLength(3);
      expect(cellsOf(grid, B.CHEST)).toHaveLength(3);
      for (const c of chests) {
        expect(grid.get(c.x, c.y)).toBe(B.CHEST);
        expect(c.y).toBeGreaterThanOrEqual(41);
        expect(c.y).toBeLessThanOrEqual(148);
        expect(isSolid(grid.get(c.x, c.y + 1))).toBe(true);
      }
    }
  });

  it('keeps lava in the deep layer', () => {
    for (const { grid } of mines) for (const c of cellsOf(grid, B.LAVA)) expect(c.y).toBeGreaterThanOrEqual(96);
  });

  it('has a grass surface with a ladder shaft, and spawns above it', () => {
    for (const { grid, spawn } of mines) {
      for (let x = 1; x < grid.w - 1; x++) if (x !== SHAFT_X) expect(grid.get(x, 0)).toBe(B.GRASS);
      for (let y = 0; y < SHAFT_DEPTH; y++) expect(grid.get(SHAFT_X, y)).toBe(B.LADDER);
      expect(spawn).toEqual({ x: SHAFT_X, y: -1 });
    }
  });

  it('can reach every non-bedrock cell from the shaft by digging', () => {
    for (const { grid } of mines) {
      const seen = new Uint8Array(grid.w * grid.h);
      const stack = [[SHAFT_X, 0]];
      seen[SHAFT_X] = 1;
      let count = 0;
      while (stack.length) {
        const [x, y] = stack.pop();
        count++;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (!grid.inside(nx, ny) || seen[ny * grid.w + nx] || grid.get(nx, ny) === B.BEDROCK) continue;
          seen[ny * grid.w + nx] = 1;
          stack.push([nx, ny]);
        }
      }
      const nonBedrock = grid.cells.filter((id) => id !== B.BEDROCK).length;
      expect(count).toBe(nonBedrock);
    }
  });

  it('carves caves in every layer', () => {
    for (const { grid } of mines) {
      const airRows = cellsOf(grid, B.AIR).map((c) => c.y);
      expect(airRows.some((y) => y >= 1 && y <= 40)).toBe(true);
      expect(airRows.some((y) => y >= 41 && y <= 95)).toBe(true);
      expect(airRows.some((y) => y >= 96 && y <= 148)).toBe(true);
    }
  });
});

describe('cave decorations', () => {
  it('sit in open cells, on a solid floor or under a solid ceiling, in their layer', () => {
    const LAYER_OF = { grass: 'dirt', flower: 'dirt', roots: 'dirt', mushroom: 'stone', pebbles: 'stone', glowshroom: 'deep', crystal: 'deep', stalactite: 'deep' };
    const RANGE = { dirt: [1, 40], stone: [41, 95], deep: [96, 148] };
    let total = 0;
    for (const { grid, decor } of mines) {
      for (const d of decor) {
        total++;
        expect(grid.get(d.x, d.y)).toBe(B.AIR);
        const support = d.on === 'floor' ? grid.get(d.x, d.y + 1) : grid.get(d.x, d.y - 1);
        expect(isSolid(support)).toBe(true);
        const [top, bottom] = RANGE[LAYER_OF[d.kind]];
        expect(d.y).toBeGreaterThanOrEqual(top);
        expect(d.y).toBeLessThanOrEqual(bottom);
      }
    }
    expect(total / mines.length).toBeGreaterThan(30);
  });
});
