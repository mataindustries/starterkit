"""Synthetic, license-free stand-in images for reviewing the graphics templates.

Nothing here is a real photo, person, place or brand. Run from the repo root:
    python3 qa/fixtures/make_fixtures.py
Needs numpy and Pillow. Logo lettering uses the fonts already embedded in index.html.
"""
import base64, os, re, sys, tempfile
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = HERE
ROOT = os.path.dirname(os.path.dirname(HERE))
rng = np.random.default_rng(7)


def embedded_font(family, weight):
    """Write one of index.html's embedded WOFF fonts to a temp file and return its path."""
    html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    m = re.search(r'font-family:"%s";font-weight:%d;font-style:normal;[^}]*?base64,([^)]+)\)' % (re.escape(family), weight), html)
    path = os.path.join(tempfile.gettempdir(), 'fixture-%s-%d.woff' % (family.replace(' ', '-'), weight))
    open(path, 'wb').write(base64.b64decode(m.group(1)))
    return path


def vgrad(w, h, top, bot):
    t = np.linspace(0, 1, h)[:, None, None]
    a = np.array(top, float)[None, None, :]
    b = np.array(bot, float)[None, None, :]
    return np.repeat(a * (1 - t) + b * t, w, axis=1)


def finish(img, blur=1.1, grain=4.0, vignette=0.18):
    img = img.filter(ImageFilter.GaussianBlur(blur))
    a = np.asarray(img).astype(float)
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    r = np.sqrt(((xx - w / 2) / (w / 2)) ** 2 + ((yy - h / 2) / (h / 2)) ** 2)
    a *= (1 - vignette * np.clip(r - 0.35, 0, 1) ** 1.6)[:, :, None]
    a += rng.normal(0, grain, a.shape)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))


def soft(layer_size, draw_fn, blur):
    m = Image.new('L', layer_size, 0)
    draw_fn(ImageDraw.Draw(m))
    return m.filter(ImageFilter.GaussianBlur(blur))


def paste_color(img, mask, color, opacity=1.0):
    col = Image.new('RGB', img.size, color)
    m = mask.point(lambda v: int(v * opacity))
    img.paste(col, (0, 0), m)


# 1 · Bright interior (landscape 3:2) — realtor / interior designer
W, H = 1800, 1200
a = vgrad(W, H, (238, 232, 222), (224, 215, 202))
xx = np.linspace(0, 1, W)[None, :, None]
a = a * (1.04 - 0.10 * xx)  # light falls off away from window
img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
d = ImageDraw.Draw(img)
# floor
floor_top = 830
fl = vgrad(W, H - floor_top, (196, 160, 120), (150, 112, 78))
img.paste(Image.fromarray(fl.astype(np.uint8)), (0, floor_top))
for i in range(14):
    y = floor_top + int((i / 14) ** 1.6 * (H - floor_top))
    d.line([(0, y), (W, y)], fill=(138, 102, 70), width=2)
