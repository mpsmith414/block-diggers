// Hooks sounds and music up to scene events. Scenes just emit events.

import { hardnessOf } from '../world/blocks.js';

const MINE = {
  blockMined: (s, m) => s.play('dig', hardnessOf(m.id) ?? 'soft'),
  oreCollected: (s) => s.play('ore'),
  bounce: (s) => s.play('bounce'),
  bonk: (s) => s.play('bonk'),
  squash: (s) => s.play('squash'),
  jump: (s) => s.play('jump'),
  chestOpened: (s) => s.play('chest'),
  bubble: (s) => s.play('bubble'),
  bubblePop: (s) => s.play('pop'),
  goHome: (s) => s.play('whoosh'),
  packFull: (s) => s.play('full'),
  lava: (s) => s.play('lava'),
  gravelLanded: (s) => s.play('gravel'),
  joined: (s) => s.play('join'),
  fuse: (s) => s.play('fuse'),
  boom: (s) => s.play('boom'),
  boulder: (s) => s.play('rumble'),
  geode: (s) => s.play('crack'),
  fossil: (s) => s.play('crack'),
  splash: (s) => s.play('splash'),
  egg: (s) => s.play('egg'),
  sniff: (s) => s.play('sniff'),
  lavaMonster: (s) => s.play('roar'),
  cooldown: (s) => s.play('hiss'),
  glug: (s) => s.play('glug'),
  burp: (s) => s.play('burp'),
  spring: (s) => s.play('boing'),
  rawr: (s) => s.play('rawr'),
  quack: (s) => s.play('quack'),
  sock: (s) => s.play('peeyew'),
  pffbt: (s) => s.play('pffbt'),
  achoo: (s) => s.play('achoo'),
  dizzy: (s) => s.play('dizzy'),
  trick: (s) => s.play('trick'),
  critter: (s, voice) => s.play(voice),
  discover: (s) => s.play('fanfare'),
  heart: (s) => s.play('heart'),
  heartChip: (s) => s.play('crack'),
  meteorite: (s) => s.play('crack'),
  chime: (s, i) => s.play('chime', i),
  teleport: (s) => s.play('zap'),
  ufo: (s) => s.play('ufo'),
  cheeseParty: (s) => s.play('party'),
  stormWarn: (s) => s.play('whistle'),
  stormStart: (s) => s.play('wind'),
  stormRubies: (s) => s.play('sticker'),
  rumble: (s) => s.play('rumble'),
  geyser: (s) => s.play('geyser'),
  beep: (s) => s.play('beep'),
  vault: (s) => s.play('vault'),
  snowman: (s) => s.play('party'),
  globe: (s) => s.play('chime', 4),
  frozenComet: (s) => s.play('crack'),
  ride: (s) => s.play('rawr'),
  nest: (s) => s.play('hatch'),
  skull: (s) => s.play('roar'),
  stego: (s) => s.play('rumble'),
  jet: (s) => s.play('whoosh'),
  flareWarn: (s) => s.play('hum'),
  skateOn: (s) => s.play('join'),
  skatePop: (s) => s.play('ollie'),
  skateTrick: (s) => s.play('whoosh'),
  skateLand: (s) => s.play('ding'),
  clawOn: (s) => s.play('join'),
  clawDrop: (s) => s.play('whirr'),
  clawGrab: (s) => s.play('pop'),
  clawMiss: (s) => s.play('giggle'),
  clawSlip: (s) => s.play('boing'),
  clawPrize: (s) => s.play('party'),
  clawJackpot: (s) => s.play('fanfare'),
  whackOn: (s) => s.play('join'),
  whackStart: (s) => s.play('beep'),
  whackPop: (s) => s.play('squeak'),
  whackBonk: (s) => s.play('bonk'),
  whackGolden: (s) => s.play('heart'),
  whackMiss: (s) => s.play('tick'),
  whackEnd: (s) => s.play('party'),
  hockeyHit: (s) => s.play('tick'),
  hockeyShot: (s) => s.play('whoosh'),
  hockeySave: (s) => s.play('squeak'),
  hockeyGoal: (s) => s.play('horn'),
  eggStart: (s) => s.play('caw'),
  eggCatch: (s) => s.play('pop'),
  eggGolden: (s) => s.play('heart'),
  eggRotten: (s) => s.play('peeyew'),
  eggSplat: (s) => s.play('squash'),
  eggRottenSplat: (s) => s.play('peeyew'),
  eggEnd: (s) => s.play('party'),
  fwStart: (s) => s.play('beep'),
  fwLaunch: (s) => s.play('whoosh'),
  fwPop: (s) => s.play('firework'),
  fwChain: (s) => s.play('firework'),
  fwEnd: (s) => s.play('fanfare'),
  flareStart: (s) => s.play('shimmer'),
  flareGem: (s) => s.play('ore'),
  flower: (s) => s.play('chime', 3),
  forge: (s) => s.play('hammer'),
};

