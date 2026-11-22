# Whistler conditions

A small phone-first page for parents: which runs are open (green runs first), which lifts are
running, snow numbers and the 7-day forecast for Whistler Blackcomb. Unofficial.

- `scrape.py` (Python 3.11, stdlib only) reads the public terrain/lift and snow report pages and
  writes `data.json` with diagnostics printed to the log.
- `index.html` is a single static file that loads `data.json` and fetches the forecast from
  Open-Meteo in the browser.
- `.github/workflows/whistler.yml` scrapes every 20 minutes (about 6am-11pm Pacific) and deploys
  to GitHub Pages from `main` only. `data.json` is never committed by the workflow.

## One-time setup

1. Settings -> Pages -> Source: **GitHub Actions** (done).
2. Scheduled runs only fire from `main`.

No custom domain needed: the account's user site already uses `businessmind.ai`, so this project
site is served at its path, like the other project sites.

Lives at: https://businessmind.ai/anwtest/

Tests: `cd whistler && python -m unittest`
