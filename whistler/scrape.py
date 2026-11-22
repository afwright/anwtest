#!/usr/bin/env python3
"""Scrape Whistler Blackcomb terrain/lift status and snow report into data.json.

Stdlib only. Prints heavy diagnostics on every run so the parser can be tuned
from CI logs. Unofficial: data comes from the public resort web pages.
"""
import gzip
import json
import os
import re
import sys
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from datetime import datetime, timezone

BASE = "https://www.whistlerblackcomb.com/the-mountain/mountain-conditions/"
TERRAIN_URL = BASE + "terrain-and-lift-status.aspx"
SNOW_URL = BASE + "snow-and-weather-report.aspx"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data.json")

HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-CA,en;q=0.9",
    "Accept-Encoding": "gzip",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "no-cache",
}

# ---------------------------------------------------------------------------
# DIFFICULTY MAPPING (tune from CI logs). Keys are lowercased strings or ints.
# ---------------------------------------------------------------------------
DIFFICULTY_MAP = {
    # strings
    "green": "green", "beginner": "green", "easiest": "green", "easy": "green",
    "novice": "green", "learner": "green", "green circle": "green",
    "blue": "blue", "intermediate": "blue", "more difficult": "blue",
    "blue square": "blue",
    "black": "black", "advanced": "black", "difficult": "black",
    "most difficult": "black", "black diamond": "black",
    "doubleblack": "double", "double black": "double", "double black diamond": "double", "expert": "double",
    "extreme": "double", "experts only": "double", "double": "double",
    "park": "park", "terrain park": "park", "terrain_park": "park",
    "freestyle": "park", "terrainpark": "park",
    # numeric codes (GUESS: 1 green, 2 blue, 3 black, 4 double black, 5 park)
    1: "green", 2: "blue", 3: "black", 4: "double", 5: "park",
}

# Numeric / string mountain codes, if the feed uses ids. Fill from logs.
MOUNTAIN_CODES = {}


# ---------------------------------------------------------------------------
# Fetching
# ---------------------------------------------------------------------------
def fetch(url):
    req = urllib.request.Request(url, headers=HEADERS)
    status, body, err = None, b"", None
    try:
        with urllib.request.urlopen(req, timeout=45) as r:
            status = r.status
            body = r.read()
            if r.headers.get("Content-Encoding") == "gzip":
                body = gzip.decompress(body)
    except urllib.error.HTTPError as e:
        status = e.code
        try:
            body = e.read()
            if e.headers.get("Content-Encoding") == "gzip":
                body = gzip.decompress(body)
        except Exception:
            pass
        err = "HTTP %s" % e.code
    except Exception as e:  # network, timeout, ...
        err = "%s: %s" % (type(e).__name__, e)
    text = body.decode("utf-8", errors="replace")
    return status, len(body), text, err


def looks_blocked(status, size, text):
    low = text[:4000].lower()
    reasons = []
    if status in (401, 403, 429):
        reasons.append("HTTP %s" % status)
    if "access denied" in low or "akamai" in low or "reference #" in low and "errors.edgesuite" in low:
        reasons.append("Akamai-style 'Access Denied' text")
    if "captcha" in low or "px-captcha" in low or "cf-chl" in low or "just a moment" in low:
        reasons.append("captcha/challenge text")
    if size < 3000:
        reasons.append("tiny body (%d bytes)" % size)
    return reasons


# ---------------------------------------------------------------------------
# FR.<Name> = {...} / [...] extraction (balanced scan, string/escape aware)
# ---------------------------------------------------------------------------
FR_RE = re.compile(r"\bFR\.([A-Za-z_]\w*)\s*=\s*(?=[\{\[])")


def scan_balanced(text, start):
    """Return index just past the balanced {..}/[..] starting at text[start], or None."""
    depth = 0
    in_str = None
    esc = False
    i, n = start, len(text)
    while i < n:
        c = text[i]
        if in_str:
            if esc:
                esc = False
            elif c == "\\":
                esc = True
            elif c == in_str:
                in_str = None
        else:
            if c == '"' or c == "'":
                in_str = c
            elif c in "{[":
                depth += 1
            elif c in "}]":
                depth -= 1
                if depth == 0:
                    return i + 1
        i += 1
    return None


