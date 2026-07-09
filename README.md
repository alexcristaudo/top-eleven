# TE Manager — Top Eleven Strategy Assistant

An unofficial, extensive strategic companion for [Top Eleven](https://www.topeleven.com/): training-drill planning, player development, weakness analysis, counter-formations with full orientation settings, and long-game strategy guides — all in a fast, offline-capable web app that installs on your iPhone.

**Live app:** https://alexcristaudo.github.io/top-eleven/

## Features

- **Squad tracker** — save your players (position, age, quality, all 15 attributes). Everything below personalizes around them. Data stays on your device; JSON export/import moves it between phone and computer.
- **Player development** — fast-trainer rating, development verdict (crown jewel / project / peak performer / sell now), per-player training plan with intensity and green-pack advice.
- **Areas of improvement** — role-weighted analysis ranks each player's weakest skills for their position and names the exact drills that fix them.
- **Training centre** — 26-drill catalogue with condition costs, a session builder that packs the best drills into any condition budget, and an intensity guide.
- **Tactics centre** — 13-formation encyclopedia with strengths/weaknesses, a counter-formation tool (pick the opponent's shape → best counters, full orientation settings, and which of *your* players fit), and a reference for every match-prep setting.
- **Strategy guides** — token economy, auction craft, condition/pack management, squad building & fast-trainer pipelines, competition strategy, associations, match-day craft, facility build order, and a season-cycle checklist.

## Use it on iPhone

1. Open the live URL in **Safari**.
2. Tap the **Share** button → **Add to Home Screen**.
3. Launch it from the icon — it runs full-screen like a native app and works offline.

## Development

No build step, no dependencies — plain HTML/CSS/ES modules.

```bash
python3 -m http.server 8000   # serve locally
npm test                      # data-integrity + logic tests (node --test)
```

Deploys automatically to GitHub Pages on every push to `main` (`.github/workflows/deploy.yml`); requires the repository to be public (or GitHub Pro). Pages is enabled automatically on the first deploy — if that step ever fails, flip **Settings → Pages → Source: GitHub Actions** manually and re-run the workflow.

## Disclaimer

Fan-made tool, not affiliated with Nordeus. Drill condition costs and training mechanics are community-observed approximations; exact in-game numbers vary by training level and game version.
