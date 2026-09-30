import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.js';
import { MineScene } from './scenes/MineScene.js';
import { HudScene } from './scenes/HudScene.js';
import { CampScene } from './scenes/CampScene.js';
import { TitleScene } from './scenes/TitleScene.js';
import { PauseScene } from './scenes/PauseScene.js';
import { SummaryScene } from './scenes/SummaryScene.js';
import { LaunchScene } from './scenes/LaunchScene.js';
import { ToastScene } from './scenes/ToastScene.js';
import { BookScene } from './scenes/BookScene.js';
import { CampHudScene } from './scenes/CampHudScene.js';
import { BuildScene } from './scenes/BuildScene.js';
import { BuildHudScene } from './scenes/BuildHudScene.js';
import { StarMapScene } from './scenes/StarMapScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 480,
  height: 270,
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#1b1428',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  input: { gamepad: false },
  scene: [BootScene, TitleScene, CampScene, CampHudScene, MineScene, HudScene, PauseScene, SummaryScene, BookScene, StarMapScene, LaunchScene, ToastScene, BuildScene, BuildHudScene],
});

// Dev-only handle for debugging and screenshots.
if (import.meta.env.DEV) {
  window.__game = game;
  import('./dev/harness.js').then((m) => m.installHarness(game));
}
