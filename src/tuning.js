// Every tunable number in one place, so playtests only touch this file.

export const TILE = 16;

// ---- the mine ----
export const MINE_W = 48;
export const MINE_H = 390;
export const SKY_ROWS = 6; // open rows above row 0 before an invisible ceiling
export const SHAFT_X = 24;
export const SHAFT_DEPTH = 4; // shaft ladders in rows 0..SHAFT_DEPTH-1
export const LAYERS = {
  dirt: { top: 1, bottom: 40 },
  stone: { top: 41, bottom: 95 },
  deep: { top: 96, bottom: 148 },
  crystal: { top: 149, bottom: 188 },
  dino: { top: 189, bottom: 238 },
  brick: { top: 239, bottom: 288 },
  meteor: { top: 289, bottom: 338 },
  core: { top: 339, bottom: 388 },
};

// The Moon (planet 1): five layers of fifty rows, bedrock at row 251.
export const MOON_H = 252;
export const MOON_LAYERS = {
  craters: { top: 1, bottom: 50 },
  cheesecaves: { top: 51, bottom: 100 },
  mooncrystal: { top: 101, bottom: 150 },
  alienbase: { top: 151, bottom: 200 },
  mooncore: { top: 201, bottom: 250 },
};

// How the Moon is made: ore veins (per layer), caves, and things to find.
export const MOON_GEN = {
  ores: {
    craters: { veins: 42, weights: { moonstone: 1 } },
    cheesecaves: { veins: 50, weights: { cheese: 5, moonstone: 1 } },
    mooncrystal: { veins: 44, weights: { spacegem: 5, moonstone: 1 } },
    alienbase: { veins: 44, weights: { gizmo: 5, spacegem: 1 } },
    mooncore: { veins: 46, weights: { moonstone: 1, spacegem: 1, gizmo: 1 } },
  },
  caves: {
    craters: { count: 7, radius: 2, length: [22, 36] },
    cheesecaves: { count: 10, radius: 2.2, length: [24, 40] },
    mooncrystal: { count: 10, radius: 3, length: [26, 42] },
    alienbase: { count: 9, radius: 2, length: [26, 44] },
    mooncore: { count: 8, radius: 2.4, length: [24, 40] },
  },
  chests: { craters: 1, cheesecaves: 1, mooncrystal: 2, alienbase: 1, mooncore: 1 },
  meteorites: 5,
  wheels: 6, // cheese wheels, in pairs
  chimes: 6,
  teleports: 3,
};

// Mars (planet 2): five layers of fifty rows, bedrock at row 251.
export const MARS_H = 252;
export const MARS_LAYERS = {
  dunes: { top: 1, bottom: 50 },
  rovers: { top: 51, bottom: 100 },
  volcano: { top: 101, bottom: 150 },
  ruins: { top: 151, bottom: 200 },
  marscore: { top: 201, bottom: 250 },
};

// How Mars is made: ore veins, caves, and things to find. Each layer has its
// own ore (the core has all of them), so a layer's rock always matches its ore.
export const MARS_GEN = {
  ores: {
    dunes: { veins: 42, weights: { ruby: 1 } },
    rovers: { veins: 50, weights: { bolt: 1 } },
    volcano: { veins: 44, weights: { opal: 1 } },
    ruins: { veins: 44, weights: { coin: 1 } },
    marscore: { veins: 46, weights: { ruby: 1, opal: 1, coin: 1 } },
  },
  caves: {
    dunes: { count: 7, radius: 2.2, length: [22, 36] },
    rovers: { count: 9, radius: 2.2, length: [24, 40] },
    volcano: { count: 10, radius: 2.8, length: [26, 42] },
    ruins: { count: 9, radius: 2, length: [26, 44] },
    marscore: { count: 8, radius: 2.4, length: [24, 40] },
  },
  chests: { dunes: 1, rovers: 1, volcano: 1, ruins: 1, marscore: 1 },
  rovers: 2, // old rovers to open
  geysers: 7,
  lavaPools: 6,
  vaults: 2,
};

// Saturn (planet 3): five layers of fifty rows, bedrock at row 251.
export const SATURN_H = 252;
export const SATURN_LAYERS = {
  rings: { top: 1, bottom: 50 },
  icecream: { top: 51, bottom: 100 },
  aurora: { top: 101, bottom: 150 },
  comets: { top: 151, bottom: 200 },
  saturncore: { top: 201, bottom: 250 },
};

