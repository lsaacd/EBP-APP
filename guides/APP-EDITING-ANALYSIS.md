# App editing

## November 23, 2026 (late night 2) — `33×12` SheetGrabber Standard, Church Draft Guard, Coro Filadelfia & Choir Submissions/Moderation (OTA `dc4ca9aa`)

### What changed (commit `6d5e969`, D1 `0015_choirs.sql`, Worker `d0008031`, iOS OTA `dc4ca9aa-232d-465a-a7a6-890babd35f38`)
1. **Standardized `33×12` `SheetGrabber` Pill (`himnario/components/SheetGrabber.tsx`, `TextSizeSheet.tsx`):**
   - Set the shared floating pill across all bottom sheets to **`width: 33, height: 12, borderRadius: 999`**, `SHEET_GRABBER_CLEARANCE = 24`, and removed the leftover duplicate inner grabber from `TextSizeSheet.tsx`.
2. **Unsaved-Draft Confirmation on Church Add/Edit Sheet (`himnario/utils/churchDraft.ts`, `himnario/app/churches.tsx`):**
   - Added pure `hasUnsavedChurchDraft()` check (detects any non-default input on new church, or any field/photo change vs. initial snapshot when editing an existing church).
   - Intercepts `X`, backdrop tap, swipe-down, and back press with a native discard dialog (`¿Descartar borrador?` / `Discard draft?`), while allowing clean instant close when empty/unchanged or after successful submission.
3. **Coro Filadelfia + User Choir Submissions & Admin Moderation (`migrations/0015_choirs.sql`, `workers/ebp-auth-sync/community.js`, `communityRules.js`, `utils/choirsStore.ts`, `CommunityProfile.tsx`, `CommunityModeration.tsx`, `ChoirRepertoire.tsx`, `AuthSheet.tsx`, `FriendsPanel.tsx`, `VerseDiscussionSheet.tsx`):**
   - Added D1 `choirs` table seeded with **Coro Esmirna**, **Coro Maranatha**, and **Coro Filadelfia**, and relaxed the legacy 2-choir `CHECK` on `choir_repertoires` so Filadelfia and any approved custom choir support pinned repertoires.
   - Added Worker routes `GET /choirs`, `POST /choirs/submit` (pending for verified members, immediate approval for admin), `GET /mod/choirs`, `POST /mod/choirs/:slug/approve`, `POST /mod/choirs/:slug/reject`, and `DELETE /mod/choirs/:slug`.
   - Upgraded **Account → Coro** (`CommunityProfile.tsx`) with dynamic approved choirs, a **Suggest / Add Choir** bottom sheet using `33×12` `SheetGrabber`, inset-grouped `AnimatedField` inputs, unsaved-draft guard, and `ActionToast`.
   - Upgraded **Moderation → Coros** (`CommunityModeration.tsx`) with live pending count badge (`Coros (N)`), editable `AnimatedField` Spanish/English names + Approve/Reject actions, and `AnimatedField` repertoire inputs across all approved choirs.

### Published live IDs
- **D1 (`ebp-himnario-db`):** Migration `0015_choirs.sql` applied remotely.
- **Worker (`ebp-himnario-sync`):** Version `d0008031-4669-4541-bd68-55f7e6ee3770` (`/health` = `200`, `/choirs` = `200` with Esmirna, Maranatha, Filadelfia).
- **iOS OTA (`production`, runtime `2.0.0-notif-4`):** Group `dc4ca9aa-232d-465a-a7a6-890babd35f38`, iOS update `01a207a2-2cc6-7b50-b035-988586dc8596`.

### Verification & not verified
- Verified: `tsc --noEmit` clean, all 11 Node suites pass (`test-verse-community.cjs` 35/35, `test-church-sheet.cjs` 24/24, `test-verse-discussion.cjs` 18/18), `test-web-search.js`, `audit-secrets.py` (0 findings across 3,341 files), live Worker `/health` and `/choirs` return 200.
- Not verified on physical hardware: test the `33×12` pill across sheets, Church draft-discard popup, Coro Filadelfia selection, Suggest Choir modal, and Moderation → Coros approval flow on TestFlight Build #33 after pulling OTA `dc4ca9aa`.

