import { describe, it, expect } from 'vitest';
import { B, ORES, dropOf, isSolid } from '../../src/world/blocks.js';
import { mineTime } from '../../src/world/grid.js';
import { createRng } from '../../src/world/rng.js';
import { PLANETS, planetById, layersOf, layerOfRow, planetOfLayer, mineRows, starMapStops } from '../../src/game/planets.js';
import { creatureFor } from '../../src/game/hazards.js';
import { discovery, BADGE_LAYERS, summarizeTrip } from '../../src/game/trip.js';
import { chestLoot } from '../../src/game/loot.js';
import { roverLoot, vaultLoot, heartLeft, HEARTS } from '../../src/game/finds.js';
import { UPGRADES, MARS_BLUEPRINTS, blueprintsFor, plotsOf, buildOnPlot, blueprintOk } from '../../src/game/economy.js';
import {
  campGift, cheeseFactoryGift, dinoParkGift, elevatorStops, revealsChests, packCap, walkMul, stormRubies, winSuitPiece,
} from '../../src/game/perks.js';
import { PET_KINDS, MARS_KINDS, WALKING_PETS, hatch } from '../../src/game/pets.js';
import { shownOres } from '../../src/game/ores.js';
import { nextGoal, oreTopRow } from '../../src/game/goals.js';
import { defaultState } from '../../src/save/save.js';
import { MARS_LAYERS, MARS_H, MARS_CAMP, LAYER_COLORS, BACKPACK, LANTERN } from '../../src/tuning.js';

const withMars = (plots, extra = {}) => ({ ...defaultState(), bases: { ...defaultState().bases, mars: { plots } }, ...extra });
const rich = (extra = {}) => ({
  ...defaultState(),
  bank: { ...defaultState().bank, ruby: 99, bolt: 99, opal: 99, coin: 99, ...extra },
});

describe('Mars, the planet', () => {
  it('is open, with the Boots at its bottom', () => {
    const mars = planetById('mars');
    expect(mars.comingSoon).toBeFalsy();
    expect(mars.suit).toBe('boots');
    expect(mars.gravity).toBe(1);
    expect(mars.ores).toEqual(['ruby', 'bolt', 'opal', 'coin']);
    expect(mars.camp).toBe(MARS_CAMP);
  });

  it('has five layers of fifty rows', () => {
    expect(Object.keys(layersOf('mars'))).toEqual(['dunes', 'rovers', 'volcano', 'ruins', 'marscore']);
    expect(MARS_LAYERS.dunes).toEqual({ top: 1, bottom: 50 });
    expect(MARS_LAYERS.marscore).toEqual({ top: 201, bottom: 250 });
    expect(MARS_H).toBe(252);
    expect(mineRows('mars')).toBe(252);
    expect(layerOfRow(120, 'mars')).toBe('volcano');
    expect(layerOfRow(999, 'mars')).toBe('marscore');
    expect(planetOfLayer('ruins')).toBe('mars');
    for (const id of Object.keys(MARS_LAYERS)) expect(LAYER_COLORS[id]).toBeTypeOf('number');
    const all = PLANETS.flatMap((p) => Object.keys(p.layers ?? {}));
    expect(new Set(all).size).toBe(all.length);
  });

  it('every planet with a mine has a whole recipe', () => {
    for (const id of ['earth', 'moon', 'mars']) {
      const p = planetById(id);
      expect(p.camp).toBeTruthy();
      expect(p.perks.reveal).toBeTypeOf('string');
      expect(p.perks.elevator).toBeTypeOf('string');
      expect(p.perks.gift).toMatchObject({ building: expect.any(String), ore: expect.any(String) });
      expect(p.heart).toBeTypeOf('string');
    }
  });
});

