import Phaser from 'phaser';
import { createDevices } from '../input/devices.js';
import { createPlayers } from '../input/players.js';
import { toIntent, createEdge } from '../input/intents.js';
import { installBackGuard, installFocusGuard } from '../input/tvGuard.js';

// Throwaway milestone-1 scene: press A to join, move a coloured block.
// Proves input, scaling and frame rate on the Fire TV Cube.

const COLORS = [0x4aa3ff, 0xffa94a];
const SPEED = 120; // game pixels per second at full tilt

export class InputTestScene extends Phaser.Scene {
  constructor() {
    super('InputTest');
  }

  create() {
    this.devices = createDevices();
    this.players = createPlayers(2);
    this.avatars = [];
    this.pauseEdges = [createEdge(), createEdge()];
    this.paused = false;

    this.prompt = this.add
      .text(240, 135, 'Press A', { fontFamily: 'monospace', fontSize: '24px', color: '#ffffff' })
      .setOrigin(0.5);
    this.pausedText = this.add
      .text(240, 40, 'PAUSED', { fontFamily: 'monospace', fontSize: '20px', color: '#ffe066' })
      .setOrigin(0.5)
      .setVisible(false);
    this.fpsText = this.add.text(4, 256, '', { fontFamily: 'monospace', fontSize: '10px', color: '#8a80a0' });

    const removeBack = installBackGuard(window, () => this.togglePause());
    const guard = installFocusGuard({ doc: document, win: window });
    this.events.once('shutdown', () => {
      removeBack();
      guard.destroy();
      this.devices.destroy();
    });
  }

  togglePause() {
    this.paused = !this.paused;
    this.pausedText.setVisible(this.paused);
  }

  update(_time, dtMs) {
    const slots = this.players.update(this.devices.poll());
    for (const { slot, state } of slots) {
      if (!this.avatars[slot]) {
        this.avatars[slot] = this.add.rectangle(200 + slot * 80, 135, 16, 16, COLORS[slot]);
      }
      if (!state) continue;
      const intent = toIntent(state);
      if (this.pauseEdges[slot](intent.pause)) this.togglePause();
      if (this.paused) continue;
      const a = this.avatars[slot];
      a.x = Phaser.Math.Clamp(a.x + (intent.moveX * SPEED * dtMs) / 1000, 8, 472);
      a.y = Phaser.Math.Clamp(a.y + (intent.moveY * SPEED * dtMs) / 1000, 8, 262);
      a.setScale(intent.jump ? 1.4 : 1);
    }
    this.prompt.setVisible(this.players.count < 2);
    this.prompt.setText(this.players.count === 0 ? 'Press A' : 'Player 2: press A');
    this.fpsText.setText(`${Math.round(this.game.loop.actualFps)} fps`);
  }
}