---

## November 23, 2026 (late night) — Bigger SheetGrabber, Church Form ActionToast & “Coritos” → “Estribillos” (OTA `8d7718d5`)

### What changed (commit `07de4a3`, Pages `3cc47454`, iOS OTA `8d7718d5-7db4-43c2-88db-b7fc0639bc6d`)
1. **Bigger, High-Contrast Floating Sheet Pill (`himnario/components/SheetGrabber.tsx`):**
   - Resized the shared pill across all bottom sheets from `46×5` (`rgba(255,255,255,0.78)`, clearance `16`) to **`64×7`, `borderRadius: 999`, `rgba(255,255,255,0.92)`** with subtle hairline edge + crisper drop shadow and `SHEET_GRABBER_CLEARANCE = 22`.
2. **Auto-Dismissing Toast & Status Polish in Church Form (`himnario/components/ActionToast.tsx`, `himnario/app/churches.tsx`, `himnario/context/LanguageContext.tsx`):**
   - Added reusable `ActionToast` (Reanimated `FadeInUp`/`FadeOutUp`, Liquid Glass pill, green icon badge, auto-dismisses after 2.6 s without blocking touches).
   - Fires on confirming a new pin on the map (`"Ubicación actualizada"` / `"Location updated"` with coordinate subtitle), pasting valid new coordinates/Maps links, adding photos via Camera, Gallery, or Cloud URL (`"Foto agregada"` / `"{count} fotos agregadas"`), and switching cover photo (`"Portada actualizada"`).
   - Added a persistent green `"Actualizada"` / `"Updated"` badge + soft green border tint on the Location card once changed, plus a green-tinted photo counter pill (`N/10`) and `"Subiendo…"` / `"Uploading…"` upload indicator in the Photos card.
3. **Renamed “Coritos” → “Estribillos” Everywhere (`LanguageContext.tsx`, `hymns.tsx`, `alabanzasPaginas.js`, `docs/`):**
   - Replaced all visible Spanish `"Coritos"` labels (Índice segmented tab, Índice title, search section headers, Home card subtitle, share copy, and `E73` tag `'Corito Clásico'` → `'Estribillo Clásico'`) across both mobile app and website (`docs/js/library.js`, `docs/index.html`, `docs/app/index.html`).
   - Regenerated `docs/data/hymns-data.js` and all 761 static hymn pages (`scripts/extract-hymns.js`, `scripts/generate-hymn-pages.js`).

### Published live IDs
- **Pages (`ebp-himnario`):** Deploy `3cc47454` (`https://3cc47454.ebp-himnario.pages.dev`).
- **iOS OTA (`production`, runtime `2.0.0-notif-4`):** Group `8d7718d5-7db4-43c2-88db-b7fc0639bc6d`, iOS update `01a2078d-b263-7a2a-adf3-904d5004df73`.

### Verification & not verified
- Verified: `tsc --noEmit` clean, all 11 Node suites pass, `test-web-search.js` (761 hymns/choruses), `audit-secrets.py` (0 findings across 3,338 files), `git grep` confirmed zero remaining user-facing `"corito"` strings in `himnario/` or `docs/`.
- Not verified on physical hardware: check the larger `SheetGrabber`, Church pin/photo `ActionToast` timing, and updated `"Estribillos"` labels on TestFlight Build #33 after pulling OTA `8d7718d5`.

---

## November 23, 2026 (night) — iOS Build #33 Finished + Animated Forms, Cleaner Auth/Church UI & 8-Char Passwords (OTA `6382c472`)

### Build #33 resolution
- iOS Build #32 (`448311eb-f325-4d93-a68c-1fce3c481f19`) errored at `Run fastlane` (0 EAS build credits used) because `--non-interactive` reused the pre-push provisioning profile `ZM5HK4A7JT` without `aps-environment`.
- Confirmed APNs Push Key via `eas credentials -p ios` and ran interactive `eas build --platform ios --profile production --auto-submit`, producing **iOS Production Build #33 (`1f834da7-0481-4481-b29a-8464a531f880`, runtime `2.0.0-notif-4`, status `finished`)** auto-submitted to App Store Connect / TestFlight.

