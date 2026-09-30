// Runs the mine's hazards inside MineScene: spawns slimes and bats off-screen,
// steps them and falling gravel, draws them, and reports touches back to the
// scene (which decides on bonks and squashes).

import {
  createSlime, stepSlime, slimeTouch, createBat, stepBat, triggerGravel, stepGravel, overlaps, spawnSpot, creatureFor, GAIT_OF, GAITS,
} from '../../game/hazards.js';
import { playerCell } from '../../game/player.js';
import { B } from '../../world/blocks.js';
import { TILE, PLAYER, SLIME, BAT, SPAWN, GOLDEN_SLIME, SILLY } from '../../tuning.js';
import { earnSticker } from '../common/stickers.js';

// each creature's own little noise
const VOICE = {
  slime: 'blorp', bat: 'squeak', ptero: 'caw', robot: 'whirr', alien: 'giggle', wisp: 'crackle',
  moonblob: 'blorp', mouse: 'squeak', jelly: 'blorp', drone: 'whirr', sprite: 'giggle',
  dustbunny: 'squeak', crab: 'whirr', newt: 'blorp', martian: 'giggle', ember: 'crackle',
  penguin: 'squeak', scoop: 'blorp', owl: 'caw', cometling: 'whoosh', snowflake: 'giggle',
  dragonfly: 'whirr', raptor: 'squeak', frog: 'boing', beetle: 'crackle', moth: 'giggle',
  fairy: 'giggle', shadow: 'blorp', plasmajelly: 'blorp', sunbunny: 'boing', sparky: 'crackle',
};
// texture for each creature (most are named after it)
const TEXTURE = { robot: 'toyrobot', sprite: 'starsprite' };

