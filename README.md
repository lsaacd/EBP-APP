# Himnario El Buen Pastor

Mobile app in `himnario/`; companion website in `docs/`.

## Status — November 14, 2026

- **November 12–14, 2026 — YouTube Music Horizontal Track Swipe in `MiniPlayer`, iOS 26 Liquid Glass Lifecycle & Optical Centering, Quick Web Feedback Form Prefill, 3D Leather Web Covers, AppShareSheet & Hymn 429 Lyric Fix**:
  - **YouTube Music-Style Horizontal Track-Swipe in `MiniPlayer` (`MiniPlayer.tsx`, `gestureMotion.ts`, `scripts/test-gesture-motion.cjs`)**: Swiping left or right with your thumb on the `MiniPlayer` scrubs a 120Hz 3-slot horizontal track carousel (`[Previous Hymn, Current Hymn, Next Hymn]`) inside the stationary `GlassSurface` capsule while keeping `Prev / Play-Pause / Next` controls anchored on the right. Commits `skipNext()` (swipe left) or `skipPrev()` (swipe right) past `28%` width or `520pt/s` flick velocity, rubber-bands at non-wrapping boundaries, and preserves vertical swipe-up and tap to expand the full-screen `MusicPlayer`.
  - **iOS 26 Liquid Glass Lifecycle & Scroll-Fade Refresh (`GlassSurface.tsx`, `home.tsx`, `HomeHeaderActions.tsx`)**: `GlassSurface` remounts `GlassView` after `@react-navigation/native` `blur` → `focus` transitions and `AppState` `'active'` foregrounding, and `home.tsx` increments `headerGlassEpoch` when scrolling back into the top header range (`contentOffset.y < 35`) so the header glass circle and capsule never lose their native glass shader.
  - **WWDC25 Optical Centering & Header Action Capsule (`HomeHeaderActions.tsx`, `AppMenuIcon.tsx`, `AppShareSheet.tsx`)**: Top-right `Inicio` header features a `44×44pt` Share App glass circle (`square.and.arrow.up` / `share`, opening `AppShareSheet` with banner, QR code & `/app/` smart link) beside an `84×44pt` joined Search + Menu glass capsule (`two 42×44pt buttons`), with WWDC25 optical centering offsets on iOS (`translateY: -1` on share, `translateX: +1` on search, `translateX: -1` on menu) and 120Hz Reanimated UI-thread swipe-down sheet dismissal (`AppShareSheet`, `ShareSheet`, `HomeMenuSheet`).
  - **`Favoritos` Sub-Tab Single-Line Fit (`favorites.tsx`)**: Added `numberOfLines={1}`, `adjustsFontSizeToFit`, and `minimumFontScale={0.8}` to `Mis Favoritos | Listas de Reproducción` sub-tab labels.
  - **Quick Web Feedback Form & Auto-Prefill (`utils/feedback.ts`, `HomeMenuSheet.tsx`, `LanguageContext.tsx`, `docs/feedback.html`)**: Reporting an error prompts users to choose **"Formulario rápido (Recomendado)"** (opens `https://himnarioebp.com/feedback.html?form=audio&hymn=...&title=...` in `expo-web-browser` with Google Form field `entry.323314423` prefilled, requiring no email app setup) or **"Enviar por correo electrónico"** (`mailto:` with automatic web-form fallback).
  - **Website 3D Leather Hymnal Covers & Full-Res App Store Mockups (`docs/index.html`, `docs/js/library.js`, `docs/images/branding/hymnal-leather-cover*.jpg`, `docs/mockups/*.jpg`)**: Added 3D burgundy leather cover for Light Mode and black leather & silver foil cover for Dark Mode on the website, updated full-resolution App Store mockups, and refined mobile web CSS (`catalog.css`, `reading-player.css`, `refinements.css`, `sharing.css`).
  - **Hymn 429 Lyric Fix (`himnario/data/alabanzasPaginas.js`, `docs/`)**: Removed the duplicate leading `"Salmos 100:1-5"` line from Hymn 429 (`Cantad Alegres A Dios`, already in `reference: 'Salmos 100:1-5'`) so Stanza 1 begins with `"Cantad alegres a Dios,"`, and regenerated `docs/data/hymns-data.js`, `docs/hymn/429/index.html`, and `docs/himno/429/index.html`.
