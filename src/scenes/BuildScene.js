// The Build Yard: a sunny meadow past the gate at the end of Earth camp.
// Build with every block you've found on your adventures, as many as you
// like: LB/RB pick a block, A puts it where you're pointing (beside you,
// above your head with the stick up, under your feet with the stick down),
// B takes it away, and Y jumps (to climb what you've built). A green A shows
// where your block goes, a red B what you can take away. At the gate on the
// left, A goes back to camp. Whatever you build stays.
// The magic cloud: jump, then Y again in the air to hop on. Fly anywhere, even
// through your builds: A and B work on the square you're in (hold them to
// paint a line), and Y hops off (popping you up on top if you're inside a build).

import Phaser from 'phaser';
import { B } from '../world/blocks.js';
import { createPlayer, stepPlayer, standAt } from '../game/player.js';
import { createYard, yardEdits, placeBlock, removeBlock, aimCell, unlockedBlocks, tallest, kindsUsed, canEdit, flyStep, cellOf, popUp } from '../game/build.js';
import { createEdge } from '../input/intents.js';
import { animateCharacter } from './common/avatarView.js';
import { createEffects } from './mine/effects.js';
import { varyTile } from '../art/tileVariety.js';
import { createSuitView } from './common/suitView.js';
import { getState, setState } from '../save/store.js';
import { PHASES, phaseForTrips } from '../game/timeOfDay.js';
import { attachAudio } from '../audio/wire.js';
import { createPauseWatch } from './common/pauseWatch.js';
import { earnSticker } from './common/stickers.js';
import { walkMul } from '../game/perks.js';
import { TILE, PLAYER, BUILD } from '../tuning.js';
import { charFor } from '../game/cast.js';

const IDLE = { moveX: 0, moveY: 0, jump: false, bubble: false, home: false, pause: false, prev: false, next: false };
const GROUND_Y = BUILD.ground * TILE;

export class BuildScene extends Phaser.Scene {
  constructor() {
    super('Build');
  }

  create() {
    this.session = this.registry.get('input');
    this.session.setJoining(true);
    const state = getState(this.registry);
    this.grid = createYard(state.build?.edits ?? []);
    this.blocks = unlockedBlocks(state);
    this.walkMul = walkMul(state);
    this.W = BUILD.w * TILE;
    this.avatars = [];
    this.leaving = false;
    this.dirty = false;
    this.saveT = 0;

    this.drawSky(state);
    this.map = this.make.tilemap({ width: BUILD.w, height: BUILD.h, tileWidth: TILE, tileHeight: TILE });
    const ts = this.map.addTilesetImage('tiles', 'tiles', TILE, TILE, 1, 2);
    this.layer = this.map.createBlankLayer('yard', ts).setDepth(10);
    for (let y = 0; y < BUILD.h; y++) for (let x = 0; x < BUILD.w; x++) this.drawCell(x, y);
    // the gate back to camp, and flowers along the meadow
    this.add.image(1.5 * TILE, GROUND_Y + 1, 'yard-gate').setOrigin(0.5, 1).setDepth(5);
    for (let i = 0; i < 30; i++) {
      const x = 60 + ((i * 131) % (this.W - 80));
      this.add.image(x, GROUND_Y + 1, 'flower', i % 3).setOrigin(0.5, 1).setDepth(4);
    }
    this.effects = createEffects(this);
    this.suits = createSuitView(this);

    const cam = this.cameras.main;
    cam.setBounds(0, -6 * TILE, this.W, (BUILD.h + 6) * TILE);
    cam.setRoundPixels(true);
    this.cam = { zoom: 1.5, x: 4 * TILE, y: GROUND_Y - 40 };
    cam.setZoom(this.cam.zoom).centerOn(this.cam.x, this.cam.y);
    cam.fadeIn(400, 20, 12, 30);

    attachAudio(this);
    this.pauseWatch = createPauseWatch(this);
    this.scene.launch('BuildHud', { yard: this });
    this.events.once('shutdown', () => {
      this.scene.stop('BuildHud');
      this.save();
    });
    earnSticker(this, 'build-yard');
  }

