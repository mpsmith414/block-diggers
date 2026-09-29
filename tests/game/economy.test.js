import { describe, it, expect } from 'vitest';
import {
  BLUEPRINTS, UPGRADES, canAfford, spend, nextUpgrade, buyUpgrade, buildOnPlot, depositPacks, PLOTS,
} from '../../src/game/economy.js';
import { CAMP } from '../../src/tuning.js';
import { defaultState } from '../../src/save/save.js';

const bank = (o = {}) => ({ coal: 0, iron: 0, gold: 0, diamond: 0, emerald: 0, ...o });
const withBank = (o) => ({ ...defaultState(), bank: bank(o) });

describe('costs match the spec', () => {
  it('upgrades', () => {
    expect(UPGRADES.pick.slice(0, 2)).toEqual([{ iron: 10, coal: 5 }, { diamond: 5, gold: 10 }]);
    expect(UPGRADES.pack.slice(0, 2)).toEqual([{ coal: 15, iron: 5 }, { iron: 10, gold: 5 }]);
    expect(UPGRADES.lantern.slice(0, 2)).toEqual([{ coal: 10, iron: 5 }, { gold: 5, diamond: 2 }]);
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
      dinopark: { amber: 20, gold: 10 },
      workshop: { brick: 30, gold: 10 },
      rocket: { brick: 40, star: 20, heart: 1 },
    });
    expect(PLOTS).toBe(9);
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
    expect(nextUpgrade(s, 'pick')).toEqual({ level: 3, cost: { amber: 10, diamond: 5 } });
    const maxed = { ...s, upgrades: { ...s.upgrades, pick: 17 } };
    expect(nextUpgrade(maxed, 'pick')).toBeNull();
    expect(buyUpgrade(maxed, 'pick')).toBeNull();
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
    expect(s.bank).toEqual(bank({ coal: 6, gold: 1, diamond: 1, amber: 0, brick: 0, star: 0, heart: 0, cheese: 0, moonstone: 0, spacegem: 0, gizmo: 0, ruby: 0, bolt: 0, opal: 0, coin: 0, frost: 0, icecream: 0, pearl: 0, comet: 0, jade: 0, bone: 0, tooth: 0, obsidian: 0 }));
  });
  it('a Heart of the World carried home goes into the bank too', () => {
    const s = depositPacks({ ...defaultState(), bank: { ...defaultState().bank, heart: 1 } }, [{}], { hearts: 1 });
    expect(s.bank.heart).toBe(2);
    expect(depositPacks(defaultState(), [{}]).bank.heart).toBe(0);
  });
  it('moon cheese is an ore now: it rides home in the backpack', () => {
    expect(depositPacks(defaultState(), [{ cheese: 3 }]).bank.cheese).toBe(3);
  });
});

describe('the deeper world buildings', () => {
  it('nine plots, the new three past the meadow', () => {
    expect(PLOTS).toBe(9);
    expect(CAMP.plots).toHaveLength(9);
    expect(CAMP.plots.slice(6)).toEqual([86, 93, 100]);
    expect(CAMP.w).toBe(108);
  });
  it('Dino Park, Toy Workshop and the Rocket Ship cost what the spec says', () => {
    const cost = Object.fromEntries(BLUEPRINTS.map((b) => [b.id, b.cost]));
    expect(cost.dinopark).toEqual({ amber: 20, gold: 10 });
    expect(cost.workshop).toEqual({ brick: 30, gold: 10 });
    expect(cost.rocket).toEqual({ brick: 40, star: 20, heart: 1 });
  });
  it('the rocket needs the Heart of the World', () => {
    const s = { ...defaultState(), bank: { ...defaultState().bank, brick: 40, star: 20 } };
    expect(buildOnPlot(s, 6, 'rocket')).toBeNull();
    const built = buildOnPlot({ ...s, bank: { ...s.bank, heart: 1 } }, 6, 'rocket');
    expect(built.plots[6]).toBe('rocket');
    expect(built.bank.heart).toBe(0);
  });
});
