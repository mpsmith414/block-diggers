import { describe, it, expect } from 'vitest';
import { B, ORES, dropOf, isSolid } from '../../src/world/blocks.js';
import { mineTime, createGrid } from '../../src/world/grid.js';
import { createRng } from '../../src/world/rng.js';
import { planetById, layersOf, layerOfRow, planetOfLayer, mineRows, starMapStops } from '../../src/game/planets.js';
import { creatureFor } from '../../src/game/hazards.js';
import { discovery, BADGE_LAYERS } from '../../src/game/trip.js';
import { chestLoot } from '../../src/game/loot.js';
import { nestLoot, skullLoot, stegoLoot, heartLeft, HEARTS } from '../../src/game/finds.js';
import { UPGRADES, DINO_BLUEPRINTS, blueprintsFor, plotsOf, buildOnPlot, blueprintOk } from '../../src/game/economy.js';
import { campGift, elevatorStops, revealsChests, jetpack, stepUp, winSuitPiece } from '../../src/game/perks.js';
import { PET_KINDS, DINO_PLANET_KINDS, WALKING_PETS, hatch } from '../../src/game/pets.js';
import { createPowerups, startRide, stepPowerups, multipliers } from '../../src/game/powerups.js';
import { createPlayer, stepPlayer, standAt } from '../../src/game/player.js';
import { nextGoal, oreTopRow } from '../../src/game/goals.js';
import { defaultState } from '../../src/save/save.js';
import { DINO_LAYERS, DINO_CAMP, LAYER_COLORS, BACKPACK, LANTERN, PLAYER, RIDE, JET, TILE } from '../../src/tuning.js';

const withDino = (plots, extra = {}) => ({ ...defaultState(), bases: { ...defaultState().bases, dino: { plots } }, ...extra });
const rich = () => ({ ...defaultState(), bank: { ...defaultState().bank, jade: 99, bone: 99, tooth: 99, obsidian: 99 } });

describe('Dino Planet', () => {
  it('is open now (the Sun is coming soon), with the Jetpack at its bottom', () => {
    const d = planetById('dino');
    expect(d.comingSoon).toBeFalsy();
    expect(d.suit).toBe('jetpack');
    expect(d.ores).toEqual(['jade', 'bone', 'tooth', 'obsidian']);
    expect(d.camp).toBe(DINO_CAMP);
    expect(d.heart).toBe('dino');
    expect(planetById('sun').comingSoon).toBe(true);
  });

  it('has five layers of fifty rows (no clash with Earth’s dino layer)', () => {
    expect(Object.keys(layersOf('dino'))).toEqual(['jungle', 'bonebeds', 'swamp', 'lavalands', 'dinocore']);
    expect(mineRows('dino')).toBe(252);
    expect(layerOfRow(120, 'dino')).toBe('swamp');
    expect(planetOfLayer('lavalands')).toBe('dino');
    expect(planetOfLayer('dino')).toBe('earth');
    for (const id of Object.keys(DINO_LAYERS)) expect(LAYER_COLORS[id]).toBeTypeOf('number');
  });

  it('the Dino Rocket opens Dino Planet; the Sun Rocket makes the Sun "coming soon"', () => {
    const base = { plots: ['rocket'], suit: [], bases: { moon: { plots: [null, null, null, 'marsrocket'] }, mars: { plots: [null, null, null, 'saturnrocket'] }, saturn: { plots: [null, null, null, 'dinorocket'] }, dino: { plots: [null, null, null, null] } } };
    const status = (st, here) => Object.fromEntries(starMapStops(st, here).map((x) => [x.id, x.status]));
    expect(status(base, 'saturn').dino).toBe('open');
    expect(status(base, 'saturn').sun).toBe('locked');
    const t = { ...base, bases: { ...base.bases, dino: { plots: [null, null, null, 'sunrocket'] } } };
    expect(status(t, 'dino')).toEqual({ earth: 'open', moon: 'open', mars: 'open', saturn: 'open', dino: 'here', sun: 'soon' });
  });
});

