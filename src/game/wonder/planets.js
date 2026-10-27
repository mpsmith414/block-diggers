// The Wonder Galaxy: eight planets on the star map's second page, each its
// own way to play (not another mine). They're all open from any rocket.
// Each has one thing to collect (or a height to climb, or a race to win)
// and a prize at the end.
//
// goal.kind: 'count' fills a counter to `need`, 'height' climbs to the top,
// 'race' is won by finishing first.

export const WONDER = [
  { id: 'spooky', goal: { kind: 'count', need: 40, icon: 'wonder-candy' }, prize: 'pumpkin', fun: 'ghost' },
  { id: 'robot', goal: { kind: 'count', need: 12, icon: 'wonder-bot' }, prize: 'megabot', fun: 'stomp' },
  { id: 'ocean', goal: { kind: 'count', need: 20, icon: 'wonder-pearl' }, prize: 'submarine', fun: 'turtle' },
  { id: 'upside', goal: { kind: 'count', need: 30, icon: 'wonder-star' }, prize: 'topsy', fun: 'flips' },
  { id: 'jelly', goal: { kind: 'height', need: 1, icon: 'wonder-bean' }, prize: 'jellycrown', fun: 'superbounce' },
  { id: 'race', goal: { kind: 'race', need: 1, icon: 'wonder-coin' }, prize: 'cup', fun: 'loop' },
  { id: 'dragon', goal: { kind: 'count', need: 30, icon: 'wonder-balloon' }, prize: 'dragonegg', fun: 'ring' },
  { id: 'tiny', goal: { kind: 'count', need: 25, icon: 'wonder-seed' }, prize: 'acorn', fun: 'cat' },
];

const BY_ID = new Map(WONDER.map((w) => [w.id, w]));

export const isWonder = (id) => BY_ID.has(id);
export const wonderById = (id) => BY_ID.get(id) ?? null;

// The save's Wonder record (older saves have none).
export function wonderOf(state) {
  const w = state?.wonder ?? {};
  return {
    visited: Array.isArray(w.visited) ? w.visited : [],
    prizes: Array.isArray(w.prizes) ? w.prizes : [],
  };
}

const add = (list, id) => (list.includes(id) ? list : [...list, id]);

// Landing on a Wonder planet. Returns the new state, and whether it was the first visit.
export function markVisited(state, id) {
  const w = wonderOf(state);
  if (!isWonder(id) || w.visited.includes(id)) return { state, first: false };
  return { state: { ...state, wonder: { ...w, visited: add(w.visited, id) } }, first: true };
}

// Winning a planet's prize. Returns the new state, and whether it was the first time.
export function winPrize(state, id) {
  const w = wonderOf(state);
  if (!isWonder(id) || w.prizes.includes(id)) return { state, first: false };
  return { state: { ...state, wonder: { ...w, prizes: add(w.prizes, id) } }, first: true };
}

export const hasPrize = (state, id) => wonderOf(state).prizes.includes(id);

// The sticker ids for a planet: its visit, its prize and its fun moment.
export const stickerIds = (id) => {
  const w = wonderById(id);
  return { visit: `wonder-${id}`, prize: `wprize-${w.prize}`, fun: `wfun-${w.fun}` };
};

// The Wonder Galaxy's page of the star map: every planet open (the one
// you're on is "here"), with its prize lit once won.
export function wonderStops(state, here) {
  const w = wonderOf(state);
  return WONDER.map((p) => ({ id: p.id, status: p.id === here ? 'here' : 'open', prize: p.prize, hasPrize: w.prizes.includes(p.id) }));
}
