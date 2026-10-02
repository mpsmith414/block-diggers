# Block Diggers — Spending Sparkles: shops, gear and decorations — Design

**Date:** 2026-10-02
**Status:** designed with the owner in conversation. They approved each part and asked for it to be built straight away ("do spec and build").

**Why:** Rainbow Planet's endless mine pays out sparkles, but there's nothing to spend them on yet. This is project 2 of the end-game plan (see `2026-10-02-rainbow-planet-design.md`).

## Owner decisions this spec follows

- **The buildings are the shops.** Rainbow Village's four plots each hold a shop, and building one opens its shop.
- **Rainbow decorations go in Rainbow Village itself.** They work like Earth camp's decorations: buy them, carry them, put them down anywhere, pick them up again.
- **Outfits are gear with powers.**
  - Gear can be swapped in and out, the Jetpack included.
  - There are lots of options, and he can swap between them.
  - Each item should make it obvious what it does, with a short caption for a grown-up to read.
- **One item per body part:** head, back, feet and hands.
  - The Sun Suit pieces are the first item in each slot.
  - Hats go in the head slot. Some are just for looks; some have a power.
- **Gear works everywhere you dig** (every planet's mine, plus walking around the camps).
  - Its powers switch off inside the bonus mini games.
  - Story locks check what you **own**, never what you're wearing.
- **You can swap anywhere, from the pause menu,** even in the middle of a dig.
- **No Cloud Shoes.** The Moon Pup's double jump stays exactly as it is.
- **Pace: medium.** Everything costs about 15–20 trips; something new almost every trip.
- **Pets stay as they are.** "Pets must never change how you move" still holds. Gear is allowed to change how you move, because he picks it and can take it off.
- **Buying and wearing:** buy each item once and both players can wear it. Each player chooses their own gear.

## Rainbow Village's shops

**Plots:** four, at the same cells as Moon Base's: `RAINBOW_CAMP.plots = [26, 33, 40, 47]`. You build on them as at every camp, paid in sparkles.

| Building (id) | Cost | Sells |
|---|---|---|
| Hat Shop (`hatshop`) | 300 | the head slot |
| Shoe Shop (`shoeshop`) | 600 | the feet slot |
| Gadget Lab (`gadgetlab`) | 1,000 | the back and hands slots |
| Decoration Workshop (`decoshop`) | 1,500 | Rainbow Village decorations |

- **Order:** any. There are no `needs`.
- **Using a shop:** press A at a built shop to open its picker. Each card shows:
  - your own character, big, wearing the item;
  - a power picture (what it does);
  - a one-line caption in capital pixel letters, for a grown-up;
  - the price in sparkles, or a tick once it's owned.
- **What A does on a card:**
  - an item you don't own: buy it and put it on (for the player using the shop);
  - one you own: put it on;
  - one you're already wearing: take it off.
- **The Sun Suit pieces** aren't sold. They show in their shop with a tick once owned, and a padlock (and no price) until you win them.

## Gear

### Slots and items

| Slot | Item (id) | Shop | Cost | Power | Caption |
|---|---|---|---|---|---|
| head | Space Helmet (`helmet`) | Hat Shop | won | `light` | A BIGGER LIGHT IN THE DARK |
| head | X-Ray Goggles (`goggles`) | Hat Shop | 1,000 | `xray` | SEE TREASURE CHESTS THROUGH ROCK |
| head | Party Hat (`partyhat`) | Hat Shop | 200 | `confetti` | CONFETTI EVERY TIME YOU JUMP |
| head | Wizard Hat (`wizardhat`) | Hat Shop | 300 | `trail` | LEAVES A TRAIL OF SPARKLES |
| head | Sun Crown (`crown`) | Hat Shop | won | — | JUST FOR SHOW. VERY ROYAL |
| head | Pirate Hat (`piratehat`) | Hat Shop | 150 | — | JUST FOR LOOKS. ARRR! |
| head | Cowboy Hat (`cowboyhat`) | Hat Shop | 150 | — | JUST FOR LOOKS. YEEHAW! |
| head | Top Hat (`tophat`) | Hat Shop | 200 | — | JUST FOR LOOKS. VERY FANCY |
| head | Chef Hat (`chefhat`) | Hat Shop | 100 | — | JUST FOR LOOKS |
| head | Bunny Ears (`bunnyears`) | Hat Shop | 150 | — | JUST FOR LOOKS. HOP HOP! |
| head | Viking Helmet (`vikinghat`) | Hat Shop | 250 | — | JUST FOR LOOKS |
| head | Flower Crown (`flowercrown`) | Hat Shop | 100 | — | JUST FOR LOOKS |
| head | Duck Hat (`duckhat`) | Hat Shop | 250 | — | JUST FOR LOOKS. QUACK! |
| back | Jetpack (`jetpack`) | Gadget Lab | won | `jetpack` | HOLD JUMP IN THE AIR TO FLY UP |
| back | Glider Cape (`glider`) | Gadget Lab | 800 | `glide` | HOLD JUMP WHILE FALLING TO FLOAT DOWN |
| back | Turtle Shell (`shell`) | Gadget Lab | 600 | `shell` | CREATURES CAN'T KNOCK YOU BACK |
| back | Balloon Pack (`balloon`) | Gadget Lab | 1,500 | `balloon` | HOLD JUMP TO FLOAT UP SLOWLY |
| feet | Rocket Boots (`boots`) | Shoe Shop | won | `boots` | RUN FASTER. WIND CAN'T PUSH YOU |
| feet | Bouncy Feet (`bouncy`) | Shoe Shop | 500 | `bouncy` | JUMP TWICE AS HIGH |
| feet | Gecko Socks (`gecko`) | Shoe Shop | 1,500 | `gecko` | JUMP AT A WALL AND HOLD TO CLIMB IT |
| feet | Ice Skates (`skates`) | Shoe Shop | 400 | `skates` | EVERY FLOOR IS SLIPPERY ICE. WHEE! |
| feet | Clown Shoes (`clownshoes`) | Shoe Shop | 200 | `squeak` | THEY SQUEAK WITH EVERY STEP |
| hands | Power Gloves (`gloves`) | Gadget Lab | won | `gloves` | DIG FASTER. NO SLIPPING ON ICE |
| hands | Magnet Mitts (`magnet`) | Gadget Lab | 1,200 | `magnet` | GEMS NEARBY FLY OUT OF THE ROCK TO YOU |
| hands | Boxing Gloves (`boxing`) | Gadget Lab | 600 | `boxing` | CREATURES THAT BUMP YOU GO FLYING |
| hands | Lucky Mittens (`lucky`) | Gadget Lab | 900 | `lucky` | TREASURE CHESTS GIVE EXTRA |

**Prices:** the shops cost 3,400 altogether, and the gear about 12,000. Decorations (below) can be bought over and over, so sparkles always have a use.

### What each power does

- **`light`:** the Helmet's headlamp, as now. It helps the whole team if anyone wears it.
- **`xray`:** chests show through the rock, as the Treehouse-style reveal does. It helps the whole team if anyone wears it. On Rainbow Planet, unopened chests glow brightly through the dark.
- **`confetti`:** a little confetti pop each time you jump.
- **`trail`:** sparkles drift off behind you while you move.
- **`jetpack`:** as now.
- **`glide`:** while falling (moving down) in the air, holding jump caps your fall speed at `GEAR.glideFall`. You steer at walking speed.
- **`balloon`:** in the air, after holding jump for `JET.hold`, you rise gently towards `-GEAR.balloonUp`. There's no fuel.
- **`shell`:** a creature's bump doesn't knock you back or scatter ore. There's a small "tink" sparkle instead.
- **`boots`:** as now (`walkMul`, `stormProof`).
- **`bouncy`:** jump speed ×`GEAR.bouncyJump` (1.42, about twice the height).
- **`gecko`:** in the air, pushing into a wall makes you climb up it at climbing speed. At the top you step off onto the ledge.
- **`skates`:** every floor works like Saturn's ice, even with the Gloves on, and top speed ×`GEAR.skatesWalk`.
- **`squeak`:** a squeak sound on every other step while walking.
- **`gloves`:** as now (`digMul`, ice grip).
- **`magnet`:** every `GEAR.magnetEvery` seconds, the nearest ore or tiny gem your drill could dig within `GEAR.magnetR` cells flies to you.
  - The block becomes its layer's plain rock, so the mine's shape never changes.
  - On Rainbow Planet it pulls tiny gems only, never blocks of a big gem.
- **`boxing`:** a creature that bumps you is booped away (it spins off and poofs), and you aren't knocked back.
- **`lucky`:** chests you open give 50% more (ore pickups, or sparkles on Rainbow Planet).

### Rules

- **Wearing:** each player wears at most one item per slot, and a slot can be empty.
- **The bonus mini games:** inside a bonus room (whack-a-mole, the skate park, the claw machine, hockey, egg catch, fireworks), the wearer has no powers. The looks stay on.
- **The Moon Pup's double jump** works with any gear, as before.
- **Story locks** (rockets that need a suit piece, landing on the Sun) still read `state.suit`, which is what you own.
- **Winning a Sun Suit piece** (or the crown) puts it on both players, replacing whatever was in that slot. It's a story moment.

### The Gear page

- **Opening it:** a new coat-hanger icon in the pause menu, between the book and the sound. It works in the mine, at camp and in the Build Yard (where it only changes looks).
- **Layout:** one panel per joined player, side by side, or one in the middle when playing alone. Each player uses their own controller on their own panel.
- **Each panel shows:**
  - the four slots down the left (head, back, feet and hands icons), with a cursor;
  - the player's character, big, wearing everything;
  - the chosen item's power picture and caption.
- **Controls:**
  - up/down picks a slot;
  - left/right flips through the items owned for that slot, plus "nothing";
  - B or Start closes the page and goes back to the game.
- **When it applies:** changes are saved as you flip, and take effect as soon as the page closes.

## Rainbow Village decorations

These are sold by the Decoration Workshop, and you can buy as many of each as you like. They're placed in Rainbow Village only.

| id | Cost |
|---|---|
| `candytree` | 150 |
| `lollipop` | 80 |
| `gumdrop` | 50 |
| `canefence` | 60 |
| `fountain` | 400 |
| `cloudlamp` | 120 |
| `icecream` | 100 |
| `dinostatue` | 350 |
| `balloons` | 80 |
| `gempile` | 200 |
| `jellypond` | 250 |
| `cupcake` | 300 |

- **Placing:** it works like Earth camp's decorations. You carry one over your head, press A to put it down where there's room, and press B to put it back in the bag. Press A on one to pick it up.
- **Kept clear:** the lift, the bench, the lectern, the nest, the landing pad, the Depth Sign and empty plots.

## Saving

- **Save v12:**
  - `state.gear = { owned: [], worn: [slots, slots] }`, where `slots = { head, back, feet, hands }` (an item id or `null`). `owned` lists bought items; the Sun Suit pieces count as owned through `state.suit`.
  - `state.bases.rainbow = { plots: [null × 4], decor: { stock: {}, placed: [] } }`.
- **Migration from v11:** both players start wearing what they had. The head is the Helmet if owned, otherwise the crown; the back is the Jetpack, the feet the Boots and the hands the Gloves, each if owned. Nothing else changes.

## Code

- **`src/game/gear.js`** (pure, tested):
  - `GEAR` (the catalogue), `SLOTS`, `gearById`, `shopItems(shop)`;
  - `ownsGear(state, id)`, `buyGear(state, id)`, `wearGear(state, slot, id)` (`id = null` takes it off), `wornBy(state, slot)`;
  - `powersOf(state, slot, { off })` → a `Set` of power names;
  - `wearWon(state, id)` (both players put on a won piece).
- **`perks.js`:** `lanternRadius`, `walkMul`, `stormProof`, `digMul`, `iceGrip` and `jetpack` read the worn gear.
  - The per-player ones take a player slot.
  - The light reads whether anyone wears the Helmet.
  - `winSuitPiece` and `winSunHeart` also call `wearWon`.
- **`player.js`:** `stepPlayer` gains `glide`, `balloon`, `gecko` and `skates` options. Bouncy Feet use `jumpMul`.
- **`pets.js`:** `magnetTarget(grid, cx, cy, pickLevel, r, ok)`, the nearest diggable ore within `r` (beside `nibbleTarget`).
- **`economy.js`:** `RAINBOW_BLUEPRINTS`, with costs in `sparkle`. `PLOTS_AT.rainbow` comes from `RAINBOW_CAMP`.
- **`decor.js`:** it works per camp.
  - `decorOf(state, planet)`, plus a `planet` argument on `buyDecor`, `takeFromStock`, `canPlace`, `placeDecor` and `pickUpDecor` (default `'earth'`).
  - `RAINBOW_DECOR` items carry `camp: 'rainbow'`.
  - The Earth stall lists only Earth items, and the Decoration Workshop only Rainbow ones.
- **`tuning.js`:** `GEAR` (powers) and `RAINBOW_CAMP.plots`.
- **Art:**
  - **`src/art/gear.js`:**
    - every item's worn overlay: hats on a 16×24 canvas whose bottom 16 rows line up with the character, and back/feet/hands as 64×16 strips, one frame per character frame;
    - a power picture for every power (`power-<name>`, 16×16);
    - the slot icons;
    - the coat-hanger icon.
  - **`src/art/rainbowShops.js`:** the four shop buildings (96×80) and the 12 decorations.
  - **The pixel font** gains capital letters `A–Z` and `.,'` for the captions (appended to `FONT_CHARS`).
- **Scenes:**
  - **`gearView`** (from `suitView`) draws each player's own worn items. Mine, Camp and the Build Yard use it.
  - **`CampScene`:**
    - a `shop` zone at built shops;
    - the gear picker (`kind: 'gear'`);
    - the Decoration Workshop picker (`kind: 'decor'` with `planet`);
    - decorations at Rainbow Village;
    - gear movement powers when walking.
  - **`CampHudScene`:** renders the gear card and the caption.
  - **`MineScene`:** per-player powers, recomputed when the Gear page closes; turned off in bonus rooms (`bonus.inside(a)`); the shell and boxing in `bonk`; lucky in chests; the magnet timer; the confetti, trail and squeak effects.
  - **`GearScene`:** the Gear page. **`PauseScene`:** its icon.
- **Sound:** a `squeak` effect for the Clown Shoes, and a `boop` for the Boxing Gloves.

## Testing

- **Unit tests:**
  - the catalogue: every item has a slot, a shop and a caption, and costs are within 100–1,500;
  - `buyGear`: refuses without sparkles or for won pieces, and spends `bank.sparkle`;
  - `wearGear`: only owned items, one per slot, and `null` takes it off;
  - `powersOf`: per slot, and empty with `off`;
  - the perks read worn gear, and story locks still read `state.suit`;
  - `wearWon`;
  - the v11 → v12 migration: everyone wears what they had;
  - `stepPlayer`: glide caps the fall, balloon rises without fuel, gecko climbs a wall, skates slide on plain floor, bouncy jumps higher;
  - `magnetTarget`;
  - Rainbow blueprints and plots;
  - decorations per camp: Rainbow items are bought with sparkles and placed only in the village, and Earth's are unchanged.
- **In the browser:**
  - build all four shops (debug save with sparkles);
  - buy and wear items in each shop;
  - open the Gear page in the mine and at camp, in co-op;
  - try every power in the Rainbow mine and a couple on the Moon;
  - check that a bonus room turns powers off;
  - place Rainbow decorations;
  - screenshots throughout, and check the console for errors.
