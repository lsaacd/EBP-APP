# Himnario El Buen Pastor

Mobile app in `himnario/`; companion website in `docs/`.

## Status — November 6, 2026

- **Android playback**: Fixed and working, including notification controls (confirmed by Isaac). The release is actively in the 14-day Google Play closed testing period.
- **Latest Native Builds & November 6 OTA Releases**:
  - **iOS 1.1.0 (Build 17 — `fc6d5e27`) + Production OTA**: Built and auto-submitted to App Store Connect for TestFlight (`ba7d443f`), followed by the November 6 OTA updates on channel `production`.
  - **Android 1.1.0 (`preview-arm64` APK — `9f2eccb4`) + Preview OTA**: Built ([Download APK](https://expo.dev/artifacts/eas/qgaKiHjywocNarS-cS4MRiBbDPuziLy3j7ARC0GRobM.apk)), followed by the November 6 OTA updates on channel `preview`. See [EAS.md](EAS.md) for all build and OTA links (including builds 14, 15, 16, and 17).
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
