# App editing

Use [ARCHITECTURE.md](../../ARCHITECTURE.md) for the source map, [EAS.md](../../EAS.md) for builds, and [README.md](../../README.md) for current status. These replace the old future-fixes and agent handoff plans.

## Before changing code

- Inspect Git status and current source; preserve unrelated edits. Note that active app feature work is on branch `app-web-parity` (with `main` synchronized).
- Android playback is fixed and confirmed working by Isaac. Preserve the TrackPlayer patch, native adapter and headless service.
- Build 7's iOS crash report is historical. Between November 2 and November 6, 2026, iOS builds 14 (`cba76d98`), 15 (`462818a5`), 16 (`de9dc116`), and **17 (`fc6d5e27`, auto-submitted via `ba7d443f`)** and Android `preview-arm64` APKs (`4ca994b5`, `dc086d80`, `4d3297e8`, and **`9f2eccb4`**) were built, followed by the **November 6 OTA updates** (`e7e7584d` on iOS `production`, `afa55c01` on Android `preview`); see [EAS.md](../../EAS.md) for evidence and links.
- Use PowerShell `-LiteralPath` for paths containing parentheses (`app/(tabs)`).
- Keep theme tokens, bilingual strings, separate hymn/estribillo IDs, existing storage keys and playlist shapes.
- Minimize hides the full player; stop/clear ends playback. Do not merge those behaviors.
- Check safe areas and MiniPlayer clearance when moving controls.
- Edit web generators (`scripts/extract-hymns.js` and `scripts/generate-hymn-pages.js`) when updating `himnario/data/alabanzasPaginas.js` so `docs/` stays in sync.

## Validation

From `himnario/`:

```sh
npx tsc --noEmit
npm run lint
```

From the repository root, when relevant:

```sh
node --test scripts/test-android-playback.cjs
node scripts/test-gesture-motion.cjs
node scripts/test-web-search.js
```

Distinguish existing lint issues from regressions. Native audio and screen-orientation locking require a compatible native build, not Expo Go. Validate changed behavior on the target device; mocked checks do not establish lock-screen or Universal Link behavior.

Latest checks (November 6, 2026): `npx tsc --noEmit` passes with 0 errors; scoped ESLint passes; all 16 playback/offline/search regression tests in `scripts/test-android-playback.cjs` and all 8 gesture motion tests in `scripts/test-gesture-motion.cjs` pass (24/24 total); both iOS and Android Metro/Hermes bundles export cleanly.

## November 8, 2026 — iOS App Store v1.1.0 (Build 19) Approval, Presentation Mode Crash/Landscape Fix, Auto-Foreground OTA Updates & Offline Audio Revision Cache Invalidation

**iOS 1.1.0 (Build 19 — `c3693e64`, auto-submitted via `1d1da2e0`) was approved by Apple and is live on the App Store.** Followed by **EAS Update (`9778957d-6545-4d72-b8d7-393e734f92ec`)** on `production` (runtime `1.1.0`, iOS update `01a1ba2e-5806-78fa-9614-b2d8657980d1`, Android update `01a1ba2e-5806-711d-a1b8-2ca4a8235008`).

- **`.easignore` Font Bundling Fix (`ce97111`)**: Anchored `/ios/` and `/android/` with leading slashes in `himnario/.easignore` so `assets/fonts/ios/` is never excluded during EAS cloud builds.
- **Presentation Mode (`ProjectorModal.tsx`) Crash & Landscape Viewport Fix (`a921214`, `84845e0`)**:
  - Do **not** call `ScreenOrientation.lockAsync` or `unlockAsync` on iOS (`app/_layout.tsx`, `components/ProjectorModal.tsx`). `expo-screen-orientation` mutates `EXScreenOrientationRegistry` on a concurrent queue without `.barrier` during `OnAppEntersBackground` / `OnAppEntersForeground` and conflicts with UIKit fullScreen `<Modal>`, crashing the app when backgrounded and resumed.
  - On iOS, manual landscape rotation in `ProjectorModal.tsx` uses a pure `90deg` view transform (`useTransformLandscape`) with `flex: 0, width: windowDims.height, height: windowDims.width, maxHeight: windowDims.width` on `styles.root` (`flex: 0` is mandatory so Yoga does not stretch the unrotated height to `windowDims.height` and push the top `Salir` button and bottom controls bar off-screen).
