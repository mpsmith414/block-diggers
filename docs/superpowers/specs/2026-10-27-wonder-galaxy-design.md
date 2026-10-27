# Block Diggers — The Wonder Galaxy — Design

**Date:** 2026-10-27
**Status:** the owner picked "build them all" from the pitch of eight planets, and asked for no more questions. Everything below that the owner didn't say is my call, marked as a default.

**Why:** the owner wants "a bunch more cool planets — the rocket should take you to any planet you want, a whole new section with each planet giving a new super fun and unique experience." The journey planets are all "dig down five layers". These are not. Each one is its own way to play.

## Owner decisions this spec follows

- **A whole new section** on the star map, and **the rocket goes to any planet you want**.
- **Each planet is a different experience**, not another mine.
- **All eight pitched planets get built:** Spooky, Robot, Ocean, Upside-Down, Jelly, Race, Dragon and Tiny.
- **Build it without asking.** Screenshots at the end, and nothing goes live until the owner says so (the usual workflow).

## The Wonder Galaxy on the star map

- **A second page:** the star map is now two screens wide. Page 1 is the journey, as it is today. Push **right past Rainbow Planet** and the map slides over to page 2, the Wonder Galaxy: a pink and teal swirl of a galaxy with the eight planets on a looping dotted path. Left from the first Wonder planet slides back.
- **A swirl portal** on the right edge of page 1 glows with a "→" arrow, so you can see there's more.
- **All eight are open at once**, from any rocket: no padlocks and no rockets to build. (My default: the son has already finished the journey, and "any planet you want" means no gates.)
- **Under each Wonder planet** sits its prize icon: dim until you've won it, glowing once it's yours (like the Sun Suit pieces).
- **Flying:** when the trip starts or ends at a Wonder planet, the little map rocket swoops straight there (sliding the map across if the pages differ), then the usual countdown and lift-off.
- **The Wonder Rocket:** a new swirly purple-and-teal ship flies every trip to or from a Wonder planet.

## Every Wonder planet shares a frame (`WonderScene`)

- **Landing:** the Wonder Rocket comes down onto a pad at the start of the level with flames and dust, and everyone pops out (as at the camps). It stays there.
- **Going somewhere else:** walk back to the rocket and press **A** to open the star map, then fly anywhere. The pause menu's door still goes to the title.
- **Hold B for 2 seconds** to zip back to the rocket from anywhere (a ring fills on the HUD, then a whoosh). Nobody can get stuck.
- **The goal counter** sits at the top of the screen: the planet's collectible icon and "12/40", plus the prize's silhouette. Each planet has one clear thing to collect. When the counter is full the prize unlocks, with a fanfare and the camera showing where to go.
- **The prize party:** reach the prize and you get a fanfare, confetti, the prize bouncing up over everyone, its sticker, and the prize marked won on the star map.
- **Every visit starts fresh** (collectibles come back), so a planet can be played again and again. The prize can be won again for the party; its sticker comes once.
- **Saving:** `state.wonder = { visited: [], prizes: [] }` (save v14). Landing on a Wonder planet does **not** change `state.planet`, so quitting from one brings you back to the camp you came from. Nothing else on a Wonder planet is saved.
- **Two players:** both play every planet together. The camera keeps both in view, zooming out as they spread. If one is left far behind, they hop next to the other in a bubble-pop (as the bubble works in the mine).
- **Gentle, as always:** nothing hurts, nothing is lost, and no reading is needed.
- **Characters wear their gear** (hats, outfits) everywhere, but gear powers don't apply on Wonder planets (each planet has its own moves).
- **Music:** every Wonder planet has its own song.

## The eight planets

### 1. Spooky Planet — Trick-or-Treat Street

