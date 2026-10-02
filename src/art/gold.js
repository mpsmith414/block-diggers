// Golden copies of any texture, for the Treasure Hall's statues: every
// pixel becomes gold by how bright it was (dark outlines stay a deep brown),
// keeping the texture's frames. Made once, when first asked for.

const OUTLINE = [90, 58, 16];
// the gold, from shadow through rich gold to a bright shine, by brightness
const RAMP = [[0.2, [150, 96, 12]], [0.55, [240, 184, 36]], [0.9, [255, 238, 140]]];
const lerp = (a, b, t) => a.map((c, k) => Math.round(c + (b[k] - c) * t));
function goldOf(lum) {
  if (lum < RAMP[0][0]) return OUTLINE;
  for (let i = 1; i < RAMP.length; i++) {
    const [l0, c0] = RAMP[i - 1];
    const [l1, c1] = RAMP[i];
    if (lum <= l1) return lerp(c0, c1, (lum - l0) / (l1 - l0));
  }
  return RAMP[RAMP.length - 1][1];
}

// Turn everything drawn on a canvas so far to gold.
export function goldify(ctx, w, h) {
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    const lum = (0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2]) / 255;
    [px[i], px[i + 1], px[i + 2]] = goldOf(lum);
  }
  ctx.putImageData(data, 0, 0);
}

export function goldKey(scene, key) {
  const gk = `gold-${key}`;
  if (scene.textures.exists(gk) || !scene.textures.exists(key)) return scene.textures.exists(gk) ? gk : key;
  const src = scene.textures.get(key);
  const img = src.getSourceImage();
  const tex = scene.textures.createCanvas(gk, img.width, img.height);
  const ctx = tex.getContext();
  ctx.drawImage(img, 0, 0);
  goldify(ctx, img.width, img.height);
  for (const name of src.getFrameNames()) {
    const f = src.get(name);
    tex.add(name, 0, f.cutX, f.cutY, f.cutWidth, f.cutHeight);
  }
  tex.refresh();
  return gk;
}
