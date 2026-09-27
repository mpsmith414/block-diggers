// One AudioContext for the game, with master / sfx / music gains and mute.
// Browsers only let audio start after a user gesture (a key, a click, a tap;
// controller presses don't count), so we resume on the first one we see.

export const MUSIC_LEVEL = 0.32;

// Music runs through a gentle low-pass and a soft echo: warm, not bright.
export function buildMusicChain(ctx, out) {
  const music = ctx.createGain();
  music.gain.value = MUSIC_LEVEL;
  const warm = ctx.createBiquadFilter();
  warm.type = 'lowpass';
  warm.frequency.value = 1900;
  warm.Q.value = 0.4;
  const echo = ctx.createDelay(1);
  echo.delayTime.value = 0.33;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.28;
  const wet = ctx.createGain();
  wet.gain.value = 0.22;
  music.connect(warm);
  warm.connect(out);
  warm.connect(echo);
  echo.connect(feedback).connect(echo);
  echo.connect(wet).connect(out);
  return music;
}

export function createAudio(win = globalThis.window) {
  const Ctx = win && (win.AudioContext || win.webkitAudioContext);
  let ctx = null;
  let master;
  let sfx;
  let music;
  let muted = false;
  let noiseBuf = null;

  const ensure = () => {
    if (ctx || !Ctx) return ctx;
    try {
      ctx = new Ctx();
    } catch {
      return null;
    }
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    master.connect(ctx.destination);
    sfx = ctx.createGain();
    sfx.gain.value = 0.55;
    sfx.connect(master);
    music = buildMusicChain(ctx, master);
    return ctx;
  };

  const unlock = () => {
    const c = ensure();
    if (c && c.state === 'suspended') c.resume().catch(() => {});
  };
  if (win) {
    for (const t of ['keydown', 'pointerdown', 'touchstart']) win.addEventListener(t, unlock, { capture: true, passive: true });
  }
  ensure();

  return {
    get ctx() { return ensure(); },
    get sfx() { ensure(); return sfx; },
    get music() { ensure(); return music; },
    get ready() { return !!ctx && ctx.state === 'running'; },
    get muted() { return muted; },
    unlock,
    setMuted(m) {
      muted = m;
      if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.05);
    },
    noise() {
      const c = ensure();
      if (!c) return null;
      if (!noiseBuf) {
        noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      return noiseBuf;
    },
  };
}