- **Centered Single-Line Report Error Footer Link (`app/hymn/[id].tsx`, `a921214`)**: `footerReportBtn` and `footerReportText` use `numberOfLines={1}`, `adjustsFontSizeToFit`, and `minimumFontScale={0.82}` so `"¿Encontraste un error? Reportar por correo"` never wraps onto two lines.
- **Hymn 198 Chorus Typo Fix (`data/alabanzasPaginas.js`, `docs/`, `a921214`)**: Corrected `"Estaba esparcid"` → `"Estaba esparcido"` in Hymn 198 and regenerated `docs/data/hymns-data.js`, `docs/himno/198/index.html`, and `docs/hymn/198/index.html`.
- **Automatic Foreground OTA Updates (`app/_layout.tsx`, `bb91e3e`)**: `ThemedStack` checks `Updates.checkForUpdateAsync()` on initial mount and whenever `AppState` transitions to `'active'`, downloading and calling `Updates.reloadAsync()` immediately unless audio is actively playing (`isPlayingRef.current === true`).
- **Per-Hymn Offline Audio Cache Invalidation (`data/audioRegistry.native.ts`, `data/audioRegistry.ts`, `audio/offline-audio.ts`, `d6c337d`)**: Added `AUDIO_REVISIONS` and `getHymnAudioRevision(id)`. Bumping a hymn's revision (e.g. `'198': 2`) appends `?v=2` to its remote URL, saves the local file as `hymn_198_v2.m4a`, deletes superseded `.m4a` files during `refreshOfflineAudio()`, and automatically re-downloads the updated recording in the background.
- **Future Feature Note (Saved for Later — Custom App Icon Switcher)**: DuckDuckGo-style home-screen icon switching (`UIApplication.shared.setAlternateIconName` on iOS / `<activity-alias>` on Android) requires a native build (`eas build`) to register alternate icon assets in `Info.plist` / `AndroidManifest.xml`. Once pre-bundled in a future native build, the Settings picker UI and icon unlocking can be updated via OTA.

## November 6, 2026 (Night) — Apple Books `Inicio` redesign, iOS `New York` + `SF Pro` fonts, burgundy leather hymnal cover, unified `Favoritos` scroll header, swipeable rounded-rect `MiniPlayer` & Cloudflare deploy

**Published via EAS Update (OTA) on November 6, 2026** targeting **iOS Build 17 (`fc6d5e27`)** on `production` (`932e18c6-dbb1-42a9-9a87-dd95302d8aff`, update `01a1b4a1-cda5-7478-b84b-3e1bbeea8ea8`) and **Android APK (`9f2eccb4`)** on `preview` (`8f7cadb9-d816-4ebe-ba3c-1be419bdea46`, update `01a1b4a2-a344-7326-bb2d-d6e8654e8c7c`), both on runtime `1.1.0`, and **deployed to Cloudflare Pages (`ebp-himnario`)** at `https://c4a0b665.ebp-himnario.pages.dev` (`https://himnarioebp.com/`).

- **Interactive iOS 26 Liquid Glass Capsule & Bold SF Symbols (`HomeHeaderActions.tsx`, `GlassSurface.tsx`, `AppMenuIcon.tsx`, `home.tsx`)**:
  - Enabled `isInteractive` on `<GlassSurface>` in `HomeHeaderActions.tsx`, removed the middle divider line and manual opacity/highlight overrides on iOS (keeping them on Android), and removed `overflow: 'hidden'` on interactive `GlassView` in `GlassSurface.tsx` so iOS 26's native fluid capsule stretch/refraction is not clipped.
  - Added `shouldIgnoreTouch` for the top header area on `TabSwipeWrapper` in `home.tsx`.
  - Increased iOS header SF Symbols to `weight="bold"` (`magnifyingglass` `22pt`, `ellipsis` `23pt`) inside `44×44pt` capsule buttons.
- **iOS `New York` + `SF Pro Text` Typography (`app/_layout.tsx`, `assets/fonts/ios/`)**:
  - Bundled Apple's official `New York` (`NewYork-Regular.ttf`, `NewYork-RegularItalic.ttf`, `NewYork-Medium.ttf`, `NewYork-Semibold.ttf`, `NewYork-Bold.ttf`, `NewYork-BoldItalic.ttf`) and `SF Pro Text` (`SFProText-Regular.otf`, `SFProText-Medium.otf`, `SFProText-Semibold.otf`, `SFProText-Bold.otf`) in `himnario/assets/fonts/ios/` and mapped them on iOS via `useFonts` to `Newsreader_*` and `PublicSans_*`. Android continues loading `@expo-google-fonts/newsreader` and `@expo-google-fonts/public-sans`.
