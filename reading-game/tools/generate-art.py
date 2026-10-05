#!/usr/bin/env python3
"""Generate optional raster art for Treasure Island Readers with the OpenAI Images API.

!! BEFORE RUNNING: check the prices in PRICE_TABLE below (and the model name) against
!! OpenAI's current pricing page. They are estimates that may be out of date. Override them
!! with --price (e.g. --price medium=0.07) or --price-file prices.json. This script was written
!! without network access and has NEVER been run against the real API; try --max-images 2 first.

What it does
  * One shared style prompt + one prompt per art id (ships, islands, buildings, badges, chest, coin, scene),
    mirroring the ids in js/art.js.
  * Asks for a transparent background, converts to small webp with ImageMagick `convert`,
    saves to img/<kind>-<id>.webp and writes img/manifest.js (window.RG_IMAGES = {...}).
    js/art.js then uses the images instead of the built-in SVG art, nothing else changes.
  * Hard budget cap: --budget defaults to 8.00 USD and values above 10.00 are refused.
    The estimated cost is added up BEFORE every call and generation stops before the cap would be exceeded.
  * Re-runs skip images that already exist (use --force to regenerate). Actual spend is logged to img/spend.json.
  * --dry-run prints the plan and the estimate and makes no API call and needs no key.

Usage
  export OPENAI_API_KEY=...            # optional; never printed by this script
  python3 tools/generate-art.py --dry-run
  python3 tools/generate-art.py --only ship:galleon,coin --max-images 2
  python3 tools/generate-art.py --budget 8 --quality medium

The API key is optional: the Authorization header is only sent when OPENAI_API_KEY is set
(a proxy may inject the credential). Output: img/<kind>/<id>.webp, ships padded so the hull bottom is at 92%.

Standard library only (+ ImageMagick `convert` for the webp step).
"""
import argparse
import base64
import json
import os
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, 'img')
API_URL = 'https://api.openai.com/v1/images/generations'
DEFAULT_MODEL = 'gpt-image-1'
MAX_BUDGET = 10.00
DEFAULT_BUDGET = 8.00

# Estimated USD per 1024x1024 image by quality. CHECK AGAINST OPENAI'S CURRENT PRICING PAGE.
PRICE_TABLE = {'low': 0.011, 'medium': 0.043, 'high': 0.167}
# Actual cost is computed from the response `usage` with these per-million-token rates (also check them).
TOKEN_USD_PER_M = {'image_output': 40.0, 'text_input': 5.0}
SIZE = '1024x1024'
WEBP_QUALITY = 82
SHIP_BOTTOM = 0.92    # ships: bottom of the hull sits at 92% of the canvas height (raster waterline 0.88)
SHIP_WATERLINE = 0.88
OUT_PX = {'ship': 384, 'island': 384, 'building': 384, 'badge': 192, 'coin': 192, 'chest': 192, 'scene': 384}

STYLE = (
    "Cute flat vector illustration for a children's reading game app, bold rounded dark navy outlines, "
    "soft cel shading with one highlight, bright cheerful saturated colors, sticker style, centered, "
    "full object visible, transparent background, no text, no letters, no watermark."
)

