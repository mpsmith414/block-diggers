import { describe, it, expect } from 'vitest';
import { B } from '../../src/world/blocks.js';
import { createGrid } from '../../src/world/grid.js';
import { createRng } from '../../src/world/rng.js';
import { creatureFor, spawnSpot } from '../../src/game/hazards.js';
import { discovery, layersReached, summarizeTrip, BADGE_LAYERS } from '../../src/game/trip.js';
import { chestLoot } from '../../src/game/loot.js';
import { ufoLoot, cheesePartyLoot, moonMeteoriteLoot, pushBoulder, wheelsMeet, heartLeft } from '../../src/game/finds.js';
import {
  UPGRADES, MOON_BLUEPRINTS, blueprintsFor, plotsOf, buildOnPlot, blueprintOk, depositPacks,
} from '../../src/game/economy.js';
import {
  hasBuilt, lanternRadius, elevatorStops, cheeseFactoryGift, revealsChests, winSuitPiece,
} from '../../src/game/perks.js';
import { PET_KINDS, MOON_KINDS, hatch } from '../../src/game/pets.js';
import { createPlayer, stepPlayer, standAt } from '../../src/game/player.js';
import { shownOres } from '../../src/game/ores.js';
import { nextGoal, oreTopRow } from '../../src/game/goals.js';
import { defaultState } from '../../src/save/save.js';
import { MOON_LAYERS, LANTERN, PLAYER, TILE } from '../../src/tuning.js';

const rich = (extra = {}) => ({
  ...defaultState(),
  bank: { ...defaultState().bank, moonstone: 99, cheese: 99, spacegem: 99, gizmo: 99, ...extra },
});

describe('Moon creatures', () => {
  it('each Moon layer has its own creature', () => {
    const at = (layer) => creatureFor(MOON_LAYERS[layer].top + 5, 'moon');
    expect(at('craters')).toEqual({ species: 'moonblob', walker: true });
    expect(at('cheesecaves')).toEqual({ species: 'mouse', walker: true });
    expect(at('mooncrystal')).toEqual({ species: 'jelly', walker: false });
    expect(at('alienbase')).toEqual({ species: 'drone', walker: false });
    expect(at('mooncore')).toEqual({ species: 'sprite', walker: false });
    // Earth is unchanged
    expect(creatureFor(10)).toEqual({ species: 'slime', walker: true });
  });

  it('spawns inside the Moon layer you are in', () => {
    const grid = createGrid(48, 252);
    for (let y = 0; y < 252; y++) for (let x = 0; x < 48; x++) grid.set(x, y, y % 4 === 3 ? B.MOONROCK : B.AIR);
    const rng = createRng(3);
    for (let i = 0; i < 30; i++) {
      const s = spawnSpot(grid, rng, { walker: false, near: { cx: 20, cy: 160 }, planet: 'moon' });
      if (!s) continue;
      expect(s.cy).toBeGreaterThanOrEqual(MOON_LAYERS.alienbase.top);
      expect(s.cy).toBeLessThanOrEqual(MOON_LAYERS.alienbase.bottom);
    }
  });
});

describe('Moon trips', () => {
  it('all five Moon layers get a banner and a badge the first time', () => {
    for (const l of Object.keys(MOON_LAYERS)) expect(BADGE_LAYERS).toContain(l);
    expect(discovery(75, [], 'moon')).toBe('cheesecaves');
    expect(discovery(75, ['cheesecaves'], 'moon')).toBe(null);
    expect(discovery(5, [], 'moon')).toBe('craters');
    // Earth still badges only its deep layers
    expect(discovery(5, [])).toBe(null);
  });

  it('layers reached on the Moon', () => {
    expect(layersReached(120, 'moon')).toEqual(['craters', 'cheesecaves', 'mooncrystal']);
    expect(layersReached(0, 'moon')).toEqual([]);
  });

  it('a Moon trip keeps its own deepest record and adds its layers', () => {
    const records = { deepest: 200, mostOres: 5, layers: ['dirt', 'stone', 'deep', 'crystal', 'dino'], moonTrips: 1, planetDeepest: {} };
    const s = summarizeTrip({ packs: [{ moonstone: 3 }], deepest: 120, chests: 1, stickers: [], planet: 'moon' }, records);
    expect(s.records.deepest).toBe(200); // Earth's record untouched
    expect(s.records.planetDeepest.moon).toBe(120);
    expect(s.best.deepest).toBe(true);
    expect(s.records.layers).toEqual(expect.arrayContaining(['dino', 'craters', 'cheesecaves', 'mooncrystal']));
    expect(s.records.moonTrips).toBe(2);
    expect(s.planet).toBe('moon');
    expect(s.totals.moonstone).toBe(3);
    // a shallower Moon trip is not a record
    const t = summarizeTrip({ packs: [], deepest: 50, chests: 0, stickers: [], planet: 'moon' }, s.records);
    expect(t.best.deepest).toBe(false);
    expect(t.records.planetDeepest.moon).toBe(120);
  });
});

