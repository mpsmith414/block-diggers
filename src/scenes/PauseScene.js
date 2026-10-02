import Phaser from 'phaser';
import { createEdge, createHoldTimer } from '../input/intents.js';
import { CHARACTER_COLORS, CHARACTERS } from '../art/characters.js';
import { getState, setState } from '../save/store.js';
import { attachAudio } from '../audio/wire.js';

// Pause menu: icons only. ▶ resume, 📖 book, the coat hanger (the Gear page:
// swap what you're wearing), 🔊 sound on/off, then in the mine
// the rope (go home, which banks the trip) or at camp the door (back to the
// title to swap characters). In "disconnect" mode it shows the missing
// controller and closes itself when it comes back, or the other player can
// hold A to play on alone while the missing one naps.

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
    const chars = this.registry.get('characters') ?? CHARACTERS;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRoundedRect(113, 69, 260, 132, 8);
    g.fillStyle(EDGE, 1).fillRoundedRect(110, 66, 260, 132, 8);
    g.fillStyle(PAPER, 1).fillRoundedRect(113, 69, 254, 126, 7);
    // left: who's missing (their controller wobbles, looking for them)
    const n = this.missing.length;
    this.missing.forEach((slot, i) => {
      const char = chars[slot] ?? CHARACTERS[slot];
      const x = 180 + (i - (n - 1) / 2) * 50;
      const pad = this.add.image(x, 108, 'icon-pad').setScale(3).setTint(CHARACTER_COLORS[char] ?? 0xffffff);
      this.tweens.add({ targets: pad, angle: { from: -8, to: 8 }, duration: 300, yoyo: true, repeat: -1 });
      this.add.image(x, 160, `char-${char}`, 0).setScale(2);
    });
    // right: hold A to play on without them (a ring fills, like holding B to go home)
    g.fillStyle(EDGE, 0.35).fillRect(239, 84, 2, 96);
    this.playOn = createHoldTimer(1500);
    this.playOnA = this.add.image(305, 112, 'btn-a').setScale(3);
    this.tweens.add({ targets: this.playOnA, y: 108, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.playOnRing = this.add.graphics();
    this.add.image(305, 160, 'icon-play').setScale(2);
  }

  drawPlayOn(prog, show) {
    this.playOnA.setVisible(show);
    this.playOnRing.clear();
    if (!show || prog <= 0) return;
    this.playOnRing.lineStyle(4, 0x4cc24a, 1).beginPath();
    this.playOnRing.arc(305, 110, 22, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2, false).strokePath();
  }

  buildMenu() {
    const inMine = this.target === 'Mine';
    this.options = [
      { id: 'resume', icon: 'icon-play' },
      { id: 'book', icon: 'icon-book' },
      { id: 'gear', icon: 'icon-hanger' },
      { id: 'sound', icon: this.audio?.core.muted ? 'icon-mute' : 'icon-sound' },
      // (in the mine the only way out is home, so the trip is always banked)
      inMine ? { id: 'home', icon: 'icon-home' } : { id: 'title', icon: 'icon-door' },
    ];
    this.index = 0;
    const w = 60 * this.options.length + 30;
    const x = 240 - w / 2;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRoundedRect(x + 3, 94, w, 90, 8);
    g.fillStyle(EDGE, 1).fillRoundedRect(x, 90, w, 90, 8);
    g.fillStyle(PAPER, 1).fillRoundedRect(x + 3, 93, w - 6, 84, 7);
    // the pause sign sits on a little paper tab on the panel's top edge
    g.fillStyle(0x000000, 0.25).fillRoundedRect(223, 62, 40, 34, 6);
    g.fillStyle(EDGE, 1).fillRoundedRect(220, 58, 40, 34, 6);
    g.fillStyle(PAPER, 1).fillRoundedRect(223, 61, 34, 30, 5);
    this.add.image(240, 74, 'icon-pause').setScale(2.2);
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

  update(time, delta) {
    const slots = this.session.slots;
    if (this.mode === 'disconnect') {
      if (slots.every((s) => s.intent || s.resting)) return this.resume();
      const here = slots.filter((s) => s.intent);
      const held = this.playOn.update(here.some((s) => s.intent.jump), delta);
      this.drawPlayOn(this.playOn.progress(), here.length > 0);
      if (held) {
        for (const s of slots) if (!s.intent) this.session.rest(s.slot);
        this.events.emit('ready');
        this.resume();
      }
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
      const i = this.options.findIndex((o) => o.id === 'sound');
      this.options[i].icon = muted ? 'icon-mute' : 'icon-sound';
      this.icons[i].setTexture(this.options[i].icon);
      this.events.emit('pickerMove');
      return;
    }
    if (id === 'book') {
      this.scene.start('Book', { target: this.target });
      return;
    }
    if (id === 'gear') {
      this.scene.start('Gear', { target: this.target });
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
