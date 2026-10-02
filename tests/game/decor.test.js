import { describe, it, expect } from 'vitest';
import { DECOR_ITEMS, buyDecor, takeFromStock, canPlace, placeDecor, pickUpDecor, decorById, TROPHY_COUNT, decorUnlocked } from '../../src/game/decor.js';
import { STICKER_PAGES } from '../../src/game/stickers.js';
import { defaultState } from '../../src/save/save.js';
import { TILE, CAMP } from '../../src/tuning.js';

const rich = () => ({ ...defaultState(), bank: { coal: 50, iron: 50, gold: 50, diamond: 50, emerald: 50 } });

describe('decoration shop', () => {
  it('has the spec prices', () => {
    const costs = Object.fromEntries(DECOR_ITEMS.filter((d) => d.cost && !d.needs).map((d) => [d.id, d.cost]));
    expect(costs).toEqual({
      lamp: { coal: 3, iron: 1 },
      fence: { coal: 3 },
      flowerbed: { coal: 4 },
      bench: { iron: 3 },
      pumpkin: { gold: 2 },
      mailbox: { iron: 2 },
      pond: { iron: 5 },
      windmill: { iron: 6, gold: 3 },
      crystallamp: { diamond: 2 },
    });
    for (let i = 0; i < 6; i++) expect(decorById(`trophy-${i}`).cost).toBeNull();
  });
  it('buying spends ore and adds one to stock; trophies and unaffordable items fail', () => {
    const s = buyDecor(rich(), 'lamp');
    expect(s.bank.coal).toBe(47);
    expect(s.decor.stock.lamp).toBe(1);
    expect(buyDecor(rich(), 'trophy-0')).toBeNull();
    expect(buyDecor(defaultState(), 'windmill')).toBeNull();
  });
  it('taking from stock', () => {
    const s = buyDecor(rich(), 'fence');
    const t = takeFromStock(s, 'fence');
    expect(t.decor.stock.fence).toBe(0);
    expect(takeFromStock(t, 'fence')).toBeNull();
  });
});

describe('placing', () => {
  const meadow = 70 * TILE;
  it('allowed in the open meadow and in front of built buildings', () => {
    expect(canPlace(defaultState(), 'fence', meadow)).toBe(true);
    const built = { ...defaultState(), plots: ['house', null, null, null, null, null] };
    expect(canPlace(built, 'fence', CAMP.plots[0] * TILE + 40)).toBe(true);
  });
  it('not on the shaft, bench, lectern, stall, nest, fire, or an empty plot', () => {
    const s = defaultState();
    for (const cell of [CAMP.shaftX, CAMP.benchX, CAMP.lecternX, CAMP.stallX, CAMP.fireX, CAMP.fireX + 2]) {
      expect(canPlace(s, 'fence', cell * TILE + 8)).toBe(false);
    }
    expect(canPlace(s, 'fence', CAMP.plots[1] * TILE + 40)).toBe(false);
    expect(canPlace(s, 'fence', -5)).toBe(false);
    expect(canPlace(s, 'fence', CAMP.w * TILE + 5)).toBe(false);
  });
  it('needs a little gap from other decorations; picking one up returns it to stock', () => {
    let s = placeDecor(defaultState(), 'fence', meadow);
    expect(s.decor.placed).toEqual([{ id: 'fence', x: meadow }]);
    expect(canPlace(s, 'lamp', meadow + 4)).toBe(false);
    expect(canPlace(s, 'lamp', meadow + 40)).toBe(true);
    expect(placeDecor(s, 'lamp', meadow + 4)).toBeNull();
    s = pickUpDecor(s, 0);
    expect(s.decor.placed).toEqual([]);
    expect(s.decor.stock.fence).toBe(1);
  });
});

describe('brick decorations', () => {
  it('the Toy Workshop unlocks the brick castle, car, rainbow arch and robot', () => {
    const bricks = DECOR_ITEMS.filter((d) => d.needs === 'workshop').map((d) => d.id);
    expect(bricks).toEqual(['brickcastle', 'brickcar', 'rainbowarch', 'brickrobot']);
    const s = { ...defaultState(), bank: { ...defaultState().bank, brick: 50 } };
    expect(decorUnlocked(s, 'brickcar')).toBe(false);
    expect(buyDecor(s, 'brickcar')).toBeNull();
    const withShop = { ...s, plots: ['workshop', ...s.plots.slice(1)] };
    expect(decorUnlocked(withShop, 'brickcar')).toBe(true);
    expect(buyDecor(withShop, 'brickcar').decor.stock.brickcar).toBe(1);
    expect(decorUnlocked(s, 'lamp')).toBe(true);
  });
  it('a trophy for every sticker page', () => {
    for (let i = 0; i < STICKER_PAGES.length; i++) expect(decorById(`trophy-${i}`)).toBeTruthy();
    expect(TROPHY_COUNT).toBe(STICKER_PAGES.length);
  });
});

describe('Rainbow Village decorations', async () => {
  const { RAINBOW_DECOR, decorOf, blockedRanges } = await import('../../src/game/decor.js');
  const { RAINBOW_CAMP } = await import('../../src/tuning.js');
  const sparkly = (n = 2000) => ({ ...defaultState(), bank: { ...defaultState().bank, sparkle: n } });
  it('twelve of them, bought with sparkles, into the village bag', () => {
    expect(RAINBOW_DECOR.length).toBe(12);
    const s = buyDecor(sparkly(), 'fountain', 'rainbow');
    expect(s.bank.sparkle).toBe(1600);
    expect(decorOf(s, 'rainbow').stock.fountain).toBe(1);
    expect(s.decor).toEqual(defaultState().decor); // Earth's bag untouched
    expect(buyDecor(sparkly(), 'fountain')).toBeNull(); // not at the Earth stall
    expect(buyDecor(sparkly(), 'lamp', 'rainbow')).toBeNull(); // nor Earth's at the workshop
    expect(buyDecor(sparkly(10), 'fountain', 'rainbow')).toBeNull();
  });
  it('placed only in the village, clear of the lift, the pad and empty plots', () => {
    const s = buyDecor(sparkly(), 'gumdrop', 'rainbow');
    const open = (RAINBOW_CAMP.plots[3] + RAINBOW_CAMP.plotW + 2) * TILE;
    expect(canPlace(s, 'gumdrop', open, 'rainbow')).toBe(true);
    expect(canPlace(s, 'gumdrop', open)).toBe(false); // not at Earth camp
    for (const cell of [RAINBOW_CAMP.shaftX, RAINBOW_CAMP.padX, RAINBOW_CAMP.benchX, 1]) {
      expect(canPlace(s, 'gumdrop', cell * TILE + 8, 'rainbow')).toBe(false);
    }
    expect(canPlace(s, 'gumdrop', RAINBOW_CAMP.plots[0] * TILE + 40, 'rainbow')).toBe(false);
    const built = { ...s, bases: { ...s.bases, rainbow: { ...s.bases.rainbow, plots: ['hatshop', null, null, null] } } };
    expect(blockedRanges(built, 'rainbow').length).toBe(blockedRanges(s, 'rainbow').length - 1);
    let t = placeDecor(takeFromStock(s, 'gumdrop', 'rainbow'), 'gumdrop', open, 'rainbow');
    expect(decorOf(t, 'rainbow').placed).toEqual([{ id: 'gumdrop', x: open }]);
    expect(decorOf(t, 'rainbow').stock.gumdrop).toBe(0);
    t = pickUpDecor(t, 0, 'rainbow');
    expect(decorOf(t, 'rainbow')).toEqual({ stock: { gumdrop: 1 }, placed: [] });
  });
});
