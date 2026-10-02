// All pixel art, drawn in code at boot. No asset files.

import Phaser from 'phaser';
import { B, BLOCK_COUNT, ORES } from '../world/blocks.js';
import { createRng } from '../world/rng.js';
import { drawCharacters } from './characters.js';
import { drawCampArt } from './camp.js';
import { drawLogo } from './logo.js';
import { drawDecor } from './decor.js';
import { drawFindsArt } from './finds.js';
import { drawPets } from './pets.js';
import { drawFriends } from './friends.js';
import { drawDecorItems } from './decorItems.js';
import { drawAdventures } from './adventures.js';
import { drawDeep, toyBrick } from './deep.js';
import { drawDeepCamp } from './deepCamp.js';
import { drawMoonArt } from './moonArt.js';
import { drawSillyArt } from './silly.js';
import { drawMoonWorld, drawMoonTiles, drawMoonBacks, drawMoonOreIcon } from './moonWorld.js';
import { drawMoonBase } from './moonBase.js';
import { drawMarsWorld, drawMarsTiles, drawMarsBacks, drawMarsOreIcon } from './marsWorld.js';
import { drawMarsBase } from './marsBase.js';
import { drawSaturnWorld, drawSaturnTiles, drawSaturnBacks, drawSaturnOreIcon } from './saturnWorld.js';
import { drawSaturnBase } from './saturnBase.js';
import { drawDinoWorld, drawDinoTiles, drawDinoBacks, drawDinoOreIcon } from './dinoWorld.js';
import { drawDinoBase } from './dinoBase.js';
import { drawSunWorld, drawSunTiles, drawSunBacks, drawSunOreIcon } from './sunWorld.js';
import { drawSunBase } from './sunBase.js';
import { drawSkateArt } from './skate.js';
import { drawClawArt } from './claw.js';
import { drawWhackArt } from './whack.js';
import { drawHockeyArt } from './hockey.js';
import { drawEggCatchArt } from './eggcatch.js';
import { drawFireworksArt } from './fireworks.js';
import { drawBuildArt } from './build.js';
import { drawRainbowTiles, drawRainbowArt } from './rainbow.js';
import { drawRainbowShops } from './rainbowShops.js';
import { drawGearArt } from './gear.js';

const T = 16;

export const ORE_COLORS = {
  coal: ['#2a2830', '#55525e'],
  iron: ['#d9a07a', '#f5d2b8'],
  gold: ['#f5c629', '#fff2a0'],
  diamond: ['#4de3f0', '#d4fbff'],
  emerald: ['#2fcf6a', '#b8ffcf'],
  amber: ['#f0a030', '#ffe0a0'],
  brick: ['#e0403a', '#ff9a8a'],
  star: ['#ffe066', '#fffbe0'],
  moonstone: ['#9ad8ff', '#e8f8ff'],
  cheese: ['#ffd84a', '#fff0a0'],
  spacegem: ['#b070ff', '#ffc0f0'],
  gizmo: ['#6ae07a', '#e0e8f0'],
  ruby: ['#e0204a', '#ff8aa0'],
  bolt: ['#c0c8d8', '#e8ecf4'],
  opal: ['#ff8a2a', '#5ae0d0'],
  coin: ['#ffd84a', '#fff2a0'],
  frost: ['#5ae0ff', '#ffffff'],
  icecream: ['#ff8ab8', '#ffd0e4'],
  pearl: ['#ffe8f4', '#ffffff'],
  comet: ['#4a8aff', '#c8e0ff'],
  jade: ['#3ad07a', '#aaffc8'],
  bone: ['#fff8e8', '#ffffff'],
  tooth: ['#fff4d8', '#ffffff'],
  obsidian: ['#3a2a5a', '#b89aff'],
  sunstone: ['#ff7a1a', '#ffe080'],
  flare: ['#fff0a0', '#ffffff'],
  plasma: ['#ff8ac8', '#ffffff'],
  nova: ['#8ab8ff', '#ffffff'],
};

// Background (back wall) tiles live after the block tiles in the tileset.
export const BACK = {
  dirt: BLOCK_COUNT, stone: BLOCK_COUNT + 1, deep: BLOCK_COUNT + 2, crystal: BLOCK_COUNT + 3,
  dino: BLOCK_COUNT + 4, brick: BLOCK_COUNT + 5, meteor: BLOCK_COUNT + 6, core: BLOCK_COUNT + 7, moon: BLOCK_COUNT + 8,
  craters: BLOCK_COUNT + 9, cheesecaves: BLOCK_COUNT + 10, mooncrystal: BLOCK_COUNT + 11, alienbase: BLOCK_COUNT + 12, mooncore: BLOCK_COUNT + 13,
  dunes: BLOCK_COUNT + 14, rovers: BLOCK_COUNT + 15, volcano: BLOCK_COUNT + 16, ruins: BLOCK_COUNT + 17, marscore: BLOCK_COUNT + 18,
  rings: BLOCK_COUNT + 19, icecream: BLOCK_COUNT + 20, aurora: BLOCK_COUNT + 21, comets: BLOCK_COUNT + 22, saturncore: BLOCK_COUNT + 23,
  jungle: BLOCK_COUNT + 24, bonebeds: BLOCK_COUNT + 25, swamp: BLOCK_COUNT + 26, lavalands: BLOCK_COUNT + 27, dinocore: BLOCK_COUNT + 28,
  corona: BLOCK_COUNT + 29, sunspots: BLOCK_COUNT + 30, plasmasea: BLOCK_COUNT + 31, radiance: BLOCK_COUNT + 32, fusion: BLOCK_COUNT + 33, suncore: BLOCK_COUNT + 34,
};
// Rainbow Planet's tintable rock: 6 patterns x 4 variants, then each pattern's back wall
const RAINBOW_BASE = BLOCK_COUNT + 35;
export const RAINBOW_TILES = { pattern: (p, v) => RAINBOW_BASE + p * 4 + v, back: (p) => RAINBOW_BASE + 24 + p };
const TILE_FRAMES = RAINBOW_BASE + 30;

