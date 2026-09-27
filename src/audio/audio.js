// One AudioContext for the game, with master / sfx / music gains and mute.
// Browsers only let audio start after a user gesture (a key, a click, a tap;
// controller presses don't count), so we resume on the first one we see.

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
    sfx.gain.value = 0.8;
    sfx.connect(master);
    music = ctx.createGain();
    music.gain.value = 0.55;
    music.connect(master);
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
