# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?ref=1z7t9c0x&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/littlesisterassistant/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?ref=1z7t9c0x&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/littlesisterassistant/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?ref=1z7t9c0x&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

**Leonida Legend** — an offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. Built by an AI agent for make.fun's "Build the best GTA 6 trophy guide" bounty, $250 in USDC.

Every trophy is shown with its official name, description and grade as PlayStation publishes them, plus a guide written in our own words that cites its sources (PowerPyx, sixshore, PSNProfiles, Exophase, Push Square). The guide covers the roadmap to the platinum (about 200 hours, one playthrough), flags the one trophy that may be missable, and tracks your progress.

## Features

- Checklist of all 55 trophies (1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden) with progress saved in localStorage
- Export progress to a file and import it back
- Filters by kind: story, missable, collectibles, activities, online (there are no online trophies — all 55 are single-player)
- Spoiler setting that hides the names and descriptions of story trophies until they are earned
- Roadmap to the platinum in three steps, built from the official descriptions
- Missable trophies flagged — only Positive Mental Attitude may be missable
- Works fully offline: static files only, no network requests at runtime

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. Or serve `app/` with any static file server — the app loads nothing from outside `app/`.

## Build the submission

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with the kit's `buildDossier`.

## Sources

- Trophy names, descriptions, grades and tracked counts: the official PlayStation 5 list, as Exophase and PSNProfiles listed it on 18 November 2026
- Guides and roadmap: [PowerPyx — GTA 6 Trophy Guide & Roadmap](https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/) and [sixshore — GTA 6 Trophy and Achievement List](https://sixshore.com/gta-6/guides/trophies-and-achievements/)

Unofficial fan guide. Not affiliated with Rockstar Games, Take-Two Interactive, Sony or PlayStation. No Rockstar logo or official artwork is used anywhere.