// How Saturn is made (each layer its own ore; the core has several).
export const SATURN_GEN = {
  ores: {
    rings: { veins: 42, weights: { frost: 1 } },
    icecream: { veins: 50, weights: { icecream: 1 } },
    aurora: { veins: 44, weights: { pearl: 1 } },
    comets: { veins: 44, weights: { comet: 1 } },
    saturncore: { veins: 46, weights: { frost: 1, pearl: 1, comet: 1 } },
  },
  caves: {
    rings: { count: 8, radius: 2.4, length: [24, 40] },
    icecream: { count: 10, radius: 2.2, length: [24, 40] },
    aurora: { count: 10, radius: 3, length: [26, 42] },
    comets: { count: 9, radius: 2.2, length: [26, 44] },
    saturncore: { count: 8, radius: 2.4, length: [24, 40] },
  },
  chests: { rings: 1, icecream: 1, aurora: 1, comets: 1, saturncore: 1 },
  snowballs: 6, // in pairs, to roll together into a snowman
  globes: 2,
};

// Dino Planet (planet 4): five layers of fifty rows, bedrock at row 251.
export const DINO_H = 252;
export const DINO_LAYERS = {
  jungle: { top: 1, bottom: 50 },
  bonebeds: { top: 51, bottom: 100 },
  swamp: { top: 101, bottom: 150 },
  lavalands: { top: 151, bottom: 200 },
  dinocore: { top: 201, bottom: 250 },
};

// How Dino Planet is made (each layer its own ore; the core has several).
export const DINO_GEN = {
  ores: {
    jungle: { veins: 42, weights: { jade: 1 } },
    bonebeds: { veins: 50, weights: { bone: 1 } },
    swamp: { veins: 44, weights: { tooth: 1 } },
    lavalands: { veins: 44, weights: { obsidian: 1 } },
    dinocore: { veins: 46, weights: { bone: 1, tooth: 1, obsidian: 1 } },
  },
  caves: {
    jungle: { count: 8, radius: 2.4, length: [24, 40] },
    bonebeds: { count: 9, radius: 2.2, length: [24, 40] },
    swamp: { count: 10, radius: 2.8, length: [26, 42] },
    lavalands: { count: 9, radius: 2.4, length: [26, 44] },
    dinocore: { count: 8, radius: 2.4, length: [24, 40] },
  },
  chests: { jungle: 1, bonebeds: 1, swamp: 1, lavalands: 1, dinocore: 1 },
  parasaurs: 3,
  nests: 2,
  pools: 6, // swamp water
  lavaPools: 6,
};

// The Sun (the finale): six layers of forty rows, bedrock at row 241.
export const SUN_H = 242;
export const SUN_LAYERS = {
  corona: { top: 1, bottom: 40 },
  sunspots: { top: 41, bottom: 80 },
  plasmasea: { top: 81, bottom: 120 },
  radiance: { top: 121, bottom: 160 },
  fusion: { top: 161, bottom: 200 },
  suncore: { top: 201, bottom: 240 },
};

// How the Sun is made (each of the first four layers has its own ore; the
// forge and the core have them all).
export const SUN_GEN = {
  ores: {
    corona: { veins: 36, weights: { sunstone: 1 } },
    sunspots: { veins: 40, weights: { flare: 1 } },
    plasmasea: { veins: 36, weights: { plasma: 1 } },
    radiance: { veins: 38, weights: { nova: 1 } },
    fusion: { veins: 40, weights: { sunstone: 1, flare: 1, plasma: 1, nova: 1 } },
    suncore: { veins: 40, weights: { flare: 1, plasma: 1, nova: 1 } },
  },
  caves: {
    corona: { count: 7, radius: 2.4, length: [22, 36] },
    sunspots: { count: 8, radius: 2.2, length: [22, 38] },
    plasmasea: { count: 9, radius: 2.8, length: [24, 40] },
    radiance: { count: 8, radius: 2.4, length: [24, 40] },
    fusion: { count: 8, radius: 2.4, length: [24, 40] },
    suncore: { count: 7, radius: 2.4, length: [22, 36] },
  },
  chests: { corona: 1, sunspots: 1, plasmasea: 1, radiance: 1, fusion: 1, suncore: 1 },
  flowers: 3,
  lavaPools: 9,
};

