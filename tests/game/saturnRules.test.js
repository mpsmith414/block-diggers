import { describe, it, expect } from 'vitest';
import { B, ORES, dropOf, isSolid, isBoulder, isSlippery } from '../../src/world/blocks.js';
import { mineTime, createGrid } from '../../src/world/grid.js';
import { createRng } from '../../src/world/rng.js';
import { planetById, layersOf, layerOfRow, planetOfLayer, mineRows, starMapStops } from '../../src/game/planets.js';
import { creatureFor } from '../../src/game/hazards.js';
import { discovery, BADGE_LAYERS } from '../../src/game/trip.js';
import { chestLoot } from '../../src/game/loot.js';
import { globeLoot, cometLoot, snowmanLoot, boulderPairMeet, wheelsMeet, heartLeft, HEARTS } from '../../src/game/finds.js';
import { UPGRADES, SATURN_BLUEPRINTS, blueprintsFor, plotsOf, buildOnPlot, blueprintOk } from '../../src/game/economy.js';
import { campGift, elevatorStops, revealsChests, digMul, winSuitPiece } from '../../src/game/perks.js';
import { PET_KINDS, SATURN_KINDS, WALKING_PETS, hatch, yetiDig } from '../../src/game/pets.js';
import { createPlayer, stepPlayer, standAt } from '../../src/game/player.js';
import { nextGoal, oreTopRow } from '../../src/game/goals.js';
import { defaultState } from '../../src/save/save.js';
import { SATURN_LAYERS, SATURN_CAMP, LAYER_COLORS, BACKPACK, LANTERN, PLAYER } from '../../src/tuning.js';

const withSaturn = (plots, extra = {}) => ({ ...defaultState(), bases: { ...defaultState().bases, saturn: { plots } }, ...extra });
const rich = () => ({ ...defaultState(), bank: { ...defaultState().bank, frost: 99, icecream: 99, pearl: 99, comet: 99 } });

describe('Saturn, the planet', () => {
  it('is open, with the Gloves at its bottom', () => {
    const s = planetById('saturn');
    expect(s.comingSoon).toBeFalsy();
    expect(s.suit).toBe('gloves');
    expect(s.ores).toEqual(['frost', 'icecream', 'pearl', 'comet']);
    expect(s.camp).toBe(SATURN_CAMP);
    expect(s.heart).toBe('saturn');
  });

  it('has five layers of fifty rows', () => {
    expect(Object.keys(layersOf('saturn'))).toEqual(['rings', 'icecream', 'aurora', 'comets', 'saturncore']);
    expect(mineRows('saturn')).toBe(252);
    expect(layerOfRow(170, 'saturn')).toBe('comets');
    expect(planetOfLayer('aurora')).toBe('saturn');
    for (const id of Object.keys(SATURN_LAYERS)) expect(LAYER_COLORS[id]).toBeTypeOf('number');
  });

  it('the Saturn Rocket opens Saturn; the Dino Rocket opens Dino Planet', () => {
    const base = { plots: ['rocket'], suit: [], bases: { moon: { plots: [null, null, null, 'marsrocket'] }, mars: { plots: [null, null, null, 'saturnrocket'] }, saturn: { plots: [null, null, null, null] } } };
    const status = (st, here) => Object.fromEntries(starMapStops(st, here).map((x) => [x.id, x.status]));
    expect(status(base, 'mars').saturn).toBe('open');
    expect(status(base, 'mars').dino).toBe('locked');
    const t = { ...base, bases: { ...base.bases, saturn: { plots: [null, null, null, 'dinorocket'] } } };
    expect(status(t, 'saturn')).toEqual({ earth: 'open', moon: 'open', mars: 'open', saturn: 'here', dino: 'open', sun: 'locked' });
  });
});

