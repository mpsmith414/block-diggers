import { describe, it, expect } from 'vitest';
import { starMapStops, layersOf, mineRows, layerOfRow, useRainbowStretch, planetById, rocketTo } from '../../src/game/planets.js';
import { blueprintsFor, blueprintOk, buildOnPlot, plotsOf, depositPacks } from '../../src/game/economy.js';
import { shownOres } from '../../src/game/ores.js';
import { creatureFor, setLayerCreatures, GAIT_OF } from '../../src/game/hazards.js';
import { defaultState, migrate, VERSION } from '../../src/save/save.js';
import { generateRainbow } from '../../src/world/rainbow.js';
import { RAINBOW, LAYER_COLORS } from '../../src/tuning.js';

const withSunHeart = () => ({ ...defaultState(), sunHeart: true, bank: { ...defaultState().bank, nova: 99, plasma: 99, sunstone: 99 } });

describe('Rainbow Planet: getting there', () => {
  it('is the 7th stop on the star map, past the Sun', () => {
    const stops = starMapStops(defaultState(), 'earth');
    expect(stops.map((s) => s.id)).toEqual(['earth', 'moon', 'mars', 'saturn', 'dino', 'sun', 'rainbow']);
    expect(stops[6].status).toBe('locked');
    expect(rocketTo('rainbow')).toEqual({ at: 'sun', id: 'rainbowrocket' });
  });

  it('the Rainbow Rocket goes on the Solar Station\'s new fifth plot, and needs the Sun\'s Heart', () => {
    const bp = blueprintsFor('sun').find((b) => b.id === 'rainbowrocket');
    expect(bp.cost).toEqual({ nova: 60, plasma: 60, sunstone: 60 });
    expect(blueprintOk(defaultState(), bp)).toBe(false);
    expect(blueprintOk(withSunHeart(), bp)).toBe(true);
    expect(plotsOf(defaultState(), 'sun')).toHaveLength(5);
    const built = buildOnPlot(withSunHeart(), 4, 'rainbowrocket', 'sun');
    expect(plotsOf(built, 'sun')[4]).toBe('rainbowrocket');
    expect(built.bank.nova).toBe(39);
    expect(starMapStops(built, 'sun')[6].status).toBe('open');
  });

  it('an older save with four Sun plots gets the fifth (empty)', () => {
    const old = { ...defaultState(), version: 10, bases: { ...defaultState().bases, sun: { plots: ['sunflowers', 'sundial', 'sunbeam', 'hall'] } } };
    delete old.rainbow;
    const s = migrate(old);
    expect(s.version).toBe(VERSION);
    expect(s.bases.sun.plots).toEqual(['sunflowers', 'sundial', 'sunbeam', 'hall', null]);
    expect(s.rainbow).toEqual({ deepest: 0 });
    expect(s.bank.sparkle).toBe(0);
  });

  it('the planet: normal gravity, no suit piece, no Heart, and its money is sparkles', () => {
    const p = planetById('rainbow');
    expect(p.gravity).toBe(1);
    expect(p.suit).toBe(null);
    expect(p.endless).toBe(true);
    expect(shownOres(defaultState(), 'rainbow')).toEqual(['sparkle']);
  });
});

describe('Rainbow Planet: sparkles', () => {
  it('go into the bank when you get home, without touching the ores', () => {
    const s = depositPacks(defaultState(), [{ sparkle: 40, coal: 0 }, { sparkle: 2 }]);
    expect(s.bank.sparkle).toBe(42);
    expect(s.bank.coal).toBe(0);
  });
});

describe('Rainbow Planet: a trip\'s stretch of layers', () => {
  it('becomes the planet\'s layers for the trip (for the depth strip, the trip card and creatures)', () => {
    const w = generateRainbow(RAINBOW.seed, 400);
    useRainbowStretch(w.layers, w.rows);
    const layers = layersOf('rainbow');
    expect(Object.keys(layers)[0]).toBe('r14');
    expect(layers.r14).toEqual({ top: 0, bottom: w.layers[0].bottom });
    expect(mineRows('rainbow')).toBe(w.rows);
    expect(layerOfRow(5, 'rainbow')).toBe('r14');
    expect(LAYER_COLORS.r14).toBeTypeOf('number');
  });

  it('each layer has its own creatures, in its own colours', () => {
    const w = generateRainbow(RAINBOW.seed, 0);
    useRainbowStretch(w.layers, w.rows);
    setLayerCreatures(Object.fromEntries(w.layers.map((l) => [`r${l.n}`, l.look.creatures])));
    const c = creatureFor(10, 'rainbow');
    expect(['rblob', 'rflier']).toContain(c.species);
    expect(c.walker).toBe(c.species === 'rblob');
    expect(c.look.color).toBeTypeOf('number');
    expect(GAIT_OF.rblob).toBe('hop');
    expect(GAIT_OF.rflier).toBe('drift');
  });
});
