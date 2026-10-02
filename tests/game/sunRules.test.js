import { describe, it, expect } from 'vitest';
import { B, ORES, dropOf, isSolid } from '../../src/world/blocks.js';
import { mineTime } from '../../src/world/grid.js';
import { createRng } from '../../src/world/rng.js';
import { planetById, layersOf, layerOfRow, planetOfLayer, mineRows, starMapStops } from '../../src/game/planets.js';
import { creatureFor } from '../../src/game/hazards.js';
import { discovery, BADGE_LAYERS } from '../../src/game/trip.js';
import { chestLoot } from '../../src/game/loot.js';
import { fireFlowerLoot, forgeLoot, heartLeft, HEARTS } from '../../src/game/finds.js';
import { UPGRADES, SUN_BLUEPRINTS, blueprintsFor, plotsOf, buildOnPlot, blueprintOk } from '../../src/game/economy.js';
import { campGift, elevatorStops, revealsChests, lanternRadius, winSunHeart } from '../../src/game/perks.js';
import { PET_KINDS, SUN_KINDS, WALKING_PETS, hatch } from '../../src/game/pets.js';
import { createStorm, stepStorm } from '../../src/game/storms.js';
import { nextGoal, oreTopRow } from '../../src/game/goals.js';
import { defaultState } from '../../src/save/save.js';
import { SUN_LAYERS, SUN_CAMP, LAYER_COLORS, BACKPACK, LANTERN, FLARE, PERKS } from '../../src/tuning.js';

const withSun = (plots, extra = {}) => ({ ...defaultState(), bases: { ...defaultState().bases, sun: { plots } }, ...extra });
const rich = () => ({ ...defaultState(), bank: { ...defaultState().bank, sunstone: 99, flare: 99, plasma: 99, nova: 99 } });

describe('the Sun', () => {
  it('is open now, the finale, with the Sun’s Heart at its bottom', () => {
    const s = planetById('sun');
    expect(s.comingSoon).toBeFalsy();
    expect(s.finale).toBe(true);
    expect(s.suit).toBe(null);
    expect(s.heart).toBe('sun');
    expect(s.ores).toEqual(['sunstone', 'flare', 'plasma', 'nova']);
    expect(s.camp).toBe(SUN_CAMP);
  });

  it('has six layers of forty rows', () => {
    expect(Object.keys(layersOf('sun'))).toEqual(['corona', 'sunspots', 'plasmasea', 'radiance', 'fusion', 'suncore']);
    expect(mineRows('sun')).toBe(242);
    expect(layerOfRow(130, 'sun')).toBe('radiance');
    expect(planetOfLayer('fusion')).toBe('sun');
    for (const id of Object.keys(SUN_LAYERS)) expect(LAYER_COLORS[id]).toBeTypeOf('number');
  });

  it('the Sun Rocket opens the Sun', () => {
    const st = { plots: ['rocket'], suit: [], bases: { moon: { plots: [null, null, null, 'marsrocket'] }, mars: { plots: [null, null, null, 'saturnrocket'] }, saturn: { plots: [null, null, null, 'dinorocket'] }, dino: { plots: [null, null, null, 'sunrocket'] }, sun: { plots: [null, null, null, null] } } };
    const status = Object.fromEntries(starMapStops(st, 'dino').map((x) => [x.id, x.status]));
    expect(status).toEqual({ earth: 'open', moon: 'open', mars: 'open', saturn: 'open', dino: 'here', sun: 'open', rainbow: 'locked' });
  });
});