describe('Saturn ice, ores and tools', () => {
  it('four Saturn ores join the list', () => {
    expect(ORES.slice(16, 20)).toEqual(['frost', 'icecream', 'pearl', 'comet']);
    expect(dropOf(B.FROST)).toBe('frost');
    expect(dropOf(B.ICECREAM)).toBe('icecream');
    expect(dropOf(B.PEARL)).toBe('pearl');
    expect(dropOf(B.COMET)).toBe('comet');
  });

  it('each deeper Saturn rock needs the next drill', () => {
    const tiers = (id) => Array.from({ length: 15 }, (_, p) => mineTime(id, p) !== Infinity);
    const from = (n) => Array.from({ length: 15 }, (_, p) => p >= n);
    expect(tiers(B.ICE)).toEqual(from(11));
    expect(tiers(B.SOFTSERVE)).toEqual(from(11));
    expect(tiers(B.AURORA_ROCK)).toEqual(from(12));
    expect(tiers(B.COMET_ROCK)).toEqual(from(13));
    expect(tiers(B.SATURN_CORE)).toEqual(from(14));
    expect(mineTime(B.SOFTSERVE, 11)).toBeLessThan(mineTime(B.ICE, 11));
    expect(mineTime(B.MARS_CORE, 14)).toBeLessThan(mineTime(B.MARS_CORE, 11));
    expect(mineTime(B.DIRT, 14)).toBeLessThan(Infinity);
  });

  it('ice is slippery; snowballs are boulders; globes and the frozen comet are walk-through', () => {
    expect(isSlippery(B.ICE)).toBe(true);
    expect(isSlippery(B.FROST)).toBe(true);
    expect(isSlippery(B.SOFTSERVE)).toBe(false);
    expect(isSlippery(B.STONE)).toBe(false);
    expect(isBoulder(B.SNOWBALL)).toBe(true);
    expect(isSolid(B.SNOW_GLOBE)).toBe(false);
    expect(isSolid(B.FROZEN_COMET)).toBe(false);
    expect(isSolid(B.SATURN_HEART)).toBe(true);
  });

  it('an eighth backpack and lantern level', () => {
    expect(BACKPACK[7]).toBe(500);
    expect(LANTERN[7]).toBe(17);
  });

  it('drills 12-14 and the seventh backpack and lantern cost Saturn ores', () => {
    expect(UPGRADES.pick.slice(11, 14)).toEqual([{ frost: 45, icecream: 30 }, { pearl: 45, frost: 45 }, { comet: 50, pearl: 45 }]);
    expect(UPGRADES.pack[6]).toEqual({ frost: 50, icecream: 50 });
    expect(UPGRADES.lantern[6]).toEqual({ pearl: 40, frost: 30 });
  });
});