def extract_fr_blobs(html):
    """Return (blobs: {name: parsed}, problems: [str])."""
    blobs, problems = {}, []
    for m in FR_RE.finditer(html):
        name = m.group(1)
        end = scan_balanced(html, m.end())
        if end is None:
            problems.append("FR.%s: unbalanced, no end found" % name)
            continue
        raw = html[m.end():end]
        try:
            obj = json.loads(raw)
        except Exception as e:
            problems.append("FR.%s: json.loads failed (%s); head=%r" % (name, e, raw[:120]))
            continue
        key = name
        k = 2
        while key in blobs:
            key = "%s#%d" % (name, k)
            k += 1
        blobs[key] = obj
    return blobs, problems


# ---------------------------------------------------------------------------
# Generic helpers
# ---------------------------------------------------------------------------
def nk(k):
    return re.sub(r"[^a-z0-9]", "", str(k).lower())


def pick(d, *names):
    """Case/punctuation-insensitive lookup; returns (key, value) or (None, None)."""
    want = [nk(x) for x in names]
    idx = {nk(k): k for k in d}
    for w in want:
        if w in idx:
            return idx[w], d[idx[w]]
    return None, None


def short(o, n=700):
    s = json.dumps(o, ensure_ascii=False)
    return s if len(s) <= n else s[:n] + "...(+%d chars)" % (len(s) - n)


def mountain_from(v):
    if v is None:
        return None
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return MOUNTAIN_CODES.get(v)
    s = str(v).lower()
    if s in MOUNTAIN_CODES:
        return MOUNTAIN_CODES[s]
    if "blackcomb" in s:
        return "Blackcomb"
    if "whistler" in s:
        return "Whistler"
    return None


def truthy(v):
    if isinstance(v, bool):
        return v
    if isinstance(v, (int, float)):
        return v == 1
    if isinstance(v, str):
        s = v.strip().lower()
        return s in ("true", "yes", "y", "1", "open", "opened", "groomed")
    return False


def is_open_value(v):
    if isinstance(v, bool):
        return v
    if isinstance(v, (int, float)):
        return v == 1  # GUESS: 1 = open, 0 = closed, 2 = hold, 3 = scheduled
    if isinstance(v, str):
        s = v.strip().lower()
        if s in ("open", "opened", "true", "yes", "1"):
            return True
        return s.startswith("open") and "not" not in s
    return False


def map_difficulty(v):
    if v is None:
        return "unknown"
    if isinstance(v, bool):
        return "unknown"
    if isinstance(v, str):
        s = v.strip().lower()
        if s in DIFFICULTY_MAP:
            return DIFFICULTY_MAP[s]
        if s.lstrip("-").isdigit() and int(s) in DIFFICULTY_MAP:
            return DIFFICULTY_MAP[int(s)]
        for key, val in (("double", "double"), ("park", "park"), ("black", "black"),
                         ("blue", "blue"), ("green", "green")):
            if key in s:
                return val
        return "unknown"
    if isinstance(v, (int, float)) and int(v) in DIFFICULTY_MAP:
        return DIFFICULTY_MAP[int(v)]
    return "unknown"


DIFF_KEY_RE = re.compile(r"diffic|level|rating|grade|class|trailtype|runtype|category|type$")
NAME_KEYS = ("name", "title", "displayname", "runname", "liftname", "trailname")
STATUS_KEYS = ("status", "isopen", "open", "openstatus", "state", "liftstatus", "runstatus", "statusname")
DIFF_KEYS = ("difficulty", "trailDifficulty", "runDifficulty", "level", "rating", "grade",
             "difficultyLevel", "trailLevel", "trailRating", "class", "category", "runType", "trailType")
GROOM_KEYS = ("groomed", "isgroomed", "grooming", "groomingstatus", "groomedstatus")
MOUNT_KEYS = ("mountain", "mountainName", "mountainArea", "mountainId", "resort", "mountain_name", "peak")


