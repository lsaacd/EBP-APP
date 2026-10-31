# Architecture

## App

Expo SDK 54, React 19, React Native 0.81, Expo Router, TypeScript. Check `himnario/package.json` for versions.

| Concern | Source under himnario/ |
| --- | --- |
| Entry and native background service | `index.js`, `service.js` |
| Providers, fonts, global player | `app/_layout.tsx` |
| iOS NativeTabs / Android edge bottom navigation | `app/(tabs)/_layout.tsx`, `components/androidBottomLayout.ts` |
| Home, catalog, favorites, settings | `app/(tabs)/` |
| Reader and playlist details | `app/hymn/[id].tsx`, `app/playlist/[id].tsx`, `components/AndroidReaderControls.tsx` |
| Shared playback state | `context/NowPlayingContext.tsx`, `audio/native-player.ts` |
| Queue, repeat, shuffle, commands | `audio/android-playback-controller.ts` (used by the native adapter) |
| Downloads and offline playback | `audio/offline-audio.ts` |
| Mini/full player | `components/MiniPlayer.tsx`, `components/MusicPlayer.tsx` |
| Native surfaces / Liquid Glass | `components/GlassSurface.tsx` (`expo-glass-effect` guarded by `isGlassEffectAPIAvailable`, fallback to `BlurView` via `expo-blur`) |
| Sharing/PDF, projector, text sizing | `components/ShareSheet.tsx`, `ProjectorModal.tsx`, `TextSizeSheet.tsx` |
| Cross-platform icons / Haptics | `components/WebIcon.tsx`, `utils/haptics.ts` (Android haptics disabled, iOS preserved) |
| Theme and bilingual UI | `theme/ThemeContext.tsx`, `theme/theme.js`, `context/LanguageContext.tsx` |

Android playback works. Preserve `patches/react-native-track-player+4.1.2.patch`, applied by `patch-package` during installation, and root playback-service registration in `index.js`. The native patch includes the New Architecture event fix.

## Native dependencies (Version 1.1.0)

Version 1.1.0 adds `expo-print` and `expo-sharing` (for printable 2-up landscape PDF creation directly inside `ShareSheet.tsx`) and `expo-navigation-bar` (to hide Android system navigation on startup/resume). Adding or modifying native modules requires a full native build (`eas build`), not an OTA update.

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