export function createHazards(scene) {
  let enemies = [];
  let fallers = [];
  const sprites = new Map();
  let spawnT = SPAWN.every;

  const spriteFor = (e) => {
    let s = sprites.get(e);
    if (!s) {
      const key = e.golden ? 'slime-gold' : TEXTURE[e.species] ?? (e.species ?? e.kind);
      if (e.kind === 'slime') s = scene.add.sprite(0, 0, key, 0).setOrigin(0.5, 1).setDepth(28);
      else if (e.kind === 'bat') s = scene.add.sprite(0, 0, key, 0).setOrigin(0.5, 0.5).setDepth(28);
      else s = scene.add.image(0, 0, 'tiles', B.GRAVEL).setOrigin(0, 0).setDepth(12);
      sprites.set(e, s);
    }
    return s;
  };
  const dropSprite = (e) => {
    const s = sprites.get(e);
    if (s) s.destroy();
    sprites.delete(e);
  };

  const players = () => scene.avatars.filter(Boolean);

  function spawn(dt) {
    spawnT -= dt;
    if (spawnT > 0) return;
    spawnT = SPAWN.every;
    const ps = players();
    if (!ps.length) return;
    const near = playerCell(scene.rng.pick(ps).p);
    const v = scene.cameras.main.worldView;
    const avoid = {
      x0: Math.floor(v.x / TILE) - 1, y0: Math.floor(v.y / TILE) - 1,
      x1: Math.ceil(v.right / TILE) + 1, y1: Math.ceil(v.bottom / TILE) + 1,
    };
    const count = (kind) => enemies.filter((e) => e.kind === kind).length;
    // each layer has its own creature: walkers move like slimes, flyers like bats
    const { species, walker } = creatureFor(near.cy, scene.planet);
    const kind = walker ? 'slime' : 'bat';
    if (kind === 'slime' && count('slime') >= SLIME.max) return;
    if (kind === 'bat' && count('bat') >= BAT.max) return;
    const spot = spawnSpot(scene.grid, scene.rng, { walker, near, avoid, planet: scene.planet, keepOut: scene.world.skatepark ?? scene.world.arcade ?? scene.world.molefair ?? scene.world.rink ?? scene.world.grove ?? scene.world.deck ?? null });
    if (!spot) return;
    const dir = scene.rng.chance(0.5) ? 1 : -1;
    // (each species moves its own way: see GAITS)
    const gait = GAIT_OF[species];
    const e = walker
      ? createSlime(spot.cx * TILE + 2, spot.cy * TILE + 6, dir, gait ?? 'hop')
      : createBat(spot.cx * TILE + 3, spot.cy * TILE + 4, dir, gait ?? 'flap');
    e.species = species;
    e.voiceT = SILLY.voiceEvery[0] + Math.random() * (SILLY.voiceEvery[1] - SILLY.voiceEvery[0]);
    e.giggleT = 0;
    if (species === 'slime') e.golden = scene.rng.chance(GOLDEN_SLIME * (scene.luck ?? 1));
    enemies.push(e);
  }

  function despawnFar() {
    const ps = players();
    enemies = enemies.filter((e) => {
      const far = ps.every((a) => Math.abs(a.p.y - e.y) > SPAWN.despawnRows * TILE);
      if (far) dropSprite(e);
      return !far;
    });
  }

  return {
    // Call after a cell is mined: gravel resting on it starts to shake.
    mined(x, y) {
      fallers = triggerGravel(fallers, scene.grid, x, y - 1);
    },

    squash(e) {
      enemies = enemies.filter((o) => o !== e);
      const s = sprites.get(e);
      if (e.species === 'robot' && s) {
        // a toy robot falls over, its spring pops out, and it fades away
        sprites.delete(e);
        scene.tweens.add({ targets: s, angle: e.dir < 0 ? -90 : 90, y: s.y - 2, duration: 250, ease: 'Bounce.easeOut' });
        scene.tweens.add({ targets: s, alpha: 0, delay: 900, duration: 400, onComplete: () => s.destroy() });
        const spring = scene.add.image(s.x, s.y - 8, 'dizzy-star').setDepth(40).setTint(0xc0c8d8);
        scene.tweens.add({ targets: spring, y: spring.y - 22, angle: 540, alpha: 0, duration: 700, ease: 'Quad.easeOut', onComplete: () => spring.destroy() });
        scene.events.emit('critter', 'whirr');
        return;
      }
      dropSprite(e);
    },

    update(dt, time) {
      spawn(dt);
      despawnFar();

      // gravel
      const r = stepGravel(fallers, scene.grid, dt);
      fallers = r.fallers;
      for (const c of r.freed) scene.mapView.sync(c.x, c.y);
      for (const c of r.landed) {
        scene.mapView.sync(c.x, c.y);
        scene.effects.chunks(c.x, c.y, B.GRAVEL);
        scene.cameras.main.shake(60, 0.002);
        scene.events.emit('gravelLanded', c);
        scene.decor.filled(c.x, c.y);
      }
      for (const [e] of sprites) if (e.state && !fallers.includes(e)) dropSprite(e);
      for (const f of fallers) {
        const s = spriteFor(f);
        const jiggle = f.state === 'shake' ? Math.round(Math.sin(time / 25) * 1) : 0;
        s.setPosition(f.x + jiggle, f.y).setVisible(f.state === 'fall');
        if (f.state === 'fall') {
          for (const a of players()) if (!a.bubbling && overlaps(boxOf(a), f)) scene.bonk(a, a.p.x + PLAYER.w / 2);
        }
      }

      // enemies
      for (const e of enemies) {
        if (e.kind === 'slime') stepSlime(e, scene.grid, dt);
        else stepBat(e, scene.grid, dt);
        const s = spriteFor(e);
        if (e.kind === 'slime') {
          const walks = !!GAITS[e.gait]?.walk;
          // walkers step along (legs going while they move); hoppers squash on the ground
          const frame = walks ? (e.moving && e.grounded ? Math.floor(time / (e.sliding ? 400 : 140)) % 2 : 0) : (e.grounded ? 0 : 1);
          s.setPosition(e.x + e.w / 2, e.y + e.h + 1).setFrame(frame).setFlipX(e.dir < 0);
          s.setScale(e.grounded && !walks ? 1 + Math.sin(time / 180 + e.x) * 0.05 : 1, 1);
          // a penguin tips over onto its tummy to slide
          s.setAngle(e.sliding ? e.dir * 70 : (walks && e.moving ? Math.sin(time / 90) * 4 : 0));
        } else {
          // drifters flap slowly; darters and jitterers buzz
          const flap = { drift: 320, glide: 260, circle: 160, dart: 60, jitter: 70 }[e.gait] ?? 120;
          s.setPosition(e.x + e.w / 2, e.y + e.h / 2).setFrame(Math.floor(time / flap) % 2).setFlipX(e.dir < 0);
        }
        // now and then it makes its own little noise (only when you can see it)
        const view = scene.cameras.main.worldView;
        const seen = e.x > view.x && e.x < view.right && e.y > view.y && e.y < view.bottom;
        e.voiceT -= dt;
        e.giggleT -= dt;
        if (e.voiceT <= 0) {
          e.voiceT = SILLY.voiceEvery[0] + Math.random() * (SILLY.voiceEvery[1] - SILLY.voiceEvery[0]);
          if (seen && VOICE[e.species]) {
            scene.events.emit('critter', VOICE[e.species]);
            scene.tweens.add({ targets: s, scaleY: 1.25, duration: 90, yoyo: true });
          }
        }
        // aliens giggle when you get close
        if ((e.species === 'alien' || e.species === 'martian') && e.giggleT <= 0 && players().some((a) => Math.hypot(a.p.x - e.x, a.p.y - e.y) < 3 * TILE)) {
          e.giggleT = 3;
          scene.events.emit('critter', 'giggle');
          const n = scene.add.image(e.x + e.w / 2, e.y - 4, 'note').setDepth(40);
          scene.tweens.add({ targets: n, y: n.y - 16, x: n.x + 6, alpha: 0, duration: 900, onComplete: () => n.destroy() });
          earnSticker(scene, 'silly-giggle');
        }
        for (const a of players()) {
          if (a.bubbling) continue;
          const box = boxOf(a);
          if (e.kind === 'slime') {
            const touch = slimeTouch(box, a.p.vy, e);
            if (touch === 'squash') scene.squash(a, e);
            else if (touch === 'bonk') scene.bonk(a, e.x + e.w / 2, { kind: e.species ?? 'slime', enemy: e });
          } else if (overlaps(box, e)) {
            scene.bonk(a, e.x + e.w / 2, { kind: e.species ?? 'bat', enemy: e });
          }
        }
      }
    },

    get enemies() { return enemies; },
    get fallers() { return fallers; },
  };
}

const boxOf = (a) => ({ x: a.p.x, y: a.p.y, w: PLAYER.w, h: PLAYER.h });
