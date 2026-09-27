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
};

export const ORES = ['coal', 'iron', 'gold', 'diamond', 'emerald'];

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

export const BLOCK_COUNT = TABLE.length;
export const blockInfo = (id) => TABLE[id];
export const isSolid = (id) => !!(TABLE[id] && TABLE[id].solid);
export const hardnessOf = (id) => (TABLE[id] ? TABLE[id].hardness : null);
export const dropOf = (id) => (TABLE[id] ? TABLE[id].drop : null);
