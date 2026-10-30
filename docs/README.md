# Website maintenance

Static site in this directory. Main origin: `https://himnarioebp.com/`. See [deployment](guides/CLOUDFLARE-DEPLOYMENT.md).

## Editing map

| Feature | Files |
| --- | --- |
| Catalog, navigation, favorites, playlists | `js/library.js`, `css/catalog.css` |
| Search | `js/search-engine.js` |
| Browser playback and queue | `js/audio-player.js` |
| Reader and page turns | `css/reading-player.css`, `js/page-flip.js` |
| Sharing / TXT | `js/sharing.js` |
| PDF preview/export | `js/pdf-export.js`, `css/sharing.css` |
| Projector | `js/projection.js`, `css/projection.css` |
| Home and app promotion | `index.html`, `js/mockups.js`, `css/website.css` |
| Shared theme and refinements | `css/library.css`, `css/refinements.css` |
| Feedback | `feedback.html`, `css/feedback.css` |
| Church identity | `identidad.html`, `css/identity.css` |
| Legal pages | `privacy.html`, `terms.html`, `css/legal.css`, `js/legal.js` |

Preserve stylesheet order in `index.html`. Use Newsreader/Public Sans and existing theme tokens. Update asset query versions when changing cached scripts/styles.

## Catalog and audio

From the repository root:

```sh
node scripts/extract-hymns.js
node scripts/generate-hymn-pages.js
node scripts/test-web-search.js
python -m http.server 8765 --bind 127.0.0.1 --directory docs
```

Open `http://127.0.0.1:8765`. Edit lyrics in `himnario/data/alabanzasPaginas.js`, not generated `data/hymns-data.js`. The extractor detects recordings in `docs/audio/` as `hymn_ID.m4a`. Keep audio credit metadata in the app catalog.

Share pages and the Apple association file come from `scripts/generate-hymn-pages.js`; inspect regenerated output. Preserve `/hymn/ID/`, `/himno/ID/` and `#himno=ID` links, including E-prefixed IDs.

## PDF and sharing

PDF export supports a single portrait Letter page or two identical copies side by side on landscape Letter (11 × 8.5 inches), with a dashed center cut line. Each cut piece is 5.5 × 8.5 inches.

Keep font size, one/two lyric columns, auto-fit, download, print, and “Incluir título”. Turning off the title leaves lyrics only. The website PDF is canvas-based image content, not selectable text. Check long hymns, both layouts and title visibility after edits.

Browser favorites/playlists remain local and independent of the mobile app. Web playlists retain `{id,name,ids}` in `ebp-lists`.

## Feedback and artwork

- Two forms are embedded in `feedback.html`: Alabanzas y Audio, and Sitio Web y Proyector.
- `?hymn=` / `?title=` selects audio feedback and displays context; it does not prefill Google Forms. `?form=audio` explicitly selects that tab.
- Form IDs and URLs live in `scripts/created_forms.json`; API helpers are in `scripts/google_forms_manager.py`. Protect OAuth credentials and tokens.
- QR source: `downloads/ebp-app-icon.png`; regenerate with `python scripts/generate-app-qr.py` using `qrcode[pil]`.
- Keep existing branded assets in `images/branding/`, promotional artwork in `mockups/`, and `.nojekyll`.
- Google Play badges remain “Próximamente” until the public listing is ready; see [release status](guides/GOOGLE-PLAY-RELEASE-PLAN.md).
