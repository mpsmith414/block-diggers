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

// Each layer's colour on the depth meter and the trip summary.
export const LAYER_COLORS = {
  dirt: 0x8a5a34, stone: 0x7d7d86, deep: 0x3f3d4f, crystal: 0x6a4fa8,
  dino: 0xd0a868, brick: 0xe0403a, meteor: 0x2a2860, core: 0xff7a2a,
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

// ---- mining (seconds) by hardness, for pick level 0 (wood), 1 (iron), 2 (diamond) ----
// Tools: 0 wood, 1 iron, 2 diamond, 3 amber pick, 4 brick drill, 5 star drill.
const X = Infinity;
export const MINE_TIME = {
  soft: [0.25, 0.2, 0.12, 0.1, 0.08, 0.07],
  stone: [0.6, 0.4, 0.25, 0.2, 0.16, 0.13],
  deep: [X, 0.7, 0.4, 0.3, 0.25, 0.2],
  crystal: [X, X, 0.6, 0.45, 0.35, 0.3],
  sand: [X, X, 0.5, 0.4, 0.3, 0.25],
  bricks: [X, X, X, 0.5, 0.4, 0.3],
  meteor: [X, X, X, X, 0.5, 0.4],
  core: [X, X, X, X, X, 0.5],
  moon: [X, X, 0.6, 0.5, 0.4, 0.3],
  bedrock: [X, X, X, X, X, X],
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
export const BACKPACK = [30, 60, 120, 180, 250];
export const LANTERN = [3, 5, 7, 9, 11]; // light radius in blocks

// ---- pickups ----
export const PICKUP = { size: 8, gravity: 600, scatterTtl: 10, scatterDelay: 0.6, magnetRadius: 44, magnetSpeed: 160 };

// ---- building perks ----
export const PERKS = { houseBonus: 10, gardenPerTrip: 3, gardenMax: 12, penMax: 3, cartRow: 42 };

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

export const POWERUPS = {
  lavaTime: 8, // seconds as a lava monster
  drinkAfter: 1, // seconds in water before you start drinking
  drinkTime: 1.4, // glug glug glug… burp
  zoomTime: 6, // zoomies after a drink
  zoomSpeed: 1.5,
  drinkCooldown: 3, // seconds out of the water before you can drink again
};

// ---- pets ----
export const PETS = { goldenEggGold: 6, sniffEvery: 6, sniffRange: 10, bugLight: 2.6, fetchRange: 80, speed: 160, roarEvery: 8, roarRange: 5, parkAmber: 2 };

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
};

// ---- going home ----
export const HOME_HOLD_MS = 2000;