describe('the star map with Mars', () => {
  const base = () => ({ plots: Array(9).fill(null), bases: { moon: { plots: [null, null, null, null] }, mars: { plots: [null, null, null, null] } }, suit: [] });
  const status = (stops) => Object.fromEntries(stops.map((s) => [s.id, s.status]));

  it('the Mars Rocket opens Mars; the Saturn Rocket opens Saturn', () => {
    const s = { ...base(), plots: ['rocket'], bases: { moon: { plots: [null, null, null, 'marsrocket'] }, mars: { plots: [null, null, null, null] } } };
    expect(status(starMapStops(s, 'moon')).mars).toBe('open');
    expect(status(starMapStops(s, 'moon')).saturn).toBe('locked');
    const t = { ...s, bases: { ...s.bases, mars: { plots: [null, null, null, 'saturnrocket'] } } };
    expect(status(starMapStops(t, 'mars'))).toEqual({ earth: 'open', moon: 'open', mars: 'here', saturn: 'open', dino: 'locked', sun: 'locked' });
  });
});

describe('Mars rock, ores and tools', () => {
  it('four Mars ores join the list', () => {
    expect(ORES.slice(12, 16)).toEqual(['ruby', 'bolt', 'opal', 'coin']);
    expect(dropOf(B.RUBY)).toBe('ruby');
    expect(dropOf(B.BOLT)).toBe('bolt');
    expect(dropOf(B.OPAL)).toBe('opal');
    expect(dropOf(B.COIN)).toBe('coin');
  });

  it('each deeper Mars rock needs the next drill', () => {
    const tiers = (id) => Array.from({ length: 12 }, (_, p) => mineTime(id, p) !== Infinity);
    const from = (n) => Array.from({ length: 12 }, (_, p) => p >= n);
    expect(tiers(B.MARS_ROCK)).toEqual(from(8));
    expect(tiers(B.RUST_ROCK)).toEqual(from(8));
    expect(tiers(B.BASALT)).toEqual(from(9));
    expect(tiers(B.RUIN_STONE)).toEqual(from(10));
    expect(tiers(B.MARS_CORE)).toEqual(from(11));
    expect(tiers(B.VAULT)).toEqual(from(99));
    expect(tiers(B.VAULT_DOOR)).toEqual(from(99));
    expect(mineTime(B.OPAL, 9)).toBe(mineTime(B.BASALT, 9));
    // the new drills are faster on old rock too, and old rock still digs
    expect(mineTime(B.MOON_CORE, 11)).toBeLessThan(mineTime(B.MOON_CORE, 8));
    expect(mineTime(B.DIRT, 11)).toBeLessThan(Infinity);
  });

  it('geysers, old rovers and glyph buttons are walk-through; vault walls are not', () => {
    expect(isSolid(B.GEYSER)).toBe(false);
    expect(isSolid(B.OLD_ROVER)).toBe(false);
    expect(isSolid(B.GLYPH)).toBe(false);
    expect(isSolid(B.VAULT)).toBe(true);
    expect(isSolid(B.VAULT_DOOR)).toBe(true);
    expect(isSolid(B.MARS_HEART)).toBe(true);
  });

  it('a seventh backpack and lantern level', () => {
    expect(BACKPACK[6]).toBe(400);
    expect(LANTERN[6]).toBe(15);
  });

  it('drills 9-11 and the sixth backpack and lantern cost Mars ores', () => {
    expect(UPGRADES.pick.slice(8, 11)).toEqual([
      { ruby: 35, bolt: 25 }, { opal: 35, ruby: 35 }, { coin: 40, opal: 35 },
    ]);
    expect(UPGRADES.pack[5]).toEqual({ ruby: 40, bolt: 40 });
    expect(UPGRADES.lantern[5]).toEqual({ opal: 30, ruby: 25 });
  });
});

