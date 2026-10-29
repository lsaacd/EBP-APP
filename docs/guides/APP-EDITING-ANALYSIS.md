# EBP app editing: verified orientation

Reviewed October 29, 2026. This is a documentation and source review, not a device test or release. No app behavior was changed by this review.

## Read first

`ARCHITECTURE.md` provides the best overall map. Consult `EAS.md` and `EAS_UPDATE_GUIDE.md` for release intent, then verify their commands against the current configuration. `FUTURE_FIXES_HIMNARIO_EBP.md` records investigations and proposals, not proof of current root causes. The copies of EAS and future-fixes guides under `himnario/` duplicate the root guides and may diverge later.

For the website, start with `docs/README.md`, then read only the relevant maintenance, sharing, Cloudflare, deployment, or feedback handoff. Several sharing and maintenance paragraphs describe historical states; current source and deployed verification take precedence.

## App editing map

All paths below are relative to the repository root.

| Concern | Source and editing guidance |
| --- | --- |
| Dependencies and commands | `himnario/package.json`: Expo ~54.0.33, React 19.1.0, React Native 0.81.5, TypeScript ~5.9.2. Inspect the lockfile for resolved versions. |
| Entry and background service | `himnario/index.js` registers `service.js` before mounting Expo Router. Preserve this registration. |
| Providers, fonts, global player | `himnario/app/_layout.tsx` loads fonts and mounts shared providers, MiniPlayer and MusicPlayer. |
| Platform navigation | `himnario/app/(tabs)/_layout.tsx`: iOS NativeTabs with SF Symbols; Android custom floating pill bar with MaterialIcons. Detail routes remain outside the tab group. |
| Catalog and search | `himnario/app/(tabs)/hymns.tsx`, `context/HymnFilterContext.tsx`. Keep hymn and estribillo categories separate and preserve list performance. |
| Reading | `himnario/app/hymn/[id].tsx`, `components/PageFlipTransition.tsx`, `components/PageFlip/`. Check gestures, neighboring page previews, font sizing and safe-area clearance together. |
| Playback | `himnario/context/NowPlayingContext.tsx` owns shared track and queue state; `components/MiniPlayer.tsx` and `components/MusicPlayer.tsx` consume it. Minimize and fully stop/clear are distinct actions. |
| Theme | Actual provider: `himnario/theme/ThemeContext.tsx`; tokens and font names: `himnario/theme/theme.js`. Current stored keys are `isDarkMode` and `fontSizeMultiplier`; multiplier is clamped to 0.8–2.0. |
| Translations and doctrine | `himnario/context/LanguageContext.tsx`: Spanish and English UI strings, including church identity. Use the existing translation mechanism for new UI. |
| Persistence | `FavoritesContext.tsx`, `PlaylistsContext.tsx`, `RecentHymnsContext.tsx`: preserve AsyncStorage keys and existing data. Playlist entries use `{id, name, hymnIds, createdAt}`. |
| Lyrics and metadata | `himnario/data/alabanzasPaginas.js`: 637 main hymns and 124 estribillos. Preserve IDs as strings, including the E prefix. |
| Native audio | `himnario/data/audioRegistry.ts` contains static require mappings to bundled audio. A file alone does not register a new recording. |
| Web data | `scripts/extract-hymns.js` generates `docs/data/hymns-data.js` from app data, but determines audio availability from `docs/audio/*.m4a`. Mobile and web audio folders are separate. |
| Shared pages | `scripts/generate-hymn-pages.js` creates `/hymn/ID/`, `/himno/ID/`, and the Apple association file. Edit the generator rather than hundreds of generated pages. |
| Releases | `himnario/app.json`, `himnario/eas.json`; website deployment: `scripts/deploy-cloudflare.ps1`. A Git commit, an EAS Update, a native build, and a Pages deployment are different operations. |

## Corrections to apply when maintaining the older guides

- The README Expo 52 badge is outdated; package.json specifies SDK 54.
- ARCHITECTURE lists ThemeContext under `context/`; it actually lives under `theme/`.
- EAS_UPDATE_GUIDE uses an obsolete `C:/Users/duran/OneDrive/...` path. Run commands from the actual checkout, with EAS commands inside `himnario/`.
- PowerShell quoting alone does not disable wildcard interpretation of square brackets. Use `-LiteralPath` for filesystem commands targeting this workspace.
- OTA updates do not necessarily appear instantly. They require a compatible runtime and download/application according to the installed app's update configuration, typically on a later restart.
- Current runtime policy is `appVersion`, with app version 1.0.0. A changed native library, entitlement, permission, or other native configuration needs an appropriate new build and runtime compatibility review. Incrementing the remote build number alone does not change an appVersion runtime.
- `eas.json` declares build channels, but this review did not verify the live channel-to-branch mappings or installed production binary. Do not assume a matching branch name proves delivery.
- EAS.md's Android service-account submission block is an example, not the current config: `submit.production` is currently empty.
- TrackPlayer requires a compatible native development/release build for meaningful playback testing; an ordinary Expo Go session cannot validate this native audio engine.
- FUTURE_FIXES describes direct service handlers as required work; Play/Pause/Seek already call TrackPlayer directly. Next/Previous still forward custom events while the context also subscribes to remote skip events. Investigate potential duplicate skip handling and background behavior on a device before claiming a root cause or fix.
- Audio is already resolved through bundled static assets and expo-asset. The proposed offline caching work should start by measuring current offline behavior; do not assume all playback currently depends on streaming.
- Audio READMEs advertise MP3/WAV generally, while web extraction specifically matches M4A. Changing formats requires checking both registries and generators.
- The sharing handoff still calls preview pages planned, but commit 2c01fde generated them and changed native share URLs. Its Apple association file lacks the application identifier prefix, and adding associatedDomains to app.json does not update an already-installed native binary.
- Legal/store policy assertions in older release notes are historical guidance, not guarantees of approval. Verify current official requirements when preparing a store submission.

## Practical verification for future edits

Start with Git status and the relevant screen, provider, and caller. Prefer existing design tokens, Newsreader/Public Sans, bookmark symbols and respectful Spanish terminology: Himnario and alabanzas. Keep iOS and Android navigation differences intentional.

For app changes, use installed project tooling from `himnario/`: `npm run lint` and `npx tsc --noEmit` when relevant. Capture existing failures separately from regressions. This review did not run those checks because it changed documentation only. Device verification should match the change: reading and back navigation, light/dark and font size, saved favorites/playlists after restart, playback across routes, lock-screen controls, or cold/warm deep links.

After lyric changes, regenerate the web catalog if website synchronization is part of the requested task. Preview-page regeneration also rewrites the Apple association file, so inspect that output before publishing. Do not regenerate or upload 1.3 GB of audio for ordinary UI edits.

Use `-SkipAudioUpload` for code-only Cloudflare publishing when authorized. Inspect the actual configured audio base; generated preview pages currently hardcode their own R2 address. A successful source check is not proof of deployed URLs, store acceptance, or phone behavior.

## Official references checked

- [Expo: runtime compatibility](https://docs.expo.dev/eas-update/runtime-versions/)
- [Expo: downloading and applying updates](https://docs.expo.dev/eas-update/download-updates/)
- [Expo: iOS Universal Links](https://docs.expo.dev/linking/ios-universal-links/)

## Reusable Codex skill

The personal skill `ebp-app-editing` is installed under `C:/Users/isaac/.codex/skills/ebp-app-editing/`. Invoke it as `$ebp-app-editing` when working on this app. This repository document remains available to Antigravity and other IDEs without that personal installation. Recheck live source when either guide becomes outdated.
