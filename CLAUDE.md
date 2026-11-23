# Himnario El Buen Pastor — Agent Handoff Guide (Claude / Codex / Antigravity)

> **Last Updated:** November 22, 2026 (late evening — after iOS Build 31 and OTA `b58d065d`)
> **Branches:** `main` and `app-web-parity` are kept identical (`origin`: `https://github.com/lsaacd/EBP-APP.git`). Pull before working.
> **App Version & Runtime:** `2.0.0` · `runtimeVersion: "2.0.0-media-3"` (iOS Builds #30 and #31 on App Store Connect / TestFlight)
> **Other agents:** Codex and Antigravity read [AGENTS.md](AGENTS.md), which summarises the rules below and lists open work.

## 1. Repository Layout

| Path | Purpose |
| --- | --- |
| `himnario/` | Expo SDK 54 / React Native 0.81 / Expo Router / TypeScript mobile app (iOS & Android) |
| `himnario/modules/apple-look-around/` | Local Swift Expo module presenting iOS 16+ `MKLookAroundViewController` directly (autolinked via `himnario/package.json`) |
| `workers/ebp-auth-sync/` | Cloudflare Worker (`ebp-himnario-sync`) + D1 (`ebp-himnario-db`) + R2 (`env.MEDIA_BUCKET` → `ebp-himnario-audio`) + Email Sending (`env.EMAIL`) |
| `docs/` | Static companion website (`https://himnarioebp.com/`), deployed to Cloudflare Pages (`ebp-himnario`), including bilingual `privacy.html`, `terms.html`, `account.html`, `feedback.html`. **Everything here is served publicly** — put internal notes in `guides/`, never here |
| `guides/` | Internal handoff notes and plans (not published). Moved out of `docs/guides/` on November 22, 2026 because the website was serving them |
| `scripts/` | 11 Node regression test suites (`test-*.cjs` + `test-web-search.js`), hymn page generators (`extract-hymns.js`, `generate-hymn-pages.js`), and Cloudflare Pages deploy script |
| `.github/workflows/ci.yml` | Runs the type check and all test suites on pushes to `main` / `app-web-parity` and on pull requests |

For deep architecture and release records, see [ARCHITECTURE.md](ARCHITECTURE.md), [EAS.md](EAS.md), and [guides/APP-EDITING-ANALYSIS.md](guides/APP-EDITING-ANALYSIS.md).

---

## 2. Live Production State (November 22, 2026, evening)

- **iOS Native Production Build #31 (`2.0.0`, runtime `2.0.0-media-3`):**
  - EAS Build: `2105a538-0d18-4d29-83f6-a922c35ac656` (auto-submitted via `e1843910-ba89-4066-9549-1a6bb45b077b`). Same native modules as Build #30 plus the Look Around fix (presented directly, scene requested by map item).
  - Apple accepted it with warning **ITMS-90725** (built with the iOS 26 SDK; Xcode 27 required from April 2027). See open task 1.
  - Build #30 (`b6501dac-6ab5-4a5f-86e1-1740ce1036d3`) is still installed on some devices and shares the same runtime.
- **Latest iOS OTA on `production` / `2.0.0-media-3`:** update group `b58d065d-b081-4161-9d7f-67ab1695cc1d` (church QR code). It contains everything in section 6. Earlier groups the same day: `d351bb27-fd01-46bb-b304-393d7258d8a6`, `78f9b043-d4a3-4337-b59f-6a299003ac05`, `4cb9ae0d-49bc-4385-85ce-f11e02914322`.
- **Android Native Status:** Last built Android APK (`45c31c43`) is still on older runtime `2.0.0-securestore-1` and has none of the November work. It needs a fresh `eas build --platform android --profile preview-arm64` (or `production` `.aab`).
- **Cloudflare Worker (`ebp-himnario-sync`):** Version `3e08460e-b5b5-4f99-97f1-eaa8bac1365b` at `https://ebp-himnario-sync.himnario.workers.dev`. Unchanged on November 22 evening.
- **Cloudflare D1 (`ebp-himnario-db`, ID `ed683396-bfd7-43ff-b69e-f82cf4621c55`):** Migrations `0002`–`0008` applied live. One data edit on November 22: `church-riverbank-ca.pastor_name` changed from `Co-Pastor Azael Tapia` to `Hno Azael Tapia` (the app adds the `SDD` title). The seed in `migrations/0008_church_gallery_and_link.sql` still has the old value.
- **Cloudflare R2 (`ebp-himnario-audio` → `https://audio.himnarioebp.com/`):** Hosts hymn `.m4a` audio, `verse-backgrounds/{1,2}.png`, `hymn-covers/*.png`, and `church-photos/` (`riverbank-ca-{1,2}.jpg` + user uploads under `church-photos/uploads/<uuid>.<ext>`).
- **Cloudflare Pages (`ebp-himnario` → `https://himnarioebp.com/`):** Deploy `afdbd124.ebp-himnario.pages.dev` (November 22, from commit `285e83e`), published with `scripts/deploy-cloudflare.ps1 -AudioBaseUrl "https://audio.himnarioebp.com" -SkipAudioUpload`. Note: that script regenerates the static hymn pages, which rewrites ~1,500 files with different line endings on Windows; the content is identical, so `git checkout -- docs/` afterwards. Cloudflare caches at the edge, so a removed file can still be served for a while — purge in the dashboard if it matters.

---

## 3. Non-Negotiable Rules & Constraints

1. **NO Crosses Anywhere (Doctrinal Rule):** IDDV El Buen Pastor **never** uses crosses on church map pins, icons, logos, or UI. Preserve the cross-free sanctuary pins (`himnario/assets/images/church-pin*.png`).
2. **Administrator Anonymity in Public Policies:** **Never** write the administrator's personal name in `docs/privacy.html`, `docs/terms.html`, or user-facing policy/moderation labels. Refer to `"El administrador designado de Himnario El Buen Pastor"` / `"The designated administrator of Himnario El Buen Pastor"`.
3. **Church Photo Limits:** Max **5 photos** for regular user church requests; max **10 photos** for Admin. Pending submissions stay hidden from `GET /churches` until admin approval; rejected/deleted/removed upload photos are auto-deleted from R2 (`env.MEDIA_BUCKET`).
4. **Never Call `ScreenOrientation.lockAsync` / `unlockAsync` on iOS:** Triggers a native `EXScreenOrientationRegistry` crash on background/foreground transitions. `ProjectorModal.tsx` uses a pure `90deg` view transform on iOS.
5. **Preserve All 3 `patch-package` Patches:** `react-native+0.81.5.patch`, `react-native-screens+4.16.0.patch`, and `react-native-track-player+4.1.2.patch` under `himnario/patches/`.
6. **Never Run Manual `eas submit` After `--auto-submit`:** Causes Apple `ITMS-90189: Redundant Binary Upload`.
7. **Keep Hymn IDs as Strings & Keep Estribillos (`E`-prefixed) Separate:** Always regenerate `docs/` with `scripts/extract-hymns.js` and `scripts/generate-hymn-pages.js` after editing `himnario/data/alabanzasPaginas.js`.
8. **Publish OTAs Only From an Up-to-Date Checkout:** `eas update --branch production` replaces the JavaScript on every installed app with the contents of the current folder. Run `git pull --ff-only` and confirm `git log -1` matches `origin` first, or the live app is silently reverted. Record every publish in [EAS.md](EAS.md).
9. **Do Not Point SDK 54 at an Xcode 27 Build Image:** Leave `image` unset in `himnario/eas.json`. Apps built with Xcode 27 only launch on iOS 27 with UIKit scene support, which SDK 54 lacks. The fix is the SDK upgrade in [guides/SDK-58-UPGRADE-PLAN.md](guides/SDK-58-UPGRADE-PLAN.md), on its own branch with a new `runtimeVersion`.
10. **Fonts Are Native System Fonts:** Use the tokens in `himnario/theme/fonts.ts` by spreading them (`{ ...fonts.bold, fontSize: 20 }`). Never write a raw `fontFamily` name and never bundle Apple font files (`ITMS-91182`).
11. **Strings Live in the String Table:** User-facing text goes in `himnario/context/LanguageContext.tsx` in both `es` and `en`, read as `t.key`. Avoid new inline `es ? '…' : '…'` pairs.
12. **The Repository Is Public:** `https://github.com/lsaacd/EBP-APP` is public, so every committed file and the whole git history can be read by anyone. Never commit a key, token or password (`.gitignore` already excludes `credentials.json`, `token.json`, `.env.cloudflare`). `docs/` is the live website: internal notes go in `guides/` at the repository root, which is not published. Known exposure as of November 22, 2026: the administrator's personal email appears throughout the repository, including `ADMIN_EMAIL` in `workers/ebp-auth-sync/community.js`; see open task 5.
13. **Church Wording:** Show church names with `churchDisplayName()` ("Riverbank", not "IDDV El Buen Pastor — Riverbank") and leaders with `servantDisplayName()` ("SDD Hno Azael Tapia"; no Pastor / Co-Pastor). Say "Esta es mi iglesia", not "Vincular".

---

## 4. Exact Windows PowerShell Commands (Critical `[03]` Path Handling)

The workspace path contains square brackets (`[03]`, `[01]`), so **always use `-LiteralPath`** in PowerShell and follow these exact patterns:

### TypeScript & All Unit Tests (11 suites / 151 tests)
```powershell
Set-Location -LiteralPath "C:\Users\isaac\Desktop\[03] IDDV EL BUEN PASTOR\[01] APP\EBP APP"
npx --prefix himnario tsc -p himnario/tsconfig.json --noEmit
Get-ChildItem -LiteralPath "scripts" -Filter "test-*.cjs" | ForEach-Object {
  node --test ("scripts/" + $_.Name)
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
node scripts/test-web-search.js
```
The suites load TypeScript from `himnario/node_modules`, so run `npm ci` in `himnario/` first in a fresh checkout or worktree. `npx expo lint` from `himnario/` reports 0 errors and 50 warnings; treat a higher count as a regression.

### Cloudflare Wrangler (D1 / Worker / Pages)
- **Always** set `$env:WRANGLER_CACHE_DIR` inside the repo (otherwise Wrangler fails on `C:\node_modules\.cache\wrangler`).
- **Do NOT** load `.env.cloudflare` (stale token/account `7403`); Wrangler's default OAuth login works for D1, R2, Worker, and Pages.
- Apply new remote D1 migrations with `d1 execute --remote --file` (not `d1 migrations apply`):
```powershell
$repoRoot = "C:\Users\isaac\Desktop\[03] IDDV EL BUEN PASTOR\[01] APP\EBP APP"
$env:WRANGLER_CACHE_DIR = Join-Path $repoRoot ".wrangler-cache"
Set-Location -LiteralPath (Join-Path $repoRoot "workers\ebp-auth-sync")
npx wrangler d1 execute ebp-himnario-db --remote --file "migrations/0009_example.sql"
npx wrangler deploy
```

### EAS Build & OTA Update
```powershell
Set-Location -LiteralPath "C:\Users\isaac\Desktop\[03] IDDV EL BUEN PASTOR\[01] APP\EBP APP\himnario"
$env:EAS_NO_VCS = '1'
$env:EAS_PROJECT_ROOT = (Get-Location).Path

# OTA update for iOS Builds 30 and 31 (runtime 2.0.0-media-3, JS/asset changes only):
eas update --branch production --platform ios --message "Your update message"

# Undo the last OTA if it misbehaves:
eas update:rollback --branch production

# Full native rebuild (required if native modules/app.json plugins change, or for Android 2.0.0-media-3):
eas build --platform ios --profile production --auto-submit --non-interactive
eas build --platform android --profile preview-arm64 --non-interactive
```

---

## 5. Open / Next Tasks

1. **Expo SDK 54 → 58 for Xcode 27 (deferred by the owner; deadline April 2027):** Full plan and limits in [guides/SDK-58-UPGRADE-PLAN.md](guides/SDK-58-UPGRADE-PLAN.md). Own branch, new `runtimeVersion`, one SDK at a time. Not started.
2. **Device Check of the November 22 Evening Work:** It was built without a simulator; only the owner's phone has seen it. Confirm on TestFlight: churches top glass controls and the sheet rising on search / Lista / pin tap; church card (schedule rows, "Esta es mi iglesia" and unlink); the church form (pin fills the address, "Más detalles", schedule picker, keyboard dismiss); QR scan from Account returning on cancel; Look Around opening scrollable and facing the building (Build 31 only); native fonts on every screen for truncated labels; the floating grabber on each sheet.
3. **Android `2.0.0-media-3` Native Rebuild:** Run `eas build --platform android --profile preview-arm64` (and `production` `.aab` for Google Play). Best combined with task 1 so both platforms share a runtime.
4. **Code Health (no user-visible change):** split `himnario/app/churches.tsx` (about 4,000 lines, one component); move the remaining interpolated `es ? … : …` strings into the string table; move hard-coded colours into `theme/theme.js`; remove unused native packages (`expo-audio`, `react-native-bottom-tabs`) at the next native rebuild; the hymn `.m4a` files are tracked in git twice (`docs/audio`, `himnario/assets/audio`, 1.26 GB of history).
5. **Admin Identity:** the sole-admin check is a hard-coded email in `workers/ebp-auth-sync/community.js` (`ADMIN_EMAIL`) and in `himnario/app/churches.tsx` / `CommunityProfile.tsx`. Moving it to a Worker secret or a role check touches the live admin login; ask the owner first.
6. **Optional Anonymous Support Email:** If the owner sets up a Cloudflare Email Routing forwarding address (e.g., `soporte@himnarioebp.com`), update the public `mailto:` links in `docs/privacy.html`, `docs/terms.html`, and `docs/feedback.html` and redeploy Cloudflare Pages.

---

## 6. What Changed on November 22, 2026 (evening)

All of this is in OTA `d351bb27` and iOS Build 31. Details in [guides/APP-EDITING-ANALYSIS.md](guides/APP-EDITING-ANALYSIS.md).

- **Cleanup:** removed about 2,000 lines of unreferenced components and template files, dropped `shaka-player` and `@gorhom/bottom-sheet`, added CI.
- **String table:** 337 inline Spanish/English pairs moved into `LanguageContext.tsx`.
- **Churches screen:** map with two rows of Liquid Glass controls and one bottom sheet (`components/DetentSheet.tsx`) that is hidden at rest; church card with per-day schedule; QR share removed (scanning kept); unlink; city-only names; `SDD` leader title; location-first form with `components/ChurchScheduleEditor.tsx`.
- **Account sheet:** one "Mi iglesia" row; opening the map from the sheet no longer stacks a second map.
- **Sheets:** floating grabber (`components/SheetGrabber.tsx`) on every bottom sheet.
- **Typography:** native system fonts on both platforms via `theme/fonts.ts`.
- **Look Around (native, Build 31):** presented directly so it is interactive at once.
- **Church QR code (OTA `b58d065d`):** back on the card with Share and Print. Encoded on the device by `utils/qrPath.ts` and drawn with `react-native-svg`; printing emits the same path as inline SVG. Do not reintroduce the old `api.qrserver.com` image — it needed a network and a third party.
