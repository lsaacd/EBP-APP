# Native builds and updates

Run native commands from `himnario/`. Configuration lives in `app.json` and `eas.json`; credentials belong outside source control.

## Configuration

- Expo account: `isaacduran`; project: `74ef3b4c-fe90-4c2c-8521-b52f4b6a5441`.
- iOS bundle: `com.elbuenpastor`; App Store Connect ID: `6794435414`.
- Provisioning Profile: `ZM5HK4A7JT` (has `Associated Domains` enabled for `applinks:himnarioebp.com`).
- Android package: `com.elbuenpastor.himnario`.
- Runtime policy: `appVersion`; current source version: 1.1.0.
- Profiles include `development`, `ios-simulator`, `preview`, `preview-arm64`, `production`. `preview-arm64` builds an Android APK; `production` produces the store build.
- Production submission config supplies the iOS App Store Connect ID (`6794435414`). Android automated submission is not configured there.

> **Caution on duplicate uploads (`ITMS-90189`):** `build-ios-testflight.ps1` (or `eas build --platform ios --profile production --auto-submit`) automatically schedules an App Store Connect submission. Do not run a second `eas submit` manually after an auto-submitted build completes, or Apple will reject it with `ITMS-90189: Redundant Binary Upload`.

## Build helpers

- `build-android-test.ps1`: Android test APK (`preview-arm64`).
- `build-android-production.ps1`: Android production build (`.aab`).
- `build-ios-testflight.ps1`: iOS build and automatic submission; also offers credential management.

Manual equivalents (from `himnario/`):

```powershell
$env:EAS_NO_VCS = '1'
$env:EAS_PROJECT_ROOT = (Get-Location).Path
eas build --platform android --profile preview-arm64
eas build --platform android --profile production
eas build --platform ios --profile production --auto-submit
```

For this Windows path, use PowerShell `-LiteralPath`. The helpers scope the EAS archive to the app with `EAS_NO_VCS` and `EAS_PROJECT_ROOT`; local uncommitted app changes are included in the archive.

## Over-The-Air (OTA) Updates (`eas update`)

EAS Update allows pushing instantaneous JavaScript, TypeScript, styling, and asset updates directly to already-installed apps on physical devices (TestFlight, iOS App Store, Google Play Store, and Preview APKs) **without needing a new app store review, binary upload, or 15-minute cloud build**.

### 1. Channel & Branch Architecture (`eas.json`)

EAS Update routes updates through **channels** linked to build profiles:

| Build Profile | Channel | Target Audience | Command to Update |
|---|---|---|---|
| `production` | `production` | **TestFlight**, **iOS App Store**, **Google Play Store** | `eas update --branch production --message "..."` |
| `preview` / `preview-arm64` | `preview` | **Android Test APKs**, internal device testing | `eas update --branch preview --message "..."` |
| `development` | `development` | Dev client builds (`expo-dev-client`) | `eas update --branch development --message "..."` |

> **Critical Rule for Agents:** Build profiles in `eas.json` specify an EAS Update `channel`, and that channel points to an EAS Update `branch` on Expo's servers (in this project, channel `production` → branch `production`, and channel `preview` → branch `preview`). TestFlight and store builds are on channel `production`. An update sent to `--branch preview` will **never** be seen by TestFlight users. Always verify the live channel-to-branch mapping and use `--branch production` when updating TestFlight or store users.

### 2. PowerShell Command Syntax (Windows)

Because of the monorepo folder layout and the `.git` parent directory trap, always set `$env:EAS_NO_VCS = '1'` and `$env:EAS_PROJECT_ROOT` before publishing:

```powershell
Set-Location -LiteralPath "C:\Users\isaac\Desktop\[03] IDDV EL BUEN PASTOR\[01] APP\EBP APP\himnario"
$env:EAS_NO_VCS = '1'
$env:EAS_PROJECT_ROOT = (Get-Location).Path

# Push to TestFlight and App Store:
eas update --branch production --message "Fix hymn search accent normalization"

# Push to Android Test APK users:
eas update --branch preview --message "Fix hymn search accent normalization"
```

