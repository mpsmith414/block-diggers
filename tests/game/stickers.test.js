import { describe, it, expect } from 'vitest';
import { STICKER_PAGES, ALL_STICKERS, award, pageProgress, stickerById } from '../../src/game/stickers.js';
import { defaultState } from '../../src/save/save.js';

describe('sticker catalog', () => {
  it('has 229 unique stickers over 23 pages (none over the 12 a page holds), each with an icon', () => {
    expect(STICKER_PAGES).toHaveLength(23);
    expect(ALL_STICKERS).toHaveLength(229);
    expect(new Set(ALL_STICKERS.map((s) => s.id)).size).toBe(229);
    for (const p of STICKER_PAGES) expect(p.stickers.length).toBeLessThanOrEqual(12);
    for (const s of ALL_STICKERS) expect(typeof s.icon).toBe('string');
    expect(stickerById('ore-coal').icon).toBe('ore-coal');
  });
});

describe('award', () => {
  it('new stickers are new once', () => {
    let r = award(defaultState(), 'ore-coal');
    expect(r.isNew).toBe(true);
    expect(r.state.stickers['ore-coal']).toBe(true);
    r = award(r.state, 'ore-coal');
    expect(r.isNew).toBe(false);
  });
  it('ignores unknown ids', () => {
    const s = defaultState();
    const r = award(s, 'nope');
    expect(r.isNew).toBe(false);
    expect(r.state).toBe(s);
  });
  it('completing a page gives its trophy once, into decoration stock', () => {
    let s = defaultState();
    let trophy = null;
    for (const st of STICKER_PAGES[0].stickers) ({ state: s, trophy } = award(s, st.id));
    expect(trophy).toBe(0);
    expect(s.trophiesAwarded).toEqual([0]);
    expect(s.decor.stock['trophy-0']).toBe(1);
    expect(pageProgress(s, 0)).toEqual({ have: 5, total: 5 });
    // awarding again doesn't give another
    ({ state: s, trophy } = award(s, STICKER_PAGES[0].stickers[0].id));
    expect(trophy).toBeNull();
    expect(s.decor.stock['trophy-0']).toBe(1);
  });
  it('page progress counts what you have', () => {
    const { state } = award(defaultState(), 'cave-grass');
    expect(pageProgress(state, 2)).toEqual({ have: 1, total: 11 });
  });
});

describe('the Silly page', () => {
  it('has the duck, sock, whoopee cushion, sneeze, dizzy, pet trick and giggle', () => {
    expect(STICKER_PAGES[9].stickers.map((s) => s.id)).toEqual([
      'silly-duck', 'silly-sock', 'silly-whoopee', 'silly-sneeze', 'silly-dizzy', 'silly-trick', 'silly-giggle',
    ]);
  });
});

describe('the Moon stickers', () => {
  it('Space has 12, Moon Base 12, and Journey starts with the Moon’s 7', () => {
    const byName = Object.fromEntries(STICKER_PAGES.map((p) => [p.name, p.stickers.map((st) => st.id)]));
    expect(byName.space).toHaveLength(12);
    expect(byName.space).toContain('ore-cheese'); // cheese is an ore now: its sticker shows it in the HUD
    expect(byName.moonbase).toEqual(expect.arrayContaining(['bld-marsrocket', 'suit-helmet', 'pet-moonpup', 'find-moonheart']));
    expect(byName.journey.slice(0, 7)).toEqual(['badge-craters', 'badge-cheesecaves', 'badge-mooncrystal', 'badge-alienbase', 'badge-mooncore', 'trip-moonbase', 'trip-starmap']);
  });
});

describe('the Mars stickers', () => {
  it('Mars has 12, Mars Base 12, and Journey grows to 12 with the Mars badges', () => {
    const byName = Object.fromEntries(STICKER_PAGES.map((p) => [p.name, p.stickers.map((st) => st.id)]));
    expect(byName.mars).toHaveLength(12);
    expect(byName.mars).toEqual(expect.arrayContaining(['ore-ruby', 'ore-bolt', 'ore-opal', 'ore-coin', 'creature-dustbunny', 'creature-crab', 'creature-newt', 'creature-martian', 'creature-ember', 'find-rover', 'find-geyser', 'find-vault']));
    expect(byName.marsbase).toHaveLength(12);
    expect(byName.marsbase).toEqual(expect.arrayContaining(['bld-robotfactory', 'bld-weather', 'bld-garage', 'bld-saturnrocket', 'find-marsheart', 'suit-boots', 'pet-rover', 'mars-storm', 'trip-marsbase']));
    expect(byName.journey.slice(7)).toEqual(['badge-dunes', 'badge-rovers', 'badge-volcano', 'badge-ruins', 'badge-marscore']);
  });
});

