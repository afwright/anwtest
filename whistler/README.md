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

1. Settings -> Pages -> Source: **GitHub Actions**.
2. Merge to `main` so the schedule runs (scheduled workflows only run on the default branch).
3. DNS: add a CNAME record `whistler` -> `afwright.github.io`.
4. Settings -> Pages -> Custom domain = `whistler.businessmind.ai` (the `CNAME` file ships in the Pages artifact).
5. Tick **Enforce HTTPS** once the certificate is issued.

Lives at: https://whistler.businessmind.ai
Fallback: https://afwright.github.io/anwtest/

Tests: `cd whistler && python -m unittest`