Or run the helper script:
```powershell
.\publish-update.ps1 -Branch production -Message "Your update message"
```

### 3. Runtime Version Policy (`runtimeVersion`)

In `app.json`, `"runtimeVersion": { "policy": "appVersion" }`.
- EAS Update matches the user-facing `version` (currently `1.1.0`).
- Any device running a binary with version `1.1.0` will automatically receive updates sent for `1.1.0`.
- If you bump `version` in `app.json` (e.g. to `1.2.0`), you **must** build a new native binary; older `1.1.0` binaries will ignore `1.2.0` updates to prevent incompatibilities.

### 4. Golden Decision Matrix: `eas update` vs. `eas build`

| Modification | Can use `eas update`? | Required Action |
|---|---|---|
| Bug fix in `.tsx`, `.ts`, `.js`, or CSS styling | ✅ **YES (Instant)** | Run `eas update --branch production --message "..."` |
| Lyric, title, or category changes in `alabanzasPaginas.js` | ✅ **YES (Instant)** | Run `eas update --branch production --message "..."` |
| Layout, color, animation, or UI logic tweaks | ✅ **YES (Instant)** | Run `eas update --branch production --message "..."` |
| Updating static images/icons in `assets/` | ✅ **YES (Instant)** | Run `eas update --branch production --message "..."` |
| Installing an npm package with **native iOS/Android code** (e.g. `@react-native-menu/menu`) | 🛑 **NO** | Full native rebuild required (`eas build`) |
| Applying native patches (`patches/*.patch`) | 🛑 **NO** | Full native rebuild required (`eas build`) |
| Changing native entitlements (Associated Domains, UIBackgroundModes) | 🛑 **NO** | Full native rebuild required (`eas build`) |
| Modifying native `app.json` fields (`permissions`, `scheme`, `plugins`, `package`) | 🛑 **NO** | Full native rebuild required (`eas build`) |
| Bumping app `version` string (e.g., `1.1.0` → `1.2.0`) | 🛑 **NO** | Full native rebuild required (`eas build`) |

### 5. How Users & Testers Receive the Update

1. Run `eas update --branch production --message "..."`. The update uploads in ~30 seconds.
2. The user/tester opens the app on their phone. `expo-updates` checks EAS in the background and silently downloads the new bundle.
3. The next time the user opens the app (or force-closes and reopens), the app boots directly with the new update!

A Git commit, EAS Update, native build, store submission, and website deployment remain separate operations.

## Release status

### November 6, 2026 (Night) — Apple Books `Inicio` Redesign, iOS `New York` + `SF Pro` Fonts, Leather Hymnal Cover, Unified `Favoritos` Scroll Header & Swipeable Rounded-Rect `MiniPlayer` OTA

