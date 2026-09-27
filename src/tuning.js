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
  dirt: { per1000: 20, weights: { coal: 1 } },
  stone: { per1000: 36, weights: { coal: 2, iron: 4, gold: 1.6 } },
  deep: { per1000: 34, weights: { gold: 3, diamond: 1.5, emerald: 1.2 } },
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
  knockSpeed: 110,
  knockTime: 0.25,
  knockLift: 170,
  lavaHop: 260,
};

// ---- upgrades: value per level ----
// Playtest (bot, 2026-09-26): 20 filled with coal in ~20 s, before reaching iron.
export const BACKPACK = [30, 60, 120];
export const LANTERN = [3, 5, 7]; // light radius in blocks

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

// ---- bubble to partner ----
export const BUBBLE = { speed: 220, minDistance: 32 };

// ---- camp (cells) ----
export const CAMP = {
  w: 64,
  h: 14,
  ground: 11, // first solid row
  shaftX: 5,
  benchX: 10,
  fireX: 15,
  plots: [19, 26, 33, 40, 47, 54],
  plotW: 6,
  buildSeconds: 5,
};

// ---- going home ----
export const HOME_HOLD_MS = 2000;