- **Apple Books `Inicio` (`Home`) Redesign & Burgundy Leather Hymnal Cover (`app/(tabs)/home.tsx`, `components/VerseCard.tsx`, `assets/images/hymnal-leather-cover.jpg`)**:
  - Renamed top-left header title from `"Himnario"` / `"Hymn"` to **`"Inicio"`** (Spanish) and **`"Home"`** (English), positioned tightly beneath the status bar (`paddingTop: insets.top + 8`).
  - Replaced the solid burgundy hero pill with an Apple Books `"Continue"`-style elevated card (`#FFFFFF` in Light Mode with soft drop shadow and subtle border; `#1C1C1E` in Dark Mode with subtle border) displaying the custom burgundy faux-leather hymnal book cover (`assets/images/hymnal-leather-cover.jpg`, `54×80pt`, `borderRadius: 6`, realistic book shadow and spine highlight) alongside `"Explora los Himnos"`, `"Colección completa de alabanzas y coritos"`, and `"Himnario El Buen Pastor"`.
  - Styled `Inicio` sections (`VerseCard`, Identity, and Recent Hymns) as Apple Books full-bleed top-to-bottom `<LinearGradient>` bands (`['#1C1C1E', '#0B0B0C', '#000000']` in Dark Mode; `['#FFFFFF', '#F7F7FA', '#EAEAEF']` in Light Mode) separated by subtle section hairlines, with unified serif verse/quote typography on both iOS and Android.
- **Unified `Favoritos` Scroll-Fade Header (`app/(tabs)/favorites.tsx`)**:
  - Removed the legacy Android-only opaque header block (`handleScroll` + `headerH`) that failed to fade on scroll and overlapped the `"Mis Favoritos | Listas de Reproducción"` sub-tabs.
  - Unified `favorites.tsx` to use the exact same shared `Animated.ScrollView` (`paddingTop: insets.top + 64`, `contentInsetAdjustmentBehavior="never"`, `automaticallyAdjustContentInsets={false}`) + `scrollY` fade-out and upward slide `Animated.View` header as `home.tsx` and `settings.tsx`, with `theme.primary` for the active sub-tab border.
- **Swipeable Rounded-Rectangle `MiniPlayer` (`components/MiniPlayer.tsx`, `components/MusicPlayer.tsx`)**:
  - Replaced the `borderRadius: 100` stadium pill on `MiniPlayer` with a clean rounded-rectangle shape (`borderRadius: 16` on iOS, `18` on Android, matching `MusicPlayer.tsx` collapse interpolation).
  - Wrapped `MiniPlayer` in a `GestureDetector` with `Gesture.Pan().activeOffsetY(-8).failOffsetX([-24, 24])` so users can **either swipe up or tap** on the mini-player bar to expand the full-screen `MusicPlayer`.

## November 6, 2026 — platform-specific menu, 32pt iOS tabs, glass/gradient mini-player & OTA release

**Published via EAS Update (OTA) on November 6, 2026** targeting **iOS Build 17 (`fc6d5e27`)** on `production` (`e7e7584d-f5c5-4626-aa57-ee480ffe49e5`, update `01a1b2e1-2d3b-73ef-94a2-101b518e1302`) and **Android APK (`9f2eccb4`)** on `preview` (`afa55c01-fafa-4e65-8d75-08bcfe2dd478`, update `01a1b2e0-833d-712d-a64a-80f12fdc8660`), both on runtime `1.1.0`. Supersedes the opaque iOS mini-player backing and shared 28pt iOS tab asset sizing below.

