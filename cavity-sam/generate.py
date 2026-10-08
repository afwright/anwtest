"""Cavity Creep costume parts (tooth / tooth-fairy / dentist / cavity group), sized for
Bambu A1 mini (180 mm cube) + AMS lite.

  python3 generate.py      -> ./stl  (needs: pip install trimesh shapely manifold3d)

Multi-color parts are split into one STL per filament, suffixed _brown/_black/_yellow/
_white/_green. In Bambu Studio, drag all files of one part in together, click "Yes" to
"load as a single object with multiple parts", then assign filaments.
"""
import math, os, random
import numpy as np
import trimesh
from shapely.geometry import Point, Polygon, LineString, box
from shapely.ops import unary_union
from shapely import affinity

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stl")
BED = 180.0

# ---- tunables --------------------------------------------------------------
SPLOTCH_LEN  = 75     # decay "tag" size (mm)
SPLOTCH_N    = 6      # how many tags to print
SPLOTCH_H    = 5.0
INLAY        = 1.0    # face inlay depth (top 5 layers at 0.2 mm)
MAG_D, MAG_H = 10.4, 3.2   # 10x3 mm neodymium disc
PICK_LEN     = 330    # pickaxe head tip-to-tip (split into 2 halves)
PICK_THICK   = 36
DOWEL_D      = 25.4 + 0.5  # 1" hardware-store dowel handle + clearance
PIN_D        = 6.3    # 6 mm wooden/steel alignment pins
HORN_H       = 120

# ---- helpers ---------------------------------------------------------------
def ext(poly, h, z0=0.0):
    polys = poly.geoms if hasattr(poly, "geoms") else [poly]
    m = trimesh.util.concatenate([trimesh.creation.extrude_polygon(p, h) for p in polys if p.area > 0.01])
    m.apply_translation([0, 0, z0])
    return m

def cyl(d, h, x=0, y=0, z0=0, axis="z"):
    """Cylinder of length h. axis z: base at z0. axis x/y: starts at x (or y) and runs +h, centred at z0."""
    c = trimesh.creation.cylinder(radius=d / 2, height=h, sections=64)
    if axis == "z":
        c.apply_translation([x, y, z0 + h / 2]); return c
    if axis == "x":
        c.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [0, 1, 0]))
        c.apply_translation([x + h / 2, y, z0]); return c
    c.apply_transform(trimesh.transformations.rotation_matrix(math.pi / 2, [1, 0, 0]))
    c.apply_translation([x, y + h / 2, z0]); return c

def sphere(r, c, sub=3):
    s = trimesh.creation.icosphere(subdivisions=sub, radius=r); s.apply_translation(c); return s

def cut(a, *bs):   return trimesh.boolean.difference([a, *bs], engine="manifold")
def union(*ms):    return trimesh.boolean.union(list(ms), engine="manifold")
def inter(a, b):   return trimesh.boolean.intersection([a, b], engine="manifold")

def check_fits(name, *meshes):
    lo = np.min([m.bounds[0] for m in meshes], axis=0)
    hi = np.max([m.bounds[1] for m in meshes], axis=0)
    size = hi - lo
    assert max(size[:2]) <= BED - 4 and size[2] <= BED - 4, f"{name} too big: {size}"
    return size

def save(m, name):
    assert m.is_watertight, name
    m.export(os.path.join(OUT, name + ".stl"))

def drop_to_bed(*ms):
    z = min(m.bounds[0][2] for m in ms)
    for m in ms: m.apply_translation([0, 0, -z])

# ---- 1. decay tags: stick them on the Tooth, the Dentist pulls them off -----
def blob(seed, L):
    rnd = random.Random(seed)
    parts = [Point(0, 0).buffer(1.0, 64)]
    for i in range(9):
        a = i / 9 * 2 * math.pi + rnd.uniform(-0.25, 0.25)
        r = rnd.uniform(0.75, 1.05)
        parts.append(Point(r * math.cos(a), r * math.sin(a) * 0.85).buffer(rnd.uniform(0.25, 0.45), 32))
    g = unary_union(parts).buffer(0.12).buffer(-0.12)   # soften necks
    minx, miny, maxx, maxy = g.bounds
    s = L / max(maxx - minx, maxy - miny)
    return affinity.scale(g, s, s, origin=(0, 0)), s

