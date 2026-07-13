# TE Manager — Top Eleven Strategy Assistant

An unofficial, extensive strategic companion for [Top Eleven](https://www.topeleven.com/): training-drill planning, player development, weakness analysis, counter-formations with full orientation settings, and long-game strategy guides — all in a fast, offline-capable web app that installs on your iPhone.

**Live app:** https://alexcristaudo.github.io/top-eleven/

## Features

- **Squad tracker** — save your players (position, age, quality, all 15 attributes). Everything below personalizes around them. Data stays on your device; JSON export/import moves it between phone and computer.
- **Screenshot import** — snap the in-game player-profile screen and the app reads name, position, age, quality and all 15 attributes with on-device OCR (bundled Tesseract, ~15 MB lazy-loaded on first use, works offline after; nothing is uploaded). Recognised values prefill the add-player form for review.
- **Screen-recording bulk import** — record your screen while flicking through player profiles (1–2 s per player); the app samples the video, OCRs each frame on-device, groups frames into distinct players, and shows a review list where each is marked **New** or **Update** (with field diffs against your saved squad) before applying — mass add or refresh a whole squad in one go.
- **Player development** — development verdict (crown jewel / project / peak performer / sell now), per-player training plan with intensity and green-pack advice.
- **Best-player analysis** — the match engine only reads a few "key" attributes per position, so each player page shows a **key-stats rating out of 100** (ignoring cosmetic stats), flags genuine **fast attackers** (⚡) since speed is the dominant meta attribute, and lists **power-training targets** with their current values against the maxed benchmark. Training recommendations are biased toward these key stats.
- **Fast-trainer test** — training speed is a hidden per-player multiplier, so the app implements the community test: give the player a new role/special ability, run 6× Sprint sessions, record the skill points earned (0, +1, +2, +3… toward the 50 a new role needs) over 7 tests. Results are corrected for the age slabs (18–21 full speed, 22–25 half, 26–29 quarter, 30+ eighth), and classified from elite to very slow. Measured verdicts override the age estimate everywhere in the app.
- **Areas of improvement** — role-weighted analysis ranks each player's weakest skills for their position and names the exact drills that fix them.
- **Training centre** — 29-drill catalogue (attack/defence/possession/physical) with condition costs, a session builder that packs the best drills into any condition budget, an intensity guide, a **teamplay-bonus planner** (the four 10% match bonuses decay 2%/day — plan the daily maintenance sessions and their player requirements), and a **personal-trainer value calculator**.
- **Playstyles & special abilities** — per-player playstyle tracking with the drills that level each style, recommended playstyles per position, and a squad-wide **special-ability coverage checker** against the community-recommended kit. Players can hold several abilities; the OCR importers read every named ability off a captured **Special Abilities** screen, and the active **playstyle** (plus its level) off the Playstyle screen — all tolerant to OCR misspellings, and careful never to mistake an attribute or header for one (the *Dribbling* attribute isn't the *Dribbler* ability, a keeper's *Aerial reach* isn't *Aerial Defender*, and *Positioning* isn't a playstyle).
- **Tactics centre** — 13-formation encyclopedia with strengths/weaknesses, a **Best XI builder** (pick a shape → your strongest lineup on the pitch, bench, and coverage gaps), a counter-formation tool (pick the opponent's shape → best counters, full orientation settings, and which of *your* players fit), and a reference for every match-prep setting.
- **Match-prep tools** — condition planner (will a player hit 90% by kickoff, and how many green packs if not) and a side-by-side player comparison for transfer decisions.
- **Scouting log** — record each rival's formation, result and notes; their history and the recommended counter are one tap away next meeting.
- **Season planner** — a persistent season checklist (start / mid-season / final week routines), a token budget tracker with net balance and category breakdown, and a **free-to-play auction bid valuator** that prices a target in tokens from age, star level, extras (special ability, playstyle, quality ending in 4/9) and your squad's positional need.
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
