# Native builds and updates

## November 23, 2026 — Full Native Rebuild: iOS Production Build #33 & OTA (`runtimeVersion: "2.0.0-notif-4"`)

Ships **127 daily bilingual verses** with consecutive daily rotation (`getLocalDayNumber()`), **Notifications Phase 1** (in-app notification center + 5 community triggers + per-category switches), **Notifications Phase 2** (native `expo-notifications` + `expo-device` + Expo Push Service delivery), **animated floating-label forms** (`AnimatedField`), **redesigned Auth & Church forms**, and the **8-character minimum password length** across mobile, Worker, and web.

- **Source version and runtime:** `version: "2.0.0"`, `"runtimeVersion": "2.0.0-notif-4"` (bumped from `2.0.0-media-3` due to adding `expo-notifications` and `expo-device`).
- **iOS `production`, Build #33 (`2.0.0 (33)`) — finished and auto-submitted to App Store Connect / TestFlight:**
  - **EAS Build:** [`1f834da7-0481-4481-b29a-8464a531f880`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/1f834da7-0481-4481-b29a-8464a531f880) (auto-submitted — do **not** run a manual `eas submit`).
  - **IPA Artifact:** `https://expo.dev/artifacts/eas/oMEV0Y57YjGyBg85txN2eS5zXA1qaTp8dQobfQwd4EA.ipa`
  - **Note on Build #32 (`448311eb-f325-4d93-a68c-1fce3c481f19`):** Errored at `Run fastlane` (0 Expo Build credits charged) because `--non-interactive` reused the pre-push provisioning profile `ZM5HK4A7JT` without `aps-environment`. Verified APNs Push Key in `eas credentials -p ios` and ran interactive `eas build` to sync Push Notifications capability for Build #33.
- **iOS OTAs on branch `production`, runtime `2.0.0-notif-4` (newest first):**
  - [`8d7718d5-7db4-43c2-88db-b7fc0639bc6d`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/8d7718d5-7db4-43c2-88db-b7fc0639bc6d) — **current** (November 23, from commit `07de4a3`, iOS update `01a2078d-b263-7a2a-adf3-904d5004df73`). Larger high-contrast `SheetGrabber` pill (`64×7`, clearance `22`) across all bottom sheets, new auto-dismissing `ActionToast` confirmation pill + updated badge/photo counter polish in `churches.tsx` (fires on pin change, pasted coordinates, camera/gallery/URL photo add, and cover switch), and full `"coritos"` → `"estribillos"` rename across mobile app and website.
  - [`6382c472-bd5f-414b-a049-70da51aeadd6`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/6382c472-bd5f-414b-a049-70da51aeadd6) — (November 23, from commit `614cb15`, iOS update `01a20775-be7c-746f-8f05-b017a25299b1`). Reusable Reanimated `AnimatedField` (floating labels, focus ring, haptics, inset-grouped variant), upgraded `AuthSheet` (sliding pill tabs, concise copy, error shake, 3-bar password strength meter), redesigned Church add/edit form (removed R2 intro text, compact location card with collapsible admin coordinates, 3-row iOS Contacts-style grouped address card), and 8-character password minimum.
- **Backend & Web Paired Deployments (Live):**
  - **Cloudflare D1 (`ebp-himnario-db`):** Migrations `0013_notifications.sql` and `0014_push_tokens.sql` applied remotely.
  - **Cloudflare Worker (`ebp-himnario-sync`):** Version `c21e262a-d339-4407-a061-70dec6c94b51` (8-char minimum password on register & recovery; builds on `79656977` notifications + Expo Push).
  - **Cloudflare Pages (`ebp-himnario`):** Deploy `3cc47454` (`https://3cc47454.ebp-himnario.pages.dev`, `"coritos"` → `"estribillos"` across `docs/`, regenerated 761 hymn pages + `hymns-data.js`; builds on `1b9a25e1` 8-char password reset page and `466a89e2` privacy notifications update).
- **Commits:** `a948821` (127 daily verses), `1751815` (Notifications Phase 1 & 2, `2.0.0-notif-4`), `614cb15` (animated forms, cleaner Auth & Church UI, 8-char password minimum), `07de4a3` (bigger SheetGrabber pill, Church form ActionToast feedback, `"coritos"` → `"estribillos"`).

---

## November 22, 2026 (evening) — iOS Production Build #31 and OTAs (`runtimeVersion: "2.0.0-media-3"`)

Current release record. The Build #30 entry below describes the morning of the same day.

