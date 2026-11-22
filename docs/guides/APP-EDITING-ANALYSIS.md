# App editing

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
