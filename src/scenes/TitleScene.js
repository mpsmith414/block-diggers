import Phaser from 'phaser';
import { CHARACTERS, CHARACTER_COLORS } from '../art/characters.js';
import { createEdge } from '../input/intents.js';
import { getState, setState } from '../save/store.js';
import { attachAudio } from '../audio/wire.js';
import { createEffects } from './mine/effects.js';

// Title and character select. Press A to join (up to two players),
// left/right to pick a character, A again when ready.

const PAPER = 0xf4e4c1;
const EDGE = 0x8a5a34;
const GROUND = 226;

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    this.session = this.registry.get('input');
    this.session.setJoining(true);
    this.effects = createEffects(this);
    this.cards = [];
    this.starting = false;
    const saved = getState(this.registry).characters;
    this.picks = [saved?.[0] ?? CHARACTERS[0], saved?.[1] ?? CHARACTERS[1]];
    this.ready = [false, false];

    this.drawBackdrop();
    this.logo = this.add.image(240, 44, 'logo').setDepth(10);
    this.tweens.add({ targets: this.logo, y: 48, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.time.addEvent({
      delay: 400,
      loop: true,
      callback: () => this.effects.sparkle(240 + Phaser.Math.Between(-120, 120), 44 + Phaser.Math.Between(-30, 30), 0xfff2a0, 3),
    });

    // the four friends, standing on the grass
    this.lineup = CHARACTERS.map((c, i) => {
      const s = this.add.sprite(186 + i * 36, GROUND, `char-${c}`, 0).setOrigin(0.5, 1).setScale(2).setDepth(5);
      this.tweens.add({ targets: s, y: GROUND - 3, duration: 380, yoyo: true, repeat: -1, delay: i * 140, ease: 'Sine.easeOut' });
      return s;
    });

    for (let slot = 0; slot < 2; slot++) this.cards[slot] = this.makeCard(slot);
    this.edges = [0, 1].map(() => ({ a: createEdge(), b: createEdge(), left: createEdge(), right: createEdge() }));
    attachAudio(this);
    this.cameras.main.fadeIn(500, 20, 12, 30);
  }

  drawBackdrop() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x5b4b8a, 0x5b4b8a, 0xf7a86b, 0xf7a86b, 1).fillRect(0, 0, 480, GROUND);
    g.fillStyle(0xffe6a0, 0.25).fillCircle(390, 150, 34);
    g.fillStyle(0xffd27a, 1).fillCircle(390, 150, 20);
    g.fillStyle(0x9a86b8, 1);
    for (let i = 0; i < 7; i++) g.fillCircle(i * 90 - 20, GROUND + 10, 64);
    g.fillStyle(0x7fb267, 1);
    for (let i = 0; i < 8; i++) g.fillCircle(i * 75 - 10, GROUND + 26, 50);
    g.fillStyle(0x5aa63c, 1).fillRect(0, GROUND, 480, 5);
    g.fillStyle(0x8a5a34, 1).fillRect(0, GROUND + 5, 480, 60);
    for (let i = 0; i < 40; i++) g.fillStyle(0x6b4424, 1).fillRect((i * 53) % 480, GROUND + 9 + ((i * 7) % 30), 3, 3);
    for (let i = 0; i < 5; i++) {
      const c = this.add.graphics();
      c.fillStyle(0xffffff, 0.85).fillRect(0, 0, 32, 7).fillRect(6, -5, 18, 5);
      c.setPosition(i * 110, 90 + (i % 3) * 16);
      this.tweens.add({ targets: c, x: c.x + 60, duration: 20000 + i * 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    for (let i = 0; i < 30; i++) {
      this.add.image(8 + i * 16 + (i % 3) * 3, GROUND + 1, 'flower', i % 3).setOrigin(0.5, 1).setDepth(4);
    }
    // the Moon hangs in the sky, and now and then a little rocket zooms up to it
    this.add.image(84, 66, 'planet-moon').setAlpha(0.9);
    // …and further off, little red Mars
    const mars = this.add.image(400, 46, 'planet-mars').setScale(0.6).setAlpha(0.9);
    this.tweens.add({ targets: mars, y: 49, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // …and far away, ringed Saturn
    this.add.image(446, 30, 'planet-saturn').setScale(0.5).setAlpha(0.85);
    const zoom = () => {
      const r = this.add.image(-10, 190, 'icon-rocket').setAngle(37).setDepth(2);
      this.tweens.add({
        targets: r, x: 78, y: 72, duration: 2200, ease: 'Sine.easeIn',
        onUpdate: () => { if (Math.random() < 0.4) this.effects.sparkle(r.x - 6, r.y + 6, 0xffb34a, 1); },
        onComplete: () => { this.effects.sparkle(84, 66, 0xffffff, 6); r.destroy(); },
      });
    };
    this.time.delayedCall(1500, zoom);
    this.time.addEvent({ delay: 9000, loop: true, callback: zoom });
  }

  makeCard(slot) {
    const w = 110;
    const h = 118;
    const x = slot === 0 ? 14 : 480 - w - 14;
    const y = 88;
    const c = this.add.container(x, y).setDepth(20);
    const bg = this.add.graphics();
    c.add(bg);
    const empty = this.add.container(0, 0);
    const a = this.add.image(w / 2, h / 2 - 6, 'btn-a').setScale(3);
    this.tweens.add({ targets: a, scale: 3.4, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const pad = this.add.image(w / 2, h / 2 + 30, 'icon-pad').setScale(2);
    empty.add([a, pad]);
    const chosen = this.add.container(0, 0).setVisible(false);
    const sprite = this.add.sprite(w / 2, 78, `char-${this.picks[slot]}`, 0).setOrigin(0.5, 1).setScale(4);
    const left = this.add.image(10, 50, 'arrow-l').setScale(2);
    const right = this.add.image(w - 10, 50, 'arrow-r').setScale(2);
    const check = this.add.image(w / 2, 98, 'check').setScale(2).setVisible(false);
    const aSmall = this.add.image(w / 2, 98, 'btn-a').setScale(1.5);
    chosen.add([sprite, left, right, check, aSmall]);
    c.add([empty, chosen]);
    const card = { c, bg, w, h, empty, chosen, sprite, check, aSmall, left, right };
    this.paintCard(slot, card, false);
    return card;
  }

  paintCard(slot, card, joined) {
    const color = joined ? CHARACTER_COLORS[this.picks[slot]] : EDGE;
    card.bg.clear();
    card.bg.fillStyle(0x000000, 0.25).fillRoundedRect(3, 4, card.w, card.h, 6);
    card.bg.fillStyle(color, 1).fillRoundedRect(0, 0, card.w, card.h, 6);
    card.bg.fillStyle(PAPER, 1).fillRoundedRect(3, 3, card.w - 6, card.h - 6, 5);
    if (joined) card.bg.fillStyle(color, 0.25).fillRoundedRect(8, 12, card.w - 16, 70, 4);
  }

  choose(slot, dir) {
    const other = this.session.count > 1 ? this.picks[1 - slot] : null;
    let i = CHARACTERS.indexOf(this.picks[slot]);
    do {
      i = (i + dir + CHARACTERS.length) % CHARACTERS.length;
    } while (CHARACTERS[i] === other);
    this.picks[slot] = CHARACTERS[i];
    const card = this.cards[slot];
    card.sprite.setTexture(`char-${this.picks[slot]}`, 0);
    this.tweens.add({ targets: card.sprite, scaleX: { from: 3.2, to: 4 }, duration: 160, ease: 'Back.easeOut' });
    this.paintCard(slot, card, true);
    this.events.emit('pickerMove');
  }

  update(time) {
    const slots = this.session.slots;
    for (const { slot, intent } of slots) {
      const card = this.cards[slot];
      const e = this.edges[slot];
      if (!card.joined) {
        card.joined = true;
        e.a(true); // the press that joined doesn't also mean "ready"
        // player 2 can't start on player 1's character
        if (slot === 1 && this.picks[1] === this.picks[0]) this.choose(1, 1);
        card.empty.setVisible(false);
        card.chosen.setVisible(true);
        this.paintCard(slot, card, true);
        this.effects.sparkle(card.c.x + card.w / 2, card.c.y + 50, 0xffffff, 10);
        this.events.emit('joined');
        continue;
      }
      if (!intent || this.starting) continue;
      const pressA = e.a(!!intent.jump);
      const pressB = e.b(!!intent.home);
      const l = e.left(intent.moveX < -0.5);
      const r = e.right(intent.moveX > 0.5);
      if (!this.ready[slot]) {
        if (l) this.choose(slot, -1);
        if (r) this.choose(slot, 1);
        if (pressA) {
          this.ready[slot] = true;
          this.events.emit('ready');
          this.tweens.add({ targets: card.sprite, y: 70, duration: 150, yoyo: true, ease: 'Quad.easeOut' });
        }
      } else if (pressB) {
        this.ready[slot] = false;
        this.events.emit('pickerClose');
      }
      card.check.setVisible(this.ready[slot]);
      card.aSmall.setVisible(!this.ready[slot]);
      card.left.setVisible(!this.ready[slot]);
      card.right.setVisible(!this.ready[slot]);
      card.sprite.setFrame(this.ready[slot] ? (Math.floor(time / 180) % 2 ? 1 : 2) : 0);
    }
    // dim the lineup friends that have been picked
    this.lineup.forEach((s, i) => {
      const taken = slots.some(({ slot }) => this.cards[slot].joined && this.picks[slot] === CHARACTERS[i]);
      s.setAlpha(taken ? 0.35 : 1);
    });

    const joined = slots.filter(({ slot }) => this.cards[slot].joined);
    if (!this.starting && joined.length && joined.every(({ slot }) => this.ready[slot])) this.start(joined.length);
  }

  start(count) {
    this.starting = true;
    const characters = this.picks.slice(0, Math.max(count, 1));
    this.registry.set('characters', characters);
    setState(this.registry, { ...getState(this.registry), characters: this.picks });
    this.time.delayedCall(600, () => {
      this.cameras.main.fadeOut(500, 20, 12, 30);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Camp'));
    });
  }
}
