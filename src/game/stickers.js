// The sticker book: 221 things to find, on 22 pages. A full page earns a trophy.

import { B } from '../world/blocks.js';

const page = (name, icon, stickers) => ({ name, icon, stickers: stickers.map(([id, tex, frame = 0]) => ({ id, icon: tex, frame })) });

export const STICKER_PAGES = [
  page('ores', 'ore-diamond', [
    ['ore-coal', 'ore-coal'], ['ore-iron', 'ore-iron'], ['ore-gold', 'ore-gold'],
    ['ore-diamond', 'ore-diamond'], ['ore-emerald', 'ore-emerald'],
  ]),
  page('creatures', 'slime', [
    ['creature-slime', 'slime'], ['creature-goldslime', 'slime-gold'], ['creature-bat', 'bat'],
    ['pet-mole', 'pet-mole'], ['pet-glowbug', 'pet-glowbug'], ['pet-batbuddy', 'pet-batbuddy'],
  ]),
  page('cave', 'decor-glowshroom', [
    ['cave-grass', 'decor-grass'], ['cave-flower', 'decor-flower'], ['cave-roots', 'decor-roots'],
    ['cave-mushroom', 'decor-mushroom'], ['cave-pebbles', 'decor-pebbles'], ['cave-glowshroom', 'decor-glowshroom'],
    ['cave-crystal', 'decor-crystal'], ['cave-stalactite', 'decor-stalactite'], ['cave-giantshroom', 'decor-giantshroom'],
    ['cave-moss', 'decor-moss'], ['cave-amethyst', 'decor-amethyst'],
  ]),
  page('treasures', 'find-bigchest', [
    ['find-geode', 'find-geode'], ['find-fossil-shell', 'find-fossil', 0], ['find-fossil-bone', 'find-fossil', 1],
    ['find-fossil-dino', 'find-fossil', 2], ['find-boom', 'tiles', B.BOOM], ['find-bigchest', 'find-bigchest'],
    ['find-boulder', 'tiles', B.BOULDER], ['find-egg', 'egg', 0], ['find-goldegg', 'egg', 3],
  ]),
  page('camp', 'icon-hammer', [
    ['bld-garden', 'bld-garden'], ['bld-house', 'bld-house'], ['bld-pen', 'bld-pen'],
    ['bld-tower', 'bld-tower'], ['bld-minecart', 'bld-minecart'], ['bld-statue', 'bld-statue'],
    ['bld-dinopark', 'bld-dinopark'], ['bld-workshop', 'bld-workshop'], ['bld-rocket', 'bld-rocket'],
  ]),
  page('friends', 'friend-bear', [
    ['friend-bear', 'friend-bear'], ['friend-rabbit', 'friend-rabbit'], ['friend-owl', 'friend-owl'],
  ]),
  page('deep', 'ore-star', [
    ['ore-amber', 'ore-amber'], ['ore-brick', 'ore-brick'], ['ore-star', 'ore-star'],
    ['creature-ptero', 'ptero'], ['creature-robot', 'toyrobot'], ['creature-alien', 'alien'],
    ['creature-wisp', 'wisp'], ['find-skeleton', 'skeleton-icon'], ['find-meteorite', 'find-meteorite'],
    ['find-heart', 'heart-gem'], ['find-spring', 'tiles', B.SPRING],
  ]),
  page('adventures', 'adv-lavamonster', [
    ['pet-rex', 'pet-rex'], ['pet-trike', 'pet-trike'], ['find-dinoegg', 'egg-dino'],
    ['adv-lavamonster', 'adv-lavamonster'], ['adv-drink', 'adv-drink'],
    ['badge-dino', 'badge', 0], ['badge-brick', 'badge', 1], ['badge-meteor', 'badge', 2], ['badge-core', 'badge', 3],
  ]),
  page('space', 'icon-rocket', [
    ['moon-rock', 'tiles', B.MOONROCK], ['moon-crystal', 'decor-spacecrystal'], ['moon-blob', 'moonblob'],
    ['ore-cheese', 'ore-cheese'], ['moon-flag', 'moon-flag'], ['moon-earthrise', 'earth'],
    ['ore-moonstone', 'ore-moonstone'], ['ore-spacegem', 'ore-spacegem'], ['ore-gizmo', 'ore-gizmo'],
    ['creature-mouse', 'mouse'], ['creature-jelly', 'jelly'], ['creature-drone', 'drone'],
  ]),
  page('silly', 'duck', [
    ['silly-duck', 'duck'], ['silly-sock', 'sock'], ['silly-whoopee', 'cushion'], ['silly-sneeze', 'achoo'],
    ['silly-dizzy', 'dizzy-star'], ['silly-trick', 'heart'], ['silly-giggle', 'note'],
  ]),
  page('moonbase', 'bld-marsrocket', [
    ['bld-cheesefactory', 'bld-cheesefactory'], ['bld-telescope', 'bld-telescope'], ['bld-hangar', 'bld-hangar'],
    ['bld-marsrocket', 'bld-marsrocket'], ['creature-sprite', 'starsprite'], ['find-cheesewheel', 'tiles', B.CHEESE_WHEEL],
    ['find-chime', 'chime-icon'], ['find-teleport', 'tiles', B.TELEPORT], ['find-ufo', 'ufo'],
    ['find-moonheart', 'moonheart-gem'], ['suit-helmet', 'suit-helmet'], ['pet-moonpup', 'pet-moonpup'],
  ]),
  page('journey', 'icon-starmap', [
    ['badge-craters', 'badge', 4], ['badge-cheesecaves', 'badge', 5], ['badge-mooncrystal', 'badge', 6],
    ['badge-alienbase', 'badge', 7], ['badge-mooncore', 'badge', 8],
    ['trip-moonbase', 'icon-moonbase'], ['trip-starmap', 'icon-starmap'],
    ['badge-dunes', 'badge', 9], ['badge-rovers', 'badge', 10], ['badge-volcano', 'badge', 11],
    ['badge-ruins', 'badge', 12], ['badge-marscore', 'badge', 13],
  ]),
  page('mars', 'planet-mars', [
    ['ore-ruby', 'ore-ruby'], ['ore-bolt', 'ore-bolt'], ['ore-opal', 'ore-opal'], ['ore-coin', 'ore-coin'],
    ['creature-dustbunny', 'dustbunny'], ['creature-crab', 'crab'], ['creature-newt', 'newt'],
    ['creature-martian', 'martian'], ['creature-ember', 'ember'],
    ['find-rover', 'oldrover'], ['find-geyser', 'tiles', B.GEYSER], ['find-vault', 'tiles', B.GLYPH],
  ]),
  page('marsbase', 'bld-saturnrocket', [
    ['bld-robotfactory', 'bld-robotfactory'], ['bld-weather', 'bld-weather'], ['bld-garage', 'bld-garage'],
    ['bld-saturnrocket', 'bld-saturnrocket'], ['find-marsheart', 'marsheart-gem'], ['suit-boots', 'suit-boots'],
    ['pet-rover', 'pet-rover'], ['mars-storm', 'icon-windsock'], ['mars-flag', 'mars-flag'],
    ['mars-moons', 'mars-moons'], ['mars-windsock', 'mars-windsock'], ['trip-marsbase', 'icon-marsbase'],
  ]),
  page('saturn', 'planet-saturn', [
    ['ore-frost', 'ore-frost'], ['ore-icecream', 'ore-icecream'], ['ore-pearl', 'ore-pearl'], ['ore-comet', 'ore-comet'],
    ['creature-penguin', 'penguin'], ['creature-scoop', 'scoop'], ['creature-owl', 'owl'],
    ['creature-cometling', 'cometling'], ['creature-snowflake', 'snowflake'],
    ['find-snowman', 'snowman'], ['find-snowglobe', 'snowglobe'], ['find-frozencomet', 'frozencomet'],
  ]),
  page('ringstation', 'bld-dinorocket', [
    ['bld-parlour', 'bld-parlour'], ['bld-lighthouse', 'bld-lighthouse'], ['bld-skilift', 'bld-skilift'],
    ['bld-dinorocket', 'bld-dinorocket'], ['find-saturnheart', 'saturnheart-gem'], ['suit-gloves', 'suit-gloves'],
    ['pet-yeti', 'pet-yeti'], ['saturn-slide', 'icon-slide'], ['saturn-flag', 'saturn-flag'],
    ['saturn-rings', 'planet-saturn'], ['find-snowball', 'tiles', B.SNOWBALL], ['trip-saturnbase', 'icon-ringstation'],
  ]),
  page('journey2', 'icon-starmap', [
    ['badge-rings', 'badge', 14], ['badge-icecream', 'badge', 15], ['badge-aurora', 'badge', 16],
    ['badge-comets', 'badge', 17], ['badge-saturncore', 'badge', 18], ['saturn-aurora', 'decor-auroracrystal'],
    ['badge-jungle', 'badge', 19], ['badge-bonebeds', 'badge', 20], ['badge-swamp', 'badge', 21],
    ['badge-lavalands', 'badge', 22], ['badge-dinocore', 'badge', 23], ['dino-jetfly', 'icon-jetfly'],
  ]),
  page('dinoplanet', 'planet-dino', [
    ['ore-jade', 'ore-jade'], ['ore-bone', 'ore-bone'], ['ore-tooth', 'ore-tooth'], ['ore-obsidian', 'ore-obsidian'],
    ['creature-dragonfly', 'dragonfly'], ['creature-raptor', 'raptor'], ['creature-frog', 'frog'],
    ['creature-beetle', 'beetle'], ['creature-moth', 'moth'],
    ['find-parasaur', 'parasaur'], ['find-nest', 'dinonest'], ['find-rexskull', 'rexskull'],
  ]),
  page('dinocamp', 'bld-sunrocket', [
    ['bld-nursery', 'bld-nursery'], ['bld-treehouse', 'bld-treehouse'], ['bld-pteroperch', 'bld-pteroperch'],
    ['bld-sunrocket', 'bld-sunrocket'], ['find-dinoheart', 'dinoheart-gem'], ['suit-jetpack', 'suit-jetpack'],
    ['pet-longneck', 'pet-longneck'], ['find-stego', 'stego'], ['dino-ride', 'icon-ride'],
    ['dino-flag', 'dino-flag'], ['dino-volcano', 'dino-volcano'], ['trip-dinobase', 'icon-dinobase'],
  ]),
  page('sun', 'planet-sun', [
    ['ore-sunstone', 'ore-sunstone'], ['ore-flare', 'ore-flare'], ['ore-plasma', 'ore-plasma'], ['ore-nova', 'ore-nova'],
    ['creature-fairy', 'fairy'], ['creature-shadow', 'shadow'], ['creature-plasmajelly', 'plasmajelly'],
    ['creature-sunbunny', 'sunbunny'], ['creature-sparky', 'sparky'],
    ['find-fireflower', 'fireflower'], ['find-forge', 'forge'], ['sun-flare', 'icon-flare'],
  ]),
  page('solarstation', 'bld-hall', [
    ['bld-sunflowers', 'bld-sunflowers'], ['bld-sundial', 'bld-sundial'], ['bld-sunbeam', 'bld-sunbeam'],
    ['bld-hall', 'bld-hall'], ['find-sunheart', 'sunheart-gem'], ['pet-sundragon', 'pet-sundragon'],
    ['sun-finale', 'trophy-big'], ['sun-crown', 'crown-icon'], ['sun-minisun', 'mini-sun'],
    ['sun-flag', 'sun-flag'], ['sun-goldmonster', 'icon-goldmonster'], ['trip-sunbase', 'icon-sunbase'],
  ]),
  page('journey3', 'icon-starmap', [
    ['badge-corona', 'badge', 24], ['badge-sunspots', 'badge', 25], ['badge-plasmasea', 'badge', 26],
    ['badge-radiance', 'badge', 27], ['badge-fusion', 'badge', 28], ['badge-suncore', 'badge', 29],
    ['sun-fullsuit', 'icon-fullsuit'],
  ]),
  // the Moon Skate Park: the park, your board, and every trick
  page('skatepark', 'skateboard', [
    ['skate-park', 'icon-skatepark'], ['skate-board', 'skateboard'],
    ['trick-kickflip', 'trick-kickflip'], ['trick-spin360', 'trick-spin360'], ['trick-superman', 'trick-superman'],
    ['trick-grab', 'trick-grab'], ['trick-handstand', 'trick-handstand'], ['trick-backflip', 'trick-backflip'],
  ]),
  // the bonus games at the bottom of the planets
  page('bonus', 'icon-claw', [
    ['claw-machine', 'icon-claw'], ['claw-robot', 'toyrobot', 0], ['claw-martian', 'martian', 0], ['claw-golden', 'claw-golden'],
    ['whack-fair', 'icon-whack'], ['whack-mole', 'whack-mole', 1], ['whack-golden', 'whack-golden'], ['whack-star', 'whack-star'],
    ['hockey-rink', 'icon-rink'], ['hockey-goal', 'hockey-ball'], ['hockey-save', 'penguin', 0], ['hockey-five', 'hockey-five'],
  ]),
  // more bonus games
  page('bonus2', 'icon-eggcatch', [
    ['egg-grove', 'icon-eggcatch'], ['egg-catch', 'catch-egg', 0], ['egg-golden', 'egg-golden-icon'], ['egg-rotten', 'egg-rotten-icon'], ['egg-star', 'egg-star'],
    ['fw-deck', 'icon-fwdeck'], ['fw-pop', 'fw-balloon', 0], ['fw-golden', 'fw-balloon', 4], ['fw-chain', 'fw-chain'], ['fw-star', 'fw-star'],
  ]),
  // the Build Yard
  page('build', 'icon-yard', [
    ['build-yard', 'icon-yard'], ['build-first', 'tiles', B.BRICKS], ['build-tower', 'build-tower'], ['build-rainbow', 'build-rainbow'], ['build-100', 'build-100'],
  ]),
];

