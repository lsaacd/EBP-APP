# Architecture

## Deployed security & auth changes — November 15, 2026

All security, Email Auth, and SecureStore changes below are **deployed live** on Cloudflare Worker (`6e056043-383c-44e6-9187-22ee9aad0c52`), D1 (`ebp-himnario-db` migration `0002_email_auth.sql`), Cloudflare Pages (`https://himnarioebp.com/account.html`, deploy `f21d7e62`), and native EAS binaries (`runtimeVersion: "2.0.0-securestore-1"`). See [SECURITY-REMEDIATION-PLAN.md](docs/guides/SECURITY-REMEDIATION-PLAN.md) and [EAS.md](EAS.md) for deployment IDs and next optional steps.

Source `2.0.0` adds `expo-secure-store` and `utils/authSessionStorage.ts`: sessions migrate from legacy AsyncStorage `@himnario_auth_session` into protected key `himnario.auth.session.v2`; session I/O is serialized. Note: existing pre-`expectedRevision` users on device who see `Sync paused` need to tap Sign Out and Sign In once to acquire a fresh revisioned session.

Worker HTTP/body/schema/rate primitives now live in `workers/ebp-auth-sync/security.js`, and email verification/recovery live in `workers/ebp-auth-sync/email-auth.js` backed by `env.EMAIL` (`cuenta@auth.himnarioebp.com`, verified on Cloudflare Email Sending for `auth.himnarioebp.com`). New sessions expire in 30 days; existing session expiry is preserved. Login reads authoritative cloud collections rather than importing arbitrary local collections. Sync writes require the last server `updatedAt` as integer `expectedRevision`; conditional SQL returns `409 sync_conflict` on stale/missing revisions. Fixed-window atomic attempt counters enforce per-IP and per-identity quotas.

## App

Expo SDK 54, React 19, React Native 0.81, Expo Router, TypeScript. Check `himnario/package.json` for versions.

| Concern | Source under himnario/ |
| --- | --- |
| Entry and native background service | `index.js`, `service.js` |
| Providers, unified `@expo-google-fonts/newsreader` + `@expo-google-fonts/public-sans` typography (`assets/fonts/ios/` removed to satisfy App Store `ITMS-91182`), Liquid Glass `AppIcon.icon`, automatic foreground OTA update check (`Updates.checkForUpdateAsync` on `AppState === 'active'`), global player, phone portrait lock (`supportsTablet: false` on iOS for iPhone-only App Store listing) | `app.json`, `app/_layout.tsx`, `assets/images/AppIcon.icon/` |
| iOS NativeTabs (32pt) / Android swipe pager + bottom navigation (28pt) | `app/(tabs)/_layout.tsx`, `components/SwipeTabsNavigator.tsx`, `components/TabPagerContext.tsx`, `components/TabSwipeWrapper.tsx`, `components/HomeTabIcon.tsx`, `components/androidBottomLayout.ts`, `assets/images/ios-tabs/tab-*.png` (32pt iOS, via `scripts/generate-ios-tab-icons.cjs`), `assets/images/tab-*.png` (28pt originals) |
| Home (`Inicio` / `Home`), iOS 26 connecting Liquid Glass header circles (`GlassContainer` + `AnimatedGlassView` metaball bridge for Search + Apple Books `ID` Profile/Menu), `AuthSheet` (unified Account + Cloud Sync + Share + Settings + Help + History sheet), `AppShareSheet` (banner + QR), burgundy leather hymnal cover card, full-bleed gradient sections, catalog, unified scroll-fade favorites & settings | `app/(tabs)/`, `components/HomeHeaderActions.tsx`, `components/AuthSheet.tsx`, `components/AppShareSheet.tsx`, `components/HomeMenuSheet.tsx`, `components/AppMenuIcon.tsx`, `components/VerseCard.tsx`, `components/AboutHymnalContent.tsx`, `assets/images/hymnal-leather-cover.jpg` |
| Optional Account & Cloud Sync (`PBKDF2-HMAC-SHA256` auth + union merge of favorites, playlists, recents & reading preferences backed by Cloudflare Worker + D1 `ebp-himnario-db`) | `context/AuthContext.tsx`, `components/AuthSheet.tsx`, `context/FavoritesContext.tsx`, `context/PlaylistsContext.tsx`, `context/RecentHymnsContext.tsx`, `workers/ebp-auth-sync/index.js`, `workers/ebp-auth-sync/schema.sql`, `workers/ebp-auth-sync/wrangler.jsonc` |
| Reader, playlist details, and feedback reporting (`expo-web-browser` quick form with Google Form prefill + `mailto:` choice) | `app/hymn/[id].tsx`, `app/playlist/[id].tsx`, `components/AndroidReaderControls.tsx`, `utils/feedback.ts` |
| Shared playback state | `context/NowPlayingContext.tsx`, `audio/native-player.ts` |
| Queue, repeat, shuffle, commands | `audio/android-playback-controller.ts` (used by the native adapter) |
| Downloads, per-hymn revision cache invalidation (`AUDIO_REVISIONS`), and offline playback | `audio/offline-audio.ts`, `data/audioRegistry.native.ts`, `components/OfflineAudioCard.tsx` (in Settings and Home menu) |
| Mini/full player (rounded-rectangle `16pt`/`18pt` radius, YouTube Music-style 3-slot horizontal track swipe, tap + swipe-up to expand, drag-down to collapse) | `components/MiniPlayer.tsx`, `components/MusicPlayer.tsx`, `utils/gestureMotion.ts` (tested by `scripts/test-gesture-motion.cjs`) |
| Native surfaces / Liquid Glass | `components/GlassSurface.tsx` (`expo-glass-effect` guarded by `isLiquidGlassAvailable === true && isGlassEffectAPIAvailable === true`, fallback to `BlurView` via `expo-blur`, `stableBackdrop` frosted backing for modals/sheets, unclipped interactive `GlassView` on iOS), `components/HomeHeaderActions.tsx` (`GlassContainer` with `spacing={6}` and `gap: 12` so Search + Classic Profile circles stay separated at rest on iOS 26+ with tight `±7pt` pan resistance) |
| Sharing/PDF, projector (with crash-safe `90deg` view rotation on iOS & `ScreenOrientation` on Android), text sizing | `components/ShareSheet.tsx` (exactly 4 actions in order: Messages via `Share.share` with `imessage-brand.png` on iOS → WhatsApp with `whatsapp-brand.png` → Crear PDF → Copiar letra), `components/PdfEditor.tsx` + `utils/pdfLayout.ts` ("Preparar PDF" editor, website parity with `docs/js/pdf-export.js`), `components/ProjectorModal.tsx`, `components/TextSizeSheet.tsx` |
| Cross-platform icons / Haptics | `components/WebIcon.tsx`, `components/AppMenuIcon.tsx`, `utils/haptics.ts` (Android haptics disabled, iOS preserved) |
| Theme (with native OS appearance sync) and bilingual UI | `theme/ThemeContext.tsx`, `theme/theme.js`, `context/LanguageContext.tsx` |

