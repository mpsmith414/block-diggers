import { describe, it, expect } from 'vitest';
import { generateMine, carveStation } from '../../src/world/worldgen.js';
import { B, isSolid, dropOf } from '../../src/world/blocks.js';
import { MINE_W, MINE_H, SHAFT_X, SHAFT_DEPTH, FINDS } from '../../src/tuning.js';

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
      [B.GOLD_CRYSTAL]: [149, 188],
      [B.DIAMOND_CRYSTAL]: [149, 188],
      [B.EMERALD_CRYSTAL]: [149, 188],
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

  it('has 4 chests: 3 in rows 41-148 and 1 in the crystal layer, each on a solid floor', () => {
    for (const { grid, chests } of mines) {
      expect(chests).toHaveLength(4);
      expect(cellsOf(grid, B.CHEST)).toHaveLength(4);
      expect(chests.filter((c) => c.y >= 41 && c.y <= 148)).toHaveLength(3);
      expect(chests.filter((c) => c.y >= 149 && c.y <= 188)).toHaveLength(1);
      for (const c of chests) {
        expect(grid.get(c.x, c.y)).toBe(B.CHEST);
        expect(isSolid(grid.get(c.x, c.y + 1))).toBe(true);
      }
    }
  });

  it('keeps lava in the deep layer and water in the crystal layer', () => {
    for (const { grid } of mines) {
      for (const c of cellsOf(grid, B.LAVA)) { expect(c.y).toBeGreaterThanOrEqual(96); expect(c.y).toBeLessThanOrEqual(148); }
      for (const c of cellsOf(grid, B.WATER)) { expect(c.y).toBeGreaterThanOrEqual(149); expect(c.y).toBeLessThanOrEqual(188); }
    }
    expect(mines.some(({ grid }) => cellsOf(grid, B.WATER).length > 0)).toBe(true);
  });

  it('fills the crystal layer with crystal rock (no older host rock)', () => {
    for (const { grid } of mines) {
      for (let y = 149; y <= 188; y++) for (let x = 1; x < grid.w - 1; x++) {
        expect([B.STONE, B.DEEP, B.DIRT].includes(grid.get(x, y))).toBe(false);
      }
      expect(grid.get(5, 188) === B.BEDROCK).toBe(false);
      expect(grid.get(5, 189)).toBe(B.BEDROCK);
    }
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
      expect(airRows.some((y) => y >= 149 && y <= 188)).toBe(true);
    }
  });
});

describe('cave decorations', () => {
  it('sit in open cells, on a solid floor or under a solid ceiling, in their layer', () => {
    const LAYER_OF = {
      grass: ['dirt'], flower: ['dirt'], roots: ['dirt'], mushroom: ['stone'], pebbles: ['stone'],
      glowshroom: ['deep'], crystal: ['deep', 'crystal'], stalactite: ['deep', 'crystal'],
      giantshroom: ['crystal'], moss: ['crystal'], amethyst: ['crystal'],
    };
    const RANGE = { dirt: [1, 40], stone: [41, 95], deep: [96, 148], crystal: [149, 188] };
    let total = 0;
    for (const { grid, decor } of mines) {
      for (const d of decor) {
        total++;
        expect(grid.get(d.x, d.y)).toBe(B.AIR);
        const support = d.on === 'floor' ? grid.get(d.x, d.y + 1) : grid.get(d.x, d.y - 1);
        expect(isSolid(support)).toBe(true);
        expect(LAYER_OF[d.kind].some((l) => d.y >= RANGE[l][0] && d.y <= RANGE[l][1])).toBe(true);
      }
    }
    expect(total / mines.length).toBeGreaterThan(30);
  });
});