SHIP_SIDE = "side view facing right, whole ship visible, no water, no waves, nothing below the hull. "
PROMPTS = {
    'ship:little-sailboat': SHIP_SIDE + "A tiny wooden sailboat with one white mast sail, a small jib, and a red pennant flag.",
    'ship:fishing-boat': SHIP_SIDE + "A cheerful red and white fishing boat with a small cabin, an orange roof, a net and a lifebuoy.",
    'ship:sloop': SHIP_SIDE + "A sloop with one tall mast, a big white mainsail and a jib, wooden hull with a gold stripe and portholes.",
    'ship:tugboat': SHIP_SIDE + "A chubby red tugboat with a white cabin, a black funnel puffing smoke, tire fenders and a lifebuoy.",
    'ship:schooner': SHIP_SIDE + "A teal schooner with two masts, gaff sails and a jib, gold stripe, round portholes.",
    'ship:submarine': "side view facing right, no water, no waves, nothing below the hull. A cute round yellow submarine with a periscope, a conning tower, three round portholes and a little propeller.",
    'ship:brigantine': SHIP_SIDE + "A dark wooden brigantine with two masts, square sails on the front mast, a jib, gold trim and portholes.",
    'ship:galleon': SHIP_SIDE + "A grand wooden galleon with three masts, cream square sails, a tall castle stern, cannon portholes, gold trim, flags.",
    'ship:royal-flagship': SHIP_SIDE + "A royal flagship: a white and gold galleon with three masts, white sails with blue star crests, gold crown on the top mast, many flags.",
    'ship:golden-legend': SHIP_SIDE + "A legendary solid golden galleon with glowing golden sails, sparkles, a crown, magical shining aura, the grandest ship of all.",

    'island:letter-pop': "A small sand island with a green grass cap and a palm tree, a cluster of three colorful balloons tied to it.",
    'island:sound-hunt': "A small sand island with grass and a palm tree, a giant magnifying glass standing in the sand with sound waves in the lens.",
    'island:letter-trace': "A small sand island with grass and a palm tree, a giant yellow pencil standing in the sand with a dotted red squiggle trail.",
    'island:rhyme-boat': "A small sand island with grass and a palm tree, a little red sailboat on the sand with a speech bubble holding two stars.",
    'island:word-builder': "A small sand island with grass and a palm tree, a tower made of red toy bricks with a gold flag and loose building blocks.",
    'island:blend-cannon': "A small sand island with grass and a palm tree, a friendly black cannon on wooden wheels with a pile of cannonballs.",
    'island:syllable-saw': "A small sand island with grass and a palm tree, a big log with an orange-handled hand saw cutting into it.",
    'island:sight-fishing': "A small sand island with grass and a palm tree, a fishing rod with a jumping orange fish and a blue bucket.",
    'island:sentence-match': "A small sand island with grass and a palm tree, a golden picture frame on an easel showing a sunny landscape.",
    'island:story-cove': "A small sand island with grass and a palm tree, a giant open storybook with sparkles.",
    'island:reading-quest': "A small sand island with grass and a palm tree, a treasure map scroll with a dotted red path and a red X.",
    'island:captains-quiz': "A grander sand island with a small stone fort with two flag towers and a shining gold trophy on top, a palm tree.",

    'building:dock': "A wooden pier dock with posts, a barrel, a coiled rope and a lantern post.",
    'building:lighthouse': "A red and white striped lighthouse on a rock with a glowing yellow lamp and light beams.",
    'building:fish-market': "A market stall with a red and white striped awning, a counter with fresh fish, a fish-shaped sign.",
    'building:library': "A cozy library house with a purple roof, arched windows full of colorful books, an open book emblem above the door.",
    'building:shipyard': "A shipyard with a half-built wooden ship hull on a slipway, a wooden scaffold and a red crane.",
    'building:treasure-vault': "A stone treasure vault with a big round steel door with a gold wheel, piles of gold coins beside it.",
    'building:map-room': "A little round-roofed map room hut with a teal roof, a star above the door, a big globe beside it.",
    'building:sea-fort': "A stone sea fort with two crenellated towers, a gate, cannons, and a red flag.",
    'building:golden-statue': "A stepped golden pedestal with a shining golden hero statue bust on top, sparkles.",

    'badge:0': "A round medal badge: a coiled rope ring around a light blue center.",
    'badge:1': "A round medal badge: a white anchor on a bright blue disc.",
    'badge:2': "A round medal badge: a golden bosun's whistle on a silver disc.",
    'badge:3': "A round medal badge: a compass rose on a green disc.",
    'badge:4': "A round medal badge: a brass spyglass telescope on a gold disc.",
    'badge:5': "A round medal badge: a white captain's hat with gold star on a navy disc, red ribbons.",
    'badge:6': "A round medal badge: a big commodore star on a gold disc, red ribbons.",
    'badge:7': "A round medal badge: a golden admiral's crown with jewels on a purple disc, ribbons.",
    'badge:8': "A round medal badge: a double stacked golden crown with jewels on a red disc, stars, ribbons.",
    'badge:9': "A round medal badge: a golden crown inside a green laurel wreath on a teal disc, ribbons.",
    'badge:10': "A grand golden sun-burst medal with a crown at the center, rays all around, purple ribbons, sparkles.",

    'chest:closed': "A closed wooden treasure chest with gold bands and a gold lock.",
    'chest:open': "An open wooden treasure chest overflowing with gold coins and sparkles.",
    'coin': "A single shiny gold coin with a star in the middle.",
    'scene': "A decorative sky group: a round yellow sun with rays, two fluffy white clouds and three seagulls. Wide composition.",
}
# manifest keys for which the image should be generated; the same as the PROMPTS keys.