- `HomeHeaderActions.tsx`: iOS native menu actions supply explicit cream/ink `imageColor` (`#FDF9F2` dark / `#24251F` light) for SF Symbols (`clock`, `questionmark.circle`, `gearshape`). The menu library's Fabric bridge encodes an omitted color as integer 0 and then applies it as an original-image tint in UIKit, making the otherwise valid symbols transparent. Android drawable names (`ic_menu_recent_history`, `ic_menu_help`, `ic_menu_preferences`) and existing treatment remain intact.
- iOS `NativeTabs` alone references `assets/images/ios-tabs/`, with 32pt transparent template PNGs at 1x/2x/3x. Regenerate using `node scripts/generate-ios-tab-icons.cjs`; it reads the existing highest-density originals (`@3x.png`). Original 28pt assets and Android 28pt icon sizes are untouched. UIKit still owns layout, selected pill and labels; no native patch or custom iOS navbar was added. Physical device QA is needed to confirm actual OS sizing/clipping.
- `MiniPlayer.tsx`: iOS opts into the existing native regular `GlassSurface` (`stableBackdrop={!ios}`), a 28pt rounded pill and subtle shadow, preserving player height, cover/control geometry and collapse endpoint. Older iOS receives the existing blur fallback. Full-screen player and reading toolbar are unchanged.
- Android dark mini-player alone overlays the website's `linear-gradient(155deg,#2b2b2b,#171717 70%)`, using measured aspect ratio for native gradient endpoints, plus its subtle border/highlight (`#ffffff12`). Android light mode retains its prior surface. Gradient overlays ignore pointer events; skip/play/full-player actions are unchanged.
- `GlassSurface.tsx`: native-glass availability now requires both installed native boolean flags (`isLiquidGlassAvailable === true && isGlassEffectAPIAvailable === true`) to be explicitly true, avoiding unsupported API use. No new dependency, config/plugin change, native patch, version bump or playback change in this batch.
- **Website Default Light Mode (`docs/js/library.js`, `docs/js/legal.js`, `docs/identidad.html`, `docs/feedback.html`, `docs/index.html`, `scripts/generate-hymn-pages.js`)**: Removed automatic fallback to OS `prefers-color-scheme: dark` across the main website, secondary pages, and all 761 regenerated static hymn preview pages (`/himno/` and `/hymn/`). The website now always opens in Light Mode by default (`<meta name="theme-color" content="#6e1619">`) unless a visitor manually toggles dark mode (`◐`), and synchronizes both `ebp-dark` and `ebp-theme` in `localStorage`. (Local in working tree; run `scripts/deploy-cloudflare.ps1 -SkipAudioUpload` when authorized to publish to Cloudflare Pages.)
- Device checklist: menu symbols in both themes; all four tab labels and selected states on narrow iPhones; glass mini-player readability over moving lyrics; player open/minimize/stop and buttons; Android dark gradient and unchanged light appearance/icon sizes. Local checks do not replace this device verification.
- Validation: TypeScript and scoped ESLint pass. Both iOS and Android local Metro/Hermes exports and EAS OTA publications completed with their bundles and all referenced assets present (129 iOS asset entries, 104 Android entries; zero missing).

## November 5, 2026 (Night) — joined Home header capsule, native platform menu (`@react-native-menu/menu`) & full native rebuilds (iOS Build 17 / Android APK `9f2eccb4`)

**Built and submitted in iOS 1.1.0 Build 17 (`fc6d5e27`, TestFlight submission `ba7d443f`) and Android `preview-arm64` APK (`9f2eccb4`).** Supersedes the two separate Home header circles documented in the earlier November 5 notes below.

- `himnario/components/HomeHeaderActions.tsx` and `himnario/package.json`: Installed `@react-native-menu/menu` (`2.0.0`) and placed the Search (`magnifyingglass` / `search`) and Menu (`ellipsis` / `more-vert`) buttons inside a single joined `GlassSurface` capsule (`borderRadius: 24`, two `46×46` buttons separated by a hairline `separator`).
- Native Menu with Safe Fallback: `UIManager.hasViewManagerConfig('MenuView')` guards `require('@react-native-menu/menu').MenuView` so web and pre-Build-17 binaries safely fall back to the custom `HomeMenuSheet` menu without crashing Fabric. On iOS, actions use inline groups (`displayInline: true`) to place a native system separator before Settings; on Android, actions render as a flat native popup menu. Selecting an item waits `400ms` (iOS) / `150ms` (Android) for native menu dismissal before opening the `HomeMenuSheet` detail modal (`about`, `help`, or `settings`).
- `himnario/app/(tabs)/home.tsx`, `himnario/components/HomeMenuSheet.tsx`, `himnario/context/LanguageContext.tsx`:
  - Shortened hero card copy to `"Explora los Himnos"` / `"EXPLORAR COLECCIÓN"` (English: `"Explore Hymns"` / `"EXPLORE COLLECTION"`) so the headline renders larger on one line.
  - English Home header title renders `"Hymn"` (`"Himnario"` in Spanish), preserving the `0–35pt` scroll fade.
  - `HomeMenuSheet` dynamically sizes its fallback menu height to content (`onContentSizeChange`), removes duplicate About/version entries from the popup Settings page, and removes the redundant icon beside `"Nombre, Lema, Fundamento y Finalidad"` on the Home doctrine card.

## November 5, 2026 — artwork, seeking and catalog scrubbing repair

Included in iOS Build 17 (`fc6d5e27`) and Android APK (`9f2eccb4`). Follows physical device feedback on iOS build 16 (`de9dc116`) and Android rebuild `4d3297e8`.

