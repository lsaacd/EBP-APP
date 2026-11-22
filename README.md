# Himnario El Buen Pastor

## November 22, 2026 (evening) — Current Production State (`2.0.0`, `runtimeVersion: "2.0.0-media-3"`, iOS Build 31)

This block is the current state; the Build 30 block below describes the morning of the same day.

- **iOS Build #31** ([`2105a538`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/2105a538-0d18-4d29-83f6-a922c35ac656)) is on TestFlight, and OTA `d351bb27-fd01-46bb-b304-393d7258d8a6` is live for Builds 30 and 31.
- **Churches screen redesigned:** map with Liquid Glass controls, one bottom sheet that rises on search / Lista / pin tap, per-day service times, city-only church names, `SDD` leader title, unlink, and a location-first submission form with a schedule picker.
- **Native system fonts** on both platforms (`himnario/theme/fonts.ts`); 337 inline strings moved into the string table; about 2,000 lines of dead code removed; CI added (`.github/workflows/ci.yml`).
- **Look Around** opens Apple's screen directly (Build 31 only).
- **Deferred:** Expo SDK 54 → 58 for Apple's Xcode 27 requirement (April 2027). See [docs/guides/SDK-58-UPGRADE-PLAN.md](docs/guides/SDK-58-UPGRADE-PLAN.md).
- **Validation:** type check clean; all 11 Node test suites (151 tests) pass.
- **Agent handoff (Claude, Codex, Antigravity):** read [AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md) before editing, and pull first.

---

## November 22, 2026 — Current Production State (`2.0.0`, `runtimeVersion: "2.0.0-media-3"`, iOS Build 30)

