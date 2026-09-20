# ThagaShield 🛡️

A free, 1-minute diagnostic web app that helps people in India figure out if a call, WhatsApp message, SMS or Telegram chat is a scam — names the exact scam pattern, explains how it works, and gives a clear action plan. 100% client-side: no backend, no database, nothing you type ever leaves your phone.

**"Thaga"** is a widely understood word across Indian languages (Hindi/Tamil/Telugu/Kannada) for a con or fraudster — paired with "Shield" for a name that's memorable, local, and self-explanatory.

## What's inside

- **Diagnose** — a 3-step triage (how they contacted you → what they asked you to do → optional keyword tags) feeds a client-side JS rule engine that scores 9 real Indian scam patterns and returns a risk gauge + confidence %, the scam's name, how it works, warning signs, and a numbered action plan.
- **Scam Database** — every scam pattern is browsable and searchable on its own tab, so people can read up even without running the diagnostic.
- **Golden Hour panel** — always-visible reminder to call the National Cybercrime Helpline **1930** and report at **cybercrime.gov.in** immediately if money is already lost.
- **1-tap block-and-report message** — copies a firm pre-written message to paste to the scammer before blocking.
- **Share diagnosis** — uses the Web Share API (falls back to copy) so people can send their result to a worried parent or friend.
- **"Scams dodged" counter** — a small local (on-device only, via localStorage) streak so the tool feels like it's actually protecting you over time.
- **English / हिंदी toggle** — the whole flow, results and action plan switch language instantly.
- **Installable PWA** — has a manifest + icon so it can be "Added to Home Screen" like a native app.
- **Social-preview ready** — Open Graph + Twitter Card tags with a generated preview image, so links shared on WhatsApp/Twitter render as a trustworthy card instead of a bare URL.

## File structure

```
thagabusters/
├── index.html          # the whole app shell
├── manifest.json        # PWA manifest
├── .nojekyll             # tells GitHub Pages not to run Jekyll on this repo
├── css/
│   └── style.css
├── js/
│   ├── data.js          # scam profiles + question options (the "database")
│   └── app.js            # rule engine, navigation, rendering
└── assets/
    ├── favicon.svg
    └── og-image.png      # social share preview image
```

## Deploy to GitHub Pages (free)

1. Create a new **public** repository on GitHub (e.g. `thagashield`).
2. On the repo's main page, click **Add file → Upload files**, then drag the *contents* of this folder in (not the folder itself — `index.html`, `css/`, `js/`, `assets/`, `manifest.json`, `.nojekyll` should sit at the repo root). Commit.
3. Go to **Settings → Pages**. Under "Build and deployment", set **Source** to `Deploy from a branch`, branch `main`, folder `/ (root)`. Save.
4. GitHub gives you a live URL within a minute or two: `https://YOUR-USERNAME.github.io/thagashield/`.

### Before you go live — update two placeholders

Open `index.html` and replace `https://YOUR-USERNAME.github.io/thagashield/` (two `og:image`/`og:url`/`twitter:image` lines near the top) with your actual GitHub Pages URL, or your custom domain once step below is done. WhatsApp and Twitter need a full absolute URL to fetch the preview image — a relative path won't render.

## Connect a custom domain via Cloudflare

1. In your repo, **Settings → Pages → Custom domain**, enter your domain (e.g. `thagashield.in`) and save — GitHub will add a `CNAME` file to the repo automatically.
2. In Cloudflare, add the domain to your account, then in **DNS** add either:
   - A `CNAME` record: `www` → `YOUR-USERNAME.github.io` (proxied), **or**
   - Four `A` records at the apex (`@`) pointing to GitHub Pages' IPs: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
3. In Cloudflare → **SSL/TLS**, set encryption mode to **Full**.
4. Back in GitHub → Pages, tick **Enforce HTTPS** once the certificate is issued (can take up to 24 hrs).
5. Update the `og:url`/`og:image`/`twitter:image` placeholders in `index.html` to your final domain.

## Editing the scam database

All scam content lives in `js/data.js` as a plain array (`SCAMS`) — each entry has an `id`, `name`/`hi` (Hindi name), `emoji`, the `channels`/`actions`/`keywords` it matches on, a `story` (how it works), `signs`, and `steps` (action plan). Copy an existing entry and edit it to add a new scam; the rule engine and database page pick it up automatically, no other code changes needed.

## Scoring logic (rule engine)

Each scam profile scores points when the user's answers match: +2 for the right contact channel, +4 per matching "what they asked you to do" action, +3 per matching keyword tag. The highest-scoring scam is shown, with its confidence normalized against a realistic ceiling (channel + up to 4 actions + up to 3 keywords) so a strong partial match still reads as high-confidence rather than being diluted by a scam's full profile size.

---

Built by Suva. Feedback and new scam scripts welcome via the in-app "Help us catch more scams" form.
