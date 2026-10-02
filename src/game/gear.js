// Gear: one thing on each body part (head, back, feet, hands), bought with
// sparkles in Rainbow Village's shops. The Sun Suit pieces are gear too: you
// own them by winning them. Owning is shared; each player wears their own.
// Immutable: state in, new state out.

import { canAfford, spend } from './economy.js';

export const SLOTS = ['head', 'back', 'feet', 'hands'];
export const emptyWorn = () => ({ head: null, back: null, feet: null, hands: null });

const g = (id, slot, shop, cost, power, caption, won) => ({ id, slot, shop, cost: cost ? { sparkle: cost } : null, power, caption, ...(won ? { won } : {}) });

// (captions are for a grown-up to read: capital pixel letters)
export const GEAR = [
  // the Hat Shop
  g('helmet', 'head', 'hatshop', 0, 'light', 'A BIGGER LIGHT IN THE DARK', 'helmet'),
  g('goggles', 'head', 'hatshop', 1000, 'xray', 'SEE TREASURE CHESTS THROUGH ROCK'),
  g('partyhat', 'head', 'hatshop', 200, 'confetti', 'CONFETTI EVERY TIME YOU JUMP'),
  g('wizardhat', 'head', 'hatshop', 300, 'trail', 'LEAVES A TRAIL OF SPARKLES'),
  g('crown', 'head', 'hatshop', 0, null, 'JUST FOR SHOW. VERY ROYAL', 'crown'),
  g('piratehat', 'head', 'hatshop', 150, null, 'JUST FOR LOOKS. ARRR!'),
  g('cowboyhat', 'head', 'hatshop', 150, null, 'JUST FOR LOOKS. YEEHAW!'),
  g('tophat', 'head', 'hatshop', 200, null, 'JUST FOR LOOKS. VERY FANCY'),
  g('chefhat', 'head', 'hatshop', 100, null, 'JUST FOR LOOKS'),
  g('bunnyears', 'head', 'hatshop', 150, null, 'JUST FOR LOOKS. HOP HOP!'),
  g('vikinghat', 'head', 'hatshop', 250, null, 'JUST FOR LOOKS'),
  g('flowercrown', 'head', 'hatshop', 100, null, 'JUST FOR LOOKS'),
  g('duckhat', 'head', 'hatshop', 250, null, 'JUST FOR LOOKS. QUACK!'),
  // the Gadget Lab: backs
  g('jetpack', 'back', 'gadgetlab', 0, 'jetpack', 'HOLD JUMP IN THE AIR TO FLY UP', 'jetpack'),
  g('glider', 'back', 'gadgetlab', 800, 'glide', 'HOLD JUMP WHILE FALLING TO FLOAT DOWN'),
  g('shell', 'back', 'gadgetlab', 600, 'shell', "CREATURES CAN'T KNOCK YOU BACK"),
  g('balloon', 'back', 'gadgetlab', 1500, 'balloon', 'HOLD JUMP TO FLOAT UP SLOWLY'),
  // the Shoe Shop
  g('boots', 'feet', 'shoeshop', 0, 'boots', "RUN FASTER. WIND CAN'T PUSH YOU", 'boots'),
  g('bouncy', 'feet', 'shoeshop', 500, 'bouncy', 'JUMP TWICE AS HIGH'),
  g('gecko', 'feet', 'shoeshop', 1500, 'gecko', 'JUMP AT A WALL AND HOLD TO CLIMB IT'),
  g('skates', 'feet', 'shoeshop', 400, 'skates', 'EVERY FLOOR IS SLIPPERY ICE. WHEE!'),
  g('clownshoes', 'feet', 'shoeshop', 200, 'squeak', 'THEY SQUEAK WITH EVERY STEP'),
  // the Gadget Lab: hands
  g('gloves', 'hands', 'gadgetlab', 0, 'gloves', 'DIG FASTER. NO SLIPPING ON ICE', 'gloves'),
  g('magnet', 'hands', 'gadgetlab', 1200, 'magnet', 'GEMS NEARBY FLY OUT OF THE ROCK TO YOU'),
  g('boxing', 'hands', 'gadgetlab', 600, 'boxing', 'CREATURES THAT BUMP YOU GO FLYING'),
  g('lucky', 'hands', 'gadgetlab', 900, 'lucky', 'TREASURE CHESTS GIVE EXTRA'),
];
const BY_ID = new Map(GEAR.map((x) => [x.id, x]));
export const gearById = (id) => BY_ID.get(id) ?? null;
export const shopItems = (shop) => GEAR.filter((x) => x.shop === shop);

const gearOf = (state) => state.gear ?? { owned: [], worn: [emptyWorn(), emptyWorn()] };

export function ownsGear(state, id) {
  const item = gearById(id);
  if (!item) return false;
  if (item.won) return (state.suit ?? []).includes(item.won);
  return gearOf(state).owned.includes(id);
}

export const ownedIn = (state, slot) => GEAR.filter((x) => x.slot === slot && ownsGear(state, x.id));

export function buyGear(state, id) {
  const item = gearById(id);
  if (!item || !item.cost || ownsGear(state, id) || !canAfford(state.bank, item.cost)) return null;
  const gear = gearOf(state);
  return { ...state, bank: spend(state.bank, item.cost), gear: { ...gear, owned: [...gear.owned, id] } };
}

export const wornBy = (state, slot) => ({ ...emptyWorn(), ...(gearOf(state).worn?.[slot] ?? {}) });

// Put `id` on player `slot`'s `part` (null takes it off). Only things you own.
export function wearGear(state, slot, part, id) {
  if (!SLOTS.includes(part)) return null;
  if (id !== null) {
    const item = gearById(id);
    if (!item || item.slot !== part || !ownsGear(state, id)) return null;
  }
  const gear = gearOf(state);
  const worn = [0, 1].map((i) => wornBy(state, i));
  worn[slot] = { ...worn[slot], [part]: id };
  return { ...state, gear: { ...gear, worn } };
}

// The powers player `slot` has right now (none inside a bonus game: `off`).
export function powersOf(state, slot, { off = false } = {}) {
  const out = new Set();
  if (off) return out;
  for (const id of Object.values(wornBy(state, slot))) {
    const item = id && gearById(id);
    if (item?.power && ownsGear(state, id)) out.add(item.power);
  }
  return out;
}
// (`slots`: the players who are here)
export const anyoneWears = (state, power, slots = [0, 1]) => slots.some((i) => powersOf(state, i).has(power));

// A piece just won (a Sun Suit piece, the crown): everyone with that slot
// free puts it on (the crown never knocks the Helmet's light off).
export function wearWon(state, id) {
  const item = gearById(id);
  if (!item || !ownsGear(state, id)) return state;
  let next = state;
  for (const slot of [0, 1]) if (!wornBy(next, slot)[item.slot]) next = wearGear(next, slot, item.slot, id) ?? next;
  return next;
}

// What an older save was wearing: the Sun Suit pieces it had.
export function wornFromSuit(suit = []) {
  const has = (p) => suit.includes(p);
  return {
    head: has('helmet') ? 'helmet' : has('crown') ? 'crown' : null,
    back: has('jetpack') ? 'jetpack' : null,
    feet: has('boots') ? 'boots' : null,
    hands: has('gloves') ? 'gloves' : null,
  };
}
