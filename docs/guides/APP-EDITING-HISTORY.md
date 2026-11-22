# App editing — historical entries

Older handoff notes moved out of [APP-EDITING-ANALYSIS.md](APP-EDITING-ANALYSIS.md). They record what was true when written; later entries supersede earlier ones, and files they name may no longer exist (for example `HomeMenuSheet.tsx`, removed in the November 2026 cleanup).


## Local follow-up — verse discussion interaction fixes (November 20, 2026 — Now Shipped in Build 30)

Fixed keyboard-visible first taps, emoji/reply posting, and related asynchronous state bugs. The Home scroll owner and discussion list now use persistent keyboard taps; composer Send and emoji buttons have non-overlapping touch targets. Posting uses a synchronous lock and the latest draft, requires completed draft hydration, persists the exact request ID before sending, replaces temporary IDs on acknowledgement, rolls back failed optimistic edits/posts, and releases the composer before background reads complete. Background reads cannot erase pending posts or clear write errors. Reply cancellation retains text; temporary comments cannot be replied to or moderated. Older loaded pages/replies are retained during background refreshes. Closing a member preview invalidates its pending fetch, and system Back closes that preview first. Heart toggles now coalesce/serialize rapid desired states and roll back to the latest acknowledged value, with per-account/verse queue ownership and corrected cache persistence.

**Local only:** version **2.0.0**, runtime **2.0.0-maps-2** unchanged; no native dependencies, API/schema changes, OTA, rebuild, backend/website deployment or Git push for this follow-up. Last published iOS OTA remains `6d52ccb1-13d5-4cb7-a1c9-022c3701bf9a` and does **not** include these new chat fixes. Existing backend duplicate/spam/rate limits are preserved and still surface errors rather than being bypassed.

Validation: **115 Node tests passed**, including **14 new discussion/heart tests** exercising the actual sheet with mocked hooks/native controls and asynchronous storage/network requests; TypeScript passed; scoped lint has zero errors (three pre-existing VerseCard warnings). Local iOS/Android Hermes exports pass. Actual touch/keyboard behavior still needs physical-device confirmation; JavaScript tests and bundle exports do not establish native responsiveness.

