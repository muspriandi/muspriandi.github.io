# Sqids Encoder / Decoder

Single-file web apps to encode numbers into short unique IDs and decode them back, using [Sqids](https://sqids.org).

- **100% client-side** — no server, no data leaves your browser
- **Self-contained** — the official [sqids-javascript](https://github.com/sqids/sqids-javascript) v0.3.0 library (MIT) is inlined into each HTML file, so it works offline and needs no CDN
- **3 sections per page** — Catalog Category, Item, and Variant, each with its own alphabet + minimum ID length, and its own encode/decode

## Pages

| File | Environment | Purpose |
|------|-------------|---------|
| `index.html` | **Production** | Your live encoding config |
| `automation-test.html` | **Automation Test** | Separate config for test runs — IDs are **not** interchangeable with production |

The two pages are cross-linked at the top so you can switch between them. The automation-test page has a warning banner so you always know which environment you're on.

## Run locally

Just open `index.html` (or `automation-test.html`) in your browser — no build step, no dependencies.

## Editing the config

Open either file and search for `EDIT ME`. Each page has one config block:

```js
var SECTIONS = [
  { name: 'Catalog Category', color: '#4f46e5', alphabet: '...', minLength: 6 },
  { name: 'Item',             color: '#0d9488', alphabet: '...', minLength: 8 },
  { name: 'Variant',          color: '#d97706', alphabet: '...', minLength: 10 },
];
```

Change `alphabet` / `minLength` (or add sections — the cards render from this array). Alphabet rules: at least 3 characters, all unique. The alphabets shipped now are **dummy placeholders** — replace with your real ones. Production and automation-test use **different** alphabets on purpose, so the same numbers produce different IDs per environment.

## Deploy to GitHub Pages (github.io)

1. Create a new repository on GitHub (e.g. `sqids-encode-decode`).

2. Push this folder to it:

   ```bash
   git init
   git add index.html automation-test.html README.md
   git commit -m "Sqids encode/decode pages"
   git branch -M main
   git remote add origin https://github.com/<your-username>/sqids-encode-decode.git
   git push -u origin main
   ```

3. On GitHub, go to **Settings → Pages**, and under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main** / **/ (root)** → **Save**

4. After a minute, your apps are live at:

   ```
   https://<your-username>.github.io/sqids-encode-decode/
   https://<your-username>.github.io/sqids-encode-decode/automation-test.html
   ```

> Tip: if you name the repository `<your-username>.github.io`, the pages are served at the root: `https://<your-username>.github.io/`.

## Automation API (automation-test.html)

The automation-test page can run **headless via URL query params** and return JSON — no UI interaction — so automated tests can drive it directly.

```
automation-test.html?type=<catalogcategory|item|variant>&action=<enc|dec>&value=<...>
```

- `type` — which section's alphabet/minLength to use
- `action` — `enc` (numbers → ID) or `dec` (ID → numbers)
- `value` — numbers (comma/space separated) for `enc`, or an ID for `dec`

Examples:

```
automation-test.html?type=item&action=enc&value=1,2,3
automation-test.html?type=catalogcategory&action=dec&value=YANlBD
```

The page body becomes a JSON document, also exposed as `window.__sqidsResult`:

```json
{ "ok": true, "type": "item", "action": "enc", "value": "1,2,3", "numbers": [1,2,3], "result": "K5tzSJ1Q" }
```

On error: `{ "ok": false, "error": "..." }`. Reading it from a headless browser:

```js
// e.g. Playwright / Puppeteer
await page.goto('.../automation-test.html?type=item&action=enc&value=1,2,3');
const res = await page.evaluate(() => window.__sqidsResult);
// or: JSON.parse(await page.textContent('#output'))
```

When opened with **no** query params, the page shows the normal interactive 3-section UI.

## Usage

- **Encode**: type numbers separated by commas or spaces (e.g. `1, 2, 3`) → get an ID
- **Decode**: paste an ID → get the numbers back

Note: an ID only decodes correctly with the **same alphabet + minLength** it was encoded with — that's why each section and each environment is isolated. Non-canonical IDs (ones that decode but re-encode differently) are flagged in the result.
