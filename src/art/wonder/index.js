// All the Wonder Galaxy's art, drawn at boot.

import { drawWonderCommon } from './common.js';
import { drawSpookyArt } from './spooky.js';
import { drawRobotArt } from './robot.js';

export function drawWonderArt(scene, canvasTexture, rect) {
  drawWonderCommon(scene, canvasTexture, rect);
  drawSpookyArt(scene, canvasTexture, rect);
  drawRobotArt(scene, canvasTexture, rect);
}