Published to both iOS (`production`) and Android (`preview`) on runtime `1.1.0`:
- **iOS `production` update group**: `932e18c6-dbb1-42a9-9a87-dd95302d8aff`; update `01a1b4a1-cda5-7478-b84b-3e1bbeea8ea8`.
- **Android `preview` update group**: `8f7cadb9-d816-4ebe-ba3c-1be419bdea46`; update `01a1b4a2-a344-7326-bb2d-d6e8654e8c7c`.
- **Summary of included changes**:
  - **Interactive iOS 26 Liquid Glass Header Capsule (`HomeHeaderActions.tsx`, `GlassSurface.tsx`, `AppMenuIcon.tsx`)**: Enabled `isInteractive` on `<GlassSurface>`, removed the middle divider line and outer `overflow: 'hidden'` clipping on iOS so UIKit's native fluid stretch animation renders cleanly, and increased SF Symbol weights/sizes (`magnifyingglass` `22pt`, `ellipsis` `23pt`, `weight="bold"`).
  - **Platform Typography (`app/_layout.tsx`, `assets/fonts/ios/`)**: Bundled Apple's `New York` serif (`NewYork-*.ttf`) and `SF Pro Text` (`SFProText-*.otf`) on iOS mapped to `Newsreader_*` and `PublicSans_*`, while preserving `Newsreader` + `Public Sans` on Android.
  - **Apple Books `Inicio` / `Home` Layout & Leather Hymnal Cover (`app/(tabs)/home.tsx`, `components/VerseCard.tsx`, `assets/images/hymnal-leather-cover.jpg`)**: Renamed the top header to `"Inicio"` / `"Home"`, replaced the solid burgundy pill with an Apple Books `"Continue"`-style card featuring the custom burgundy leather hymnal cover (`54×80pt`), and styled `Inicio` sections as full-bleed top-to-bottom `<LinearGradient>` bands (`['#1C1C1E', '#0B0B0C', '#000000']` in Dark Mode; `['#FFFFFF', '#F7F7FA', '#EAEAEF']` in Light Mode).
  - **Unified `Favoritos` Scroll-Fade Header (`app/(tabs)/favorites.tsx`)**: Unified Android and iOS on the shared `Animated.ScrollView` + `scrollY` fade-out and upward slide header, fixing Android's non-collapsing header and sub-tab overlap.
  - **Swipeable Rounded-Rectangle `MiniPlayer` (`components/MiniPlayer.tsx`, `components/MusicPlayer.tsx`)**: Changed `MiniPlayer` from a `100pt` stadium pill to a clean rounded rectangle (`borderRadius: 16` on iOS, `18` on Android, matching `MusicPlayer` collapse interpolation) and added a `Gesture.Pan().activeOffsetY(-8)` upward swipe gesture in addition to tap to expand the full `MusicPlayer`.

### November 6, 2026 — Authorized Platform Polish OTA (iOS `production` & Android `preview`)

Published after Isaac authorized OTA testing for the latest visual fixes (explicit iOS native-menu SF Symbol colors, iOS-only 32pt tab assets, iOS glass pill mini-player, and Android dark mini-player website gradient `linear-gradient(155deg, #2b2b2b, #171717 70%)`). Live checks confirmed iOS build 17 (`fc6d5e27`) finished on `production`/runtime `1.1.0` and Android APK (`9f2eccb4`) finished on `preview`/runtime `1.1.0`; channels point to their same-named branches.

- **Android `preview` update group**: `afa55c01-fafa-4e65-8d75-08bcfe2dd478`; update `01a1b2e0-833d-712d-a64a-80f12fdc8660`.
- **iOS `production` update group**: `e7e7584d-f5c5-4626-aa57-ee480ffe49e5`; update `01a1b2e1-2d3b-73ef-94a2-101b518e1302`.
- Both fresh platform exports and EAS publications succeeded. Android uploaded 1 asset, iOS 25, each reusing 102 existing assets. No audio catalog re-upload, native rebuild, store submission, Git commit or website deployment.
- iOS `production` also targets compatible App Store installations. Runtime matching (`1.1.0`) is not proof of native module equivalence across older `1.1.0` binaries (though `HomeHeaderActions.tsx` guards `MenuView` with `UIManager.hasViewManagerConfig('MenuView')` and `GlassSurface.tsx` guards `ExpoGlassEffect` so pre-Build-17 binaries safely fall back). Actual phone launch, menu symbols, tab sizing and mini-player glass/gradient still require device verification. See `docs/guides/APP-EDITING-ANALYSIS.md` for changed files and device checklist.

### November 5, 2026 (Night) — Native Menu (`@react-native-menu/menu`), Full-Res Cover, Stable Seek & Index Scrubbing Rebuild

Includes the joined Home header capsule (`HomeHeaderActions.tsx`), native `@react-native-menu/menu` (`2.0.0`) module, full-resolution cover decoding (`MusicPlayer.tsx`), stable seek slider (`ProgressSection`), and `requestAnimationFrame` catalog/index scrubbing (`hymns.tsx`).

