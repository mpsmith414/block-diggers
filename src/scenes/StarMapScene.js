import Phaser from 'phaser';
import { starMapStops, rocketTo } from '../game/planets.js';
import { createRng } from '../world/rng.js';
import { createEdge } from '../input/intents.js';
import { getState } from '../save/store.js';
import { attachAudio } from '../audio/wire.js';
import { earnSticker } from './common/stickers.js';
import { CHARACTERS } from '../art/characters.js';

// The star map: every planet on a dotted path through space, with the Sun
// glowing at the end. Bright planets you can fly to, dark ones with a
// padlock (and a bubble showing the rocket that opens it), a traffic cone on
// the ones still being built. Under each planet sits the Sun Suit piece
// hidden at its bottom. ←/→ picks, A flies, B closes.

const W = 480;
const H = 270;
const SPOTS = [
  { x: 48, y: 150 }, { x: 118, y: 118 }, { x: 190, y: 146 }, { x: 262, y: 112 }, { x: 334, y: 142 }, { x: 420, y: 118 },
];
const LOOK = { earth: 'earth', moon: 'planet-moon', mars: 'planet-mars', saturn: 'planet-saturn', dino: 'planet-dino', sun: 'planet-sun' };
const SUIT_ICON = { helmet: 'suit-helmet-icon', boots: 'suit-boots', gloves: 'suit-gloves', jetpack: 'suit-jetpack' };

export class StarMapScene extends Phaser.Scene {
  constructor() {
    super('StarMap');
  }

  init(data) {
    this.camp = data.camp;
    this.here = data.here;
    this.slot = data.slot ?? 0;
  }