const HOSTS = {
  [B.DIRT]: { base: '#8a5a34', dark: '#6b4424', light: '#a3703f' },
  [B.STONE]: { base: '#7d7d86', dark: '#5f5f68', light: '#9a9aa3' },
  [B.DEEP]: { base: '#3f3d4f', dark: '#2d2b3a', light: '#555368' },
  [B.CRYSTAL]: { base: '#4b3f8a', dark: '#3a2f6e', light: '#8a7fe0' },
  [B.SAND]: { base: '#c0985a', dark: '#a07c46', light: '#d8b47a' },
  [B.METEOR]: { base: '#1e1c3a', dark: '#16143a', light: '#262450' },
  [B.CORE]: { base: '#5a2418', dark: '#3e160e', light: '#7a3420' },
  [B.MOONROCK]: { base: '#b8b8c8', dark: '#9898aa', light: '#dcdcea' },
};

function canvasTexture(scene, key, w, h) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h);
  return { tex, ctx: tex.getContext() };
}

const rect = (ctx, color, x, y, w = 1, h = 1) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
};

function speckle(ctx, ox, rng, pal, n = 7) {
  rect(ctx, pal.base, ox, 0, T, T);
  for (let i = 0; i < n; i++) {
    const x = rng.int(0, T - 2);
    const y = rng.int(0, T - 2);
    rect(ctx, pal.dark, ox + x, y, 2, 2);
  }
  for (let i = 0; i < 3; i++) rect(ctx, pal.light, ox + rng.int(0, T - 1), rng.int(0, T - 1));
}

function oreNuggets(ctx, ox, rng, ore) {
  const [c, hi] = ORE_COLORS[ore];
  const spots = [[3, 3], [9, 5], [5, 10], [11, 11]];
  for (const [x, y] of spots) {
    const jx = x + rng.int(-1, 1);
    const jy = y + rng.int(-1, 1);
    rect(ctx, c, ox + jx, jy, 3, 3);
    rect(ctx, hi, ox + jx, jy, 1, 1);
  }
}

// Tileset frames are padded by 1 px with their edge pixels copied outwards,
// so zoomed-in tiles never sample their neighbour.
export const TILE_MARGIN = 1;
export const TILE_SPACING = 2;

