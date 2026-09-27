// Which ores to show in the HUD: the five you always know about, plus each
// deeper ore once you've found it (so panels grow as you discover things).

import { ORES } from '../world/blocks.js';

export const BASE_ORES = ORES.slice(0, 5);

export const shownOres = (state) => ORES.filter((o, i) => i < 5 || (state.stickers ?? {})[`ore-${o}`]);
