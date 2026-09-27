// Below ground it's dark. A quarter-resolution render texture covers the mine;
// each frame it's refilled with a warm near-black and light circles are erased
// from it. A soft additive glow on top makes lanterns and lava feel warm.

import Phaser from 'phaser';
import { TILE } from '../../tuning.js';

const S = 4; // world pixels per darkness pixel
const DARK = 0x1a0f22;
const ALPHA = 0.8;

export function createDarkness(scene, { w, h }) {
  const rw = Math.ceil(w / S);
  const rh = Math.ceil(h / S);
  const rt = scene.add.renderTexture(0, 0, rw, rh).setOrigin(0, 0).setScale(S).setDepth(50);
  const brush = scene.make.image({ key: 'light', add: false });
  const row = TILE / S;
  const fade = scene.make.image({ key: 'fade', add: false }).setOrigin(0, 0)
    .setDisplaySize(rw, row * 4).setTint(DARK).setAlpha(ALPHA);
  const glows = [];
  const glowAt = (i) => {
    if (!glows[i]) {
      glows[i] = scene.add.image(0, 0, 'light').setBlendMode(Phaser.BlendModes.ADD).setDepth(51);
    }
    return glows[i];
  };

  return {
    // lights: [{ x, y, r (blocks), color, glow }] in world pixels
    draw(lights) {
      rt.clear();
      // fade in smoothly over the first rows under the grass, then dark
      rt.draw(fade, 0, row);
      rt.fill(DARK, ALPHA, 0, row * 5, rw, rh - row * 5);
      for (const l of lights) {
        brush.setScale((l.r * TILE * 2) / S / brush.width);
        rt.erase(brush, l.x / S, l.y / S);
      }
      let i = 0;
      for (const l of lights) {
        if (!l.glow) continue;
        glowAt(i)
          .setVisible(true)
          .setPosition(l.x, l.y)
          .setScale((l.r * TILE * 2.2) / 64)
          .setTint(l.color ?? 0xffb35c)
          .setAlpha(l.glow);
        i++;
      }
      for (; i < glows.length; i++) glows[i].setVisible(false);
    },
  };
}