### What changed (commit `614cb15` and iOS OTA `6382c472-bd5f-414b-a049-70da51aeadd6`)
1. **Reusable Animated Input (`himnario/components/AnimatedField.tsx`) + Password Strength Helper (`himnario/utils/passwordStrength.ts`):**
   - Floating label springs smoothly from centered placeholder to top-left label on focus/value, animating a burgundy focus ring (`theme.primary`), soft shadow, and `Haptics.selectionAsync()`.
   - Supports `grouped` mode (borderless row inside an iOS Contacts-style inset card with animated 3px left focus accent bar and hairline dividers) and `rightElement` forwarding.
2. **AuthSheet UI Overhaul (`himnario/components/AuthSheet.tsx`, `himnario/context/LanguageContext.tsx`):**
   - Cut word clutter: replaced 3 stacked paragraphs (removing the 4-line sync-replacement banner) with 1 concise subtitle and compact `"Opcional · Funciona sin conexión"` / `"Optional · Works offline"` footer.
   - Added Reanimated sliding pill on the Sign In / Create Account tabs, `AnimatedField` inputs with `Next` → `Done` keyboard chaining, gentle error shake on validation/auth failures, and a 3-segment visual password strength bar (*Débil / Buena / Fuerte* / *Weak / Good / Strong*) during registration.
3. **Church Add/Edit Form Redesign (`himnario/app/churches.tsx`):**
   - Removed the 3-line intro paragraph (eliminating the internal `"(R2)"` wording).
   - Slimmed the Location block into a compact single-row card (`✓ address` + crisp `"Cambiar"` / `"Mapa"` pill) with admin-only raw coordinates/Maps URL input tucked behind a collapsible toggle.
   - Replaced 5 stacked text boxes with a single 3-row iOS Contacts-style grouped address card (`Dirección`, `Ciudad | Estado / Prov.`, `País | Código postal`) using `AnimatedField` (`grouped` mode) and keyboard `Next` chaining, and upgraded optional fields to `AnimatedField`.
4. **Minimum Password Length Lowered `12` → `8` Characters Across Stack:**
   - Updated Worker (`workers/ebp-auth-sync/index.js`, `email-auth.js`), mobile app (`AuthContext.tsx`, `AuthSheet.tsx`, `LanguageContext.tsx`), web reset page (`docs/account.html`, `docs/js/account.js`), and tests (`test-mobile-auth.cjs`, `test-auth-security.cjs`, `test-church-sheet.cjs`). Max length remains `128`; existing accounts unaffected.

### Published live IDs
- **Worker (`ebp-himnario-sync`):** Version `c21e262a-d339-4407-a061-70dec6c94b51` (`/health` = `200`).
- **Pages (`ebp-himnario`):** Deploy `1b9a25e1` (`https://1b9a25e1.ebp-himnario.pages.dev`).
- **iOS Build #33 (`production`, runtime `2.0.0-notif-4`):** EAS Build `1f834da7-0481-4481-b29a-8464a531f880`.
- **iOS OTA (`production`, runtime `2.0.0-notif-4`):** Group `6382c472-bd5f-414b-a049-70da51aeadd6`, iOS update `01a20775-be7c-746f-8f05-b017a25299b1`.

### Verification & not verified
- Verified: `tsc --noEmit` clean, all 11 Node test suites pass (including new 8-char Worker registration test and `getPasswordStrength` test), `test-web-search.js` (761 hymns/choruses), `audit-secrets.py` (0 findings across 3,337 files), live Worker `/health` = 200.
- Not verified on physical hardware: inspect the new `AnimatedField` animations, sliding Auth tabs, password strength bar, and grouped Church address card in light & dark mode on TestFlight Build #33 after pulling OTA `6382c472`.

---

## November 23, 2026 (late evening) — 127 Daily Verses & Notifications Phase 1 + 2 (iOS Build #32, `2.0.0-notif-4`)