function drawTiles(scene) {
  const raw = document.createElement('canvas');
  raw.width = T * TILE_FRAMES;
  raw.height = T;
  const ctx = raw.getContext('2d');
  const rng = createRng(12345);
  const at = (id) => id * T;

  speckle(ctx, at(B.DIRT), rng, HOSTS[B.DIRT]);
  speckle(ctx, at(B.STONE), rng, HOSTS[B.STONE]);
  speckle(ctx, at(B.DEEP), rng, HOSTS[B.DEEP]);
  for (let y = 3; y < T; y += 5) rect(ctx, '#34324a', at(B.DEEP), y, T, 1); // deepslate streaks

  // grass: dirt with a green top and drips
  speckle(ctx, at(B.GRASS), rng, HOSTS[B.DIRT]);
  rect(ctx, '#5aa63c', at(B.GRASS), 0, T, 4);
  for (let x = 0; x < T - 1; x += 3) rect(ctx, '#4a922f', at(B.GRASS) + x, 4, 2, 1 + (x % 2) * 2);
  rect(ctx, '#7cc95a', at(B.GRASS), 0, T, 1);

  // bedrock: near-black with chunky light blotches
  rect(ctx, '#17141f', at(B.BEDROCK), 0, T, T);
  for (let i = 0; i < 6; i++) rect(ctx, '#3a3548', at(B.BEDROCK) + rng.int(0, 12), rng.int(0, 12), 4, 3);

  // gravel: pebbles
  rect(ctx, '#77706a', at(B.GRAVEL), 0, T, T);
  for (let i = 0; i < 14; i++) {
    const c = rng.pick(['#8f8780', '#5d5751', '#a39a91']);
    rect(ctx, c, at(B.GRAVEL) + rng.int(0, 13), rng.int(0, 13), 3, 2);
  }

  const oreOn = (id, host, ore) => {
    speckle(ctx, at(id), rng, HOSTS[host]);
    if (host === B.DEEP) for (let y = 3; y < T; y += 5) rect(ctx, '#34324a', at(id), y, T, 1);
    oreNuggets(ctx, at(id), rng, ore);
  };
  oreOn(B.COAL_DIRT, B.DIRT, 'coal');
  oreOn(B.COAL_STONE, B.STONE, 'coal');
  oreOn(B.IRON, B.STONE, 'iron');
  oreOn(B.GOLD_STONE, B.STONE, 'gold');
  oreOn(B.GOLD_DEEP, B.DEEP, 'gold');
  oreOn(B.DIAMOND, B.DEEP, 'diamond');
  oreOn(B.EMERALD, B.DEEP, 'emerald');

  // crystal rock: glossy violet with diagonal shine
  const crystalRock = (id) => {
    speckle(ctx, at(id), rng, HOSTS[B.CRYSTAL], 5);
    for (let k = 0; k < 3; k++) {
      const sx = rng.int(0, 10);
      const sy = rng.int(0, 10);
      for (let d = 0; d < 4; d++) rect(ctx, '#a89cff', at(id) + sx + d, sy + 3 - d);
    }
  };
  crystalRock(B.CRYSTAL);
  for (const [id, ore] of [[B.GOLD_CRYSTAL, 'gold'], [B.DIAMOND_CRYSTAL, 'diamond'], [B.EMERALD_CRYSTAL, 'emerald']]) {
    crystalRock(id);
    oreNuggets(ctx, at(id), rng, ore);
  }

  // water: see-through, glowing teal with a bright top line and bubbles
  rect(ctx, 'rgba(58,170,210,0.55)', at(B.WATER), 0, T, T);
  rect(ctx, 'rgba(160,240,255,0.8)', at(B.WATER), 0, T, 1);
  rect(ctx, 'rgba(255,255,255,0.6)', at(B.WATER) + 4, 6, 1, 1);
  rect(ctx, 'rgba(255,255,255,0.5)', at(B.WATER) + 11, 10, 2, 2);

  // geode: a stone block with a round crystal nest showing
  speckle(ctx, at(B.GEODE), rng, HOSTS[B.STONE]);
  rect(ctx, '#3a3548', at(B.GEODE) + 3, 3, 10, 10);
  rect(ctx, '#3a3548', at(B.GEODE) + 2, 5, 12, 6);
  rect(ctx, '#b98cff', at(B.GEODE) + 4, 5, 8, 6);
  rect(ctx, '#f0e0ff', at(B.GEODE) + 5, 6, 2, 2);
  rect(ctx, '#8a5fd0', at(B.GEODE) + 8, 8, 3, 2);

  // fossil: an old shell curl pressed into the rock
  speckle(ctx, at(B.FOSSIL), rng, HOSTS[B.DIRT]);
  const fx = at(B.FOSSIL);
  for (const [x, y] of [[5, 4], [6, 4], [7, 4], [8, 5], [9, 6], [9, 7], [9, 8], [8, 9], [7, 10], [6, 10], [5, 9], [4, 8], [4, 7], [5, 6], [6, 6], [7, 7], [6, 8]]) {
    rect(ctx, '#f0e6cf', fx + x, y, 1, 1);
  }
  rect(ctx, '#f0e6cf', fx + 10, 3, 2, 1);

  // boom block: red with a white star and a fuse on top
  const bx = at(B.BOOM);
  rect(ctx, '#7a1f1f', bx, 0, T, T);
  rect(ctx, '#d8403a', bx + 1, 2, 14, 13);
  rect(ctx, '#f0e0c0', bx + 1, 6, 14, 4);
  rect(ctx, '#d8403a', bx + 7, 6, 2, 4);
  rect(ctx, '#ffe066', bx + 6, 7, 4, 2);
  rect(ctx, '#3a2a24', bx + 7, 0, 2, 2);
  rect(ctx, '#ffb34a', bx + 8, 0, 1, 1);

  // big chest: two tiles, purple with gold trim
  for (const [id, left] of [[B.BIGCHEST, true], [B.BIGCHEST_R, false]]) {
    const cx = at(id);
    rect(ctx, '#3a1f4a', cx, 3, T, 13);
    rect(ctx, '#7a4ab0', cx + (left ? 1 : 0), 4, 15, 5);
    rect(ctx, '#7a4ab0', cx + (left ? 1 : 0), 10, 15, 5);
    rect(ctx, '#ffd84a', cx, 9, T, 1);
    rect(ctx, '#ffd84a', cx + (left ? 1 : 14), 4, 1, 11);
    if (!left) { rect(ctx, '#ffd84a', cx, 7, 2, 5); rect(ctx, '#fff2a0', cx, 8, 1, 1); }
    else { rect(ctx, '#ffd84a', cx + 14, 7, 2, 5); }
  }

  // boulder: a big round rock on an empty cell
  const ox = at(B.BOULDER);
  ctx.fillStyle = '#2a2530';
  ctx.beginPath(); ctx.arc(ox + 8, 9, 7.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a8494';
  ctx.beginPath(); ctx.arc(ox + 8, 9, 6.5, 0, Math.PI * 2); ctx.fill();
  rect(ctx, '#b0aabb', ox + 5, 5, 3, 2);
  rect(ctx, '#6a6474', ox + 9, 11, 3, 2);
  rect(ctx, '#6a6474', ox + 4, 10, 2, 1);
  // egg cells are drawn by a sprite (so each egg can have its own colour)

  // ladder: two rails and rungs on a transparent cell
  const lx = at(B.LADDER);
  rect(ctx, '#a0703c', lx + 3, 0, 2, T);
  rect(ctx, '#a0703c', lx + 11, 0, 2, T);
  for (let y = 2; y < T; y += 5) rect(ctx, '#c8904e', lx + 3, y, 10, 2);

  // lava
  rect(ctx, '#e0461f', at(B.LAVA), 0, T, T);
  rect(ctx, '#ff8a1f', at(B.LAVA), 0, T, 3);
  for (let i = 0; i < 5; i++) rect(ctx, '#ffd23f', at(B.LAVA) + rng.int(1, 13), rng.int(3, 13), 2, 2);

  // chest
  const cx = at(B.CHEST);
  rect(ctx, '#6b3f1c', cx + 1, 4, 14, 12);
  rect(ctx, '#9a5f2c', cx + 2, 5, 12, 4);
  rect(ctx, '#9a5f2c', cx + 2, 10, 12, 5);
  rect(ctx, '#f5c629', cx + 7, 8, 2, 4);
  rect(ctx, '#3d2410', cx + 1, 9, 14, 1);

  drawDeepTiles(ctx, at, rng);
  // the Moon's five layers (their own random stream, so Earth's tiles never change)
  drawMoonTiles(ctx, at, createRng(777), B, rect, speckle);
  // and Mars's (its own stream too)
  drawMarsTiles(ctx, at, createRng(888), B, rect, speckle);
  // and Saturn's
  drawSaturnTiles(ctx, at, createRng(999), B, rect, speckle);
  // and Dino Planet's
  drawDinoTiles(ctx, at, createRng(1111), B, rect, speckle);
  // and the Sun's
  drawSunTiles(ctx, at, createRng(2222), B, rect, speckle);
  // and Rainbow Planet's (with its tintable patterns)
  drawRainbowTiles(ctx, at, rect, B, RAINBOW_TILES);

  // back walls: darker, low-contrast versions of each host rock
  const back = (frame, pal) => {
    speckle(ctx, frame * T, rng, pal, 4);
  };
  back(BACK.dirt, { base: '#3b2616', dark: '#2e1d10', light: '#45301d' });
  back(BACK.stone, { base: '#34343b', dark: '#2a2a30', light: '#3d3d45' });
  back(BACK.deep, { base: '#1c1b25', dark: '#15141c', light: '#23222e' });
  back(BACK.crystal, { base: '#221a3e', dark: '#1a1432', light: '#2c2350' });
  back(BACK.dino, { base: '#4a3620', dark: '#3a2a18', light: '#56402a' });
  for (let y = 5; y < T; y += 6) rect(ctx, '#3e2e1a', BACK.dino * T, y, T, 1);
  // brick wall at the back: faint toy bricks
  rect(ctx, '#2a2036', BACK.brick * T, 0, T, T);
  for (let row = 0; row < 4; row++) {
    for (let k = -1; k < 2; k++) {
      const x = k * 8 + (row % 2) * 4;
      rect(ctx, '#342a44', BACK.brick * T + Math.max(0, x), row * 4, Math.min(7, 7 + Math.min(0, x), T - x), 3);
    }
  }
  back(BACK.meteor, { base: '#0c0a1e', dark: '#08071a', light: '#141230' });
  for (const [x, y] of [[3, 4], [11, 2], [7, 12], [13, 10]]) rect(ctx, '#5a5690', BACK.meteor * T + x, y);
  back(BACK.core, { base: '#2e120c', dark: '#220c08', light: '#3a1a10' });
  rect(ctx, '#4a1a0e', BACK.core * T + 4, 9, 5, 1);
  back(BACK.moon, { base: '#44445a', dark: '#383848', light: '#50506a' });
  drawMoonBacks(ctx, rect, back, BACK);
  drawMarsBacks(ctx, rect, back, BACK);
  drawSaturnBacks(ctx, rect, back, BACK);
  drawDinoBacks(ctx, rect, back, BACK);
  drawSunBacks(ctx, rect, back, BACK);

  const P = T + TILE_SPACING;
  const { tex, ctx: out } = canvasTexture(scene, 'tiles', TILE_MARGIN * 2 + P * TILE_FRAMES - TILE_SPACING, T + TILE_MARGIN * 2);
  for (let i = 0; i < TILE_FRAMES; i++) {
    const dx = TILE_MARGIN + i * P;
    const dy = TILE_MARGIN;
    out.drawImage(raw, i * T, 0, T, T, dx, dy, T, T);
    out.drawImage(raw, i * T, 0, T, 1, dx, dy - 1, T, 1); // top edge
    out.drawImage(raw, i * T, T - 1, T, 1, dx, dy + T, T, 1); // bottom edge
    out.drawImage(out.canvas, dx, dy - 1, 1, T + 2, dx - 1, dy - 1, 1, T + 2); // left
    out.drawImage(out.canvas, dx + T - 1, dy - 1, 1, T + 2, dx + T, dy - 1, 1, T + 2); // right
    tex.add(i, 0, dx, dy, T, T);
  }
  tex.refresh();
}

// The deeper world's rock: sand, toy bricks, space rock, the core, the Moon.
function drawDeepTiles(ctx, at, rng) {
  // sandstone with bands
  const sand = (id) => {
    speckle(ctx, at(id), rng, HOSTS[B.SAND], 6);
    rect(ctx, '#ab8650', at(id), 4, T, 1);
    rect(ctx, '#ab8650', at(id), 11, T, 1);
    rect(ctx, '#dcbc84', at(id), 5, T, 1);
  };
  sand(B.SAND);
  sand(B.AMBER);
  // amber: honey drops with a bug inside one
  for (const [x, y] of [[3, 2], [10, 7], [4, 11]]) {
    rect(ctx, '#b8701a', at(B.AMBER) + x, y, 4, 4);
    rect(ctx, '#f0a030', at(B.AMBER) + x, y, 3, 3);
    rect(ctx, '#ffe0a0', at(B.AMBER) + x, y, 1, 1);
  }
  rect(ctx, '#5a3010', at(B.AMBER) + 11, 8, 1, 1);

  // toy brick wall: offset rows of chunky bricks in soft toy colours
  // muted, so the bright red ore bricks and the caves stand out
  const BRICK_TONES = [['#7a5058', '#8e6068', '#523640'], ['#4e5a7a', '#5e6c8e', '#363e56'], ['#7a6c4a', '#8e8058', '#544a32'], ['#4e6a58', '#5e7e68', '#36483e']];
  const brickWall = (id) => {
    const ox = at(id);
    rect(ctx, '#2a2230', ox, 0, T, T);
    let n = 0;
    for (let row = 0; row < 4; row++) {
      for (let k = -1; k < 2; k++) {
        const x0 = Math.max(0, k * 8 + (row % 2) * 4);
        const x1 = Math.min(T, k * 8 + (row % 2) * 4 + 8);
        if (x1 - x0 < 2) continue;
        const [c, hi, dark] = BRICK_TONES[(row * 3 + k + 1 + n++) % 4];
        rect(ctx, dark, ox + x0, row * 4, x1 - x0 - 1, 3);
        rect(ctx, c, ox + x0, row * 4, x1 - x0 - 1, 2);
        rect(ctx, hi, ox + x0, row * 4, x1 - x0 - 1, 1);
      }
    }
  };
  brickWall(B.BRICKS);
  brickWall(B.BRICK_ORE);
  // the ore: a bright red toy brick poking out, with studs
  rect(ctx, '#3a2e3e', at(B.BRICK_ORE) + 2, 5, 12, 8);
  toyBrick(ctx, rect, at(B.BRICK_ORE) + 3, 8, 10, ['#ff3a2a', '#ffb0a0', '#8a1010']);
  rect(ctx, '#ffffff', at(B.BRICK_ORE) + 4, 8, 2, 1);

  // spring: a bouncy green pad on a coil
  {
    const ox = at(B.SPRING);
    brickWall(B.SPRING);
    rect(ctx, '#3a2e3e', ox + 1, 0, 14, 12);
    for (let k = 0; k < 4; k++) rect(ctx, '#d4dce6', ox + (k % 2 ? 4 : 6), 4 + k * 2, 6, 1);
    rect(ctx, '#8a94a8', ox + 3, 11, 10, 1);
    rect(ctx, '#2f8a3a', ox, 0, T, 4);
    rect(ctx, '#6ae07a', ox, 0, T, 3);
    rect(ctx, '#c8ffc8', ox + 1, 0, 14, 1);
  }

  // meteor field rock: dark blue with tiny stars and a crater
  const spaceRock = (id) => {
    // (the twinkling stars are added in the mine, so they don't repeat in a grid)
    speckle(ctx, at(id), rng, HOSTS[B.METEOR], 5);
    rect(ctx, '#0e0c24', at(id) + 9, 10, 4, 2);
    rect(ctx, '#3a3668', at(id) + 9, 12, 4, 1);
  };
  spaceRock(B.METEOR);
  spaceRock(B.STAR);
  // star shards: two chunky glowing stars
  for (const [x, y] of [[1, 1], [8, 8]]) {
    const ox = at(B.STAR) + x;
    rect(ctx, 'rgba(255,224,102,0.35)', ox, y + 1, 7, 5);
    rect(ctx, '#ffe066', ox + 3, y, 1, 7);
    rect(ctx, '#ffe066', ox, y + 3, 7, 1);
    rect(ctx, '#ffe066', ox + 2, y + 2, 3, 3);
    rect(ctx, '#fffbe0', ox + 3, y + 2, 1, 3);
    rect(ctx, '#fffbe0', ox + 2, y + 3, 3, 1);
  }
  // meteorite: a scorched lump with glowing star bits
  spaceRock(B.METEORITE);
  {
    const ox = at(B.METEORITE);
    rect(ctx, '#0a0816', ox + 2, 3, 12, 10);
    rect(ctx, '#0a0816', ox + 3, 2, 10, 12);
    rect(ctx, '#4a3040', ox + 3, 3, 10, 10);
    rect(ctx, '#6a4050', ox + 4, 4, 4, 2);
    for (const [x, y] of [[5, 7], [9, 5], [8, 10]]) {
      rect(ctx, '#ff8a3a', ox + x, y, 2, 2);
      rect(ctx, '#ffe066', ox + x, y, 1, 1);
    }
  }

  // the core: warm rock with glowing cracks
  const coreRock = (id) => {
    speckle(ctx, at(id), rng, HOSTS[B.CORE], 6);
    rect(ctx, '#ff6a2a', at(id) + 2, 5, 4, 1);
    rect(ctx, '#ff6a2a', at(id) + 5, 6, 1, 3);
    rect(ctx, '#ffb34a', at(id) + 5, 6, 1, 1);
    rect(ctx, '#ff6a2a', at(id) + 10, 11, 4, 1);
    rect(ctx, '#ffd23f', at(id) + 12, 11, 1, 1);
  };
  coreRock(B.CORE);
  // the Heart's cells: core rock with pink veins (the big gem is drawn over them)
  {
    const ox = at(B.HEART);
    speckle(ctx, ox, rng, HOSTS[B.CORE], 6);
    rect(ctx, '#ff5a8a', ox + 2, 4, 5, 1);
    rect(ctx, '#ff5a8a', ox + 6, 5, 1, 4);
    rect(ctx, '#ffb0c8', ox + 6, 5, 1, 1);
    rect(ctx, '#ff5a8a', ox + 9, 12, 5, 1);
    rect(ctx, '#ffb0c8', ox + 12, 12, 1, 1);
  }

  // the Moon: pale rock with craters; space crystals; moon cheese
  const moonRock = (id) => {
    speckle(ctx, at(id), rng, HOSTS[B.MOONROCK], 5);
    // one small soft crater
    rect(ctx, '#a4a4b6', at(id) + 9, 9, 3, 1);
    rect(ctx, '#a4a4b6', at(id) + 8, 10, 1, 1);
    rect(ctx, '#cacad8', at(id) + 9, 11, 3, 1);
  };
  moonRock(B.MOONROCK);
  moonRock(B.SPACE_CRYSTAL);
  oreNuggets(ctx, at(B.SPACE_CRYSTAL), rng, 'diamond');
  {
    const ox = at(B.CHEESE);
    rect(ctx, '#e0b030', ox, 0, T, T);
    rect(ctx, '#ffd84a', ox, 0, T, 15);
    rect(ctx, '#fff0a0', ox, 0, T, 1);
    for (const [x, y, r] of [[4, 5, 2], [11, 3, 1], [10, 10, 2], [3, 12, 1]]) {
      rect(ctx, '#d09a20', ox + x - r, y - r + 1, r * 2, r * 2 - 1);
      rect(ctx, '#d09a20', ox + x - r + 1, y - r, r * 2 - 2, r * 2 + 1);
    }
  }
}

function drawCracks(scene) {
  const { tex, ctx } = canvasTexture(scene, 'cracks', T * 4, T);
  const lines = [
    [[7, 7, 3, 1]],
    [[7, 7, 3, 1], [5, 4, 1, 4], [9, 8, 1, 4]],
    [[7, 7, 3, 1], [5, 4, 1, 4], [9, 8, 1, 4], [2, 10, 4, 1], [10, 3, 4, 1]],
    [[7, 7, 3, 1], [5, 4, 1, 4], [9, 8, 1, 4], [2, 10, 4, 1], [10, 3, 4, 1], [3, 2, 1, 3], [12, 12, 1, 3], [1, 6, 3, 1]],
  ];
  lines.forEach((segs, f) => {
    for (const [x, y, w, h] of segs) rect(ctx, 'rgba(0,0,0,0.75)', f * T + x, y, w, h);
    tex.add(f, 0, f * T, 0, T, T);
  });
  tex.refresh();
}

function drawOreIcons(scene) {
  const S = 10;
  for (const ore of ORES) {
    const { tex, ctx } = canvasTexture(scene, `ore-${ore}`, S, S);
    const [c, hi] = ORE_COLORS[ore];
    const shade = 'rgba(0,0,0,0.35)';
    if (drawMoonOreIcon(ctx, rect, ore) || drawMarsOreIcon(ctx, rect, ore) || drawSaturnOreIcon(ctx, rect, ore) || drawDinoOreIcon(ctx, rect, ore) || drawSunOreIcon(ctx, rect, ore)) {
      // drawn
    } else if (ore === 'amber') {
      // a honey-coloured drop with a tiny bug inside
      rect(ctx, c, 3, 1, 4, 2);
      rect(ctx, c, 2, 3, 6, 5);
      rect(ctx, c, 3, 8, 4, 1);
      rect(ctx, hi, 3, 3, 1, 2);
      rect(ctx, '#5a3010', 5, 5, 2, 1);
      rect(ctx, '#5a3010', 4, 6, 1, 1);
      rect(ctx, '#5a3010', 7, 6, 1, 1);
    } else if (ore === 'brick') {
      // a toy brick with studs on top
      rect(ctx, '#7a1a1a', 0, 3, 10, 6);
      rect(ctx, c, 1, 4, 8, 4);
      rect(ctx, '#7a1a1a', 1, 1, 3, 2);
      rect(ctx, '#7a1a1a', 6, 1, 3, 2);
      rect(ctx, c, 2, 1, 1, 2);
      rect(ctx, c, 7, 1, 1, 2);
      rect(ctx, hi, 1, 4, 8, 1);
    } else if (ore === 'star') {
      // a glowing five-point star
      rect(ctx, c, 4, 0, 2, 3);
      rect(ctx, c, 0, 3, 10, 2);
      rect(ctx, c, 2, 5, 6, 2);
      rect(ctx, c, 1, 7, 3, 2);
      rect(ctx, c, 6, 7, 3, 2);
      rect(ctx, hi, 4, 3, 2, 2);
    } else if (ore === 'diamond' || ore === 'emerald') {
      // gem
      rect(ctx, c, 3, 1, 4, 1);
      rect(ctx, c, 2, 2, 6, 2);
      rect(ctx, c, 1, 4, 8, 2);
      rect(ctx, c, 2, 6, 6, 1);
      rect(ctx, c, 3, 7, 4, 1);
      rect(ctx, c, 4, 8, 2, 1);
      rect(ctx, hi, 3, 2, 2, 2);
      rect(ctx, shade, 6, 5, 2, 2);
    } else {
      // lump
      rect(ctx, c, 2, 2, 6, 6);
      rect(ctx, c, 1, 3, 8, 4);
      rect(ctx, c, 3, 1, 4, 8);
      rect(ctx, hi, 3, 3, 2, 2);
      rect(ctx, shade, 5, 6, 3, 2);
    }
    tex.refresh();
  }
}

function drawIcons(scene) {
  // backpack "full": a bag with a red "!" badge
  {
    const { tex, ctx } = canvasTexture(scene, 'icon-full', 12, 12);
    rect(ctx, '#8a5a34', 1, 3, 8, 8);
    rect(ctx, '#6b4424', 3, 1, 4, 2);
    rect(ctx, '#a3703f', 2, 5, 6, 2);
    rect(ctx, '#e8762a', 7, 0, 5, 7); // (warm orange: red only means "not enough yet")
    rect(ctx, '#ffffff', 9, 1, 1, 3);
    rect(ctx, '#ffffff', 9, 5, 1, 1);
    tex.refresh();
  }
  // bag (for the meter)
  {
    const { tex, ctx } = canvasTexture(scene, 'icon-bag', 10, 10);
    rect(ctx, '#8a5a34', 1, 3, 8, 7);
    rect(ctx, '#6b4424', 3, 1, 4, 2);
    rect(ctx, '#a3703f', 2, 5, 6, 2);
    tex.refresh();
  }
  // white pixel for bars and flashes
  {
    const { tex, ctx } = canvasTexture(scene, 'pixel', 1, 1);
    rect(ctx, '#ffffff', 0, 0);
    tex.refresh();
  }
}

// Soft round light used to erase darkness.
function drawLight(scene) {
  const S = 64;
  const { tex, ctx } = canvasTexture(scene, 'light', S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.55, 'rgba(255,255,255,1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  tex.refresh();
}

// Slime: a jelly blob, 2 frames (sitting, squished mid-hop).
function drawSlime(scene) {
  const { tex, ctx } = canvasTexture(scene, 'slime', 32, 12);
  const body = '#7ad65a';
  const dark = '#3f8f3a';
  const OUT = '#244a22';
  const frame = (ox, squish) => {
    const top = squish ? 5 : 2;
    rect(ctx, OUT, ox + 2, top - 1, 12, 12 - top + 1);
    rect(ctx, OUT, ox + 1, top + 1, 14, 12 - top - 1);
    rect(ctx, body, ox + 2, top, 12, 11 - top);
    rect(ctx, body, ox + 1, top + 2, 14, 11 - top - 3);
    rect(ctx, dark, ox + 2, 10, 12, 1);
    rect(ctx, '#c8f7b0', ox + 4, top + 1, 3, 2);
    rect(ctx, OUT, ox + 5, top + 4, 2, 2);
    rect(ctx, OUT, ox + 9, top + 4, 2, 2);
    rect(ctx, '#ffffff', ox + 5, top + 4, 1, 1);
    rect(ctx, '#ffffff', ox + 9, top + 4, 1, 1);
    rect(ctx, '#ff8fa3', ox + 3, top + 6, 1, 1);
    rect(ctx, '#ff8fa3', ox + 12, top + 6, 1, 1);
  };
  frame(0, false);
  frame(16, true);
  tex.add(0, 0, 0, 0, 16, 12);
  tex.add(1, 0, 16, 0, 16, 12);
  tex.refresh();
}

// Bat: purple and round, 2 wing frames.
function drawBat(scene) {
  const { tex, ctx } = canvasTexture(scene, 'bat', 32, 12);
  const body = '#8a6fc9';
  const OUT = '#2e2346';
  const frame = (ox, up) => {
    // wings
    if (up) {
      rect(ctx, OUT, ox + 0, 1, 5, 4); rect(ctx, '#6a52a8', ox + 1, 2, 3, 2);
      rect(ctx, OUT, ox + 11, 1, 5, 4); rect(ctx, '#6a52a8', ox + 12, 2, 3, 2);
    } else {
      rect(ctx, OUT, ox + 0, 6, 5, 4); rect(ctx, '#6a52a8', ox + 1, 7, 3, 2);
      rect(ctx, OUT, ox + 11, 6, 5, 4); rect(ctx, '#6a52a8', ox + 12, 7, 3, 2);
    }
    rect(ctx, OUT, ox + 4, 2, 8, 9);
    rect(ctx, body, ox + 5, 3, 6, 7);
    rect(ctx, OUT, ox + 5, 1, 2, 2); rect(ctx, OUT, ox + 9, 1, 2, 2); // ears
    rect(ctx, '#ffe066', ox + 6, 5, 1, 1); rect(ctx, '#ffe066', ox + 9, 5, 1, 1);
    rect(ctx, '#ffffff', ox + 7, 8, 1, 1); rect(ctx, '#ffffff', ox + 8, 8, 1, 1);
  };
  frame(0, true);
  frame(16, false);
  tex.add(0, 0, 0, 0, 16, 12);
  tex.add(1, 0, 16, 0, 16, 12);
  tex.refresh();
}

// Soap bubble for "bubble to partner".
function drawBubble(scene) {
  const S = 28;
  const { tex, ctx } = canvasTexture(scene, 'bubble', S, S);
  ctx.fillStyle = 'rgba(160, 220, 255, 0.22)';
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(200, 240, 255, 0.9)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  rect(ctx, 'rgba(255,255,255,0.95)', 7, 6, 4, 2);
  rect(ctx, 'rgba(255,255,255,0.95)', 6, 8, 2, 3);
  tex.refresh();
}

// Vertical fade (transparent at the top) for the darkness under the grass.
function drawFade(scene) {
  const { tex, ctx } = canvasTexture(scene, 'fade', 4, 32);
  const g = ctx.createLinearGradient(0, 0, 0, 32);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(255,255,255,1)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 32);
  tex.refresh();
}

// A 4-point twinkle for ores glinting in the dark.
function drawGlint(scene) {
  const { tex, ctx } = canvasTexture(scene, 'glint', 7, 7);
  rect(ctx, '#ffffff', 3, 0, 1, 7);
  rect(ctx, '#ffffff', 0, 3, 7, 1);
  rect(ctx, '#ffffff', 2, 2, 3, 3);
  tex.refresh();
}

// A 3×5 pixel font for numbers and a few symbols (HUD, costs), and capital
// letters for the little captions grown-ups read (gear in the shops).
export const FONT_CHARS = "0123456789x+-/:!? ABCDEFGHIJKLMNOPQRSTUVWXYZ.,'";
const GLYPHS = {
  0: ['111', '101', '101', '101', '111'],
  1: ['010', '110', '010', '010', '111'],
  2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '011', '001', '111'],
  4: ['101', '101', '111', '001', '001'],
  5: ['111', '100', '111', '001', '111'],
  6: ['111', '100', '111', '101', '111'],
  7: ['111', '001', '010', '010', '010'],
  8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '111'],
  x: ['000', '101', '010', '101', '000'],
  '+': ['000', '010', '111', '010', '000'],
  '-': ['000', '000', '111', '000', '000'],
  '/': ['001', '001', '010', '100', '100'],
  ':': ['000', '010', '000', '010', '000'],
  '!': ['010', '010', '010', '000', '010'],
  '?': ['111', '001', '011', '000', '010'],
  ' ': ['000', '000', '000', '000', '000'],
  A: ['010', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  J: ['001', '001', '001', '101', '010'],
  K: ['101', '101', '110', '101', '101'],
  L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '111', '101', '101'],
  N: ['110', '101', '101', '101', '101'],
  O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'],
  Q: ['010', '101', '101', '110', '011'],
  R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'],
  T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'],
  V: ['101', '101', '101', '101', '010'],
  W: ['101', '101', '111', '111', '101'],
  X: ['101', '101', '010', '101', '101'],
  Y: ['101', '101', '010', '010', '010'],
  Z: ['111', '001', '010', '100', '111'],
  '.': ['000', '000', '000', '000', '010'],
  ',': ['000', '000', '000', '010', '100'],
  "'": ['010', '010', '000', '000', '000'],
};
function drawFont(scene) {
  const W = 4;
  const H = 6;
  const { tex, ctx } = canvasTexture(scene, 'font-img', W * FONT_CHARS.length, H);
  [...FONT_CHARS].forEach((ch, i) => {
    GLYPHS[ch].forEach((row, y) => [...row].forEach((bit, x) => {
      if (bit === '1') rect(ctx, '#ffffff', i * W + x, y);
    }));
  });
  tex.refresh();
  scene.cache.bitmapFont.add('pixel', Phaser.GameObjects.RetroFont.Parse(scene, {
    image: 'font-img', width: W, height: H, chars: FONT_CHARS, charsPerRow: FONT_CHARS.length,
    spacing: { x: 0, y: 0 }, offset: { x: 0, y: 0 },
  }));
}

