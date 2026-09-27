// Earning stickers from any scene: updates the save and shows the toast.

import { award, stickerById } from '../../game/stickers.js';
import { getState, setState } from '../../save/store.js';

// Returns true if the sticker was new. `quiet` skips the toast (e.g. back-filling).
export function earnSticker(scene, id, { quiet = false } = {}) {
  const { state, isNew, trophy } = award(getState(scene.registry), id);
  if (!isNew) return false;
  setState(scene.registry, state);
  if (!quiet) {
    const toast = scene.scene.get('Toast');
    if (toast) toast.show(stickerById(id), trophy);
    const audio = scene.registry.get('audio');
    if (audio) audio.sfx.play(trophy !== null ? 'build' : 'sticker');
  }
  scene.events.emit('sticker', id);
  return true;
}
