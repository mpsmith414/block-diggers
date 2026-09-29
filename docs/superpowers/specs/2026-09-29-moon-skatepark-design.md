# Block Diggers — The Moon Skate Park — Design

**Date:** 2026-09-29
**Status:** approved by the owner in brainstorming. They picked "a gem per trick". The build goes ahead without further questions, with screenshots, iterating until the self-score is at least 8.5. Ask before merging to main or pushing, because pushing deploys the live site.

## Why

The owner's idea: at the bottom of the Moon, next to the Moon Heart, a big open skate park with a half pipe. You grab a skateboard and skate up and down the pipe. Press A in the air to do a random trick.

## 1. Where it is

- **A big room** in the Moon Core, right of the Moon Heart chamber:
  - columns 30–46 (17 wide), rows `MOON_H-14` to `MOON_H-3` (12 tall);
  - a flat Moon Core floor on row `MOON_H-2`, the same floor as the Heart chamber;
  - it opens straight into the Heart chamber (which spans columns 19–29), so you walk right in.
- **Carved last:**
  - the room is carved after the veins and caves;
  - chests and decorations that end up inside it are dropped;
  - creatures never spawn in it, because it's a lit room, not a cave.
- **Lit up:** four lamps hang from the ceiling, and the pipe has a glowing neon rim, so the room is bright.
- **The half pipe is scenery**, drawn behind the players. When you're walking, it's just a backdrop and you walk along the flat floor. You only ride its curve when you're on a board.

## 2. The half pipe (a smooth curve, not blocks)

- **Shape:** in pixels, a U across the room:
  - two quarter circles of radius `R = 96` (6 blocks);
  - a flat bottom `F = 80` wide between them;
  - the lips are 6 blocks above the floor.
- **Air above:** there are about 6 blocks of air above the lips for big Moon air.
- **The curve's parameter:** `s` is the distance along the curve from the left lip (`0`) to the right lip (`L = πR + F`). `curveAt(s)` returns `{ x, y, angle }`.

## 3. Skating (pure rules in `src/game/skate.js`)

- **The state:** `{ s, v, air, x, y, vx, vy, tricks, trick, gems }`.
- **On the pipe:**
  - gravity pulls you along the slope, using Moon gravity (`g = 405`);
  - left/right pushes you on the flat, and pumps (adds speed) when you push the way you're going on a wall;
  - there's a little friction, and speed is capped.
- **Taking off:**
  - past a lip, you fly straight up;
  - at the lip, `vy` is capped so you never hit the ceiling;
  - jump on the pipe is an ollie: you pop up and keep your speed.
- **In the air:**
  - gravity pulls you down, and `x` stays inside the pipe;
  - you land when you drop onto the curve;
  - your velocity is turned along the curve, so a lip landing rolls you straight back down;
  - there are no crashes: every landing is safe.
- **Tricks:**
  - A in the air starts a random trick: `kickflip`, `spin360`, `superman`, `grab`, `handstand` or `backflip`;
  - it's never the same trick twice in a row, and each lasts 0.45 s;
  - you can press A again after one finishes, for combos.
- **Landing:**
  - it returns `{ land: [tricks...] }`;
  - the gems are the number of tricks, plus 1 bonus for 3 or more, capped at `SKATE.gemCap = 15` per trip.
- **`stepSkate(s, intent, edges, dt, rng)`** returns events: `air`, `trick` (with its kind), `land` (with the tricks and gems).

## 4. In the mine (`src/scenes/mine/skateView.js`)

- **The rack:** two boards on a rack in the middle of the pipe bottom, one per player, so both can skate in co-op.
- **Getting on:**
  - walk into a board to hop on;
  - you can't hop straight back on after stepping off until you've left the rack area.
- **While skating:**
  - the normal player physics is skipped, and `a.p` follows the skate position, so the camera, pickups and lights still work;
  - the sprite tilts with the curve, and the board is drawn under your feet;
  - creatures poof, as on a ride;
  - bubbling or going home steps you off first.
- **Trick looks:**
  - kickflip: the board flips;
  - 360: you turn around twice;
  - superman: you fly flat above the board;
  - grab: you tuck and hold the board;
  - handstand: you're upside down on the board;
  - backflip: a full rotation;
  - each one leaves a star trail.
- **Landing a trick:**
  - a ding and confetti;
  - the gems pop out as space gems;
  - a sticker the first time you land each trick.
- **Stepping off:** press down. The board slides back to its rack.
- **Sounds:** a roll, a pop for ollies and take-offs, a whoosh for tricks, and a ding for landing.

## 5. Stickers (221 → 229, 23 pages)

A new **Skate Park** page with 8 stickers:
- the skate park;
- the skateboard (your first ride);
- the six tricks.

## 6. Save

Nothing new. Stickers are stored the way they always are.

## 7. Testing

- **`tests/game/skate.test.js`:**
  - the curve is continuous, with its lips at the right height;
  - rolling with no input stays in the pipe;
  - pumping builds up to big air, which stays under the ceiling;
  - a lip landing rolls back down;
  - an ollie;
  - tricks start only in the air and never repeat back to back;
  - the gem rule and its cap.
- **`tests/world/moon.test.js`:**
  - the park's room, floor and opening;
  - no chests inside it;
  - the Heart is unchanged.
- **Stickers:** 229 on 23 pages.
- **Browser:** walk in, hop on, pump to big air, tricks, landing gems, co-op, step off. Screenshots go to the owner.
