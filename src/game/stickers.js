// The sticker book: 101 things to find, on 12 pages. A full page earns a trophy.

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
  ]),
];

export const ALL_STICKERS = STICKER_PAGES.flatMap((p) => p.stickers);
const BY_ID = new Map(ALL_STICKERS.map((s) => [s.id, s]));
const PAGE_OF = new Map(STICKER_PAGES.flatMap((p, i) => p.stickers.map((s) => [s.id, i])));

export const stickerById = (id) => BY_ID.get(id) ?? null;

export function pageProgress(state, pageIndex) {
  const stickers = STICKER_PAGES[pageIndex].stickers;
  return { have: stickers.filter((s) => state.stickers[s.id]).length, total: stickers.length };
}

// Returns the new state, whether the sticker is new, and the page index of a
// trophy earned by completing that page (or null).
export function award(state, id) {
  if (!BY_ID.has(id) || state.stickers[id]) return { state, isNew: false, trophy: null };
  let next = { ...state, stickers: { ...state.stickers, [id]: true } };
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
