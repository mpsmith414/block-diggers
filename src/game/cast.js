// Which character each player is. The title screen picks them; a player who
// joins later (at camp) gets their character from last time if it's free,
// else the first one nobody is using. Every scene asks here so they all agree.

import { CHARACTERS } from '../art/characters.js';

// chosen: this session's picks by slot; saved: the picks kept in the save.
// Returns the full list with `slot` filled in.
export function castFor(chosen = [], saved = [], slot) {
  if (CHARACTERS.includes(chosen[slot])) return chosen;
  const taken = chosen.filter((c, i) => i !== slot && c);
  const char = [saved[slot], CHARACTERS[slot], ...CHARACTERS].find((c) => CHARACTERS.includes(c) && !taken.includes(c));
  const next = [...chosen];
  next[slot] = char;
  return next;
}

// The registry version: fills in (and remembers) the player's character.
export function charFor(registry, slot) {
  const cast = castFor(registry.get('characters') ?? [], registry.get('save')?.characters ?? [], slot);
  registry.set('characters', cast);
  return cast[slot];
}