### What changed (commits `a948821` and `1751815`)
1. **Expanded Daily Verses (`himnario/data/dailyVerses.ts`):**
   - Expanded from 27 → **127 public-domain bilingual verses** (Reina-Valera 1909 + WEB/KJV) while keeping all 27 original `id` slugs intact.
   - Switched `getDailyVerse()` to `getLocalDayNumber()` (`Date.UTC(y, m, d) / 86_400_000 % length`) so verses step strictly +1 per day across month boundaries and leap years.
2. **Notifications Phase 1 (In-App Inbox) + Phase 2 (Native Expo Push):**
   - D1 migrations `0013_notifications.sql` (`notifications` table + unique dedupe index + 3 per-user toggle columns) and `0014_push_tokens.sql` (`push_tokens` table).
   - Worker (`community.js`, `index.js`): triggers on `comment_like`, `comment_reply`, `friend_request`, `friend_accepted`, and `shared_playlist`; self/block/preference guards; Expo Push Service (`https://exp.host/--/api/v2/push/send`) dispatch via `ctx.waitUntil()` with automatic `DeviceNotRegistered` token pruning; `POST /auth/logout` deletes device push token; block/hide/delete cleanup.
   - App: installed `expo-notifications` + `expo-device`, added plugin with cross-free Android icon (`android-monochrome-app-logo.png`), bumped `runtimeVersion` to `2.0.0-notif-4`, added `NotificationsPanel.tsx`, `utils/notifications.ts`, `utils/notificationsStore.ts`, `utils/pushNotifications.ts`, Account sheet row + unread badge, header avatar dot, and lock-screen push deep-linking in `app/_layout.tsx`.
   - Privacy: updated `docs/privacy.html` (Spanish & English, administrator anonymous).

### Published live IDs
- **D1 (`ebp-himnario-db`):** `0013_notifications.sql` & `0014_push_tokens.sql` applied remotely.
- **Worker (`ebp-himnario-sync`):** Version `79656977-059a-4765-b3b3-33a2ecc87136`.
- **Pages (`ebp-himnario`):** Deploy `466a89e2` (`https://466a89e2.ebp-himnario.pages.dev`).
- **iOS Build #32 (`production`, runtime `2.0.0-notif-4`):** EAS Build `448311eb-f325-4d93-a68c-1fce3c481f19` · Auto-Submission `d3ef3366-a4b9-4201-bf5f-ec3b6e5c7984`.

### Verification & remaining manual checks
- Verified: `tsc --noEmit` clean, all Node suites pass (`test-verse-community.cjs` 34/34, `test-church-sheet.cjs` 21/21, `test-mobile-auth.cjs`, `test-mobile-auth-email.cjs`, `test-verse-discussion.cjs` 18/18), `test-web-search.js`, `audit-secrets.py` (0 findings across 3,335 files), live Worker smoke test (`200`/`401`).
- Manual check needed: confirm Build #32 succeeds on EAS (if provisioning profile `ZM5HK4A7JT` lacks `aps-environment`, run `eas credentials -p ios` interactively to add Push Notifications + APNs Push Key and re-run build), then test lock-screen delivery between two accounts on TestFlight.

---

## November 23, 2026 — Verse comment fixes, comment liking & Friends Phase 3 shared playlists (OTA `369019dc`)

Completed everything left in progress after Claude hit its limit, verified end-to-end, and deployed in strict order (D1 → Worker → Pages → iOS OTA).

### What changed (all live in commit `2aaa2fe` and iOS OTA `369019dc-4640-4979-a539-7295465e3e38`)
1. **Verse Card Commenting Fixes (`himnario/components/VerseDiscussionSheet.tsx`, `himnario/utils/communityApi.ts`):**
   - Separated `loadFailed` from send `error` so a failed post (e.g., `rate_limited`, `duplicate_comment`, `invalid_parent`) no longer flips an empty comment list into saying *"Comentarios disponibles con conexión"*.
   - Auto-recovers from `invalid_parent` (drops stale deleted parent while keeping text), `idempotency_conflict` / `invalid_request_id` (regenerates `requestId` so retry works), and missing `editId` (`not_found` drops edit mode and keeps text).
   - Replaced `new URLSearchParams()` in `load()` with plain query-string assembly and mapped `idempotency_conflict`, `not_found`, `not_friends`, and `invalid_playlist` in `communityError()`.