All November 22 features, backend migrations (`0003`–`0008`), Cloudflare Worker & Pages updates, and a **full EAS iOS production native rebuild (Build #30)** are live / uploaded to App Store Connect / TestFlight:

- **iOS Native Production Build #30 (`runtimeVersion: "2.0.0-media-3"`):** EAS Build [`b6501dac-6ab5-4a5f-86e1-1740ce1036d3`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/b6501dac-6ab5-4a5f-86e1-1740ce1036d3) · App Store Connect auto-submission [`8a54ce14-8c49-4b9f-a352-20a9306cc064`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/8a54ce14-8c49-4b9f-a352-20a9306cc064). Includes new native modules `expo-camera`, `expo-image-picker`, `expo-image-manipulator`, and custom local Swift module `himnario/modules/apple-look-around` (`MKLookAroundViewController`).
- **Cloudflare Worker & D1 (`ebp-himnario-sync`):** Deployed version `3e08460e-b5b5-4f99-97f1-eaa8bac1365b` with `env.MEDIA_BUCKET` (`ebp-himnario-audio`) R2 binding and D1 migrations `0003`–`0008` applied on `ebp-himnario-db`. First verified congregation seeded live: **IDDV El Buen Pastor — Riverbank** (`3109 Santa Fe St, Riverbank, CA 95367`, `Co-Pastor Azael Tapia`, two optimized photos on R2).
- **Cloudflare Pages (`himnarioebp.com`):** Deployed `972eec98.ebp-himnario.pages.dev` with updated anonymous bilingual [privacy.html](docs/privacy.html) and [terms.html](docs/terms.html) (personal name removed; Camera, Photo Library, Location, R2 photo moderation, QR codes, and comment sorting/visibility disclosed).
- **Key Features Shipped (Nov 20–22):**
  1. **True Native In-App Apple Maps Look Around (iOS 16+) + Android Google Street View** on verified church cards (`himnario/modules/apple-look-around/`, `himnario/app/churches.tsx`).
  2. **Custom Cross-Free Sanctuary Map Pins** (`church-pin*.png`, `church-pin-selected*.png`) + viewport pin clustering (`utils/churchMapUtils.ts`) + Riverbank church seeded live.
  3. **Multi-Photo Camera & Gallery Uploader + Admin Photo Manager:** Max **5 photos** for user church submissions, max **10 photos** for Admin (`POST /churches/photos/upload` with magic-byte check, client-side resize/EXIF-strip, swipeable carousel + fullscreen viewer, `★ Portada` cover selection, `✕` deletion, and automatic R2 cleanup on rejection/deletion).
  4. **In-App QR Code Scanner (`expo-camera`) & Church QR Share Modal** for hymn & church deep links.
  5. **Unified "Mi iglesia" & "Iglesias (Mapa)" + Cloud Profile Sync (`users.church_id`):** Tapping **"Vincular mi iglesia"** syncs `churchId`, `churchName`, and `location` to cloud profile and shows **"✓ Tu iglesia"**.
  6. **YouTube Music-Style Comments Sheet (`VerseDiscussionSheet.tsx`):** Full-sheet swipe-down from anywhere when scrolled to top, `(i)` info button, `Destacados (Top)` vs `Más recientes (Newest)` sorting (`?sort=top|newest`), and church-adapted respectful Community Guidelines banner linking to `https://himnarioebp.com/terms.html#community`.
  7. **Audio End-of-Track Freeze Deadlock & 24 App-Wide Stability Fixes + Sync Conflict Resolution (`resolveSyncConflict`)**.
- **Android Status:** Android still needs a fresh `preview-arm64` / `production` native rebuild on `2.0.0-media-3` to pick up `react-native-maps`, `expo-location`, `expo-camera`, `expo-image-picker`, and `expo-image-manipulator`.
- **Validation:** `npx --prefix himnario tsc -p himnario/tsconfig.json --noEmit` (0 errors) and all 10 Node test suites (`scripts/test-*.cjs`, 143 tests) pass.
- **Claude / Codex Handoff:** Read [CLAUDE.md](CLAUDE.md), [AGENTS.md](AGENTS.md), [APP-EDITING-ANALYSIS.md](docs/guides/APP-EDITING-ANALYSIS.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [EAS.md](EAS.md) before editing.

---

### Historical Notes (Pre-November 22, 2026)

## Local verse chat fixes — November 20, 2026 (Now Shipped in Build 30)

Keyboard-visible first taps, emoji/self-reply submission, failed-send recovery, pending reply IDs and rapid heart toggles are fixed locally. **115 tests and TypeScript pass.** No OTA, rebuild or deployment was performed for this follow-up; the last published update remains `6d52ccb1-13d5-4cb7-a1c9-022c3701bf9a`. Source version/runtime stay **2.0.0 / 2.0.0-maps-2**. See [the app editing handoff](docs/guides/APP-EDITING-ANALYSIS.md) for causes, safeguards and device checks.


## November 20, 2026 — Current iOS release

Finished Antigravity's verse PNG-sharing/My Church handoff and published verified **iOS production OTA `6d52ccb1-13d5-4cb7-a1c9-022c3701bf9a`**, runtime **2.0.0-maps-2**, for compatible **iOS build 29**. Version remains **2.0.0**. Added SVG asset-readiness checks, image-only iOS sharing, and form accessibility; TypeScript and 101 tests passed. The Android preview APK remains on `2.0.0-securestore-1` and cannot receive this maps-runtime update. No rebuild or backend/website deployment was performed in this turn. See [release evidence](EAS.md) for details; older entries below are historical.


## Local community implementation — November 17, 2026

Verse-of-the-Day discussions, profiles, sole-admin moderation, choir repertoire, prepared backgrounds, player overlay/navigation fixes and bilingual legal drafts are implemented locally. **No deployment, OTA, native rebuild or store submission was made for this work.** Version remains **2.0.0**, runtime **2.0.0-securestore-1**; no native dependencies changed. See the [implementation and release handoff](docs/guides/VERSE-COMMUNITY-HANDOFF.md) for schema migration 0003, safeguards, validation and release order. Earlier live-state notes below are historical and do not describe this unreleased work.


Mobile app in `himnario/`; companion website in `docs/`.

**Latest Production & Security State — November 15, 2026 (`2.0.0`, `runtimeVersion: "2.0.0-securestore-1"`):**
- **Backend & Email Auth Live (Cloudflare):** D1 migration `0002_email_auth.sql` applied on `ebp-himnario-db`; `auth.himnarioebp.com` Email Sending active (`Enabled`, MX/SPF/DKIM/DMARC verified); hardened Worker `ebp-himnario-sync` (`6e056043-383c-44e6-9187-22ee9aad0c52`) deployed with `env.EMAIL` binding (`cuenta@auth.himnarioebp.com`), `expectedRevision` optimistic sync concurrency (`409 sync_conflict`), atomic `security.js` rate limits, and token-based recovery/verification via `https://himnarioebp.com/account.html` (Cloudflare Pages `f21d7e62`).
- **Mobile Builds & Latest OTA:** Native binaries built with `expo-secure-store` hardware-encrypted session storage (`45c31c43` Android `preview-arm64`; `a72551f5` iOS `production` Build `22`, auto-submitted `c1d9bbc6`). Latest UI/font/bubble fixes and `ITMS-91182` Apple font removal are live via OTA update group **`f2dae896-2d5b-4ad6-96c9-b49e3249ae4a`** (`production` and `preview` on `2.0.0-securestore-1`).
- **Next Up for Codex / Claude:** See [APP-EDITING-ANALYSIS.md](docs/guides/APP-EDITING-ANALYSIS.md), [SECURITY-REMEDIATION-PLAN.md](docs/guides/SECURITY-REMEDIATION-PLAN.md), and [EAS.md](EAS.md) for the next clean iOS binary (`Build 23+`, free of `ITMS-91182` bundled Apple fonts) and optional email verification UX enhancements.

## Status — November 15, 2026 (Version `2.0.0`)

- **November 15, 2026 — Version `2.0.0`: Optional Account & Cloud Sync (Cloudflare Worker + D1), Apple Books `ID` Profile Header, iOS 26 Connecting Liquid Glass Circles (`GlassContainer`), Anti-Bot Hardening & Settings UI Redesign**:
  - **Optional Cloud Account & Cross-Device Sync (`context/AuthContext.tsx`, `components/AuthSheet.tsx`, `workers/ebp-auth-sync/`)**: Users can optionally sign in or create an account (zero login wall; app works 100% offline first) to back up and union-merge their Favorites, Custom Playlists, Recent Hymns, and Reading Preferences (`language`, `hymnLanguage`, `isDarkMode`, `fontSizeMultiplier`) across iPhone, iPad, and Android. Backed by Cloudflare Worker `https://ebp-himnario-sync.himnario.workers.dev` and Cloudflare D1 database `ebp-himnario-db` (`ed683396-bfd7-43ff-b69e-f82cf4621c55`) using `PBKDF2-HMAC-SHA256` (`100,000` iterations + per-user random salt) and `SHA-256` hashed session tokens.
  - **Anti-Bot & Brute-Force Edge Protection (`workers/ebp-auth-sync/index.js`, `schema.sql`)**: D1 `rate_limits` table enforces progressive lockout (`1m` → `5m` → `15m`, HTTP `429` + `Retry-After`) after 5 failed login attempts, per-IP signup/reset/sync rate limits, `64 KB` body cap, honeypot bot trap, `120ms` minimum response timing floor, and automatic session revocation upon password reset.
  - **Classic Profile Circle & iOS 26 Liquid Glass Header (`components/HomeHeaderActions.tsx`)**: Top-right `Inicio` header renders two `46×46pt` circles—**Search (`🔍`)** and **Profile / Unified App Menu (`ID` initials on warm classic theme colors `#F3EEE8`/`#FDF9F2` or `#6B0F1A` when signed in, or `person.crop.circle` when signed out)**, updated via OTA `f2dae896` to remove the temporary blue gradient. On iOS 26+, both circles sit inside `<GlassContainer spacing={6}>` with `gap: 12` so they stay cleanly separated at rest while allowing subtle Reanimated spring nudges (`±7pt`, `stiffness: 420`).
  - **Unified `AuthSheet` & Keyboard/Spinner Fixes (`components/AuthSheet.tsx`, `context/AuthContext.tsx`)**: Combines Account, Share App (`share` with banner & QR), Settings (`settings`), Offline Audio (`downloads`), Help (`help`), and History (`about`) as in-sheet sub-pages inside a single modal (preventing iOS modal-collision freezes). Dynamically clamps `sheetMaxHeight` when the keyboard opens so the grabber and **`Listo`** exit button never get pushed off-screen, adds a Show/Hide password eye toggle, and uses `sessionEpochRef` + `AbortController` so signing out immediately aborts in-flight syncs and clears spinners.
  - **Settings Account Card, Font Size Slider, Share App Row & iOS Switch (`app/(tabs)/settings.tsx`, `HomeMenuSheet.tsx`, `AuthSheet.tsx`, `LanguageContext.tsx`)**: Upgraded the `CUENTA Y NUBE` card in `settings.tsx` with the classic circular avatar badge, accented title, `"Entrar ›"` / `"Sign In ›"` CTA pill, and explanatory cloud-backup footnote underneath; added a **Compartir aplicación / Share App** row under `General`; fixed the Dark Mode `<Switch>` to use authentic iOS `UISwitch` colors (`#34C759` green ON track on iOS, `#373737`/`#39393D` dark track when OFF); fixed the `AuthSheet` Settings Font Size `12 px` lock bug with a live lyric preview + full `12–64 px` Slider + 1 px steppers + `Reset`; removed bundled `SFProText`/`NewYork` fonts from `assets/fonts/ios/` (`ITMS-91182` fix); and updated `authNamePlaceholder` to `"Ej. Juan Pérez"` / `"e.g. John Doe"`.
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
