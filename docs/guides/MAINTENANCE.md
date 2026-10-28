# Himnario web

Future hymn sharing and rich-preview implementation: see [SHARING-HANDOFF.md](SHARING-HANDOFF.md) for the current state, implementation steps, pending decisions, and acceptance checks.

Static website using the app's hymn and chorus catalog. No build or account is required.

Feedback lives at `feedback.html` and embeds the Google Form. The hymn reader's report link includes the current hymn ID and title as context; form responses are submitted to Google Forms. The privacy notice describes this third-party form.

Regenerate the web data after changing app lyrics or adding audio to `docs/audio/`:

```sh
node scripts/extract-hymns.js
```

Run from the repository root for local preview:

```sh
python -m http.server 8765 --bind 127.0.0.1 --directory docs
```

Open `http://127.0.0.1:8765`. Vercel routes are configured in the root `vercel.json`; GitHub Pages can serve the `docs` directory directly.

The generated `data/hymns-data.js` is the website's catalog. Audio availability is determined by matching `hymn_{id}.m4a` files in `docs/audio/`, independent of the app's legacy audio URLs. The unused legacy `hymnsData.js` was removed during website organization; the generated catalog is the single web data source.

Top navigation opens Inicio (`#inicio`), Himnos (`#himnos`), Índice (`#indice`) and Favoritos (`#favoritos`). The index sorts titles alphabetically, ignoring leading punctuation, and includes letter shortcuts. Favorites, appearance and reading size are browser-local and do not sync with the mobile app. Individual hymns can be linked using `#himno=1` or `#himno=E124`. Search accepts exact hymn numbers, accented or unaccented titles, and lyric phrases. Older saved list/history data is preserved but is not exposed in this simplified interface.

`images/branding/og_ebp.svg` is the supplied church logo copied into the website so it does not depend on an external drive. `css/website.css` provides the website header, homepage and reference-inspired hymn list styling.

`images/branding/dark_theme_webpage_ebp.svg` is the supplied dark-mode logo. Theme changes switch the header, footer and book-cover assets without a white backing. `css/refinements.css` expands desktop content and navigation spacing and uses Newsreader 600/700 and Public Sans 600/700. Favorites retain their existing local storage and use outlined/filled SVG bookmarks in the catalog and reader.

Hymn list titles use the app's regular italic Newsreader 400; hymn numbers, headings and navigation keep their stronger weights. The list ends with the app's subdued sparkle and Psalm 100:1, while Favorites ends with Psalm 136:1. These are ordinary end-of-list content, with no hidden activation or tracking.

Search uses the local `js/search-engine.js` index. Exact numbers and titles rank first, followed by title words, lyric phrases, and approximate title matches. Accents, case and punctuation are normalized; title searches tolerate small spelling errors and adjacent letter swaps. Queries such as `himno 001`, `E124` and `estribillo 124` are supported. A field selector restricts the search to titles, lyrics or numbers; category, collection and audio filters still apply. Results highlight matching words and show lyric excerpts where relevant. Enter opens the first result; Escape clears the query. Check relevance against the actual catalog with `node scripts/test-web-search.js`.

The desktop App Store QR card uses a rounded-dot QR with the supplied app icon embedded in the center. It can be dismissed and reopened; dismissal lasts for the browser session. On phones, a direct App Store link replaces the QR. The card hides while the hymn reader is open. Generated QR downloads live in `downloads/`; regenerate with `python scripts/generate-app-qr.py` (`qrcode[pil]` required). Branded QR artwork uses high error correction and was independently decoded with ZXing at 1080, 288, 192 and 160 pixels. The original plain QR PNG/SVG remain available.

Homepage app previews are rendered by `js/mockups.js` using supplied artwork copied into `mockups/`. Reading uses `[04].png` in light mode and `5.png` in dark mode. The feature gallery uses `[02].png` (search), `7.png` (audio), and `8.png` (favorites). Original artwork is preserved and lazy-loaded. The hero book remains in place and always uses `images/branding/dark_theme_webpage_ebp.svg` for its cover emblem; the header and footer logos still follow the active theme.

`js/audio-player.js` owns one shared audio element. Its themed mini-player persists across catalog and lyric navigation; clicking its title expands the app-style burgundy-to-black player. Desktop shows cover artwork beside the title, recording credit, seeking, shuffle, previous/next, play/pause, repeat, bookmark, sharing, playlist and queue actions. Phones show the same controls vertically. Desktop catalog covers start audio. Browser media-session controls receive the hymn metadata, original app recording credit and cover when supported. Tracks without recordings are skipped by playback queues but can still belong to a service playlist.