2. **Comment Liking (`migrations/0012_comment_likes.sql`, `workers/ebp-auth-sync/community.js`, `VerseDiscussionSheet.tsx`):**
   - Added `verse_comment_likes` table, `POST /verse-comments/:id/like`, per-comment `likesCount` / `likedByMe` on `GET /verses/:id/comments`, and updated `sort=top` ("Destacados") to rank by `likes + replies`.
   - Added optimistic heart toggle + count beside Reply on every comment and reply (with rollback on error and account-deletion cleanup).
3. **Friends ("Hermanos") Phase 3 — Shared Playlists (`migrations/0011_shared_playlists.sql`, `community.js`, `utils/friends.ts`, `utils/friendsStore.ts`, `FriendsPanel.tsx`, `CommunityProfile.tsx`, `HomeHeaderActions.tsx`, `PlaylistsContext.tsx`, `app/playlist/[id].tsx`):**
   - Added `shared_playlists` table and routes `POST /friends/:userId/playlists`, `GET /playlists/shared`, `POST /playlists/shared/:id/seen`, and `DELETE /playlists/shared/:id` (rate-limited, accepted friends only, cleaned up on block and account deletion).
   - Added **"Compartir con un hermano" / "Share with a Friend"** picker modal inside `app/playlist/[id].tsx`, **"Listas compartidas" / "Shared Playlists"** inbox inside `FriendsPanel.tsx` with **"Guardar en mis listas" / "Save to My Playlists"** (`importPlaylist()`), combined badge count (`incoming + unseen shared playlists`) on `CommunityProfile` + subtle header avatar dot with foreground refresh.
4. **Bilingual Privacy & Terms (`docs/privacy.html`, `docs/terms.html`):**
   - Documented comment likes and shared playlists in both Spanish and English while keeping the administrator anonymous.

### Published live IDs
- **D1 (`ebp-himnario-db`):** `0011_shared_playlists.sql` and `0012_comment_likes.sql` applied remotely.
- **Worker (`ebp-himnario-sync`):** Version `5c474ce7-4a59-40cf-a72f-cbb11a0428c7`.
- **Pages (`ebp-himnario`):** Deploy `a6f62e3a` (`https://a6f62e3a.ebp-himnario.pages.dev`).
- **iOS OTA (`production`, runtime `2.0.0-media-3`):** Group `369019dc-4640-4979-a539-7295465e3e38`, iOS update `01a206e7-8cd7-7146-affc-1d2255b46af5`.

### Verification & not verified
- Verified: `tsc --noEmit` clean, all Node test suites pass (`test-verse-community.cjs` 33/33, `test-verse-discussion.cjs` 18/18, `test-church-sheet.cjs` 19/19, plus playback/auth/sharing/search), `audit-secrets.py` 0 findings, live Worker smoke checks (`200`/`200`/`401`).
- Not verified on physical hardware: UI layout and two-account friend playlist sharing / comment liking should be checked on the owner's iPhone after pulling OTA `369019dc`.

---

## November 22, 2026 (evening) — Handoff for Claude, Codex & Antigravity (iOS Build 31, OTA `d351bb27`)

This entry is the current state. The entry below it describes the morning of the same day (Build 30) and is kept for its rules and commands.

