# Trailer pipeline

Builds `docs/trailer/block-diggers-trailer.mp4` (85 s, 1920x1080, 60 fps) from real gameplay.

1. `npm run dev` (the capture drives the dev build and its `window.h` harness).
2. `node shots.mjs <shot…>`: stages each shot in headless Chromium (grid edits, virtual
   pads, scripted camera), steps the game frame by frame at 960x540 and saves PNGs plus
   a log of every sound effect to `clips/<shot>/`.
3. Music: `python3 sunomusic.py` cuts the Suno song (`suno.wav`) to the edit (an 8-bar
   jump from 60.95 s to 76.44 s, a mute for the sneeze, a chiptune ta-da at the end).
   `music.py` is the earlier fully synthesised score, kept as a fallback.
4. `python3 sfxevents.py && node sfxrender.mjs sfx_events.json sfx.wav`: replays the
   game's own `sfx.js` voices offline at the edit's times; `python3 mixdown.py` mixes.
5. `FFMPEG=… python3 edit.py video.mp4`: grading, bloom, reframing, titles, letterbox,
   grain; then mux `mix.wav` with ffmpeg.

Needs Playwright + Chromium, numpy/scipy/Pillow, ffmpeg, and the Cinzel/Oswald
fontsource packages under `fonts/` (`npm pack @fontsource/cinzel @fontsource/oswald`).