  // The meadow's sky follows camp's time of day.
  drawSky(state) {
    const ph = PHASES[phaseForTrips(state.trips ?? 0)];
    const top = -6 * TILE;
    const g = this.add.graphics().setDepth(-30).setScrollFactor(0.2, 1);
    g.fillGradientStyle(ph.skyTop, ph.skyTop, ph.skyBottom, ph.skyBottom, 1);
    g.fillRect(-200, top, this.W + 400, GROUND_Y - top + 40);
    const orb = this.add.graphics().setDepth(-29).setScrollFactor(0.1, 1);
    if (ph.sun) orb.fillStyle(ph.sun.color, 1).fillCircle(ph.sun.x, GROUND_Y - ph.sun.y - 120, 16);
    if (ph.moon) orb.fillStyle(0xfff6d0, 1).fillCircle(ph.moon.x, GROUND_Y - ph.moon.y - 120, 13);
    if (state.sunHeart) this.add.image(260, GROUND_Y - 220, 'mini-sun').setDepth(-29).setScrollFactor(0.15, 1).setScale(1.4);
    const far = this.add.graphics().setDepth(-28).setScrollFactor(0.35, 1);
    far.fillStyle(ph.far, 1);
    for (let i = 0; i < 10; i++) far.fillCircle(i * 120 - 40, GROUND_Y - 6, 70);
    const near = this.add.graphics().setDepth(-27).setScrollFactor(0.6, 1);
    near.fillStyle(ph.near[0], 1);
    for (let i = 0; i < 12; i++) near.fillCircle(i * 100 - 30, GROUND_Y + 12, 58);
    for (let i = 0; i < 5; i++) {
      const c = this.add.graphics().setDepth(-26).setScrollFactor(0.3, 1);
      c.fillStyle(0xffffff, ph.clouds).fillRect(0, 0, 30, 7).fillRect(6, -5, 16, 5);
      c.setPosition(i * 220, top + 40 + (i % 3) * 30);
      this.tweens.add({ targets: c, x: c.x + 120, duration: 40000 + i * 5000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  drawCell(x, y) {
    const id = this.grid.get(x, y);
    if (id === B.AIR) this.layer.removeTileAt(x, y);
    else varyTile(this.layer.putTileAt(id, x, y), x, y);
  }

  avatarFor(slot) {
    if (this.avatars[slot]) return this.avatars[slot];
    const char = charFor(this.registry, slot);
    const a = {
      slot,
      char,
      p: createPlayer(standAt(BUILD.gate + 1 + slot, BUILD.ground - 1)),
      sprite: this.add.sprite(0, 0, `char-${char}`, 0).setOrigin(0.5, 1).setDepth(30),
      aim: this.add.image(0, 0, 'build-aim').setOrigin(0).setDepth(31),
      ghost: this.add.image(0, 0, 'tiles', B.DIRT).setOrigin(0).setDepth(9).setAlpha(0.45),
      // what your buttons do right now: green A (put it here / go through the
      // gate), red B (take this one away)
      promptA: this.add.image(0, 0, 'btn-a').setDepth(32).setVisible(false),
      promptB: this.add.image(0, 0, 'btn-b').setDepth(32).setVisible(false),
      // the magic cloud under a rider, and the "Y again for a cloud" hint over a jumper
      cloud: this.add.image(0, 0, 'yard-cloud').setOrigin(0.5, 0).setDepth(29.5).setVisible(false),
      hint: this.add.container(0, 0, [this.add.image(-7, 0, 'btn-y'), this.add.image(8, 1, 'yard-cloud').setScale(0.6)])
        .setDepth(33).setVisible(false),
      edges: { a: createEdge(), b: createEdge(), prev: createEdge(), next: createEdge(), y: createEdge() },
      sel: 0,
      walkT: 0,
      riding: false, // on the cloud
      rodeCloud: false, // (this visit: once you have, no more hints)
      yLock: false, // a Y still held from hopping off doesn't jump
      paintKey: null, // the square a held A or B last did
    };
    this.avatars[slot] = a;
    animateCharacter(a.sprite, a.p, a, 0, 0);
    this.suits.add(a);
    this.effects.sparkle(a.sprite.x, a.sprite.y - 8, 0xffffff, 8);
    this.events.emit('joined', a);
    return a;
  }

  // Who the camera follows: everyone, except a player resting while their
  // controller is away (the other one carries on alone).
  awake() {
    const all = this.avatars.filter(Boolean);
    const up = all.filter((a) => !this.session.slots.find((s) => s.slot === a.slot)?.resting);
    return up.length ? up : all;
  }

  update(time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 1 / 30);
    if (!this.leaving && this.pauseWatch.update()) return;
    for (const { slot, intent } of this.session.slots) {
      const a = this.avatarFor(slot);
      const i = intent ?? IDLE;
      const e = {
        a: a.edges.a(!!i.jump),
        b: a.edges.b(!!i.home),
        prev: a.edges.prev(!!i.prev),
        next: a.edges.next(!!i.next),
        y: a.edges.y(!!i.bubble),
      };
      const n = this.blocks.length;
      if (e.prev) { a.sel = (a.sel - 1 + n) % n; this.events.emit('pickerMove'); }
      if (e.next) { a.sel = (a.sel + 1) % n; this.events.emit('pickerMove'); }
      if (!i.bubble) a.yLock = false;
      // the magic cloud: Y in the air (or on a ladder) hops on; Y on the cloud hops off
      if (!this.leaving && e.y) {
        if (a.riding) this.hopOff(a);
        else if (!a.p.grounded) this.hopOn(a);
      }
      // where A and B work: the square you're in on the cloud; beside, above or
      // under you on foot
      const aim = a.riding ? cellOf(a.p) : aimCell(a.p, i.moveX, i.moveY);
      // at the gate (left of the building ground, near the grass): A goes back to camp
      const atGate = a.p.x + PLAYER.w / 2 < BUILD.gate * TILE && a.p.y + PLAYER.h >= GROUND_Y - 2 * TILE;
      if (!this.leaving && a.riding) {
        // hold A (or B) and fly: a line of blocks (or a gap), one per square
        const key = `${aim.x},${aim.y}`;
        if (e.a && atGate) this.goBack();
        else if (i.jump && key !== a.paintKey) {
          a.paintKey = key;
          this.place(a, aim, !e.a);
        } else if (i.home && !i.jump && key !== a.paintKey) {
          a.paintKey = key;
          this.dig(aim);
        }
        if (!i.jump && !i.home) a.paintKey = null;
        flyStep(a.p, i.moveX, i.moveY, dt);
      } else if (!this.leaving) {
        if (e.a) {
          if (atGate) this.goBack();
          else this.place(a, aim);
        }
        if (e.b) this.dig(aim);
        // (here A builds, so Y is the jump: for climbing what you've built)
        const move = { ...i, jump: !!i.bubble && !a.yLock };
        const r = stepPlayer(a.p, move, this.grid, { dt, canMine: false, walkMul: this.walkMul });
        if (r.jumped) this.events.emit('jump', a);
        if (r.sprung) {
          this.events.emit('spring', a);
          this.effects.sparkle(a.sprite.x, a.sprite.y, 0x6ae07a, 6);
        }
      }
      a.p.x = Phaser.Math.Clamp(a.p.x, 2, this.W - PLAYER.w - 2);
      // (a rider stands on the cloud, which bobs under them)
      animateCharacter(a.sprite, a.riding ? { ...a.p, vx: 0, vy: 0, grounded: true, climbing: false } : a.p, a, dt, time);
      a.cloud.setVisible(a.riding);
      if (a.riding) a.cloud.setPosition(a.sprite.x, a.sprite.y - 1 + Math.sin(time / 300));
      a.hint.setVisible(!this.leaving && !a.rodeCloud && !a.riding && !a.p.grounded && !a.p.climbing)
        .setPosition(a.sprite.x, a.sprite.y - 30);
      // where the block would go: an outline and a see-through block, with a
      // green A over it; a block you could take away gets a red outline and a B
      const free = !atGate && canEdit(aim.x, aim.y) && this.grid.get(aim.x, aim.y) === B.AIR;
      const removable = !atGate && canEdit(aim.x, aim.y) && this.grid.get(aim.x, aim.y) !== B.AIR;
      const show = !this.leaving;
      const pulse = 0.6 + Math.sin(time / 150) * 0.3;
      a.aim.setVisible(show && (free || removable)).setPosition(aim.x * TILE, aim.y * TILE).setAlpha(pulse)
        .setTint(removable ? 0xff6a5a : 0xffffff);
      a.ghost.setVisible(show && free).setPosition(aim.x * TILE, aim.y * TILE).setFrame(this.blocks[a.sel]);
      const bob = Math.sin(time / 200) * 1.5;
      const px = aim.x * TILE + TILE / 2;
      a.promptA.setVisible(show && (free || atGate))
        .setPosition(atGate ? 1.5 * TILE : px, (atGate ? GROUND_Y - 58 : aim.y * TILE - 8) + bob);
      a.promptB.setVisible(show && removable && !free).setPosition(px, aim.y * TILE - 8 + bob);
    }
    this.suits.update();
    this.updateCamera(dt);
    // save a moment after building (and when leaving)
    if (this.dirty) {
      this.saveT -= dt;
      if (this.saveT <= 0) this.save();
    }
  }

  // (`painting`: a held A on the cloud; a square that's taken is skipped quietly)
  place(a, aim, painting = false) {
    const id = this.blocks[a.sel];
    // a cloud rider is never in the way: they float in front of the blocks
    const bodies = this.avatars.filter((o) => o && !o.riding).map((o) => o.p);
    if (!placeBlock(this.grid, aim.x, aim.y, id, bodies)) {
      if (!painting) this.events.emit('nope');
      return;
    }
    this.drawCell(aim.x, aim.y);
    const t = this.layer.getTileAt(aim.x, aim.y);
    if (t) {
      // a little pop as it lands
      const pop = this.add.image(aim.x * TILE + TILE / 2, aim.y * TILE + TILE / 2, 'tiles', id).setDepth(11).setScale(1.4);
      this.tweens.add({ targets: pop, scale: 1, duration: 120, ease: 'Back.easeOut', onComplete: () => pop.destroy() });
    }
    this.effects.sparkle(aim.x * TILE + TILE / 2, aim.y * TILE + TILE / 2, 0xffffff, 4);
    this.events.emit('place');
    this.changed();
    const state = getState(this.registry);
    const placed = (state.build?.placed ?? 0) + 1;
    setState(this.registry, { ...state, build: { ...state.build, placed } });
    earnSticker(this, 'build-first');
    if (placed >= 100) earnSticker(this, 'build-100');
    if (tallest(this.grid) >= 12) earnSticker(this, 'build-tower');
    if (kindsUsed(this.grid) >= 8) earnSticker(this, 'build-rainbow');
  }

  // Y in the air: a cloud puffs up under you.
  hopOn(a) {
    a.riding = true;
    a.rodeCloud = true;
    a.paintKey = null;
    a.p.vx = 0;
    a.p.vy = 0;
    a.cloud.setScale(0.2);
    this.tweens.add({ targets: a.cloud, scale: 1, duration: 180, ease: 'Back.easeOut' });
    this.effects.sparkle(a.sprite.x, a.sprite.y, 0xffffff, 8);
    this.events.emit('cloudOn', a);
  }

  // Y on the cloud: off you hop (and up on top, if you're inside a build).
  hopOff(a) {
    a.riding = false;
    a.yLock = true;
    a.paintKey = null;
    a.p.vx = 0;
    a.p.vy = 0;
    this.effects.sparkle(a.sprite.x, a.sprite.y, 0xffffff, 6);
    if (popUp(this.grid, a.p)) this.effects.sparkle(a.p.x + PLAYER.w / 2, a.p.y + PLAYER.h, 0xfff2a0, 6);
    this.events.emit('cloudOff', a);
  }

  dig(aim) {
    const id = removeBlock(this.grid, aim.x, aim.y);
    if (id == null) return;
    this.drawCell(aim.x, aim.y);
    this.effects.chunks(aim.x, aim.y, id);
    this.events.emit('unplace');
    this.changed();
  }

  changed() {
    this.dirty = true;
    this.saveT = 1;
  }

  save() {
    if (!this.dirty) return;
    this.dirty = false;
    const state = getState(this.registry);
    setState(this.registry, { ...state, build: { ...state.build, edits: yardEdits(this.grid) } });
  }

  goBack() {
    if (this.leaving) return;
    this.leaving = true;
    this.save();
    this.cameras.main.fadeOut(400, 20, 12, 30);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Camp', { planet: 'earth', fromYard: true }));
  }

  updateCamera(dt) {
    const pts = this.awake().map((a) => ({ x: a.p.x + PLAYER.w / 2, y: a.p.y }));
    if (!pts.length) return;
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const zoom = Math.max(0.9, Math.min(1.5, this.scale.width / (Math.max(...xs) - Math.min(...xs) + 160)));
    const tx = (Math.min(...xs) + Math.max(...xs)) / 2;
    // keep the grass low on screen, but follow a builder up a tall tower
    const ty = Math.min(GROUND_Y - 50, Math.min(...ys) + 20);
    const k = 1 - Math.exp(-dt * 4);
    this.cam.zoom += (zoom - this.cam.zoom) * k;
    this.cam.x += (tx - this.cam.x) * k;
    this.cam.y += (ty - this.cam.y) * k;
    this.cameras.main.setZoom(this.cam.zoom).centerOn(this.cam.x, this.cam.y);
  }
}