### What changed (all live in OTA `d351bb27` and iOS Build 31)
1. **Cleanup (`3c314f5`):** deleted unreferenced components (`HomeMenuSheet`, `BottomNavBar`, `HymnListItem`, `IosStreamingNotice`, `audio/android-player.ts`) and Expo template leftovers; removed `shaka-player` and `@gorhom/bottom-sheet`; added `.github/workflows/ci.yml`.
2. **String table (`6c46ea0`):** 337 inline `es ? '…' : '…'` pairs moved into `context/LanguageContext.tsx`. Keys were generated from the English text with a per-screen prefix (`churchCameraPermission`); a few are clumsy and can be renamed. A few dozen strings with interpolated values are still inline.
3. **Churches screen (`c53253f`, `20b1a01`, `b47d491`):** `app/churches.tsx` is a full-screen map with two rows of Liquid Glass controls and one bottom sheet (`components/DetentSheet.tsx`) that is hidden at rest. It rises when the search field is focused, "Lista" is chosen or a pin is tapped. The church card shows service times as one row per day (`utils/churchSchedule.ts`), with today highlighted. The QR share modal was removed; QR scanning stays.
4. **Church wording (`3b12817`, `b47d491`):** names are shown without "IDDV El Buen Pastor" and leaders as `SDD <name>` (`utils/churchName.ts`). "Vincular mi iglesia" became "Esta es mi iglesia", and the green "Tu iglesia" button now offers to remove the link.
5. **Church form (`8e003aa`, `082e5e8`):** name and location first; the pin fills in the address; pastor, service times, contact and photos sit behind "Más detalles (opcional)"; service times use `components/ChurchScheduleEditor.tsx`; the coordinates box is admin-only; the keyboard dismisses on drag.
6. **Account sheet (`c53253f`, `082e5e8`):** one "Mi iglesia" row. Opening the map or scanner from the sheet while already on the map no longer stacks a second map, and cancelling a scan opened from Account goes back.
7. **Sheets (`c53253f`):** `components/SheetGrabber.tsx` floats above every bottom sheet.
8. **Typography (`8e003aa`):** native system fonts through `theme/fonts.ts`; 364 `fontFamily` references now spread a token.
9. **Look Around (`8e003aa`, native):** presented directly and requested by map item. Only in Build 31.

### Not verified
- No simulator or device run by the agent. The owner checked on a phone and reported the keyboard and scanner bugs, which were then fixed; the fixes themselves were not re-confirmed.
- Whether Look Around now opens scrollable and facing the building on Build 31.
- Android: nothing here has run on Android (it is on an older runtime).

### Deferred
- **Expo SDK 54 → 58 for Xcode 27** (Apple ITMS-90725, deadline April 2027): see [SDK-58-UPGRADE-PLAN.md](SDK-58-UPGRADE-PLAN.md).

---

## November 22, 2026 — Comprehensive Handoff for Claude & Codex (`2.0.0`, `runtimeVersion: "2.0.0-media-3"`, iOS Build 30 Live on TestFlight)

All November 20–22 changes have been verified, deployed to Cloudflare (D1 + Worker + R2 + Pages), and compiled into **iOS Production Build #30** (`b6501dac-6ab5-4a5f-86e1-1740ce1036d3`, auto-submitted via `8a54ce14-8c49-4b9f-a352-20a9306cc064`).

### Non-Negotiable Product, Doctrinal & Operational Rules
1. **ZERO Crosses (Doctrinal Rule):** IDDV El Buen Pastor **never** uses crosses on church map pins, icons, logos, or branding. Keep all sanctuary artwork (`church-pin*.png`, `church-pin-selected*.png`) strictly cross-free.
2. **Administrator Anonymity in Public Policies:** Do **not** place the administrator's personal name in `docs/privacy.html`, `docs/terms.html`, or user-facing policy/moderation labels (use `"El administrador designado de Himnario El Buen Pastor"` / `"The designated administrator of Himnario El Buen Pastor"`). Note: `isaacduran167@gmail.com` is still the internal sole-admin check in `workers/ebp-auth-sync/community.js` (`ADMIN_EMAIL`) and contact link in `docs/privacy.html`/`docs/terms.html`/`docs/feedback.html`; if the user sets up a forwarding address like `soporte@himnarioebp.com` via Cloudflare Email Routing, only swap the public contact links (keep `ADMIN_EMAIL` unless migrating the admin login account).
3. **Church Photo Caps:** Maximum **5 photos** for regular user church requests; maximum **10 photos** for Admin. Enforced both in UI (`churches.tsx`, `CommunityModeration.tsx`) and Worker (`parseChurchInput` in `workers/ebp-auth-sync/community.js`).
4. **Windows `[03]` Brackets & Wrangler CLI Quirk:**
   - Always use PowerShell `-LiteralPath` when navigating paths with `[03]`.
   - Always set `$env:WRANGLER_CACHE_DIR = "C:\Users\isaac\Desktop\[03] IDDV EL BUEN PASTOR\[01] APP\EBP APP\.wrangler-cache"` before running `npx wrangler ...`.
   - Do **NOT** load `.env.cloudflare` when running Wrangler CLI (it contains an outdated account/token returning `code: 7403`); Wrangler's default logged-in OAuth session works cleanly for D1, R2, Worker, and Pages.
   - Apply new D1 SQL migrations remotely via `npx wrangler d1 execute ebp-himnario-db --remote --file "migrations/000X_....sql"` (do not use `d1 migrations apply` because `0004`–`0008` were executed directly).