describe('Mars creatures and trips', () => {
  it('each Mars layer has its own creature', () => {
    const at = (layer) => creatureFor(MARS_LAYERS[layer].top + 5, 'mars');
    expect(at('dunes')).toEqual({ species: 'dustbunny', walker: true });
    expect(at('rovers')).toEqual({ species: 'crab', walker: true });
    expect(at('volcano')).toEqual({ species: 'newt', walker: true });
    expect(at('ruins')).toEqual({ species: 'martian', walker: false });
    expect(at('marscore')).toEqual({ species: 'ember', walker: false });
  });

  it('every Mars layer gets a banner and a badge, after the Moon ones', () => {
    expect(BADGE_LAYERS.slice(9, 14)).toEqual(['dunes', 'rovers', 'volcano', 'ruins', 'marscore']);
    expect(discovery(160, [], 'mars')).toBe('ruins');
    expect(discovery(160, ['ruins'], 'mars')).toBe(null);
  });

  it('a Mars trip keeps its own deepest record', () => {
    const records = { deepest: 100, mostOres: 5, layers: [], moonTrips: 3, planetDeepest: { moon: 250 } };
    const s = summarizeTrip({ packs: [{ ruby: 4 }], deepest: 80, chests: 0, stickers: [], planet: 'mars' }, records);
    expect(s.records.planetDeepest).toEqual({ moon: 250, mars: 80 });
    expect(s.records.deepest).toBe(100);
    expect(s.records.moonTrips).toBe(3);
    expect(s.away).toBe(true);
    expect(s.totals.ruby).toBe(4);
    expect(s.records.layers).toEqual(expect.arrayContaining(['dunes', 'rovers']));
  });
});

describe('Mars treasure', () => {
  it('Mars chests hold their layer’s ore', () => {
    const rng = createRng(5);
    expect(new Set(chestLoot(10, rng, 'mars'))).toEqual(new Set(['ruby']));
    expect(new Set(chestLoot(60, rng, 'mars'))).toEqual(new Set(['bolt']));
    expect(new Set(chestLoot(120, rng, 'mars'))).toEqual(new Set(['opal']));
    expect(new Set(chestLoot(170, rng, 'mars'))).toEqual(new Set(['coin']));
    for (const o of chestLoot(220, rng, 'mars')) expect(['ruby', 'opal', 'coin']).toContain(o);
  });

  it('an old rover is full of bolts (and a couple of rubies)', () => {
    const loot = roverLoot(createRng(3));
    const bolts = loot.filter((o) => o === 'bolt').length;
    expect(bolts).toBeGreaterThanOrEqual(6);
    expect(bolts).toBeLessThanOrEqual(8);
    expect(loot.filter((o) => o === 'ruby').length).toBe(2);
    expect(loot.length).toBe(bolts + 2);
  });

  it('a vault is a pile of Mars coins', () => {
    const loot = vaultLoot(createRng(3));
    expect(loot.length).toBeGreaterThanOrEqual(8);
    expect(loot.length).toBeLessThanOrEqual(10);
    expect(new Set(loot)).toEqual(new Set(['coin']));
  });

  it('each heart has its own block, loot and sticker', () => {
    expect(HEARTS.earth.block).toBe(B.HEART);
    expect(HEARTS.moon.block).toBe(B.MOON_HEART);
    expect(HEARTS.mars.block).toBe(B.MARS_HEART);
    expect(HEARTS.mars.sticker).toBe('find-marsheart');
    for (const o of HEARTS.mars.loot) expect(ORES).toContain(o);
    const grid = { get: (x, y) => (x === 1 && y === 1 ? B.AIR : B.MARS_HEART) };
    expect(heartLeft(grid, { x: 0, y: 0, kind: 'mars' })).toBe(8);
  });
});

