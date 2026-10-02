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
  // the planets (M19): the 5-layer Moon
  CHEESE_ROCK: 42,
  MOON_CRYSTAL: 43,
  ALIEN_PANEL: 44,
  MOON_CORE: 45,
  MOONSTONE: 46,
  SPACE_GEM: 47,
  GIZMO: 48,
  CHEESE_WHEEL: 49,
  TELEPORT: 50,
  MOON_HEART: 51,
  UFO: 52,
  // Mars (M22)
  MARS_ROCK: 53,
  RUST_ROCK: 54,
  BASALT: 55,
  RUIN_STONE: 56,
  MARS_CORE: 57,
  RUBY: 58,
  BOLT: 59,
  OPAL: 60,
  COIN: 61,
  MARS_HEART: 62,
  GEYSER: 63,
  OLD_ROVER: 64,
  VAULT: 65,
  VAULT_DOOR: 66,
  GLYPH: 67,
  // Saturn (M23)
  ICE: 68,
  SOFTSERVE: 69,
  AURORA_ROCK: 70,
  COMET_ROCK: 71,
  SATURN_CORE: 72,
  FROST: 73,
  ICECREAM: 74,
  PEARL: 75,
  COMET: 76,
  SATURN_HEART: 77,
  SNOWBALL: 78,
  SNOW_GLOBE: 79,
  FROZEN_COMET: 80,
  SNOW: 81, // Ring Station's snowy ground (not slippery)
  // Dino Planet (M24)
  JUNGLE_SOIL: 82,
  FOSSIL_ROCK: 83,
  SWAMP_MUD: 84,
  VOLCANIC: 85,
  DINO_CORE: 86,
  JADE: 87,
  BONE: 88,
  TOOTH: 89,
  OBSIDIAN: 90,
  DINO_HEART: 91,
  PARASAUR: 92,
  NEST: 93,
  REX_SKULL: 94,
  STEGO: 95,
  // the Sun (M25)
  CORONA_ROCK: 96,
  SUNSPOT_ROCK: 97,
  PLASMA_ROCK: 98,
  RADIANT_ROCK: 99,
  FUSION_ROCK: 100,
  SUN_CORE: 101,
  SUNSTONE: 102,
  FLARE: 103,
  PLASMA: 104,
  NOVA: 105,
  SUN_HEART: 106,
  FIRE_FLOWER: 107,
  FORGE: 108,
  // Rainbow Planet, the endless mine: its rock and gems are drawn tinted in
  // each layer's own colours
  RAINBOW_ROCK: 109,
  RAINBOW_GEM: 110, // a tiny 1-block gem
  RAINBOW_GEM_PART: 111, // a block of a bigger gem (2x2 up to 8x8)
  RAINBOW_FLOOR: 112, // the glowing floor at the bottom of a trip's stretch (and the side walls)
  RAINBOW_TOP: 113, // Rainbow Village's candy ground
  RAINBOW_SOIL: 114,
  RAINBOW_SHINY: 115, // a shiny slippery floor (the "shiny" twist)
};