5. **EAS CLI on Windows:** Always set `$env:EAS_NO_VCS = '1'; $env:EAS_PROJECT_ROOT = (Get-Location).Path` from `himnario/`. Never run a separate `eas submit` after `--auto-submit` (causes Apple `ITMS-90189`).
6. **iOS `ScreenOrientation` Rule:** Never call `ScreenOrientation.lockAsync` / `unlockAsync` on iOS (`ProjectorModal.tsx` uses pure `90deg` view transform on iOS).

### Summary of Everything Implemented & Shipped (November 22, 2026)
1. **Audio End-of-Track Freeze Deadlock + 24 App-Wide Stability Fixes + Sync Conflict Resolution:**
   - Fixed circular Promise deadlock in `himnario/audio/android-playback-controller.ts` (`ended()` calling `advance(1)` → `startTrackLoad()` → nested `command()`), fixed replay at collection end (`reachedTrackEnd`), fixed iOS cache-eviction fallback in `offline-audio.ts`, fixed `CommunityModeration.tsx` React Hooks order, fixed `_layout.tsx` splash freeze race, fixed `.onFinalize` close-button race across all 8 modal sheets, added hydration guards across `FavoritesContext`/`PlaylistsContext`/`RecentHymnsContext`/`LanguageContext`, fixed `hymnCommunity.ts` `inFlightOpRef` deadlock, fixed `ProjectorModal.tsx` horizontal swipe & tap zones, and added `resolveSyncConflict('local' | 'cloud')` in `AuthContext.tsx` + bilingual Alert in `AuthSheet.tsx`.
2. **Verified Churches Map, Seeded Riverbank Church & Custom Cross-Free Sanctuary Pins (`churches.tsx`, `utils/churchMapUtils.ts`):**
   - Seeded `church-riverbank-ca` (`IDDV El Buen Pastor — Riverbank`, `Co-Pastor Azael Tapia`, `3109 Santa Fe St, Riverbank, CA 95367`, `37.736108061398205, -120.93872212946533`, Tuesday/Thursday/Friday Jóvenes/Sunday schedule, 2 optimized R2 photos `riverbank-ca-1.jpg` and `riverbank-ca-2.jpg`) via `migrations/0008_church_gallery_and_link.sql`.
   - Generated transparent `@1x / @2x / @3x` cross-free ivory & burgundy sanctuary pins (`assets/images/church-pin*.png`, `church-pin-selected*.png`) + viewport clustering & Maps URL/coordinate parser (`churchMapUtils.ts`).
3. **True Native In-App Apple Maps Look Around (iOS 16+) + Android Google Street View (`modules/apple-look-around/`):**
   - Built custom local Expo Swift module (`AppleLookAroundModule.swift`, `AppleLookAround.podspec`, `expo-module.config.json`, `package.json`, `index.ts`) autolinked via `himnario/package.json` `expo.autolinking.searchPaths`. Presents full-screen native `MKLookAroundViewController` with translucent `Listo / Done` pill and frosted bottom address bar, falling back to Google Street View (`google.streetview:cbll=...` on Android / web pano URL).
4. **Multi-Photo Camera & Gallery Uploader + Admin Photo Manager (`utils/churchPhotoUpload.ts`, `churches.tsx`, `CommunityModeration.tsx`, `workers/ebp-auth-sync/community.js`):**
   - Users pick from Camera or Photo Library (resized ≤1400px JPEG, EXIF stripped) and upload to `POST /churches/photos/upload` (magic-byte verified for JPEG/PNG/WebP, stored in R2 `env.MEDIA_BUCKET` under `church-photos/uploads/<uuid>.<ext>`).
   - Pending submissions stay quarantined from `GET /churches` until admin approves. Admin can reorder cover (`★ Portada`), delete individual photos (`✕`), or add new photos anytime; removed/rejected R2 upload keys are automatically deleted from R2.
   - Selected church card renders a swipeable horizontal photo carousel with pagination dots + tap-to-view fullscreen gallery modal.
