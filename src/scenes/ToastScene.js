import Phaser from 'phaser';

// Always-on-top overlay for "new sticker!" toasts. Toasts queue up and slide
// in below the HUD, never blocking play.

const PAPER = 0xf4e4c1;
const GOLD = 0xf5c629;

export class ToastScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Toast', active: false });
  }

  create() {
    this.queue = [];
    this.busy = false;
  }

  show(sticker, trophyPage = null) {
    if (!sticker) return;
    this.queue.push({ sticker, trophyPage });
    if (!this.busy) this.next();
  }

  next() {
    const item = this.queue.shift();
    if (!item) {
      this.busy = false;
      return;
    }
    this.busy = true;
    this.scene.bringToTop();
    const x = this.scale.width / 2;
    const c = this.add.container(x, -30);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25).fillCircle(2, 3, 19);
    g.fillStyle(GOLD, 1).fillCircle(0, 0, 19);
    g.fillStyle(PAPER, 1).fillCircle(0, 0, 16);
    const icon = this.add.image(0, 0, item.sticker.icon, item.sticker.frame);
    const s = Math.min(1.6, 26 / Math.max(icon.width, icon.height));
    icon.setScale(s);
    const star = this.add.image(15, -14, 'star').setScale(1.2);
    c.add([g, icon, star]);
    if (item.trophyPage !== null) {
      const trophy = this.add.image(-22, 6, `trophy-${item.trophyPage}`).setScale(1.5);
      c.add(trophy);
    }
    this.tweens.add({ targets: star, angle: 360, duration: 900, repeat: 1 });
    this.tweens.add({
      targets: c,
      y: 58,
      duration: 380,
      ease: 'Back.easeOut',
      onComplete: () => {
        for (let i = 0; i < 8; i++) {
          const b = this.add.image(x, 58, 'pixel').setTint(0xfff2a0).setDisplaySize(2, 2);
          const a = (Math.PI * 2 * i) / 8;
          this.tweens.add({ targets: b, x: x + Math.cos(a) * 30, y: 58 + Math.sin(a) * 30, alpha: 0, duration: 450, onComplete: () => b.destroy() });
        }
        this.tweens.add({
          targets: c,
          y: -30,
          delay: item.trophyPage !== null ? 2400 : 1400,
          duration: 300,
          ease: 'Quad.easeIn',
          onComplete: () => {
            c.destroy();
            this.next();
          },
        });
      },
    });
  }
}