export const ALL_STICKERS = STICKER_PAGES.flatMap((p) => p.stickers);
const PAGE_OF = new Map(STICKER_PAGES.flatMap((p, i) => p.stickers.map((s) => [s.id, i])));

// The book's chapters: one tab per planet (and one for the fun extras), each
// holding its pages. Page numbers never change (trophies are kept by page).
export const CHAPTERS = [
  { id: 'earth', icon: 'earth', pages: [0, 1, 2, 3, 4, 5, 6, 7, 9] },
  { id: 'moon', icon: 'planet-moon', pages: [8, 10, 11] },
  { id: 'mars', icon: 'planet-mars', pages: [12, 13] },
  { id: 'saturn', icon: 'planet-saturn', pages: [14, 15, 16] },
  { id: 'dino', icon: 'planet-dino', pages: [17, 18] },
  { id: 'sun', icon: 'planet-sun', pages: [19, 20, 21] },
  { id: 'fun', icon: 'icon-claw', pages: [22, 23, 24, 25] },
];
// every page in book order (chapter by chapter)
export const BOOK_ORDER = CHAPTERS.flatMap((c) => c.pages);
export const chapterOfPage = (page) => CHAPTERS.findIndex((c) => c.pages.includes(page));

export function chapterProgress(state, chapterIndex) {
  let have = 0;
  let total = 0;
  for (const p of CHAPTERS[chapterIndex].pages) {
    const r = pageProgress(state, p);
    have += r.have;
    total += r.total;
  }
  return { have, total };
}