5. **In-App QR Code Scanner & Church QR Sharing (`churches.tsx`, `AuthSheet.tsx`):**
   - `expo-camera` `CameraView` scans hymn (`/hymn/:id`) and church (`/churches?id=:id`) QR codes from the Churches top bar or Account menu ("Escanear código QR"). Verified church cards include a **"Código QR"** share modal.
6. **Unified "Mi iglesia" & "Iglesias (Mapa)" + Cloud Profile Sync (`users.church_id`):**
   - `AuthUser.churchId` synced via `PUT /auth/profile` and `GET /users/:id/public-profile` (gated by `showChurchLocation`).
   - Placed `Mi iglesia` and `Iglesias (Mapa)` together inside `COMUNIDAD` in `CommunityProfile.tsx`, with a 1-tap **"Elegir mi iglesia en el mapa"** banner inside `Mi iglesia` and **"✓ Tu iglesia"** green verified state on linked church cards.
7. **YouTube Music-Style Comments Sheet (`VerseDiscussionSheet.tsx` + `GET /verses/:id/comments?sort=top|newest`):**
   - Full-sheet swipe-down from anywhere inside the comments `ScrollView` when `scrollOffset <= 4` via `Gesture.Simultaneous(bodyPan, Gesture.Native())`.
   - Top-right `(i)` info button next to `✕`, `Destacados (Top)` vs `Más recientes (Newest)` sort pills, respectful church Community Guidelines banner linking to `https://himnarioebp.com/terms.html#community`, and centered YouTube Music-style empty state.
8. **Repository Cleanup (Nov 22):**
   - Deleted ~15+ MB of unused/duplicate local PNGs, raw cover/background folders already hosted on R2 (`front cover on app hymn options/`, `verse background/`), unused images (`black-ios-logo.png`, `tinted-ios-logo.png`, `imessage.svg`, `theme-mode.svg`), legacy `vercel.json`, `verify_hymns.py`, `translations.json`, and `scratch/` caches.

### Verification Commands (All Passing as of Nov 22, 2026)
```powershell
Set-Location -LiteralPath "C:\Users\isaac\Desktop\[03] IDDV EL BUEN PASTOR\[01] APP\EBP APP"
npx --prefix himnario tsc -p himnario/tsconfig.json --noEmit
Get-ChildItem -LiteralPath "scripts" -Filter "test-*.cjs" | ForEach-Object { node --test ("scripts/" + $_.Name) }
node scripts/test-web-search.js
```
*(10 test suites / 143 tests pass; TypeScript passes with 0 errors.)*

### Next Steps for Claude / Codex
1. **Physical Device Verification on iOS Build #30 (TestFlight):**
   - Verify Riverbank church pin, 2-photo carousel + fullscreen tap, **Apple Maps Look Around** (`MKLookAroundViewController`), Camera/Gallery photo upload, QR Scanner + Church QR Share, **"Vincular mi iglesia" → "✓ Tu iglesia"** sync, and YouTube Music comments swipe-down from body + `Destacados`/`Más recientes` sorting.
2. **Android Native Rebuild (`2.0.0-media-3`):**
   - Current Android preview APK is still on `2.0.0-securestore-1`. Run `eas build --platform android --profile preview-arm64` (or `production` for Play Store `.aab`) when ready to ship Maps, Camera, Photo Picker, and QR Scanner to Android.
3. **Optional Anonymous Support Email:**
   - If the user configures Cloudflare Email Routing (e.g. `soporte@himnarioebp.com` → private Gmail), replace public `mailto:isaacduran167@gmail.com` links in `docs/privacy.html`, `docs/terms.html`, and `docs/feedback.html` and redeploy Cloudflare Pages.

---

Older entries: [APP-EDITING-HISTORY.md](APP-EDITING-HISTORY.md).
