# Hymn sharing — implementation handoff

Updated: 2026-10-28
Status: Planned for later. This document does not mean the feature has been implemented or deployed.

## Goal

Let users share an alabanza from the mobile app or website. The recipient should see the hymn title and branded artwork in messaging apps, then open the correct hymn. Eventually, the same HTTPS link should open the installed mobile app, with the website as the fallback.

## Current project state

- Website source: `docs/`; mobile app source: `himnario/`.
- Web entry point: `docs/index.html`.
- Catalog: generated `docs/data/hymns-data.js`. Regenerate from the repository root with `node scripts/extract-hymns.js`; do not hand-edit the generated catalog.
- Reader routing and web sharing: `docs/js/library.js`. The reader currently uses `#himno=1` and `#himno=E124`. Preserve the E prefix so hymns and choruses with the same number stay distinct.
- The web reader Share action uses `navigator.share`, falling back to clipboard copying. It currently shares the current URL. Inspect `docs/js/audio-player.js` for the player's separate share action before changing shared-link generation.
- Existing deployment rewrites are in the repository-root `vercel.json`. Static hosting of `docs/` is also described in `docs/README.md`.
- The mobile configuration in `himnario/app.json` declares the custom scheme `el-buen-pastor-himnario`. This alone does not establish HTTPS Universal Links or Android App Links. Inspect the native share and incoming-link handlers before implementing them; they have not been audited for this plan.
- App Store destination currently used by the website: `https://apps.apple.com/app/id6794435414`.
- A production website domain has not been confirmed for this task. Do not invent one or hard-code a temporary/local URL into app sharing.

## How sharing should work

1. User presses Share on a hymn or its audio player.
2. App shares a stable public HTTPS URL identifying that hymn.
3. Messages or another service fetches that URL to build a preview from its initial HTML metadata.
4. Recipient taps the link. The installed app can open the matching hymn once platform link associations are configured; otherwise the web reader opens it.

A preview card is controlled by the receiving service. Supplying metadata does not guarantee an identical preview everywhere or embedded audio playback inside Messages.

## Recommended implementation order

### 1. Confirm the production origin and host

Confirm the final HTTPS domain and whether production uses Vercel or static hosting. Use a single configured origin for all shared links, canonical URLs, preview image URLs, and platform association files. Never share a `file:///` URL or localhost address.

### 2. Generate public pages per alabanza

Suggested route contract: `/himno/1/` and `/himno/E124/`. Finalize this once and keep old links working.

Generate a small HTML page per catalog entry during the existing data/build workflow. Its initial HTML should contain a meaningful title, description, canonical URL, `og:type`, `og:title`, `og:description`, `og:url`, and an absolute HTTPS `og:image` URL. Twitter card metadata can be included too. Use escaped catalog values to avoid malformed HTML.

Each page should open the existing reader for that exact ID, or offer a clear link into it. Prefer reusing the reader over duplicating its UI and playback logic. Resolve asset paths correctly on nested routes. Keep old `#himno=` links working.

Fragments such as `#himno=1` are not sent in HTTP requests. They can open the right hymn in the browser, but cannot supply a different preview to a server-side crawler. Merely changing metadata with browser JavaScript is insufficient for reliable previews. A generic rewrite to `index.html` also does not create per-hymn metadata.

For this static website, generated pages are a natural starting point; a server-rendered endpoint is an alternative if hosting requirements warrant it. No database is needed for the catalog-sharing feature.

### 3. Use one link contract across app and web

Update the website reader, audio player, and native app share actions to build the same canonical URL from the catalog ID. Include the alabanza title and number in optional share text. Keep native cancellation harmless and retain a copy-link fallback on the web.

### 4. Add app opening support

- iOS: configure Associated Domains and host the corresponding Apple app-site-association file using the verified Apple Team ID and app identifier. Handle cold and warm incoming links in the app.
- Android, if supported: configure intent filters and host `assetlinks.json` using the actual package name and release signing certificate fingerprints.
- Keep a web fallback and an App Store button. Avoid redirect loops or automatic custom-scheme launches that interfere with web visitors.
- Native association changes require an appropriate new app build/release; website edits alone cannot enable them for an already installed build.

## Artwork and previews

Use the existing branded audio cover from website assets after identifying its actual filename. Keep the source asset in the repository, not on an external G: drive. Use a public raster image for broad preview compatibility, with declared dimensions and useful alt metadata. Check how the chosen cover crops in Messages and WhatsApp before deciding whether a separate landscape preview is needed.

## Preserve the established website

- Keep Newsreader typography, cream/burgundy light mode, and the app-inspired dark theme.
- Keep favorites as bookmarks, collection-specific categories, existing search, playlists, and persistent playback.
- Keep presentation mode, keyboard shortcuts, and page-turn effects working.
- Keep app and browser-local favorites/playlists independent unless a separate sync feature is explicitly requested.
- Scope changes to sharing/routing and required hosting configuration. Existing workspace edits belong to ongoing work; do not reset or overwrite unrelated files.

## Acceptance checks when implementation resumes

- Opening a shared hymn URL directly or refreshing it shows the correct hymn, including E-prefixed choruses.
- Invalid IDs get a helpful fallback rather than an unrelated hymn or an exception.
- Fetching the raw HTML without executing JavaScript returns that hymn's metadata and accessible artwork.
- Share actions from app, web reader, and expanded player identify the same hymn.
- Old fragment URLs remain usable; nested paths load CSS, scripts, and audio correctly.
- Sharing without audio still works and does not imply a recording exists.
- Check previews using publicly accessible HTTPS pages; local files cannot establish public messaging previews.
- Verify installed-app and browser fallback behavior on real devices, including app cold starts, when platform associations are added.
- Verify actual deployment routes and published association files before calling the feature complete.

## Decisions still needed

Production domain and hosting target; final URL structure; desired preview artwork; whether native app opening is part of the initial release; verified platform identifiers for association files.

## Starting point for the next agent

Read this file and `docs/README.md`, inspect current web share handlers and native app share/link handlers, then confirm hosting configuration. Implement from the catalog source and preserve existing user changes. Do not report the planned feature as live until deployed URLs and device behavior have actually been checked.