- **Source version and runtime:** `version: "2.0.0"`, `"runtimeVersion": "2.0.0-media-3"` (unchanged, so Builds #30 and #31 receive the same OTAs).
- **iOS `production`, Build #31 (`2.0.0 (31)`) — finished and auto-submitted to App Store Connect / TestFlight:**
  - **EAS Build:** [`2105a538-0d18-4d29-83f6-a922c35ac656`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/2105a538-0d18-4d29-83f6-a922c35ac656)
  - **Auto-submission:** [`e1843910-ba89-4066-9549-1a6bb45b077b`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/e1843910-ba89-4066-9549-1a6bb45b077b) (do **not** run a manual `eas submit`).
  - **Native change:** `himnario/modules/apple-look-around/ios/AppleLookAroundModule.swift` now presents `MKLookAroundViewController` directly and requests the scene by map item. No new native modules; JavaScript interface unchanged.
  - **Apple warning ITMS-90725:** built with the iOS 26.0 SDK (EAS image `macos-sequoia-15.6-xcode-26.0`, the `sdk-54` default). From April 2027 uploads need Xcode 27. This requires the Expo SDK upgrade in [guides/SDK-58-UPGRADE-PLAN.md](guides/SDK-58-UPGRADE-PLAN.md); do **not** set an Xcode 27 `image` on SDK 54.
- **iOS OTAs on branch `production`, runtime `2.0.0-media-3` (newest first):**
  - [`369019dc-4640-4979-a539-7295465e3e38`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/369019dc-4640-4979-a539-7295465e3e38) — **current** (November 23, from commit `2aaa2fe`, iOS update `01a206e7-8cd7-7146-affc-1d2255b46af5`). Verse card comment fixes (`loadFailed` vs send error, stale reply/edit/request-id recovery), comment liking (`POST /verse-comments/:id/like`, `sort=top` by likes + replies), and Friends ("Hermanos") phase 3 shared playlists (`POST /friends/:id/playlists`, `GET /playlists/shared`, seen/delete, Save to My Playlists, combined header & Account badge). Needs D1 migrations `0011_shared_playlists.sql` and `0012_comment_likes.sql` and Worker `5c474ce7`, all live; Pages `a6f62e3a` live for updated privacy & terms.
  - [`327e2203-2407-49fe-a0aa-20eb9e81f77b`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/327e2203-2407-49fe-a0aa-20eb9e81f77b) — (November 23, from commit `f7c2764`). Friends phases 2 and 4: a friend's favourite hymns, "De mi iglesia" suggestions, two privacy switches. Needs D1 migration `0010_friend_sharing.sql` and Worker `8fe80fe4` or later, both live. That Worker also fixes linked churches being wiped on profile saves.
  - [`3dc3d29a-6969-41f3-acb5-28afaabf1591`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/3dc3d29a-6969-41f3-acb5-28afaabf1591) — (November 23, from commit `a5ab17d`). Friends ("Hermanos") phase 1: friend button and "Miembro desde" on the profile card, "Hermanos" page in the account sheet. Needs D1 migration `0009_friends.sql` and Worker `3689b22f` or later, both live.
  - [`03709a08-ad27-47f4-af2b-60593f0213e1`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/03709a08-ad27-47f4-af2b-60593f0213e1) — (November 23, from commit `e173270`). "Más gustados" chip in the Himnos tab (needs Worker `ba6eb62e` or later for `GET /hymns/top`); church leader entered as a plain name and shown as "SDD Hno <name>".
  - [`a08f14ab-e56c-4b6f-acc2-26b05f7740ad`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/a08f14ab-e56c-4b6f-acc2-26b05f7740ad) — (from commit `57f2930`). Hymn reader label "HIMNO N.º 243" / "HYMN NO. 243"; hymn QR code in the share sheet that opens the hymn on the website; distances as "38 mi (61 km)"; "Cerca de mí" frames the user with the nearest church and opens its card.
  - [`b58d065d-b081-4161-9d7f-67ab1695cc1d`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/b58d065d-b081-4161-9d7f-67ab1695cc1d) — Church QR code restored on the card, with Share and Print; the code is encoded on the device (`himnario/utils/qrPath.ts`) instead of fetched from `api.qrserver.com`, and prints as inline SVG. Adds the pure-JS `qrcode` encoder (no native code; bundle +0.05 MB).
  - [`d351bb27-fd01-46bb-b304-393d7258d8a6`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/d351bb27-fd01-46bb-b304-393d7258d8a6) — Church form keyboard dismissal, QR scan from Account returns on cancel, top Liquid Glass controls, `SDD` title, native system fonts, location-first church form with schedule picker.
  - `78f9b043-d4a3-4337-b59f-6a299003ac05` — Liquid Glass sheet, "Cerca de mí" pill, unlink church, city-only church names, "Mirar alrededor".
  - `4cb9ae0d-49bc-4385-85ce-f11e02914322` — churches map + bottom sheet redesign, merged "Mi iglesia" row, floating sheet grabber, stacked-map fix; also carried the cleanup and string-table commits.
  - Roll back the newest with `eas update:rollback --branch production`.
- **Android:** unchanged. Last APK (`45c31c43`) is on runtime `2.0.0-securestore-1` and received none of this.
- **Backend:** Worker unchanged. One D1 data edit: `church-riverbank-ca.pastor_name` set to `Hno Azael Tapia`. Cloudflare Pages redeployed on November 22 (`afdbd124`, from commit `285e83e`) after the internal guides were moved out of `docs/`; the edge cache held the old copies for a while afterwards.
- **Validation at publish time:** type check clean, 11 Node suites / 151 tests pass, `expo lint` 0 errors / 50 warnings, iOS and Android bundle exports succeed. None of the UI was run on a simulator; only the owner's device has seen it.

---

## November 22, 2026 — Full Native Rebuild: iOS Production Build #30 (`runtimeVersion: "2.0.0-media-3"`)

User requested a full EAS native rebuild to ship native **Apple Maps Look Around (`MKLookAroundViewController`)**, **QR Code Scanner (`expo-camera`)**, **Camera & Photo Library church photo uploads (`expo-image-picker`, `expo-image-manipulator`)**, plus all Riverbank church, photo gallery, profile linking, YouTube Music-style comments sheet, audio deadlock, and 24 stability fixes.

- **Current Source Version & Runtime:** `version: "2.0.0"`, explicit `"runtimeVersion": "2.0.0-media-3"` in `himnario/app.json`.
- **iOS `production`, Build #30 (`2.0.0 (30)`) — FINISHED & AUTO-SUBMITTED TO APP STORE CONNECT / TESTFLIGHT:**
  - **EAS Build:** [`b6501dac-6ab5-4a5f-86e1-1740ce1036d3`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/b6501dac-6ab5-4a5f-86e1-1740ce1036d3)
  - **IPA Artifact:** `https://expo.dev/artifacts/eas/M_p7fFfbqEmaQIGbjTOL22NAFFl6tee3N0eimTJCPIg.ipa`
  - **Auto-Submission:** [`8a54ce14-8c49-4b9f-a352-20a9306cc064`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/8a54ce14-8c49-4b9f-a352-20a9306cc064) (Uploaded — do **not** run a manual `eas submit` for Build 30).
  - **New Native Modules Compiled into `2.0.0-media-3`:**
    - `himnario/modules/apple-look-around` (`AppleLookAroundModule.swift` — local Expo Swift module autolinked via `himnario/package.json` `expo.autolinking.searchPaths`, wrapping iOS 16+ `MKLookAroundSceneRequest` & `MKLookAroundViewController`).
    - `expo-camera` (in-app QR code scanner via `CameraView`).
    - `expo-image-picker` + `expo-image-manipulator` (camera/gallery church photos resized to ≤1400px JPEG with EXIF stripped).
    - `NSCameraUsageDescription` and `NSPhotoLibraryUsageDescription` added to `himnario/app.json` `ios.infoPlist`.
- **Previous Nov 22 iOS OTAs on `2.0.0-maps-2` (for older Build 29 testers before upgrading to Build 30):**
  - `986859ba-293c-44f4-821c-ac55c794b1bf` (Audio end-of-track deadlock + 24 app-wide bug fixes + sync conflict resolution).
  - `68b58182-9f32-4855-9dbd-a81a31ac2ac2` (Phase 1 Churches map + custom cross-free sanctuary pins).
- **Android Status:** The last built Android APK (`45c31c43`) is still on runtime `2.0.0-securestore-1`. Run `eas build --platform android --profile preview-arm64` (or `production` for Play Store `.aab`) from `himnario/` when ready to cut an Android `2.0.0-media-3` binary with Maps, Location, Camera, and Photo Picker.
- **Backend & Web Paired Deployments (Live):**
  - **Cloudflare D1 `ebp-himnario-db`:** Migrations `0003` through `0008_church_gallery_and_link.sql` applied on remote D1 (seeded `church-riverbank-ca`).
  - **Cloudflare Worker `ebp-himnario-sync`:** Version `3e08460e-b5b5-4f99-97f1-eaa8bac1365b` with `env.MEDIA_BUCKET` (`ebp-himnario-audio`) binding.
  - **Cloudflare Pages `ebp-himnario`:** Deploy `972eec98.ebp-himnario.pages.dev` (`privacy.html` & `terms.html` updated and anonymized).

---

### Historical Releases Below

## Local verse chat fixes — November 20, 2026 (Superseded by Build 30)

Keyboard-visible first taps, emoji/self-reply submission, failed-send recovery, pending reply IDs and rapid heart toggles are fixed locally. **115 tests and TypeScript pass.** No OTA, rebuild or deployment was performed for this follow-up; the last published update remains `6d52ccb1-13d5-4cb7-a1c9-022c3701bf9a`. Source version/runtime stay **2.0.0 / 2.0.0-maps-2**. See [the app editing handoff](guides/APP-EDITING-ANALYSIS.md) for causes, safeguards and device checks.


## November 20, 2026 — Published iOS OTA after Antigravity handoff

User authorized finishing Antigravity's interrupted verse-share/My Church work and publishing OTA. Source version remains **2.0.0**. Current explicit runtime is **2.0.0-maps-2**, with an existing finished iOS **build 29** (`7237c570-3ed2-4e37-9651-099d1154d247`, created November 20). Maps/location/native changes belong to that already-created binary; the finishing changes below add no native modules.

- **Published and independently verified:** iOS production OTA group [`6d52ccb1-13d5-4cb7-a1c9-022c3701bf9a`](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/6d52ccb1-13d5-4cb7-a1c9-022c3701bf9a), update `01a1fb5a-4334-71db-b734-37c1e205fa07`, created **2026-11-20 15:45:59 PST** (`23:45:59Z`). Live channel `production` is unpaused and maps to branch `production`; verified update platform `ios`, runtime `2.0.0-maps-2`, branch `production`.
- Antigravity had already published group `e4aecd8c-256f-4a93-a05f-3ad1b471d35d` at `23:37:28Z` despite the screenshot's credit-error message. This follow-up fixes a real remaining first-share race rather than treating that screenshot as proof publication failed.
- Verse PNG footer preserves the bundled `white-ios-logo.png` left of the stacked app name and printed download address. iOS receives a **single local PNG attachment** with no separate message/website item. Native SVG photo/logo readiness replaces fixed decode sleeps; failed preparation shows an error instead of silently opening a text share. Selection changes cancel stale export and unique cache filenames avoid stale share previews. The decode wait has a bounded timeout and repeat taps are locked while sharing.
- Preserved Antigravity's compact grouped country/city/church form and public-visibility switch. Added VoiceOver/TalkBack labels and disabled country changes while saving. Form data and visibility behavior are preserved.
- **Android compatibility:** latest verified Android preview APK is still build 3, runtime `2.0.0-securestore-1` (`45c31c43-e36e-4952-a15a-238ac2c1521c`). It cannot receive maps-runtime OTA. No Android OTA, native rebuild, store submission, Worker/D1/Pages deployment, Git commit or push was made in this finishing turn. An Android maps-capable rebuild remains separate work; do not mislabel the old runtime to force delivery.
- **Validation:** TypeScript passed; scoped ESLint has zero errors (seven existing warnings); 101 tests passed across sharing readiness, community/API, player presentation/playback, gestures, storage and mobile auth. EAS exported and uploaded the iOS Hermes bundle successfully. Read-only live health, verse summary and churches endpoints returned 200. These checks do not establish physical-device appearance or TestFlight installation; test share behavior and the form on compatible build 29.
- Relevant finishing files: `components/VerseCard.tsx`, `components/CommunityProfile.tsx`, `utils/verseSharing.ts`, `scripts/test-verse-sharing.cjs`. Keep the other uncommitted Antigravity/community changes intact.

Earlier release/development entries below remain historical evidence and may describe prior runtimes or pre-deployment states.


## Local community implementation — November 17, 2026

Verse-of-the-Day discussions, profiles, sole-admin moderation, choir repertoire, prepared backgrounds, player overlay/navigation fixes and bilingual legal drafts are implemented locally. **No deployment, OTA, native rebuild or store submission was made for this work.** Version remains **2.0.0**, runtime **2.0.0-securestore-1**; no native dependencies changed. See the [implementation and release handoff](guides/VERSE-COMMUNITY-HANDOFF.md) for schema migration 0003, safeguards, validation and release order. Earlier live-state notes below are historical and do not describe this unreleased work.


## November 15, 2026 — Full Security, Email Auth & UI Polish Live Status (`2.0.0`, `runtimeVersion: "2.0.0-securestore-1"`)

All security, Email Auth, Cloudflare Pages, and `expo-secure-store` native rebuilds are live, followed by OTA Update **`f2dae896-2d5b-4ad6-96c9-b49e3249ae4a`** (`production` and `preview`, runtime `2.0.0-securestore-1`):
- **Production Worker & D1**: `ebp-himnario-sync` version **`6e056043-383c-44e6-9187-22ee9aad0c52`** deployed with `env.EMAIL` bound (`cuenta@auth.himnarioebp.com`), `auth.himnarioebp.com` Email Sending enabled in Cloudflare, and D1 migration `0002_email_auth.sql` applied on `ebp-himnario-db`.
- **Cloudflare Pages**: `https://himnarioebp.com/account.html` + `_headers` + `privacy.html` deployed (`f21d7e62.ebp-himnario.pages.dev`).
- **Native Rebuilds (`runtimeVersion: "2.0.0-securestore-1"`)**:
  - **Android (`preview-arm64` APK)**: `45c31c43-e36e-4952-a15a-238ac2c1521c`
  - **iOS (`production`, Build `22`)**: `a72551f5-58d3-403c-b8d6-589f048c0ad6` (App Store Connect auto-submit `c1d9bbc6-4df7-4301-bb98-965a42c4d974`). *Note: Build `22` delivered to App Store Connect with early warning `ITMS-91182` for `assets/fonts/ios/SFProText-Semibold.otf`; `assets/fonts/ios/` has since been deleted so Build `23+` will be completely clean.*
- **Latest OTA Update (`f2dae896-2d5b-4ad6-96c9-b49e3249ae4a`, `production` & `preview`, runtime `2.0.0-securestore-1`)**: Fixed `AuthSheet` Settings Font Size `12 px` lock bug (full Slider + live preview + 1 px steppers), restored native iOS `UISwitch` colors (`#34C759`), restored classic cream/burgundy profile avatar (removing the Apple blue gradient), separated/tightened `HomeHeaderActions` glass bubbles (`gap: 12`, `spacing: 6`, `±7 pt`), and unified `app/_layout.tsx` on `@expo-google-fonts/newsreader` + `@expo-google-fonts/public-sans`. See [SECURITY-REMEDIATION-PLAN.md](guides/SECURITY-REMEDIATION-PLAN.md) and [APP-EDITING-ANALYSIS.md](guides/APP-EDITING-ANALYSIS.md).

Run native commands from `himnario/`. Configuration lives in `app.json` and `eas.json`; credentials belong outside source control.
## Configuration

- Expo account: `isaacduran`; project: `74ef3b4c-fe90-4c2c-8521-b52f4b6a5441`.
- iOS bundle: `com.elbuenpastor`; App Store Connect ID: `6794435414`.
- Provisioning Profile: `ZM5HK4A7JT` (has `Associated Domains` enabled for `applinks:himnarioebp.com`).
- Android package: `com.elbuenpastor.himnario`.
- Current runtime: explicit `"2.0.0-notif-4"` in `himnario/app.json`; source version `2.0.0` (iOS Build 33). Builds 30–31 use `2.0.0-media-3`; older iOS Build 29 uses `2.0.0-maps-2`; the older Android preview binary still uses `2.0.0-securestore-1`.
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

EAS Update allows delivering compatible JavaScript, TypeScript, styling, and asset updates to already-installed apps on physical devices (TestFlight, iOS App Store, Google Play Store, and Preview APKs) **without needing a new app store review, binary upload, or 15-minute cloud build**.

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

**Current configuration uses explicit `"runtimeVersion": "2.0.0-media-3"`, not an appVersion policy.** Preserve compatibility isolation between `2.0.0-media-3` (Camera + Image Picker + Apple Look Around), `2.0.0-maps-2` (Maps/Location), and older `2.0.0-securestore-1` binaries. The appVersion explanation below describes an older configuration, not the current source.

Historical configuration: `"runtimeVersion": { "policy": "appVersion" }`.
- EAS Update matches the user-facing `version` (current unreleased source: `2.0.0`).
- Delivery requires a compatible native binary, matching runtime/platform, and the correct live channel-to-branch mapping. Matching a version string alone does not establish native compatibility or immediate delivery.
- Bumping `version` under `appVersion` creates a new runtime: a native build is required. Installed `2.0.0` test binaries may share this runtime label while lacking SecureStore; do not send the new native-dependent bundle to those binaries by OTA. SecureStore cannot be added by OTA to binaries without that native module.

### 4. Golden Decision Matrix: `eas update` vs. `eas build`

| Modification | Can use `eas update`? | Required Action |
|---|---|---|
| Bug fix in `.tsx`, `.ts`, `.js`, or CSS styling | ✅ **YES (compatible runtime)** | Run `eas update --branch production --message "..."` |
| Lyric, title, or category changes in `alabanzasPaginas.js` | ✅ **YES (compatible runtime)** | Run `eas update --branch production --message "..."` |
| Layout, color, animation, or UI logic tweaks | ✅ **YES (compatible runtime)** | Run `eas update --branch production --message "..."` |
| Updating static images/icons in `assets/` | ✅ **YES (compatible runtime)** | Run `eas update --branch production --message "..."` |
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

### November 15, 2026 — Version `2.0.0` Release: Optional Account & Cloud Sync (Cloudflare Worker + D1), Apple Books `ID` Header & Unified `AuthSheet`, iOS 26 Connecting Liquid Glass Circles (`GlassContainer`), Anti-Bot Hardening & Settings UI Redesign

- **Version Bumped to `2.0.0` (`himnario/app.json`, `himnario/package.json`)**:
  - Native builds completed on runtime `2.0.0` (iOS `production` Build 20 auto-submitted to TestFlight/App Store Connect; Android `preview-arm64` APK built).
- **Latest OTA Updates Published on Runtime `2.0.0` (November 15, 2026)**:
  - **`production` & `preview` Update Group (`23922bbe-f53b-41d2-8d34-eef7c739cf64`)**: [EAS Dashboard](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/23922bbe-f53b-41d2-8d34-eef7c739cf64) · iOS `01a1defb-5ee9-72e6-a284-c692d779a3f2` · Android `01a1defb-5ee9-7963-9199-48900315adac`.
  - **Cloudflare Worker + D1 Cloud Sync (`workers/ebp-auth-sync/`, `context/AuthContext.tsx`)**:
    - Deployed Worker `ebp-himnario-sync` (`https://ebp-himnario-sync.himnario.workers.dev`, Version `5e626283-1559-462e-830f-56d0e19f86fc`) backed by Cloudflare D1 `ebp-himnario-db` (`ed683396-bfd7-43ff-b69e-f82cf4621c55`).
    - Optional, non-blocking sign-in / account creation (`PBKDF2-HMAC-SHA256` 100k iterations + per-user random salt, `SHA-256` session token hashes) that union-merges Favorites, Playlists, Recent Hymns, and Reading Preferences across devices with `1200ms` debounced auto-sync.
    - Hardened with D1 `rate_limits` sliding-window lockout (`429` after 5 failed login attempts with `1m` → `5m` → `15m` progressive backoff, per-IP signup/reset/sync caps, `64 KB` body cap, honeypot bot trap, `120ms` timing floor, and session revocation on password reset).
  - **Apple Books Profile Circle & iOS 26 Connecting Liquid Glass (`HomeHeaderActions.tsx`)**:
    - Replaced the 3-item header with two large `46×46pt` circles: **Search (`🔍`)** on the left and **Profile / Unified App Menu (`ID` initials on `#9EA9DC → #7683BE` `APPLE_AVATAR_GRADIENT` when signed in, or `person.crop.circle.fill` when signed out)** on the right.
    - On iOS 26+ (`isLiquidGlassAvailable()`), wraps both circles inside `<GlassContainer spacing={18}>` with direct `Animated.createAnimatedComponent(GlassView)` children (`isInteractive`) and Reanimated `Gesture.Pan()` spring drag (`±20pt`) so nudging/dragging either circle toward the other stretches Apple's native `UIGlassContainerEffect` Liquid Glass metaball bridge between them.
  - **Unified `AuthSheet` UX & Bug Fixes (`components/AuthSheet.tsx`, `context/AuthContext.tsx`)**:
    - Consolidates Account/Cloud Sync, Share App (`share`), Settings (`settings`), Offline Downloads (`downloads`), Help (`help`), and History/About (`about`) as in-sheet sub-pages inside a single modal, eliminating iOS modal-collision freezes.
    - Added live `Keyboard` height listeners to dynamically clamp `sheetMaxHeight` below `insets.top + 12` so the grabber and **`Listo`** exit button never scroll or push behind the Dynamic Island when the keyboard opens.
    - Added Show/Hide password eye toggle (`showPassword`), decoupled the submit spinner from background `isSyncing`, and added `sessionEpochRef` + `AbortController` (`syncAbortRef`) in `AuthContext` so signing out immediately cancels pending sync timers and aborts in-flight requests.
  - **Settings Screen Redesign & Dark Mode Switch Fix (`app/(tabs)/settings.tsx`, `HomeMenuSheet.tsx`, `AuthSheet.tsx`, `LanguageContext.tsx`)**:
    - Upgraded the `CUENTA Y NUBE` card in `settings.tsx` with a `44×44pt` circular avatar badge, accented title (`#6e1619` light / `#F2D7B6` dark), `"Entrar ›"` / `"Sign In ›"` CTA pill, and an explanatory cloud-backup footnote underneath.
    - Added **Compartir aplicación / Share App** under `General` in `settings.tsx` wired to `<AppShareSheet />` (with `if (!visible) return null` guard in `AppShareSheet.tsx`).
    - Fixed the Dark Mode `<Switch>` across `settings.tsx`, `AuthSheet.tsx`, and `HomeMenuSheet.tsx` so Light Mode stays unchanged (`#6e1619` burgundy track + white knob) while Dark Mode renders a crisp `#FFFFFF` knob on our `#373737` (`theme.surfaceVariants.container`) dark-gray track.
    - Replaced personal name placeholder with `"Ej. Juan Pérez"` / `"e.g. John Doe"`.

### November 14, 2026 — YouTube Music Horizontal Track Swipe in `MiniPlayer`, iOS 26 Liquid Glass Lifecycle & Optical Centering, Quick Web Feedback Form Prefill, 3D Leather Web Covers & Hymn 429 Lyric Fix (Published via OTA on Runtime `1.1.0`)

- **Published via EAS Update (OTA) on Runtime `1.1.0`**:
  - **`production` Update Group (`7fb0f557-81d9-402e-8fac-18c2751d3d94`)**: [EAS Dashboard](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/7fb0f557-81d9-402e-8fac-18c2751d3d94) · iOS `01a1dddb-67f1-773a-be21-194b66036ea8` · Android `01a1dddb-67f1-7ce4-bb4e-0322defa98aa`.
  - **`preview` Update Group (`c2caeb70-190e-4f31-af52-e281a5bec7bd`)**: [EAS Dashboard](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/c2caeb70-190e-4f31-af52-e281a5bec7bd) · iOS `01a1dddc-242c-7ea5-925a-2938d6d9eb7e` · Android `01a1dddc-242c-7cfa-88ca-92f957850b47`.
  - **YouTube Music-Style Horizontal Track Carousel (`MiniPlayer.tsx`, `gestureMotion.ts`, `scripts/test-gesture-motion.cjs`)**: Swiping left or right on the `MiniPlayer` scrubs a 120Hz 3-slot track strip (`[prevHymn, hymn, nextHymn]`) inside the stationary `GlassSurface` capsule while keeping `Prev / Play-Pause / Next` anchored on the right, committing `skipNext()` or `skipPrev()` past `28%` width or `520pt/s` flick velocity and rubber-banding at non-wrapping boundaries.
  - **iOS 26 Liquid Glass Remount (`GlassSurface.tsx`, `home.tsx`, `HomeHeaderActions.tsx`)**: Automatic `GlassView` remount on navigation focus, app foregrounding (`AppState === 'active'`), and scrolling back into the top header range (`contentOffset.y < 35`).
  - **Header Share App Circle, Optical Centering & 120Hz Sheet Gestures (`HomeHeaderActions.tsx`, `AppMenuIcon.tsx`, `AppShareSheet.tsx`, `ShareSheet.tsx`, `HomeMenuSheet.tsx`)**: `44×44pt` Share App circle + `84×44pt` Search/Menu capsule with WWDC25 optical centering on iOS and 120Hz Reanimated swipe-down dismissal.
  - **`Favoritos` Sub-Tab Single-Line Fit (`favorites.tsx`)**: `numberOfLines={1}` + `adjustsFontSizeToFit` (`minimumFontScale={0.8}`).
  - **Quick Web Feedback Form & Auto-Prefill (`utils/feedback.ts`, `HomeMenuSheet.tsx`, `LanguageContext.tsx`, `docs/feedback.html`)**: Choice between in-app browser quick form (`?form=audio&hymn=...&title=...`, prefilling Google Form `entry.323314423`) and `mailto:` email with web-form fallback.
  - **Hymn 429 Lyric Fix (`data/alabanzasPaginas.js`, `docs/`)**: Removed duplicate leading `"Salmos 100:1-5"` line from Hymn 429 lyrics so Stanza 1 begins with `"Cantad alegres a Dios,"`.

### November 8, 2026 — iOS App Store v1.1.0 (Build 19) Approval, Presentation Mode Crash/Landscape Fix, Auto-Foreground OTA Updates & Offline Audio Revision Cache Invalidation

- **iOS `production`, build 19 (`1.1.0 (19)`) — APPROVED & LIVE ON APP STORE**:
  - [EAS build c3693e64](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/c3693e64-9693-45e0-be0e-5b286636cb54) · [Submission 1d1da2e0](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/1d1da2e0-ac74-4a39-965c-f33349c3c3b2).
  - Fixed Build 18's `EAGER_BUNDLE` failure (`Unable to resolve module ../assets/fonts/ios/NewYork-Regular.ttf`) by anchoring `/ios/` and `/android/` in `himnario/.easignore` (`ce97111`) so `assets/fonts/ios/` is never excluded from the EAS upload archive.
  - Set `"supportsTablet": false` under `"ios"` in `himnario/app.json` (`11fb627`) so App Store Connect only requires iPhone screenshots (while keeping the responsive `Platform.isPad` layout adjustments in code if tablet support is re-enabled later).
- **Latest `production` OTA Updates (Runtime `1.1.0`, targeting iOS App Store Build 19 / TestFlight & Android)**:
  - **Update Group `9778957d-6545-4d72-b8d7-393e734f92ec`** ([EAS Dashboard](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/9778957d-6545-4d72-b8d7-393e734f92ec) · iOS `01a1ba2e-5806-78fa-9614-b2d8657980d1` · Android `01a1ba2e-5806-711d-a1b8-2ca4a8235008`), superseding earlier November 8 groups `372319f0`, `e1e936f0`, and `5aa1d988`:
    1. **Presentation Mode (`ProjectorModal.tsx`) iOS Background/Foreground Crash Fix & Landscape Viewport Sizing (`a921214`, `84845e0`)**:
       - Removed all `ScreenOrientation.lockAsync` / `unlockAsync` calls on iOS (`app/_layout.tsx`, `components/ProjectorModal.tsx`). Calling `expo-screen-orientation` on iOS while a `fullScreen` `<Modal>` was mounted triggered an `EXScreenOrientationRegistry` thread-safety crash + `UIApplicationInvalidInterfaceOrientation` exception when backgrounding and foregrounding the app.
       - Replaced iOS manual landscape rotation in `ProjectorModal.tsx` with a pure `90deg` view transform (`useTransformLandscape`) using `flex: 0, width: windowDims.height, height: windowDims.width, maxHeight: windowDims.width` on `styles.root` so React Native's Yoga layout engine does not stretch the rotated container to `852×852`, keeping the top `Salir` button, stanza counter, auto-sized lyrics, and bottom controls toolbar 100% inside the visible screen.
    2. **Centered Single-Line Report Error Link (`app/hymn/[id].tsx`, `a921214`)**:
       - Added `numberOfLines={1}`, `adjustsFontSizeToFit`, `minimumFontScale={0.82}`, `alignSelf: 'center'`, and `textAlign: 'center'` to `footerReportBtn` / `footerReportText` so `"¿Encontraste un error? Reportar por correo"` stays centered on a single line.
    3. **Hymn 198 Chorus Lyric Fix (`data/alabanzasPaginas.js`, `docs/`, `a921214`)**:
       - Fixed `"Estaba esparcid"` → `"Estaba esparcido"` in Hymn 198 (`El Señor Jesús Está Llamando`) and regenerated `docs/data/hymns-data.js`, `docs/himno/198/index.html`, and `docs/hymn/198/index.html`.
    4. **Automatic Foreground OTA Updates (`app/_layout.tsx`, `bb91e3e`)**:
       - Added a foreground `AppState` listener in `ThemedStack` that calls `Updates.checkForUpdateAsync()` → `Updates.fetchUpdateAsync()` → `Updates.reloadAsync()` whenever the app opens or resumes (`AppState === 'active'`), safely skipping `reloadAsync()` while hymn audio is actively playing (`isPlayingRef.current === true`).
    5. **Per-Hymn Offline Audio Cache Invalidation (`data/audioRegistry.native.ts`, `data/audioRegistry.ts`, `audio/offline-audio.ts`, `d6c337d`)**:
       - Added `AUDIO_REVISIONS: Record<string, number>` and `getHymnAudioRevision(hymnId)`. When a recording on Cloudflare R2 is fixed/replaced, bumping its revision in `AUDIO_REVISIONS` (e.g. `'198': 2`) appends `?v=2` to the remote URL, stores the local file as `hymn_198_v2.m4a`, deletes the superseded `hymn_198.m4a` during `refreshOfflineAudio()`, and automatically re-downloads the updated recording in the background.
- **Planned for Future Native Build (Saved for Later)**:
  - **Custom App Icon Switcher (DuckDuckGo-style)**: Requires a native build (`eas build`) with `expo-alternate-app-icons` (or equivalent config plugin) registering alternate icons in iOS `Info.plist` (`CFBundleAlternateIcons`) and Android `AndroidManifest.xml` (`<activity-alias>`). Once pre-bundled in a future native release, the Settings picker UI and icon unlocking can be managed via OTA.

### November 7, 2026 — Liquid Glass `AppIcon.icon`, `Favoritos` Top Safe-Area Fix, iPad (`supportsTablet: true`) Compatibility & Privacy Policy Update (Committed for Mac Local/EAS Build)

- **Liquid Glass App Icon (`himnario/assets/images/AppIcon.icon`, `icon-composer-svgs/`, `himnario/app.json`)**: Extracted 5 `1024 × 1024` vector SVG layers (`00-background.svg` through `04-EBP.svg`) from `white-ios-logo.ai`, composed `AppIcon.icon` in Apple's Icon Composer (Default, Dark, Clear, and Tinted appearances), placed it at `himnario/assets/images/AppIcon.icon`, and configured `"ios": { "icon": "./assets/images/AppIcon.icon" }` in `himnario/app.json`.
- **iOS `Favoritos` Top Gap Fix (`himnario/app/(tabs)/_layout.tsx`)**: Added `overrideScrollViewContentInsetAdjustmentBehavior: false` to the `favorites` `<NativeTabs.Trigger>` (matching `home` and `settings`), eliminating the double top safe-area gap above the `Mis Favoritos | Listas de Reproducción` sub-tab bar on iOS.
- **iPad / Tablet Support (`himnario/app.json`, `app/_layout.tsx`, `components/ProjectorModal.tsx`, `app/(tabs)/*.tsx`, `components/VerseCard.tsx`, `app/hymn/[id].tsx`)**: Enabled `"supportsTablet": true` under `"ios"` in `app.json`, unlocked orientation rotation on iPad (`Platform.isPad`) while keeping phones locked to `PORTRAIT_UP`, added `50pt` top clearance on iPad for the iPadOS floating top tab bar pill, set `miniPlayerBottom` to `pillBottom` on iPad, and added `maxWidth: 780` centered containers on iPad.
- **Privacy Policy Polish (`docs/privacy.html`)**: Updated Section 5 (*Aplicación móvil* / *Mobile App*) in Spanish and English to explicitly cover both phones and tablets (`iPhone, iPad, or Android`) and bumped the update date to **November 2026**.

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
- iOS `production` also targets compatible App Store installations. Runtime matching (`1.1.0`) is not proof of native module equivalence across older `1.1.0` binaries (though `HomeHeaderActions.tsx` guards `MenuView` with `UIManager.hasViewManagerConfig('MenuView')` and `GlassSurface.tsx` guards `ExpoGlassEffect` so pre-Build-17 binaries safely fall back). Actual phone launch, menu symbols, tab sizing and mini-player glass/gradient still require device verification. See `guides/APP-EDITING-ANALYSIS.md` for changed files and device checklist.

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

See [Google Play status](guides/GOOGLE-PLAY-RELEASE-PLAN.md) and the [project overview](README.md).


## Security & Email-Auth Rebuild (`runtimeVersion: "2.0.0-securestore-1"`, November 15, 2026)

- **Why a new `runtimeVersion` (`2.0.0-securestore-1`) was required:** Adding `expo-secure-store` introduces native iOS Keychain / Android Keystore code. Setting `runtimeVersion` to `2.0.0-securestore-1` keeps the user-facing version at `2.0.0` while preventing earlier `2.0.0` binaries from downloading an incompatible OTA bundle.
- **Android (`preview-arm64` APK):** `45c31c43-e36e-4952-a15a-238ac2c1521c` — `https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/45c31c43-e36e-4952-a15a-238ac2c1521c`
- **iOS (`production`, Build `22`):** `a72551f5-58d3-403c-b8d6-589f048c0ad6` — `https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/a72551f5-58d3-403c-b8d6-589f048c0ad6`
- **iOS App Store Connect Auto-Submit:** `c1d9bbc6-4df7-4301-bb98-965a42c4d974` — `https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/c1d9bbc6-4df7-4301-bb98-965a42c4d974`
- **Post-Build-22 OTA (`production` & `preview`, runtime `2.0.0-securestore-1`):** `f2dae896-2d5b-4ad6-96c9-b49e3249ae4a` — `https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/updates/f2dae896-2d5b-4ad6-96c9-b49e3249ae4a`
- **Next Native Build Recommendation (`Build 23+`):** Rebuild Android/iOS natively whenever convenient so the binary itself is free of the now-deleted `assets/fonts/ios/` files (`ITMS-91182` clean) and natively embeds OTA `f2dae896`.