describe('the Saturn stickers', () => {
  it('Saturn has 12, Ring Station 12, and Journey 2 the Saturn badges', () => {
    const byName = Object.fromEntries(STICKER_PAGES.map((p) => [p.name, p.stickers.map((st) => st.id)]));
    expect(byName.saturn).toHaveLength(12);
    expect(byName.saturn).toEqual(expect.arrayContaining(['ore-frost', 'ore-icecream', 'ore-pearl', 'ore-comet', 'creature-penguin', 'creature-scoop', 'creature-owl', 'creature-cometling', 'creature-snowflake', 'find-snowman', 'find-snowglobe', 'find-frozencomet']));
    expect(byName.ringstation).toHaveLength(12);
    expect(byName.ringstation).toEqual(expect.arrayContaining(['bld-parlour', 'bld-lighthouse', 'bld-skilift', 'bld-dinorocket', 'find-saturnheart', 'suit-gloves', 'pet-yeti', 'saturn-slide', 'trip-saturnbase']));
    expect(byName.journey2.slice(0, 6)).toEqual(['badge-rings', 'badge-icecream', 'badge-aurora', 'badge-comets', 'badge-saturncore', 'saturn-aurora']);
  });
});

describe('the Dino Planet stickers', () => {
  it('Dino Planet has 12, Dino Camp 12, and Journey 2 fills up with the Dino badges', () => {
    const byName = Object.fromEntries(STICKER_PAGES.map((p) => [p.name, p.stickers.map((st) => st.id)]));
    expect(byName.dinoplanet).toHaveLength(12);
    expect(byName.dinoplanet).toEqual(expect.arrayContaining(['ore-jade', 'ore-bone', 'ore-tooth', 'ore-obsidian', 'creature-dragonfly', 'creature-raptor', 'creature-frog', 'creature-beetle', 'creature-moth', 'find-parasaur', 'find-nest', 'find-rexskull']));
    expect(byName.dinocamp).toHaveLength(12);
    expect(byName.dinocamp).toEqual(expect.arrayContaining(['bld-nursery', 'bld-treehouse', 'bld-pteroperch', 'bld-sunrocket', 'find-dinoheart', 'suit-jetpack', 'pet-longneck', 'find-stego', 'dino-ride', 'trip-dinobase']));
    expect(byName.journey2.slice(6)).toEqual(['badge-jungle', 'badge-bonebeds', 'badge-swamp', 'badge-lavalands', 'badge-dinocore', 'dino-jetfly']);
  });
});

describe('the Sun stickers', () => {
  it('the Sun has 12, Solar Station 12, and Journey 3 the Sun badges and the whole suit', () => {
    const byName = Object.fromEntries(STICKER_PAGES.map((p) => [p.name, p.stickers.map((st) => st.id)]));
    expect(byName.sun).toHaveLength(12);
    expect(byName.sun).toEqual(expect.arrayContaining(['ore-sunstone', 'ore-flare', 'ore-plasma', 'ore-nova', 'creature-fairy', 'creature-shadow', 'creature-plasmajelly', 'creature-sunbunny', 'creature-sparky', 'find-fireflower', 'find-forge', 'sun-flare']));
    expect(byName.solarstation).toHaveLength(12);
    expect(byName.solarstation).toEqual(expect.arrayContaining(['bld-sunflowers', 'bld-sundial', 'bld-sunbeam', 'bld-hall', 'find-sunheart', 'pet-sundragon', 'sun-finale', 'sun-crown', 'sun-minisun', 'trip-sunbase']));
    expect(byName.journey3).toEqual(['badge-corona', 'badge-sunspots', 'badge-plasmasea', 'badge-radiance', 'badge-fusion', 'badge-suncore', 'sun-fullsuit']);
  });
});
