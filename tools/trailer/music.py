"""The trailer score. 120 BPM; timeline in seconds matches edit.py."""
import numpy as np
from scipy.io import wavfile
from synth import *

DUR = 72.0
BEAT = 0.5

# ---------------- instruments ----------------

def piano(note, dur, vel=0.8):
    f = hz(note)
    n = int((dur + 2.5) * SR)
    tt = np.arange(n) / SR
    x = np.zeros(n)
    B = 0.0004
    for k in range(1, 14):
        fk = f * k * np.sqrt(1 + B * k * k)
        if fk > SR * 0.45:
            break
        decay = 1.2 + 3.5 / k
        amp = (1.0 / k ** 1.1) * (vel ** (0.5 + k * 0.08))
        x += amp * np.sin(2 * np.pi * fk * tt + rng.random()) * np.exp(-tt / decay * (1 + k * 0.15))
    x *= np.minimum(1, tt / 0.003)
    rel = int(dur * SR)
    if rel < n:
        x[rel:] *= np.exp(-np.arange(n - rel) / (0.25 * SR))
    ham = lp(noise(int(0.02 * SR)), 3000) * np.exp(-np.arange(int(0.02 * SR)) / (0.004 * SR)) * 0.05
    x[:len(ham)] += ham
    return x * 0.25 * vel


def pad(notes, dur, bright=1800, a=1.5, r=1.5, detune=0.012, voices=5):
    n = int((dur + r) * SR)
    out = np.zeros((2, n))
    for nt in notes:
        f = hz(nt)
        for v in range(voices):
            d = 1 + detune * (v - (voices - 1) / 2) / voices * 2
            x = saw(f * d, n, vib=0.002, vib_rate=4 + v * 0.3)
            out += pan(x, (v / (voices - 1)) * 1.6 - 0.8 if voices > 1 else 0)
    env = adsr(n, a=a, d=0.5, s=0.9, r=r)
    out = lp(out * env, bright, 2)
    return out / (voices * len(notes)) * 0.9


def strings_stac(note, vel=0.8, length=0.14):
    f = hz(note)
    n = int((length + 0.25) * SR)
    x = np.zeros((2, n))
    for v in range(4):
        d = 1 + 0.006 * (v - 1.5)
        x += pan(saw(f * d, n), -0.6 + v * 0.4)
    env = adsr(n, a=0.006, d=0.08, s=0.45, r=0.2)
    x = lp(x * env, 2200 + 1800 * vel)
    return x * 0.12 * vel


def brass(notes, dur, vel=1.0, swell=0.08, fc_hi=3200):
    n = int((dur + 0.6) * SR)
    x = np.zeros((2, n))
    for nt in notes:
        f = hz(nt)
        for v in range(3):
            d = 1 + 0.004 * (v - 1)
            x += pan(saw(f * d, n, vib=0.003, vib_rate=5), -0.5 + 0.5 * v)
    tt = np.arange(n) / SR
    fc = 300 + (fc_hi * vel) * (1 - np.exp(-tt / swell)) * np.exp(-tt / (dur * 1.5 + 0.2))
    env = adsr(n, a=0.02, d=0.3, s=0.8, r=0.5)
    out = np.stack([sweep_lp(x[0] * env, fc), sweep_lp(x[1] * env, fc)])
    return soft_clip(out * 0.5, 1.5) * 0.35 / np.sqrt(len(notes))


def braam(root='A1', dur=3.5, vel=1.0):
    notes = [midi(root), midi(root) + 7, midi(root) + 12, midi(root) + 19, midi(root) + 24]
    n = int(dur * SR)
    tt = np.arange(n) / SR
    x = np.zeros((2, n))
    for i, m in enumerate(notes):
        for v in range(4):
            d = 1 + 0.01 * (v - 1.5)
            x += pan(saw(hz(m) * d, n), (v - 1.5) / 2)
    fc = 200 + 2600 * vel * np.exp(-tt / 0.6) * (1 - np.exp(-tt / 0.03)) + 250 * np.exp(-tt / 2)
    x = np.stack([sweep_lp(x[0], fc), sweep_lp(x[1], fc)])
    x = soft_clip(x * 0.4, 2.2)
    env = np.minimum(1, tt / 0.015) * np.exp(-tt / (dur * 0.45))
    sub = sine(hz(root) / 1, n) * np.exp(-tt / 1.5) * 0.6
    out = x * env * 0.5 + pan(sub, 0)
    return out * vel