The hymn reader is a full-page section, not a dialog. Catalog titles are real links to `#himno=ID`, supporting direct access, refresh, sharing and opening in a new tab. Opening a hymn pushes browser history; Back restores the previous collection, filters and scroll position. The reading page keeps Newsreader typography, centered numbered verses and italic choruses in the same neutral ink color. Its floating controls provide persistent font sizing, light/dark mode and audio; previous/next hymn buttons remain available during page scrolling. Bookmark, share and add-to-list actions appear in the reading header. `css/reading-player.css` contains these layouts and their responsive rules. The expanded audio and playlist views are accessible native dialogs; minimizing audio does not stop playback.

The Mis listas panel stores `{id,name,ids}` entries in `ebp-lists` in localStorage, preserving earlier website lists. Create, rename, reorder, remove entries, delete lists, and play available recordings in order. These lists remain browser-local and do not sync with the app. Every hymn remains directly accessible through its own `#himno=ID` URL; no separate generated HTML page is required for reading or playback.

The catalog scrolls with the document, without a nested vertical scrolling container. The sticky position slider scrolls the page and supports mouse, touch and keyboard (arrows, Home, End). The alphabetical index uses dotted leaders and a sticky vertical letter rail; click or drag to jump between letter sections. The horizontal category strip includes every category in the selected collection, with arrow controls and native horizontal scrolling. Search and category changes reset scroll; reading and favorite changes preserve position. Dark mode follows the system until overridden, then persists locally, using the app's Pure Black palette (`#010101`, `#1c1c1c`, `#373737`, `#fdf9f2`).

The simplified catalog has only Himnos and Estribillos tabs, defaulting to hymns. Categories are derived separately from the selected collection and reset on a collection change; there is no combined catalog tab. Mouse users can grab and drag the category strip without activating a category, while touch swipes, arrow buttons and keyboard navigation remain available. Search field selection, category selection and the audio filter live inside the collapsed filter panel. The index opens with Himnos first and selected, followed by an Estribillos y coritos switch; each has a separate heading, alphabetical sequence, and letter rail sized to the available viewport. Favorites contains Mis favoritos and Listas de reproducción tabs. Playlists are created and browsed inline there, with the same stored lists and detail/add dialogs used by the reader and audio player; the separate Mis listas navigation item has been removed. These catalog layouts are in `css/catalog.css`.

Privacy and terms are available in Spanish and English. The library interface and hymn catalog are Spanish. Font requests use Google Fonts, with system serif/sans-serif fallbacks.

The website header keeps the same grid and search field across all main pages, preventing navigation links from shifting when changing tabs.

Texto opens a non-modal reading popover with a live Newsreader preview, slider, one-pixel step buttons, direct numeric entry (12–64 px), and reset to 26 px. Font sizes apply literally at every viewport width and persist locally. Clicking outside, pressing Escape, or using the close button dismisses the popover; explicit close and Escape restore focus to Texto. Out-of-range entries are clamped and limit buttons disable at the endpoints.

The reading header's back arrow explicitly exits to the originating catalog view, preserving its filters and scroll position. Hymn-to-hymn changes replace the reading history entry; only entering the reader creates a new entry. This prevents the exit arrow and browser Back from walking through every previously read hymn. Direct estribillo links return to the Estribillos collection.

The add-to-playlist popup shows a separate hymn context and visible Add/Remove, View list and Delete list actions on each card. Membership toggles are reversible; deleting a list requires an inline confirmation. Detail rows expose a labeled Quitar button. List changes persist in the same browser-local storage and refresh the Favorites list browser. A backdrop click dismisses the playlist/queue dialog and restores its original opener, including when opened over the full player; dragging from inside to outside does not dismiss it.

With a recording selected, Space or K pauses/resumes playback and M toggles mute. Left/Right seeks five seconds only in the expanded player, leaving reader page-turn keys intact. Shortcuts ignore typing fields, playlist dialogs and text settings; Space preserves ordinary button/link activation, except on playback controls. Held Space does not repeatedly toggle playback. The expanded player initially focuses its play button and displays a desktop shortcut hint. Existing media-session hardware controls remain available.

`js/page-flip.js` adapts the app's `PageFlipTransition.tsx` and `PageFlip/BookSpine.tsx` / `PageShadow.tsx`. Viewport-only snapshots reveal the real neighboring hymn under a perspective fold and moving shadow. Previous/next buttons and keyboard Left/Right trigger the same turn. Touch users can swipe horizontally through the reading area; mouse drags begin at either page edge so selecting lyric text still works. Vertical scrolling stays native. Small drags snap back, boundaries never wrap, and only the active animation holds navigation. Exit, history navigation, resize, page hiding and pointer cancellation clean up the transition. Reduced-motion preferences skip the animation. Snapshot content is inert, hidden from accessibility APIs and has no duplicated element IDs. Audio playback remains owned by the shared player and continues during turns.