const CAMP = {
  built: (s) => s.play('build'),
  building: (s) => s.play('hammer'),
  upgraded: (s) => s.play('upgrade'),
  nope: (s) => s.play('nope'),
  pickerMove: (s) => s.play('tick'),
  pickerOpen: (s) => s.play('open'),
  pickerClose: (s) => s.play('close'),
  deposit: (s, _ore, i) => s.play('deposit', i),
  tripStart: (s) => s.play('whoosh'),
  jump: (s) => s.play('jump'),
  joined: (s) => s.play('join'),
  hatch: (s) => s.play('hatch'),
  wobble: (s) => s.play('wobble'),
  harvest: (s) => s.play('upgrade'),
  gift: (s) => s.play('chest'),
  place: (s) => s.play('hammer'),
  thanks: (s) => s.play('egg'),
  glug: (s) => s.play('glug'),
  burp: (s) => s.play('burp'),
  trick: (s) => s.play('trick'),
  fanfare: (s) => s.play('fanfare'),
  firework: (s) => s.play('firework'),
  party: (s) => s.play('party'),
};

const BUILD = {
  place: (s) => s.play('hammer'),
  unplace: (s) => s.play('pop'),
  nope: (s) => s.play('nope'),
  pickerMove: (s) => s.play('tick'),
  jump: (s) => s.play('jump'),
  joined: (s) => s.play('join'),
  spring: (s) => s.play('boing'),
};

const MENU = {
  pickerMove: (s) => s.play('tick'),
  pickerOpen: (s) => s.play('open'),
  pickerClose: (s) => s.play('close'),
  joined: (s) => s.play('join'),
  ready: (s) => s.play('upgrade'),
  nope: (s) => s.play('nope'),
};

const TABLES = { Mine: MINE, Camp: CAMP, Build: BUILD, Title: MENU, Pause: MENU, Book: MENU, StarMap: MENU };
const SONG_FOR = { Mine: 'mine', Camp: 'camp', Title: 'camp', Build: 'camp' };

// Which song plays: every planet has its own theme (at its camp and in its
// mines); Earth keeps the camp and mine songs.
export function songFor(sceneKey, planet = 'earth') {
  if ((sceneKey === 'Mine' || sceneKey === 'Camp') && planet !== 'earth') return planet;
  return SONG_FOR[sceneKey] ?? null;
}

// Switch the music (it fades in; the same song keeps playing).
export function setSong(scene, name) {
  const audio = scene.registry.get('audio');
  if (audio && name) audio.music.play(name);
}

export function attachAudio(scene) {
  const audio = scene.registry.get('audio');
  if (!audio) return;
  const key = scene.sys.settings.key;
  const table = TABLES[key] ?? {};
  const handlers = Object.entries(table).map(([ev, fn]) => {
    const h = (...args) => fn(audio.sfx, ...args);
    scene.events.on(ev, h);
    return [ev, h];
  });
  const song = songFor(key, scene.planet ?? 'earth');
  if (song) audio.music.play(song);
  scene.events.once('shutdown', () => handlers.forEach(([ev, h]) => scene.events.off(ev, h)));
}