def log(msg):
    print(msg, flush=True)


def load_prices(args):
    prices = dict(PRICE_TABLE)
    if args.price_file:
        with open(args.price_file) as f:
            prices.update({k: float(v) for k, v in json.load(f).items()})
    for item in args.price or []:
        k, _, v = item.partition('=')
        prices[k.strip()] = float(v)
    return prices


def filename(key):
    kind, _, ident = key.partition(':')
    return kind + '/' + ident + '.webp' if ident else kind + '.webp'


def kind_of(key):
    return key.partition(':')[0]


def manifest_entry(key):
    e = {'src': 'img/' + filename(key)}
    if kind_of(key) == 'ship':
        e['waterline'] = SHIP_WATERLINE
    return e


def read_json(path, default):
    try:
        with open(path) as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def write_manifest(manifest):
    # relative paths from index.html
    body = 'window.RG_IMAGES = ' + json.dumps(manifest, indent=2, sort_keys=True) + ';\n'
    with open(os.path.join(IMG_DIR, 'manifest.js'), 'w') as f:
        f.write(body)


def generate_one(key, args, api_key):
    payload = {
        'model': args.model,
        'prompt': STYLE + ' ' + PROMPTS[key],
        'size': SIZE,
        'n': 1,
        'quality': args.quality,
        'background': 'transparent',
        'output_format': 'png',
    }
    headers = {'Content-Type': 'application/json'}
    if api_key:
        headers['Authorization'] = 'Bearer ' + api_key
    req = urllib.request.Request(API_URL, data=json.dumps(payload).encode('utf-8'), headers=headers)
    with urllib.request.urlopen(req, timeout=240) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    return base64.b64decode(data['data'][0]['b64_json']), data.get('usage')


def usage_cost(usage, fallback):
    """USD from the response usage (image output tokens + text input tokens), else the estimate."""
    try:
        out_t = usage['output_tokens']
        in_t = (usage.get('input_tokens_details') or {}).get('text_tokens', usage.get('input_tokens', 0))
        return round(out_t * TOKEN_USD_PER_M['image_output'] / 1e6 + in_t * TOKEN_USD_PER_M['text_input'] / 1e6, 5)
    except Exception:
        return fallback


