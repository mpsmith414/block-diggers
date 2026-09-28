"""The Suno track, cut to the trailer: an 8-bar jump from 60.952s to 76.44s,
a hard mute for the sneeze gag, a low hit under the title, and a chiptune ta-da at the end."""
import numpy as np
from scipy.io import wavfile
from synth import SR, limiter, Track
import music as M

_, x = wavfile.read('suno.wav'); x = x.astype(np.float32).T / 32768
A, Bt, X = 60.952, 76.44, 0.02            # cut points (on beats) and crossfade
a, b, xf = int((A - 0.015) * SR), int((Bt - 0.015) * SR), int(X * SR)
fade = np.linspace(0, 1, xf)
head, tail = x[:, :a], x[:, b:]
mid = head[:, -xf:] * (1 - fade) + tail[:, :xf] * fade
song = np.concatenate([head[:, :-xf], mid, tail[:, xf:]], axis=1)
# sneeze: hard silence in the song's breath before its drop
g = np.ones(song.shape[1])
m0, m1 = int(19.72 * SR), int(20.20 * SR)
g[m0:m1] = 0; g[m0 - 480:m0] = np.linspace(1, 0, 480); g[m1 - 240:m1] = np.linspace(0, 1, 240)
song = song * g
# loudness: bring the Suno master up to trailer level
loud = song[:, int(22 * SR):int(40 * SR)]
gain = 10 ** ((-12.5 - 20 * np.log10(np.sqrt((loud ** 2).mean()) + 1e-9)) / 20)
song = song * gain
DUR = 84.6
out = np.zeros((2, int(DUR * SR)))
out[:, :song.shape[1]] = song[:, :out.shape[1]]
tr = Track(DUR)
tr.add(72.79, M.impact(0.35))
for i, nt in enumerate(['C5', 'E5', 'G5', 'C6']):
    tr.add(83.35 + i * 0.07, M.chip_lead(nt, 0.1 if i < 3 else 0.5, 1.0), 1.6)
out = out + tr.buf[:, :out.shape[1]]
out = limiter(out, 0.93)
wavfile.write('music.wav', SR, (out.T * 32767).astype(np.int16))
print('gain', round(20 * np.log10(gain), 1), 'dB; song len', song.shape[1] / SR)
