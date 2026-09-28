"""Cuts the trailer: grades, reframes and titles the captured clips, and pipes
1920x1080@60 frames into ffmpeg."""
import os, sys, json, math, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from scipy import ndimage

W, H, FPS = 1920, 1080, 60
DUR = 84.6
ROOT = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(ROOT, 'fonts')
CINZEL = lambda w: os.path.join(FONTS, 'fontsource-cinzel-5.3.0/files', f'cinzel-latin-{w}-normal.woff')
BAR = 60  # letterbox bar height (2.0:1)

# ---------------------------------------------------------------- EDL
# shot: clip, t (timeline start), d (duration), src (clip seconds at t),
# zoom (z0, z1), c (centre x,y 0..1 start, end), grade, fade in/out (s)

B = 0.4876  # one beat of the Suno track (123 BPM)
SHOTS = [
    dict(clip='camp_night', t=2.04, d=4.96, src=0.4, zoom=(1.0, 1.10), c=((0.5, 0.55), (0.5, 0.55)), grade='night', fin=0.5),
    dict(clip='descend', t=7.0, d=4.98, src=1.4, zoom=(1.08, 1.0), grade='dark'),
    dict(clip='crystal', t=11.98, d=2.92, src=0.3, zoom=(1.15, 1.3), c=((0.5, 0.62), (0.52, 0.62)), grade='cave'),
    dict(clip='heroes', t=16.85, d=3.37, src=0.0, zoom=(1.0, 1.18), c=((0.5, 0.52), (0.5, 0.52)), grade='hero'),
    dict(clip='flurry_geode', t=20.22, d=0.49, src=0.3, zoom=(1.2, 1.25), grade='punch'),
    dict(clip='flurry_chest', t=20.71, d=0.25, src=0.55, zoom=(1.2, 1.25), grade='punch'),
    # ---- montage (drop at 21.18)
    dict(clip='dig_down', t=21.18, d=4 * B, src=0.45, zoom=(1.1, 1.0), grade='punch'),
    dict(clip='ore_streak', t=21.18 + 4 * B, d=4 * B, src=0.35, zoom=(1.0, 1.08), grade='punch'),
    dict(clip='boom', t=21.18 + 8 * B, d=4 * B, src=0.54, zoom=(1.05, 1.12), grade='punch'),
    dict(clip='lava_monster', t=21.18 + 12 * B, d=6 * B, src=0.39, zoom=(1.0, 1.06), grade='hot'),
    dict(clip='dino', t=21.18 + 18 * B, d=4 * B, src=1.27, zoom=(1.0, 1.08), grade='punch'),
    dict(clip='brick_spring', t=21.18 + 22 * B, d=4 * B, src=0.4, zoom=(1.3, 1.38), c=((0.5, 0.6), (0.5, 0.6)), grade='punch'),
    dict(clip='meteor', t=21.18 + 26 * B, d=4 * B, src=1.6, zoom=(1.25, 1.32), c=((0.5, 0.6), (0.5, 0.6)), grade='space'),
    dict(clip='bigchest', t=21.18 + 30 * B, d=3 * B, src=0.63, zoom=(1.05, 1.12), grade='punch'),
    dict(clip='bubble', t=21.18 + 33 * B, d=3 * B, src=0.55, zoom=(1.3, 1.35), c=((0.5, 0.6), (0.5, 0.6)), grade='cave'),
    dict(clip='flurry_chest', t=21.18 + 36 * B, d=2 * B, src=0.45, zoom=(1.1, 1.15), grade='punch'),
    dict(clip='flurry_geode', t=21.18 + 38 * B, d=2 * B, src=0.2, zoom=(1.1, 1.15), grade='punch'),
    dict(clip='dig_down', t=21.18 + 40 * B, d=41.1 - (21.18 + 40 * B), src=2.5, zoom=(1.15, 1.25), grade='punch'),
    # ---- the heart, the camp, the rocket
    dict(clip='core_heart', t=43.49, d=3.91, src=1.3, zoom=(1.0, 1.1), grade='core'),
    dict(clip='camp_build', t=47.4, d=2.5, src=3.62, zoom=(1.0, 1.05), grade='day'),
    dict(clip='camp_day', t=49.9, d=3.19, src=4.8, zoom=(1.0, 1.0), grade='day'),
    dict(clip='launch', t=53.09, d=3.5, src=0.0, speed=0.923, zoom=(1.4, 1.48), c=((0.5, 0.6), (0.5, 0.6)), grade='launch'),
    dict(clip='launch', t=56.59, d=1.5, src=3.25, zoom=(1.5, 1.2), c=((0.5, 0.6), (0.5, 0.58)), grade='launch'),
    dict(clip='launch', t=58.09, d=2.86, src=4.75, zoom=(1.2, 1.05), c=((0.5, 0.55), (0.5, 0.55)), grade='launch'),
    dict(clip='moon', t=60.95, d=5.27, src=0.6, zoom=(1.0, 1.08), grade='moon'),
    # ---- sizzle into the title
    dict(clip='lava_monster', t=66.22, d=2 * B, src=3.8, zoom=(1.25, 1.3), c=((0.6, 0.55), (0.6, 0.55)), grade='hot'),
    dict(clip='brick_spring', t=66.22 + 2 * B, d=2 * B, src=1.8, zoom=(1.3, 1.35), c=((0.5, 0.5), (0.5, 0.5)), grade='punch'),
    dict(clip='meteor', t=66.22 + 4 * B, d=2 * B, src=3.25, zoom=(1.3, 1.35), c=((0.55, 0.6), (0.55, 0.6)), grade='space'),
    dict(clip='dino', t=66.22 + 6 * B, d=2 * B, src=1.9, zoom=(1.1, 1.15), grade='punch'),
    dict(clip='boom', t=66.22 + 8 * B, d=2 * B, src=1.2, zoom=(1.15, 1.2), grade='punch'),
    dict(clip='crystal', t=66.22 + 10 * B, d=2 * B, src=4.4, zoom=(1.2, 1.25), c=((0.5, 0.6), (0.5, 0.6)), grade='cave'),
    dict(clip='dig_down', t=66.22 + 12 * B, d=72.79 - (66.22 + 12 * B), src=1.2, zoom=(1.2, 1.3), grade='punch'),
    # ---- stinger
    dict(clip='drink', t=79.4, d=3.4, src=0.2, zoom=(1.0, 1.04), grade='day', fin=0.25),
]

