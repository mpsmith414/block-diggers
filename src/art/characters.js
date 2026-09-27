// The four chibi characters: miner, fox, robot, dino.
// Each is a 64×16 strip of four 16×16 frames: 0 idle, 1 step A, 2 step B, 3 climb.
// They face right; the sprite is flipped to face left.

export const CHARACTERS = ['miner', 'fox', 'robot', 'dino'];
export const CHARACTER_COLORS = { miner: 0x4aa3ff, fox: 0xf08a3c, robot: 0x9aa4b0, dino: 0x5cc26a };

const OUT = '#2a1d2e'; // outline
const EYE = '#2a1d2e';
const BLUSH = '#ff8fa3';

const PALETTES = {
  miner: { head: '#f2c29b', body: '#4aa3ff', bodyDark: '#2f6fb8', legs: '#5a3a2a' },
  fox: { head: '#f08a3c', body: '#f08a3c', bodyDark: '#c9692a', legs: '#3d2a24' },
  robot: { head: '#c7ced8', body: '#9aa4b0', bodyDark: '#77818e', legs: '#55606d' },
  dino: { head: '#5cc26a', body: '#5cc26a', bodyDark: '#3d8a48', legs: '#3d8a48' },
};

export function drawCharacters(scene, canvasTexture, rect) {
  for (const name of CHARACTERS) {
    const { tex, ctx } = canvasTexture(scene, `char-${name}`, 64, 16);
    for (let f = 0; f < 4; f++) {
      drawFrame(ctx, rect, f * 16, name, f);
      tex.add(f, 0, f * 16, 0, 16, 16);
    }
    tex.refresh();
  }
}

function drawFrame(ctx, rect, ox, name, frame) {
  const pal = PALETTES[name];
  const r = (color, x, y, w = 1, h = 1) => rect(ctx, color, ox + x, y, w, h);

  // tails go behind the body
  if (name === 'fox') {
    r(OUT, 0, 10, 4, 4);
    r(pal.body, 1, 11, 2, 2);
    r('#fff4e6', 0, 11, 1, 2);
  }
  if (name === 'dino') {
    r(OUT, 0, 11, 4, 3);
    r(pal.body, 1, 12, 3, 1);
  }

  // legs
  const legs = frame === 1 ? [[4, 14, 2], [10, 14, 1]] : frame === 2 ? [[5, 14, 1], [9, 14, 2]] : [[5, 14, 2], [9, 14, 2]];
  for (const [x, y, h] of legs) r(pal.legs, x, y, 2, h);

  // body
  r(OUT, 4, 10, 8, 5);
  r(pal.body, 5, 10, 6, 4);
  r(pal.bodyDark, 5, 13, 6, 1);
  if (name === 'miner') { r(pal.bodyDark, 6, 10, 1, 3); r(pal.bodyDark, 9, 10, 1, 3); }
  if (name === 'fox') r('#fff4e6', 6, 11, 4, 2);
  if (name === 'dino') r('#b8f0a0', 6, 11, 4, 2);
  if (name === 'robot') r('#ffcf4a', 7, 11, 2, 1);

  // arms: down at the sides, up when climbing
  if (frame === 3) { r(pal.head, 2, 6, 1, 3); r(pal.head, 13, 6, 1, 3); } else { r(pal.bodyDark, 3, 11, 1, 2); r(pal.bodyDark, 12, 11, 1, 2); }

  // head
  r(OUT, 2, 2, 12, 9);
  r(pal.head, 3, 3, 10, 7);

  // ears / hats / crests, drawn over the head outline
  if (name === 'miner') {
    r(OUT, 2, 1, 12, 4);
    r('#ffcf4a', 3, 2, 10, 2);
    r('#e0a92a', 3, 4, 10, 1);
    r('#fff6b0', 7, 2, 2, 2);
  }
  if (name === 'fox') {
    r(OUT, 2, 0, 4, 3); r(pal.head, 3, 1, 2, 2); r('#ffd9c0', 4, 2, 1, 1);
    r(OUT, 10, 0, 4, 3); r(pal.head, 11, 1, 2, 2); r('#ffd9c0', 11, 2, 1, 1);
    r('#fff4e6', 6, 7, 6, 3);
    r(EYE, 10, 7, 2, 1); // nose at the front
  }
  if (name === 'robot') {
    r(OUT, 7, 0, 3, 3); r('#ff5a5a', 8, 0, 1, 1); r(pal.bodyDark, 8, 1, 1, 1);
    r('#23313f', 4, 4, 8, 3);
  }
  if (name === 'dino') {
    for (const x of [3, 6, 9]) { r(OUT, x, 0, 3, 3); r('#3d8a48', x + 1, 1, 1, 2); }
    r(pal.head, 3, 3, 10, 7);
    r('#b8f0a0', 7, 8, 5, 2);
  }

  // face (looking right): big eyes with a sparkle, rosy cheeks
  if (name === 'robot') {
    r('#4de3f0', 6, 5, 2, 1);
    r('#4de3f0', 10, 5, 2, 1);
    r(BLUSH, 5, 8, 1, 1);
    r(BLUSH, 11, 8, 1, 1);
  } else {
    const eyeY = name === 'miner' ? 5 : 4;
    r(EYE, 6, eyeY, 2, 2);
    r(EYE, 10, eyeY, 2, 2);
    r('#ffffff', 6, eyeY, 1, 1);
    r('#ffffff', 10, eyeY, 1, 1);
    r(BLUSH, 5, eyeY + 3, 1, 1);
    r(BLUSH, 12, eyeY + 3, 1, 1);
  }
}
