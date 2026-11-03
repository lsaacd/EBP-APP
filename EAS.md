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

## Updates versus builds

JS/styles can use EAS Update only when compatible with the installed native binary. Native packages, patches, entitlements and permissions require a new native build and runtime compatibility review. Version 1.1.0 added `expo-print`, `expo-sharing`, `expo-navigation-bar`, and `expo-screen-orientation` (introduced in the November 2, 2026 builds below), which require native builds rather than OTA updates on older binaries.

A Git commit, EAS Update, native build, store submission and website deployment are separate operations.

## Release status

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