Source: `components/VerseDiscussionSheet.tsx`, `components/VerseCard.tsx`, `app/(tabs)/home.tsx`, `utils/verseDiscussionState.ts`, `utils/verseLikeQueue.ts`, `utils/communityApi.ts`; regression suite `scripts/test-verse-discussion.cjs`. Preserve user/Antigravity changes elsewhere. React Native describes the tap-to-dismiss behavior and persistent tap options in its [ScrollView documentation](https://reactnative.dev/docs/ScrollView#keyboardshouldpersisttaps).


## November 20, 2026 — Current iOS release

Finished Antigravity's verse PNG-sharing/My Church handoff and published verified **iOS production OTA `6d52ccb1-13d5-4cb7-a1c9-022c3701bf9a`**, runtime **2.0.0-maps-2**, for compatible **iOS build 29**. Version remains **2.0.0**. Added SVG asset-readiness checks, image-only iOS sharing, and form accessibility; TypeScript and 101 tests passed. The Android preview APK remains on `2.0.0-securestore-1` and cannot receive this maps-runtime update. No rebuild or backend/website deployment was performed in this turn. See [release evidence](../../EAS.md) for details; older entries below are historical.


## Local community implementation — November 17, 2026

Verse-of-the-Day discussions, profiles, sole-admin moderation, choir repertoire, prepared backgrounds, player overlay/navigation fixes and bilingual legal drafts are implemented locally. **No deployment, OTA, native rebuild or store submission was made for this work.** Version remains **2.0.0**, runtime **2.0.0-securestore-1**; no native dependencies changed. See the [implementation and release handoff](VERSE-COMMUNITY-HANDOFF.md) for schema migration 0003, safeguards, validation and release order. Earlier live-state notes below are historical and do not describe this unreleased work.


## Current local security handoff — November 15, 2026

**Updated live status:** The user retained source version **2.0.0** and authorized only the reset containment for deployment. Worker `b5bc8c5b-5fbe-435f-8f78-a1cd5d793735` now rejects POST `/auth/reset-password` (including trailing slash) with 503 `recovery_unavailable`. Other local Worker changes remain unreleased; existing cloud login/sync behavior was preserved. See [EAS evidence](../../EAS.md). Older test binaries with the same 2.0.0 runtime can lack SecureStore: a native rebuild and compatibility isolation are still required before later app releases/OTA.

Read [SECURITY-REMEDIATION-PLAN.md](SECURITY-REMEDIATION-PLAN.md) before changing auth/sync or releasing. Source is now unreleased `2.0.0`; protected credential storage adds a native module and must not be sent OTA to older 2.0.0 test binaries that lack SecureStore. Earlier feature and release notes remain historical evidence, not a security assurance. The unsafe password-reset method is disabled locally and in the reset-only live patch; automatic sync now uses revision preconditions. Full email recovery, email verification, sensitive-action reauthentication, automatic conflict reconciliation and cloud operational checks remain outstanding.

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

Latest checks (November 15, 2026): `npx tsc --noEmit` passes with 0 errors; live Cloudflare Worker auth/sync and anti-bot rate-limit tests (`429` after 5 failed attempts + honeypot rejection) pass; all 16 playback/offline/search regression tests in `scripts/test-android-playback.cjs` and all 10 gesture motion tests in `scripts/test-gesture-motion.cjs` pass (26/26 total); `node scripts/test-web-search.js` passes across all 761 hymns and choruses.

## November 15, 2026 — Version `2.0.0` Handoff: Optional Account & Cloud Sync (`AuthContext`, `AuthSheet`, Cloudflare Worker + D1), Apple Books `ID` Header & iOS 26 Connecting Liquid Glass (`GlassContainer`), Anti-Bot Hardening & Settings UI Polish

**Published on Runtime `2.0.0` via EAS Update (`production` & `preview` Update Group `23922bbe-f53b-41d2-8d34-eef7c739cf64` — iOS `01a1defb-5ee9-72e6-a284-c692d779a3f2`, Android `01a1defb-5ee9-7963-9199-48900315adac`) and deployed to Cloudflare Worker `ebp-himnario-sync` (`5e626283-1559-462e-830f-56d0e19f86fc`).** Supersedes the 3-item `HomeHeaderActions` layout from November 14 below.

### 1. Cloudflare Worker + D1 Cloud Sync Backend (`workers/ebp-auth-sync/`)
- **Files**: `workers/ebp-auth-sync/index.js`, `workers/ebp-auth-sync/schema.sql`, `workers/ebp-auth-sync/wrangler.jsonc`.
- **Live Endpoints**: Base URL `https://ebp-himnario-sync.himnario.workers.dev` (D1 database `ebp-himnario-db`, ID `ed683396-bfd7-43ff-b69e-f82cf4621c55`).
  - `GET /health`
  - `POST /auth/register` (`{ name, email, password, localData }`)
  - `POST /auth/login` (`{ email, password, localData }`)
  - `POST /auth/reset-password` (`{ email, name, newPassword }` — verifies registered email + case-insensitive full name, updates PBKDF2 hash/salt, and revokes all active sessions in `sessions`)
  - `PUT /auth/profile` (`{ name }`, Bearer auth)
  - `GET /sync` & `PUT /sync` (`{ favorites, playlists, recents, preferences }`, Bearer auth)
  - `POST /auth/logout` & `DELETE /auth/account` (Bearer auth)
- **Cryptography & Storage**:
  - Passwords hashed with Web Crypto `PBKDF2-HMAC-SHA256` (`100,000` iterations, `16-byte` random salt per user) and verified with `timingSafeEqualHex`. Raw passwords are never stored.
  - Session tokens are `32-byte` random hex strings; only `SHA-256(token)` (`token_hash`) is stored in `sessions`.
- **Anti-Bot & Brute-Force Protection (`rate_limits` D1 table)**:
  - Bucket keys hash `rl:<scope>` with `SHA-256` using `CF-Connecting-IP` + normalized email.
  - `POST /auth/login`: 5 failed attempts per `(IP, email)` within 15m triggers progressive lockout (`1m` → `5m` → `15m`), returning HTTP `429` with `Retry-After` and `retryAfterSeconds`. Successful login clears the bucket. Also caps total login attempts at 20 per IP per 15m.
  - `POST /auth/register`: Max 3 account creations and 8 attempts per IP per hour.
  - `POST /auth/reset-password`: Max 3 failed verifications per `(IP, email)` per hour and 5 attempts per IP per hour.
  - `PUT /sync`: Max 60 writes per user per minute.
  - Rejects payloads `> 64 KB` (`413`), rejects filled `website` honeypot fields (`429`), and enforces a `120ms` minimum response duration (`ensureMinDuration`) on failed auth paths.
- **Windows Wrangler Command Rule**: Always run `npx wrangler` from `himnario/` with `-c "../workers/ebp-auth-sync/wrangler.jsonc"` (see [CLOUDFLARE-DEPLOYMENT.md](CLOUDFLARE-DEPLOYMENT.md)).

### 2. Client Auth & Auto-Sync State (`himnario/context/AuthContext.tsx`, `FavoritesContext.tsx`, `PlaylistsContext.tsx`, `RecentHymnsContext.tsx`)
- **Non-Blocking / Offline-First**: No login wall anywhere. Session is cached in `AsyncStorage` under `@ebp_auth_session_v1`.
- **Bulk Setters**: `FavoritesContext` exposes `setAllFavorites(ids)`, `PlaylistsContext` exposes `setAllPlaylists(lists)`, and `RecentHymnsContext` exposes `setAllRecents(ids)` so `applyServerSync` in `AuthContext.tsx` can hydrate merged cloud state without triggering feedback loops (`isHydratingRef.current = true` during hydration).
- **Logout & Race-Condition Safety**:
  - `AuthContext.tsx` maintains `sessionEpochRef` and `syncAbortRef` (`AbortController`).
  - Calling `signOut()` or `deleteAccount()` increments `sessionEpochRef.current`, clears `syncTimeoutRef.current`, aborts any in-flight `pushSyncToCloud` `fetch()`, and immediately resets `setIsSyncing(false)` before clearing storage so an in-flight sync can never re-save a logged-out session or leave a spinner running.
  - `signIn`, `register`, and `resetPassword` do **not** toggle `isSyncing` (form submission state is owned locally by `submitting` in `AuthSheet.tsx`) and throw `Error("rate_limited:<retryAfterSeconds>")` on HTTP `429`.

### 3. Unified Apple Books Account & App Menu Sheet (`himnario/components/AuthSheet.tsx`)
- **Single-Modal Sub-Page Architecture**: `AuthSheet.tsx` is mounted once at the root (`app/_layout.tsx`) and manages `page: 'account' | 'share' | 'settings' | 'downloads' | 'help' | 'about'` internally. Navigating to "Compartir aplicación", "Ajustes", " Audio sin conexión", "Consejos y ayuda", or "Acerca del himnario" transitions inside the same sheet instead of stacking two React Native `<Modal>` components on iOS (which previously froze UIKit).
- **Standalone `AppShareSheet.tsx` Guard**: `AppShareSheet.tsx` also has `if (!visible) return null` before rendering its `<Modal>` so it never mounts an invisible overlay when closed, and is used when triggered directly from `settings.tsx`.
- **Keyboard Trap Fix (`AuthSheet.tsx`)**:
  - Subscribes to `Keyboard.addListener('keyboardWillShow' / 'keyboardWillHide')` on iOS (`keyboardDidShow` / `keyboardDidHide` on Android) to track `keyboardHeight`.
  - Dynamically clamps `sheetMaxHeight = Math.max(260, Math.min(availableHeight, 720))` where `availableHeight = keyboardHeight > 0 ? windowHeight - keyboardHeight - (insets.top + 12) : windowHeight * 0.9`. This prevents `KeyboardAvoidingView` from pushing the sheet's top grabber and **`Listo`** exit button above `y = 0` behind the Dynamic Island when the keyboard opens.
  - Keeps the grabber and header bar pinned outside `<ScrollView>` with a subtle bottom hairline border, calls `Keyboard.dismiss()` inside `animateClose()`, and sets `keyboardDismissMode={isIOS ? 'interactive' : 'on-drag'}`.
- **Password Visibility Toggle & Rate-Limit Feedback**:
  - Password and New Password fields include a `42×42pt` right-hand eye button (`eye.fill` / `eye.slash.fill` on iOS; `visibility` / `visibility-off` on Android) controlling `secureTextEntry={!showPassword}` (`showPassword` resets on mode switch, submit, and sheet close).
  - Catches `rate_limited:<secs>` errors and displays localized `t.authRateLimitedError`.

### 4. Home Header Apple Books Profile Circle & iOS 26 Connecting Liquid Glass (`himnario/components/HomeHeaderActions.tsx`)
- **2-Circle Header Layout**: Renders two `46×46pt` circular buttons (`gap: 10`):
  1. **Left Circle (`46×46pt`)**: Search (`magnifyingglass` `24pt` / `search`).
  2. **Right Circle (`46×46pt`)**: Apple Books Profile / Unified Menu. When signed in, renders a `42×42pt` `LinearGradient` (`APPLE_AVATAR_GRADIENT = ['#9EA9DC', '#7683BE']`) inside the `46×46pt` glass rim (leaving a `2pt` glass halo ring) with bold white initials (`17px`). When signed out, renders `person.crop.circle.fill` (`30pt`) / `account-circle`.
- **iOS 26 Connecting / Morphing Liquid Glass (`GlassContainer`)**:
  - Verified in `node_modules/expo-glass-effect/ios/GlassContainer.swift`: `GlassContainer` (`UIGlassContainerEffect`) requires child `GlassView` instances to be **direct native subviews** of `containerEffectView.contentView`.
  - On iOS 26+ (`checkLiquidGlassContainer()`), `HomeHeaderActions.tsx` renders `<GlassContainer spacing={18} style={styles.actionsRow}>` containing two direct `AnimatedGlassView = Animated.createAnimatedComponent(GlassView)` children (`isInteractive={true}`, `glassEffectStyle="regular"`).
  - Each circle wraps its inner `Pressable` in a `GestureDetector` with `Gesture.Pan()` (`±20pt` damped horizontal / `±8pt` vertical drag with `withSpring` return). Dragging either circle toward the other brings their edges within `spacing={18}`, causing iOS 26's native Metal shader to render the connecting Liquid Glass metaball bridge between the two circles.

### 5. Settings Screen Upgrades & Dark Mode Switch Fix (`himnario/app/(tabs)/settings.tsx`, `HomeMenuSheet.tsx`, `AuthSheet.tsx`, `LanguageContext.tsx`)
- **Upgraded `'Iniciar sesión'` Card (`settings.tsx`)**:
  - Signed-out state features a `44×44pt` circular avatar badge (`person-outline`), accented title (`#6e1619` in Light Mode; `#F2D7B6` warm cream in Dark Mode), a trailing `"Entrar ›"` / `"Sign In ›"` CTA pill (`styles.accountCtaPill`), subtle hairline card border, and an Apple/Gospel Library-inspired explanatory footnote (`t.authSettingsCardHint`) directly below the card.
- **Share App Row in Settings (`settings.tsx`)**:
  - Added **Compartir aplicación / Share App** (`t.authShareAppRow` / `t.authShareAppSub`) under the `General` section (right below `Reportar un error`), opening `<AppShareSheet visible={showShareApp} onClose={() => setShowShareApp(false)} />`.
- **Dark Mode Switch Contrast Fix (`settings.tsx`, `AuthSheet.tsx`, `HomeMenuSheet.tsx`)**:
  - In `theme/theme.js`, `darkTheme.primary` and `darkTheme.inverseSurface` are both `#fdf9f2` (cream-white), which previously made the Dark Mode `<Switch>` render white-on-white, and `theme.outlineVariant + '66'` produced an invalid `'rgba(...)66'` string in dark mode.
  - All three `<Switch>` components now keep Light Mode unchanged (`trackColor.true = theme.primary` `#6e1619`, white thumb) and in Dark Mode use `thumbColor = '#FFFFFF'`, `trackColor.true = theme.surfaceVariants.container` (`#373737`, our darkest elevated gray above the `#1c1c1c` `containerLow` card), and `trackColor.false = ios_backgroundColor = 'rgba(255, 255, 255, 0.20)'`.
- **Placeholder Cleanup (`LanguageContext.tsx`)**:
  - Changed `authNamePlaceholder` from `'Ej. Isaac Durán'` / `'e.g. Isaac Duran'` to `'Ej. Juan Pérez'` / `'e.g. John Doe'`.

## November 14, 2026 — YouTube Music Horizontal Track Swipe in `MiniPlayer`, iOS 26 Liquid Glass Lifecycle & Optical Centering, Quick Web Feedback Form Prefill, 3D Leather Web Covers, 120Hz Sheet Gestures & Hymn 429 Lyric Fix

- **YouTube Music-Style Horizontal Track Carousel in `MiniPlayer` (`components/MiniPlayer.tsx`, `utils/gestureMotion.ts`, `scripts/test-gesture-motion.cjs`)**:
  - Added `clampMiniPlayerDrag` and `miniPlayerSwipeDirection` worklets in `utils/gestureMotion.ts`.
  - `MiniPlayer.tsx` keeps the outer `GlassSurface` capsule and right-hand `Prev / Play-Pause / Next` buttons stationary while rendering a clipped 3-slot track strip (`[prevHymn, hymn, nextHymn]`) inside `styles.trackViewport`.
  - Horizontal thumb swipes scrub between previous and next tracks at 120Hz on the UI thread (with `0.25×` rubber-banding at non-wrapping queue boundaries), committing `skipNext()` or `skipPrev()` past `28%` slot width or `520pt/s` flick velocity and synchronously resetting `translateX.value = 0` in `useLayoutEffect([currentHymnId])` with zero frame flash. Vertical swipe-up (`dy < -8`) and tap continue to expand the full-screen `MusicPlayer`.
- **iOS 26 Liquid Glass Lifecycle & Scroll-Fade Remount (`components/GlassSurface.tsx`, `app/(tabs)/home.tsx`, `components/HomeHeaderActions.tsx`)**:
  - `GlassSurface.tsx` subscribes to `@react-navigation/native` `blur`/`focus` events and `AppState` `'active'` transitions on iOS when native Liquid Glass is active (`!stableBackdrop`), bumping `glassKey` (combined with `refreshKey` and `dark` in `key="glass-${glassKey}-${refreshKey}-${dark ? 'd' : 'l'}"`) so UIKit `GlassView` cleanly remounts after tab switches or app backgrounding.
  - `home.tsx` tracks `headerGlassEpoch` and increments it when scrolling back to the top (`contentOffset.y < 35` after being hidden) on iOS, passing `glassEpoch` to `HomeHeaderActions` as `refreshKey`.
- **WWDC25 Optical Centering, Share App Button & 120Hz Sheet Gestures (`components/HomeHeaderActions.tsx`, `components/AppMenuIcon.tsx`, `components/AppShareSheet.tsx`, `components/ShareSheet.tsx`, `components/HomeMenuSheet.tsx`)**:
  - `HomeHeaderActions.tsx` renders a `44×44pt` Share App glass circle (`square.and.arrow.up` / `share`, opening `AppShareSheet` with banner + QR code + `/app/` smart redirect link) and an `84×44pt` joined Search + Menu glass capsule (`two 42×44pt buttons`), with WWDC25 optical centering on iOS (`shareIconOptical: translateY(-1)`, `searchIconOptical: translateX(1)`, `menuIconOptical: translateX(-1)`).
  - `AppShareSheet`, `ShareSheet`, and `HomeMenuSheet` use 120Hz Reanimated UI-thread pan gestures with velocity-spring dismissal and backdrop interpolation.
- **`Favoritos` Sub-Tab Single-Line Fit (`app/(tabs)/favorites.tsx`)**:
  - Added `numberOfLines={1}`, `adjustsFontSizeToFit`, `minimumFontScale={0.8}`, and centered alignment to the `Mis Favoritos | Listas de Reproducción` sub-tab labels.
- **Quick Web Feedback Form & Google Form Auto-Prefill (`utils/feedback.ts`, `components/HomeMenuSheet.tsx`, `context/LanguageContext.tsx`, `docs/feedback.html`)**:
  - `sendFeedbackEmail` in `utils/feedback.ts` prompts the user with a native `Alert` offering **"Formulario rápido (Recomendado)"** (opens `https://himnarioebp.com/feedback.html?form=audio&hymn=...&title=...` via `expo-web-browser` with no mail client required) or **"Enviar por correo electrónico"** (`mailto:` with automatic fallback to the web form).
  - `docs/feedback.html` automatically prefills Google Form field `entry.323314423` with the `hymn · title` reference (`?usp=pp_url&entry.323314423=...`).
  - Updated `reportHymnError` in `LanguageContext.tsx` to `"¿Encontraste un error? Reportar aquí"` / `"Found an error? Report here"`.
- **Website 3D Leather Covers & Full-Res Mockups (`docs/index.html`, `docs/js/library.js`, `docs/images/branding/hymnal-leather-cover*.jpg`, `docs/mockups/*.jpg`, `fe8efe3`–`9a4d348`)**:
  - Added 3D burgundy leather cover (`hymnal-leather-cover.jpg`) for Light Mode and black leather with silver foil (`hymnal-leather-cover-dark.jpg`) for Dark Mode, full-res App Store mockups, and mobile web CSS refinements; removed duplicate root `.ai` and `.png` source files and temporary staging folders.
- **Hymn 429 Lyric Fix (`data/alabanzasPaginas.js`, `docs/data/hymns-data.js`, `docs/hymn/429/index.html`, `docs/himno/429/index.html`)**:
  - Removed the redundant leading `"Salmos 100:1-5\n\n"` line from Hymn 429 (`Cantad Alegres A Dios`, already stored in `reference: 'Salmos 100:1-5'`) so Stanza 1 starts directly with `"Cantad alegres a Dios,"`, and regenerated the web catalog and static hymn preview pages.
- **Test Harness Update (`scripts/test-android-playback.cjs`)**:
  - Added `getHymnAudioRevision: () => 1` to the `../data/audioRegistry.native` mock in `offlineFixture` so all 16 playback/offline tests pass alongside the 8 gesture tests (24/24).

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


## Security, Email-Auth & Post-Build-22 Handoff (November 15, 2026)

### Live Completed Infrastructure & Releases
- **Cloudflare D1 (`ebp-himnario-db` / `ed683396-bfd7-43ff-b69e-f82cf4621c55`):** Migration `0002_email_auth.sql` applied (`email_verified_at` column on `users`, `email_tokens` table + indexes).
- **Cloudflare Email Sending & Worker (`ebp-himnario-sync`):** `auth.himnarioebp.com` onboarded and enabled (`MX`, `SPF`, `DKIM`, `DMARC` verified). Worker version `6e056043-383c-44e6-9187-22ee9aad0c52` deployed at `https://ebp-himnario-sync.himnario.workers.dev` with `env.EMAIL` (`cuenta@auth.himnarioebp.com`), `ACCOUNT_ACTION_URL` (`https://himnarioebp.com/account.html`), `expectedRevision` conflict checks, and `security.js` rate limiting.
- **Cloudflare Pages (`ebp-himnario`):** Deployed `docs/account.html`, `docs/css/account.css`, `docs/js/account.js`, `docs/_headers`, and `docs/privacy.html` (`https://himnarioebp.com/account.html`, deploy `f21d7e62`).
- **Native Rebuilds (`himnario/`, `runtimeVersion: "2.0.0-securestore-1"`, with `expo-secure-store`):**
  - Android `preview-arm64` build: `45c31c43-e36e-4952-a15a-238ac2c1521c`
  - iOS `production` Build `22`: `a72551f5-58d3-403c-b8d6-589f048c0ad6` (auto-submit `c1d9bbc6-4df7-4301-bb98-965a42c4d974`)
- **Latest OTA Update (`f2dae896-2d5b-4ad6-96c9-b49e3249ae4a` on `production` & `preview`, runtime `2.0.0-securestore-1`):**
  - Fixed `AuthSheet.tsx` Settings Font Size `12 px` lock bug (`changeFontSize` expects an absolute multiplier, not a delta) and replaced it with a live lyric preview (`¡Cuán Grande es Él!`), `12–64 px` `Slider`, 1 px `−`/`+` steppers, and `Reset` (`22 px`).
  - Restored authentic iOS `UISwitch` appearance (`#34C759` green ON track, `#39393D`/`#E9E9EA` OFF track, native UIKit thumb on iOS) across `AuthSheet.tsx`, `app/(tabs)/settings.tsx`, and `HomeMenuSheet.tsx`.
  - Replaced `APPLE_AVATAR_GRADIENT` (`#9EA9DC → #7683BE`) with classic Himnario warm cream (`#F3EEE8` / `#1A1A1A`) and burgundy (`#6B0F1A` / `#FFFFFF`) avatars in `HomeHeaderActions.tsx`, `AuthSheet.tsx`, and `settings.tsx`.
  - Fixed `HomeHeaderActions.tsx` Liquid Glass bubbles touching at rest (`gap: 12`, `GlassContainer spacing={6}`) and tightened pan drag (`±7 pt`, `stiffness: 420, damping: 28`).
  - Deleted `himnario/assets/fonts/ios/` (`SFProText-*.otf` & `NewYork-*.ttf`) to eliminate App Store Connect warning `ITMS-91182`, and unified `app/_layout.tsx` on `@expo-google-fonts/newsreader` + `@expo-google-fonts/public-sans`.

### Pending / Optional Next Work for Codex & Claude
1. **Next Clean iOS App Store Binary (`Build 23+`)**: Build `22` delivered with App Store Connect warning `ITMS-91182` (`SFProText-Semibold.otf`). Now that `assets/fonts/ios/` is deleted, triggering a fresh iOS + Android native build will produce a warning-free binary with OTA `f2dae896` baked in natively.
2. **Email Verification UX Upgrades (User Asked & Scoped)**:
   - Upgrade `workers/ebp-auth-sync/email-auth.js` line 74 from plain 3-line `<p>` HTML to a branded Himnario HTML email template (header, burgundy CTA button, clear 24h/15m expiry note).
   - Auto-call `refreshUser()` in `himnario/context/AuthContext.tsx` on `AppState === 'active'` while signed in with `!user.emailVerified` so users don't have to tap **Refresh Verification Status** manually.
   - Make the **Return to the app** action on `docs/account.html` / `docs/js/account.js` open `himnario://` directly after email confirmation.
3. **Sync Paused Note for Older Logins**: Users who signed in before `expectedRevision` rolled out (missing local revision) see `Sync paused` cleanly without losing data; tapping **Sign Out** → **Sign In** once restores normal `Synced to cloud` state. Also double-check `utils/authSessionStorage.ts` (`@himnario_auth_session` vs older `@ebp_auth_session_v1`) if legacy pre-v2 migration needs extending.
