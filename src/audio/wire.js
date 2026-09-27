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
  discover: (s) => s.play('fanfare'),
  heart: (s) => s.play('heart'),
  heartChip: (s) => s.play('crack'),
  meteorite: (s) => s.play('crack'),
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
};

const MENU = {
  pickerMove: (s) => s.play('tick'),
  pickerOpen: (s) => s.play('open'),
  pickerClose: (s) => s.play('close'),
  joined: (s) => s.play('join'),
  ready: (s) => s.play('upgrade'),
  nope: (s) => s.play('nope'),
};

const TABLES = { Mine: MINE, Camp: CAMP, Title: MENU, Pause: MENU, Book: MENU };
const SONG_FOR = { Mine: 'mine', Camp: 'camp', Title: 'camp' };

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
  if (SONG_FOR[key]) audio.music.play(SONG_FOR[key]);
  scene.events.once('shutdown', () => handlers.forEach(([ev, h]) => scene.events.off(ev, h)));
}