TEXTS = [
    dict(kind='story', text='BENEATH EVERY BACKYARD...', t=0.2, d=1.8),
    dict(kind='story', text='...A HIDDEN WORLD IS WAITING', t=7.5, d=3.6),
    dict(kind='story_big', text='TWO LEGENDARY HEROES', t=14.95, d=1.85),
    dict(kind='slam', text='DIG DEEP', t=21.18, d=4 * B - 0.05),
    dict(kind='slam_small', text='EIGHT LAYERS DOWN', t=21.18 + 8 * B, d=4 * B - 0.05),
    dict(kind='slam_small', text='BECOME A LAVA MONSTER', t=21.18 + 13 * B, d=5 * B - 0.05),
    dict(kind='slam', text='DINOSAURS', t=21.18 + 18 * B, d=4 * B - 0.05),
    dict(kind='slam', text='ROBOTS', t=21.18 + 22 * B, d=4 * B - 0.05),
    dict(kind='slam', text='ALIENS', t=21.18 + 26 * B, d=4 * B - 0.05),
    dict(kind='slam_small', text='PLAY TOGETHER', t=21.18 + 30 * B, d=6 * B - 0.05),
    dict(kind='story', text='AT THE VERY BOTTOM OF THE WORLD...', t=41.2, d=2.2),
    dict(kind='slam_small', text='THE HEART OF THE WORLD', t=43.49, d=3.8),
    dict(kind='slam_small', text='BUILD YOUR CAMP', t=47.4, d=2.45),
    dict(kind='slam_small', text='BUILD A ROCKET', t=50.29, d=2.75),
    dict(kind='slam_small', text='NEXT STOP: THE MOON', t=61.74, d=4.4),
    dict(kind='count', text='3', t=53.66, d=0.93),
    dict(kind='count', text='2', t=54.64, d=0.93),
    dict(kind='count', text='1', t=55.61, d=0.95),
]
BAND = np.exp(-((np.arange(H) - H / 2) / 120.0) ** 2)[:, None, None].astype(np.float32)
TITLE_T, TITLE_END, END_T = 72.79, 79.3, 82.9

def find_shot(t):
    for s in reversed(SHOTS):
        if s['t'] <= t < s['t'] + s['d']:
            return s
    return None


