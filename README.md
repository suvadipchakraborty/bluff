# ThagaShield 🛡️

A free, 1-minute diagnostic web app that helps people in India work out whether a call, WhatsApp message, SMS or email is a scam — it names the scam, explains the trick and gives a clear action plan. 100% client-side: nothing the user types ever leaves their phone.

**v2 is data-driven.** All scams and all questions live in two Google Sheets. Researchers edit the sheets; the app updates itself — no code changes, no redeploy.

## How a diagnosis works

1. **Routing** — the app walks the *Decision Tree* sheet from `Q1_START`, one question per node, to any depth, until an answer points at a scam id.
2. **Confirmation** — for that candidate scam the app asks its own red flags (`signs`, Yes / No / Not sure) and trigger words (`keywords`, multi-select). The candidate's name is hidden during this stage so answers aren't biased.
3. **Result** — a confidence % is built from three parts (weights in `js/config.js`):
   - reaching the scam through the tree — 30
   - red flags confirmed (Yes = 1, Not sure = ½, No = −½) — 50
   - trigger words recognised (2 hits = full marks) — 20
   
   A scam can only be a **Strong match** (≥ 75%) with at least 2 confirmed red flags, and can't be a **Possible match** (≥ 50%) with none. Anything lower is a **Weak match**, and the app offers sibling scams from the same question to check instead ("Not quite right?").

Typical path: 2–4 routing questions + 3–5 confirmation questions ≈ 6–9 questions.

## The two sheets

Links are set in `js/config.js` (`LEAF_CSV_URL`, `TREE_CSV_URL`) — both are *File → Share → Publish to web → CSV* links.

| Sheet | One row is… | Key columns |
|---|---|---|
| **Scam Database Leaves** | one scam typology | `id, family, name_en, name_hi, emoji, channels, actions, keywords, story, signs, steps, risk_level` (lists are `pipe\|separated`) |
| **Decision Tree Logic** | one question | `node_id, question_text, opt_1_text, opt_1_next … opt_6_text, opt_6_next` (`opt_N_next` is either another `node_id` or a leaf `id`) |

More than 6 options is fine — add `opt_7_text` / `opt_7_next` columns and the app picks them up.

**Optional Hindi columns** (used automatically if present): `question_text_hi`, `opt_N_text_hi` in the tree sheet; `story_hi`, `signs_hi`, `steps_hi` in the leaf sheet (pipe-separated, same order as the English ones).

**Tips for researchers**
- More `signs` per scam = stronger confirmation. Aim for 3–4 (2 minimum).
- A new scam is only reachable once some question option points at its `id`.
- Each `node_id` should appear on **one row only** — see *Data health* below.
- Published sheets refresh about every 5 minutes.

## Data health (built-in checker)

Open the **Database** tab and expand **Data health** at the bottom. It lists, live from the sheets: duplicate question IDs, answers that point to nothing, questions never reached, scams no path leads to, scams with fewer than 2 signs, and question loops. If duplicate `node_id` rows exist, `DUPLICATE_NODES` in `js/config.js` decides what happens (`"last"` default, `"first"`, or `"merge"`).

## Reliability

Load order: **built-in copy** (`js/snapshot.js`, instant) → **last good live copy** (browser cache) → **live sheets** (fetched in the background on every visit, 8 s timeout). If Google is unreachable the app still works from the newest copy it has. A live update that arrives mid-diagnosis waits until the person starts a new check. Sheet text is always HTML-escaped before display.

To refresh the built-in copy occasionally, replace the two CSV strings in `js/snapshot.js` with the current sheet exports (optional; the live fetch overrides it anyway).

## File structure

```
├── index.html          # app shell
├── manifest.json       # PWA manifest
├── .nojekyll
├── css/style.css
├── js/
│   ├── config.js       # sheet links, scoring weights, options  ← the only file to tweak
│   ├── snapshot.js     # built-in copy of both sheets (offline fallback)
│   ├── data.js         # CSV parser, tree builder, data-health audit, live/cache loading
│   └── app.js          # routing + confirmation engine, results, database tab, English/हिंदी
└── assets/             # favicon.svg, og-image.png
```

## Deploy: GitHub → Cloudflare Pages

1. Drag the **contents** of this folder into your GitHub repo (`index.html`, `css/`, `js/`, `assets/`, `manifest.json`, `.nojekyll` at the repo root) and commit.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**, pick the repo. Framework preset **None**, build command **empty**, output directory **`/`**. Every commit to `main` redeploys automatically.
3. Once you know your live URL, replace `YOUR-DOMAIN` in the `og:image`, `og:url` and `twitter:image` tags in `index.html` (WhatsApp and Twitter need absolute URLs).

## Features carried over from v1

Golden Hour panel (now with a one-tap **Call 1930**), copy-able block-and-report message, Web Share of the diagnosis, on-device "scams dodged" counter, English / हिंदी toggle, installable PWA, searchable scam database (now with type filters and risk badges), social-preview tags.

---

Built by Suva. Feedback and new scam scripts welcome via the in-app "Help us catch more scams" link.