Android playback works. Preserve `patches/react-native-track-player+4.1.2.patch`, applied by `patch-package` during installation, and root playback-service registration in `index.js`. The native patch includes the New Architecture event fix.

Also preserve `patches/react-native-screens+4.16.0.patch` (iOS `NativeTabs`): it applies tab-item appearances before selecting the tab, mirrors the selected tab's appearance onto `UITabBar`, and forces a relayout after mount. This fixes unselected tab labels (Himnos/Favoritos/Ajustes) rendering too low until the first tab switch. iOS `NativeTabs` uses 32pt template PNGs (`assets/images/ios-tabs/tab-{home,hymns,favorites,settings}-{outline,filled}[@2x|@3x].png`, generated by `scripts/generate-ios-tab-icons.cjs` from the `@3x` originals while leaving the 28pt root assets untouched), and Android uses 28pt icons on its custom `SwipeTabsNavigator` (`AndroidPagerTabs`), with a tight vertical title adjustment (`vertical: -2`) so every label shares one baseline right below the icons. The `home`, `favorites`, and `settings` triggers all set `overrideScrollViewContentInsetAdjustmentBehavior: false` in `app/(tabs)/_layout.tsx`, and `home.tsx`, `favorites.tsx`, and `settings.tsx` use `contentInsetAdjustmentBehavior="never"`, so neither iOS nor Android adds a second safe-area gap under the top headers. On iPad (`Platform.OS === 'ios' && Platform.isPad`), where iPadOS renders `NativeTabs` as a floating top pill instead of a bottom bar, tab screens add `ipadTopOffset = 50` to their top header/scroll inset, `miniPlayerBottom` uses `pillBottom` instead of `49 + insets.bottom`, and inner content centers at `maxWidth: 780`.

**PDF editor:** `utils/pdfLayout.ts` is a pure layout engine that ports the website's measure/fit rules (Letter portrait single page, or landscape 2-up with a dashed cut line; 4–28pt; 1–2 columns; shrinks in 0.25pt steps until the hymn fits on one page). Both the live preview (`SvgXml` from `react-native-svg`) and the exported PDF (`expo-print` HTML wrapping the same SVG) come from one plan, so the preview matches the output.

## Native dependencies (Version 1.1.0)