// The page the book opens on: the newest sticker's page (or the first page).
export function bookmarkPage(state) {
  const p = state.lastSticker ? PAGE_OF.get(state.lastSticker) : undefined;
  return p ?? BOOK_ORDER[0];
}

const BY_ID = new Map(ALL_STICKERS.map((s) => [s.id, s]));

export const stickerById = (id) => BY_ID.get(id) ?? null;

export function pageProgress(state, pageIndex) {
  const stickers = STICKER_PAGES[pageIndex].stickers;
  return { have: stickers.filter((s) => state.stickers[s.id]).length, total: stickers.length };
}

// Returns the new state, whether the sticker is new, and the page index of a
// trophy earned by completing that page (or null).
export function award(state, id) {
  if (!BY_ID.has(id) || state.stickers[id]) return { state, isNew: false, trophy: null };
  let next = { ...state, stickers: { ...state.stickers, [id]: true }, lastSticker: id };
  const p = PAGE_OF.get(id);
  const { have, total } = pageProgress(next, p);
  let trophy = null;
  if (have === total && !next.trophiesAwarded.includes(p)) {
    trophy = p;
    const key = `trophy-${p}`;
    next = {
      ...next,
      trophiesAwarded: [...next.trophiesAwarded, p],
      decor: { ...next.decor, stock: { ...next.decor.stock, [key]: (next.decor.stock[key] ?? 0) + 1 } },
    };
  }
  return { state: next, isNew: true, trophy };
}
