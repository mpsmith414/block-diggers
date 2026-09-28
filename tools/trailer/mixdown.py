import numpy as np
from scipy.io import wavfile
from synth import limiter, make_ir, reverb, SR
_, m = wavfile.read('music.wav'); m = m.astype(np.float32) / 32768
_, s = wavfile.read('sfx.wav'); s = s.astype(np.float32) / 32768
n = min(len(m), len(s)); m, s = m[:n].T, s[:n].T
print('sfx peak', np.abs(s).max(), 'music peak', np.abs(m).max())
s = limiter(s * 5.0, 0.8, release=0.05)
# a touch of room on the sfx so they sit in the mix
s = s + reverb(s, make_ir(0.8, pre=0.01, damp=6000, seed=9), 0.12)
# duck the music a little under loud sfx
env = np.convolve(np.abs(s).max(0), np.ones(2400) / 2400, mode='same')
duck = 1 - np.clip(env * 1.5, 0, 0.4)
out = m * duck + s * SFX_GAIN if False else m * duck + s * 1.0
out = limiter(out, 0.95)
wavfile.write('mix.wav', SR, (out.T * 32767).astype(np.int16))
print('mix peak', np.abs(out).max())