- **iOS App Store v1.1.0 (Build 19 — `c3693e64`) Approved & Live**:
  - **Version `1.1.0` (Build 19)** with the new Liquid Glass `AppIcon.icon` (`supportsTablet: false` so iPhone-only screenshots are used on App Store Connect) was approved by Apple and is **live on the iOS App Store** (`1d1da2e0`).
  - **Latest Production OTA (`9778957d-6545-4d72-b8d7-393e734f92ec` on runtime `1.1.0`)**: Published to both iOS and Android (`production` branch), including:
    1. **Automatic Foreground OTA Updates (`app/_layout.tsx`)**: Checks, downloads, and applies new EAS OTA updates whenever the app opens or resumes to the foreground (`AppState === 'active'`), safely skipping reload if hymn audio is actively playing (`isPlaying`).
    2. **Presentation Mode (`ProjectorModal.tsx`) Crash & Landscape Fix**: Removed `expo-screen-orientation` native lock/unlock calls on iOS (which caused an `EXScreenOrientationRegistry` thread-safety crash on background/foreground transitions while a fullScreen `<Modal>` was mounted) and switched iOS manual landscape rotation to a pure `90deg` view transform (`useTransformLandscape`) with `flex: 0, width: windowDims.height, height: windowDims.width, maxHeight: windowDims.width` so the top `Salir` bar, auto-sized lyrics, and bottom controls bar stay 100% inside the phone viewport.
    3. **Centered Single-Line Report Error Footer Link (`app/hymn/[id].tsx`)**: `footerReportBtn` and `footerReportText` use `numberOfLines={1}`, `adjustsFontSizeToFit`, and `minimumFontScale={0.82}` so `"¿Encontraste un error? Reportar por correo"` never wraps awkwardly.
    4. **Hymn 198 Chorus Lyric Fix (`data/alabanzasPaginas.js`, `docs/`)**: Corrected `"Estaba esparcid"` → `"Estaba esparcido"` across the app and all generated static web pages.
    5. **Per-Hymn Offline Audio Cache Invalidation (`data/audioRegistry.native.ts`, `audio/offline-audio.ts`)**: Added `AUDIO_REVISIONS` (`getHymnAudioRevision(id)`) so bumping a hymn's revision number automatically deletes its superseded local `.m4a` file and re-downloads the updated recording (`?v=<rev>`) on devices that already saved it offline.
