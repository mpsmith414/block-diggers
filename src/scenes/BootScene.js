import Phaser from 'phaser';
import { drawTextures } from '../art/textures.js';
import { createInputSession } from '../input/session.js';
import { loadIntoRegistry } from '../save/store.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    drawTextures(this);
    if (!this.registry.get('input')) {
      const session = createInputSession({ win: window, doc: document });
      this.registry.set('input', session);
      // Poll once per frame, before any scene updates.
      this.game.events.on(Phaser.Core.Events.PRE_STEP, () => session.update());
    }
    loadIntoRegistry(this.registry);
    this.scene.start('Camp');
  }
}