# ---------------------------------------------------------------- grading
GRADES = {
    #          contrast sat  lift   gain(r,g,b)           shadows tint     bloom
    'night':  dict(con=1.10, sat=1.05, lift=0.00, gain=(0.95, 1.0, 1.10), sh=(0.00, 0.01, 0.04), bloom=0.55, thr=0.55),
    'dark':   dict(con=1.12, sat=1.0, lift=0.0, gain=(1.0, 0.97, 0.95), sh=(0.01, 0.0, 0.03), bloom=0.3, thr=0.65),
    'cave':   dict(con=1.12, sat=1.2, lift=0.0, gain=(1.0, 1.0, 1.08), sh=(0.01, 0.0, 0.04), bloom=0.7, thr=0.5),
    'hero':   dict(con=1.10, sat=1.1, lift=0.0, gain=(1.06, 1.0, 0.92), sh=(0.0, 0.01, 0.03), bloom=0.35, thr=0.7),
    'punch':  dict(con=1.12, sat=1.18, lift=0.0, gain=(1.0, 0.98, 0.96), sh=(0.0, 0.01, 0.03), bloom=0.3, thr=0.72),
    'hot':    dict(con=1.12, sat=1.2, lift=0.0, gain=(1.08, 0.98, 0.9), sh=(0.02, 0.0, 0.02), bloom=0.6, thr=0.55),
    'space':  dict(con=1.12, sat=1.15, lift=0.0, gain=(0.98, 1.0, 1.08), sh=(0.0, 0.0, 0.05), bloom=0.6, thr=0.55),
    'day':    dict(con=1.06, sat=1.12, lift=0.0, gain=(1.0, 0.98, 0.95), sh=(0.0, 0.0, 0.02), bloom=0.08, thr=0.9),
    'moon':   dict(con=1.08, sat=1.1, lift=0.0, gain=(0.86, 0.87, 0.93), sh=(0.0, 0.0, 0.05), bloom=0.12, thr=0.9),
    'core':   dict(con=1.15, sat=1.2, lift=0.0, gain=(1.08, 0.97, 0.95), sh=(0.02, 0.0, 0.03), bloom=0.75, thr=0.45),
    'launch': dict(con=1.08, sat=1.12, lift=0.0, gain=(0.98, 0.98, 1.0), sh=(0.0, 0.0, 0.03), bloom=0.3, thr=0.8),
}


def grade(img, g):
    """img float32 HxWx3 0..1 at source resolution"""
    x = img * np.array(g['gain'], np.float32)
    # contrast around mid grey with a soft S
    x = 0.5 + (x - 0.5) * g['con']
    x = np.clip(x, 0, 1)
    x = x * x * (3 - 2 * x) * 0.25 + x * 0.75
    lum = (x @ np.array([0.2126, 0.7152, 0.0722], np.float32))[..., None]
    x = lum + (x - lum) * g['sat']
    # split tone: tint the shadows
    x = x + np.array(g['sh'], np.float32) * (1 - lum) ** 2
    # bloom
    if g['bloom'] > 0:
        b = np.clip((lum - g['thr']) / (1 - g['thr']), 0, 1) * x
        small = b[::4, ::4]
        small = ndimage.gaussian_filter(small, sigma=(6, 6, 0))
        big = np.repeat(np.repeat(small, 4, 0), 4, 1)[:x.shape[0], :x.shape[1]]
        small2 = ndimage.gaussian_filter(b[::8, ::8], sigma=(10, 10, 0))
        big2 = np.repeat(np.repeat(small2, 8, 0), 8, 1)[:x.shape[0], :x.shape[1]]
        x = x + (big * 0.8 + big2 * 0.6) * g['bloom']
    return np.clip(x, 0, 1)


# ---------------------------------------------------------------- frames
_cache = {}


def clip_frame(clip, idx):
    d = os.path.join(ROOT, 'clips', clip)
    n = len([f for f in os.listdir(d) if f.endswith('.png')]) if clip not in _cache else _cache[clip]
    _cache[clip] = n
    idx = max(0, min(n - 1, idx))
    return np.asarray(Image.open(os.path.join(d, f'{idx:05d}.png')).convert('RGB'), dtype=np.float32) / 255.0


def ease(u):
    return u * u * (3 - 2 * u)


