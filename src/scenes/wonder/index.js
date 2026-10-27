// Each Wonder planet's module (see WonderScene for what a module gives back).

import { createSpooky } from './spooky.js';
import { createRobot } from './robot.js';
import { createOcean } from './ocean.js';

export const WONDER_MODULES = {
  spooky: createSpooky,
  robot: createRobot,
  ocean: createOcean,
};