// Each layer's colour on the depth meter and the trip summary.
export const LAYER_COLORS = {
  dirt: 0x8a5a34, stone: 0x7d7d86, deep: 0x3f3d4f, crystal: 0x6a4fa8,
  dino: 0xd0a868, brick: 0xe0403a, meteor: 0x2a2860, core: 0xff7a2a,
  craters: 0xb8b8c8, cheesecaves: 0xffd84a, mooncrystal: 0x8a6ae0, alienbase: 0x5ad07a, mooncore: 0xc8f0ff,
  dunes: 0xe0703a, rovers: 0xa86a4a, volcano: 0x4a3a3a, ruins: 0xe0b060, marscore: 0xff5a2a,
  rings: 0xc8f0ff, icecream: 0xffb0d8, aurora: 0x3a6ab8, comets: 0x2a3a6a, saturncore: 0xffe8a0,
  jungle: 0x5ab04a, bonebeds: 0xe8dcc0, swamp: 0x4a6a3a, lavalands: 0x6a2a2a, dinocore: 0xf0c050,
  corona: 0xffd84a, sunspots: 0x8a4a2a, plasmasea: 0xff6ab0, radiance: 0xfff4c0, fusion: 0xff8a2a, suncore: 0xffffff,
};

// Ore veins: how many veins per 1000 host cells, and which ores (weights).
export const ORE_VEINS = {
  dirt: { per1000: 20, weights: { coal: 1 } },
  stone: { per1000: 36, weights: { coal: 2, iron: 4, gold: 1.6 } },
  deep: { per1000: 34, weights: { gold: 3, diamond: 1.5, emerald: 1.2 } },
  crystal: { per1000: 44, weights: { gold: 2, diamond: 2, emerald: 1.6 } },
  // deeper layers: one signature ore each (gems come from geodes and meteorites)
  dino: { per1000: 34, weights: { amber: 1 } },
  brick: { per1000: 36, weights: { brick: 1 } },
  meteor: { per1000: 30, weights: { star: 1 } },
  core: { per1000: 30, weights: { star: 1 } },
};
export const VEIN_SIZE = { min: 2, max: 5 };
export const GRAVEL_POCKETS = { stone: 10, deep: 8, size: { min: 3, max: 6 } };
export const CAVES = {
  dirt: { count: 5, length: { min: 10, max: 22 }, radius: 1 },
  stone: { count: 7, length: { min: 18, max: 32 }, radius: 1.5 },
  deep: { count: 8, length: { min: 22, max: 40 }, radius: 2 },
  crystal: { count: 9, length: { min: 26, max: 44 }, radius: 2.4 },
  dino: { count: 9, length: { min: 26, max: 44 }, radius: 2.2 },
  brick: { count: 8, length: { min: 24, max: 40 }, radius: 2 },
  meteor: { count: 10, length: { min: 28, max: 46 }, radius: 2.6 },
  core: { count: 8, length: { min: 24, max: 40 }, radius: 2.2 },
};
export const LAVA_POOLS = 7;
export const CHESTS = 3; // in stone + deep; the crystal layer adds one more
export const FINDS = { geodes: 5, fossils: 4, booms: 6, boulders: 4, bigChests: 1, eggs: 2, waterPools: 9, puddles: 6, oases: 5, springs: 7, meteorites: 6, coreLava: 8, skeletons: 3 };