def choir(notes, dur, vowel='a', vel=0.8, a=0.6, r=1.2):
    F = {'a': [(800, 1.0), (1150, 0.5), (2900, 0.25)], 'o': [(500, 1.0), (900, 0.4), (2600, 0.1)]}[vowel]
    n = int((dur + r) * SR)
    out = np.zeros((2, n))
    for nt in notes:
        f = hz(nt)
        for v in range(6):
            d = 1 + 0.008 * (v - 2.5)
            x = saw(f * d, n, vib=0.006, vib_rate=5 + v * 0.2)
            y = sum(g * bp(x, fc * 0.85, fc * 1.15) for fc, g in F)
            out += pan(y, (v - 2.5) / 3)
    env = adsr(n, a=a, d=0.3, s=0.9, r=r)
    return out * env * 0.3 * vel / len(notes)


def chip_lead(note, dur, vel=0.8):
    n = int((dur + 0.08) * SR)
    x = square(hz(note), n, duty=0.25, vib=0.004)
    x += 0.5 * square(hz(note) * 1.003, n, duty=0.5)
    env = adsr(n, a=0.005, d=0.1, s=0.75, r=0.06)
    return lp(x * env, 5000) * 0.09 * vel


def bass_note(note, dur, vel=0.9):
    n = int((dur + 0.05) * SR)
    x = saw(hz(note), n) + 0.6 * sine(hz(note) / 2, n)
    tt = np.arange(n) / SR
    fc = 180 + 900 * np.exp(-tt / 0.08)
    env = adsr(n, a=0.004, d=0.1, s=0.8, r=0.04)
    return soft_clip(sweep_lp(x * env, fc) * 0.9, 1.6) * 0.35 * vel


def taiko(vel=1.0, pitch=1.0):
    n = int(1.6 * SR)
    tt = np.arange(n) / SR
    f = (55 + 110 * np.exp(-tt / 0.04)) * pitch
    body = sine(f, n) * np.exp(-tt / 0.35)
    skin = lp(noise(n), 1200) * np.exp(-tt / 0.05) * 0.5
    x = soft_clip((body + skin) * 1.3, 1.5)
    return x * 0.55 * vel


def snare(vel=0.8):
    n = int(0.5 * SR)
    tt = np.arange(n) / SR
    x = bp(noise(n), 1200, 9000) * np.exp(-tt / 0.12) * 0.6 + sine(200 * (1 + np.exp(-tt / 0.01)), n) * np.exp(-tt / 0.06) * 0.5
    return x * 0.35 * vel


def hat(vel=0.5, open_=False):
    n = int((0.3 if open_ else 0.06) * SR)
    tt = np.arange(n) / SR
    return hp(noise(n), 7000) * np.exp(-tt / (0.09 if open_ else 0.015)) * 0.12 * vel


def crash(vel=1.0):
    n = int(3.5 * SR)
    tt = np.arange(n) / SR
    x = hp(noise(n), 3500) * np.exp(-tt / 0.9) * 0.3
    return np.stack([x, np.roll(hp(noise(n), 3500) * np.exp(-tt / 0.9) * 0.3, 7)]) * vel


def impact(vel=1.0):
    """big cinematic hit: sub drop + taiko + noise burst"""
    n = int(3.0 * SR)
    tt = np.arange(n) / SR
    sub = sine(45 + 60 * np.exp(-tt / 0.08), n) * np.exp(-tt / 1.0)
    burst = lp(noise(n), 2500) * np.exp(-tt / 0.15) * 0.6
    x = soft_clip((sub * 1.1 + burst) * 1.2, 1.4) * 0.8
    return np.stack([x, x]) * vel


def riser(dur, up=True, vel=1.0):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    k = tt / dur
    fc = 300 * (40 ** k) if up else 12000 * (0.03 ** k)
    x = noise(n)
    y = sweep_lp(x, fc) - sweep_lp(x, fc * 0.4)
    env = (k ** 2) if up else (1 - k) ** 2
    tone = sine(110 * (8 ** k), n) * 0.15 * k ** 3
    out = (y * 0.5 + tone) * env
    return np.stack([out, np.roll(out, 60)]) * vel