describe('Moon treasure', () => {
  it('Moon chests hold their layer’s ore', () => {
    const rng = createRng(1);
    expect(new Set(chestLoot(10, rng, 'moon'))).toEqual(new Set(['moonstone']));
    expect(new Set(chestLoot(60, rng, 'moon'))).toEqual(new Set(['cheese']));
    expect(new Set(chestLoot(120, rng, 'moon'))).toEqual(new Set(['spacegem']));
    expect(new Set(chestLoot(170, rng, 'moon'))).toEqual(new Set(['gizmo']));
    const core = chestLoot(220, rng, 'moon');
    expect(core.length).toBeGreaterThanOrEqual(3);
    for (const o of core) expect(['moonstone', 'spacegem', 'gizmo']).toContain(o);
  });

  it('the crashed UFO is full of gizmos and space gems', () => {
    const loot = ufoLoot(createRng(4));
    const g = loot.filter((o) => o === 'gizmo').length;
    const s = loot.filter((o) => o === 'spacegem').length;
    expect(g).toBeGreaterThanOrEqual(6);
    expect(g).toBeLessThanOrEqual(8);
    expect(s).toBeGreaterThanOrEqual(2);
    expect(s).toBeLessThanOrEqual(3);
    expect(g + s).toBe(loot.length);
  });

  it('a cheese party is 8-10 cheese; a moon meteorite is moonstone', () => {
    const party = cheesePartyLoot(createRng(2));
    expect(party.length).toBeGreaterThanOrEqual(8);
    expect(party.length).toBeLessThanOrEqual(10);
    expect(new Set(party)).toEqual(new Set(['cheese']));
    expect(new Set(moonMeteoriteLoot(createRng(2)))).toEqual(new Set(['moonstone']));
  });

  it('a pushed cheese wheel stays a cheese wheel, and two touching wheels meet', () => {
    const grid = createGrid(10, 5);
    for (let x = 0; x < 10; x++) grid.set(x, 4, B.MOONROCK);
    grid.set(3, 3, B.CHEESE_WHEEL);
    grid.set(5, 3, B.CHEESE_WHEEL);
    expect(wheelsMeet(grid, 3, 3)).toBe(false);
    const r = pushBoulder(grid, 3, 3, 1);
    expect(r.moved).toBe(true);
    expect(grid.get(4, 3)).toBe(B.CHEESE_WHEEL);
    expect(wheelsMeet(grid, 4, 3)).toEqual({ x: 5, y: 3 });
    // ordinary boulders never meet as cheese
    grid.set(7, 3, B.BOULDER);
    grid.set(8, 3, B.BOULDER);
    expect(wheelsMeet(grid, 7, 3)).toBe(false);
  });

  it('the Moon Heart counts its own cells', () => {
    const grid = createGrid(10, 10);
    for (let y = 2; y < 5; y++) for (let x = 2; x < 5; x++) grid.set(x, y, B.MOON_HEART);
    grid.set(3, 3, B.AIR);
    expect(heartLeft(grid, { x: 2, y: 2, kind: 'moon' })).toBe(8);
  });
});

