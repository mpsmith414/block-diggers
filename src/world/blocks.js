// Block type table. Ids double as tileset frame indices.

export const B = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  DEEP: 4,
  BEDROCK: 5,
  GRAVEL: 6,
  COAL_DIRT: 7,
  COAL_STONE: 8,
  IRON: 9,
  GOLD_STONE: 10,
  GOLD_DEEP: 11,
  DIAMOND: 12,
  EMERALD: 13,
  LADDER: 14,
  LAVA: 15,
  CHEST: 16,
  // expansion (appended so the old ids / tileset frames never move)
  CRYSTAL: 17,
  WATER: 18,
  GEODE: 19,
  FOSSIL: 20,
  BOOM: 21,
  BIGCHEST: 22,
  BIGCHEST_R: 23,
  BOULDER: 24,
  EGG: 25,
  GOLD_CRYSTAL: 26,
  DIAMOND_CRYSTAL: 27,
  EMERALD_CRYSTAL: 28,
  // deeper world (M14) and the Moon (M16)
  SAND: 29,
  BRICKS: 30,
  METEOR: 31,
  CORE: 32,
  AMBER: 33,
  BRICK_ORE: 34,
  STAR: 35,
  HEART: 36,
  SPRING: 37,
  METEORITE: 38,
  MOONROCK: 39,
  SPACE_CRYSTAL: 40,
  CHEESE: 41,
};

export const ORES = ['coal', 'iron', 'gold', 'diamond', 'emerald', 'amber', 'brick', 'star'];

const TABLE = [];
const def = (id, name, solid, hardness, drop = null) => { TABLE[id] = { id, name, solid, hardness, drop }; };
def(B.AIR, 'air', false, null);
def(B.GRASS, 'grass', true, 'soft');
def(B.DIRT, 'dirt', true, 'soft');
def(B.STONE, 'stone', true, 'stone');
def(B.DEEP, 'deepslate', true, 'deep');
def(B.BEDROCK, 'bedrock', true, 'bedrock');
def(B.GRAVEL, 'gravel', true, 'soft');
def(B.COAL_DIRT, 'coal in dirt', true, 'soft', 'coal');
def(B.COAL_STONE, 'coal in stone', true, 'stone', 'coal');
def(B.IRON, 'iron', true, 'stone', 'iron');
def(B.GOLD_STONE, 'gold in stone', true, 'stone', 'gold');
def(B.GOLD_DEEP, 'gold in deepslate', true, 'deep', 'gold');
def(B.DIAMOND, 'diamond', true, 'deep', 'diamond');
def(B.EMERALD, 'emerald', true, 'deep', 'emerald');
def(B.LADDER, 'ladder', false, null);
def(B.LAVA, 'lava', false, null);
def(B.CHEST, 'chest', false, null);
def(B.CRYSTAL, 'crystal rock', true, 'crystal');
def(B.WATER, 'water', false, null);
def(B.GEODE, 'geode', true, 'stone');
def(B.FOSSIL, 'fossil', true, 'soft');
def(B.BOOM, 'boom block', true, 'bedrock');
def(B.BIGCHEST, 'big chest', false, null);
def(B.BIGCHEST_R, 'big chest', false, null);
def(B.BOULDER, 'boulder', true, 'bedrock');
def(B.EGG, 'egg', false, null);
def(B.GOLD_CRYSTAL, 'gold in crystal', true, 'crystal', 'gold');
def(B.DIAMOND_CRYSTAL, 'diamond in crystal', true, 'crystal', 'diamond');
def(B.EMERALD_CRYSTAL, 'emerald in crystal', true, 'crystal', 'emerald');
def(B.SAND, 'sandstone', true, 'sand');
def(B.BRICKS, 'toy bricks', true, 'bricks');
def(B.METEOR, 'space rock', true, 'meteor');
def(B.CORE, 'core rock', true, 'core');
def(B.AMBER, 'amber', true, 'sand', 'amber');
def(B.BRICK_ORE, 'loose brick', true, 'bricks', 'brick');
def(B.STAR, 'star shard', true, 'meteor', 'star');
def(B.HEART, 'heart of the world', true, 'core');
def(B.SPRING, 'spring block', true, 'bricks');
def(B.METEORITE, 'meteorite', true, 'meteor');
def(B.MOONROCK, 'moon rock', true, 'moon');
def(B.SPACE_CRYSTAL, 'space crystal', true, 'moon', 'diamond');
def(B.CHEESE, 'moon cheese', true, 'soft');

export const BLOCK_COUNT = TABLE.length;
export const blockInfo = (id) => TABLE[id];
export const isSolid = (id) => !!(TABLE[id] && TABLE[id].solid);
export const hardnessOf = (id) => (TABLE[id] ? TABLE[id].hardness : null);
export const dropOf = (id) => (TABLE[id] ? TABLE[id].drop : null);