- `MusicPlayer.tsx`: bundled cover is decoded at its expanded dimensions, then transformed inside the animated crop frame. Avoid initially decoding the Image at the collapsed 40pt frame on iOS. Static artwork no longer dims or shows Cargando during audio preparation; the transport spinner still indicates audio loading. Audio continues to stream/cache through the existing offline manager, distinct from the bundled image.
- ProgressSection: native Slider value stays stable while dragging (only the timestamp changes). On release seek immediately, hold the optimistic target until native progress catches up, with a bounded fallback; guard rejected earlier seeks and clear timers. No per-event thumb resets and no fixed 150ms unlock.
- `hymns.tsx`: numbered rail coalesces move events using requestAnimationFrame; ordinary scrolling no longer fights the dragged position, and off-screen FlashList draw distance reduced from 5000 to 800. Index uses FlatList with deterministic, system-font-scale-aware row geometry and getItemLayout for exact distant jumps. Replaced 1000-character text leaders with dotted borders.
- Alphabet touch mapping excludes top/bottom padding. Uniform font size/line height (no per-letter auto-fit), stable rail backing without native interactive magnification, canceled gestures and release both fade the bubble, pending fades are stopped on re-touch, timers are cleaned on unmount.
- Existing native iOS tabs, Home compact icons/fade, menus, sharing and playback controls retained. TypeScript/scoped ESLint and native Metro export checks run locally; the 24 existing gesture/playback regression checks pass. Real phone testing is still needed for image decode sharpness, audio seek latency and rail responsiveness.

## November 5, 2026 — regression repair after device screenshots (iOS Build 16 / Android APK `4d3297e8`)

**Supersedes the custom iOS pager and persistent Home toolbar decisions below. Built into iOS Build 16 (`de9dc116`) and Android APK (`4d3297e8`); the two Home circles below were subsequently joined into a single capsule (`HomeHeaderActions.tsx`) in Build 17 (`fc6d5e27`).**

- Restored `IOSTabs` from the pre-change Git source (`HEAD` 59d475a) using Expo Router NativeTabs / UITabBarController, original template artwork and label metrics. The continuous custom pager remains Android-only. Do not replace native iOS tabs to obtain interactive adjacent-screen swiping; preserving UIKit glass takes priority. iOS tab swiping is intentionally not forced by the disabled pager wrapper.
- Home now has two compact 36pt glass circles / 44pt touch targets next to the title: search and ellipsis. Removed the full-width search bar and opaque fixed background. Restored the original 0–35pt native-driver opacity fade / 0–40pt upward movement. Hidden header disables touches, and returning to the top restores all actions.
- Fixed full-player overlay artwork by using the existing explicit 100% width/height image style and contain scaling. The previous absolute-fill Image retained intrinsic image sizing and cropped the cover. Keep parent animated geometry and explicit child image dimensions together.
- `GlassSurface.stableBackdrop` uses the blur fallback plus a strongly tinted backing for the Home menu and mini-player, so underlying text cannot compete with controls. Native glass remains for Home action circles; UIKit owns the bottom navigation again. Other platform surfaces are unchanged.
- Messages and WhatsApp use original-color PNG renders of their SVG brand assets. The iMessage source SVG now has explicit fills and a self-contained gradient; no Inkscape inherited-gradient dependency. Both themes use identical brand images without tintColor or a theme-colored badge wash. Android keeps its existing Messages symbol. Sharing still opens the system chooser.
- Preserved: menu/history/help/settings, shared About content, Settings fade, root-owned single player, X stop versus chevron/drag minimize, Android interactive paging, existing projection and PDF features.
- Validation: TypeScript, scoped ESLint, both native-platform Metro bundles and all 24 gesture/playback regressions pass. Brand PNGs visually inspected. This is not physical iOS/Android verification: check native tab glass, Home scroll fade/menu visibility, mini-player legibility, full artwork during drag and brand icons on real phones before another release. No EAS Update/build/upload performed for this repair.

## November 5, 2026 — EAS testing release