describe('Moon upgrades and buildings', () => {
  it('drills 6-8 and the fifth backpack and lantern cost Moon ores', () => {
    expect(UPGRADES.pick.slice(5)).toEqual([
      { moonstone: 15, cheese: 10 }, { spacegem: 15, moonstone: 15 }, { gizmo: 15, spacegem: 15 },
    ]);
    expect(UPGRADES.pack[4]).toEqual({ moonstone: 12, cheese: 12 });
    expect(UPGRADES.lantern[4]).toEqual({ spacegem: 10, moonstone: 8 });
  });

  it('Moon Base has four buildings', () => {
    expect(MOON_BLUEPRINTS.map((b) => b.id)).toEqual(['cheesefactory', 'telescope', 'hangar', 'marsrocket']);
    expect(blueprintsFor('moon')).toBe(MOON_BLUEPRINTS);
    expect(blueprintsFor('earth').map((b) => b.id)).toContain('rocket');
  });

  it('Moon plots are separate from Earth plots', () => {
    const s = rich();
    expect(plotsOf(s, 'moon')).toEqual([null, null, null, null]);
    const t = buildOnPlot(s, 1, 'telescope', 'moon');
    expect(plotsOf(t, 'moon')).toEqual([null, 'telescope', null, null]);
    expect(t.plots).toEqual(s.plots);
    expect(t.bank.moonstone).toBe(79);
    expect(t.bank.spacegem).toBe(94);
    // an Earth building can't go on the Moon
    expect(buildOnPlot(s, 0, 'garden', 'moon')).toBe(null);
  });

  it('the Mars Rocket needs the Helmet', () => {
    const s = rich();
    const mars = MOON_BLUEPRINTS.find((b) => b.id === 'marsrocket');
    expect(blueprintOk(s, mars)).toBe(false);
    expect(buildOnPlot(s, 3, 'marsrocket', 'moon')).toBe(null);
    const suited = { ...s, suit: ['helmet'] };
    expect(blueprintOk(suited, mars)).toBe(true);
    expect(plotsOf(buildOnPlot(suited, 3, 'marsrocket', 'moon'), 'moon')[3]).toBe('marsrocket');
  });

  it('Moon ores are banked from packs', () => {
    const s = depositPacks(defaultState(), [{ moonstone: 2, cheese: 3 }, { gizmo: 1 }]);
    expect(s.bank.moonstone).toBe(2);
    expect(s.bank.cheese).toBe(3);
    expect(s.bank.gizmo).toBe(1);
  });
});

describe('Moon perks', () => {
  const withMoon = (plots, extra = {}) => ({ ...defaultState(), bases: { moon: { plots } }, ...extra });

  it('knows what is built on which planet', () => {
    const s = withMoon(['cheesefactory', null, null, null], { plots: ['tower', null, null, null, null, null, null, null, null] });
    expect(hasBuilt(s, 'cheesefactory', 'moon')).toBe(true);
    expect(hasBuilt(s, 'tower', 'earth')).toBe(true);
    expect(hasBuilt(s, 'tower', 'moon')).toBe(false);
  });

  it('the Helmet is a headlamp: 2 more blocks of light, everywhere', () => {
    const s = { ...defaultState(), upgrades: { pick: 0, pack: 0, lantern: 2 } };
    expect(lanternRadius(s)).toBe(LANTERN[2]);
    expect(lanternRadius(winSuitPiece(s, 'helmet'))).toBe(LANTERN[2] + 2);
  });

  it('winning a suit piece twice keeps one', () => {
    const s = winSuitPiece(winSuitPiece(defaultState(), 'helmet'), 'helmet');
    expect(s.suit).toEqual(['helmet']);
  });

  it('the UFO Hangar is the Moon elevator', () => {
    const none = withMoon([null, null, null, null]);
    expect(elevatorStops(none, 'moon')).toEqual([]);
    const s = withMoon([null, null, 'hangar', null], { records: { ...defaultState().records, layers: ['craters', 'cheesecaves'] } });
    const stops = elevatorStops(s, 'moon');
    expect(stops.map((x) => x.layer)).toEqual(Object.keys(MOON_LAYERS));
    expect(stops.map((x) => x.open)).toEqual([true, true, false, false, false]);
    expect(stops[0].row).toBe(null);
    expect(stops[1].row).toBe(MOON_LAYERS.cheesecaves.top + 1);
  });

  it('the Cheese Factory makes 3 cheese a trip', () => {
    expect(cheeseFactoryGift(withMoon([null, null, null, null])).ores).toEqual([]);
    const g = cheeseFactoryGift(withMoon(['cheesefactory', null, null, null]));
    expect(g.ores).toEqual(['cheese', 'cheese', 'cheese']);
    expect(g.state.bank.cheese).toBe(3);
  });

  it('the Telescope shows chests on the Moon (the tower does on Earth)', () => {
    expect(revealsChests(withMoon([null, 'telescope', null, null]), 'moon')).toBe(true);
    expect(revealsChests(withMoon([null, 'telescope', null, null]), 'earth')).toBe(false);
  });
});