- **Android playback**: Fixed and working, including notification controls (confirmed by Isaac). The release is actively in the 14-day Google Play closed testing period.
- **Latest Native Builds & OTA Releases**:
  - **iOS 1.1.0 (Build 19 — `c3693e64`) + Production OTA (`9778957d`)**: Approved on the App Store (`1d1da2e0`), running the November 8 `production` OTA update.
  - **Android 1.1.0 (`preview-arm64` APK — `9f2eccb4`) + Preview/Production OTA**: Built ([Download APK](https://expo.dev/artifacts/eas/qgaKiHjywocNarS-cS4MRiBbDPuziLy3j7ARC0GRobM.apk)). See [EAS.md](EAS.md) for all build and OTA links (including builds 14–19).
- **Apple Books-Inspired `Inicio` (`Home`) Redesign, iOS `New York` + `SF Pro` Fonts & Interactive Liquid Glass Capsule (`home.tsx`, `VerseCard.tsx`, `HomeHeaderActions.tsx`, `GlassSurface.tsx`, `_layout.tsx`)**:
  - **Header Alignment & Title**: Top-left header displays **`Inicio`** (`"Home"` in English) positioned tightly below the status bar (`paddingTop: insets.top + 8`), baseline-aligned with the top-right action capsule.
  - **Interactive iOS 26 Liquid Glass Capsule**: Uses native `isInteractive` on `<GlassSurface>` without a middle divider or outer overflow clip on iOS so UIKit's native fluid press/drag stretch works across the joined capsule, with bold SF Symbols (`magnifyingglass` `22pt`, `ellipsis` `23pt`, `weight="bold"`). Android retains its native tonal capsule with a center hairline divider.
  - **Platform Typography**: iOS loads Apple's `New York` serif (`assets/fonts/ios/NewYork-*.ttf`) and `SF Pro Text` (`assets/fonts/ios/SFProText-*.otf`) mapped to the app's `Newsreader_*` and `PublicSans_*` font tokens; Android keeps `Newsreader` and `Public Sans`.
  - **Burgundy Leather Hymnal Card & Full-Bleed Gradient Sections**: Replaced the solid burgundy hero pill with an Apple Books `"Continue"`-style elevated card featuring the custom burgundy leather hymnal book cover (`assets/images/hymnal-leather-cover.jpg`, `54×80pt` with 3D book shadow). Each section on `Inicio` (`VerseCard`, Identity, and Recent Hymns) sits inside a full-bleed top-to-bottom `<LinearGradient>` band (`['#1C1C1E', '#0B0B0C', '#000000']` in Dark Mode; `['#FFFFFF', '#F7F7FA', '#EAEAEF']` in Light Mode).
- **Unified Scroll-Fade Headers Across `Inicio`, `Favoritos` & `Ajustes` (`home.tsx`, `favorites.tsx`, `settings.tsx`)**:
  - Unified `favorites.tsx` on Android and iOS to use the same shared `Animated.ScrollView` + `scrollY` fade-out and upward slide interpolation as `home.tsx` and `settings.tsx`, fixing Android's non-collapsing header and sub-tab overlap.
- **Platform-Specific Bottom Tabs, Interactive Pager & Swipeable Rounded-Rectangle MiniPlayer (`_layout.tsx`, `SwipeTabsNavigator.tsx`, `TabSwipeWrapper.tsx`, `MusicPlayer.tsx`, `MiniPlayer.tsx`)**:
  - **iOS Bottom Tabs**: Preserves the native UIKit `NativeTabs` Liquid Glass bar with enlarged **32pt** iOS-only template PNG icons (`assets/images/ios-tabs/tab-{home,hymns,favorites,settings}-{outline,filled}[@2x|@3x].png`) and coordinated `UITabBarAppearance` via `patches/react-native-screens+4.16.0.patch`.
  - **Android Bottom Tabs & Interactive Swipe Pager**: Uses the custom Reanimated + Gesture Handler horizontal swipe pager (`SwipeTabsNavigator` + `TabSwipeWrapper`) with **28pt** icons and Hallow-style bold typography (`PublicSans_700Bold`) on a 64pt edge bar.
  - **Swipeable Rounded-Rectangle MiniPlayer & Drag-to-Minimize MusicPlayer**: `MiniPlayer` uses a clean rounded-rectangle shape (`borderRadius: 16` on iOS, `18` on Android) instead of a full stadium pill, and supports **both tapping and swiping up** (`Gesture.Pan().activeOffsetY(-8)`) to expand the full-screen `MusicPlayer` (`X` stops/clears playback; chevron/drag-down minimizes).
- **Share Sheet & Interactive "Preparar PDF" Editor (`ShareSheet.tsx`, `PdfEditor.tsx`, `pdfLayout.ts`)**:
  - Features four actions in order: **1. Messages** (`Share.share` with `imessage-brand.png` on iOS), **2. WhatsApp** (`whatsapp-brand.png`), **3. Crear PDF** (opens the interactive **Preparar PDF** modal with Letter portrait / 2-up landscape, font stepper, 1–2 columns, and live SVG preview), **4. Copiar letra**.
- **Google Play Website Integration, Default Light Mode & Cloudflare Deployment**:
  - The website (`https://himnarioebp.com/`) features a 2-step onboarding flow for Google Play closed testing (`https://groups.google.com/g/himnario-app-testers` → `https://play.google.com/apps/testing/com.elbuenpastor.himnario`) and opens strictly in **Light Mode by default** across all pages and all 761 static hymn preview pages.
- **For Antigravity, Claude, and Codex**: Read the [app editing handoff](docs/guides/APP-EDITING-ANALYSIS.md) before changing the UI. Preserve all November 2–6 UI/UX decisions documented there.

## Development

From `himnario/`, run `npm ci`, then `npx expo start`. Native playback requires a development or release build, rather than Expo Go.

For a website preview, run from the repository root:

```sh
python -m http.server 8765 --bind 127.0.0.1 --directory docs
```

## Guides

- [Architecture and data](ARCHITECTURE.md)
- [App editing](docs/guides/APP-EDITING-ANALYSIS.md)
- [Native builds and updates](EAS.md)
- [Google Play status](docs/guides/GOOGLE-PLAY-RELEASE-PLAN.md)
- [Website maintenance](docs/README.md)
- [Website deployment](docs/guides/CLOUDFLARE-DEPLOYMENT.md)

[Privacy](docs/privacy.html) · [Terms](docs/terms.html)