- Settings now shares the transparent, native-driver scroll fade on iOS and Android (opacity 1 to 0 over 30pt). Removed the Android direction-triggered opaque sliding app bar. Returning to the top restores the title continuously; content insets are explicit.
- Authorized EAS OTA publishing includes all preceding local Home menu, sharing and gesture work documented below. No native package/config changes and no new binaries or Git commit. Compatible installed runtime: `1.1.0`.
- Android `preview` update group: `e073a812-c577-495b-8840-c661957825be`.
- iOS `production` update group: `e1bd7e3d-1cda-43f5-b2fe-8b0e8e443a55`. This is the existing TestFlight channel and also reaches other compatible production-channel installations.
- Both EAS exports/uploads reported Published. TypeScript, scoped Settings ESLint, diff whitespace checks and all 24 gesture/playback regressions passed. Physical phone UI QA remains for Isaac.
- Testing: open the installed 1.1.0 APK/TestFlight app online, allow the update to download, then fully close and reopen. Check Settings fade in both themes, Home menu/search, interactive tab swipes, player drag/minimize versus X stop, and sharing. These are OTA updates, not new APK/IPA submissions.

## November 5, 2026 — local Home menu and help (not published)

- `himnario/app/(tabs)/home.tsx`: replaced the old 50pt search circle with a measured, persistent two-row toolbar. The serif Himnario title and compact menu share a centerline (`includeFontPadding: false` fixes Android text padding). The menu has a 36pt surface inside a 44pt touch target; the 42pt search bar underneath opens the existing Hymns search with focus. Content uses the measured toolbar height, including safe area, rather than a fixed spacer.
- `himnario/components/AppMenuIcon.tsx`: iOS SF Symbols (`ellipsis` for the Home menu), Android Material symbols (`more-vert`), no emoji. Existing `GlassSurface` uses native Liquid Glass when available, blur fallback on older iOS, and tonal Material surfaces on Android. No new native dependency.
- `himnario/components/HomeMenuSheet.tsx`: anchored, bounded Home menu with History & credits, Tips & help, and Settings. Detail pages stay inside one modal, with Back, a visible X, outside-tap dismissal and Android back handling. Settings exposes display mode, the existing `TextSizeSheet`, language, downloaded audio using the platform-specific `OfflineAudioCard`, and About. Uses the existing theme/language contexts and offline manager; does not create separate settings storage or an account/sign-in feature.
- `himnario/components/AboutHymnalContent.tsx`: extracted existing church description, current version and credits from the Settings tab. Both entry points render this shared component, including the EBP SVG. The feature list in `LanguageContext.tsx` was refreshed for the implemented audio, downloads, projection, sharing/PDF and menu/help features; the app version was not bumped.
- Tips & help is bilingual and covers search, reading, available audio, favorites/playlists, sharing/PDF, presentation, and offline preparation. Suggestions and audio contributions open `https://himnarioebp.com/feedback.html` in the system browser surface. Read-only verification returned HTTP 200 and confirmed Google Forms embeds; no form response was submitted. A browser-open failure stays visible in the help sheet.
- Local checks: TypeScript and scoped ESLint (no new errors), plus local Android/iOS Metro bundles. Existing global lint alias-import failures remain unrelated. Phone QA is still needed for actual Liquid Glass appearance and menu placement with device safe areas/large text. Previous uncommitted sharing and gesture work is preserved. Nothing was uploaded, committed or deployed.

Before release, check Home at normal and large system text sizes on both platforms; search should focus correctly, the ellipsis menu should remain anchored and scroll if needed, every detail page should support Back/X/outside dismissal, theme/language changes should affect the original Settings tab, download actions should use the same stored files, and both About entry points should show the same version and credits.

## November 5, 2026 — local gesture changes (not published)

Isaac requested interactive tab swipes and a Spotify-style full-player collapse. These changes supersede the NativeTabs navigation implementation described in the historical November 2–3 notes below. The earlier local Messages/iMessage sharing changes are preserved.