describe('the Moon Pup', () => {
  it('is a pet that hatches from its egg', () => {
    expect(MOON_KINDS).toEqual(['moonpup']);
    expect(PET_KINDS).toContain('moonpup');
    expect(hatch(defaultState(), 'moonpup').state.pets).toEqual(['moonpup']);
  });

  it('gives a double jump: one more hop in mid-air, back again on landing', () => {
    const grid = createGrid(10, 30);
    for (let x = 0; x < 10; x++) grid.set(x, 20, B.MOONROCK);
    const p = createPlayer(standAt(5, 19));
    const step = (jump, airJumps) => stepPlayer(p, { moveX: 0, moveY: 0, jump }, grid, { dt: 1 / 60, airJumps });
    step(false, 1);
    expect(step(true, 1).jumped).toBe(true);
    for (let i = 0; i < 10; i++) step(false, 1);
    expect(p.grounded).toBe(false);
    const r = step(true, 1);
    expect(r.doubleJumped).toBe(true);
    expect(p.vy).toBeLessThan(0);
    for (let i = 0; i < 5; i++) step(false, 1);
    expect(step(true, 1).doubleJumped).toBeFalsy(); // only one
    for (let i = 0; i < 400 && !p.grounded; i++) step(false, 1);
    expect(p.grounded).toBe(true);
    step(true, 1);
    for (let i = 0; i < 10; i++) step(false, 1);
    expect(step(true, 1).doubleJumped).toBe(true); // back after landing
  });

  it('no pup, no double jump', () => {
    const grid = createGrid(10, 30);
    for (let x = 0; x < 10; x++) grid.set(x, 20, B.MOONROCK);
    const p = createPlayer(standAt(5, 19));
    const step = (jump) => stepPlayer(p, { moveX: 0, moveY: 0, jump }, grid, { dt: 1 / 60 });
    step(false);
    step(true);
    for (let i = 0; i < 10; i++) step(false);
    expect(step(true).doubleJumped).toBeFalsy();
    expect(p.y).toBeLessThan(19 * TILE + TILE - PLAYER.h);
  });
});

describe('the HUD and the goal hint on the Moon', () => {
  it('Moon ores show once found; Earth ores stay on Earth', () => {
    const s = { ...defaultState(), stickers: { 'ore-moonstone': true, 'ore-star': true } };
    expect(shownOres(s, 'moon')).toEqual(['moonstone']);
    expect(shownOres(s)).toEqual(['coal', 'iron', 'gold', 'diamond', 'emerald', 'star']);
  });

  it('on the Moon the goal is a Moon thing, and it knows where Moon ores are', () => {
    const s = { ...defaultState(), upgrades: { pick: 5, pack: 4, lantern: 4 } };
    const g = nextGoal(s, 'moon');
    expect(g).not.toBe(null);
    for (const ore of Object.keys(g.cost)) expect(['moonstone', 'cheese', 'spacegem', 'gizmo', 'heart']).toContain(ore);
    expect(oreTopRow('cheese', 'moon')).toBe(MOON_LAYERS.cheesecaves.top);
    expect(oreTopRow('gizmo', 'moon')).toBe(MOON_LAYERS.alienbase.top);
    expect(oreTopRow('moonstone', 'moon')).toBe(MOON_LAYERS.craters.top);
  });
});