  create() {
    this.session = this.registry.get('input');
    this.edges = [0, 1].map(() => ({ a: createEdge(), b: createEdge(), left: createEdge(), right: createEdge() }));
    for (const s of this.session.slots) {
      if (!s.intent) continue;
      const e = this.edges[s.slot];
      e.a(!!s.intent.jump); e.b(!!s.intent.home);
    }
    this.openedAt = this.time.now;
    this.closing = false;
    this.flying = false;
    attachAudio(this);
    this.events.emit('pickerOpen');
    const state = getState(this.registry);
    this.stops = starMapStops(state, this.here);

    // deep space, stars and a faint nebula
    this.add.rectangle(0, 0, W, H, 0x07061a, 1).setOrigin(0);
    const neb = this.add.graphics();
    neb.fillStyle(0x3a1a5a, 0.35).fillCircle(150, 60, 70).fillCircle(360, 220, 90);
    neb.fillStyle(0x1a3a5a, 0.35).fillCircle(260, 200, 60);
    // (scattered by a seeded shuffle: the same sky every time, and no rows of
    // stars that look like extra flight paths)
    const sky = createRng(7);
    for (let i = 0; i < 120; i++) {
      const s = this.add.image(Math.floor(sky.next() * W), Math.floor(sky.next() * H), 'pixel').setTint([0xffffff, 0xfff6d0, 0x9ff6ff][i % 3]).setAlpha(0.3 + (i % 5) * 0.14);
      if (i % 4 === 0) this.tweens.add({ targets: s, alpha: 0.1, duration: 700 + (i % 6) * 250, yoyo: true, repeat: -1 });
    }

    // the dotted path from Earth to the Sun
    const path = this.add.graphics();
    for (let i = 0; i < SPOTS.length - 1; i++) {
      const a = SPOTS[i];
      const b = SPOTS[i + 1];
      const reached = this.stops[i + 1].status !== 'locked';
      for (let k = 1; k < 9; k++) {
        const t = k / 9;
        path.fillStyle(reached ? 0xffe066 : 0x5a5a8a, reached ? 0.9 : 0.6).fillRect(Math.round(a.x + (b.x - a.x) * t) - 1, Math.round(a.y + (b.y - a.y) * t) - 1, 2, 2);
      }
    }

    // the planets
    this.planets = this.stops.map((stop, i) => this.makePlanet(stop, SPOTS[i]));

    // you are here: your character bobbing over this planet
    const chars = this.registry.get('characters') ?? state.characters ?? CHARACTERS;
    const hereAt = this.stops.findIndex((s) => s.status === 'here');
    this.youAreHere = this.add.image(SPOTS[hereAt].x, SPOTS[hereAt].y - 30, `char-${chars[this.slot] ?? CHARACTERS[0]}`, 0).setScale(1.2);
    this.tweens.add({ targets: this.youAreHere, y: this.youAreHere.y - 4, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // the cursor: a glowing ring, and an A when you can fly there
    this.ring = this.add.graphics();
    this.btnA = this.add.image(0, 0, 'btn-a').setScale(1.6);
    this.btnB = this.add.image(W - 16, 16, 'btn-b').setScale(1.4);
    this.hint = this.add.container(0, 0).setDepth(5).setVisible(false);
    // (it starts on the planet you're launching from; left/right to pick where to go)
    this.index = hereAt;
    this.drawCursor();

    earnSticker(this.camp, 'trip-starmap');
    this.cameras.main.fadeIn(250, 7, 6, 26);
  }

  makePlanet(stop, at) {
    const sun = stop.id === 'sun';
    const img = this.add.image(at.x, at.y, LOOK[stop.id]).setScale(sun ? 2 : stop.id === 'earth' ? 1.2 : 1.1);
    const glow = sun ? this.add.image(at.x, at.y, 'light').setTint(0xffb040).setScale(4).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD) : null;
    if (glow) {
      glow.setDepth(-1);
      // slowly turning rays
      const rays = this.add.graphics({ x: at.x, y: at.y }).setDepth(-1);
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        rays.fillStyle(k % 2 ? 0xffe066 : 0xff9a2a, 0.8);
        rays.fillTriangle(Math.cos(a - 0.1) * 30, Math.sin(a - 0.1) * 30, Math.cos(a + 0.1) * 30, Math.sin(a + 0.1) * 30, Math.cos(a) * (k % 2 ? 42 : 48), Math.sin(a) * (k % 2 ? 42 : 48));
      }
      this.tweens.add({ targets: rays, angle: 360, duration: 20000, repeat: -1 });
      this.tweens.add({ targets: glow, scale: 4.6, alpha: 0.5, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: img, angle: 360, duration: 30000, repeat: -1 });
    }
    const extras = [];
    if (stop.status === 'locked') {
      // locked: dimmed, but you can still see what's waiting for you
      if (!sun) img.setTint(0x8a88b0).setAlpha(0.75);
      extras.push(this.add.image(at.x, at.y + 2, 'icon-lock').setScale(1.4));
    } else if (stop.status === 'soon') {
      img.setAlpha(0.7);
      extras.push(this.add.image(at.x - 8, at.y + 16, 'icon-cone').setScale(1.3));
      extras.push(this.add.image(at.x + 9, at.y + 16, 'icon-clock').setScale(1.2));
    }
    // the Sun Suit piece hidden at this planet's bottom (lit once it's yours)
    if (stop.suit) {
      const piece = this.add.image(at.x, at.y + 34, SUIT_ICON[stop.suit]).setScale(1.6);
      if (!stop.hasSuit) piece.setTintFill(0x4a4870).setAlpha(0.8);
      else this.tweens.add({ targets: piece, scale: 1.9, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      extras.push(piece);
    }
    // under the Sun: the whole suit you need, piece by piece
    if (sun) {
      const pieces = ['helmet', 'boots', 'gloves', 'jetpack'];
      const have = getState(this.registry).suit ?? [];
      pieces.forEach((p, k) => {
        const icon = this.add.image(at.x - 21 + k * 14, at.y + 46, SUIT_ICON[p]).setScale(1);
        if (!have.includes(p)) icon.setTintFill(0x4a4870).setAlpha(0.8);
        extras.push(icon);
      });
    }
    return { stop, img, extras, at };
  }

  drawCursor() {
    const { at, stop } = this.planets[this.index];
    const r = stop.id === 'sun' ? 38 : 22;
    this.ring.clear();
    this.ring.lineStyle(2, 0xffe066, 1).strokeCircle(at.x, at.y, r);
    this.ring.lineStyle(1, 0xfff6c0, 0.6).strokeCircle(at.x, at.y, r + 3);
    const canFly = stop.status === 'open';
    this.btnA.setPosition(at.x + r * 0.8, at.y - r * 0.8).setVisible(canFly);
    for (const p of this.planets) p.img.setScale((p.stop.id === 'sun' ? 2 : p.stop.id === 'earth' ? 1.2 : 1.1) * (p === this.planets[this.index] ? 1.12 : 1));
    this.drawHint(stop, at);
  }

  // A locked planet shows what opens it, in a little speech bubble: the rocket
  // building to make, and the camp (planet) to make it at.
  drawHint(stop, at) {
    this.hint.removeAll(true);
    const need = stop.status === 'locked' ? rocketTo(stop.id) : null;
    if (!need) {
      this.hint.setVisible(false);
      return;
    }
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRoundedRect(-29, -21, 62, 38, 6);
    g.fillStyle(0x8a5a34, 1).fillRoundedRect(-31, -24, 62, 38, 6).fillTriangle(-6, 13, 6, 13, 0, 21);
    g.fillStyle(0xf4e4c1, 1).fillRoundedRect(-29, -22, 58, 34, 5).fillTriangle(-4, 11, 4, 11, 0, 17);
    const bld = this.add.image(-11, -5, `bld-${need.id}`);
    bld.setScale(30 / bld.height);
    const where = this.add.image(17, -5, LOOK[need.at]);
    where.setScale(16 / Math.max(where.width, where.height));
    this.hint.add([g, bld, where]);
    this.hint.setPosition(at.x, at.y - (stop.id === 'sun' ? 72 : 50)).setVisible(true).setScale(0.6);
    this.tweens.add({ targets: this.hint, scale: 1, duration: 200, ease: 'Back.easeOut' });
  }

  move(d) {
    this.index = Phaser.Math.Clamp(this.index + d, 0, this.planets.length - 1);
    this.drawCursor();
    this.events.emit('pickerMove');
  }

  pick() {
    const p = this.planets[this.index];
    if (p.stop.status === 'open') {
      this.events.emit('ready');
      this.flyAlongPath(p.stop.id);
      return;
    }
    if (p.stop.status === 'here') {
      this.tweens.add({ targets: this.youAreHere, scale: 1.6, duration: 120, yoyo: true });
      this.events.emit('pickerMove');
      return;
    }
    // locked, or still being built
    this.events.emit('nope');
    this.tweens.add({ targets: [p.img, ...p.extras], x: '+=3', duration: 50, yoyo: true, repeat: 3 });
    // and the hint bubble hops, to say "this is what you need"
    if (this.hint.visible) this.tweens.add({ targets: this.hint, y: this.hint.y - 6, duration: 120, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
  }

  // A little rocket zooms along the dotted path to the planet you picked, then lift-off.
  flyAlongPath(to) {
    if (this.closing || this.flying) return;
    this.flying = true;
    const from = this.stops.findIndex((s) => s.status === 'here');
    const dest = this.stops.findIndex((s) => s.id === to);
    const step = dest > from ? 1 : -1;
    const rocket = this.add.image(SPOTS[from].x, SPOTS[from].y, 'icon-rocket').setScale(1.4).setDepth(10);
    this.btnA.setVisible(false);
    const hop = (i) => {
      if (i === dest) {
        this.tweens.add({ targets: rocket, scale: 0, duration: 250, onComplete: () => this.close(to) });
        return;
      }
      const a = SPOTS[i];
      const b = SPOTS[i + step];
      rocket.setAngle((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 90);
      this.tweens.add({ targets: rocket, x: b.x, y: b.y, duration: 450, ease: 'Sine.easeInOut', onComplete: () => hop(i + step) });
      // a trail of little puffs
      for (let k = 1; k < 4; k++) {
        this.time.delayedCall(k * 110, () => {
          const puff = this.add.image(rocket.x, rocket.y, 'pixel').setDisplaySize(2, 2).setTint(0xffb34a).setDepth(9);
          this.tweens.add({ targets: puff, alpha: 0, duration: 500, onComplete: () => puff.destroy() });
        });
      }
    };
    hop(from);
  }

  close(to = null) {
    if (this.closing) return;
    this.closing = true;
    this.events.emit('pickerClose');
    this.cameras.main.fadeOut(200, 7, 6, 26);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.camp.starMapDone(to);
    });
  }

  update() {
    if (this.closing || this.flying) return;
    for (const { slot, intent } of this.session.slots) {
      if (!intent) continue;
      const e = this.edges[slot];
      const l = e.left(intent.moveX < -0.5);
      const r = e.right(intent.moveX > 0.5);
      const a = e.a(!!intent.jump);
      const b = e.b(!!intent.home);
      if (l) this.move(-1);
      if (r) this.move(1);
      if (this.time.now - this.openedAt < 300) continue;
      if (a) this.pick();
      else if (b) this.close();
    }
  }
}
