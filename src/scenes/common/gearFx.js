// The little things gear does as you move, in the mine and at camp: the
// Party Hat's confetti on every jump, the Wizard Hat's sparkle trail, the
// Clown Shoes' squeaks, a puff of dust from Gecko Socks climbing a wall, and
// the Balloon Pack's gentle bob.

const CONFETTI = [0xff5aa8, 0xffe066, 0x6ab0ff, 0x5ae07a, 0xffa64a, 0x9a7aff];
const TRAIL = [0xffe066, 0xffffff, 0xc8a0ff, 0x9ad8ff];

export function createGearFx(scene) {
  const pixel = (x, y, color, size = 2, depth = 29) => scene.add.image(x, y, 'pixel').setTint(color).setDisplaySize(size, size).setDepth(depth);

  return {
    // after a player's step: `powers` is what they have now, `r` what stepPlayer said
    step(a, powers, r, dt) {
      const s = a.sprite;
      if (!s.visible) return;
      if (r.jumped && powers.has('confetti')) {
        for (let i = 0; i < 10; i++) {
          const c = pixel(s.x, s.y - 16, CONFETTI[i % CONFETTI.length], 2, 41);
          const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
          const d = 10 + Math.random() * 14;
          scene.tweens.add({
            targets: c, x: c.x + Math.cos(ang) * d, y: c.y + Math.sin(ang) * d + 10, angle: 360, alpha: 0,
            duration: 600 + Math.random() * 300, ease: 'Quad.easeOut', onComplete: () => c.destroy(),
          });
        }
      }
      if (powers.has('trail') && (Math.abs(a.p.vx) > 5 || Math.abs(a.p.vy) > 30)) {
        a.trailT = (a.trailT ?? 0) - dt;
        if (a.trailT <= 0) {
          a.trailT = 0.05;
          const t = pixel(s.x - a.p.facing * 4 + (Math.random() - 0.5) * 6, s.y - 2 - Math.random() * 10, TRAIL[Math.floor(Math.random() * TRAIL.length)], 2, 28);
          scene.tweens.add({ targets: t, y: t.y - 6, alpha: 0, duration: 500, onComplete: () => t.destroy() });
        }
      }
      if (powers.has('squeak') && a.p.grounded && Math.abs(a.p.vx) > 5) {
        a.squeakT = (a.squeakT ?? 0) - dt;
        if (a.squeakT <= 0) {
          a.squeakT = 0.32;
          scene.events.emit('gearSqueak', a);
          const n = scene.add.image(s.x + (Math.random() - 0.5) * 6, s.y - 3, 'note').setDepth(41).setScale(0.6);
          scene.tweens.add({ targets: n, y: n.y - 10, alpha: 0, duration: 500, onComplete: () => n.destroy() });
        }
      } else a.squeakT = 0;
      if (r.wallClimb) {
        a.climbT = (a.climbT ?? 0) - dt;
        if (a.climbT <= 0) {
          a.climbT = 0.12;
          const d = pixel(s.x + a.p.facing * 6, s.y - 4, 0xc8f070, 2, 31);
          scene.tweens.add({ targets: d, x: d.x - a.p.facing * 4, alpha: 0, duration: 300, onComplete: () => d.destroy() });
        }
      }
      a.gliding = !!r.gliding;
    },
  };
}