- **The place:** a night street under a huge full moon, with purple fog, bats against the moon, porch lights and lamp posts. Ten houses in a row, a pumpkin patch, a silly graveyard (tombstones with smiley faces), and the big purple Haunted House at the far end behind an iron gate.
- **Moves:** walk and jump, like at camp. Fences, porches, crates and rooftops are platforms.
- **Knock on doors:** at a house's door an **A** prompt shows. Knock-knock, the door opens, and out comes a surprise: a shower of candy, a friendly ghost going "boo!" then giggling and dropping candy, a dancing skeleton, or a cat in a witch's hat. Every door gives candy, once per visit.
- **Carve pumpkins:** press **A** at a pumpkin and it gets a face and lights up, with one candy.
- **Candy on rooftops and in trees** to jump for.
- **Ghost friends:** three little ghosts float about. Touch one and you turn into a ghost for 6 seconds: a white sheet, floaty jumps, and a "wooo".
- **The goal:** **40 candies**. The Haunted House gate swings open. Inside the porch the Pumpkin King (a giant jack-o'-lantern) throws a party: skeletons dance, bats swirl. **Prize: the Golden Pumpkin.**

### 2. Robot Planet — Mega Bot City

- **The place:** Robot City, a blue-and-steel city with conveyor belts, crate stacks, scrap walls, blinking towers and the Robot Factory at the far end.
- **Moves:** each player climbs into their own **Mega Bot**, a giant robot three blocks tall with their character in the glass dome on top. It walks with heavy stomps.
  - **Walk into crates and scrap walls to punch them apart** (bolts fly).
  - **A jumps**. Landing is a **STOMP** that smashes the crates under you and shakes the screen.
  - **Conveyor belts** carry you along. **Spring pads** throw you high.
- **Fix the broken robots:** twelve little robots lie broken and grey, sparking, around the city (some behind crate walls or up on towers). Walk into one and it's fixed: a wrench twirl, sparkles, it turns colourful, beeps happily, and marches along behind your Mega Bot in a parade.
- **The goal:** **12 robots fixed**. The factory lights up and its doors open, and the whole parade dances. **Prize: the Golden Mega Bot** (a golden mini robot trophy).

### 3. Ocean Planet — Deep Blue Dive

- **The place:** you land on a little island with a dock, then dive into the sea. Going down: a sunny coral reef with kelp and schools of fish, a sunken pirate ship, then the glowing deep (dark blue, glowing jellyfish and an anglerfish with a lantern), and the Giant Clam at the very bottom.
- **Moves:** **swim** in any direction with the stick, drifting a little. **A** is a swim kick, a quick dash with a burst of bubbles. Above the water you walk and jump on the island. There is no air to run out of.
- **Pearls in clams:** **20 clams** sit around the sea (on the reef, in the ship's hold, in caves and in the deep). Swim to one and it snaps open and gives you its pearl.
- **Sea turtles:** touch one to ride it for a few seconds, zooming along.
- **Jellyfish** boing you gently away. **Pufferfish** puff up when you get close.
- **The goal:** **20 pearls**. The Giant Clam at the bottom opens. **Prize: the Golden Submarine.**

### 4. Upside-Down Planet — Topsy-Turvy Land

- **The place:** a long, closed-in world with a floor and a ceiling: trees grow from the ceiling, a house hangs upside down, clouds drift below and an upside-down rainbow arches overhead. A cow stands on the ceiling and moos.
- **Moves:** walk left and right. **A flips gravity**: you fall up to the ceiling and walk along it upside down. You can flip again any time, even in mid-air, so you can't get stuck.
- **Flip arrows:** glowing arrow pads flip you automatically when you run over them.
- **The goal:** **30 stars**, on the floor, on the ceiling and floating in the middle where you catch them mid-flip. Then the **Topsy Tower** at the end (standing on its head) flips the right way up with a big swoosh. **Prize: the Topsy Trophy.**

### 5. Jelly Planet — Wobble Tower

- **The place:** a tall tower of wobbly jelly blocks (red, green, yellow, purple) climbing up through pink clouds to the Jelly Castle at the very top.
- **Moves:** everything bounces. Landing on jelly bounces you back up, and the blocks squash and wobble. **Hold A as you land** for a **super bounce**. Each super bounce in a row goes higher (three levels).
- **Wafer ledges** (crispy biscuits) don't bounce. They're solid from above only, so you can jump up through them and stand on them, and a fall only drops you to the ledge below.
- **Gummy bears** wander on the ledges. Touch one and it boings you upwards.
- **Gumballs:** touch one and you blow a bubblegum bubble that floats you up a long way, then pops.
- **Jelly beans** line the way up (50 of them).
- **The goal:** **climb to the top.** The HUD shows a height meter instead of a count (the jelly beans are counted beside it, for fun). **Prize: the Jelly Crown**, at the castle.

### 6. Race Planet — Rocket Kart Rally

- **The place:** a long, sunny race track seen from the side: rolling hills, ramps over a pond, boost pads, a tunnel, a **loop-the-loop**, a jump through a hoop, and the finish line with fireworks and a crowd.
- **The racers:** each player drives a kart with their character in it, against three silly racers: the penguin, the alien and the martian.
- **Moves:** hold **right** to go and **left** to slow down. **A** hops (big air off ramps, and a spin in the air). **Boost pads** fire you forward with flames. **Coins** on the track.
- **The race:** a 3-2-1-GO start, then one long race of about 75 seconds. The racers stay close and fun to chase: they ease off when they're far ahead and speed up when far behind, so the race is always close and a child who keeps going usually wins. Your place shows as a big number on the HUD.
- **The finish:** a podium with everyone on their step and confetti, every time. **1st place wins the prize: the Golden Cup.** 2nd and 3rd get a party too; you can race again by pressing **A** on the start line, or go back to the rocket.

### 7. Dragon Planet — Sky Dragons

- **The place:** a bright sky world of floating islands with trees, waterfalls pouring off their edges, castles, rainbows and a sea of clouds below. Mama Dragon's nest sits on the highest island.
- **Moves:** each player rides their own baby dragon (green, wings flapping, the character on its back). **Fly in any direction** with the stick. **A breathes a fireball.** Islands are solid to bump along; the cloud sea bounces you back up.
- **Balloons:** **30 balloons** float in bunches around the sky. Pop them with fireballs (or by flying into them). **Rings** to fly through give a sparkle and a whoosh.
- **The goal:** **30 balloons**. Mama Dragon's nest starts to glow and she roars hello. Fly to her. **Prize: the Golden Dragon Egg.**

### 8. Tiny Planet — Bug-Sized Backyard

- **The place:** you're bug-sized in a giant's garden: grass blades taller than the screen, daisies, a garden hose, a giant cookie, a picnic blanket with a giant sandwich, a sleeping cat, a flower pot and a watering can.
- **Moves:** walk and jump, like at camp.
  - **Leaves** dip when you stand on them. **Mushroom caps** bounce.
  - **Munch through** the giant cookie and the sandwich by walking into them (crumbs fly).
  - **The ladybug taxi:** stand on the ladybug and she flies you up to the high leaves.
  - **The sleeping cat:** jump on its tummy and it bounces you sky-high, purring.
  - **Ants** march along carrying crumbs; you can ride on their backs.
- **The goal:** **25 sunflower seeds**, hidden all over the garden. Then plant them in the flower pot: a giant sunflower shoots up into the sky with you on it. **Prize: the Golden Acorn**, at the top.

## Stickers

- **Three new pages, in a new "Wonder" chapter of the book:**
  - **wonder:** one per planet for visiting it (icon: the planet).
  - **wonderprizes:** one per prize.
  - **wonderfun:** one fun moment per planet:
    - turn into a ghost;
    - stomp a crate tower;
    - ride a turtle;
    - flip 10 times;
    - get the triple super bounce;
    - do the loop-the-loop;
    - fly through a ring;
    - bounce on the cat.
- `TROPHY_COUNT` goes from 28 to 31, with three new trophy gem colours. The book grows to 300 stickers on 31 pages.

## Non-goals

- No new ores, buildings or camps; Wonder planets don't touch the bank.
- No gear powers on Wonder planets, and no pets along (my default: each planet's own moves are the point, and pets would need new behaviour on every planet).
- No saving of progress within a visit.
- Nothing about stores or selling.

## Builder's notes (my calls)

- **One scene, eight modules:** `WonderScene` (the shared frame) runs one module per planet (`src/scenes/wonder/<id>.js`). Levels are built by pure, tested generators (`src/game/wonder/<id>.js`) on their own little tile grid (not the block ids, which stay append-only and untouched).
- **Physics:** a small shared box-against-tiles mover (`src/game/wonder/body.js`, tested), with signed gravity (for Upside-Down), one-way ledges and bouncy tiles. Spooky and Tiny use it with the normal player sizes and speeds. The Race uses a height-map track instead of tiles.
- **Art and music:** drawn and composed in code like everything else. Static level tiles are baked into big render textures in chunks; things that change (crates, doors, clams) are separate sprites.
- **The HUD:** a small `WonderHud` scene with the counter (or the height meter, or the race place), the prize silhouette and the hold-B ring.
