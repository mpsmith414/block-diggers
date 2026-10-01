import Phaser from 'phaser';
import { drawTextures } from '../art/textures.js';
import { createInputSession } from '../input/session.js';
import { createDevices } from '../input/devices.js';
import { createTouch } from '../input/touch.js';
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
      // phones and tablets get on-screen controls (as player 1 when they tap A)
      const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      // (the buttons wear the game's own pixel icons)
      const icon = (key) => (this.textures.exists(key) ? this.textures.getBase64(key) : null);
      const icons = { a: icon('btn-a'), home: icon('icon-home'), pause: icon('icon-pause'), book: icon('icon-book') };
      const extras = navigator.maxTouchPoints > 0 && coarse ? [createTouch({ doc: document, win: window, icons })] : [];
      const devices = createDevices({ nav: navigator, target: window, extras });
      const session = createInputSession({ win: window, doc: document, devices });
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
    this.scene.launch('Toast');
    this.scene.start('Title');
  }
}