Version 1.1.0 includes:
- `@react-native-menu/menu` (`2.0.0`, added in iOS Build 17 and Android APK `9f2eccb4` for the native anchored Home ellipsis menu in `components/HomeHeaderActions.tsx`, guarded at runtime by `UIManager.hasViewManagerConfig('MenuView')` with automatic fallback to `components/HomeMenuSheet.tsx`; iOS `MenuAction` items pass explicit `imageColor` so Fabric/UIKit does not tint SF Symbols transparent)
- `expo-print` and `expo-sharing` (PDF export from the in-app "Preparar PDF" editor, `components/PdfEditor.tsx`, opened from `ShareSheet.tsx`)
- `expo-navigation-bar` (to hide Android system navigation on startup/resume)
- `expo-screen-orientation` (configured in `app.json` with `initialOrientation: "PORTRAIT_UP"` and `"orientation": "default"`; used on Android in `app/_layout.tsx` and `ProjectorModal.tsx`. **Critical iOS rule**: Do NOT call `ScreenOrientation.lockAsync` or `unlockAsync` on iOS, because `EXScreenOrientationRegistry` mutates its internal dictionary on a concurrent queue without `.barrier` during `OnAppEntersBackground` / `OnAppEntersForeground` and conflicts with UIKit's fullScreen `<Modal>`, causing a native crash on background/foreground resume. On iOS, `ProjectorModal.tsx` uses a pure `90deg` view transform (`useTransformLandscape` with `flex: 0, width: windowDims.height, height: windowDims.width, maxHeight: windowDims.width`)).

Adding or modifying native modules (or adding native alternate home-screen icons via `CFBundleAlternateIcons` / Android `<activity-alias>`, planned for a future native release) requires a full native build (`eas build`), not an OTA update.

## Data and storage

- Lyrics and metadata: `himnario/data/alabanzasPaginas.js`. Keep hymn IDs as strings; E-prefixed estribillos are distinct.
- Recording IDs, filenames, streaming URLs, and per-hymn cache-busting revisions (`AUDIO_REVISIONS`): `himnario/data/audioRegistry.native.ts`. Base and Android registry files re-export it; avoid circular platform imports.
- Audio base: `https://audio.himnarioebp.com/`. Recordings use `hymn_ID.m4a` (or `hymn_ID_v<rev>.m4a` locally and `?v=<rev>` remotely when `AUDIO_REVISIONS[id] > 1`); `315 A` maps to `hymn_315.m4a`. When a recording is replaced on Cloudflare R2, bump its entry in `AUDIO_REVISIONS` and publish an OTA update so `refreshOfflineAudio()` in `audio/offline-audio.ts` automatically deletes the superseded local `.m4a` file and re-downloads the updated recording.
- Local recordings in `himnario/assets/audio/` are source assets, excluded from EAS archives. Adding a local file alone does not publish it to R2 or register it.
- Saved recordings use iOS cache storage and Android document storage. Unsaved recordings need a connection.
- Preserve AsyncStorage keys and user data (`@ebp_auth_session_v1` in `context/AuthContext.tsx` for auth token + cached user profile). Native playlists use `hymnIds`; web playlists use `ids` in `ebp-lists`.
- **Optional Cloud Sync (`workers/ebp-auth-sync/` & `context/AuthContext.tsx`)**: Signing in is 100% optional (no login wall). When signed in, local favorites, custom playlists, recent hymns, and reading preferences (`language`, `hymnLanguage`, `isDarkMode`, `fontSizeMultiplier`) are union-merged with Cloudflare D1 (`ebp-himnario-db`, ID `ed683396-bfd7-43ff-b69e-f82cf4621c55`) via `https://ebp-himnario-sync.himnario.workers.dev` and auto-synced with a `1200ms` debounce on local mutations.
- Mobile and browser favorites/playlists are independent unless synced through the mobile cloud account.

## Website and generators

`docs/` is a static website with its own browser audio player. Cloudflare Pages hosts the site; R2 serves recordings.

- `scripts/extract-hymns.js` generates `docs/data/hymns-data.js` from app data; web audio availability comes from `docs/audio/*.m4a`.
- `scripts/generate-hymn-pages.js` generates share pages and the Apple association file. Edit the generator rather than generated pages.
- The website (`docs/js/library.js`, `docs/js/legal.js`, `docs/identidad.html`, `docs/feedback.html`, and generated preview pages) defaults strictly to Light Mode on initial load (ignoring OS `prefers-color-scheme: dark`) and synchronizes both `ebp-dark` (boolean) and `ebp-theme` (`'dark'`/`'light'`) in `localStorage` when manually toggled.
- Preserve canonical `https://himnarioebp.com/hymn/ID/` URLs, existing `/himno/` aliases and reader fragment links.
- iOS association identifier: `VV6BQ35L5N.com.elbuenpastor`. Configuration alone does not prove device link handling.

## Product conventions

Both iOS and Android load open-source `Newsreader` (serif) + `Public Sans` (sans-serif) via `@expo-google-fonts/*` in `app/_layout.tsx` (`assets/fonts/ios/` Apple-proprietary `.otf`/`.ttf` copies were removed to clear App Store Connect `ITMS-91182`). Apple Books-inspired full-bleed top-to-bottom section gradients on `Inicio` (`['#1C1C1E', '#0B0B0C', '#000000']` in dark mode; `['#FFFFFF', '#F7F7FA', '#EAEAEF']` in light mode). Favorites use bookmarks. Keep detail routes outside the tab group.
