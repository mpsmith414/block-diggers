// Pets at home: they wander after you around the camp. Eggs hatch in the nest.

import { hatch } from '../../game/pets.js';
import { follow } from '../../game/pets.js';
import { getState, setState } from '../../save/store.js';
import { EGG_KINDS } from '../../art/finds.js';
import { earnSticker } from '../common/stickers.js';
import { TILE, CAMP, PLAYER } from '../../tuning.js';
import { playTrick, trickOffset } from '../common/petTricks.js';

const WALKERS = ['mole', 'rex', 'trike'];
const DINOS = ['rex', 'trike'];

export function createCampPets(camp) {
  const groundY = CAMP.ground * TILE;
  const nest = { x: (CAMP.fireX + 2) * TILE + 8, y: groundY };
  camp.add.image(nest.x, nest.y + 1, 'nest').setOrigin(0.5, 1).setDepth(6);
  const pets = [];
  let queue = [];
  let current = null; // the egg in the nest right now, until it cracks

  function addPet(kind, x, y) {
    const pet = { kind, pos: { x, y }, sprite: camp.add.sprite(x, y, `pet-${kind}`, 0).setDepth(29), t: Math.random() * 10, wanderX: 0, wanderT: 0 };
    pets.push(pet);
    return pet;
  }
  const home = getState(camp.registry);
  const parkAt = home.plots.indexOf('dinopark');
  for (const [i, kind] of (home.pets ?? []).entries()) {
    // dinosaurs start the day in their park
    const x = parkAt >= 0 && DINOS.includes(kind) ? CAMP.plots[parkAt] * TILE + 30 + i * 8 : nest.x + i * 12;
    addPet(kind, x, groundY - 20);
  }

  // One egg: wobble, wobble, crack — then a pet (or a burst of gold).
  function hatchOne(kind, done) {
    current = kind;
    const egg = camp.add.image(nest.x, nest.y - 3, 'egg', EGG_KINDS.indexOf(kind)).setOrigin(0.5, 1).setDepth(7).setScale(1.6);
    let wobbles = 0;
    const wobble = () => {
      wobbles++;
      camp.events.emit('wobble');
      camp.tweens.add({
        targets: egg,
        angle: { from: -14, to: 14 },
        duration: 110,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          if (wobbles < 3) camp.time.delayedCall(350, wobble);
          else crack();
        },
      });
    };
    const crack = () => {
      if (current !== kind) return; // already hatched by flush()
      current = null;
      egg.destroy();
      camp.effects.chunks(Math.floor(nest.x / TILE), Math.floor((nest.y - 12) / TILE), 99);
      camp.effects.confetti(nest.x, nest.y - 16);
      camp.events.emit('hatch');
      const r = hatch(getState(camp.registry), kind);
      setState(camp.registry, r.state);
      if (r.pet) {
        const pet = addPet(r.pet, nest.x, nest.y - 12);
        pet.sprite.setScale(0.2);
        camp.tweens.add({ targets: pet.sprite, scale: 1.6, duration: 300, ease: 'Back.easeOut', yoyo: true, hold: 600 });
        earnSticker(camp, `pet-${r.pet}`);
      } else {
        camp.scene.get('CampHud').flyList(nest.x, nest.y - 16, Array(r.gold).fill('gold'), r.state.bank);
      }
      camp.time.delayedCall(1400, done);
    };
    camp.time.delayedCall(200, wobble);
  }

  return {
    nest,
    hatchAll(eggs) {
      queue = [...eggs];
      const next = () => {
        const kind = queue.shift();
        if (kind) hatchOne(kind, next);
      };
      next();
    },
    // Leaving camp mid-hatch: hatch whatever is left right away, so no egg is lost.
    flush() {
      const left = [...(current ? [current] : []), ...queue];
      current = null;
      queue = [];
      for (const kind of left) {
        const r = hatch(getState(camp.registry), kind);
        setState(camp.registry, r.state);
        if (r.pet) earnSticker(camp, `pet-${r.pet}`);
      }
    },
    // Y: every pet does a trick
    trick() {
      for (const pet of pets) playTrick(camp, pet);
    },
    update(dt, time) {
      const players = camp.avatars.filter(Boolean);
      const parkPlot = getState(camp.registry).plots.indexOf('dinopark');
      const park = parkPlot >= 0 && camp.buildings[parkPlot] && !camp.buildings[parkPlot].building ? CAMP.plots[parkPlot] * TILE + 48 : null;
      pets.forEach((pet, i) => {
        pet.t += dt;
        const a = players[i % Math.max(1, players.length)];
        pet.wanderT -= dt;
        if (pet.wanderT <= 0) {
          pet.wanderT = 1.5 + Math.random() * 2;
          pet.wanderX = (Math.random() - 0.5) * 50;
        }
        let baseX = a ? a.p.x + PLAYER.w / 2 - a.p.facing * (18 + i * 10) + pet.wanderX * 0.4 : nest.x + pet.wanderX;
        // baby dinosaurs play in their park
        if (park && DINOS.includes(pet.kind)) baseX = park + pet.wanderX * 1.4;
        let target;
        if (WALKERS.includes(pet.kind)) target = { x: baseX, y: groundY - 6 - Math.abs(Math.sin(pet.t * 7)) * 3 };
        else if (pet.kind === 'glowbug') target = { x: baseX, y: groundY - 30 + Math.sin(pet.t * 3) * 6 };
        else target = { x: baseX, y: groundY - 36 + Math.sin(pet.t * 4) * 5 };
        follow(pet.pos, target, dt, 90);
        const tr = trickOffset(pet, dt);
        pet.sprite.setAngle(tr.angle);
        pet.sprite.setPosition(Math.round(pet.pos.x), Math.round(pet.pos.y + tr.y))
          .setFrame(Math.floor(time / (WALKERS.includes(pet.kind) ? 200 : 120)) % 2)
          .setFlipX(target.x < pet.pos.x - 1);
      });
    },
  };
}
