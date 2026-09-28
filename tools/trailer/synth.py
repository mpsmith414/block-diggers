"""A tiny offline synth toolkit for the trailer score (numpy + scipy)."""
import numpy as np
from scipy import signal

SR = 48000
rng = np.random.default_rng(7)


def midi(n):
    names = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    if isinstance(n, (int, float)):
        return n
    p = names[n[0]]
    i = 1
    if n[i] == '#':
        p += 1; i += 1
    elif n[i] == 'b':
        p -= 1; i += 1
    return p + 12 * (int(n[i:]) + 1)


def hz(n):
    return 440.0 * 2 ** ((midi(n) - 69) / 12)


def t_(dur):
    return np.arange(int(dur * SR)) / SR


def adsr(n, a=0.01, d=0.1, s=0.7, r=0.2, sus_len=None):
    """Envelope of total length n samples; release at the end."""
    A = max(1, int(a * SR)); D = max(1, int(d * SR)); R = max(1, int(r * SR))
    env = np.full(n, s, dtype=np.float64)
    A = min(A, n); env[:A] = np.linspace(0, 1, A)
    D2 = min(D, n - A)
    if D2 > 0:
        env[A:A + D2] = 1 + (s - 1) * (1 - np.exp(-5 * np.arange(D2) / D))
    R = min(R, n)
    env[n - R:] *= np.linspace(1, 0, R) ** 1.5
    return env


def polyblep(t, dt):
    out = np.zeros_like(t)
    dt = np.broadcast_to(dt, t.shape)
    m = t < dt
    x = t[m] / dt[m]
    out[m] = x + x - x * x - 1
    m2 = t > 1 - dt
    x = (t[m2] - 1) / dt[m2]
    out[m2] = x * x + x + x + 1
    return out


def saw(freq, n, phase0=None, vib=0.0, vib_rate=5.0):
    f = np.full(n, freq, dtype=np.float64) if np.isscalar(freq) else freq
    if vib:
        f = f * (1 + vib * np.sin(2 * np.pi * vib_rate * np.arange(n) / SR + rng.random() * 6))
    dt = f / SR
    ph = (np.cumsum(dt) + (rng.random() if phase0 is None else phase0)) % 1.0
    return 2 * ph - 1 - polyblep(ph, dt)


def square(freq, n, duty=0.5, vib=0.0, vib_rate=5.5):
    f = np.full(n, freq, dtype=np.float64) if np.isscalar(freq) else freq
    if vib:
        f = f * (1 + vib * np.sin(2 * np.pi * vib_rate * np.arange(n) / SR))
    dt = f / SR
    ph = np.cumsum(dt) % 1.0
    s = np.where(ph < duty, 1.0, -1.0)
    s += polyblep(ph, dt)
    s -= polyblep((ph - duty) % 1.0, dt)
    return s


def sine(freq, n, phase=0.0):
    f = np.full(n, freq, dtype=np.float64) if np.isscalar(freq) else freq
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)


def noise(n):
    return rng.standard_normal(n)


def lp(x, fc, order=2):
    sos = signal.butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=-1)


def hp(x, fc, order=2):
    sos = signal.butter(order, fc, 'high', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=-1)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, min(hi, SR * 0.45)], 'band', fs=SR, output='sos')
    return signal.sosfilt(sos, x, axis=-1)


def sweep_lp(x, fc_curve):
    """Time-varying lowpass: blend of fixed filters by per-sample cutoff (log-spaced bank)."""
    bank = np.geomspace(60, 16000, 14)
    outs = np.stack([lp(x, f, 2) for f in bank])
    lf = np.log(np.clip(fc_curve, bank[0], bank[-1]))
    idx = np.interp(lf, np.log(bank), np.arange(len(bank)))
    i0 = np.floor(idx).astype(int)
    i1 = np.minimum(i0 + 1, len(bank) - 1)
    w = idx - i0
    ar = np.arange(len(x))
    return outs[i0, ar] * (1 - w) + outs[i1, ar] * w


def pan(x, p):
    """p in -1..1 -> stereo (2, n)"""
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)])


class Track:
    def __init__(self, dur):
        self.buf = np.zeros((2, int(dur * SR) + SR * 8))

    def add(self, t, x, gain=1.0, p=0.0):
        if x.ndim == 1:
            x = pan(x, p)
        i = int(t * SR)
        if i < 0:
            x = x[:, -i:]; i = 0
        n = min(x.shape[1], self.buf.shape[1] - i)
        if n > 0:
            self.buf[:, i:i + n] += x[:, :n] * gain


def make_ir(dur=3.0, pre=0.02, damp=6000, bright=0.0, seed=3):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    tt = np.arange(n) / SR
    env = np.exp(-6.9 * tt / dur)
    L = r.standard_normal(n) * env
    R = r.standard_normal(n) * env
    # darken the tail over time
    L = lp(L, damp); R = lp(R, damp)
    early = np.zeros((2, n))
    for k in range(12):
        d = int((0.005 + r.random() * 0.06) * SR)
        early[0, d] += (r.random() - 0.5) * 0.6
        early[1, int(d * (0.9 + r.random() * 0.2))] += (r.random() - 0.5) * 0.6
    ir = np.stack([L, R]) * 0.3 + early
    ir = np.concatenate([np.zeros((2, int(pre * SR))), ir], axis=1)
    return ir / np.sqrt((ir ** 2).sum() / 2)


def reverb(x, ir, wet=0.3):
    out = np.stack([signal.fftconvolve(x[0], ir[0])[:x.shape[1]], signal.fftconvolve(x[1], ir[1])[:x.shape[1]]])
    return out * wet


def soft_clip(x, drive=1.0):
    return np.tanh(x * drive) / np.tanh(drive)


def compress(x, thresh_db=-18, ratio=3.0, attack=0.005, release=0.15, makeup_db=0.0):
    lvl = np.max(np.abs(x), axis=0)
    # envelope follower (vectorized approx: filter the level)
    a = np.exp(-1 / (attack * SR)); r = np.exp(-1 / (release * SR))
    env = signal.lfilter([1 - r], [1, -r], lvl)
    env = np.maximum(env, signal.lfilter([1 - a], [1, -a], lvl))
    db = 20 * np.log10(env + 1e-9)
    over = np.maximum(0, db - thresh_db)
    gain_db = -over * (1 - 1 / ratio) + makeup_db
    return x * 10 ** (gain_db / 20)


def limiter(x, ceiling=0.93, look=0.004, release=0.12):
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    n = max(3, int(look * SR))
    lvl = np.max(np.abs(x), axis=0)
    g = np.minimum(1.0, ceiling / (lvl + 1e-9))
    gm = minimum_filter1d(g, size=2 * n + 1)
    gs = uniform_filter1d(gm, size=n)
    # slow release
    r = np.exp(-1 / (release * SR))
    out = signal.lfilter([1 - r], [1, -r], gs - 1) + 1
    gs = np.minimum(gs, np.maximum(out, gs))
    return np.clip(x * gs, -ceiling, ceiling)