describe('Dino ores and tools', () => {
  it('four Dino ores join the list', () => {
    expect(ORES.slice(20)).toEqual(['jade', 'bone', 'tooth', 'obsidian']);
    expect(dropOf(B.JADE)).toBe('jade');
    expect(dropOf(B.BONE)).toBe('bone');
    expect(dropOf(B.TOOTH)).toBe('tooth');
    expect(dropOf(B.OBSIDIAN)).toBe('obsidian');
  });

  it('each deeper Dino rock needs the next drill', () => {
    const tiers = (id) => Array.from({ length: 18 }, (_, p) => mineTime(id, p) !== Infinity);
    const from = (n) => Array.from({ length: 18 }, (_, p) => p >= n);
    expect(tiers(B.JUNGLE_SOIL)).toEqual(from(14));
    expect(tiers(B.FOSSIL_ROCK)).toEqual(from(14));
    expect(tiers(B.SWAMP_MUD)).toEqual(from(15));
    expect(tiers(B.VOLCANIC)).toEqual(from(16));
    expect(tiers(B.DINO_CORE)).toEqual(from(17));
    expect(mineTime(B.SATURN_CORE, 17)).toBeLessThan(mineTime(B.SATURN_CORE, 14));
    expect(isSolid(B.PARASAUR)).toBe(false);
    expect(isSolid(B.NEST)).toBe(false);
    expect(isSolid(B.REX_SKULL)).toBe(false);
    expect(isSolid(B.STEGO)).toBe(false);
    expect(isSolid(B.DINO_HEART)).toBe(true);
  });

  it('a ninth backpack and lantern level', () => {
    expect(BACKPACK[8]).toBe(620);
    expect(LANTERN[8]).toBe(19);
  });

  it('drills 15-17 and the eighth backpack and lantern cost Dino ores', () => {
    expect(UPGRADES.pick.slice(14)).toEqual([{ jade: 45, bone: 35 }, { tooth: 45, jade: 45 }, { obsidian: 55, tooth: 45 }]);
    expect(UPGRADES.pack[7]).toEqual({ jade: 55, bone: 55 });
    expect(UPGRADES.lantern[7]).toEqual({ tooth: 40, jade: 35 });
  });
});

describe('Dino creatures, trips and treasure', () => {
  it('each Dino layer has its own creature', () => {
    const at = (layer) => creatureFor(DINO_LAYERS[layer].top + 5, 'dino');
    expect(at('jungle')).toEqual({ species: 'dragonfly', walker: false });
    expect(at('bonebeds')).toEqual({ species: 'raptor', walker: true });
    expect(at('swamp')).toEqual({ species: 'frog', walker: true });
    expect(at('lavalands')).toEqual({ species: 'beetle', walker: true });
    expect(at('dinocore')).toEqual({ species: 'moth', walker: false });
  });

  it('every Dino layer gets a banner and a badge, after the Saturn ones', () => {
    expect(BADGE_LAYERS.slice(19)).toEqual(['jungle', 'bonebeds', 'swamp', 'lavalands', 'dinocore']);
    expect(discovery(160, [], 'dino')).toBe('lavalands');
  });

  it('Dino chests hold their layer’s ore', () => {
    const rng = createRng(4);
    expect(new Set(chestLoot(10, rng, 'dino'))).toEqual(new Set(['jade']));
    expect(new Set(chestLoot(60, rng, 'dino'))).toEqual(new Set(['bone']));
    expect(new Set(chestLoot(120, rng, 'dino'))).toEqual(new Set(['tooth']));
    expect(new Set(chestLoot(170, rng, 'dino'))).toEqual(new Set(['obsidian']));
  });

  it('nests toss bones and jade, the skull is full of teeth, the stego shakes off obsidian', () => {
    const n = nestLoot(createRng(1));
    expect(n.filter((o) => o === 'bone').length).toBeGreaterThanOrEqual(5);
    expect(n.filter((o) => o === 'jade').length).toBe(2);
    const s = skullLoot(createRng(1));
    expect(s.filter((o) => o === 'tooth').length).toBeGreaterThanOrEqual(7);
    const o = stegoLoot(createRng(1));
    expect(o.filter((x) => x === 'obsidian').length).toBeGreaterThanOrEqual(7);
  });

  it('the Dino Heart counts its own cells', () => {
    expect(HEARTS.dino.block).toBe(B.DINO_HEART);
    expect(HEARTS.dino.sticker).toBe('find-dinoheart');
    expect(heartLeft({ get: () => B.DINO_HEART }, { x: 0, y: 0, kind: 'dino' })).toBe(9);
  });
});

describe('Dino Camp', () => {
  it('has four buildings; the Sun Rocket needs the Jetpack', () => {
    expect(DINO_BLUEPRINTS.map((b) => b.id)).toEqual(['nursery', 'treehouse', 'pteroperch', 'sunrocket']);
    expect(blueprintsFor('dino')).toBe(DINO_BLUEPRINTS);
    const rocket = DINO_BLUEPRINTS.find((b) => b.id === 'sunrocket');
    expect(blueprintOk(rich(), rocket)).toBe(false);
    expect(plotsOf(buildOnPlot(winSuitPiece(rich(), 'jetpack'), 3, 'sunrocket', 'dino'), 'dino')[3]).toBe('sunrocket');
  });

  it('the Nursery makes 3 jade a trip; the Treehouse shows chests; the Ptero Perch is the elevator', () => {
    expect(campGift(withDino(['nursery', null, null, null]), 'dino').ores).toEqual(['jade', 'jade', 'jade']);
    expect(revealsChests(withDino([null, 'treehouse', null, null]), 'dino')).toBe(true);
    const s = withDino([null, null, 'pteroperch', null], { records: { ...defaultState().records, layers: ['jungle'] } });
    expect(elevatorStops(s, 'dino').map((x) => x.open)).toEqual([true, false, false, false, false]);
  });

  it('on Dino Planet the goal is a Dino thing, and it knows where Dino ores are', () => {
    const s = { ...defaultState(), upgrades: { pick: 14, pack: 7, lantern: 7 }, suit: ['helmet', 'boots', 'gloves'] };
    for (const ore of Object.keys(nextGoal(s, 'dino').cost)) expect(['jade', 'bone', 'tooth', 'obsidian']).toContain(ore);
    expect(oreTopRow('tooth', 'dino')).toBe(DINO_LAYERS.swamp.top);
  });
});