def build_splotch(i):
    rnd = random.Random(100 + i)
    body2d, s = blob(i, SPLOTCH_LEN)
    u = SPLOTCH_LEN / 2.6            # face unit
    ey, ex = 0.30 * u, 0.42 * u
    eyes = unary_union([affinity.rotate(affinity.scale(Point(sx * ex, ey).buffer(1, 48), 0.30 * u, 0.24 * u),
                                        -sx * 20) for sx in (-1, 1)])
    brows = unary_union([Polygon([(sx * 0.05 * u, ey + 0.05 * u), (sx * 0.85 * u, ey + 0.38 * u),
                                  (sx * 0.85 * u, ey + 0.6 * u), (sx * 0.05 * u, ey + 0.6 * u)]) for sx in (-1, 1)])
    eyes = eyes.difference(brows)                                    # angry slant
    look = rnd.uniform(-0.08, 0.08) * u
    pupils = unary_union([Point(sx * ex + look, ey - 0.03 * u).buffer(0.09 * u, 32) for sx in (-1, 1)]).intersection(eyes)
    my, mw = -0.35 * u, 0.75 * u
    mouth = Polygon([(-mw, my + 0.12 * u), (mw, my + 0.12 * u), (mw * 0.75, my - 0.22 * u),
                     (0, my - 0.32 * u), (-mw * 0.75, my - 0.22 * u)])
    n = rnd.choice([3, 4, 5])
    fangs = []
    for k in range(n):
        x = -mw * 0.8 + k * (1.6 * mw / (n - 1))
        L = rnd.uniform(0.14, 0.24) * u
        fangs.append(Polygon([(x - 0.08 * u, my + 0.12 * u), (x + 0.08 * u, my + 0.12 * u), (x, my + 0.12 * u - L)]))
    fangs = unary_union(fangs).intersection(mouth)

    top = SPLOTCH_H - INLAY
    face = unary_union([eyes, mouth])
    body = cut(ext(body2d, SPLOTCH_H), ext(face, INLAY + 0.1, top), cyl(MAG_D, MAG_H, 0, -0.05 * u, -0.01))
    yellow = ext(eyes.difference(pupils), INLAY, top)
    black = ext(unary_union([pupils, mouth.difference(fangs)]), INLAY, top)
    white = ext(fangs, INLAY, top)
    tag = f"tag_{i + 1}"
    for m, c in [(body, "brown"), (yellow, "yellow"), (black, "black"), (white, "white")]:
        save(m, f"{tag}_{c}")
    return check_fits(tag, body)

# ---- 2. pickaxe head: two halves clamp a 1" dowel handle --------------------
def build_pickaxe():
    half = PICK_LEN / 2
    xs = np.linspace(-half, half, 121)
    yc = -0.0011 * xs ** 2                          # droop toward the points
    t = 20 * (1 - (np.abs(xs) / half) ** 1.7) + 3.0   # 6 mm blunt tips: sturdier, party-safe
    prof = Polygon(list(zip(xs, yc + t)) + list(zip(xs[::-1], (yc - t)[::-1])))
    hub = unary_union([Point(0, 0).buffer(30, 64), box(-21, -62, 21, 0)])
    prof = unary_union([prof, hub]).buffer(1.5).buffer(-1.5)
    head = ext(prof, PICK_THICK)
    zc = PICK_THICK / 2
    sock = cyl(DOWEL_D, 75, 0, -63, zc, axis="y")   # blind socket from below, stops at y=+12
    pins = [cyl(PIN_D, 40, -20, 20, z, axis="x") for z in (zc - 9, zc + 9)]
    head = cut(head, sock, *pins)
    tipmask = lambda sgn: ext(box(sgn * (half - 38), -200, sgn * (half + 5), 200) if sgn > 0
                              else box(-(half + 5), -200, -(half - 38), 200), PICK_THICK + 2, -1)
    for sgn, name in [(1, "right"), (-1, "left")]:
        side = ext(box(0, -200, 200, 200) if sgn > 0 else box(-200, -200, 0, 200), PICK_THICK + 2, -1)
        h = inter(head, side)
        tip = inter(h, tipmask(sgn))                 # chipped-enamel white tip
        body = cut(h, tipmask(sgn))
        # print standing on the cut face: rotate so x=0 plane is the bed
        R = trimesh.transformations.rotation_matrix(-sgn * math.pi / 2, [0, 1, 0])
        for m in (body, tip): m.apply_transform(R)
        drop_to_bed(body, tip)
        size = check_fits(f"pick_{name}", body, tip)
        save(body, f"pickaxe_head_{name}_brown"); save(tip, f"pickaxe_head_{name}_white")
    return size