- **Android `preview-arm64` (APK)**: [build 9f2eccb4](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/9f2eccb4-3f95-423f-b88a-0a8ccc2c4860) · [Download APK](https://expo.dev/artifacts/eas/qgaKiHjywocNarS-cS4MRiBbDPuziLy3j7ARC0GRobM.apk)
- **iOS `production`, build 17**: [build fc6d5e27](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/fc6d5e27-d1f7-44ac-b4ef-0ac8b3dd95e1) · [IPA](https://expo.dev/artifacts/eas/CitxrsGsa1FQ_DztuzAoqkQzHAggqFkYrAcmOgjXMZU.ipa)
- **TestFlight Auto-Submission**: [submission ba7d443f](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/ba7d443f-f1e8-4900-a250-7f926e67e8e2) (`FINISHED`; automatically queued—do not submit manually).

### November 5, 2026 (Evening) — Regression Repair Rebuild (Restored iOS NativeTabs, Frosted Surfaces & Brand Logos)

Restored iOS `NativeTabs` glass bar (keeping custom swipe pager Android-only), restored Home header fade, added `stableBackdrop` frosted backing, fixed full-player cover scaling, and rendered original-color green iMessage/WhatsApp PNGs.

- **Android `preview-arm64` (APK)**: [build 4d3297e8](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/4d3297e8-6d31-4b63-b003-3445e076cf2f) · [Download APK](https://expo.dev/artifacts/eas/Oxl_-oO0QDR-z5k2mZndPrxFYJjwMsPHgn6uKZMueAk.apk)
- **iOS `production`, build 16**: [build de9dc116](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/de9dc116-c333-481e-b15a-52f8c2e969bc) (auto-submitted to TestFlight).

### November 5, 2026 — full rebuilds requested after OTA testing release

Isaac explicitly requested new binaries, not only OTA updates. Both archives include the local Home menu, Settings scroll fade, native sharing and interactive tab/player gesture changes. Source remains version 1.1.0; no new dependency changes were introduced in this iteration. The November 2 builds already introduced the four native modules described above.

- Android `preview-arm64`: [build dc086d80](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/dc086d80-0fb3-4343-9c20-7f9f570c3da6), full APK rebuild.
- iOS `production`, build **15**: [build 462818a5](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/462818a5-0f60-42d7-84f7-67fe6380be3c).
- Automatic TestFlight submission: [bc5adfa3](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/bc5adfa3-b2c1-46a5-be7d-ac18e37a2357). Do not submit this binary again manually.
- Both native builds finished successfully. iOS automatic submission also returned `FINISHED` with no error; Apple may still process the build before displaying it in TestFlight. [Download the Android APK](https://expo.dev/artifacts/eas/IY5XSJkmFSJF_HSmGwY_VFsnKxE6qIPOwKYBrWrUdko.apk). EAS reported 97% of included build credits used at launch and pay-as-you-go billing beyond allowance.


### Latest builds — November 2, 2026 (Pacific, Round 3)

| Target | Result | Reference |
| --- | --- | --- |
| Android 1.1.0 (`preview-arm64`, build `5`) | `FINISHED` | [EAS build](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/4ca994b5-54e5-4330-a40c-2e0fa8937bf8) · [APK](https://expo.dev/artifacts/eas/iG-U4stwTugrJRUaelf4Aa1SsihSXAhyUo_6AByOd5k.apk) |
| iOS 1.1.0 (build `14`, `production`) | `FINISHED` / TestFlight auto-submitted | [EAS build](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/cba76d98-6f9f-459d-bca0-61c20996f612) · [IPA](https://expo.dev/artifacts/eas/1k4LoFGmO6wMcoNEZK7eb-I1Kys8EjIbUu_BEzotzQs.ipa) · [Submission](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/3e954b64-b36e-4533-b352-742f742ba427) |

### Latest builds — November 2–3, 2026 (Pacific, Round 3)

| Target | Result | Reference |
| --- | --- | --- |
| Android 1.1.0 (`preview-arm64`, build `5`) | Finished | [EAS build](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/4ca994b5-54e5-4330-a40c-2e0fa8937bf8) |
| iOS 1.1.0 (build `14`, `production`) | Finished | [EAS build](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/cba76d98-6f9f-459d-bca0-61c20996f612) · [Submission](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/d88be2ff-8533-4f93-bc42-df8e16ea7731) |

### Previous builds — November 2, 2026 (Pacific, Round 2)

| Target | Result | Reference |
| --- | --- | --- |
| Android 1.1.0 (`preview-arm64`, build `4`) | Finished | [EAS build](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/e0211458-bc25-455c-961c-0507edd9093f) |
| iOS 1.1.0 (build `13`, `production`) | Finished | [EAS build](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/92e3039c-c959-473d-9807-141f81091617) · [Submission](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/e94f0640-0fcd-40b9-bf81-97eb55e6b3a5) |

### Previous completed builds — November 2, 2026 (Pacific, Round 1)

| Target | Result | Reference |
| --- | --- | --- |
| Android 1.1.0 (`preview-arm64`, build `3`) | `FINISHED` | [EAS build](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/a9fe3ee0-e392-4308-b1b7-facc67642d26) · [APK](https://expo.dev/artifacts/eas/Tgs7Qxp1rI4AhU-h2QF7Xploi-suzaMcS6cZg6HoJE4.apk) |
| iOS 1.1.0 (build `12`, `production`) | `FINISHED` | [EAS build](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/0a349cae-f337-422b-97cd-4f301c76b746) · [IPA](https://expo.dev/artifacts/eas/Kqi0_hD61H4x-cY2ilQbPzFs26O4j9t4Y27AviAuDVU.ipa) · [Submission](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/9b46eb51-7535-48b7-98b4-4f2ef23d629c) |

### What changed in the November 2, 2026 builds

1. **Bottom Navigation Bar (`himnario/app/(tabs)/_layout.tsx`, `himnario/components/HomeTabIcon.tsx`, `himnario/assets/images/tab-home-*.png`, `himnario/theme/ThemeContext.tsx`)**:
   - Replaced the Home (`Inicio`) tab icon on both iOS (`NativeTabs` bottom-aligned template PNGs `@1x`/`@2x`/`@3x`) and Android (`HomeTabIcon` SVG) with the custom rounded house with an arched doorway.
   - Fixed initial iOS tab label dropping by unifying `sharedTriggerOptions` with native bold typography (`fontWeight: '700'`, `fontSize: 11`) and negative vertical title position adjustment (`vertical: -3.5`).
   - Styled Android bottom bar in the clean Hallow app style (`PublicSans_700Bold`, `11.5px`, positioned tightly `1px` underneath the icons).
   - Synced native OS appearance so nav bars switch cleanly between dark and light mode.
2. **Apple Books-style Home Header & Larger Glassmorphic Search Button (`himnario/app/(tabs)/home.tsx`)**:
   - Left-aligned bold serif **`Himnario`** title with smooth scroll fade-out.
   - Enlarged top-right glassmorphic search button (`50×50`, `borderRadius: 25`, `26px` icon).
3. **Instagram-Style Horizontal Tab Swiping (`himnario/components/TabSwipeWrapper.tsx`)**:
   - Swiping left/right transitions smoothly between `Inicio` ↔ `Himnos` ↔ `Favoritos` ↔ `Ajustes`.
4. **Android Projector Modal Toolbar Overflow Fix (`himnario/components/ProjectorModal.tsx`)**:
   - Compacted font-size stepper and utility button layout so all buttons (including fullscreen on the far right) fit cleanly within Android screens.
5. **Cleaned Up Search & Filter Chips (`himnario/app/(tabs)/hymns.tsx`)**:
   - Removed `Todo / Título / Letra / #` scope chips and `Con audio` filter, leaving only the category chips and results count pill.
6. **`Himnos | Coritos` Switch in `Índice` (`himnario/app/(tabs)/hymns.tsx`)**:
   - Segmented toggle at the top of Índice switches both the alphabetical index list and the right A–Z scrollbar between Hymns and Choruses.
7. **Lyric Fixes (`himnario/data/alabanzasPaginas.js`, `docs/data/hymns-data.js`, `docs/hymn/`)**:
   - Fixed lowercase singular `"dios"` references in Hymns 6, 204, 222, 248, 249, and the Chorus of Hymn 409.

See [Google Play status](docs/guides/GOOGLE-PLAY-RELEASE-PLAN.md) and the [project overview](README.md).