- `himnario/components/SwipeTabsNavigator.tsx` and `TabPagerContext.tsx`: Expo Router-compatible React Navigation TabRouter with four persistent adjacent scenes and one Reanimated position. Switching tabs preserves screen state and scroll positions. Navigation focus changes after a completed swipe; canceled swipes return to the original tab. Tapping tabs still emits `tabPress` (including existing scroll-to-top handlers), and Android back uses TabRouter history.
- `himnario/components/TabSwipeWrapper.tsx`: Gesture Handler manual horizontal activation, UI-thread dragging and velocity-aware spring settling. Vertical scrolling, category-strip touches, the index scrubber and Settings font-slider gestures are excluded. Inactive scenes are hidden from accessibility and cannot receive touches.
- `himnario/app/(tabs)/_layout.tsx`: the shared pager replaces both previous screen-switching paths. **iOS no longer uses the UIKit NativeTabs controller**: its existing template PNGs, 28pt icons, compact 10.5pt labels, GlassSurface and 49pt bar metrics remain. Android retains its 64pt edge bar. No native packages, SDK versions or build settings were changed. Do not restore the old touch-end-only wrapper alongside this pager.
- `himnario/components/MusicPlayer.tsx`: one transparent `overFullScreen` modal and Gesture Handler/Reanimated transition replace `pageSheet` + JS PanResponder + native slide dismissal. The artwork and sheet interpolate toward the measured mini-player frame. Short/canceled drags reopen; a long drag or downward flick minimizes without stopping audio. Upward reversal cancels dismissal. The native seek slider has its own gesture protection. Share/playlist modals disable the parent pan.
- `himnario/app/_layout.tsx` and `MiniPlayer.tsx`: root measures the compact player's real height; the transition endpoint uses the current route's bottom bar and safe area. A noninteractive preview matches the real mini-player during the transition.
- `himnario/app/hymn/[id].tsx`: removed its duplicate full-player mount. The root is the single owner; `X` still clears playback, while the down-chevron/drag only minimizes.
- `himnario/utils/gestureMotion.ts` and `scripts/test-gesture-motion.cjs`: worklet-safe release decisions and regression checks for slow drags, flicks, reversals, boundaries and platform anchor geometry.

Local validation: TypeScript passes; the 8 gesture checks and 16 playback/offline/search checks pass. Android and iOS production-mode Metro JavaScript bundles compile locally (no asset copying, EAS build or upload). Scoped ESLint has no errors; full `npm run lint` still fails with 10 alias-import resolution errors in unchanged Expo template components (`parallax-scroll-view`, `themed-text`, `themed-view`, `ui/collapsible`), plus existing warnings. These checks **do not establish native gesture feel**; physical iOS/Android QA remains required. No EAS Update, Expo upload, Git commit or Cloudflare deployment was performed for this work. The change uses already-installed native modules, so a compatible existing runtime can receive it by OTA after approval and device validation.

Device QA before release:

1. Slowly drag Home toward Hymns, hold halfway, reverse, then release. Both real screens should stay visible; a short drag returns, a longer drag completes. Repeat in both directions across all four tabs, including a fast flick and first/last-tab boundaries.
2. Scroll vertically; drag categories, the index scrubber and Settings font slider. These must keep their original behavior. Re-select a tab to verify its existing scroll-to-top behavior; navigate into a hymn and back; test Android hardware back and both themes.
3. Open audio from a hymn and from the mini-player. Drag down partway, reverse upward, and release. Then minimize fully with a longer drag/flick or the chevron. The cover should settle above the current bar without a flash; playback must continue. Repeat on the hymn and playlist routes.
4. Seek audio, use play/pause/skip/bookmark/share/playlist actions, cancel sharing, reopen, then press `X`. There should be one full-player modal, and `X` must stop/clear playback. Verify safe areas with Android gesture navigation and iPhone home indicator; verify Reduce Motion and screen-reader tab selection.