def reverse_cymbal(dur, vel=1.0):
    c = crash(1.0)[:, :int(dur * SR)]
    return c[:, ::-1] * vel


def heartbeat(vel=1.0):
    n = int(0.6 * SR)
    tt = np.arange(n) / SR
    thump = sine(50 + 30 * np.exp(-tt / 0.02), n) * np.exp(-tt / 0.08)
    x = thump.copy()
    d = int(0.22 * SR)
    x[d:] += thump[:n - d] * 0.7
    return x * 0.9 * vel


def bell(note, vel=0.6):
    f = hz(note)
    n = int(2.5 * SR)
    tt = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * r * tt) * np.exp(-tt / d) for r, a, d in [(1, 1, 1.2), (2.76, 0.4, 0.5), (5.4, 0.2, 0.25), (8.9, 0.1, 0.12)])
    return x * 0.12 * vel * np.minimum(1, tt / 0.002)


# ---------------- the score ----------------

def build():
    tr = {k: Track(DUR) for k in ['drums', 'bass', 'str', 'brass', 'pno', 'choir', 'lead', 'fx', 'pad']}

    # ===== ACT I: 0 - 14 (mystery) =====
    tr['fx'].add(0.0, impact(0.18))
    tr['pad'].add(0.0, lp(pad(['A1', 'E2'], 14.0, bright=400, a=2.5, r=1.0), 500), 0.3)
    tr['pad'].add(3.0, pad(['A3', 'C4', 'E4'], 4.0, bright=1200, a=2.0), 0.3)
    tr['pad'].add(7.0, pad(['F3', 'A3', 'C4'], 4.0, bright=1300, a=1.5), 0.3)
    tr['pad'].add(11.0, pad(['E3', 'G#3', 'B3'], 3.0, bright=1500, a=1.2, r=0.4), 0.35)
    # slow piano: the mine theme (Am - F - E)
    mel = [(3.0, 'A4', 1.0), (4.0, 'C5', 0.5), (4.5, 'E5', 1.0), (5.5, 'D5', 0.5), (6.0, 'C5', 1.0),
           (7.0, 'A4', 1.0), (8.0, 'F4', 0.5), (8.5, 'A4', 1.0), (9.5, 'C5', 1.5),
           (11.0, 'B4', 1.0), (12.0, 'G#4', 0.5), (12.5, 'E5', 0.5), (13.0, 'B4', 0.5), (13.5, 'G#4', 0.5)]
    for t, nt, d in mel:
        tr['pno'].add(t, piano(nt, d, 0.7), 1.0, 0.1)
        tr['pno'].add(t, piano(nt[:-1] + str(int(nt[-1]) - 1), d, 0.4), 0.5, -0.1)
    for t, nt in [(3.0, 'A2'), (7.0, 'F2'), (11.0, 'E2')]:
        tr['pno'].add(t, piano(nt, 3.5, 0.6), 0.9)
    # music box twinkles in the dark
    for i, nt in enumerate(['E6', 'A6', 'C7', 'E6', 'B6', 'E7', 'G#6', 'B6']):
        tr['fx'].add(8.0 + i * 0.75, bell(nt, 0.5), 0.5, (i % 3 - 1) * 0.6)
    # pulse rising into the braam
    for i in range(12):
        t = 11.0 + i * 0.25
        tr['drums'].add(t, taiko(0.25 + i * 0.04, 1.4), 0.45)
    tr['fx'].add(12.0, riser(2.0, vel=0.6))

    # BRAAM at 14.0 : "TWO LEGENDARY HEROES"
    tr['brass'].add(14.0, braam('A1', 4.0, 1.0), 1.0)
    tr['fx'].add(14.0, impact(0.45))
    tr['drums'].add(14.0, taiko(1.0, 0.8))
    tr['str'].add(14.0, pad(['A4', 'E5'], 3.8, bright=4000, a=0.05, r=0.1, detune=0.02), 0.3)
    # fake-epic heroic swell 16.0 -> hard cut 17.95
    tr['brass'].add(16.0, brass(['C3', 'G3', 'C4', 'E4'], 1.95, 1.0, swell=0.4), 1.0)
    tr['choir'].add(16.0, choir(['C4', 'E4', 'G4'], 1.95, 'a', 1.0, a=0.3, r=0.02), 1.0)
    tr['drums'].add(16.0, taiko(0.9, 1.0))
    for i in range(7):
        tr['drums'].add(16.5 + i * 0.2, taiko(0.3 + i * 0.08, 1.2))
    # (silence 17.95 - 19.0: the sneeze)
    # riser into the drop
    tr['fx'].add(19.0, reverse_cymbal(1.0, 0.9))
    tr['fx'].add(19.0, riser(1.0, vel=0.8))
    for i in range(8):
        tr['drums'].add(19.0 + i * 0.125, snare(0.3 + i * 0.09))

    # ===== ACT II: 20 - 44 (the dig) C - Am - F - G =====
    chords = [('C', ['C3', 'E3', 'G3'], 'C2'), ('Am', ['A2', 'C3', 'E3'], 'A1'), ('F', ['F2', 'A2', 'C3'], 'F1'), ('G', ['G2', 'B2', 'D3'], 'G1')]
    arps = {'C': ['C4', 'E4', 'G4', 'C5'], 'Am': ['A3', 'C4', 'E4', 'A4'], 'F': ['F3', 'A3', 'C4', 'F4'], 'G': ['G3', 'B3', 'D4', 'G4']}
    camp_lead = [
        'E5 - G5 . A5 - G5 . E5 - D5 . C5 - - .',
        'C5 - E5 . A5 - G5 . E5 - - . D5 . C5 .',
        'A4 - C5 . F5 - E5 . C5 - A4 . C5 - - .',
        'B4 - D5 . G5 - F5 . D5 - - . B4 - - .',
        'E5 - G5 . C6 - B5 . A5 - G5 . E5 - - .',
        'C5 - E5 . A5 - C6 . B5 - A5 . G5 . E5 .',
        'F5 - A5 . C6 - A5 . G5 - F5 . E5 - D5 .',
        'D5 - E5 . D5 - B4 . C5 - - . G5 - - .',
    ]
    t0 = 20.0
    for bar in range(12):
        tb = t0 + bar * 2.0
        name, triad, root = chords[bar % 4]
        last = bar == 11
        # drums: epic taiko groove + snare backbeat + hats
        for b in range(4):
            tt = tb + b * 0.5
            if b in (0, 2) or (b == 3 and bar % 2 == 1):
                tr['drums'].add(tt, taiko(1.0 if b == 0 else 0.75, 1.0))
            if b in (1, 3):
                tr['drums'].add(tt, snare(0.9))
            for h in range(2):
                tr['drums'].add(tt + h * 0.25, hat(0.6 if h else 0.4), 1.0, 0.3)
        tr['drums'].add(tb + 1.75, taiko(0.5, 1.3))
        if bar % 4 == 0:
            tr['drums'].add(tb, crash(0.6))
        # bass: driving 8ths
        for e in range(8):
            nt = root if e % 4 != 3 else (root[:-1] + str(int(root[-1]) + 1))
            tr['bass'].add(tb + e * 0.25, bass_note(nt, 0.22, 0.9 if e % 2 == 0 else 0.7))
        # staccato string arps in 16ths
        ap = arps[name]
        for s16 in range(16):
            nt = ap[[0, 1, 2, 3, 2, 1, 2, 3][s16 % 8]]
            if bar >= 8:
                nt = nt[:-1] + str(int(nt[-1]) + 1)
            tr['str'].add(tb + s16 * 0.125, strings_stac(nt, 0.55 + 0.35 * (s16 % 4 == 0)), 1.0, 0.4 if s16 % 2 else -0.4)
        # brass chord stabs / swells
        tr['brass'].add(tb, brass([n for n in triad], 1.9, 0.75 + 0.1 * (bar >= 4), swell=0.15), 0.8)
        # hero theme on the chip lead (the game's camp song), 8 bars then repeat last 4 an octave up
        line = camp_lead[bar] if bar < 8 else camp_lead[4 + (bar - 8)]
        toks = line.split()
        for i, tok in enumerate(toks):
            if tok in ('.', '-'):
                continue
            ln = 1
            while i + ln < 16 and toks[i + ln] == '-':
                ln += 1
            nt = tok if bar < 8 else tok[:-1] + str(int(tok[-1]) + 1)
            tr['lead'].add(tb + i * 0.125, chip_lead(nt, ln * 0.125 * 0.95, 1.0), 1.0, 0.1)
            if bar >= 4:
                tr['lead'].add(tb + i * 0.125, chip_lead(nt[:-1] + str(int(nt[-1]) - 1), ln * 0.125 * 0.95, 0.6), 1.0, -0.2)
        if bar >= 8:
            tr['choir'].add(tb, choir([n[:-1] + str(int(n[-1]) + 1) for n in triad], 1.9, 'a', 0.9, a=0.2, r=0.3), 1.0)
    # 42-44: drum build, final hit at 44 then silence
    for i in range(16):
        tr['drums'].add(42.0 + i * 0.125, snare(0.4 + i * 0.04))
    tr['fx'].add(43.0, riser(1.0, vel=0.7))
    tr['fx'].add(44.0, impact(0.4))
    tr['brass'].add(44.0, braam('A1', 3.0, 0.6))

    # ===== ACT III: 44 - 58.5 =====
    for i in range(6):
        tr['drums'].add(45.0 + i * 0.9, heartbeat(0.9))
    tr['str'].add(44.5, pad(['E5', 'A5'], 6.0, bright=5000, a=2.0, r=0.2, detune=0.025, voices=6), 0.25)
    tr['pad'].add(46.0, pad(['A1', 'E2', 'A2'], 4.4, bright=600, a=1.5, r=0.2), 1.0)
    tr['fx'].add(47.5, riser(3.0, vel=0.9))
    tr['choir'].add(46.0, choir(['A3', 'E4'], 4.4, 'o', 0.7, a=2.0, r=0.2), 1.0)
    # countdown hits 50.5, 51.5, 52.5
    for i, t in enumerate([50.5, 51.4, 52.3]):
        tr['drums'].add(t, taiko(1.0, 0.9 + i * 0.1))
        tr['fx'].add(t, impact(0.25 + i * 0.07))
        tr['brass'].add(t, brass([['A2', 'E3'], ['B2', 'F#3'], ['C#3', 'G#3']][i], 0.9, 1.0, swell=0.05), 1.0)
        for k in range(4):
            tr['drums'].add(t + 0.45 + k * 0.1125, snare(0.3 + 0.15 * i))
    tr['fx'].add(52.22, reverse_cymbal(1.0, 1.0))
    # LIFTOFF 53.5: the anthem (camp theme, half time, C major)
    tr['fx'].add(53.22, impact(0.5))
    tr['drums'].add(53.22, crash(1.0))
    anthem = [(53.22, 'C', 'E5', 1.0), (54.22, 'C', 'G5', 0.5), (54.72, 'C', 'A5', 0.5), (55.22, 'F', 'A5', 1.0), (56.22, 'G', 'G5', 1.0), (57.22, 'G', 'D5', 1.28)]
    chord_notes = {'C': ['C3', 'G3', 'C4', 'E4', 'G4'], 'F': ['F2', 'C3', 'F3', 'A3', 'C4'], 'G': ['G2', 'D3', 'G3', 'B3', 'D4']}
    for t, (c, n, d) in [(53.22, ('C', None, 2.0)), (55.22, ('F', None, 1.0)), (56.22, ('G', None, 2.28))]:
        tr['brass'].add(t, brass(chord_notes[c], d, 1.0, swell=0.2), 1.1)
        tr['choir'].add(t, choir(chord_notes[c][2:], d, 'a', 1.0, a=0.1, r=0.3), 1.2)
        tr['pad'].add(t, pad(chord_notes[c], d, bright=3500, a=0.1, r=0.3), 0.7)
        tr['bass'].add(t, bass_note(chord_notes[c][0][:-1] + '1', d, 1.0))
    for t, c, nt, d in anthem:
        tr['lead'].add(t, brass([nt], d * 0.95, 1.0, swell=0.05, fc_hi=5000), 1.0)
        tr['lead'].add(t, chip_lead(nt, d * 0.9, 1.0), 1.0)
    for k in range(10):
        if 53.22 + k * 0.5 < 57.5:
            tr['drums'].add(53.22 + k * 0.5, taiko(0.9 if k % 2 == 0 else 0.6, 1.0))
            tr['drums'].add(53.47 + k * 0.5, snare(0.5))
    for i in range(8):
        tr['drums'].add(57.5 + i * 0.125, snare(0.4 + i * 0.07))
        tr['drums'].add(57.5 + i * 0.125, taiko(0.3 + i * 0.07, 1.3))

    # ===== TITLE 58.5 =====
    tr['fx'].add(58.5, impact(0.55))
    tr['drums'].add(58.5, crash(1.2))
    tr['drums'].add(58.5, taiko(1.0, 0.7))
    tr['brass'].add(58.5, braam('C2', 5.0, 1.0), 0.9)
    tr['brass'].add(58.5, brass(['C3', 'G3', 'C4', 'E4', 'G4', 'C5'], 3.0, 1.0, swell=0.1), 1.0)
    tr['choir'].add(58.5, choir(['C4', 'E4', 'G4', 'C5'], 3.5, 'a', 1.0, a=0.05, r=2.0), 1.1)
    tr['pad'].add(58.5, pad(['C3', 'G3', 'C4', 'E4'], 5.0, bright=2500, a=0.05, r=2.5), 0.6)
    # gentle music-box reprise of the camp tune under the tagline
    for i, nt in enumerate(['E6', 'G6', 'A6', 'G6', 'E6', 'D6', 'C6']):
        tr['fx'].add(61.0 + i * 0.25 + (0.25 if i >= 4 else 0), bell(nt, 0.7), 0.8, (i % 3 - 1) * 0.5)
    # ===== STINGER ~64.5+: silence for the burp, then a tiny chiptune ta-da
    for i, nt in enumerate(['C5', 'E5', 'G5', 'C6']):
        tr['lead'].add(68.6 + i * 0.07, chip_lead(nt, 0.1 if i < 3 else 0.5, 1.0), 1.2)
    return tr


