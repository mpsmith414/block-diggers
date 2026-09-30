---
name: Block Diggers
description: A cosy pixel-art couch arcade for a pre-reader and a grown-up, read from across the living room.
colors:
  parchment: "#f4e4c1"
  saddle-leather: "#8a5a34"
  cocoa-ink: "#4a3222"
  plum-night: "#2a1d2e"
  twilight: "#1b1428"
  go-green: "#4cc24a"
  treasure-gold: "#f5c629"
  not-yet-red: "#d0463a"
  marquee-yellow: "#ffe066"
  book-leather: "#7a3f2c"
  book-leather-dark: "#5a2a1c"
  book-page: "#f8ecd0"
  sticker-cream: "#fffaf0"
  blush-pink: "#ff8fa3"
  miner-blue: "#4aa3ff"
  fox-orange: "#f08a3c"
  robot-steel: "#9aa4b0"
  dino-green: "#5cc26a"
typography:
  numeral:
    fontFamily: "pixel (4×6 bitmap, drawn in code)"
    fontSize: "12px (glyph ×2 on the 480×270 canvas)"
    lineHeight: 1
  numeral-small:
    fontFamily: "pixel (4×6 bitmap, drawn in code)"
    fontSize: "6px (glyph ×1)"
    lineHeight: 1
rounded:
  hud: "3px"
  panel: "5px"
  slot: "7px"
  bar: "8px"
  book: "10px"
spacing:
  rim: "2px"
  inset: "4px"
  gap: "8px"
  tile: "16px"
components:
  paper-panel:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.cocoa-ink}"
    rounded: "{rounded.panel}"
    padding: "2px rim, 4px+ content inset"
  hud-card:
    backgroundColor: "{colors.parchment}"
    textColor: "{colors.cocoa-ink}"
    rounded: "{rounded.hud}"
    height: "20px"
  a-button-prompt:
    backgroundColor: "{colors.go-green}"
    textColor: "#ffffff"
    size: "10px"
  sticker-slot:
    backgroundColor: "{colors.treasure-gold}"
    rounded: "{rounded.slot}"
    size: "48px"
  sticker-book:
    backgroundColor: "{colors.book-leather}"
    rounded: "{rounded.book}"
  block-bar:
    backgroundColor: "{colors.parchment}"
    rounded: "{rounded.bar}"
    height: "36px"
  scoreboard:
    backgroundColor: "{colors.twilight}"
    textColor: "{colors.marquee-yellow}"
    width: "64px"
    height: "36px"
---

# Design System: Block Diggers

## Overview

**Creative North Star: "The Cosy Couch Arcade"**

Block Diggers is a storybook you can play. Everything a player touches, from menus to the sticker book to the price tags at camp, is made of warm parchment with a saddle-leather rim, like a well-loved picture book held open on the sofa. Arcade energy happens *on top of* that paper: big icons, chunky numbers, marquee bulbs, confetti, a green A button that says "press me". The storybook sets the warmth; the arcade supplies the punch.

The world is drawn at 480×270 in hard-edged pixel art and scaled up to fill a living-room TV. Every sprite wears the same plum-black outline, so creatures, blocks and UI all feel like they came out of one hand-drawn box. The mood is cosy and warm, silly and playful, bright and colourful, and full of wonder and discovery. Mines are allowed to be deep and dark, because the lantern glow and the colours of the finds carry the warmth.

The system is built for a pre-reader. Information travels by icon, colour, number, motion and sound. Words exist only in grown-up corners (the backup panel). Screens stay sparse: one clear thing to look at, readable from across a room.