References: [Gesture Handler 2 pan gestures](https://docs.swmansion.com/react-native-gesture-handler/docs/2.x/gestures/pan-gesture/), [React Navigation custom navigators](https://reactnavigation.org/docs/custom-navigators/), and the [official Reanimated repository and examples](https://github.com/software-mansion/react-native-reanimated). Implementation uses the installed React Navigation 7 `NavigationContent` API, not the newer API shown by some current documentation.

## November 2–3, 2026 implementation handoff — historical navigation notes

These are Isaac's latest UI/UX decisions implemented on November 2–3, 2026. **Supersedes** all prior notes regarding Android tabs, Home header spacing, and website store badges:

1. **Bottom Navigation Bar (iOS & Android) — `himnario/app/(tabs)/_layout.tsx`**:
   - **Enlarged 28pt Icons**: Both iOS and Android use matching 28pt template PNG icons (`tab-{home,hymns,favorites,settings}-{outline,filled}` on iOS `NativeTabs`; `28pt` sizing on Android) — the maximum standard size for a 49pt tab bar.
   - **Label Typography & Spacing**: Display tab labels (`Inicio`, `Himnos`, `Favoritos`, `Ajustes`) using bold typography (`10.5pt`, `fontWeight: '700'`) positioned tightly beneath the icons (`vertical: -2` title adjustment), matching the compact Hallow app navigation layout.
   - **iOS Truncation & Drop Fix**: Native patch `patches/react-native-screens+4.16.0.patch` synchronizes `UITabBarAppearance` across tabs and forces an immediate layout flush on initial render, preventing unselected label drops and truncation of `"Favoritos"`.
   - **Dynamic Dark / Light Mode**: `ThemeContext.tsx` syncs `Appearance.setColorScheme(isDarkMode ? 'dark' : 'light')` and `_layout.tsx` dynamically sets `tintColor`, `iconColor`, `backgroundColor`, and `blurEffect`.

2. **`Inicio` (`himnario/app/(tabs)/home.tsx`) — Header, Glass Search & Tight Spacing**:
   - **Header Title**: Displays **`Himnario`** in bold serif (`Newsreader_700Bold`, `36px`), left-aligned with a circular `42×42` `GlassSurface` search button on the right.
   - **Eliminated Header Gap**: The initial vertical space between the `Himnario` header / search button and the `"Explora Todos Los Himnos"` card was removed by setting `contentInsetAdjustmentBehavior="never"` on `Animated.ScrollView` and `overrideScrollViewContentInsetAdjustmentBehavior: false` on the tab trigger. Do **not** remove these attributes.
   - **Simplified Feed**: Both "Continuar escuchando" and offline audio download cards were intentionally removed from `home.tsx`. Do **not** re-add them to `home.tsx`.

3. **Share Sheet & Interactive "Preparar PDF" Editor (`ShareSheet.tsx`, `PdfEditor.tsx`, `pdfLayout.ts`)**:
   - **Chronological Share Order**: The Share Sheet options strictly follow this exact 4-item list:
     1. **Messages / system sharing** (updated November 5: opens the native share menu with hymn title and canonical URL, allowing Messages, AirDrop and other installed destinations; iOS uses `assets/images/imessage.svg`, Android retains the Material SMS icon).
     2. **WhatsApp** (`wa.me/?text=...` with hymn title and canonical URL).
     3. **Create PDF** (switches into the interactive **Preparar PDF** modal).
     4. **Copiar Letra** (copies formatted hymn lyrics to clipboard).
   - **Interactive PDF Editor**: Features full parity with the companion website:
     - Format: "Una página" (Letter portrait) vs "Dos copias (cortar)" (Letter landscape 2-up with dashed cut line).
     - Stepper font size (4–28 pt).
     - Column layout (1 vs 2 columns, auto-defaulting to 2 columns for lyrics > 28 lines).
     - "Ajustar a la página" auto-fit calculation.
     - "Incluir título" header metadata toggle.
     - Live SVG preview and direct Print / Share PDF actions.

4. **Projector / Presentation Mode Orientation (`ProjectorModal.tsx`)**:
   - Unlocks physical phone rotation (`ScreenOrientation.unlockAsync()`) while projector mode is active, with a manual toolbar rotate toggle button (`MaterialIcons` `screen-rotation`).
   - Re-locks app to `PORTRAIT_UP` upon exiting projector mode.

5. **Website & Cloudflare Deployment (`docs/index.html`, `docs/js/mockups.js`, `scripts/deploy-cloudflare.ps1`)**:
   - **Google Play Link**: The placeholder *"Próximamente"* badge on the website has been replaced with an active link to the Closed Testing opt-in URL:
     `https://play.google.com/apps/testing/com.elbuenpastor.himnario`
     (Once Google approves production, this can point directly to `https://play.google.com/store/apps/details?id=com.elbuenpastor.himnario`).
   - **Live Cloudflare Release**: Successfully deployed to Cloudflare Pages (`ebp-himnario`) and live at `https://himnarioebp.com/`.
   - **Generated Preview Pages**: All 761 static hymn pages in `/himno/` and `/hymn/` use the production CDN base `https://audio.himnarioebp.com/` and the updated Apple App Site Association.
   - **Agent Tooling**: 19 Cloudflare skills installed at `~/.agents/skills` and Cloudflare Streamable HTTP MCP registered at `https://mcp.cloudflare.com/mcp`.
   - **November 7, 2026 Update (Liquid Glass Icon, iOS `Favoritos` Top Gap Fix, iPad Support & Privacy Policy)**:
     - `himnario/app.json` sets `"ios.icon": "./assets/images/AppIcon.icon"` and `"ios.supportsTablet": true`.
     - `himnario/app/(tabs)/_layout.tsx` sets `overrideScrollViewContentInsetAdjustmentBehavior: false` on `home`, `favorites`, and `settings` `NativeTabs.Trigger` items so iOS never adds a double safe-area gap.
     - On iPad (`Platform.OS === 'ios' && Platform.isPad`), orientation is unlocked, tab screens add `ipadTopOffset = 50` for the iPadOS floating top tab bar, `miniPlayerBottom` uses `pillBottom`, and inner content is centered with `maxWidth: 780`.