// ---- mining (seconds) by hardness and tool level ----
// Tools: 0 wood, 1 iron, 2 diamond, 3 amber pick, 4 brick drill, 5 star drill,
// 6 moon drill, 7 crystal drill, 8 laser drill, 9 ruby drill, 10 opal drill,
// 11 mega drill, 12 frost drill, 13 pearl drill, 14 comet drill, 15 jungle drill,
// 16 tooth drill, 17 obsidian drill, 18 sun drill, 19 flare drill, 20 nova drill.
const X = Infinity;
export const MINE_TIME = {
  soft: [0.25, 0.2, 0.12, 0.1, 0.08, 0.07, 0.06, 0.06, 0.05, 0.05, 0.05, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04, 0.04],
  stone: [0.6, 0.4, 0.25, 0.2, 0.16, 0.13, 0.12, 0.11, 0.1, 0.1, 0.09, 0.08, 0.07, 0.06, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05],
  deep: [X, 0.7, 0.4, 0.3, 0.25, 0.2, 0.18, 0.16, 0.14, 0.13, 0.12, 0.11, 0.1, 0.09, 0.08, 0.07, 0.06, 0.05, 0.05, 0.05, 0.05],
  crystal: [X, X, 0.6, 0.45, 0.35, 0.3, 0.26, 0.23, 0.2, 0.18, 0.17, 0.15, 0.14, 0.13, 0.12, 0.11, 0.1, 0.09, 0.08, 0.07, 0.06],
  sand: [X, X, 0.5, 0.4, 0.3, 0.25, 0.22, 0.2, 0.18, 0.16, 0.15, 0.14, 0.13, 0.12, 0.11, 0.1, 0.09, 0.08, 0.07, 0.06, 0.05],
  bricks: [X, X, X, 0.5, 0.4, 0.3, 0.26, 0.23, 0.2, 0.18, 0.17, 0.15, 0.14, 0.13, 0.12, 0.11, 0.1, 0.09, 0.08, 0.07, 0.06],
  meteor: [X, X, X, X, 0.5, 0.4, 0.34, 0.3, 0.26, 0.24, 0.22, 0.2, 0.18, 0.16, 0.14, 0.13, 0.12, 0.11, 0.1, 0.09, 0.08],
  core: [X, X, X, X, X, 0.5, 0.42, 0.36, 0.3, 0.27, 0.25, 0.22, 0.2, 0.18, 0.16, 0.14, 0.13, 0.12, 0.11, 0.1, 0.09],
  moon: [X, X, 0.6, 0.5, 0.4, 0.3, 0.26, 0.23, 0.2, 0.18, 0.17, 0.15, 0.14, 0.13, 0.12, 0.11, 0.1, 0.09, 0.08, 0.07, 0.06],
  cheese: [X, X, 0.3, 0.25, 0.2, 0.15, 0.13, 0.12, 0.1, 0.09, 0.09, 0.08, 0.07, 0.06, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05],
  mooncrystal: [X, X, X, X, X, X, 0.45, 0.36, 0.3, 0.27, 0.25, 0.22, 0.2, 0.18, 0.16, 0.14, 0.13, 0.12, 0.11, 0.1, 0.09],
  alien: [X, X, X, X, X, X, X, 0.45, 0.36, 0.32, 0.29, 0.26, 0.23, 0.21, 0.19, 0.17, 0.15, 0.14, 0.13, 0.12, 0.11],
  mooncore: [X, X, X, X, X, X, X, X, 0.45, 0.38, 0.34, 0.3, 0.27, 0.24, 0.22, 0.2, 0.18, 0.16, 0.14, 0.13, 0.12],
  // Mars: the dunes and the rover graveyard dig with the Laser Drill you arrive with
  marsrock: [X, X, X, X, X, X, X, X, 0.34, 0.3, 0.27, 0.24, 0.22, 0.2, 0.18, 0.16, 0.14, 0.13, 0.12, 0.11, 0.1],
  rust: [X, X, X, X, X, X, X, X, 0.4, 0.34, 0.3, 0.27, 0.24, 0.22, 0.2, 0.18, 0.16, 0.14, 0.13, 0.12, 0.11],
  basalt: [X, X, X, X, X, X, X, X, X, 0.45, 0.38, 0.32, 0.29, 0.26, 0.23, 0.21, 0.19, 0.17, 0.15, 0.14, 0.13],
  ruin: [X, X, X, X, X, X, X, X, X, X, 0.45, 0.38, 0.34, 0.31, 0.28, 0.25, 0.23, 0.21, 0.19, 0.17, 0.15],
  marscore: [X, X, X, X, X, X, X, X, X, X, X, 0.45, 0.41, 0.37, 0.33, 0.3, 0.27, 0.24, 0.22, 0.2, 0.18],
  // Saturn: the rings and the ice cream caves dig with the Mega Drill you arrive with
  ice: [X, X, X, X, X, X, X, X, X, X, X, 0.34, 0.3, 0.27, 0.24, 0.22, 0.2, 0.18, 0.16, 0.14, 0.13],
  softserve: [X, X, X, X, X, X, X, X, X, X, X, 0.2, 0.18, 0.16, 0.14, 0.13, 0.12, 0.11, 0.1, 0.09, 0.08],
  aurora: [X, X, X, X, X, X, X, X, X, X, X, X, 0.45, 0.38, 0.32, 0.29, 0.26, 0.23, 0.21, 0.19, 0.17],
  cometrock: [X, X, X, X, X, X, X, X, X, X, X, X, X, 0.45, 0.38, 0.34, 0.31, 0.28, 0.25, 0.23, 0.21],
  saturncore: [X, X, X, X, X, X, X, X, X, X, X, X, X, X, 0.45, 0.41, 0.37, 0.33, 0.3, 0.27, 0.24],
  // Dino Planet: the jungle and the bone beds dig with the Comet Drill you arrive with
  jungle: [X, X, X, X, X, X, X, X, X, X, X, X, X, X, 0.34, 0.3, 0.27, 0.24, 0.22, 0.2, 0.18],
  fossilrock: [X, X, X, X, X, X, X, X, X, X, X, X, X, X, 0.38, 0.33, 0.29, 0.26, 0.23, 0.21, 0.19],
  swampmud: [X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, 0.45, 0.38, 0.32, 0.29, 0.26, 0.23],
  volcanic: [X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, 0.45, 0.38, 0.34, 0.31, 0.28],
  dinocore: [X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, 0.45, 0.41, 0.37, 0.33],
  // the Sun: the corona and the sunspots dig with the Obsidian Drill you arrive with
  corona: [X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, 0.3, 0.27, 0.24, 0.21],
  sunspot: [X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, 0.34, 0.3, 0.27, 0.24],
  plasmarock: [X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, 0.4, 0.34, 0.3],
  radiant: [X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, 0.4, 0.34],
  fusionrock: [X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, 0.44, 0.38],
  suncore: [X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, 0.42],
  bedrock: [X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X, X],
};

