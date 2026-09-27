// Every tunable number in one place, so playtests only touch this file.

export const TILE = 16;

// ---- the mine ----
export const MINE_W = 48;
export const MINE_H = 150;
export const SKY_ROWS = 6; // open rows above row 0 before an invisible ceiling
export const SHAFT_X = 24;
export const SHAFT_DEPTH = 4; // shaft ladders in rows 0..SHAFT_DEPTH-1
export const LAYERS = {
  dirt: { top: 1, bottom: 40 },
  stone: { top: 41, bottom: 95 },
  deep: { top: 96, bottom: 148 },
};

// Ore veins: how many veins per 1000 host cells, and which ores (weights).
export const ORE_VEINS = {
  dirt: { per1000: 42, weights: { coal: 1 } },
  stone: { per1000: 44, weights: { coal: 3, iron: 4, gold: 1.6 } },
  deep: { per1000: 40, weights: { gold: 3, diamond: 1.5, emerald: 1.2 } },
};
export const VEIN_SIZE = { min: 2, max: 5 };
export const GRAVEL_POCKETS = { stone: 10, deep: 8, size: { min: 3, max: 6 } };
export const CAVES = {
  dirt: { count: 5, length: { min: 10, max: 22 }, radius: 1 },
  stone: { count: 7, length: { min: 18, max: 32 }, radius: 1.5 },
  deep: { count: 8, length: { min: 22, max: 40 }, radius: 2 },
};
export const LAVA_POOLS = 7;
export const CHESTS = 3;

// ---- mining (seconds) by hardness, for pick level 0 (wood), 1 (iron), 2 (diamond) ----
export const MINE_TIME = {
  soft: [0.25, 0.2, 0.12],
  stone: [0.6, 0.4, 0.25],
  deep: [Infinity, 0.7, 0.4],
  bedrock: [Infinity, Infinity, Infinity],
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
};

// ---- upgrades: value per level ----
export const BACKPACK = [20, 40, 80];
export const LANTERN = [3, 5, 7]; // light radius in blocks

// ---- pickups ----
export const PICKUP = { size: 8, gravity: 600, scatterTtl: 10, scatterDelay: 0.6, magnetRadius: 44, magnetSpeed: 160 };

// ---- camera ----
export const CAMERA = { maxZoom: 1.5, minZoom: 0.5, margin: 40 };

// ---- going home ----
export const HOME_HOLD_MS = 2000;
