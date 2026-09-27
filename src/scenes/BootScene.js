import Phaser from 'phaser';
import { drawTextures } from '../art/textures.js';
import { createInputSession } from '../input/session.js';
import { loadIntoRegistry } from '../save/store.js';
import { createAudio } from '../audio/audio.js';
import { createSfx } from '../audio/sfx.js';
import { createMusic } from '../audio/music.js';

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
    const state = loadIntoRegistry(this.registry);
    if (!this.registry.get('audio')) {
      const core = createAudio(window);
      core.setMuted(!!state.muted);
      this.registry.set('audio', { core, sfx: createSfx(core), music: createMusic(core) });
    }
    this.scene.start('Camp');
  }
}