MASTER = 1.1

def mix(tr):
    hall = make_ir(3.2, pre=0.03, damp=5000)
    room = make_ir(1.2, pre=0.01, damp=7000, seed=5)
    sends = {'drums': 0.25, 'bass': 0.0, 'str': 0.35, 'brass': 0.4, 'pno': 0.55, 'choir': 0.6, 'lead': 0.25, 'fx': 0.35, 'pad': 0.5}
    gains = {'drums': 0.85, 'bass': 0.8, 'str': 1.5, 'brass': 0.9, 'pno': 0.55, 'choir': 1.1, 'lead': 1.4, 'fx': 0.9, 'pad': 0.8}
    # sidechain pump in the montage: sustained parts dip on every beat
    n = tr['pad'].buf.shape[1]
    pump = np.ones(n)
    for b in np.arange(20.0, 44.0, 0.5):
        i = int(b * SR); L = int(0.3 * SR)
        seg = 1 - 0.38 * np.exp(-np.arange(min(L, n - i)) / (0.07 * SR))
        pump[i:i + len(seg)] = np.minimum(pump[i:i + len(seg)], seg)
    for k in ('pad', 'str', 'brass', 'choir'):
        tr[k].buf *= pump
    dry = sum(tr[k].buf * gains[k] for k in tr)
    wet = sum(tr[k].buf * gains[k] * sends[k] for k in tr)
    out = dry + reverb(wet, hall, 1.0) + reverb(tr['drums'].buf * 0.3, room, 1.0)
    # lead echo (ping pong-ish)
    d = int(0.375 * SR)
    lead = tr['lead'].buf * 0.25
    echo = np.zeros_like(lead)
    echo[0, d:] += lead[1, :-d]
    echo[1, 2 * d:] += lead[0, :-2 * d] * 0.6
    out += echo
    out = hp(out, 30)
    # the sneeze: hard silence 17.95 - 19.0 (the riser comes back in at 19)
    g = np.ones(out.shape[1])
    a, b = int(17.95 * SR), int(19.0 * SR)
    g[a:b] = 0
    g[a - 240:a] = np.linspace(1, 0, 240)
    out = out * g
    out = out + tr['fx'].buf[:, :out.shape[1]] * 0 # placeholder
    out = compress(out, thresh_db=-12, ratio=2.0, attack=0.01, release=0.25)
    out = out * MASTER
    out = limiter(out, 0.93)
    return out[:, :int(DUR * SR)]


if __name__ == '__main__':
    import time
    t = time.time()
    tr = build()
    print('built', time.time() - t)
    out = mix(tr)
    wavfile.write('music.wav', SR, (out.T * 32767).astype(np.int16))
    print('done', time.time() - t, 'peak', np.max(np.abs(out)))
