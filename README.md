# Sqids Encoder / Decoder

A single web page that encodes numbers into short unique IDs and decodes them back, using [Sqids](https://sqids.org). One page serves **both** casual human use (interactive UI) and **automation** (URL query → JSON).

- **100% client-side** — no server, no data leaves your browser
- **3 sections** — Catalog Category, Item, and Variant, each with its own alphabet + minimum ID length, and its own encode/decode
- **Two modes, one page** — open normally for the UI, or add query params to get JSON

## File structure

Code is split by concern (all static — works on GitHub Pages as-is):

```
index.html        structure / markup only
css/styles.css    all styling
js/config.js      SECTIONS config  ← EDIT ME
js/sqids.js       Sqids v0.3.0 library (MIT), vendored
js/app.js         app logic: interactive UI + automation query API
```

`index.html` loads the three scripts in order (`sqids.js` → `config.js` → `app.js`);
the library and config define the globals the app uses.

## Modes

### 1. Casual UI
Open `index.html` in a browser — you get the 3-section encode/decode interface.

### 2. Automation API (URL query)
Add query params to the same page and it renders **JSON only**:

```
index.html?type=<catalogcategory|item|variant>&action=<enc|dec>&value=<...>
```

- `type` — which section's alphabet/minLength to use (section name, lowercased, no spaces)
- `action` — `enc` (numbers → ID) or `dec` (ID → numbers)
- `value` — numbers (comma/space separated) for `enc`, or an ID for `dec`

Examples:

```
index.html?type=item&action=enc&value=1,2,3
index.html?type=catalogcategory&action=dec&value=jOxlEWJYRy4hga2B
```

Result JSON (also exposed on `window.__sqidsResult`):

```json
{ "ok": true, "type": "item", "action": "enc", "value": "1,2,3", "numbers": [1,2,3], "result": "YTMSAG9BduXC7tom" }
```

On error: `{ "ok": false, "error": "..." }`.

> **Note on GitHub Pages + curl:** Pages is static hosting — it does not run JS per
> request, so a plain `curl` returns the HTML, not the JSON. The JSON is computed in the
> browser. Read it with a headless browser:
>
> ```js
> // Playwright / Puppeteer
> await page.goto('https://<you>.github.io/?type=item&action=enc&value=1,2,3');
> const res = await page.evaluate(() => window.__sqidsResult);
> // or: JSON.parse(await page.textContent('#output'))
> ```

## Editing the config

Open `js/config.js` (marked `EDIT ME`). Each entry sets a section's `name`, `color`,
`alphabet`, and `minLength`. Alphabet rules: at least 3 characters, all unique. The
`type` used in the automation URL is derived from `name` (lowercased, spaces removed).
Add or rename sections here and both the UI and the API follow automatically.

The alphabets shipped now are **dummy placeholders** — replace them with your real ones.

## Deploy to GitHub Pages

This repo is already the `muspriandi.github.io` site, so pushing to `main` publishes it:

```bash
git add -A
git commit -m "Update Sqids page"
git push origin main
```

Live at:

```
https://muspriandi.github.io/
https://muspriandi.github.io/?type=item&action=enc&value=1,2,3
```

GitHub Pages takes ~1 minute to rebuild after a push.
