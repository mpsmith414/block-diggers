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
      [B.AMBER]: [189, 238],
      [B.BRICK_ORE]: [239, 288],
      [B.STAR]: [289, 388],
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

  it('has 8 chests: 3 in rows 41-148 and 1 in each deeper layer, each on a solid floor', () => {
    for (const { grid, chests } of mines) {
      expect(chests).toHaveLength(8);
      expect(cellsOf(grid, B.CHEST)).toHaveLength(8);
      expect(chests.filter((c) => c.y >= 41 && c.y <= 148)).toHaveLength(3);
      for (const [top, bottom] of [[149, 188], [189, 238], [239, 288], [289, 338], [339, 388]]) {
        expect(chests.filter((c) => c.y >= top && c.y <= bottom)).toHaveLength(1);
      }
      for (const c of chests) {
        expect(grid.get(c.x, c.y)).toBe(B.CHEST);
        expect(isSolid(grid.get(c.x, c.y + 1))).toBe(true);
      }
    }
  });

  it('keeps lava in the deep layer, and water out of it (puddles above, pools in the crystal caves)', () => {
    for (const { grid } of mines) {
      const lavaLayer = (y) => (y >= 96 && y <= 148) || (y >= 339 && y <= 388);
      for (const c of cellsOf(grid, B.LAVA)) expect(lavaLayer(c.y)).toBe(true);
      for (const c of cellsOf(grid, B.WATER)) expect(lavaLayer(c.y)).toBe(false);
    }
    // something to drink on the very first trip
    expect(mines.every(({ grid }) => cellsOf(grid, B.WATER).some((c) => c.y <= 95))).toBe(true);
    expect(mines.some(({ grid }) => cellsOf(grid, B.WATER).some((c) => c.y >= 149))).toBe(true);
  });

  it('fills the crystal layer with crystal rock (no older host rock)', () => {
    for (const { grid } of mines) {
      for (let y = 149; y <= 188; y++) for (let x = 1; x < grid.w - 1; x++) {
        expect([B.STONE, B.DEEP, B.DIRT].includes(grid.get(x, y))).toBe(false);
      }
      expect(grid.get(5, MINE_H - 2) === B.BEDROCK).toBe(false);
      expect(grid.get(5, MINE_H - 1)).toBe(B.BEDROCK);
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
      for (const [top, bottom] of [[149, 188], [189, 238], [239, 288], [289, 338], [339, 388]]) {
        expect(airRows.some((y) => y >= top && y <= bottom)).toBe(true);
      }
    }
  });
});