def to_webp(png_bytes, out_path, kind):
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    tmp = out_path + '.tmp.png'
    with open(tmp, 'wb') as f:
        f.write(png_bytes)
    px = OUT_PX.get(kind, 384)
    try:
        base = ['convert', tmp, '-background', 'none', '-trim', '+repage']
        size = subprocess.run(base + ['-format', '%w %h', 'info:'], check=True, capture_output=True, text=True).stdout.split()
        w, h = int(size[0]), int(size[1])
        if kind == 'ship':
            # square canvas, object bottom at 92% of the height, centered horizontally
            side = max(w, int(round(h / SHIP_BOTTOM)))
            bottom = int(round(side * (1 - SHIP_BOTTOM)))
            cmd = base + ['-gravity', 'south', '-splice', '0x%d' % bottom, '-gravity', 'south', '-extent', '%dx%d' % (side, side)]
        else:
            side = int(round(max(w, h) * 1.04))
            cmd = base + ['-gravity', 'center', '-extent', '%dx%d' % (side, side)]
        cmd += ['-resize', '%dx%d' % (px, px), '-quality', str(WEBP_QUALITY), '-define', 'webp:alpha-quality=90', out_path]
        subprocess.run(cmd, check=True, capture_output=True)
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--budget', type=float, default=DEFAULT_BUDGET,
                    help='hard spending cap in USD (default %.2f, values above %.2f are refused)' % (DEFAULT_BUDGET, MAX_BUDGET))
    ap.add_argument('--model', default=DEFAULT_MODEL, help='image model name (default %s)' % DEFAULT_MODEL)
    ap.add_argument('--quality', default='medium', help='low, medium or high (must be a key of the price table)')
    ap.add_argument('--price', action='append', metavar='QUALITY=USD', help='override the price per image, repeatable')
    ap.add_argument('--price-file', help='JSON file {"low":0.011,...} overriding the price table')
    ap.add_argument('--only', help='comma list of keys (e.g. ship:galleon,coin) or prefixes (ship:, badge:)')
    ap.add_argument('--max-images', type=int, default=0, help='stop after this many new images (0 = no limit)')
    ap.add_argument('--force', action='store_true', help='regenerate images that already exist')
    ap.add_argument('--dry-run', action='store_true', help='print the plan and cost estimate, call nothing')
    args = ap.parse_args()

    if args.budget > MAX_BUDGET:
        sys.exit('Refusing: --budget %.2f is above the hard maximum of %.2f.' % (args.budget, MAX_BUDGET))
    if args.budget <= 0:
        sys.exit('--budget must be positive.')
    prices = load_prices(args)
    if args.quality not in prices:
        sys.exit('No price for quality %r. Known: %s' % (args.quality, ', '.join(sorted(prices))))
    price = prices[args.quality]

    keys = list(PROMPTS)
    if args.only:
        wanted = [w.strip() for w in args.only.split(',') if w.strip()]
        keys = [k for k in keys if any(k == w or (w.endswith(':') and k.startswith(w)) for w in wanted)]
        unknown = [w for w in wanted if not any(k == w or (w.endswith(':') and k.startswith(w)) for k in PROMPTS)]
        if unknown:
            sys.exit('Unknown ids: ' + ', '.join(unknown))

    os.makedirs(IMG_DIR, exist_ok=True)
    spend_path = os.path.join(IMG_DIR, 'spend.json')
    spend = read_json(spend_path, {'total_usd': 0.0, 'calls': []})
    manifest = {}
    todo, have = [], []
    for k in keys:
        path = os.path.join(IMG_DIR, filename(k))
        if os.path.exists(path) and not args.force:
            have.append(k)
            manifest[k] = manifest_entry(k)
        else:
            todo.append(k)
    if args.max_images:
        todo = todo[:args.max_images]

    affordable = min(len(todo), int((args.budget + 1e-9) // price)) if price > 0 else len(todo)
    est = affordable * price
    log('Model: %s   quality: %s   estimated price per image: $%.3f (check OpenAI pricing!)' % (args.model, args.quality, price))
    log('Images in plan: %d   already exist (skipped): %d   to generate: %d' % (len(keys), len(have), len(todo)))
    log('Budget cap: $%.2f   estimated cost of this run: $%.2f   previously logged spend: $%.2f' % (args.budget, est, spend.get('total_usd', 0.0)))
    if affordable < len(todo):
        log('Budget allows only %d of %d images this run.' % (affordable, len(todo)))
    for k in todo:
        log('  %-24s %s' % (k, PROMPTS[k][:70]))

    if args.dry_run:
        log('Dry run: nothing was called.')
        return

    api_key = os.environ.get('OPENAI_API_KEY', '')  # may be empty when a proxy injects the credential
    if not shutil.which('convert'):
        sys.exit('ImageMagick `convert` was not found.')

    run_spent = 0.0
    for k in todo:
        if run_spent + price > args.budget + 1e-9:
            log('Stopping: the next image would exceed the $%.2f budget.' % args.budget)
            break
        try:
            png, usage = generate_one(k, args, api_key)
        except urllib.error.HTTPError as e:
            detail = ''
            try:
                detail = json.loads(e.read().decode('utf-8')).get('error', {}).get('message', '')
            except Exception:
                pass
            log('FAILED %s: HTTP %s %s' % (k, e.code, detail.replace(api_key, '***') if api_key else detail))
            if e.code in (401, 403, 429):
                break
            continue
        except Exception as e:  # network error etc.
            log('FAILED %s: %s' % (k, str(e).replace(api_key, '***') if api_key else str(e)))
            continue
        cost = usage_cost(usage, price)
        run_spent += cost
        spend['total_usd'] = round(spend.get('total_usd', 0.0) + cost, 4)
        spend['calls'].append({'key': k, 'model': args.model, 'quality': args.quality, 'usd': cost, 'usage': usage,
                               'at': datetime.now(timezone.utc).isoformat(timespec='seconds')})
        with open(spend_path, 'w') as f:
            json.dump(spend, f, indent=2)
        try:
            to_webp(png, os.path.join(IMG_DIR, filename(k)), kind_of(k))
        except Exception as e:
            log('FAILED to convert %s: %s' % (k, e))
            continue
        manifest[k] = manifest_entry(k)
        write_manifest(manifest)  # keep the manifest current in case of an interruption
        log('ok  %-24s spent so far this run: $%.2f' % (k, run_spent))

    write_manifest(manifest)
    log('Done. Run spend (estimated): $%.2f. Logged total: $%.2f. Wrote img/manifest.js with %d images.' % (run_spent, spend['total_usd'], len(manifest)))


if __name__ == '__main__':
    main()
