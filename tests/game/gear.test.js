import { describe, it, expect } from 'vitest';
import {
  GEAR, SLOTS, gearById, shopItems, ownsGear, buyGear, wearGear, wornBy, powersOf, anyoneWears, wearWon, ownedIn,
} from '../../src/game/gear.js';
import { defaultState } from '../../src/save/save.js';

const rich = (sparkle = 5000) => ({ ...defaultState(), bank: { ...defaultState().bank, sparkle } });

describe('the gear catalogue', () => {
  it('every item has a slot, a shop and a caption; bought ones cost 100-1500, won ones nothing', () => {
    for (const item of GEAR) {
      expect(SLOTS).toContain(item.slot);
      expect(['hatshop', 'shoeshop', 'gadgetlab']).toContain(item.shop);
      expect(item.caption).toMatch(/^[A-Z .,'!]+$/);
      if (item.won) expect(item.cost).toBeNull();
      else expect(item.cost.sparkle).toBeGreaterThanOrEqual(100);
      if (!item.won) expect(item.cost.sparkle).toBeLessThanOrEqual(1500);
    }
    expect(new Set(GEAR.map((x) => x.id)).size).toBe(GEAR.length);
  });
  it('the shops sell their slots', () => {
    expect(shopItems('hatshop').every((x) => x.slot === 'head')).toBe(true);
    expect(shopItems('shoeshop').every((x) => x.slot === 'feet')).toBe(true);
    expect(shopItems('gadgetlab').every((x) => x.slot === 'back' || x.slot === 'hands')).toBe(true);
    expect(shopItems('hatshop').length).toBe(13);
  });
  it('the Sun Suit pieces and the crown are gear you win', () => {
    for (const id of ['helmet', 'boots', 'gloves', 'jetpack', 'crown']) expect(gearById(id).won).toBe(id);
    expect(gearById('cloudshoes')).toBeNull();
  });
});

describe('owning and buying', () => {
  it('won pieces are owned through the suit', () => {
    const s = { ...defaultState(), suit: ['helmet', 'jetpack'] };
    expect(ownsGear(s, 'helmet')).toBe(true);
    expect(ownsGear(s, 'boots')).toBe(false);
    expect(ownedIn(s, 'back').map((x) => x.id)).toEqual(['jetpack']);
  });
  it('buying spends sparkles once', () => {
    const s = buyGear(rich(1000), 'glider');
    expect(s.bank.sparkle).toBe(200);
    expect(ownsGear(s, 'glider')).toBe(true);
    expect(buyGear(s, 'glider')).toBeNull(); // already yours
    expect(buyGear(rich(100), 'glider')).toBeNull(); // too dear
    expect(buyGear(rich(), 'jetpack')).toBeNull(); // won, not sold
    expect(buyGear(rich(), 'nope')).toBeNull();
  });
});

describe('wearing', () => {
  it('only things you own, in their own slot; null takes it off; each player their own', () => {
    let s = buyGear(rich(), 'bouncy');
    expect(wearGear(s, 0, 'feet', 'skates')).toBeNull(); // not owned
    expect(wearGear(s, 0, 'head', 'bouncy')).toBeNull(); // wrong slot
    s = wearGear(s, 0, 'feet', 'bouncy');
    expect(wornBy(s, 0).feet).toBe('bouncy');
    expect(wornBy(s, 1).feet).toBeNull();
    s = wearGear(s, 0, 'feet', null);
    expect(wornBy(s, 0).feet).toBeNull();
  });
  it('powers come from what that player wears, and switch off in bonus games', () => {
    let s = buyGear(buyGear(rich(), 'glider'), 'partyhat');
    s = wearGear(wearGear(s, 0, 'back', 'glider'), 1, 'head', 'partyhat');
    expect([...powersOf(s, 0)]).toEqual(['glide']);
    expect([...powersOf(s, 1)]).toEqual(['confetti']);
    expect(powersOf(s, 0, { off: true }).size).toBe(0);
    expect(anyoneWears(s, 'confetti')).toBe(true);
    expect(anyoneWears(s, 'light')).toBe(false);
  });
  it('a piece just won goes on both players', () => {
    let s = buyGear(rich(), 'glider');
    s = wearGear(s, 0, 'back', 'glider');
    s = wearWon({ ...s, suit: ['jetpack'] }, 'jetpack');
    expect(wornBy(s, 0).back).toBe('jetpack');
    expect(wornBy(s, 1).back).toBe('jetpack');
    expect(wearWon(defaultState(), 'jetpack')).toEqual(defaultState()); // not owned: nothing
  });
});