export function drawTextures(scene) {
  drawTiles(scene);
  drawCracks(scene);
  drawOreIcons(scene);
  drawIcons(scene);
  drawLight(scene);
  drawFade(scene);
  drawBubble(scene);
  drawSlime(scene);
  drawBat(scene);
  drawGlint(scene);
  drawFont(scene);
  drawCharacters(scene, canvasTexture, rect);
  drawCampArt(scene, canvasTexture, rect);
  drawLogo(scene, canvasTexture, rect);
  drawDecor(scene, canvasTexture, rect);
  drawFindsArt(scene, canvasTexture, rect);
  drawPets(scene, canvasTexture, rect);
  drawFriends(scene, canvasTexture, rect);
  drawDecorItems(scene, canvasTexture, rect);
  drawAdventures(scene, canvasTexture, rect);
  drawDeep(scene, canvasTexture, rect);
  drawDeepCamp(scene, canvasTexture, rect);
  drawMoonArt(scene, canvasTexture, rect);
  drawSillyArt(scene, canvasTexture, rect);
  drawMoonWorld(scene, canvasTexture, rect);
  drawMoonBase(scene, canvasTexture, rect);
  drawMarsWorld(scene, canvasTexture, rect);
  drawMarsBase(scene, canvasTexture, rect);
  drawSaturnWorld(scene, canvasTexture, rect);
  drawSaturnBase(scene, canvasTexture, rect);
  drawDinoWorld(scene, canvasTexture, rect);
  drawDinoBase(scene, canvasTexture, rect);
  drawSunWorld(scene, canvasTexture, rect);
  drawSunBase(scene, canvasTexture, rect);
  drawSkateArt(scene, canvasTexture, rect);
  drawClawArt(scene, canvasTexture, rect);
  drawWhackArt(scene, canvasTexture, rect);
  drawHockeyArt(scene, canvasTexture, rect);
  drawEggCatchArt(scene, canvasTexture, rect);
  drawFireworksArt(scene, canvasTexture, rect);
  drawBuildArt(scene, canvasTexture, rect);
  drawRainbowArt(scene, canvasTexture, rect);
  drawRainbowShops(scene, canvasTexture, rect);
  drawGearArt(scene, canvasTexture, rect);
}