describe('Sun ores and tools', () => {
  it('four Sun ores join the list', () => {
    expect(ORES.slice(24)).toEqual(['sunstone', 'flare', 'plasma', 'nova']);
    expect(dropOf(B.SUNSTONE)).toBe('sunstone');
    expect(dropOf(B.FLARE)).toBe('flare');
    expect(dropOf(B.PLASMA)).toBe('plasma');
    expect(dropOf(B.NOVA)).toBe('nova');
  });

  it('each deeper Sun rock needs the next drill', () => {
    const tiers = (id) => Array.from({ length: 21 }, (_, p) => mineTime(id, p) !== Infinity);
    const from = (n) => Array.from({ length: 21 }, (_, p) => p >= n);
    expect(tiers(B.CORONA_ROCK)).toEqual(from(17));
    expect(tiers(B.SUNSPOT_ROCK)).toEqual(from(17));
    expect(tiers(B.PLASMA_ROCK)).toEqual(from(18));
    expect(tiers(B.RADIANT_ROCK)).toEqual(from(19));
    expect(tiers(B.FUSION_ROCK)).toEqual(from(19));
    expect(tiers(B.SUN_CORE)).toEqual(from(20));
    expect(isSolid(B.FIRE_FLOWER)).toBe(false);
    expect(isSolid(B.FORGE)).toBe(false);
    expect(isSolid(B.SUN_HEART)).toBe(true);
  });

  it('a tenth backpack and lantern level, and drills 18-20', () => {
    expect(BACKPACK[9]).toBe(750);
    expect(LANTERN[9]).toBe(21);
    expect(UPGRADES.pick.slice(17)).toEqual([{ sunstone: 45, flare: 35 }, { plasma: 40, sunstone: 40 }, { nova: 45, plasma: 40 }]);
    expect(UPGRADES.pack[8]).toEqual({ sunstone: 45, flare: 45 });
    expect(UPGRADES.lantern[8]).toEqual({ plasma: 30, sunstone: 25 });
  });
});

describe('Sun creatures, trips and treasure', () => {
  it('each Sun layer has its own creature', () => {
    const at = (layer) => creatureFor(SUN_LAYERS[layer].top + 5, 'sun');
    expect(at('corona')).toEqual({ species: 'fairy', walker: false });
    expect(at('sunspots')).toEqual({ species: 'shadow', walker: true });
    expect(at('plasmasea')).toEqual({ species: 'plasmajelly', walker: false });
    expect(at('radiance')).toEqual({ species: 'sunbunny', walker: true });
    expect(at('fusion')).toEqual({ species: 'sparky', walker: false });
    expect(at('suncore')).toEqual({ species: 'sparky', walker: false });
  });

  it('every Sun layer gets a banner and a badge, after the Dino ones', () => {
    expect(BADGE_LAYERS.slice(24)).toEqual(['corona', 'sunspots', 'plasmasea', 'radiance', 'fusion', 'suncore']);
    expect(discovery(100, [], 'sun')).toBe('plasmasea');
  });

  it('Sun chests hold their layer’s ore', () => {
    const rng = createRng(3);
    expect(new Set(chestLoot(10, rng, 'sun'))).toEqual(new Set(['sunstone']));
    expect(new Set(chestLoot(60, rng, 'sun'))).toEqual(new Set(['flare']));
    expect(new Set(chestLoot(100, rng, 'sun'))).toEqual(new Set(['plasma']));
    expect(new Set(chestLoot(140, rng, 'sun'))).toEqual(new Set(['nova']));
  });

  it('fire flowers pop out flare gems; the Solar Forge hammers out nova and plasma', () => {
    const f = fireFlowerLoot(createRng(1));
    expect(f.filter((o) => o === 'flare').length).toBeGreaterThanOrEqual(6);
    expect(f.filter((o) => o === 'sunstone').length).toBe(2);
    const g = forgeLoot(createRng(1));
    expect(g.filter((o) => o === 'nova').length).toBeGreaterThanOrEqual(6);
    expect(g.filter((o) => o === 'plasma').length).toBe(3);
  });

  it('the Sun’s Heart counts its own cells', () => {
    expect(HEARTS.sun.block).toBe(B.SUN_HEART);
    expect(HEARTS.sun.sticker).toBe('find-sunheart');
    expect(heartLeft({ get: () => B.SUN_HEART }, { x: 0, y: 0, kind: 'sun' })).toBe(9);
  });
});