describe('Saturn creatures, trips and treasure', () => {
  it('each Saturn layer has its own creature', () => {
    const at = (layer) => creatureFor(SATURN_LAYERS[layer].top + 5, 'saturn');
    expect(at('rings')).toEqual({ species: 'penguin', walker: true });
    expect(at('icecream')).toEqual({ species: 'scoop', walker: true });
    expect(at('aurora')).toEqual({ species: 'owl', walker: false });
    expect(at('comets')).toEqual({ species: 'cometling', walker: false });
    expect(at('saturncore')).toEqual({ species: 'snowflake', walker: false });
  });

  it('every Saturn layer gets a banner and a badge, after the Mars ones', () => {
    expect(BADGE_LAYERS.slice(14, 19)).toEqual(['rings', 'icecream', 'aurora', 'comets', 'saturncore']);
    expect(discovery(120, [], 'saturn')).toBe('aurora');
  });

  it('Saturn chests hold their layer’s ore', () => {
    const rng = createRng(9);
    expect(new Set(chestLoot(10, rng, 'saturn'))).toEqual(new Set(['frost']));
    expect(new Set(chestLoot(60, rng, 'saturn'))).toEqual(new Set(['icecream']));
    expect(new Set(chestLoot(120, rng, 'saturn'))).toEqual(new Set(['pearl']));
    expect(new Set(chestLoot(170, rng, 'saturn'))).toEqual(new Set(['comet']));
  });

  it('snow globes pour pearls, the frozen comet is full of comet chunks, a snowman bursts into frost', () => {
    const g = globeLoot(createRng(1));
    expect(g.filter((o) => o === 'pearl').length).toBeGreaterThanOrEqual(6);
    expect(g.filter((o) => o === 'frost').length).toBe(2);
    const c = cometLoot(createRng(1));
    expect(c.filter((o) => o === 'comet').length).toBeGreaterThanOrEqual(6);
    expect(c.filter((o) => o === 'pearl').length).toBe(2);
    const s = snowmanLoot(createRng(1));
    expect(s.length).toBeGreaterThanOrEqual(8);
    expect(new Set(s)).toEqual(new Set(['frost']));
  });

  it('two snowballs side by side meet (and never with a cheese wheel)', () => {
    const grid = createGrid(10, 5);
    grid.set(3, 3, B.SNOWBALL);
    grid.set(4, 3, B.SNOWBALL);
    grid.set(6, 3, B.SNOWBALL);
    grid.set(7, 3, B.CHEESE_WHEEL);
    expect(boulderPairMeet(grid, 3, 3)).toEqual({ x: 4, y: 3 });
    expect(boulderPairMeet(grid, 6, 3)).toBe(false);
    expect(wheelsMeet(grid, 7, 3)).toBe(false);
  });

  it('the Saturn Heart counts its own cells', () => {
    expect(HEARTS.saturn.block).toBe(B.SATURN_HEART);
    expect(HEARTS.saturn.sticker).toBe('find-saturnheart');
    const grid = { get: () => B.SATURN_HEART };
    expect(heartLeft(grid, { x: 0, y: 0, kind: 'saturn' })).toBe(9);
  });
});

describe('Ring Station', () => {
  it('has four buildings; the Dino Rocket needs the Gloves', () => {
    expect(SATURN_BLUEPRINTS.map((b) => b.id)).toEqual(['parlour', 'lighthouse', 'skilift', 'dinorocket']);
    expect(blueprintsFor('saturn')).toBe(SATURN_BLUEPRINTS);
    const rocket = SATURN_BLUEPRINTS.find((b) => b.id === 'dinorocket');
    expect(blueprintOk(rich(), rocket)).toBe(false);
    expect(plotsOf(buildOnPlot(winSuitPiece(rich(), 'gloves'), 3, 'dinorocket', 'saturn'), 'saturn')[3]).toBe('dinorocket');
  });

  it('the Ice Cream Parlour makes 3 ice cream a trip', () => {
    const g = campGift(withSaturn(['parlour', null, null, null]), 'saturn');
    expect(g.ores).toEqual(['icecream', 'icecream', 'icecream']);
    expect(g.state.bank.icecream).toBe(3);
  });

  it('the Ice Lighthouse shows chests; the Ski Lift is the elevator', () => {
    expect(revealsChests(withSaturn([null, 'lighthouse', null, null]), 'saturn')).toBe(true);
    const s = withSaturn([null, null, 'skilift', null], { records: { ...defaultState().records, layers: ['rings', 'icecream'] } });
    expect(elevatorStops(s, 'saturn').map((x) => x.open)).toEqual([true, true, false, false, false]);
  });

  it('on Saturn the goal is a Saturn thing, and it knows where Saturn ores are', () => {
    const s = { ...defaultState(), upgrades: { pick: 11, pack: 6, lantern: 6 }, suit: ['helmet', 'boots'] };
    for (const ore of Object.keys(nextGoal(s, 'saturn').cost)) expect(['frost', 'icecream', 'pearl', 'comet']).toContain(ore);
    expect(oreTopRow('pearl', 'saturn')).toBe(SATURN_LAYERS.aurora.top);
    expect(oreTopRow('comet', 'saturn')).toBe(SATURN_LAYERS.comets.top);
  });
});