// ---- the player (pixels, seconds) ----
export const PLAYER = {
  w: 12,
  h: 14,
  walkSpeed: 72,
  climbSpeed: 64,
  gravity: 900,
  maxFall: 420,
  jumpSpeed: 190, // ≈ 1.25 blocks high
  airJump: 0.9, // the Moon Pup's double jump, as a share of a jump
  climbSnap: 10, // how fast x eases to the ladder column (1/s)
  knockSpeed: 110,
  knockTime: 0.25,
  knockLift: 170,
  lavaHop: 260,
  springSpeed: 330, // bounce off a spring block (about 4 blocks high)
  swimGravity: 0.25, // fraction of normal gravity in water
  swimMaxFall: 50,
  swimUp: 70,
  swimSlow: 0.75, // walking speed in water
};

// ---- upgrades: value per level ----
// Playtest (bot, 2026-09-26): 20 filled with coal in ~20 s, before reaching iron.
export const BACKPACK = [30, 60, 120, 180, 250, 320, 400, 500, 620, 750];
export const LANTERN = [3, 5, 7, 9, 11, 13, 15, 17, 19, 21]; // light radius in blocks

// ---- pickups ----
export const PICKUP = { size: 8, gravity: 600, scatterTtl: 10, scatterDelay: 0.6, magnetRadius: 44, magnetSpeed: 160 };

// ---- building perks ----
export const PERKS = { houseBonus: 10, gardenPerTrip: 3, gardenMax: 12, penMax: 3, cartRow: 42, factoryCheese: 3, headlamp: 2, bootsSpeed: 1.3, roverPack: 1.5, stormRubies: 3, glovesDig: 1.25, dragonLight: 4 };

// ---- camera ----
export const CAMERA = { maxZoom: 1.5, minZoom: 0.5, margin: 40 };

// ---- hazards ----
export const BONK = { invuln: 1.5, scatter: 3 };
export const SLIME = { hopEvery: 1.4, hopSpeed: 150, hopDrift: 45, gravity: 700, max: 6 };
export const BAT = { speed: 34, waveSpeed: 3, waveHeight: 6, max: 4 };
export const GRAVEL = { shake: 0.5, gravity: 700, maxFall: 360 };
export const SPAWN = { every: 1.5, despawnRows: 40 };

