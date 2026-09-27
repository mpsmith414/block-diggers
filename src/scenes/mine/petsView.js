// Pets on a trip. The mole trots after player 1 and sniffs out ore, the
// glow-bug circles player 1's head and lights the way, the bat buddy flutters
// by player 2 (or 1), fetching loose ore.

import { sniff, follow, nearestPickup } from '../../game/pets.js';
import { addOre } from '../../game/loot.js';
import { playerCell } from '../../game/player.js';
import { TILE, PLAYER, PETS } from '../../tuning.js';

export function createPetsView(scene, kinds) {
  const pets = kinds.map((kind) => ({
    kind,
    pos: { x: 0, y: 0 },
    placed: false,
    sprite: scene.add.sprite(0, 0, `pet-${kind}`, 0).setDepth(31),
    t: Math.random() * 10,
    sniffT: 2,
    carrying: null,
  }));

  const ownerOf = (kind) => {
    const ps = scene.avatars.filter(Boolean);
    if (!ps.length) return null;
    return kind === 'batbuddy' ? ps[ps.length - 1] : ps[0];
  };
  const center = (a) => ({ x: a.p.x + PLAYER.w / 2, y: a.p.y + PLAYER.h / 2 });

  function trail(from, to) {
    const n = 10;
    for (let i = 1; i <= n; i++) {
      scene.time.delayedCall(i * 60, () => {
        const x = from.x + ((to.x - from.x) * i) / n;
        const y = from.y + ((to.y - from.y) * i) / n - Math.sin((Math.PI * i) / n) * 10;
        scene.effects.sparkle(x, y, 0xffd0a0, 2);
      });
    }
    scene.time.delayedCall(n * 60, () => {
      const ping = scene.add.image(to.x, to.y, 'glint').setDepth(56).setTint(0xffe066).setScale(0.5);
      scene.tweens.add({ targets: ping, scale: 2.4, alpha: 0, duration: 700, onComplete: () => ping.destroy() });
    });
    scene.events.emit('sniff');
  }

  return {
    has: (kind) => kinds.includes(kind),
    // extra light from the glow-bug
    lights() {
      return pets.filter((p) => p.kind === 'glowbug' && p.placed)
        .map((p) => ({ x: p.pos.x, y: p.pos.y, r: PETS.bugLight, glow: 0.22, color: 0xffe066 }));
    },
    magnet: () => (kinds.includes('batbuddy') ? 2 : 1),

    update(dt, time) {
      for (const pet of pets) {
        const a = ownerOf(pet.kind);
        if (!a) continue;
        const c = center(a);
        pet.t += dt;
        let target;
        if (pet.kind === 'mole') target = { x: c.x - a.p.facing * 14, y: c.y + 2 + Math.abs(Math.sin(pet.t * 8)) * -3 };
        else if (pet.kind === 'glowbug') target = { x: c.x + Math.cos(pet.t * 2.2) * 12, y: c.y - 16 + Math.sin(pet.t * 3.1) * 4 };
        else target = { x: c.x + a.p.facing * 16, y: c.y - 12 + Math.sin(pet.t * 4) * 3 };

        // bat buddy: swoop to loose ore nearby and bring it back
        if (pet.kind === 'batbuddy') {
          if (!pet.carrying) {
            const p = nearestPickup(scene.pickups, c.x, c.y, PETS.fetchRange);
            if (p && Math.hypot(p.x - c.x, p.y - c.y) > 14) {
              target = { x: p.x, y: p.y - 4 };
              if (Math.hypot(p.x - pet.pos.x, p.y - pet.pos.y) < 8) {
                scene.pickups = scene.pickups.filter((q) => q !== p);
                pet.carrying = scene.add.image(pet.pos.x, pet.pos.y + 6, `ore-${p.ore}`).setDepth(32);
                pet.carrying.ore = p.ore;
              }
            }
          } else {
            target = { x: c.x, y: c.y - 6 };
            pet.carrying.setPosition(pet.pos.x, pet.pos.y + 7);
            if (Math.hypot(c.x - pet.pos.x, c.y - pet.pos.y) < 10) {
              const ore = pet.carrying.ore;
              pet.carrying.destroy();
              pet.carrying = null;
              if (addOre(a.pack, ore)) {
                scene.effects.sparkle(c.x, c.y - 6, 0xa0fff0, 5);
                scene.events.emit('oreCollected', { slot: a.slot, ore });
              } else {
                scene.pickups.push({ x: c.x, y: c.y, ore, ttl: Infinity, delay: 0.5, vx: 0, vy: 0 });
              }
            }
          }
        }

        if (!pet.placed) {
          pet.pos = { ...target };
          pet.placed = true;
        }
        follow(pet.pos, target, dt, pet.carrying ? PETS.speed * 1.4 : PETS.speed);
        pet.sprite.setPosition(Math.round(pet.pos.x), Math.round(pet.pos.y))
          .setFrame(Math.floor(time / (pet.kind === 'mole' ? 180 : 110)) % 2)
          .setFlipX(target.x < pet.pos.x - 1);
        pet.sprite.setVisible(!a.bubbling && !scene.goingHome);

        // mole: sniff out the nearest ore every few seconds
        if (pet.kind === 'mole') {
          pet.sniffT -= dt;
          if (pet.sniffT <= 0) {
            pet.sniffT = PETS.sniffEvery;
            const { cx, cy } = playerCell(a.p);
            const ore = sniff(scene.grid, cx, cy, PETS.sniffRange);
            if (ore) trail({ x: pet.pos.x, y: pet.pos.y - 4 }, { x: ore.x * TILE + TILE / 2, y: ore.y * TILE + TILE / 2 });
          }
        }
      }
    },
  };
}
