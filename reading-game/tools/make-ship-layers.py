#!/usr/bin/env python3
"""Offline recolor-layer extraction for the raster ships (no network, no image-generation calls).

For every ship in img/ship/<id>.webp this writes
    img/ship/<id>.hull.webp   grayscale shading of the hull region, alpha = region mask
    img/ship/<id>.sail.webp   grayscale shading of the sail region, alpha = region mask
and merges `hull`, `sail`, `sailCenter` [x, y], `sailSize` (fractions of the picture) and, where wanted,
`hullStrength` into the matching 'ship:<id>' entries of img/manifest.js (all other entries and fields, such as
`waterline`, are preserved).

At runtime js/art.js paints `layer-image * colour` (background-blend-mode: multiply) clipped by the same layer as a CSS
mask, on top of the untouched base picture, so the cosmetics keep the painted shading.

Needs Pillow + numpy + scipy (use a scratch venv, never the repo):
    python3 -m venv /tmp/claude-0/shiplayers/venv && /tmp/claude-0/shiplayers/venv/bin/pip install pillow numpy scipy
    /tmp/claude-0/shiplayers/venv/bin/python tools/make-ship-layers.py [--debug DIR] [ship ...]

Segmentation = per-ship rules in RULES below. A rule is a dict of ranges on hue (degrees, may wrap), saturation and
value (0..1), optionally limited to a `box` (x0, y0, x1, y1 as picture fractions). A region is the union of its rules,
minus its `cut` boxes, cleaned up with `open` (removes thin masts/rigging), `min` (smallest component kept, fraction of
the picture), `hole` (holes smaller than this are filled) and `keep` (number of largest components kept).
The white die-cut sticker border around each ship is found by flood fill from the transparent background and is never
part of a region. Dark outlines, portholes, windows, gold trim and flags fall outside the colour rules and stay on the
base picture.
"""
import argparse, json, os, re, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHIPDIR = os.path.join(ROOT, 'img', 'ship')
MANIFEST = os.path.join(ROOT, 'img', 'manifest.js')

ORDER = ['little-sailboat', 'fishing-boat', 'sloop', 'tugboat', 'schooner', 'submarine', 'brigantine', 'galleon',
         'royal-flagship', 'golden-legend']

WOOD = dict(hue=(8, 45), s=(0.35, 1), v=(0.28, 1))
WHITE = dict(s=(0, 0.30), v=(0.80, 1))

# region defaults
D = dict(open=2, min=0.002, hole=60, keep=9, grow=1)

RULES = {}
RULES['little-sailboat'] = dict(
    hull=dict(rules=[dict(WOOD, box=(0, 0.60, 1, 1))], open=3, keep=1),
    sail=dict(rules=[dict(WHITE, box=(0, 0, 1, 0.78))], open=3, keep=3, min=0.01),
)
RULES['sloop'] = dict(
    hull=dict(rules=[dict(WOOD, box=(0, 0.62, 1, 1))], open=3, keep=1),
    sail=dict(rules=[dict(WHITE, box=(0, 0, 1, 0.72))], open=3, keep=3, min=0.01),
)
RULES['fishing-boat'] = dict(
    # red hull + roof + chimney; the white stripe, lifebuoy and net stay as printed
    hull=dict(rules=[dict(hue=(340, 20), s=(0.5, 1), v=(0.4, 1))], open=2, keep=3, min=0.004,
              cut=[(0.19, 0.30, 0.66, 0.40)]),
    # the "sail" of a boat with no sail: the white cabin wall
    sail=dict(rules=[dict(s=(0, 0.45), v=(0.7, 1), box=(0.2, 0.28, 0.60, 0.62))], open=2, keep=2, min=0.004),
)
RULES['tugboat'] = dict(
    hull=dict(rules=[dict(hue=(340, 20), s=(0.5, 1), v=(0.4, 1))], open=2, keep=3, min=0.004),
    sail=dict(rules=[dict(WHITE, box=(0.38, 0.3, 0.9, 0.6))], open=2, keep=2, min=0.004),
)
RULES['schooner'] = dict(
    hull=dict(rules=[dict(hue=(150, 200), s=(0.35, 1), v=(0.25, 1), box=(0, 0.55, 1, 1))], open=2, keep=1),
    sail=dict(rules=[dict(hue=(8, 48), s=(0.2, 1), v=(0.4, 1), box=(0, 0, 1, 0.7))], open=2, keep=4, min=0.005),
)
RULES['submarine'] = dict(
    # the yellow body is the hull; the conning tower + periscope (a submarine's "sail") is the sail region
    hull=dict(rules=[dict(hue=(30, 60), s=(0.3, 1), v=(0.5, 1))], open=2, keep=3, min=0.004,
              cut=[(0.36, 0.0, 0.72, 0.355), (0, 0, 0.255, 1), (0.3, 0.66, 0.42, 1)]),
    sail=dict(rules=[dict(hue=(25, 60), s=(0.3, 1), v=(0.4, 1), box=(0.36, 0.0, 0.72, 0.355))], open=2, keep=2, min=0.002),
)
RULES['brigantine'] = dict(
    hull=dict(rules=[dict(hue=(325, 45), s=(0.25, 1), v=(0.3, 0.72), box=(0, 0.6, 1, 1))], open=3, keep=1),
    sail=dict(rules=[dict(WHITE, box=(0, 0, 1, 0.75))], open=3, keep=6, min=0.004),
)
RULES['galleon'] = dict(
    hull=dict(rules=[dict(WOOD, box=(0, 0.6, 1, 1))], open=3, keep=1),
    sail=dict(rules=[dict(WHITE, box=(0, 0, 1, 0.75))], open=3, keep=6, min=0.004),
)
RULES['royal-flagship'] = dict(
    hull=dict(rules=[dict(hue=(15, 40), s=(0.6, 1), v=(0.5, 1), box=(0, 0.6, 1, 1))], open=3, keep=3, min=0.004),
    sail=dict(rules=[dict(WHITE, box=(0, 0, 1, 0.72))], open=3, keep=6, min=0.004),
)
RULES['golden-legend'] = dict(
    hull=dict(rules=[dict(hue=(25, 50), s=(0.4, 1), v=(0.4, 1), box=(0, 0.6, 1, 1))], open=3, keep=1, strength=0.45),
    sail=dict(rules=[dict(hue=(25, 55), s=(0.3, 1), v=(0.6, 1), box=(0, 0.2, 1, 0.75))], open=3, keep=4, min=0.01),
)