describe('cave decorations', () => {
  it('sit in open cells, on a solid floor or under a solid ceiling, in their layer', () => {
    const LAYER_OF = {
      grass: ['dirt'], flower: ['dirt'], roots: ['dirt'], mushroom: ['stone'], pebbles: ['stone'],
      glowshroom: ['deep'], crystal: ['deep', 'crystal', 'core'], stalactite: ['deep', 'crystal', 'meteor', 'core'],
      giantshroom: ['crystal'], moss: ['crystal', 'brick', 'meteor'], amethyst: ['crystal'],
      fern: ['dino'], bones: ['dino'], toyblocks: ['brick'], spacecrystal: ['meteor'], emberflower: ['core'],
      skeleton: ['dino'],
    };
    const RANGE = { dirt: [1, 40], stone: [41, 95], deep: [96, 148], crystal: [149, 188], dino: [189, 238], brick: [239, 288], meteor: [289, 338], core: [339, 388] };
    let total = 0;
    for (const { grid, decor } of mines) {
      for (const d of decor) {
        total++;
        expect(grid.get(d.x, d.y)).toBe(B.AIR);
        // floor things and wall pictures stand on the ground; ceiling things hang from rock
        const support = d.on === 'ceil' ? grid.get(d.x, d.y - 1) : grid.get(d.x, d.y + 1);
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
      expect(isSolid(d.on === 'ceil' ? grid.get(d.x, d.y - 1) : grid.get(d.x, d.y + 1))).toBe(true);
    }
  });
});

describe('finds', () => {
  const inRows = (c, a, b) => c.y >= a && c.y <= b;
  it('places geodes, fossils and boom blocks in host rock of their layers', () => {
    for (const { grid, fossils } of mines) {
      const geodes = cellsOf(grid, B.GEODE);
      expect(geodes.length).toBe(FINDS.geodes);
      geodes.forEach((c) => expect(inRows(c, 41, 388)).toBe(true));
      // a batch in the upper layers and another in the dino layer
      expect(cellsOf(grid, B.FOSSIL)).toHaveLength(FINDS.fossils * 2);
      expect(fossils).toHaveLength(FINDS.fossils * 2);
      fossils.forEach((f) => { expect(inRows(f, 1, 95) || inRows(f, 189, 238)).toBe(true); expect([0, 1, 2]).toContain(f.v); });
      const booms = cellsOf(grid, B.BOOM);
      expect(booms.length).toBe(FINDS.booms);
      booms.forEach((c) => expect(inRows(c, 41, 388)).toBe(true));
    }
  });
  it('more rare finds with luck', () => {
    const lucky = generateMine(SEEDS[0], { luck: 2 });
    expect(cellsOf(lucky.grid, B.GEODE).length).toBe(Math.round(FINDS.geodes * 1.5));
    expect(cellsOf(lucky.grid, B.FOSSIL).length).toBe(Math.round(FINDS.fossils * 1.5) * 2);
    expect(lucky.eggs.length).toBe(Math.round(FINDS.eggs * 1.5));
  });
  it('boulders can be pushed from the cave into a pit, which opens the way to ore beyond', () => {
    for (const { grid, boulders } of mines) {
      expect(boulders.length).toBeGreaterThan(0);
      for (const b of boulders) {
        expect(grid.get(b.x, b.y)).toBe(B.BOULDER);
        expect(isSolid(grid.get(b.x, b.y + 1))).toBe(true);
        expect(grid.get(b.x - b.dir, b.y)).toBe(B.AIR); // you stand here and push…
        expect(isSolid(grid.get(b.x - b.dir, b.y + 1))).toBe(true); // …on solid ground
        expect(grid.get(b.x + b.dir, b.y)).toBe(B.AIR); // the pit
        expect(grid.get(b.x + b.dir, b.y + 1)).toBe(B.AIR);
        expect(isSolid(grid.get(b.x + b.dir, b.y + 2))).toBe(true);
        expect(dropOf(grid.get(b.x + 2 * b.dir, b.y))).not.toBeNull(); // the prize
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
      expect(e.y).toBeLessThanOrEqual(188);
      expect(isSolid(m1.grid.get(e.x, e.y + 1))).toBe(true);
      expect(['mole', 'glowbug']).toContain(e.kind);
    }
    const m2 = generateMine(SEEDS[2], { eggKinds: [] });
    expect(m2.eggs.every((e) => e.kind === 'golden')).toBe(true);
  });
});

describe('the deeper world', () => {
  it('each new layer is made of its own rock', () => {
    const { grid } = mines[0];
    const hostOf = { 200: B.SAND, 260: B.BRICKS, 310: B.METEOR, 360: B.CORE };
    for (const [row, host] of Object.entries(hostOf)) {
      const ids = new Set(Array.from({ length: grid.w - 2 }, (_, i) => grid.get(i + 1, Number(row))));
      expect(ids.has(host)).toBe(true);
    }
  });
  it('the Heart of the World: a 3x3 gem at the very bottom, in its own chamber', () => {
    for (const { grid, heart } of mines) {
      expect(heart).toBeTruthy();
      expect(cellsOf(grid, B.HEART)).toHaveLength(9);
      for (const c of cellsOf(grid, B.HEART)) { expect(c.y).toBeGreaterThanOrEqual(380); expect(c.y).toBeLessThanOrEqual(388); }
      // air all round it so you can see it
      expect(grid.get(heart.x - 2, heart.y + 1)).toBe(B.AIR);
      expect(grid.get(heart.x + 4, heart.y + 1)).toBe(B.AIR);
    }
  });
  it('spring blocks in the brick caverns and meteorites in the meteor field', () => {
    for (const { grid } of mines) {
      const springs = cellsOf(grid, B.SPRING);
      expect(springs.length).toBeGreaterThan(0);
      springs.forEach((c) => { expect(c.y).toBeGreaterThanOrEqual(239); expect(c.y).toBeLessThanOrEqual(289); expect(grid.get(c.x, c.y - 1)).toBe(B.AIR); });
      const rocks = cellsOf(grid, B.METEORITE);
      expect(rocks.length).toBe(FINDS.meteorites);
      rocks.forEach((c) => { expect(c.y).toBeGreaterThanOrEqual(289); expect(c.y).toBeLessThanOrEqual(338); });
    }
  });
  it('dinosaur skeletons on the walls of the dino caves', () => {
    expect(mines.some(({ decor }) => decor.some((d) => d.kind === 'skeleton'))).toBe(true);
  });
  it('oases in the dino layer', () => {
    expect(mines.some(({ grid }) => cellsOf(grid, B.WATER).some((c) => c.y >= 189 && c.y <= 238))).toBe(true);
  });
});

describe('dino eggs', () => {
  it('2 eggs in the dino layer, of the dino kinds still missing', () => {
    const m = generateMine(SEEDS[0], { dinoEggKinds: ['rex', 'trike'] });
    const dino = m.eggs.filter((e) => e.kind === 'rex' || e.kind === 'trike');
    expect(dino).toHaveLength(2);
    expect(new Set(dino.map((e) => e.kind))).toEqual(new Set(['rex', 'trike']));
    for (const e of dino) {
      expect(e.y).toBeGreaterThanOrEqual(189);
      expect(e.y).toBeLessThanOrEqual(238);
      expect(m.grid.get(e.x, e.y)).toBe(B.EGG);
    }
  });
  it('none once you have both', () => {
    const m = generateMine(SEEDS[0], { dinoEggKinds: [] });
    expect(m.eggs.some((e) => e.kind === 'rex' || e.kind === 'trike')).toBe(false);
  });
});

describe('joke finds in the mine', () => {
  it('rubber ducks float on pools: on water, with air above', () => {
    for (const { grid, ducks } of mines) {
      expect(ducks.length).toBeLessThanOrEqual(3);
      for (const d of ducks) {
        expect(grid.get(d.x, d.y)).toBe(B.WATER);
        expect(grid.get(d.x, d.y - 1)).toBe(B.AIR);
      }
    }
    expect(mines.some((m) => m.ducks.length > 0)).toBe(true);
  });
  it('4 whoopee cushions on cave floors, from the dirt to the crystal caverns', () => {
    for (const { grid, cushions, chests, eggs } of mines) {
      expect(cushions).toHaveLength(4);
      for (const c of cushions) {
        expect(grid.get(c.x, c.y)).toBe(B.AIR);
        expect(isSolid(grid.get(c.x, c.y + 1))).toBe(true);
        expect(c.y).toBeGreaterThanOrEqual(1);
        expect(c.y).toBeLessThanOrEqual(188);
        expect([...chests, ...eggs].some((o) => o.x === c.x && o.y === c.y)).toBe(false);
      }
    }
  });
});

describe('the Mole Fair', () => {
  it('has a big room beside the Heart of the World for Whack-a-Mole, open to its chamber, with nothing in it', async () => {
    const { MINE_H: H } = await import('../../src/tuning.js');
    for (const seed of [1, 99, 4242]) {
      const w = generateMine(seed);
      const r = w.molefair;
      expect(r).toEqual({ x0: 30, x1: 46, top: H - 14, floor: H - 2 });
      for (let y = r.top; y < r.floor; y++) for (let x = r.x0; x <= r.x1; x++) expect(w.grid.get(x, y)).toBe(B.AIR);
      for (let x = r.x0; x <= r.x1; x++) expect(w.grid.get(x, r.floor)).toBe(B.CORE);
      expect(w.grid.get(29, r.floor - 1)).toBe(B.AIR);
      const inside = (c) => c.x >= r.x0 && c.x <= r.x1 && c.y >= r.top && c.y <= r.floor;
      for (const list of [w.chests, w.decor, w.eggs, w.boulders]) expect(list.some(inside)).toBe(false);
      for (let y = w.heart.y; y < w.heart.y + 3; y++) for (let x = w.heart.x; x < w.heart.x + 3; x++) expect(w.grid.get(x, y)).toBe(B.HEART);
    }
  });
});