describe('slippery ice', () => {
  const rink = (block = B.ICE) => {
    const grid = createGrid(40, 10);
    for (let x = 0; x < 40; x++) grid.set(x, 8, block);
    return grid;
  };
  const run = (p, grid, intent, frames, opts = {}) => {
    for (let i = 0; i < frames; i++) stepPlayer(p, { moveX: 0, moveY: 0, jump: false, ...intent }, grid, { dt: 1 / 60, ...opts });
  };

  it('on ice you speed up slowly', () => {
    const p = createPlayer(standAt(5, 7));
    run(p, rink(), {}, 2);
    run(p, rink(), { moveX: 1 }, 6);
    expect(p.vx).toBeGreaterThan(0);
    expect(p.vx).toBeLessThan(PLAYER.walkSpeed * 0.5);
  });

  it('let go on ice and you glide a couple of blocks', () => {
    const grid = rink();
    const p = createPlayer(standAt(5, 7));
    run(p, grid, {}, 2);
    run(p, grid, { moveX: 1 }, 60);
    const x0 = p.x;
    run(p, grid, {}, 120);
    expect(p.x - x0).toBeGreaterThan(16);
    expect(p.vx).toBe(0);
  });

  it('on stone (or with the Gloves) you stop at once', () => {
    const stone = rink(B.STONE);
    const p = createPlayer(standAt(5, 7));
    run(p, stone, {}, 2);
    run(p, stone, { moveX: 1 }, 30);
    const x0 = p.x;
    run(p, stone, {}, 30);
    expect(p.x).toBeCloseTo(x0, 5);
    const grid = rink();
    const q = createPlayer(standAt(5, 7));
    run(q, grid, {}, 2, { grip: true });
    run(q, grid, { moveX: 1 }, 30, { grip: true });
    const q0 = q.x;
    run(q, grid, {}, 30, { grip: true });
    expect(q.x).toBeCloseTo(q0, 5);
  });

  it('a wall stops a slide', () => {
    const grid = rink();
    grid.set(9, 7, B.ICE);
    const p = createPlayer(standAt(5, 7));
    run(p, grid, {}, 2);
    run(p, grid, { moveX: 1 }, 50);
    run(p, grid, {}, 60);
    expect(p.x + PLAYER.w).toBeLessThanOrEqual(9 * 16 + 0.01);
    expect(p.vx).toBe(0);
  });
});

describe('the Gloves and the Yeti Cub', () => {
  it('the Gloves dig 25% faster', () => {
    expect(digMul(defaultState())).toBe(1);
    expect(digMul(winSuitPiece(defaultState(), 'gloves'))).toBeCloseTo(1.25);
  });

  it('the Yeti Cub is a walking pet from its egg', () => {
    expect(SATURN_KINDS).toEqual(['yeti']);
    expect(PET_KINDS).toContain('yeti');
    expect(WALKING_PETS).toContain('yeti');
    expect(hatch(defaultState(), 'yeti').state.pets).toEqual(['yeti']);
  });

  it('the Yeti digs the block above a sideways dig, if the drill can', () => {
    const grid = createGrid(10, 10);
    grid.set(5, 4, B.ICE);
    grid.set(6, 4, B.COMET_ROCK);
    expect(yetiDig(grid, { x: 5, y: 5, ladder: false }, 11)).toEqual({ x: 5, y: 4, id: B.ICE, drop: null });
    expect(grid.get(5, 4)).toBe(B.AIR);
    // too hard for this drill, or a dig straight up/down: nothing
    expect(yetiDig(grid, { x: 6, y: 5, ladder: false }, 11)).toBe(null);
    expect(grid.get(6, 4)).toBe(B.COMET_ROCK);
    grid.set(3, 4, B.ICE);
    expect(yetiDig(grid, { x: 3, y: 5, ladder: true }, 11)).toBe(null);
    expect(yetiDig(grid, { x: 1, y: 5, ladder: false }, 11)).toBe(null); // air above
  });
});