describe('carveStation (minecart start)', () => {
  it('clears a 7x3 room with a solid floor, keeps chests, drops decorations that lost their support', () => {
    const mine = generateMine(4242);
    const { grid } = mine;
    const row = 42;
    const decor = carveStation(mine, SHAFT_X, row);
    for (let y = row - 2; y <= row; y++) {
      for (let x = SHAFT_X - 3; x <= SHAFT_X + 3; x++) {
        const id = grid.get(x, y);
        expect(id === B.AIR || id === B.CHEST).toBe(true);
      }
    }
    for (let x = SHAFT_X - 3; x <= SHAFT_X + 3; x++) expect(isSolid(grid.get(x, row + 1))).toBe(true);
    for (const d of decor) {
      expect(grid.get(d.x, d.y)).toBe(B.AIR);
      expect(isSolid(d.on === 'floor' ? grid.get(d.x, d.y + 1) : grid.get(d.x, d.y - 1))).toBe(true);
    }
  });
});

describe('finds', () => {
  const inRows = (c, a, b) => c.y >= a && c.y <= b;
  it('places geodes, fossils and boom blocks in host rock of their layers', () => {
    for (const { grid, fossils } of mines) {
      const geodes = cellsOf(grid, B.GEODE);
      expect(geodes.length).toBe(FINDS.geodes);
      geodes.forEach((c) => expect(inRows(c, 41, 188)).toBe(true));
      expect(cellsOf(grid, B.FOSSIL)).toHaveLength(FINDS.fossils);
      expect(fossils).toHaveLength(FINDS.fossils);
      fossils.forEach((f) => { expect(inRows(f, 1, 95)).toBe(true); expect([0, 1, 2]).toContain(f.v); });
      const booms = cellsOf(grid, B.BOOM);
      expect(booms.length).toBe(FINDS.booms);
      booms.forEach((c) => expect(inRows(c, 41, 188)).toBe(true));
    }
  });
  it('more rare finds with luck', () => {
    const lucky = generateMine(SEEDS[0], { luck: 2 });
    expect(cellsOf(lucky.grid, B.GEODE).length).toBe(Math.round(FINDS.geodes * 1.5));
    expect(cellsOf(lucky.grid, B.FOSSIL).length).toBe(Math.round(FINDS.fossils * 1.5));
    expect(lucky.eggs.length).toBe(Math.round(FINDS.eggs * 1.5));
  });
  it('boulders sit on a floor with cave air on one side and ore behind them', () => {
    for (const { grid, boulders } of mines) {
      expect(boulders.length).toBeGreaterThan(0);
      for (const b of boulders) {
        expect(grid.get(b.x, b.y)).toBe(B.BOULDER);
        expect(isSolid(grid.get(b.x, b.y + 1))).toBe(true);
        expect(grid.get(b.x - b.dir, b.y)).toBe(B.AIR);
        expect(dropOf(grid.get(b.x + b.dir, b.y))).not.toBeNull();
      }
    }
  });
  it('one big chest, two cells wide, on a floor', () => {
    for (const { grid, bigChest } of mines) {
      expect(bigChest).not.toBeNull();
      expect(grid.get(bigChest.x, bigChest.y)).toBe(B.BIGCHEST);
      expect(grid.get(bigChest.x + 1, bigChest.y)).toBe(B.BIGCHEST_R);
      expect(isSolid(grid.get(bigChest.x, bigChest.y + 1))).toBe(true);
      expect(isSolid(grid.get(bigChest.x + 1, bigChest.y + 1))).toBe(true);
    }
  });
  it('eggs are on floors from the deep layer down, of the missing kinds, golden when none are missing', () => {
    const m1 = generateMine(SEEDS[1], { eggKinds: ['mole', 'glowbug'] });
    expect(m1.eggs).toHaveLength(FINDS.eggs);
    for (const e of m1.eggs) {
      expect(m1.grid.get(e.x, e.y)).toBe(B.EGG);
      expect(e.y).toBeGreaterThanOrEqual(96);
      expect(isSolid(m1.grid.get(e.x, e.y + 1))).toBe(true);
      expect(['mole', 'glowbug']).toContain(e.kind);
    }
    const m2 = generateMine(SEEDS[2], { eggKinds: [] });
    expect(m2.eggs.every((e) => e.kind === 'golden')).toBe(true);
  });
});
