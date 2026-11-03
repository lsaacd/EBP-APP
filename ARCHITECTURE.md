# Architecture

## App

Expo SDK 54, React 19, React Native 0.81, Expo Router, TypeScript. Check `himnario/package.json` for versions.

| Concern | Source under himnario/ |
| --- | --- |
| Entry and native background service | `index.js`, `service.js` |
| Providers, fonts, global player, portrait lock | `app/_layout.tsx` |
| iOS NativeTabs / Android bottom navigation + custom Home icon | `app/(tabs)/_layout.tsx`, `components/HomeTabIcon.tsx`, `components/androidBottomLayout.ts`, `assets/images/tab-home-*.png` |
| Home (`Inicio`), catalog, favorites, settings | `app/(tabs)/` |
| Reader and playlist details | `app/hymn/[id].tsx`, `app/playlist/[id].tsx`, `components/AndroidReaderControls.tsx` |
| Shared playback state | `context/NowPlayingContext.tsx`, `audio/native-player.ts` |
| Queue, repeat, shuffle, commands | `audio/android-playback-controller.ts` (used by the native adapter) |
| Downloads and offline playback | `audio/offline-audio.ts`, `components/OfflineAudioCard.tsx` (in Settings) |
| Mini/full player | `components/MiniPlayer.tsx`, `components/MusicPlayer.tsx` |
| Native surfaces / Liquid Glass | `components/GlassSurface.tsx` (`expo-glass-effect` guarded by `isGlassEffectAPIAvailable`, fallback to `BlurView` via `expo-blur`) |
| Sharing/PDF, projector (with orientation rotation), text sizing | `components/ShareSheet.tsx` (exactly 4 actions in order: Messages → WhatsApp → Crear PDF → Copiar letra), `components/PdfEditor.tsx` + `utils/pdfLayout.ts` ("Preparar PDF" editor, website parity with `docs/js/pdf-export.js`), `components/ProjectorModal.tsx`, `components/TextSizeSheet.tsx` |
| Cross-platform icons / Haptics | `components/WebIcon.tsx`, `utils/haptics.ts` (Android haptics disabled, iOS preserved) |
| Theme (with native OS appearance sync) and bilingual UI | `theme/ThemeContext.tsx`, `theme/theme.js`, `context/LanguageContext.tsx` |

Android playback works. Preserve `patches/react-native-track-player+4.1.2.patch`, applied by `patch-package` during installation, and root playback-service registration in `index.js`. The native patch includes the New Architecture event fix.

Also preserve `patches/react-native-screens+4.16.0.patch` (iOS `NativeTabs`): it applies tab-item appearances before selecting the tab, mirrors the selected tab's appearance onto `UITabBar`, and forces a relayout after mount. This fixes unselected tab labels (Himnos/Favoritos/Ajustes) rendering too low until the first tab switch. All four tabs use matching maximum-size 28pt template PNGs on iOS (`assets/images/tab-{home,hymns,favorites,settings}-{outline,filled}[@2x|@3x].png`), and 28pt icons on Android, with a tight vertical title adjustment (`vertical: -2`) so every label shares one baseline right below the enlarged icons. The Home trigger sets `overrideScrollViewContentInsetAdjustmentBehavior: false`, and `home.tsx` uses `contentInsetAdjustmentBehavior="never"`, so iOS doesn't add a second safe-area gap under the "Himnario" header.

**PDF editor:** `utils/pdfLayout.ts` is a pure layout engine that ports the website's measure/fit rules (Letter portrait single page, or landscape 2-up with a dashed cut line; 4–28pt; 1–2 columns; shrinks in 0.25pt steps until the hymn fits on one page). Both the live preview (`SvgXml` from `react-native-svg`) and the exported PDF (`expo-print` HTML wrapping the same SVG) come from one plan, so the preview matches the output.

## Native dependencies (Version 1.1.0)

Version 1.1.0 includes:
- `expo-print` and `expo-sharing` (PDF export from the in-app "Preparar PDF" editor, `components/PdfEditor.tsx`, opened from `ShareSheet.tsx`)
- `expo-navigation-bar` (to hide Android system navigation on startup/resume)
- `expo-screen-orientation` (configured in `app.json` with `initialOrientation: "PORTRAIT_UP"` and `"orientation": "default"`, locked to Portrait globally in `app/_layout.tsx` and unlocked inside `ProjectorModal.tsx` so presentation mode supports both free Portrait/Landscape rotation and a manual rotate toggle button).

Adding or modifying native modules requires a full native build (`eas build`), not an OTA update.

## Data and storage

- Lyrics and metadata: `himnario/data/alabanzasPaginas.js`. Keep hymn IDs as strings; E-prefixed estribillos are distinct.
- Recording IDs, filenames and streaming URLs: `himnario/data/audioRegistry.native.ts`. Base and Android registry files re-export it; avoid circular platform imports.
- Audio base: `https://audio.himnarioebp.com/`. Recordings use `hymn_ID.m4a`; `315 A` maps to `hymn_315.m4a`.
- Local recordings in `himnario/assets/audio/` are source assets, excluded from EAS archives. Adding a local file alone does not publish it to R2 or register it.
- Saved recordings use iOS cache storage and Android document storage. Unsaved recordings need a connection.
- Preserve AsyncStorage keys and user data. Native playlists use `hymnIds`; web playlists use `ids` in `ebp-lists`.
- Mobile and browser favorites/playlists are independent.

## Website and generators

`docs/` is a static website with its own browser audio player. Cloudflare Pages hosts the site; R2 serves recordings.

- `scripts/extract-hymns.js` generates `docs/data/hymns-data.js` from app data; web audio availability comes from `docs/audio/*.m4a`.
- `scripts/generate-hymn-pages.js` generates share pages and the Apple association file. Edit the generator rather than generated pages.
- Preserve canonical `https://himnarioebp.com/hymn/ID/` URLs, existing `/himno/` aliases and reader fragment links.
- iOS association identifier: `VV6BQ35L5N.com.elbuenpastor`. Configuration alone does not prove device link handling.

## Product conventions

Newsreader / Public Sans, parchment and burgundy light mode, pure-black dark mode. Favorites use bookmarks. Spanish UI uses “Himnario” and “alabanzas”. Keep detail routes outside the tab group.
