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

const T = 16;

export const ORE_COLORS = {
  coal: ['#2a2830', '#55525e'],
  iron: ['#d9a07a', '#f5d2b8'],
  gold: ['#f5c629', '#fff2a0'],
  diamond: ['#4de3f0', '#d4fbff'],
  emerald: ['#2fcf6a', '#b8ffcf'],
};

// Background (back wall) tiles live after the block tiles in the tileset.
export const BACK = { dirt: BLOCK_COUNT, stone: BLOCK_COUNT + 1, deep: BLOCK_COUNT + 2, crystal: BLOCK_COUNT + 3 };
const TILE_FRAMES = BLOCK_COUNT + 4;

const HOSTS = {
  [B.DIRT]: { base: '#8a5a34', dark: '#6b4424', light: '#a3703f' },
  [B.STONE]: { base: '#7d7d86', dark: '#5f5f68', light: '#9a9aa3' },
  [B.DEEP]: { base: '#3f3d4f', dark: '#2d2b3a', light: '#555368' },
  [B.CRYSTAL]: { base: '#4b3f8a', dark: '#3a2f6e', light: '#8a7fe0' },
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

  // back walls: darker, low-contrast versions of each host rock
  const back = (frame, pal) => {
    speckle(ctx, frame * T, rng, pal, 4);
  };
  back(BACK.dirt, { base: '#3b2616', dark: '#2e1d10', light: '#45301d' });
  back(BACK.stone, { base: '#34343b', dark: '#2a2a30', light: '#3d3d45' });
  back(BACK.deep, { base: '#1c1b25', dark: '#15141c', light: '#23222e' });
  back(BACK.crystal, { base: '#221a3e', dark: '#1a1432', light: '#2c2350' });

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
    if (ore === 'diamond' || ore === 'emerald') {
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
    rect(ctx, '#e03a3a', 7, 0, 5, 7);
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

// A 3×5 pixel font for numbers and a few symbols (HUD, costs).
export const FONT_CHARS = '0123456789x+-/:!? ';
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
}
