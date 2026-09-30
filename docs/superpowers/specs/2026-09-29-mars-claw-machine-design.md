# Block Diggers — The Mars Claw Machine — Design

**Date:** 2026-09-29
**Status:** chosen by the owner ("lets do the claw machine, build that one first, go now"). It is the first of the bonus mini games at the bottom of every planet:
- Earth: Whack-a-Mole;
- Moon: the Skate Park (already live);
- Mars: the Claw Machine;
- Saturn: Ice Hockey;
- Dino Planet: Egg Catch;
- the Sun: the Firework Launcher.

## Where

- **The Arcade:** a lit room right of the Mars Heart chamber, columns 30–46 with 12 rows of air above a Mars Core floor.
- **Carving:** `planetgen.bonusRoom(floorBlock, height)` carves it. It's the same helper as the Moon's skate park, which is 15 rows tall.
- **Kept clear:** chests, decorations and creatures (`spawnSpot keepOut`) stay out of it.
- **Look:** a red Martian night sky with ruin silhouettes and ceiling lamps.

## The machine

- **The cabinet:** 144x128 px, standing on the floor. It has:
  - a glass box with a rail at the top;
  - a pile of 10 prizes on the shelf;
  - a chute on the left, with a prize door below it;
  - a joystick and a red button on the front ledge.
- **The prizes:** `stockPrizes`:
  - one golden robot, two toy robots and two martian plushies;
  - five ores (ruby, bolt, coin or opal);
  - the pile is new every trip, which naturally caps the rewards.
- **Playing:** walk up to the joystick to take the controls, one player at a time.
  - Left/right moves the claw inside the glass.
  - A drops it; down steps away.
  - The camera frames the whole machine while someone plays.
- **What the claw does:** `stepClaw` runs `idle → down → close → up → carry → open`.
  - It grabs the nearest prize within 10 px, or comes up empty.
  - Halfway up, there's a 15% chance the prize slips back onto the pile right below.
  - It carries the prize to the chute and lets go. The prize goes down the chute, pops out of the door, and its treasure flies into the player's backpack.
- **What each prize gives:**

  | Prize | Treasure | Sticker |
  |---|---|---|
  | An ore | 3 of that ore | none |
  | A toy robot | 2 bolts and 2 coins | yes |
  | A martian plushie | 2 rubies and 2 opals | yes |
  | The golden robot | 4 rubies, 4 opals and 4 coins, with a flash and a fanfare | yes |

## Stickers

- **A new "Bonus Games" page** that the later mini games will share:
  - the claw machine;
  - the toy robot, the martian and the golden robot.
- **The count:** 233 stickers on 24 pages. `TROPHY_COUNT` is 24, and there's one more `TROPHY_GEMS` colour.

## Code

- **Rules:** `src/game/claw.js`, which is pure and tested in `tests/game/claw.test.js`.
- **The room:** `src/world/mars.js` returns `world.arcade`.
- **The view:** `src/scenes/mine/clawView.js`.
- **Shared by all bonus rooms:** `src/scenes/mine/bonusRoom.js` has the back wall, lamps and `flyOres`.
- **One face for `MineScene`:** `src/scenes/mine/bonusViews.js` holds `busy`, `step`, `leave`, `lights` and `framePoints` for the skate park and the claw machine.
- **The art:** `src/art/claw.js`.
