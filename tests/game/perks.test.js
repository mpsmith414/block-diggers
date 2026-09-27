import { describe, it, expect } from 'vitest';
import {
  packCap, luck, revealsChests, cartStartRow, growGarden, harvestGarden, leavePenGift, collectPenGift, PEN_GIFTS,
  elevatorStops, dinoParkGift,
} from '../../src/game/perks.js';
import { defaultState } from '../../src/save/save.js';
import { createRng } from '../../src/world/rng.js';
import { BACKPACK, PERKS } from '../../src/tuning.js';

const withPlots = (...ids) => {
  const s = defaultState();
  return { ...s, plots: [...ids, ...Array(9 - ids.length).fill(null)] };
};

describe('perks', () => {
  it('house adds backpack space', () => {
    expect(packCap(defaultState())).toBe(BACKPACK[0]);
    expect(packCap(withPlots('house'))).toBe(BACKPACK[0] + PERKS.houseBonus);
  });
  it('statue doubles luck, tower reveals chests, minecart gives a start row', () => {
    expect(luck(defaultState())).toBe(1);
    expect(luck(withPlots('statue'))).toBe(2);
    expect(revealsChests(defaultState())).toBe(false);
    expect(revealsChests(withPlots('tower'))).toBe(true);
    expect(cartStartRow(defaultState())).toBeNull();
    expect(cartStartRow(withPlots('minecart'))).toBe(PERKS.cartRow);
  });
});

describe('garden', () => {
  it('grows 3 a trip up to 12, only if built', () => {
    expect(growGarden(defaultState()).garden.stock).toBe(0);
    let s = withPlots('garden');
    for (let i = 0; i < 6; i++) s = growGarden(s);
    expect(s.garden.stock).toBe(12);
  });
  it('harvest empties it into the bank, favouring the ore you have least of', () => {
    const rng = createRng(4);
    let tally = { coal: 0, iron: 0, gold: 0 };
    for (let i = 0; i < 20; i++) {
      let s = { ...withPlots('garden'), bank: { coal: 50, iron: 50, gold: 0, diamond: 0, emerald: 0 }, garden: { stock: 12 } };
      const r = harvestGarden(s, rng);
      expect(r.ores).toHaveLength(12);
      expect(r.state.garden.stock).toBe(0);
      const added = Object.values(r.state.bank).reduce((a, b) => a + b, 0) - 100;
      expect(added).toBe(12);
      r.ores.forEach((o) => { tally[o]++; });
    }
    expect(tally.gold).toBeGreaterThan(tally.coal);
    expect(tally.gold).toBeGreaterThan(tally.iron);
  });
});

describe('pen', () => {
  it('leaves one gift a trip, up to 3', () => {
    let s = withPlots('pen');
    for (let i = 0; i < 5; i++) s = leavePenGift(s);
    expect(s.pen.gifts).toBe(3);
    expect(leavePenGift(defaultState()).pen.gifts).toBe(0);
  });
  it('collecting a gift gives one of the bundles into the bank', () => {
    const rng = createRng(9);
    const s = { ...withPlots('pen'), pen: { gifts: 2 } };
    const r = collectPenGift(s, rng);
    expect(r.state.pen.gifts).toBe(1);
    const bundle = Object.fromEntries(Object.entries(r.state.bank).filter(([, n]) => n > 0));
    expect(PEN_GIFTS).toContainEqual(bundle);
    expect(collectPenGift({ ...s, pen: { gifts: 0 } }, rng).ores).toEqual([]);
  });
});

describe('the elevator', () => {
  it('no minecart, no elevator', () => {
    expect(elevatorStops(defaultState())).toEqual([]);
  });
  it('the minecart goes to the top of every layer you have reached', () => {
    const s = { ...withPlots('minecart'), records: { ...defaultState().records, layers: ['dirt', 'stone', 'deep', 'crystal', 'dino'] } };
    const stops = elevatorStops(s);
    expect(stops.map((t) => t.layer)).toEqual(['dirt', 'stone', 'deep', 'crystal', 'dino', 'brick', 'meteor', 'core']);
    expect(stops[0]).toEqual({ layer: 'dirt', row: null, open: true });
    expect(stops[1]).toEqual({ layer: 'stone', row: 42, open: true });
    expect(stops[4]).toEqual({ layer: 'dino', row: 190, open: true });
    expect(stops[5].open).toBe(false);
  });
  it('the top layer is always open, even on a brand-new save', () => {
    expect(elevatorStops(withPlots('minecart'))[0].open).toBe(true);
  });
});

describe('the dino park', () => {
  it('the baby dinosaurs dig up 2 amber every trip home', () => {
    const r = dinoParkGift(withPlots('dinopark'));
    expect(r.ores).toEqual(['amber', 'amber']);
    expect(r.state.bank.amber).toBe(2);
  });
  it('no park, no present', () => {
    const r = dinoParkGift(defaultState());
    expect(r.ores).toEqual([]);
    expect(r.state).toEqual(defaultState());
  });
});
