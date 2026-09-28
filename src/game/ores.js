// Which ores to show in the HUD: the five you always know about, plus each
// deeper ore once you've found it (so panels grow as you discover things).

import { ORES } from '../world/blocks.js';
import { planetById } from './planets.js';

export const BASE_ORES = ORES.slice(0, 5);

// On another planet, only that planet's ores (once found).
export function shownOres(state, planet = 'earth') {
  const found = (o) => (state.stickers ?? {})[`ore-${o}`];
  if (planet !== 'earth') return (planetById(planet)?.ores ?? []).filter(found);
  return ORES.slice(0, 8).filter((o, i) => i < 5 || found(o));
}