describe('Mars Base', () => {
  it('has four buildings; the Saturn Rocket needs the Boots', () => {
    expect(MARS_BLUEPRINTS.map((b) => b.id)).toEqual(['robotfactory', 'weather', 'garage', 'saturnrocket']);
    expect(blueprintsFor('mars')).toBe(MARS_BLUEPRINTS);
    const s = rich();
    const rocket = MARS_BLUEPRINTS.find((b) => b.id === 'saturnrocket');
    expect(blueprintOk(s, rocket)).toBe(false);
    expect(buildOnPlot(s, 3, 'saturnrocket', 'mars')).toBe(null);
    const suited = winSuitPiece(s, 'boots');
    expect(plotsOf(buildOnPlot(suited, 3, 'saturnrocket', 'mars'), 'mars')[3]).toBe('saturnrocket');
  });

  it('Mars plots are their own', () => {
    const s = rich();
    expect(plotsOf(s, 'mars')).toEqual([null, null, null, null]);
    const t = buildOnPlot(s, 0, 'robotfactory', 'mars');
    expect(plotsOf(t, 'mars')).toEqual(['robotfactory', null, null, null]);
    expect(plotsOf(t, 'moon')).toEqual([null, null, null, null]);
    expect(t.bank.bolt).toBe(54);
    expect(t.bank.ruby).toBe(79);
  });

  it('the Robot Factory makes 3 bolts a trip (and each camp keeps its own gift)', () => {
    expect(campGift(withMars([null, null, null, null]), 'mars').ores).toEqual([]);
    const g = campGift(withMars(['robotfactory', null, null, null]), 'mars');
    expect(g.ores).toEqual(['bolt', 'bolt', 'bolt']);
    expect(g.state.bank.bolt).toBe(3);
    // the old gifts still work the same way
    const moon = { ...defaultState(), bases: { moon: { plots: ['cheesefactory', null, null, null] } } };
    expect(cheeseFactoryGift(moon).ores).toEqual(['cheese', 'cheese', 'cheese']);
    expect(campGift(moon, 'moon').ores).toEqual(['cheese', 'cheese', 'cheese']);
    const park = { ...defaultState(), plots: ['dinopark', null, null, null, null, null, null, null, null] };
    expect(campGift(park, 'earth').ores).toEqual(dinoParkGift(park).ores);
  });

  it('the Weather Station shows chests and makes storms carry rubies', () => {
    expect(revealsChests(withMars([null, 'weather', null, null]), 'mars')).toBe(true);
    expect(revealsChests(withMars([null, null, null, null]), 'mars')).toBe(false);
    expect(stormRubies(withMars([null, 'weather', null, null]))).toBe(3);
    expect(stormRubies(withMars([null, null, null, null]))).toBe(0);
  });

  it('the Rover Garage is the Mars elevator', () => {
    expect(elevatorStops(withMars([null, null, null, null]), 'mars')).toEqual([]);
    const s = withMars([null, null, 'garage', null], { records: { ...defaultState().records, layers: ['dunes', 'rovers', 'volcano'] } });
    const stops = elevatorStops(s, 'mars');
    expect(stops.map((x) => x.layer)).toEqual(Object.keys(MARS_LAYERS));
    expect(stops.map((x) => x.open)).toEqual([true, true, true, false, false]);
    expect(stops[2].row).toBe(MARS_LAYERS.volcano.top + 1);
  });
});

describe('the Boots and the Rover Bot', () => {
  it('the Boots make you 30% faster', () => {
    expect(walkMul(defaultState())).toBe(1);
    expect(walkMul(winSuitPiece(defaultState(), 'boots'))).toBeCloseTo(1.3);
  });

  it('the Rover Bot pulls a trailer: half as much again in the backpack', () => {
    const s = { ...defaultState(), upgrades: { pick: 0, pack: 4, lantern: 0 } };
    expect(packCap({ ...s, pets: ['rover'] })).toBe(Math.round(packCap(s) * 1.5));
  });

  it('is a walking pet that hatches from its egg', () => {
    expect(MARS_KINDS).toEqual(['rover']);
    expect(PET_KINDS).toContain('rover');
    expect(WALKING_PETS).toEqual(expect.arrayContaining(['mole', 'rex', 'trike', 'moonpup', 'rover']));
    expect(hatch(defaultState(), 'rover').state.pets).toEqual(['rover']);
  });
});

describe('the HUD and goals on Mars', () => {
  it('Mars ores show once found', () => {
    const s = { ...defaultState(), stickers: { 'ore-ruby': true, 'ore-moonstone': true } };
    expect(shownOres(s, 'mars')).toEqual(['ruby']);
  });

  it('on Mars the goal is a Mars thing, and it knows where Mars ores are', () => {
    const s = { ...defaultState(), upgrades: { pick: 8, pack: 5, lantern: 5 }, suit: ['helmet'] };
    const g = nextGoal(s, 'mars');
    expect(g).not.toBe(null);
    for (const ore of Object.keys(g.cost)) expect(['ruby', 'bolt', 'opal', 'coin']).toContain(ore);
    expect(oreTopRow('ruby', 'mars')).toBe(MARS_LAYERS.dunes.top);
    expect(oreTopRow('opal', 'mars')).toBe(MARS_LAYERS.volcano.top);
    expect(oreTopRow('coin', 'mars')).toBe(MARS_LAYERS.ruins.top);
  });
});
