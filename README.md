# Sqids Encoder / Decoder

A single-file web app to encode numbers into short unique IDs and decode them back, using [Sqids](https://sqids.org).

- **100% client-side** — no server, no data leaves your browser
- **Single file** — the official [sqids-javascript](https://github.com/sqids/sqids-javascript) v0.3.0 library (MIT) is inlined into `index.html`, so it works offline and needs no CDN
- **Options** — custom alphabet and minimum ID length, matching the Sqids playground

## Run locally

Just open `index.html` in your browser — no build step, no dependencies.

## Deploy to GitHub Pages (github.io)

1. Create a new repository on GitHub (e.g. `sqids-encode-decode`).

2. Push this folder to it:

   ```bash
   git init
   git add index.html README.md
   git commit -m "Sqids encode/decode page"
   git branch -M main
   git remote add origin https://github.com/<your-username>/sqids-encode-decode.git
   git push -u origin main
   ```

3. On GitHub, go to **Settings → Pages**, and under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main** / **/ (root)** → **Save**

4. After a minute, your app is live at:

   ```
   https://<your-username>.github.io/sqids-encode-decode/
   ```

> Tip: if you name the repository `<your-username>.github.io`, the page is served at the root: `https://<your-username>.github.io/`.

## Usage

- **Encode**: type numbers separated by commas or spaces (e.g. `1, 2, 3`) → get an ID like `86Rf07`
- **Decode**: paste an ID → get the numbers back
- **Options**: expand ⚙️ to set a custom alphabet (shuffled charset = your own unique ID scheme) or a minimum ID length

Note: decoding an ID produced with a **different alphabet** gives different numbers or fails — encode and decode must use the same options. Non-canonical IDs (ones that decode but re-encode differently) are flagged in the result.
