import { describe, it, expect } from 'vitest';
import { PLANETS, planetById, layersOf, layerOfRow, planetOfLayer, mineRows, starMapStops, rocketAt } from '../../src/game/planets.js';
import { B, ORES, dropOf, isBoulder, isSolid } from '../../src/world/blocks.js';
import { mineTime } from '../../src/world/grid.js';
import { MOON_LAYERS, MOON_H, MINE_H, LAYER_COLORS, BACKPACK, LANTERN } from '../../src/tuning.js';

describe('the planets', () => {
  it('the journey runs Earth, Moon, Mars, Saturn, Dino Planet, the Sun', () => {
    expect(PLANETS.map((p) => p.id)).toEqual(['earth', 'moon', 'mars', 'saturn', 'dino', 'sun']);
    expect(planetById('moon').suit).toBe('helmet');
    expect(planetById('earth').comingSoon).toBeFalsy();
    expect(planetById('moon').comingSoon).toBeFalsy();
    for (const id of ['dino', 'sun']) expect(planetById(id).comingSoon).toBe(true);
    expect(planetById('saturn').comingSoon).toBeFalsy();
    expect(planetById('mars').comingSoon).toBeFalsy();
    expect(planetById('sun').finale).toBe(true);
    expect(planetById('moon').gravity).toBeLessThan(1);
    expect(planetById('earth').gravity).toBe(1);
  });

  it('the Moon has five layers of fifty rows', () => {
    expect(Object.keys(layersOf('moon'))).toEqual(['craters', 'cheesecaves', 'mooncrystal', 'alienbase', 'mooncore']);
    expect(MOON_LAYERS.craters).toEqual({ top: 1, bottom: 50 });
    expect(MOON_LAYERS.mooncore).toEqual({ top: 201, bottom: 250 });
    expect(MOON_H).toBe(252);
    expect(mineRows('moon')).toBe(MOON_H);
    expect(mineRows('earth')).toBe(MINE_H);
    for (const id of Object.keys(MOON_LAYERS)) expect(LAYER_COLORS[id]).toBeTypeOf('number');
  });

  it('finds the layer of a row, on any planet', () => {
    expect(layerOfRow(75, 'moon')).toBe('cheesecaves');
    expect(layerOfRow(0, 'moon')).toBe('craters');
    expect(layerOfRow(999, 'moon')).toBe('mooncore');
    expect(layerOfRow(120)).toBe('deep');
    expect(layerOfRow(999)).toBe('core');
  });

  it('knows which planet a layer is on (layer ids are never shared)', () => {
    expect(planetOfLayer('alienbase')).toBe('moon');
    expect(planetOfLayer('dino')).toBe('earth');
    expect(planetOfLayer('nope')).toBe(null);
    const all = PLANETS.flatMap((p) => Object.keys(p.layers ?? {}));
    expect(new Set(all).size).toBe(all.length);
  });

  it('each planet lists its own ores', () => {
    expect(planetById('moon').ores).toEqual(['moonstone', 'cheese', 'spacegem', 'gizmo']);
    expect(planetById('earth').ores).toEqual(ORES.slice(0, 8));
  });
});

describe('Moon rock, ores and tools', () => {
  it('four Moon ores join the list', () => {
    expect(ORES.slice(8, 12)).toEqual(['moonstone', 'cheese', 'spacegem', 'gizmo']);
    expect(dropOf(B.MOONSTONE)).toBe('moonstone');
    expect(dropOf(B.CHEESE)).toBe('cheese');
    expect(dropOf(B.SPACE_GEM)).toBe('spacegem');
    expect(dropOf(B.SPACE_CRYSTAL)).toBe('spacegem');
    expect(dropOf(B.GIZMO)).toBe('gizmo');
  });

  it('each deeper Moon rock needs the next drill', () => {
    const tiers = (id) => [0, 1, 2, 3, 4, 5, 6, 7, 8].map((p) => mineTime(id, p) !== Infinity);
    expect(tiers(B.MOONROCK).slice(5)).toEqual([true, true, true, true]);
    expect(tiers(B.CHEESE_ROCK).slice(5)).toEqual([true, true, true, true]);
    expect(tiers(B.MOON_CRYSTAL)).toEqual([false, false, false, false, false, false, true, true, true]);
    expect(tiers(B.ALIEN_PANEL)).toEqual([false, false, false, false, false, false, false, true, true]);
    expect(tiers(B.MOON_CORE)).toEqual([false, false, false, false, false, false, false, false, true]);
    expect(mineTime(B.GIZMO, 7)).toBe(mineTime(B.ALIEN_PANEL, 7));
    // cheese is soft: quick even with the Star Drill
    expect(mineTime(B.CHEESE_ROCK, 5)).toBeLessThan(mineTime(B.MOONROCK, 5));
    // the new drills are faster on old rock too
    expect(mineTime(B.CORE, 8)).toBeLessThan(mineTime(B.CORE, 5));
  });

  it('cheese wheels are boulders; teleport pads and the UFO are walk-through', () => {
    expect(isBoulder(B.BOULDER)).toBe(true);
    expect(isBoulder(B.CHEESE_WHEEL)).toBe(true);
    expect(isBoulder(B.STONE)).toBe(false);
    expect(isSolid(B.TELEPORT)).toBe(false);
    expect(isSolid(B.UFO)).toBe(false);
    expect(isSolid(B.MOON_HEART)).toBe(true);
  });

  it('a sixth backpack and lantern level', () => {
    expect(BACKPACK[5]).toBe(320);
    expect(LANTERN[5]).toBe(13);
  });
});

describe('the star map', () => {
  const base = () => ({ plots: Array(9).fill(null), bases: { moon: { plots: [null, null, null, null] } }, suit: [] });
  const status = (stops) => Object.fromEntries(stops.map((s) => [s.id, s.status]));

  it('at first only Earth is open (you are here)', () => {
    expect(status(starMapStops(base(), 'earth'))).toEqual({ earth: 'here', moon: 'locked', mars: 'locked', saturn: 'locked', dino: 'locked', sun: 'locked' });
  });

  it('the Rocket Ship opens the Moon; the Mars Rocket opens Mars', () => {
    const s = { ...base(), plots: ['rocket', null, null, null, null, null, null, null, null] };
    expect(status(starMapStops(s, 'earth')).moon).toBe('open');
    const t = { ...s, bases: { moon: { plots: [null, null, null, 'marsrocket'] } } };
    expect(status(starMapStops(t, 'moon'))).toEqual({ earth: 'open', moon: 'here', mars: 'open', saturn: 'locked', dino: 'locked', sun: 'locked' });
  });

  it('each planet shows its suit piece, lit once you have it', () => {
    const stops = starMapStops({ ...base(), suit: ['helmet'] }, 'earth');
    expect(stops.find((x) => x.id === 'moon')).toMatchObject({ suit: 'helmet', hasSuit: true });
    expect(stops.find((x) => x.id === 'mars')).toMatchObject({ suit: 'boots', hasSuit: false });
    expect(stops.find((x) => x.id === 'earth').suit).toBe(null);
  });

  it('you can fly from Earth once the Rocket Ship is built, and always from Moon Base', () => {
    expect(rocketAt(base(), 'earth')).toBe(false);
    expect(rocketAt({ ...base(), plots: ['rocket'] }, 'earth')).toBe(true);
    expect(rocketAt(base(), 'moon')).toBe(true);
  });
});