class Collector:
    def __init__(self):
        self.lifts, self.runs = [], []
        self.status_seen = defaultdict(Counter)   # kind -> Counter((field, repr))
        self.diff_seen = defaultdict(lambda: defaultdict(list))  # field -> raw -> [names]
        self.mount_seen = defaultdict(Counter)    # field -> Counter(value)
        self.example_lifts, self.example_runs = [], []
        self.unknown_mountain = 0
        self.areas = []
        self.seen_ids = {"lift": set(), "run": set()}

    def area_mountain(self, area):
        """Infer an area's mountain from the Mountain field of the lifts inside it."""
        votes = Counter()
        for k, v in area.items():
            if nk(k) == "lifts" and isinstance(v, list):
                for l in v:
                    if isinstance(l, dict):
                        _, mv = pick(l, *MOUNT_KEYS)
                        m = mountain_from(mv)
                        if m:
                            votes[m] += 1
        return votes.most_common(1)[0][0] if votes else None

    def mountain_of(self, item, ctx):
        for k in item:
            if nk(k) in [nk(x) for x in MOUNT_KEYS]:
                v = item[k]
                self.mount_seen[k][repr(v)] += 1
                m = mountain_from(v)
                if m:
                    return m
        return ctx.get("mountain")

    def add(self, kind, item, ctx):
        _, name = pick(item, *NAME_KEYS)
        if not isinstance(name, str):
            return
        _, iid = pick(item, "id")
        if iid is not None:
            if iid in self.seen_ids[kind]:
                return
            self.seen_ids[kind].add(iid)
        skey, sval = pick(item, *STATUS_KEYS)
        self.status_seen[kind][(skey, repr(sval))] += 1
        mount = self.mountain_of(item, ctx)
        if mount is None:
            # last resort: look through all string values of item
            for v in item.values():
                if isinstance(v, str) and mountain_from(v):
                    mount = mountain_from(v)
                    break
        if mount is None:
            self.unknown_mountain += 1
        if kind == "lift":
            rec = {"name": name.strip(), "mountain": mount or "Unknown",
                   "status": str(sval) if sval is not None else "", "open": is_open_value(sval)}
            self.lifts.append(rec)
            if len(self.example_lifts) < 1:
                self.example_lifts.append(item)
        else:
            raw_diff = None
            for k, v in item.items():
                if nk(k) in [nk(x) for x in DIFF_KEYS] and not isinstance(v, (dict, list)):
                    raw_diff = v
                    break
            if raw_diff is None:
                for k, v in item.items():
                    if DIFF_KEY_RE.search(nk(k)) and not isinstance(v, (dict, list)) and nk(k) not in ("status",):
                        raw_diff = v
                        break
            for k, v in item.items():
                if DIFF_KEY_RE.search(nk(k)) and not isinstance(v, (dict, list)):
                    lst = self.diff_seen[k][repr(v)]
                    if len(lst) < 3:
                        lst.append(name)
            _, gv = pick(item, *GROOM_KEYS)
            rec = {"name": name.strip(), "mountain": mount or "Unknown",
                   "area": ctx.get("area") or "",
                   "difficulty": map_difficulty(raw_diff),
                   "open": is_open_value(sval), "groomed": truthy(gv)}
            self.runs.append(rec)
            if len(self.example_runs) < 2:
                self.example_runs.append(item)

    def walk(self, node, ctx, path="$"):
        if isinstance(node, dict):
            mctx = dict(ctx)
            # a dict naming a mountain sets mountain context for its children
            for k, v in node.items():
                if nk(k) in [nk(x) for x in MOUNT_KEYS] and mountain_from(v):
                    mctx["mountain"] = mountain_from(v)
            for k, v in node.items():
                kl = nk(k)
                child_ctx = dict(mctx)
                if mountain_from(k) and isinstance(v, (dict, list)) and len(str(k)) < 30:
                    child_ctx["mountain"] = mountain_from(k)
                if isinstance(v, list) and v and all(isinstance(x, dict) for x in v):
                    if "lift" in kl:
                        for x in v:
                            self.add("lift", x, child_ctx)
                        continue
                    if "run" in kl or "trail" in kl:
                        for x in v:
                            self.add("run", x, child_ctx)
                        continue
                    # container list (areas, mountains, ...)
                    for x in v:
                        cc = dict(child_ctx)
                        _, nm = pick(x, *NAME_KEYS)
                        if isinstance(nm, str):
                            if mountain_from(nm):
                                cc["mountain"] = mountain_from(nm)
                            else:
                                cc["area"] = nm
                                am = self.area_mountain(x)
                                if am:
                                    cc["mountain"] = am
                                self.areas.append((nm, am, x))
                        self.walk(x, cc, "%s.%s[]" % (path, k))
                elif isinstance(v, (dict, list)):
                    self.walk(v, child_ctx, "%s.%s" % (path, k))
        elif isinstance(node, list):
            for x in node:
                self.walk(x, ctx, path + "[]")