describe('Solar Station', () => {
  it('has four buildings; the Hall of Heroes needs the Sun’s Heart', () => {
    expect(SUN_BLUEPRINTS.map((b) => b.id)).toEqual(['sunflowers', 'sundial', 'sunbeam', 'hall', 'rainbowrocket']);
    expect(blueprintsFor('sun')).toBe(SUN_BLUEPRINTS);
    const hall = SUN_BLUEPRINTS.find((b) => b.id === 'hall');
    expect(blueprintOk(rich(), hall)).toBe(false);
    expect(buildOnPlot(rich(), 3, 'hall', 'sun')).toBe(null);
    const won = winSunHeart(rich());
    expect(blueprintOk(won, hall)).toBe(true);
    expect(plotsOf(buildOnPlot(won, 3, 'hall', 'sun'), 'sun')[3]).toBe('hall');
  });

  it('the Sun’s Heart: a crown for everyone, once', () => {
    const s = winSunHeart(winSunHeart({ ...defaultState(), suit: ['helmet', 'boots', 'gloves', 'jetpack'] }));
    expect(s.sunHeart).toBe(true);
    expect(s.suit).toEqual(['helmet', 'boots', 'gloves', 'jetpack', 'crown']);
  });

  it('the Sunflower Garden makes 3 sunstone a trip; the Sundial shows chests; the Sunbeam Lift is the elevator', () => {
    expect(campGift(withSun(['sunflowers', null, null, null]), 'sun').ores).toEqual(['sunstone', 'sunstone', 'sunstone']);
    expect(revealsChests(withSun([null, 'sundial', null, null]), 'sun')).toBe(true);
    const s = withSun([null, null, 'sunbeam', null], { records: { ...defaultState().records, layers: ['corona', 'sunspots'] } });
    expect(elevatorStops(s, 'sun').map((x) => x.open)).toEqual([true, true, false, false, false, false]);
  });

  it('on the Sun the goal is a Sun thing, and it knows where Sun ores are', () => {
    const s = { ...defaultState(), upgrades: { pick: 17, pack: 8, lantern: 8 }, suit: ['helmet', 'boots', 'gloves', 'jetpack'] };
    for (const ore of Object.keys(nextGoal(s, 'sun').cost)) expect(['sunstone', 'flare', 'plasma', 'nova']).toContain(ore);
    expect(oreTopRow('nova', 'sun')).toBe(SUN_LAYERS.radiance.top);
  });
});

describe('solar flares and the Baby Sun Dragon', () => {
  it('flares cycle like storms, on their own timings', () => {
    const rng = createRng(5);
    const s = createStorm(rng, FLARE);
    const evs = [];
    for (let t = 0; t < 120; t += 0.1) for (const ev of stepStorm(s, 0.1, rng, FLARE)) evs.push({ ev, t });
    expect(evs.slice(0, 3).map((e) => e.ev)).toEqual(['warn', 'start', 'end']);
    expect(evs[0].t).toBeGreaterThanOrEqual(FLARE.first[0] - 0.2);
    expect(evs[0].t).toBeLessThanOrEqual(FLARE.first[1] + 0.2);
    expect(evs[2].t - evs[1].t).toBeCloseTo(FLARE.blow, 0);
  });

  it('the Baby Sun Dragon is a flying pet that lights up the mine', () => {
    expect(SUN_KINDS).toEqual(['sundragon']);
    expect(PET_KINDS).toContain('sundragon');
    expect(WALKING_PETS).not.toContain('sundragon');
    expect(hatch(defaultState(), 'sundragon').state.pets).toEqual(['sundragon']);
    const s = { ...defaultState(), upgrades: { pick: 0, pack: 0, lantern: 3 } };
    expect(lanternRadius({ ...s, pets: ['sundragon'] })).toBe(lanternRadius(s) + PERKS.dragonLight);
  });
});