def reframe(src, zoom, cx, cy, shake=(0, 0)):
    """src float HxWx3 (any res, 16:9). Returns uint8 1920x1080 crisp-ish."""
    h, w = src.shape[:2]
    k = W // w  # integer upscale factor (2 or 4)
    up = np.repeat(np.repeat((src * 255 + 0.5).astype(np.uint8), k, 0), k, 1)
    if abs(zoom - 1) < 1e-4 and shake == (0, 0):
        return up
    im = Image.fromarray(up)
    cw, ch = W / zoom, H / zoom
    x0 = np.clip(cx * W - cw / 2 + shake[0], 0, W - cw)
    y0 = np.clip(cy * H - ch / 2 + shake[1], 0, H - ch)
    return np.asarray(im.resize((W, H), Image.BICUBIC, box=(x0, y0, x0 + cw, y0 + ch)))


# vignette + grain (precomputed)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
_r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2)
VIG = (1 - 0.32 * np.clip(_r - 0.55, 0, 1) ** 1.6)[..., None].astype(np.float32)
_g = np.random.default_rng(1)
GRAIN = [np.repeat(np.repeat(_g.normal(0, 2.6, (H // 2, W // 2, 1)).astype(np.float32), 2, 0), 2, 1) for _ in range(12)]
del yy, xx, _r


# ---------------------------------------------------------------- text
def tracked(draw, xy, text, font, spacing, **kw):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, **kw)
        x += draw.textlength(ch, font=font) + spacing


def text_width(draw, text, font, spacing):
    return sum(draw.textlength(ch, font=font) for ch in text) + spacing * (len(text) - 1)


_text_cache = {}


def render_text(kind, text):
    key = (kind, text)
    if key in _text_cache:
        return _text_cache[key]
    if kind.startswith('story'):
        size, weight, spacing = (64, 700, 11) if kind == 'story' else (96, 900, 14)
    elif kind == 'slam':
        size, weight, spacing = 150, 900, 16
    elif kind == 'count':
        size, weight, spacing = 420, 900, 0
    else:
        size, weight, spacing = 96, 900, 10
    font = ImageFont.truetype(CINZEL(weight), size)
    tmp = ImageDraw.Draw(Image.new('L', (10, 10)))
    tw = int(text_width(tmp, text, font, spacing)) + 80
    th = size + 80
    mask = Image.new('L', (tw, th), 0)
    tracked(ImageDraw.Draw(mask), (40, 25), text, font, spacing, fill=255)
    m = np.asarray(mask, np.float32) / 255
    if kind.startswith('story'):
        col = np.zeros((th, tw, 3), np.float32) + np.array([0.96, 0.92, 0.84], np.float32)
        if kind == 'story_big':
            grad = np.linspace(0, 1, th)[:, None, None]
            col = (1 - grad) * np.array([1.0, 0.95, 0.75]) + grad * np.array([0.93, 0.66, 0.25])
        glow = ndimage.gaussian_filter(m, 14) * 0.55
        rgb = col * m[..., None] + np.array([1.0, 0.75, 0.4]) * glow[..., None] * (1 - m[..., None])
        a = np.clip(m + glow * 0.7, 0, 1)
    else:
        grad = np.linspace(0, 1, th)[:, None, None]
        top, mid, bot = np.array([1.0, 0.97, 0.78]), np.array([0.98, 0.78, 0.26]), np.array([0.72, 0.42, 0.10])
        col = np.where(grad < 0.55, top + (mid - top) * (grad / 0.55), mid + (bot - mid) * ((grad - 0.55) / 0.45))
        # bevel highlight line
        outline = np.clip(ndimage.grey_dilation(m, size=(7, 7)) - m, 0, 1)
        shadow = ndimage.shift(ndimage.gaussian_filter(ndimage.grey_dilation(m, size=(9, 9)), 6), (8, 6))
        glow = ndimage.gaussian_filter(m, 22) * 0.6
        rgb = col * m[..., None] + np.array([0.12, 0.06, 0.02]) * outline[..., None]
        a = np.clip(m + outline + shadow * 0.75, 0, 1)
        rgb = rgb + np.array([1.0, 0.7, 0.3]) * glow[..., None] * (1 - a[..., None])
        a = np.clip(a + glow * 0.5, 0, 1)
    out = (np.clip(rgb, 0, 1).astype(np.float32), a.astype(np.float32))
    _text_cache[key] = out
    return out


def composite(frame, rgb, a, cx, cy, scale=1.0, alpha=1.0):
    if alpha <= 0.003:
        return frame
    if abs(scale - 1) > 1e-3:
        h, w = a.shape
        nw, nh = max(1, int(w * scale)), max(1, int(h * scale))
        rgb = np.asarray(Image.fromarray((rgb * 255).astype(np.uint8)).resize((nw, nh), Image.BICUBIC), np.float32) / 255
        a = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((nw, nh), Image.BICUBIC), np.float32) / 255
    h, w = a.shape
    x0, y0 = int(cx - w / 2), int(cy - h / 2)
    fx0, fy0 = max(0, x0), max(0, y0)
    fx1, fy1 = min(W, x0 + w), min(H, y0 + h)
    if fx1 <= fx0 or fy1 <= fy0:
        return frame
    sub = frame[fy0:fy1, fx0:fx1].astype(np.float32)
    aa = a[fy0 - y0:fy1 - y0, fx0 - x0:fx1 - x0, None] * alpha
    cc = rgb[fy0 - y0:fy1 - y0, fx0 - x0:fx1 - x0] * 255
    frame[fy0:fy1, fx0:fx1] = (sub * (1 - aa) + cc * aa).astype(np.uint8)
    return frame


def text_layers(t, frame):
    for tx in TEXTS:
        u = t - tx['t']
        if u < 0 or u > tx['d']:
            continue
        rgb, a = render_text(tx['kind'], tx['text'])
        if tx['kind'].startswith('story'):
            fi = 0.6 if tx['kind'] == 'story' else 0.25
            alpha = min(1, u / fi, (tx['d'] - u) / 0.4)
            scale = 1.0 + 0.035 * (u / tx['d'])
            y = H / 2
            if find_shot(t) is not None:
                frame = (frame.astype(np.float32) * (1 - 0.5 * BAND * max(0, alpha))).astype(np.uint8)
        elif tx['kind'] == 'count':
            alpha = min(1, u / 0.04, (tx['d'] - u) / 0.3)
            scale = 0.8 * (1.0 + 0.5 * max(0, 1 - u / 0.1) ** 2 + 0.12 * u)
            y = H * 0.5
        else:
            alpha = min(1, u / 0.06, (tx['d'] - u) / 0.14)
            scale = 1.0 + 0.3 * max(0, 1 - u / 0.12) ** 2 + 0.05 * (u / tx['d'])
            y = H * 0.5 if tx['kind'] == 'slam' else H * 0.74
            if find_shot(t) is not None:
                band = np.exp(-((np.arange(H) - y) / (150.0 if tx['kind'] == 'slam' else 95.0)) ** 2)[:, None, None].astype(np.float32)
                frame = (frame.astype(np.float32) * (1 - 0.55 * band * max(0, alpha))).astype(np.uint8)
        x = W * 0.27 if tx['kind'] == 'count' else W / 2
        frame = composite(frame, rgb, a, x, y, scale, max(0, alpha))
    return frame


# ---------------------------------------------------------------- title card
LOGO = np.asarray(Image.open(os.path.join(ROOT, 'art/logo.png')).convert('RGBA'))


def title_card(t):
    """58.5 - 64.7: the logo slams in over a starfield, then tagline + call to action"""
    u = t - TITLE_T
    frame = np.zeros((H, W, 3), np.float32)
    # background: deep night gradient + stars drifting + warm glow behind the logo
    g = np.linspace(0, 1, H)[:, None, None]
    frame += (1 - g) * np.array([0.02, 0.02, 0.07]) + g * np.array([0.09, 0.05, 0.12])
    rs = np.random.default_rng(3)
    sx, sy, sb = rs.uniform(0, W, 260), rs.uniform(0, H, 260), rs.uniform(0.2, 1, 260)
    for x, y, b in zip(sx, sy, sb):
        x = (x - u * 12 * b) % W
        tw = 0.6 + 0.4 * math.sin(u * 3 + x)
        xi, yi = int(x), int(y)
        frame[yi:yi + 3, xi:xi + 3] += b * tw * 0.8
    # glow
    cy = 430
    ys, xs = np.ogrid[0:H, 0:W]
    glow = np.exp(-(((xs - W / 2) / 700.0) ** 2 + ((ys - cy) / 260.0) ** 2))
    pulse = min(1, u / 0.1) * (0.55 + 0.45 * math.exp(-u * 1.5))
    frame += glow[..., None] * np.array([0.9, 0.55, 0.25]) * 0.45 * pulse
    frame = np.clip(frame, 0, 1)
    out = (frame * 255).astype(np.uint8)
    # logo: slam from big to 1.0, then slow push
    sc = 6.0 * (1 + 0.6 * max(0, 1 - u / 0.14) ** 2 + 0.03 * u / 6)
    lw, lh = int(LOGO.shape[1] * sc), int(LOGO.shape[0] * sc)
    logo = np.asarray(Image.fromarray(LOGO).resize((lw, lh), Image.NEAREST), np.float32) / 255
    rgb, a = logo[..., :3], logo[..., 3]
    # shine sweep
    sweep = (u - 0.6) * 1.1
    if 0 < sweep < 1.4:
        xx = np.arange(lw)[None, :] / lw + np.arange(lh)[:, None] / lh * 0.25
        band = np.exp(-((xx - sweep) / 0.05) ** 2)
        rgb = np.clip(rgb + band[..., None] * 0.7, 0, 1)
    # drop shadow / glow for the logo
    sh = ndimage.gaussian_filter(a, 10)
    out = composite(out, np.zeros_like(rgb), sh * 0.8, W / 2 + 10, cy + 14, 1.0, min(1, u / 0.05))
    out = composite(out, rgb, a, W / 2, cy, 1.0, min(1, u / 0.05))
    # flash on the slam
    if u < 0.35:
        out = np.clip(out.astype(np.float32) + 255 * (1 - u / 0.35) ** 2 * 0.9, 0, 255).astype(np.uint8)
    # tagline and call to action
    for (kind, text, t0, y) in [('tag', 'A CO-OP DIGGING ADVENTURE FOR BIG AND LITTLE DIGGERS', 1.3, 740),
                                ('cta', 'PLAY FREE IN YOUR BROWSER', 2.6, 850),
                                ('url', 'mpsmith414.github.io/block-diggers', 3.0, 925),
                                ('feat', '1-2 PLAYERS  ·  CO-OP  ·  CONTROLLERS  ·  KEYBOARD  ·  TOUCH', 3.6, 985)]:
        uu = u - t0
        if uu < 0:
            continue
        rgb2, a2 = render_small(kind, text)
        out = composite(out, rgb2, a2, W / 2, y + 12 * max(0, 1 - uu / 0.5) ** 2, 1.0, min(1, uu / 0.5))
    # fade out at the end
    if u > TITLE_END - TITLE_T - 0.5:
        out = (out.astype(np.float32) * max(0, 1 - (u - (TITLE_END - TITLE_T - 0.5)) / 0.4)).astype(np.uint8)
    return out


def render_small(kind, text):
    key = ('small', kind, text)
    if key in _text_cache:
        return _text_cache[key]
    if kind == 'tag':
        font, spacing, col = ImageFont.truetype(CINZEL(700), 44), 6, (0.95, 0.9, 0.8)
    elif kind == 'cta':
        font, spacing, col = ImageFont.truetype(CINZEL(900), 66), 10, (1.0, 0.83, 0.35)
    elif kind == 'feat':
        font = ImageFont.truetype(os.path.join(FONTS, 'fontsource-oswald-5.3.0/files/oswald-latin-400-normal.woff'), 30)
        spacing, col = 4, (0.62, 0.62, 0.72)
    else:
        font = ImageFont.truetype(os.path.join(FONTS, 'fontsource-oswald-5.3.0/files/oswald-latin-500-normal.woff'), 44)
        spacing, col = 3, (0.85, 0.88, 0.95)
    tmp = ImageDraw.Draw(Image.new('L', (10, 10)))
    tw = int(text_width(tmp, text, font, spacing)) + 60
    th = font.size + 60
    mask = Image.new('L', (tw, th), 0)
    tracked(ImageDraw.Draw(mask), (30, 20), text, font, spacing, fill=255)
    m = np.asarray(mask, np.float32) / 255
    glow = ndimage.gaussian_filter(m, 8) * 0.35
    rgb = np.zeros((th, tw, 3), np.float32) + np.array(col, np.float32)
    a = np.clip(m + glow, 0, 1)
    _text_cache[key] = (rgb, a)
    return rgb, a


def end_card(t):
    u = t - END_T
    out = np.zeros((H, W, 3), np.uint8)
    sc = 3.0
    logo = np.asarray(Image.fromarray(LOGO).resize((int(LOGO.shape[1] * sc), int(LOGO.shape[0] * sc)), Image.NEAREST), np.float32) / 255
    al = min(1, max(0, (u - 0.45) / 0.15)) * min(1, max(0, (1.9 - u) / 0.4))
    out = composite(out, logo[..., :3], logo[..., 3], W / 2, H / 2 - 20, 1.0 + 0.15 * max(0, 1 - (u - 0.45) / 0.12), al)
    return out


# ---------------------------------------------------------------- per-frame
FLASHES = [21.18, 21.18 + 13 * B, 21.18 + 18 * B, 21.18 + 22 * B, 21.18 + 26 * B, 21.18 + 36 * B, 21.18 + 38 * B, 21.18 + 40 * B, 56.59, 61.74] + [66.22 + k * 2 * B for k in range(7)]
SHAKES = [(2.04, 0.5), (20.22, 0.6), (21.18, 1.0), (21.18 + 9 * B, 0.9), (21.18 + 13 * B, 0.6), (43.49, 0.7), (53.66, 0.4), (54.64, 0.5), (55.61, 0.6), (56.59, 1.0), (61.74, 0.6), (72.79, 0.8)]


def render(fi):
    t = fi / FPS
    if TITLE_T <= t < TITLE_END:
        return title_card(t)
    if t >= END_T:
        return end_card(t)
    s = find_shot(t)
    if s is None:
        frame = np.zeros((H, W, 3), np.uint8)
    else:
        u = t - s['t']
        k = u / s['d']
        idx = int(round((s['src'] + u * s.get('speed', 1.0)) * 60))
        src = clip_frame(s['clip'], idx)
        g = GRADES[s['grade']]
        src = grade(src, g)
        z = s['zoom'][0] + (s['zoom'][1] - s['zoom'][0]) * ease(k)
        c0, c1 = s.get('c', ((0.5, 0.5), (0.5, 0.5)))
        cx, cy = c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k
        # impacts shake the frame
        sh = (0.0, 0.0)
        for (ts, amp) in SHAKES:
            du = t - ts
            if 0 <= du < 0.5:
                e = amp * (1 - du / 0.5) ** 2 * 18
                sh = (sh[0] + e * math.sin(du * 90), sh[1] + e * math.cos(du * 77))
        if sh != (0.0, 0.0) and z < 1.03:
            z = 1.03
        frame = reframe(src, z, cx, cy, sh).astype(np.float32)
        frame *= VIG
        # fades
        fin = s.get('fin', 0)
        if fin and u < fin:
            frame *= ease(u / fin)
        # beat flashes
        for tf in FLASHES:
            du = t - tf
            if 0 <= du < 0.12:
                frame += 255 * 0.3 * (1 - du / 0.12) ** 2
        # chromatic aberration on big hits
        for (ts, amp) in SHAKES:
            du = t - ts
            if 0 <= du < 0.25 and amp >= 0.6:
                off = int(8 * amp * (1 - du / 0.25))
                if off:
                    frame[:, :, 0] = np.roll(frame[:, :, 0], off, 1)
                    frame[:, :, 2] = np.roll(frame[:, :, 2], -off, 1)
        frame += GRAIN[fi % len(GRAIN)]
        frame = np.clip(frame, 0, 255).astype(np.uint8)
    frame = text_layers(t, frame)
    # letterbox
    frame[:BAR] = 0
    frame[H - BAR:] = 0
    return frame


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'video.mp4')
    t0, t1 = (float(sys.argv[2]), float(sys.argv[3])) if len(sys.argv) > 3 else (0, DUR)
    frames = range(int(t0 * FPS), int(t1 * FPS))
    ff = os.environ.get('FFMPEG')
    p = subprocess.Popen([ff, '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                          '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    from multiprocessing import Pool
    with Pool(int(os.environ.get('WORKERS', '3'))) as pool:
        for i, fr in enumerate(pool.imap(render, frames, chunksize=4)):
            p.stdin.write(fr.tobytes())
            if i % 300 == 0:
                print('frame', i, flush=True)
    p.stdin.close()
    p.wait()


if __name__ == '__main__':
    main()
