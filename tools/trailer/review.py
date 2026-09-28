# storyboard of the final video: thumbnails every `step` seconds, 5 per row
import sys, subprocess, os, numpy as np
from PIL import Image, ImageDraw
ff = os.environ['FFMPEG']
video, t0, t1, step = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
out = sys.argv[5]
ts = np.arange(t0, t1, step)
tw, th = 384, 216
cols = 5
sheet = Image.new('RGB', (cols * tw, ((len(ts) + cols - 1) // cols) * (th + 18)), (30, 30, 30))
d = ImageDraw.Draw(sheet)
for i, t in enumerate(ts):
    raw = subprocess.run([ff, '-loglevel', 'error', '-ss', f'{t:.3f}', '-i', video, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{tw}x{th}', '-'], capture_output=True).stdout
    if len(raw) == tw * th * 3:
        sheet.paste(Image.frombytes('RGB', (tw, th), raw), ((i % cols) * tw, (i // cols) * (th + 18) + 18))
    d.text(((i % cols) * tw + 4, (i // cols) * (th + 18) + 3), f'{t:.2f}s', fill=(255, 255, 0))
sheet.save(out)
