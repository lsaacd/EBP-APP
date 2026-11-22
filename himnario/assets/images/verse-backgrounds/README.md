# Verse backgrounds (Cloudflare R2 + Offline Download)

Full-resolution Verse of the Day background PNGs are hosted on Cloudflare R2 (`ebp-himnario-audio` bucket under `verse-backgrounds/`, served at `https://audio.himnarioebp.com/verse-backgrounds/`), keeping the mobile app binary and OTA updates small.

## Current Cloud Backgrounds
- `https://audio.himnarioebp.com/verse-backgrounds/1.png` (`bg-1` — Cielo y flor de cerezo / Sky & Cherry Blossom, `defaultTextTone: 'dark'`)
- `https://audio.himnarioebp.com/verse-backgrounds/2.png` (`bg-2` — Montañas al atardecer / Sunset Mountains, `defaultTextTone: 'light'`)

## Uploading Future PNGs to Cloudflare R2
From `himnario/`:
```powershell
npx wrangler r2 object put "ebp-himnario-audio/verse-backgrounds/<number>.png" --file="<path-to-file.png>" --content-type="image/png" --remote
```
Then add an entry to `VERSE_BACKGROUNDS` in `himnario/data/verseBackgrounds.ts` with `remoteUrl`, `defaultTextTone` (`'light'` for white text or `'dark'` for black text), and fallback gradient colors.