# ---------------------------------------------------------------------------
# Snow
# ---------------------------------------------------------------------------
SNOW_FIELDS = [
    ("base_cm", re.compile(r"base|depth")),
    ("overnight_cm", re.compile(r"overnight|last12|12h")),
    ("h24_cm", re.compile(r"24|twentyfour")),
    ("h48_cm", re.compile(r"48|fortyeight")),
    ("d7_cm", re.compile(r"7day|last7|sevenday|7d|week")),
    ("season_cm", re.compile(r"season|total|ytd")),
]
TIME_KEYS = ("lastupdatedtext", "lastupdated", "updated", "reporttime", "timestamp", "reportdate", "date", "lastupdate",
             "datetime", "updatedat", "time")


def num(v):
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        m = re.search(r"-?\d+(?:\.\d+)?", v)
        if m:
            return float(m.group(0))
    return None


def to_cm(v, key):
    """Return (cm, note) from scalar or {Inches, Centimeters} dict."""
    if isinstance(v, dict):
        for k, x in v.items():
            kk = nk(k)
            if "centi" in kk or kk in ("cm", "metric"):
                n = num(x)
                if n is not None:
                    return round(n, 1), "cm field %s" % k
        for k, x in v.items():
            kk = nk(k)
            if "inch" in kk or kk in ("in", "imperial"):
                n = num(x)
                if n is not None:
                    return round(n * 2.54, 1), "converted from inches field %s" % k
        return None, None
    n = num(v)
    if n is None:
        return None, None
    ks = nk(key)
    if "inch" in ks or ks.endswith("in"):
        return round(n * 2.54, 1), "converted from inches (key name)"
    return round(n, 1), "assumed cm (scalar, key %s)" % key


def snow_walk(node, path, out):
    if isinstance(node, dict):
        for k, v in node.items():
            p = "%s.%s" % (path, k)
            leaf = not isinstance(v, (dict, list)) or (
                isinstance(v, dict) and any(re.search(r"inch|centi|^cm$", nk(x)) for x in v))
            if leaf:
                out.append((p, k, v))
            else:
                snow_walk(v, p, out)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            snow_walk(v, "%s[%d]" % (path, i), out)


def parse_snow(blobs):
    snow = {k: None for k in ("base_cm", "overnight_cm", "h24_cm", "h48_cm", "d7_cm", "season_cm", "report_time")}
    leaves = []
    for name, obj in blobs.items():
        snow_walk(obj, "FR." + name, leaves)
    print("snow leaves (path = value), first 80:")
    for p, k, v in leaves[:80]:
        print("   ", p, "=", short(v, 160))
    for field, rx in SNOW_FIELDS:
        cands = []
        for p, k, v in leaves:
            if rx.search(nk(k)):
                cm, note = to_cm(v, k)
                if cm is not None:
                    cands.append((p.count("."), p, cm, note))
        cands.sort(key=lambda c: c[0])
        if cands:
            snow[field] = cands[0][2]
            print("snow %s <- %s = %s (%s); %d candidate(s)" % (field, cands[0][1], cands[0][2], cands[0][3], len(cands)))
            for c in cands[1:4]:
                print("      alt:", c[1], c[2])
    for p, k, v in leaves:
        if nk(k) in TIME_KEYS and isinstance(v, str) and v:
            snow["report_time"] = v
            print("snow report_time <-", p, v)
            break
    return snow