# ---- 3. molar pommel: the trophy tooth on the end of the handle -------------
def build_pommel():
    crown2d = box(-27, -23, 27, 23).buffer(-10).buffer(10)            # rounded molar footprint
    crown = ext(crown2d, 26)
    crown = union(crown, *[sphere(13, (sx * 12, sy * 10, 25), 4) for sx in (-1, 1) for sy in (-1, 1)])
    crown = cut(crown, ext(box(-60, -60, 60, 60), 30, 34))              # flat chewing face = flat bed face
    roots = [trimesh.creation.cone(radius=11, height=34, sections=48) for _ in range(2)]
    for r, sx in zip(roots, (-1, 1)):
        r.apply_transform(trimesh.transformations.rotation_matrix(math.pi, [1, 0, 0]))
        r.apply_translation([sx * 15, 0, 2])
    tooth = union(crown, *roots)
    hole, ring = sphere(8, (11, -6, 34), 4), sphere(11.5, (11, -6, 34), 4)  # the decay, naturally
    stain = cut(inter(ring, tooth), hole)
    tooth = cut(tooth, ring)
    sock = cyl(DOWEL_D, 54, 0, 0, -36)                  # handle enters between the roots
    tooth, stain = cut(tooth, sock), cut(stain, sock)
    # print chewing-face down (flat), roots up: no supports
    for m in (tooth, stain): m.apply_transform(trimesh.transformations.rotation_matrix(math.pi, [1, 0, 0]))
    drop_to_bed(tooth, stain)
    save(tooth, "pommel_molar_white"); save(stain, "pommel_molar_brown")
    return check_fits("pommel", tooth, stain)

# ---- 4. germ antennae: slide onto any plastic headband -----------------------
def build_horn(side):
    pts, n = [], 14
    for k in range(n):
        f = k / (n - 1)
        x = side * (18 * math.sin(f * 2.2) + 6 * f)       # wobbly outward curve
        z = 10 + f * (HORN_H - 30)
        r = 11 - 6.5 * f + 1.4 * math.sin(f * 9)           # lumpy taper
        pts.append((x, 0, z, r))
    stalk = union(*[sphere(r, (x, y, z)) for x, y, z, r in pts])
    base = union(cyl(26, 12, 0, 0, 0))
    stalk = union(stalk, base)
    tx, _, tz, _ = pts[-1]
    bulb = sphere(10, (tx + side * 3, 0, tz + 9), 4)
    stalk = cut(stalk, bulb)
    slot = trimesh.creation.box(extents=[60, 7.5, 3.4]); slot.apply_translation([0, 0, 4])  # fits 5-7 mm bands
    stalk = cut(stalk, slot)
    name = "left" if side < 0 else "right"
    save(stalk, f"antenna_{name}_brown"); save(bulb, f"antenna_{name}_green")
    return check_fits("antenna", stalk, bulb)

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for i in range(SPLOTCH_N):
        sz = build_splotch(i)
    print(f"decay tags x{SPLOTCH_N}  {sz[0]:.0f} x {sz[1]:.0f} x {sz[2]:.0f} mm")
    sz = build_pickaxe();  print(f"pickaxe half     {sz[0]:.0f} x {sz[1]:.0f} x {sz[2]:.0f} mm (standing)")
    sz = build_pommel();   print(f"molar pommel     {sz[0]:.0f} x {sz[1]:.0f} x {sz[2]:.0f} mm")
    for s in (-1, 1): sz = build_horn(s)
    print(f"antenna          {sz[0]:.0f} x {sz[1]:.0f} x {sz[2]:.0f} mm")
    print("done ->", OUT)
