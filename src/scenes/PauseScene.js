import Phaser from 'phaser';
import { createEdge } from '../input/intents.js';
import { CHARACTER_COLORS, CHARACTERS } from '../art/characters.js';
import { getState, setState } from '../save/store.js';
import { attachAudio } from '../audio/wire.js';

// Pause menu: icons only. ▶ resume, 🔊 sound on/off, rope (go home, mine
// only), door (back to the title to swap characters). In "disconnect" mode it
// shows the missing controller and closes itself when it comes back.

const PAPER = 0xf4e4c1;
const EDGE = 0x8a5a34;

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  init(data) {
    this.target = data.target;
    this.mode = data.mode;
    this.missing = data.missing ?? [];
  }

  create() {
    this.session = this.registry.get('input');
    this.audio = this.registry.get('audio');
    this.edges = [0, 1].map(() => ({ a: createEdge(), b: createEdge(), start: createEdge(), left: createEdge(), right: createEdge() }));
    // prime: the press that opened the menu shouldn't also act in it
    for (const s of this.session.slots) {
      if (!s.intent) continue;
      const e = this.edges[s.slot];
      e.a(!!s.intent.jump); e.b(!!s.intent.home); e.start(!!s.intent.pause);
    }
    this.openedAt = this.time.now;

    this.add.rectangle(0, 0, 480, 270, 0x120a18, 0.6).setOrigin(0);
    attachAudio(this);
    if (this.mode === 'disconnect') this.buildDisconnect();
    else this.buildMenu();
  }

  buildDisconnect() {
    const g = this.add.graphics();
    g.fillStyle(EDGE, 1).fillRoundedRect(150, 70, 180, 120, 8);
    g.fillStyle(PAPER, 1).fillRoundedRect(153, 73, 174, 114, 7);
    const chars = this.registry.get('characters') ?? CHARACTERS;
    this.missing.forEach((slot, i) => {
      const x = 240 + (i - (this.missing.length - 1) / 2) * 70;
      const pad = this.add.image(x, 120, 'icon-pad').setScale(4).setTint(CHARACTER_COLORS[chars[slot]] ?? 0xffffff);
      this.tweens.add({ targets: pad, angle: { from: -8, to: 8 }, duration: 300, yoyo: true, repeat: -1 });
      this.add.image(x, 160, `char-${chars[slot]}`, 0).setScale(2);
    });
  }

  buildMenu() {
    const inMine = this.target === 'Mine';
    this.options = [
      { id: 'resume', icon: 'icon-play' },
      { id: 'sound', icon: this.audio?.core.muted ? 'icon-mute' : 'icon-sound' },
      ...(inMine ? [{ id: 'home', icon: 'icon-home' }] : []),
      { id: 'title', icon: 'icon-door' },
    ];
    this.index = 0;
    const w = 60 * this.options.length + 30;
    const x = 240 - w / 2;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRoundedRect(x + 3, 94, w, 90, 8);
    g.fillStyle(EDGE, 1).fillRoundedRect(x, 90, w, 90, 8);
    g.fillStyle(PAPER, 1).fillRoundedRect(x + 3, 93, w - 6, 84, 7);
    this.add.image(240, 70, 'icon-pause').setScale(3);
    this.cursor = this.add.graphics();
    this.icons = this.options.map((o, i) => this.add.image(x + 45 + i * 60, 135, o.icon).setScale(3));
    this.drawCursor();
  }

  drawCursor() {
    const w = 60 * this.options.length + 30;
    const x = 240 - w / 2 + 45 + this.index * 60;
    this.cursor.clear();
    this.cursor.fillStyle(0x6bbf59, 0.35).fillRoundedRect(x - 24, 111, 48, 48, 6);
    this.cursor.lineStyle(2, 0x4cc24a, 1).strokeRoundedRect(x - 24, 111, 48, 48, 6);
    this.icons.forEach((ic, i) => ic.setScale(i === this.index ? 3.4 : 3));
  }

  resume() {
    this.scene.resume(this.target);
    this.scene.stop();
  }

  update() {
    const slots = this.session.slots;
    if (this.mode === 'disconnect') {
      if (slots.every((s) => s.intent)) this.resume();
      return;
    }
    for (const { slot, intent } of slots) {
      if (!intent) continue;
      const e = this.edges[slot];
      const a = e.a(!!intent.jump);
      const b = e.b(!!intent.home);
      const start = e.start(!!intent.pause);
      const l = e.left(intent.moveX < -0.5);
      const r = e.right(intent.moveX > 0.5);
      if (l || r) {
        this.index = (this.index + (r ? 1 : -1) + this.options.length) % this.options.length;
        this.drawCursor();
        this.events.emit('pickerMove');
      }
      if ((b || start) && this.time.now - this.openedAt > 250) return this.resume();
      if (a) return this.choose(this.options[this.index].id);
    }
  }

  choose(id) {
    if (id === 'resume') return this.resume();
    if (id === 'sound') {
      const muted = !this.audio.core.muted;
      this.audio.core.setMuted(muted);
      setState(this.registry, { ...getState(this.registry), muted });
      this.options[1].icon = muted ? 'icon-mute' : 'icon-sound';
      this.icons[1].setTexture(this.options[1].icon);
      this.events.emit('pickerMove');
      return;
    }
    if (id === 'home') {
      this.resume();
      this.scene.get('Mine').goHome();
      return;
    }
    if (id === 'title') {
      this.scene.stop(this.target);
      this.scene.stop('Hud');
      this.scene.stop('CampHud');
      this.scene.start('Title');
    }
  }
}