# ---------------------------------------------------------------------------
# Diagnostics
# ---------------------------------------------------------------------------
def page_diag(label, url, status, size, text, err, blobs, problems):
    print("=" * 78)
    print("PAGE %s  %s" % (label, url))
    print("  HTTP status: %s  bytes: %d  error: %s" % (status, size, err))
    m = re.search(r"<title[^>]*>(.*?)</title>", text, re.S | re.I)
    print("  <title>:", (m.group(1).strip()[:120] if m else None))
    blocked = looks_blocked(status, size, text)
    if blocked:
        print("  *** LOOKS LIKE A BOT WALL / BLOCK: %s ***" % "; ".join(blocked))
        print("  body head: %r" % text[:600])
    print("  FR.* blobs found (%d): %s" % (len(blobs), list(blobs)))
    for p in problems:
        print("  PROBLEM:", p)
    for name, obj in blobs.items():
        if isinstance(obj, dict):
            print("  FR.%s top-level keys: %s" % (name, list(obj)[:60]))
            for k, v in list(obj.items())[:25]:
                if isinstance(v, list):
                    kk = list(v[0])[:30] if v and isinstance(v[0], dict) else type(v[0]).__name__ if v else None
                    print("      .%s: list[%d] first-item keys: %s" % (k, len(v), kk))
                elif isinstance(v, dict):
                    print("      .%s: dict keys: %s" % (k, list(v)[:30]))
                else:
                    print("      .%s: %s" % (k, short(v, 100)))
        elif isinstance(obj, list):
            print("  FR.%s is a list[%d]; first item: %s" % (name, len(obj), short(obj[0], 400) if obj else None))
    if not blobs:
        print("  No FR.* blobs. Looking for other hints in the page:")
        for rx, lab in ((r"<script[^>]+type=\"application/(?:json|ld\+json)\"[^>]*>", "json script tags"),
                        (r"__NEXT_DATA__|window\.__\w+__\s*=|var\s+\w*[Ff]eed\w*\s*=", "global data assignments")):
            hits = [mm.group(0)[:100] for mm in re.finditer(rx, text)][:8]
            print("   %s: %s" % (lab, hits))
        urls = sorted(set(re.findall(r"[\"'](/[^\"'\s]*(?:api|feed|json|terrain|lift|snow)[^\"'\s]*)[\"']", text, re.I)))[:30]
        print("   candidate endpoints:", urls)
        print("   body text sample:", re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", text))[:400])


def terrain_diag(col):
    print("-" * 78)
    print("TERRAIN: %d lifts, %d runs; unresolved mountain on %d items" % (len(col.lifts), len(col.runs), col.unknown_mountain))
    print("example lift object:", json.dumps(col.example_lifts[0], ensure_ascii=False) if col.example_lifts else None)
    for r in col.example_runs[:2]:
        print("example run object:", json.dumps(r, ensure_ascii=False))
    print("difficulty-like fields and distinct values (3 example run names each):")
    for field, vals in col.diff_seen.items():
        for raw, names in sorted(vals.items()):
            print("   %s = %s -> %s" % (field, raw, names))
    print("difficulty mapped counts:", dict(Counter(r["difficulty"] for r in col.runs)))
    print("status/open field values seen:")
    for kind, c in col.status_seen.items():
        for (f, v), n in c.most_common(20):
            print("   %s %s=%s x%d" % (kind, f, v, n))
    print("mountain-like field values:")
    for f, c in col.mount_seen.items():
        print("   %s: %s" % (f, c.most_common(10)))
    print("grooming areas (name | mountain inferred | trails | lifts[name:Mountain] | first trails):")
    for nm, am, x in col.areas:
        _, trails = pick(x, "trails", "runs")
        _, lifts = pick(x, "lifts")
        print("   %r | %s | %d | %s | %s" % (
            nm, am, len(trails or []),
            [(l.get("Name"), l.get("Mountain")) for l in (lifts or []) if isinstance(l, dict)][:6],
            [t.get("Name") for t in (trails or [])[:3] if isinstance(t, dict)]))
    print("runs per mountain:", dict(Counter(r["mountain"] for r in col.runs)))
    print("lifts per mountain:", dict(Counter(r["mountain"] for r in col.lifts)))
    for known, mt in (("Pony Trail", "Whistler"), ("Upper Olympic", "Whistler"), ("Green Line", "Blackcomb")):
        hits = [(r["name"], r["mountain"], r["difficulty"], r["open"]) for r in col.runs if known.lower() in r["name"].lower()]
        print("   known green check %s (expect %s green): %s" % (known, mt, hits))


def summarize(lifts, runs):
    out = {}
    for m in sorted({x["mountain"] for x in lifts + runs}):
        L = [x for x in lifts if x["mountain"] == m]
        R = [x for x in runs if x["mountain"] == m]
        G = [x for x in R if x["difficulty"] == "green"]
        out[m] = {"lifts_open": sum(x["open"] for x in L), "lifts_total": len(L),
                  "runs_open": sum(x["open"] for x in R), "runs_total": len(R),
                  "greens_open": sum(x["open"] for x in G), "greens_total": len(G)}
    return out


# ---------------------------------------------------------------------------
def main():
    errors = []
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    print("scrape start", now, "python", sys.version.split()[0])

    t_status, t_size, t_text, t_err = fetch(TERRAIN_URL)
    t_blobs, t_prob = extract_fr_blobs(t_text)
    page_diag("terrain", TERRAIN_URL, t_status, t_size, t_text, t_err, t_blobs, t_prob)

    s_status, s_size, s_text, s_err = fetch(SNOW_URL)
    s_blobs, s_prob = extract_fr_blobs(s_text)
    page_diag("snow", SNOW_URL, s_status, s_size, s_text, s_err, s_blobs, s_prob)

    col = Collector()
    feeds = [(n, o) for n, o in t_blobs.items() if n.split("#")[0] == "TerrainStatusFeed"]
    chosen = None
    for n, o in feeds:
        lifts0 = o.get("Lifts") if isinstance(o, dict) else None
        if lifts0 and isinstance(lifts0[0], dict) and isinstance(lifts0[0].get("Status"), str):
            chosen = (n, o)
            break
    if chosen is None and feeds:
        chosen = feeds[0]
    if chosen:
        print("using terrain blob FR.%s (of %s)" % (chosen[0], [f[0] for f in feeds]))
        col.walk(chosen[1], {}, "FR." + chosen[0])
    else:
        for name, obj in t_blobs.items():
            col.walk(obj, {}, "FR." + name)
    # snow page sometimes also carries lift/run data; ignore unless terrain page empty
    if not col.runs and not col.lifts:
        for name, obj in s_blobs.items():
            col.walk(obj, {}, "FR." + name)
    terrain_diag(col)

    terrain_ok = bool(col.runs or col.lifts)
    if not terrain_ok:
        errors.append("terrain: no lifts/runs parsed (status=%s size=%s err=%s blobs=%s)" % (t_status, t_size, t_err, list(t_blobs)))

    print("-" * 78)
    print("SNOW parse")
    snow_src = {k: v for k, v in s_blobs.items() if k.split("#")[0].lower() == "snowreportdata"}
    if not snow_src:
        snow_src = {k: v for k, v in t_blobs.items() if re.search(r"snow|weather", k, re.I)}
    snow = parse_snow(snow_src) if snow_src else {k: None for k in ("base_cm", "overnight_cm", "h24_cm", "h48_cm", "d7_cm", "season_cm", "report_time")}
    snow_ok = any(snow[k] is not None for k in snow if k != "report_time")
    if not snow_ok:
        errors.append("snow: no values parsed (status=%s size=%s err=%s blobs=%s)" % (s_status, s_size, s_err, list(s_blobs)))

    data = {"updated": now, "terrain_ok": terrain_ok, "snow_ok": snow_ok, "errors": errors,
            "snow": snow, "lifts": col.lifts, "runs": col.runs,
            "summary": summarize(col.lifts, col.runs)}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    print("=" * 78)
    print("WROTE", OUT, "terrain_ok=%s snow_ok=%s lifts=%d runs=%d" % (terrain_ok, snow_ok, len(col.lifts), len(col.runs)))
    print("summary:", json.dumps(data["summary"]))
    print("snow:", json.dumps(snow))
    print("errors:", errors)
    return 0 if (terrain_ok or snow_ok) else 1


if __name__ == "__main__":
    sys.exit(main())