// ---- finds ----
export const FUSE = 1.5; // seconds a boom block flashes before going poof
export const PUSH_TIME = 0.5; // seconds of pushing to roll a boulder
export const GOLDEN_SLIME = 0.08;

// ---- the player's own requests ----
// the meteor field (and the Moon) have low gravity: big floaty jumps
export const LOW_GRAVITY = 0.45;

// the silly things
export const SILLY = {
  sneezeMin: 18, sneezeMax: 30, // dusty blocks dug between sneezes
  dizzyRows: 6, dizzyTime: 1.5,
  sockChance: 0.2,
  ducks: 3, cushions: 4, cushionFlat: 3,
  voiceEvery: [4, 9], // seconds between creature noises
};

export const POWERUPS = {
  lavaTime: 8, // seconds as a lava monster
  drinkAfter: 1, // seconds in water before you start drinking
  drinkTime: 1.4, // glug glug glug… burp
  zoomTime: 6, // zoomies after a drink
  zoomSpeed: 1.5,
  drinkCooldown: 3, // seconds out of the water before you can drink again
};

// ---- pets ----
export const PETS = { scale: 0.7, goldenEggGold: 6, sniffEvery: 6, sniffRange: 10, bugLight: 2.6, fetchRange: 80, speed: 160, roarEvery: 8, roarRange: 5, parkAmber: 2 };

// ---- bubble to partner ----
export const BUBBLE = { speed: 220, minDistance: 32 };

// ---- camp (cells) ----
export const CAMP = {
  w: 108,
  h: 14,
  ground: 11, // first solid row
  shaftX: 5,
  benchX: 10,
  lecternX: 12,
  stallX: 63,
  fireX: 15,
  plots: [19, 26, 33, 40, 47, 54, 86, 93, 100],
  plotW: 6,
  buildSeconds: 5,
  nestX: 17,
};

// ---- Moon Base (cells): the Moon's own camp ----
export const MOON_CAMP = {
  w: 62,
  h: 14,
  ground: 11,
  shaftX: 5, // the hatch down into the Moon
  benchX: 10,
  lecternX: 12,
  nestX: 15,
  padX: 20, // the landing pad (its middle), where the rocket stands
  plots: [26, 33, 40, 47],
  plotW: 6,
  buildSeconds: 5,
};

// ---- Mars Base (cells): the same shape as Moon Base ----
export const MARS_CAMP = { ...MOON_CAMP };

// ---- Mars dust storms (seconds; push in px/s, about half a walk) ----
export const STORM = { first: [20, 30], calm: [40, 70], warn: 3, blow: 8, push: 38 };
// ---- Ring Station (cells): the same shape as Moon Base ----
export const SATURN_CAMP = { ...MOON_CAMP };

// ---- Solar Station (cells): the same shape as Moon Base ----
export const SUN_CAMP = { ...MOON_CAMP };

// ---- solar flares: the storm cycle, but a shower of sunstones (seconds) ----
export const FLARE = { first: [15, 25], calm: [35, 55], warn: 2, blow: 6, every: 0.5 };

// ---- Dino Camp (cells): the same shape as Moon Base ----
export const DINO_CAMP = { ...MOON_CAMP };

// ---- Dino Planet: rides on friendly parasaurs; the Jetpack (px/s, px/s², seconds) ----
export const RIDE = { time: 25, speed: 1.6, jump: 1.3 };
export const JET = { thrust: 1500, maxUp: 120, fuel: 1.2, hold: 0.15 };

// ---- Saturn's ice (px/s²): slow to get going, slow to stop ----
export const ICE = { accel: 160, friction: 70 };

// steam geysers: a rumble, then a big launch
export const GEYSER = { rumble: 0.45, launch: 430, rest: 1.5 };

// ---- going home ----
export const HOME_HOLD_MS = 2000;

// the Moon Skate Park's half pipe (px): two quarter pipes of radius R with a
// flat bottom F; Moon gravity; pushing, pumping, big air, tricks
export const SKATE = {
  R: 96, F: 80, g: 405, push: 260, pump: 150, friction: 0.12, max: 420, maxAir: 84, ollie: 210, trickTime: 0.45, gemCap: 15,
};
