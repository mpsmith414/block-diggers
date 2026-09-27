import { describe, it, expect } from 'vitest';
import {
  BLUEPRINTS, UPGRADES, canAfford, spend, nextUpgrade, buyUpgrade, buildOnPlot, depositPacks, PLOTS,
} from '../../src/game/economy.js';
import { defaultState } from '../../src/save/save.js';

const bank = (o = {}) => ({ coal: 0, iron: 0, gold: 0, diamond: 0, emerald: 0, ...o });
const withBank = (o) => ({ ...defaultState(), bank: bank(o) });

describe('costs match the spec', () => {
  it('upgrades', () => {
    expect(UPGRADES.pick).toEqual([{ iron: 10, coal: 5 }, { diamond: 5, gold: 10 }]);
    expect(UPGRADES.pack).toEqual([{ coal: 15, iron: 5 }, { iron: 10, gold: 5 }]);
    expect(UPGRADES.lantern).toEqual([{ coal: 10, iron: 5 }, { gold: 5, diamond: 2 }]);
  });
  it('blueprints', () => {
    const costs = Object.fromEntries(BLUEPRINTS.map((b) => [b.id, b.cost]));
    expect(costs).toEqual({
      garden: { coal: 15 },
      house: { coal: 10, iron: 5 },
      pen: { iron: 10, gold: 5 },
      tower: { iron: 20, gold: 5 },
      minecart: { iron: 10, gold: 10 },
      statue: { diamond: 5, emerald: 5 },
    });
    expect(PLOTS).toBe(6);
  });
});

describe('affording and spending', () => {
  it('exact amount is affordable; one short is not', () => {
    expect(canAfford(bank({ coal: 15 }), { coal: 15 })).toBe(true);
    expect(canAfford(bank({ coal: 14 }), { coal: 15 })).toBe(false);
  });
  it('spend subtracts and does not mutate', () => {
    const b = bank({ coal: 20, iron: 5 });
    expect(spend(b, { coal: 10, iron: 5 })).toEqual(bank({ coal: 10 }));
    expect(b.coal).toBe(20);
    expect(() => spend(b, { gold: 1 })).toThrow();
  });
});

describe('upgrades', () => {
  it('next upgrade, buying, and the level cap', () => {
    let s = withBank({ iron: 30, coal: 20, diamond: 10, gold: 20 });
    expect(nextUpgrade(s, 'pick')).toEqual({ level: 1, cost: { iron: 10, coal: 5 } });
    s = buyUpgrade(s, 'pick');
    expect(s.upgrades.pick).toBe(1);
    expect(s.bank.iron).toBe(20);
    s = buyUpgrade(s, 'pick');
    expect(s.upgrades.pick).toBe(2);
    expect(nextUpgrade(s, 'pick')).toBeNull();
    expect(buyUpgrade(s, 'pick')).toBeNull();
  });
  it('can not buy without the ores', () => {
    expect(buyUpgrade(withBank({}), 'lantern')).toBeNull();
  });
});

describe('building', () => {
  it('builds on an empty plot and spends; the plot is then taken', () => {
    let s = withBank({ coal: 30 });
    s = buildOnPlot(s, 2, 'garden');
    expect(s.plots[2]).toBe('garden');
    expect(s.bank.coal).toBe(15);
    expect(buildOnPlot(s, 2, 'garden')).toBeNull();
    expect(buildOnPlot(s, 3, 'nope')).toBeNull();
    expect(buildOnPlot(s, 3, 'statue')).toBeNull();
  });
});

describe('depositPacks', () => {
  it('adds every pack into the bank', () => {
    const s = depositPacks(withBank({ coal: 1 }), [{ coal: 2, gold: 1 }, { coal: 3, diamond: 1 }]);
    expect(s.bank).toEqual(bank({ coal: 6, gold: 1, diamond: 1 }));
  });
});