# baseboard
d.rectangle([0, floor_top - 18, W, floor_top], fill=(246, 242, 236))
# window with sky + mullions
wx0, wy0, wx1, wy1 = 170, 110, 700, 760
sky = vgrad(wx1 - wx0, wy1 - wy0, (232, 240, 244), (250, 250, 246))
img.paste(Image.fromarray(sky.astype(np.uint8)), (wx0, wy0))
# distant trees in window
tm = soft(img.size, lambda g: [g.ellipse([wx0 + 20 + k * 90, wy1 - 260 - (k % 3) * 40, wx0 + 180 + k * 90, wy1 + 60], fill=255) for k in range(6)], 16)
paste_color(img, tm, (150, 172, 140), 0.55)
d = ImageDraw.Draw(img)
for x in (wx0, (wx0 + wx1) // 2, wx1):
    d.rectangle([x - 9, wy0, x + 9, wy1], fill=(244, 240, 233))
for y in (wy0, (wy0 + wy1) // 2, wy1):
    d.rectangle([wx0 - 9, y - 9, wx1 + 9, y + 9], fill=(244, 240, 233))
# light spill on floor
spill = soft(img.size, lambda g: g.polygon([(wx0 + 60, floor_top + 10), (wx1 - 20, floor_top + 10), (wx1 + 420, H), (wx0 + 260, H)], fill=255), 40)
paste_color(img, spill, (236, 206, 166), 0.45)
# art frame
d = ImageDraw.Draw(img)
d.rectangle([1010, 250, 1390, 520], fill=(36, 34, 32))
d.rectangle([1024, 264, 1376, 506], fill=(240, 236, 228))
art = soft(img.size, lambda g: g.ellipse([1080, 300, 1260, 470], fill=255), 2)
paste_color(img, art, (196, 150, 118), 0.9)
art2 = soft(img.size, lambda g: g.rectangle([1200, 330, 1330, 480], fill=255), 1)
paste_color(img, art2, (122, 132, 120), 0.8)
# sofa shadow + sofa
sh = soft(img.size, lambda g: g.ellipse([860, 860, 1580, 940], fill=255), 22)
paste_color(img, sh, (70, 56, 44), 0.55)
d = ImageDraw.Draw(img)
d.rounded_rectangle([900, 560, 1540, 720], 38, fill=(214, 204, 190))
d.rounded_rectangle([870, 660, 1570, 870], 34, fill=(226, 217, 204))
d.rounded_rectangle([860, 640, 960, 880], 30, fill=(208, 197, 182))
d.rounded_rectangle([1480, 640, 1580, 880], 30, fill=(208, 197, 182))
d.rounded_rectangle([1000, 600, 1150, 700], 24, fill=(190, 170, 146))
# side table + lamp
d.rectangle([1630, 720, 1720, 900], fill=(92, 70, 52))
d.polygon([(1640, 560), (1710, 560), (1730, 650), (1620, 650)], fill=(246, 238, 222))
d.rectangle([1670, 650, 1680, 720], fill=(60, 50, 40))
# plant
pot = [700 + 80, 760, 860, 900]
d.rounded_rectangle(pot, 16, fill=(232, 226, 216))
lv = soft(img.size, lambda g: [g.ellipse([pot[0] - 70 + (k * 37) % 120, 420 + (k * 53) % 260, pot[0] + 30 + (k * 37) % 120, 520 + (k * 53) % 260], fill=255) for k in range(14)], 6)
paste_color(img, lv, (64, 92, 62), 0.92)
finish(img).save(os.path.join(OUT, 'photo-interior.jpg'), quality=84)

# 2 · Spa still life (portrait 4:5) — med spa / esthetician
W, H = 1200, 1500
a = vgrad(W, H, (232, 216, 204), (218, 198, 184))
img = Image.fromarray(a.astype(np.uint8))
leaf = soft(img.size, lambda g: [g.ellipse([60 + k * 140, 80 + (k % 2) * 120, 260 + k * 140, 200 + (k % 2) * 120], fill=255) for k in range(8)], 34)
paste_color(img, leaf, (170, 140, 124), 0.42)
table_top = 1010
t = vgrad(W, H - table_top, (240, 233, 222), (226, 216, 202))
img.paste(Image.fromarray(t.astype(np.uint8)), (0, table_top))
d = ImageDraw.Draw(img)
d.line([(0, table_top), (W, table_top)], fill=(214, 202, 188), width=3)
# shadows
sh = soft(img.size, lambda g: [g.ellipse([300, 1150, 560, 1215], fill=255), g.ellipse([640, 1140, 1060, 1225], fill=255)], 16)
paste_color(img, sh, (120, 96, 80), 0.5)
d = ImageDraw.Draw(img)
# amber bottle
d.rounded_rectangle([330, 720, 530, 1185], 46, fill=(126, 66, 28))
hl = soft(img.size, lambda g: g.rounded_rectangle([360, 760, 392, 1150], 14, fill=255), 6)
paste_color(img, hl, (214, 150, 96), 0.7)
d = ImageDraw.Draw(img)
d.rectangle([395, 640, 465, 722], fill=(40, 34, 30))
d.rounded_rectangle([408, 520, 452, 650], 20, fill=(246, 244, 240))
d.rounded_rectangle([360, 900, 500, 1040], 6, fill=(236, 226, 210))
# towels
for i, (y, c) in enumerate([(1050, (248, 245, 240)), (960, (241, 236, 229)), (870, (250, 247, 243))]):
    d.rounded_rectangle([660, y, 1060, y + 120], 48, fill=c)
    d.line([(700, y + 60), (1020, y + 60)], fill=(226, 218, 208), width=3)
# eucalyptus sprig
for k in range(9):
    x = 700 + k * 34
    y = 840 - int(70 * np.sin(k / 8 * np.pi)) - k * 18
    d.ellipse([x - 26, y - 18, x + 26, y + 18], fill=(150, 170, 158))
d.line([(690, 850), (1000, 640)], fill=(120, 132, 118), width=4)
finish(img, blur=1.4, grain=3.5, vignette=0.12).save(os.path.join(OUT, 'photo-spa.jpg'), quality=84)

# 3 · Dusk exterior (landscape) — darker photo for contrast checks
W, H = 1800, 1200
a = vgrad(W, H, (28, 38, 66), (186, 140, 112))
img = Image.fromarray(a.astype(np.uint8))
d = ImageDraw.Draw(img)
d.rectangle([0, 860, W, H], fill=(34, 40, 34))
d.polygon([(700, 860), (1100, 860), (1400, H), (400, H)], fill=(70, 66, 62))
d.rectangle([380, 420, 1420, 870], fill=(40, 36, 34))
d.rectangle([340, 390, 1460, 430], fill=(26, 24, 22))
d.rectangle([900, 250, 1500, 640], fill=(46, 42, 40))
d.rectangle([870, 225, 1530, 262], fill=(26, 24, 22))
glow = soft(img.size, lambda g: [g.rectangle(b, fill=255) for b in ([460, 520, 760, 800], [960, 300, 1440, 600], [1040, 680, 1340, 860])], 26)
paste_color(img, glow, (255, 190, 110), 0.55)
d = ImageDraw.Draw(img)
for b in ([470, 530, 750, 790], [970, 310, 1430, 590], [1050, 690, 1330, 850]):
    d.rectangle(b, fill=(248, 206, 140))
tr = soft(img.size, lambda g: [g.ellipse([1500 + k * 60, 520 - k * 30, 1700 + k * 60, 900], fill=255) for k in range(3)], 8)
paste_color(img, tr, (20, 28, 22), 0.95)
finish(img, blur=1.0, grain=5, vignette=0.25).save(os.path.join(OUT, 'photo-dusk.jpg'), quality=84)

# Logos
def load_font(family, weight, size):
    return ImageFont.truetype(embedded_font(family, weight), size)

# transparent PNG mark + wordmark (typical exported logo)
lg = Image.new('RGBA', (900, 900), (0, 0, 0, 0))
d = ImageDraw.Draw(lg)
d.ellipse([200, 90, 700, 590], outline=(44, 40, 36, 255), width=10)
f = load_font('Cormorant Garamond', 500, 300)
d.text((450, 340), 'Aa', font=f, fill=(44, 40, 36, 255), anchor='mm')
f2 = load_font('Cormorant Garamond', 500, 92)
d.text((450, 720), 'AURA', font=f2, fill=(44, 40, 36, 255), anchor='mm')
lg.save(os.path.join(OUT, 'logo-alpha.png'))

# JPEG logo on solid white (common phone case)
lj = Image.new('RGB', (1000, 1000), (255, 255, 255))
d = ImageDraw.Draw(lj)
d.rectangle([330, 230, 670, 570], fill=(30, 52, 74))
f3 = load_font('Lora', 600, 230)
d.text((500, 395), 'H', font=f3, fill=(255, 255, 255), anchor='mm')
f4 = load_font('Lora', 600, 84)
d.text((500, 720), 'HAVEN', font=f4, fill=(30, 52, 74), anchor='mm')
lj.save(os.path.join(OUT, 'logo-white.jpg'), quality=92)
print('ok')
