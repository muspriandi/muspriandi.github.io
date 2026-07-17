# Sqids Encoder / Decoder

A single web page that encodes numbers into short unique IDs and decodes them back, using [Sqids](https://sqids.org). One page serves **both** casual human use (interactive UI) and **automation** (URL query → JSON).

- **100% client-side** — no server, no data leaves your browser
- **3 fixed sections** — Catalog Category, Item, and Variant, each with its own alphabet + minimum ID length, and its own encode/decode
- **Custom section** — enter your own alphabet + min length in the UI (or pass them to the API as `type=custom`)
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

- `type` — which section's alphabet/minLength to use (section name, lowercased, no spaces), or `custom`
- `action` — `enc` (numbers → ID) or `dec` (ID → numbers)
- `value` — numbers (comma/space separated) for `enc`, or an ID for `dec`
- `alphabet`, `minlength` — **only** for `type=custom` (both optional; blank alphabet = Sqids default, `minlength` defaults to 0)

Examples:

```
index.html?type=item&action=enc&value=1,2,3
index.html?type=catalogcategory&action=dec&value=jOxlEWJYRy4hga2B
index.html?type=custom&action=enc&value=1,2,3&alphabet=abcdefghij&minlength=8
```

Result JSON (also exposed on `window.__sqidsResult`):

```json
{ "ok": true, "type": "item", "action": "enc", "value": "1,2,3", "numbers": [1,2,3], "result": "YTMSAG9BduXC7tom" }
```

On error: `{ "ok": false, "error": "..." }`.

## How automation consumes it

The JSON is produced by JavaScript, so a consumer must **run** that JS. GitHub Pages is
static hosting — it does not execute JS per request — so plain `curl` returns the HTML
source, never the JSON. Two ways that work:

### Option A — Drive the deployed page with a headless browser

Consumes the live github.io URL (tests the real deployed artifact).

**Playwright:**

```js
const { chromium } = require('playwright');

async function sqids(type, action, value) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const url = `https://muspriandi.github.io/?type=${type}&action=${action}&value=${encodeURIComponent(value)}`;
  await page.goto(url);
  const res = await page.evaluate(() => window.__sqidsResult); // the JSON object
  await browser.close();
  return res;
}

// usage
const r = await sqids('item', 'enc', '1,2,3');
// { ok: true, type: 'item', action: 'enc', result: 'YTMSAG9BduXC7tom', ... }
if (!r.ok) throw new Error(r.error);
```

Puppeteer is identical (`page.evaluate(() => window.__sqidsResult)`). If your tool can't
call `evaluate`, read the visible text instead:

```js
JSON.parse(await page.textContent('#output'))
```

### Option B — Skip the browser, run the same logic in Node

The encode/decode logic is just `js/sqids.js` + `js/config.js`. CI can load them
directly — **no browser, no network, same alphabets**, so results match the site
exactly. Fastest for automated tests.

```js
// sqids-node.js  (place next to the js/ folder)
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ctx = vm.createContext({ Blob });
for (const f of ['js/sqids.js', 'js/config.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, f), 'utf8'), ctx);
}
// `class Sqids` is lexically scoped inside the vm context — expose it on the sandbox.
vm.runInContext('this.Sqids = Sqids; this.SECTIONS = SECTIONS;', ctx);

function key(name) { return name.toLowerCase().replace(/[\s_-]/g, ''); }
function make(type) {
  const s = ctx.SECTIONS.find(x => key(x.name) === key(type));
  if (!s) throw new Error('unknown type ' + type);
  return new ctx.Sqids({ alphabet: s.alphabet, minLength: s.minLength });
}
module.exports = {
  enc: (type, nums) => make(type).encode(nums),  // enc('item', [1,2,3]) -> 'YTMSAG9BduXC7tom'
  dec: (type, id)   => make(type).decode(id),    // dec('item', 'YTMS…')  -> [1,2,3]
};
```

### What won't work

```bash
curl "https://muspriandi.github.io/?type=item&action=enc&value=1,2,3"   # returns HTML, not JSON
```

For a true `curl` → JSON endpoint you'd need a serverless function (Cloudflare
Workers/Vercel), not GitHub Pages.

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