describe('dino rides', () => {
  it('a ride lasts a while: faster, higher jumps, then it ends', () => {
    const pu = createPowerups();
    expect(multipliers(pu).jump).toBe(1);
    expect(startRide(pu)).toBe(true);
    expect(startRide(pu)).toBe(false); // already riding
    expect(multipliers(pu).walk).toBeCloseTo(RIDE.speed);
    expect(multipliers(pu).jump).toBeCloseTo(RIDE.jump);
    expect(multipliers(pu).riding).toBe(true);
    let ended = false;
    for (let t = 0; t < RIDE.time + 1; t += 0.1) if (stepPowerups(pu, 0.1).includes('rideEnd')) ended = true;
    expect(ended).toBe(true);
    expect(multipliers(pu).riding).toBe(false);
  });

  it('a higher jump with jumpMul', () => {
    const grid = createGrid(10, 30);
    for (let x = 0; x < 10; x++) grid.set(x, 20, B.JUNGLE_SOIL);
    const peak = (jumpMul) => {
      const p = createPlayer(standAt(5, 19));
      stepPlayer(p, { moveX: 0, moveY: 0, jump: false }, grid, { dt: 1 / 60 });
      stepPlayer(p, { moveX: 0, moveY: 0, jump: true }, grid, { dt: 1 / 60, jumpMul });
      let top = p.y;
      for (let i = 0; i < 60; i++) { stepPlayer(p, { moveX: 0, moveY: 0, jump: false }, grid, { dt: 1 / 60, jumpMul }); top = Math.min(top, p.y); }
      return top;
    };
    expect(peak(RIDE.jump)).toBeLessThan(peak(1) - 4);
  });
});

describe('the Jetpack', () => {
  const field = () => {
    const grid = createGrid(10, 60);
    for (let x = 0; x < 10; x++) grid.set(x, 50, B.JUNGLE_SOIL);
    return grid;
  };
  const fly = (jet) => {
    const grid = field();
    const p = createPlayer(standAt(5, 49));
    stepPlayer(p, { moveX: 0, moveY: 0, jump: false }, grid, { dt: 1 / 60, jetpack: jet });
    let top = p.y;
    for (let i = 0; i < 90; i++) { stepPlayer(p, { moveX: 0, moveY: 0, jump: true }, grid, { dt: 1 / 60, jetpack: jet }); top = Math.min(top, p.y); }
    return { p, top, grid };
  };

  it('holding jump flies you much higher than a jump', () => {
    expect(fly(true).top).toBeLessThan(fly(false).top - 2 * TILE);
  });

  it('runs out of fuel, and refills when you land', () => {
    const { p, grid } = fly(true);
    expect(p.fuel).toBeLessThanOrEqual(0.001);
    for (let i = 0; i < 400 && !p.grounded; i++) stepPlayer(p, { moveX: 0, moveY: 0, jump: false }, grid, { dt: 1 / 60, jetpack: true });
    expect(p.grounded).toBe(true);
    expect(p.fuel).toBeCloseTo(JET.fuel);
  });

  it('jetpack(state) is on with the Jetpack piece', () => {
    expect(jetpack(defaultState())).toBe(false);
    expect(jetpack(winSuitPiece(defaultState(), 'jetpack'))).toBe(true);
  });
});

describe('the Longneck', () => {
  it('is a walking pet from its egg', () => {
    expect(DINO_PLANET_KINDS).toEqual(['longneck']);
    expect(PET_KINDS).toContain('longneck');
    expect(WALKING_PETS).toContain('longneck');
    expect(hatch(defaultState(), 'longneck').state.pets).toEqual(['longneck']);
    expect(stepUp(defaultState())).toBe(1);
    expect(stepUp({ ...defaultState(), pets: ['longneck'] })).toBe(2);
  });

  it('lets you step up a 2-block ledge (without it, you dig instead)', () => {
    const make = () => {
      const grid = createGrid(12, 12);
      for (let x = 0; x < 12; x++) grid.set(x, 10, B.JUNGLE_SOIL);
      for (let x = 6; x < 12; x++) { grid.set(x, 9, B.JUNGLE_SOIL); grid.set(x, 8, B.JUNGLE_SOIL); }
      return grid;
    };
    const walk = (up) => {
      const grid = make();
      const p = createPlayer(standAt(4, 9));
      for (let i = 0; i < 60; i++) stepPlayer(p, { moveX: 1, moveY: 0, jump: false }, grid, { dt: 1 / 60, stepUp: up, pickLevel: 0 });
      return p;
    };
    expect(walk(2).y).toBe(standAt(7, 7).y);
    expect(walk(1).y).toBe(standAt(5, 9).y);
    expect(PLAYER.h).toBeLessThan(TILE);
  });
});