**Key Characteristics:**
- Warm parchment and leather panels with a soft drop shadow; never glossy, never glassy.
- One plum-black outline (#2a1d2e) around everything drawn.
- Numbers-only bitmap type, always at least ×2 on screen.
- Green means "go / press / you can", gold means "treasure / reward", red numbers mean "not yet".
- Arcade flourish (bulbs, confetti, marquee yellow) lives inside the bonus rooms and reward moments, not in everyday UI.
- Chunky, low-detail pixel art at 16px per tile.

## Colors

A warm, sun-faded storybook base (parchment, leather, cocoa) with a small set of bright, saturated "toy" accents that each mean one thing.

### Primary
- **Go Green** (#4cc24a): the A button and every "you can do this" signal. It is the glow around a camp building you can afford and the face of the A prompt that floats over anything usable. When a child sees green, pressing A does something.

### Secondary
- **Treasure Gold** (#f5c629): rewards. Sticker frames, toast highlights, stars and gems glinting. Gold is earned, never decorative filler.
- **Marquee Yellow** (#ffe066): arcade light. Scoreboard numbers, sparkles, bulbs and pet glow. It is the "something exciting is happening" colour.

### Tertiary
- **Not-Yet Red** (#d0463a): a price you can't pay *yet*. Used only to tint a number red. It is never a warning banner, never a failure screen.
- **Character colours** (Miner Blue #4aa3ff, Fox Orange #f08a3c, Robot Steel #9aa4b0, Dino Green #5cc26a): identify who is who in co-op (HUD card rims, name-free player markers).
- **Blush Pink** (#ff8fa3): cheeks on characters and creatures. The small touch that makes everything cute.

### Neutral
- **Parchment** (#f4e4c1): the face of every panel, HUD card, price tag and the block bar.
- **Saddle Leather** (#8a5a34): the 2px rim around parchment.
- **Cocoa Ink** (#4a3222): numbers and line work on parchment. Never pure black.
- **Plum Night** (#2a1d2e): the outline on every sprite and tile.
- **Twilight** (#1b1428): the game's backdrop behind the canvas and the face of the bonus-room scoreboards.
- **Book Leather** (#7a3f2c), **Book Leather Dark** (#5a2a1c), **Book Page** (#f8ecd0), **Sticker Cream** (#fffaf0): the sticker book only, a slightly richer and redder leather so the book feels like a treasured object rather than a menu.

### Named Rules
**The One Meaning Rule.** Each accent means one thing: green is "press / can", gold is "reward", red is "not yet". Don't use green for decoration or red for danger.

**The No Pure Black Rule.** Outlines are Plum Night, ink is Cocoa Ink, and shadows are black at 12–35% opacity. Solid #000 never appears as a colour.

**The Gentle Sky Rule.** Camp skies move through four soft gradients (morning, day, sunset, night) with no harsh neon. Night is deep blue-violet (#141a3a → #3a3a6e), never black.

## Typography

**Numeral Font:** `pixel`, a 4×6 bitmap font drawn in code. The only characters are `0123456789x+-/:!?` and space.

**Character:** there is deliberately no word typeface. The numerals are chunky, square and friendly, like the digits on a toy cash register, and they sit happily next to icons.

### Hierarchy
- **Numeral** (×2, 12px tall on the canvas): counts, prices, scores and sticker totals. The default on-screen size.
- **Numeral Small** (×1, 6px tall): rare secondary labels a grown-up might read. Never the only carrier of meaning for the child.
- **Scoreboard** (×2, tinted Marquee Yellow on Twilight): bonus-game scores.

### Named Rules
**The Picture-Book Rule.** No words the child must read. If meaning needs a word, use an icon, a colour, a number, a motion or a sound instead. Text is allowed only in grown-up-only surfaces (the backup panel, which uses DOM text).

**The Two-Times Rule.** Numbers the child needs are drawn at ×2 or larger, so they stay readable on a TV across a room.

## Layout

The game renders to a fixed 480×270 canvas (`pixelArt`, `roundPixels`) and scales with FIT to the screen, so layout is authored once in canvas pixels. The world grid is 16px tiles. Spacing inside UI follows a small pixel rhythm: a 2px rim, a 4px content inset, 8px between items, and a 16px tile for larger spacing.

HUD elements hug the screen edges and corners, leaving the centre for play. In co-op, each player's HUD card sits at their own side, trimmed in their character colour. The Build Yard block bar is centred along the bottom. Modal surfaces (the sticker book, the pause and summary panels) sit centred over the world, and the world stays visible around them.

Density is low. Each panel has one job and shows a handful of big icons, never a list. Touch controls on a phone add only the A and home buttons.

## Elevation & Depth

The system is a hybrid: pixel art is flat, and paper objects "sit on" the world with one soft offset drop shadow. The shadow is black at 12–35% opacity, offset about 2px right and 3px down, and has the same rounded shape as the object (no blur, since pixel art has none). Depth in the world comes from light instead: lantern and creature glows cut through dark mines, and bonus rooms light up with bulbs.

### Shadow Vocabulary
- **Panel shadow** (black 25%, offset 2px, 3px, same radius): paper panels and price tags at camp.
- **Book shadow** (black 30%, offset 6px, 6px): the sticker book, the heaviest object on screen.
- **Slot shadow** (black 12%, offset 2px, 3px): sticker slots resting on the book page.
- **HUD backing** (black 35%, 4px larger than the gauge): behind thin gauges so they read on any background.

### Named Rules
**The Paper Sits Down Rule.** A shadow always falls down and to the right, as if lit from the top-left lantern. It is never a glow, never centred, and never coloured (except green's "you can" glow).

## Shapes

Soft rounded rectangles built from nested fills: shadow, then leather rim, then parchment face, each 2px inside the last. Radii grow with the object's size: 3px on HUD cards, 5px on panels, 7px on sticker slots and the "can afford" glow, 8px on the block bar, and 10px on the sticker book. Sprites and tiles keep crisp pixel silhouettes with a 1px plum outline. Rock and ore tiles are mirrored one of four ways per cell so walls don't repeat; anything with an up and a down keeps its orientation.

## Components

### Paper Panel
*Tactile and handmade, like a card cut from a storybook.* A 2px Saddle Leather rim, a Parchment face (radius 4px inside a 5px rim), a panel shadow, and Cocoa Ink numbers. Used for camp price tags, the pause and summary screens, and toasts. When the item is available, a Go Green glow at 50% opacity sits 3px outside the panel.

### HUD Card
*Small and always there.* 20px tall, a Parchment face with a 1px leather rim at radius 3–4px, carrying an icon and a ×2 numeral. Each player's portrait card uses their character colour as the outer ring.

### A-Button Prompt
*The friendliest thing on screen.* A 10×10 Go Green button (#4cc24a, darker #2f8f34 underside, #1f4a1f outline) with a white A. It bobs gently over anything that can be used. On camp price panels it sits in the corner at 1.4×, fading to 35% when you can't afford the item yet. The rule: nothing is ever used by walking into it. Standing near shows the prompt; pressing A uses it.

### Sticker Slot
*A little gold frame waiting to be filled.* 48px square with a Treasure Gold frame (radius 7px), a Sticker Cream inside inset 3px, and the slot shadow. An empty slot shows a faint silhouette. A filled slot shows the sticker art.

### Sticker Book
*The treasure chest of the game.* A Book Leather cover with a darker leather rim (radius 10px), two Book Page leaves, and tab chips along the edge that lift 4px when selected (unselected tabs are a duller tan, #d8c49a).

### Block Bar (Build Yard)
*A toy tray.* A Parchment strip at 92% opacity with a 2px leather stroke and 8px radius, 36px tall, centred at the bottom. It shows the chosen block large in the middle with its neighbours on either side, and LB/RB flip through them.

### Scoreboard (Bonus Rooms)
*A little arcade marquee.* A 64×36 Twilight board with a ×2 Marquee Yellow score and a row of 20 tiny bulbs underneath that act as the timer. Lit bulbs alternate yellow with a room accent (orange, pink or red); spent bulbs dim to a dark tone.

### Motion
Motion is soft and bouncy. Idle bobs and floats use Sine easeInOut. Things arriving (panels, rewards, stickers) pop in with Back easeOut. Flying ores and quick moves use Quad easeOut. Every reward pairs motion with a sound and a sparkle.

## Do's and Don'ts

### Do:
- **Do** build every panel as shadow → Saddle Leather rim (2px) → Parchment face, in the radius steps above.
- **Do** outline every new sprite or tile in Plum Night (#2a1d2e) at 1px, drawn at 16px per tile.
- **Do** carry meaning with icon + colour + number + sound, so a pre-reader never needs a word.
- **Do** draw any number the child needs at ×2 or larger.
- **Do** use Go Green only for "press A / you can", Treasure Gold for rewards, and red numbers for "not yet".
- **Do** save arcade flourishes (bulbs, Marquee Yellow, confetti) for bonus rooms and reward moments.
- **Do** make new things pop in with a Back easeOut bounce and a happy sound.

### Don't:
- **Don't** add text menus, word labels or instructions to anything the child uses.
- **Don't** go realistic or detailed: no gradients on sprites, no textures finer than the pixel grid, no anti-aliasing.
- **Don't** use harsh neon, strobing or rapid full-screen flashing, even in the arcade rooms.
- **Don't** use pure black (#000000) as a colour, or blurred and glowing drop shadows on paper.
- **Don't** use red as danger or failure. Nothing in the game punishes; red only means "not enough yet".
- **Don't** make anything start by walking into it. Show the A prompt and wait for the press.
