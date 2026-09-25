import Phaser from 'phaser';

class HelloScene extends Phaser.Scene {
  constructor() { super('Hello'); }
  create() {
    this.add.text(240, 135, 'Block Diggers', { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' })
      .setOrigin(0.5);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 480,
  height: 270,
  pixelArt: true,
  backgroundColor: '#1b1428',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { gamepad: false },
  scene: [HelloScene],
});
