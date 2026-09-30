# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A young child (a pre-reader) and a grown-up, playing together as couch co-op on the TV. They use game controllers: the game runs in a browser on the family PC and is streamed to the TV (Fire TV with Moonlight, Sunshine on the PC). Keyboard and phone/touch play exist but are secondary. Up to two players at once, and the child must be able to play everything alone too.

## Product Purpose

Block Diggers is a cosy pixel-art mining adventure made for one family. You dig down through layered underground worlds, collect ores and treasure, bring them home to camp, and turn them into upgrades, buildings, pets and new places to go. Success means quality time together: co-op that is genuinely fun for both the child and the grown-up playing side by side.

## Positioning

It is a personal game that grows with the child. New worlds, mini games and features are built from the family's own ideas and play sessions (the lava monster, the Moon skate park and the free-build yard all started as the family's requests). No store-bought game is shaped around this one family's co-op evenings in the same way.

## Operating Context

- **Where it's played:** on the living-room TV with two controllers, streamed from the PC.
- **Hosting:** GitHub Pages (`main` deploys live automatically). The source repository is public.
- **How it grows:** the grown-up brings requests from play sessions, then each update is designed, built, checked in the browser with screenshots, and shipped only after the grown-up approves pushing it live.

## Capabilities and Constraints

- **The game:**
  - Phaser 3, Vite and Vitest.
  - All art (pixel art drawn in code), music and sound effects are generated at runtime. There are no asset files.
- **Worlds and planets:** a journey Earth → Moon → Mars → Saturn → Dino Planet → the Sun, each with layered mines, its own camp, buildings, creatures, finds and a Heart at the bottom.
- **Things to do:**
  - a bonus mini game beside each Heart: Whack-a-Mole, Skate Park, Claw Machine, Ice Hockey, Egg Catch, Firework Launcher;
  - a sticker book;
  - pets;
  - visitors;
  - camp decorations;
  - the Build Yard (free building with blocks unlocked by exploring).
- **Two-player co-op throughout,** with the bubble to regroup.
- **No reading is needed to play:** icons, numbers and sounds only.
- **Hazards are gentle:** you never lose progress or get stuck, and creatures only bump you.
- **Saves:** old saves must always load with nothing lost (the save format migrates forward), and block ids and tileset frames are append-only. There are automatic backup copies and a downloadable backup file.
- **Privacy:** the repository is public, so it must never contain family names or other personal details.
- **Controls:**
  - on the controller, A is jump/use, B holds to go home, Y is pet trick/bubble, and LB/RB pick a block in the Build Yard;
  - the phone's touch controls cover only A and home.

## Brand Commitments

- **The name:** Block Diggers.
- **Voice:** playful, warm and silly (burps, pee-yew rotten eggs, lava monsters), never scary or punishing.
- **Characters:** the four playable characters (miner, fox, robot, dino) and the established pixel-art look are part of the product's identity.

## Evidence on Hand

- **The feature record:** `README.md`, with 256 stickers on 26 pages.
- **Design specs and plans** for every update: `docs/superpowers/specs/` and `docs/superpowers/plans/`.
- **Trailer tooling:** `tools/trailer/` and `docs/trailer/`.
- **What doesn't exist:** there are no testimonials, reviews, player counts or marketing claims, and none should be invented. The game has one family as its audience.

## Product Principles

1. **Built for two on one couch.** Every feature should work, and be fun, with a grown-up and a child playing together.
2. **A young child can do it alone.** No reading, no dead ends, and failure is gentle and funny.
3. **The child's ideas come first.** His requests shape what gets built, and they should be recognisable when they ship.
4. **Never lose his progress.** Saves, stickers and builds are treasured; changes must carry them forward.
5. **Always something new to find.** Each trip should offer a surprise, a sticker or a next goal.

## Accessibility & Inclusion

- **Pre-reader:** all information and prompts must be understandable through icons, numbers, colour, animation and sound. Text is only acceptable in grown-up-only areas (such as the backup panel).
- **Big targets:** controls and on-screen targets must be comfortable for small hands on a controller, and readable on a TV across a room.
