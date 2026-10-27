// All the Wonder Galaxy's art, drawn at boot.

import { drawWonderCommon } from './common.js';
import { drawSpookyArt } from './spooky.js';
import { drawRobotArt } from './robot.js';
import { drawOceanArt } from './ocean.js';
import { drawUpsideArt } from './upside.js';
import { drawJellyArt } from './jelly.js';
import { drawRaceArt } from './race.js';
import { drawDragonArt } from './dragon.js';
import { drawTinyArt } from './tiny.js';

export function drawWonderArt(scene, canvasTexture, rect) {
  drawWonderCommon(scene, canvasTexture, rect);
  drawSpookyArt(scene, canvasTexture, rect);
  drawRobotArt(scene, canvasTexture, rect);
  drawOceanArt(scene, canvasTexture, rect);
  drawUpsideArt(scene, canvasTexture, rect);
  drawJellyArt(scene, canvasTexture, rect);
  drawRaceArt(scene, canvasTexture, rect);
  drawDragonArt(scene, canvasTexture, rect);
  drawTinyArt(scene, canvasTexture, rect);
}