# ------------------------------------------------------------------ helpers
def hsv(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = rgb.max(-1); mn = rgb.min(-1); d = mx - mn
    s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    h = np.zeros_like(mx)
    dd = np.maximum(d, 1e-6)
    h = np.where(mx == r, ((g - b) / dd) % 6, h)
    h = np.where(mx == g, (b - r) / dd + 2, h)
    h = np.where(mx == b, (r - g) / dd + 4, h)
    h = np.where(d == 0, 0, h) * 60
    return h % 360, s, mx


def rng(a, lo, hi):
    return (a >= lo) & (a <= hi) if lo <= hi else (a >= lo) | (a <= hi)


def boxmask(shape, box):
    H, W = shape
    m = np.zeros(shape, bool)
    m[int(box[1] * H):int(box[3] * H), int(box[0] * W):int(box[2] * W)] = True
    return m


def disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r


def sticker_border(rgb, alpha, h, s, v):
    """Light pixels connected to the transparent background = the white die-cut sticker rim."""
    light = (alpha < 0.5) | ((s < 0.2) & (v > 0.85))
    lab, n = ndi.label(light)
    outside = np.unique(lab[alpha < 0.5])
    outside = outside[outside > 0]
    return np.isin(lab, outside) & (alpha >= 0.5)


def build_region(spec, rgb, alpha, h, s, v, border):
    H, W = alpha.shape
    spec = dict(D, **spec)
    m = np.zeros((H, W), bool)
    for r in spec['rules']:
        q = (alpha > 0.9) & ~border
        if 'hue' in r: q &= rng(h, *r['hue'])
        if 's' in r: q &= (s >= r['s'][0]) & (s <= r['s'][1])
        if 'v' in r: q &= (v >= r['v'][0]) & (v <= r['v'][1])
        if 'box' in r: q &= boxmask((H, W), r['box'])
        m |= q
    for c in spec.get('cut', []):
        m &= ~boxmask((H, W), c)
    if spec['open']:
        m = ndi.binary_opening(m, disk(spec['open']))
    m = ndi.binary_closing(m, disk(1))
    # fill small holes (specular spots etc.), keep big ones (windows, portholes)
    holes, n = ndi.label(~m)
    sizes = ndi.sum(~m, holes, range(1, n + 1))
    for i, sz in enumerate(sizes, 1):
        if sz < spec['hole'] and not (holes[0, :] == i).any() and not (holes[-1, :] == i).any():
            m[holes == i] = True
    lab, n = ndi.label(m)
    if n:
        sizes = ndi.sum(m, lab, range(1, n + 1))
        order = np.argsort(sizes)[::-1]
        keep = [i + 1 for i in order[:spec['keep']] if sizes[i] >= spec['min'] * H * W]
        m = np.isin(lab, keep)
    return m, spec


def make_layer(rgb, alpha, v, m, spec):
    """Grayscale shading (V channel, midtones -> ~0.9) with soft alpha = grown mask."""
    if not m.any():
        return None, None
    grown = ndi.binary_dilation(m, disk(spec['grow'])) if spec['grow'] else m
    grown &= alpha > 0.5
    med = np.median(v[m])
    g = np.clip(0.9 + (v - med) * 1.25, 0.0, 1.0)
    # brightest sails/hulls: keep a little headroom so highlights survive multiply
    a = ndi.gaussian_filter(grown.astype(np.float32), 0.6)
    a = np.where(grown, np.maximum(a, 0.0), a * 0.0)
    a = np.clip(a * 1.0, 0, 1)
    a = np.maximum(a, ndi.gaussian_filter(grown.astype(np.float32), 0.6) * grown)
    out = np.zeros(g.shape + (4,), np.uint8)
    gv = (g * 255 + 0.5).astype(np.uint8)
    out[..., 0] = out[..., 1] = out[..., 2] = gv
    out[..., 3] = (a * 255 + 0.5).astype(np.uint8)
    return Image.fromarray(out, 'RGBA'), grown


def sail_center(m):
    """Deepest point of the largest sail component and its inscribed diameter (picture fractions)."""
    H, W = m.shape
    lab, n = ndi.label(m)
    if not n:
        return None
    sizes = ndi.sum(m, lab, range(1, n + 1))
    big = lab == (int(np.argmax(sizes)) + 1)
    dt = ndi.distance_transform_edt(big)
    y, x = np.unravel_index(np.argmax(dt), dt.shape)
    return [round((x + 0.5) / W, 3), round((y + 0.5) / H, 3)], round(2 * float(dt.max()) / W, 3)


def save(im, path, q=72):
    im.save(path, 'WEBP', quality=q, alpha_quality=80, method=6)
    return os.path.getsize(path)


def update_manifest(info):
    txt = open(MANIFEST, encoding='utf8').read()
    mm = re.match(r'^(\s*window\.RG_IMAGES\s*=\s*)(\{.*\})(\s*;?\s*)$', txt, re.S)
    if not mm:
        sys.exit('cannot parse manifest.js')
    data = json.loads(mm.group(2))
    for sid, f in info.items():
        e = data['ship:' + sid]
        for k in ('hull', 'sail', 'sailCenter', 'sailSize', 'hullStrength'):
            e.pop(k, None)
        e.update(f)
    open(MANIFEST, 'w', encoding='utf8').write(mm.group(1) + json.dumps(data, indent=2, ensure_ascii=False) + mm.group(3))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--debug', help='write mask overlay previews into this dir')
    ap.add_argument('ships', nargs='*')
    a = ap.parse_args()
    ships = a.ships or ORDER
    info = {}
    for sid in ships:
        im = Image.open(os.path.join(SHIPDIR, sid + '.webp')).convert('RGBA')
        arr = np.asarray(im).astype(np.float32) / 255
        rgb, alpha = arr[..., :3], arr[..., 3]
        h, s, v = hsv(rgb)
        border = sticker_border(rgb, alpha, h, s, v)
        entry = {}
        dbg = rgb.copy()
        for name, tint in (('hull', (1, 0, 1)), ('sail', (0, 1, 1))):
            spec = RULES[sid].get(name)
            if not spec:
                continue
            m, spec = build_region(spec, rgb, alpha, h, s, v, border)
            layer, grown = make_layer(rgb, alpha, v, m, spec)
            if layer is None:
                print(sid, name, 'EMPTY'); continue
            path = os.path.join(SHIPDIR, '%s.%s.webp' % (sid, name))
            size = save(layer, path)
            entry[name] = 'img/ship/%s.%s.webp' % (sid, name)
            if name == 'hull' and spec.get('strength'):
                entry['hullStrength'] = spec['strength']
            if name == 'sail':
                sc = sail_center(m)
                entry['sailCenter'], entry['sailSize'] = sc
            print('%-16s %s %5.1f KB  area %.1f%%' % (sid, name, size / 1024, 100 * m.mean()))
            dbg[grown] = dbg[grown] * 0.4 + np.array(tint) * 0.6
        info[sid] = entry
        if a.debug:
            os.makedirs(a.debug, exist_ok=True)
            bg = np.ones_like(rgb) * np.array([0.5, 0.8, 1.0])
            out = bg * (1 - alpha[..., None]) + dbg * alpha[..., None]
            Image.fromarray((out * 255).astype(np.uint8)).save(os.path.join(a.debug, sid + '.png'))
    update_manifest(info)


if __name__ == '__main__':
    main()