export const ORES = ['coal', 'iron', 'gold', 'diamond', 'emerald', 'amber', 'brick', 'star', 'moonstone', 'cheese', 'spacegem', 'gizmo', 'ruby', 'bolt', 'opal', 'coin', 'frost', 'icecream', 'pearl', 'comet', 'jade', 'bone', 'tooth', 'obsidian', 'sunstone', 'flare', 'plasma', 'nova'];

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
def(B.SPACE_CRYSTAL, 'space crystal', true, 'moon', 'spacegem');
def(B.CHEESE, 'moon cheese', true, 'cheese', 'cheese');
def(B.CHEESE_ROCK, 'cheese rock', true, 'cheese');
def(B.MOON_CRYSTAL, 'moon crystal rock', true, 'mooncrystal');
def(B.ALIEN_PANEL, 'alien panel', true, 'alien');
def(B.MOON_CORE, 'moon core rock', true, 'mooncore');
def(B.MOONSTONE, 'moonstone', true, 'moon', 'moonstone');
def(B.SPACE_GEM, 'space gem', true, 'mooncrystal', 'spacegem');
def(B.GIZMO, 'alien gizmo', true, 'alien', 'gizmo');
def(B.CHEESE_WHEEL, 'cheese wheel', true, 'bedrock');
def(B.TELEPORT, 'teleport pad', false, null);
def(B.MOON_HEART, 'moon heart', true, 'mooncore');
def(B.UFO, 'crashed ufo', false, null);
def(B.MARS_ROCK, 'red sandstone', true, 'marsrock');
def(B.RUST_ROCK, 'rusty rock', true, 'rust');
def(B.BASALT, 'basalt', true, 'basalt');
def(B.RUIN_STONE, 'carved stone', true, 'ruin');
def(B.MARS_CORE, 'mars core rock', true, 'marscore');
def(B.RUBY, 'ruby', true, 'marsrock', 'ruby');
def(B.BOLT, 'robot bolt', true, 'rust', 'bolt');
def(B.OPAL, 'fire opal', true, 'basalt', 'opal');
def(B.COIN, 'mars coin', true, 'ruin', 'coin');
def(B.MARS_HEART, 'mars heart', true, 'marscore');
def(B.GEYSER, 'steam geyser', false, null);
def(B.OLD_ROVER, 'old rover', false, null);
def(B.VAULT, 'vault wall', true, 'bedrock');
def(B.VAULT_DOOR, 'vault door', true, 'bedrock');
def(B.GLYPH, 'glyph button', false, null);
def(B.ICE, 'ring ice', true, 'ice');
def(B.SOFTSERVE, 'soft-serve rock', true, 'softserve');
def(B.AURORA_ROCK, 'aurora rock', true, 'aurora');
def(B.COMET_ROCK, 'comet rock', true, 'cometrock');
def(B.SATURN_CORE, 'saturn core rock', true, 'saturncore');
def(B.FROST, 'frost gem', true, 'ice', 'frost');
def(B.ICECREAM, 'ice cream', true, 'softserve', 'icecream');
def(B.PEARL, 'ring pearl', true, 'aurora', 'pearl');
def(B.COMET, 'comet chunk', true, 'cometrock', 'comet');
def(B.SATURN_HEART, 'saturn heart', true, 'saturncore');
def(B.SNOWBALL, 'snowball', true, 'bedrock');
def(B.SNOW_GLOBE, 'snow globe', false, null);
def(B.FROZEN_COMET, 'frozen comet', false, null);
def(B.SNOW, 'snow', true, 'soft');
def(B.JUNGLE_SOIL, 'jungle soil', true, 'jungle');
def(B.FOSSIL_ROCK, 'fossil rock', true, 'fossilrock');
def(B.SWAMP_MUD, 'swamp mud', true, 'swampmud');
def(B.VOLCANIC, 'volcanic rock', true, 'volcanic');
def(B.DINO_CORE, 'dino core rock', true, 'dinocore');
def(B.JADE, 'jade', true, 'jungle', 'jade');
def(B.BONE, 'dino bone', true, 'fossilrock', 'bone');
def(B.TOOTH, 't-rex tooth', true, 'swampmud', 'tooth');
def(B.OBSIDIAN, 'obsidian', true, 'volcanic', 'obsidian');
def(B.DINO_HEART, 'dino heart', true, 'dinocore');
def(B.PARASAUR, 'parasaur', false, null);
def(B.NEST, 'dino nest', false, null);
def(B.REX_SKULL, 't-rex skull', false, null);
def(B.STEGO, 'sleeping stegosaurus', false, null);
def(B.CORONA_ROCK, 'corona rock', true, 'corona');
def(B.SUNSPOT_ROCK, 'sunspot rock', true, 'sunspot');
def(B.PLASMA_ROCK, 'plasma rock', true, 'plasmarock');
def(B.RADIANT_ROCK, 'radiant rock', true, 'radiant');
def(B.FUSION_ROCK, 'fusion rock', true, 'fusionrock');
def(B.SUN_CORE, 'sun core rock', true, 'suncore');
def(B.SUNSTONE, 'sunstone', true, 'corona', 'sunstone');
def(B.FLARE, 'flare gem', true, 'sunspot', 'flare');
def(B.PLASMA, 'plasma orb', true, 'plasmarock', 'plasma');
def(B.NOVA, 'nova gem', true, 'radiant', 'nova');
def(B.SUN_HEART, "the sun's heart", true, 'suncore');
def(B.FIRE_FLOWER, 'fire flower', false, null);
def(B.FORGE, 'solar forge', false, null);
def(B.RAINBOW_ROCK, 'rainbow rock', true, 'rainbow');
def(B.RAINBOW_GEM, 'rainbow gem', true, 'rainbow');
def(B.RAINBOW_GEM_PART, 'big rainbow gem', true, 'rainbow');
def(B.RAINBOW_FLOOR, 'rainbow floor', true, null);
def(B.RAINBOW_TOP, 'candy grass', true, 'soft');
def(B.RAINBOW_SOIL, 'candy soil', true, 'soft');
def(B.RAINBOW_SHINY, 'shiny rainbow rock', true, 'rainbow');

export const BLOCK_COUNT = TABLE.length;
export const blockInfo = (id) => TABLE[id];
export const isSolid = (id) => !!(TABLE[id] && TABLE[id].solid);
export const hardnessOf = (id) => (TABLE[id] ? TABLE[id].hardness : null);
export const dropOf = (id) => (TABLE[id] ? TABLE[id].drop : null);
// boulders you push around (cheese wheels on the Moon)
export const isBoulder = (id) => id === B.BOULDER || id === B.CHEESE_WHEEL || id === B.SNOWBALL;
// Saturn's ice: you slide on it
export const isSlippery = (id) => id === B.ICE || id === B.FROST || id === B.RAINBOW_SHINY;
