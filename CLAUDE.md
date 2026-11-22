# Himnario El Buen Pastor — Agent Handoff Guide (Claude / Codex)

> **Last Updated:** November 22, 2026
> **Active Branch:** `app-web-parity` (`origin`: `https://github.com/lsaacd/EBP-APP.git`)
> **App Version & Runtime:** `2.0.0` · `runtimeVersion: "2.0.0-media-3"` (iOS Production Build #30 live on App Store Connect / TestFlight)

## 1. Repository Layout

| Path | Purpose |
| --- | --- |
| `himnario/` | Expo SDK 54 / React Native 0.81 / Expo Router / TypeScript mobile app (iOS & Android) |
| `himnario/modules/apple-look-around/` | Local Swift Expo module wrapping iOS 16+ `MKLookAroundViewController` (autolinked via `himnario/package.json`) |
| `workers/ebp-auth-sync/` | Cloudflare Worker (`ebp-himnario-sync`) + D1 (`ebp-himnario-db`) + R2 (`env.MEDIA_BUCKET` → `ebp-himnario-audio`) + Email Sending (`env.EMAIL`) |
| `docs/` | Static companion website (`https://himnarioebp.com/`), deployed to Cloudflare Pages (`ebp-himnario`), including bilingual `privacy.html`, `terms.html`, `account.html`, `feedback.html` |
| `scripts/` | 10 Node regression test suites (`test-*.cjs` + `test-web-search.js`), hymn page generators (`extract-hymns.js`, `generate-hymn-pages.js`), and Cloudflare Pages deploy script |

For deep architecture and historical release notes, see [ARCHITECTURE.md](ARCHITECTURE.md), [EAS.md](EAS.md), and [docs/guides/APP-EDITING-ANALYSIS.md](docs/guides/APP-EDITING-ANALYSIS.md).

---

## 2. Live Production State (November 22, 2026)

- **iOS Native Production Build #30 (`2.0.0`, runtime `2.0.0-media-3`):**
  - EAS Build: `b6501dac-6ab5-4a5f-86e1-1740ce1036d3` (auto-submitted via `8a54ce14-8c49-4b9f-a352-20a9306cc064`).
  - Native modules compiled in: `expo-secure-store`, `react-native-maps`, `expo-location`, `expo-camera`, `expo-image-picker`, `expo-image-manipulator`, `@react-native-menu/menu`, `react-native-track-player`, `modules/apple-look-around`.
- **Android Native Status:** Last built Android APK (`45c31c43`) is still on older runtime `2.0.0-securestore-1` and needs a fresh `eas build --platform android --profile preview-arm64` (or `production` `.aab`) to receive `2.0.0-media-3` native modules (Maps, Camera, Photo Picker, QR Scanner).
- **Cloudflare Worker (`ebp-himnario-sync`):** Version `3e08460e-b5b5-4f99-97f1-eaa8bac1365b` at `https://ebp-himnario-sync.himnario.workers.dev`.
- **Cloudflare D1 (`ebp-himnario-db`, ID `ed683396-bfd7-43ff-b69e-f82cf4621c55`):** Migrations `0002`–`0008` applied live. Seeded verified church: `church-riverbank-ca` (`IDDV El Buen Pastor — Riverbank`, `Co-Pastor Azael Tapia`, `3109 Santa Fe St, Riverbank, CA 95367`, `37.736108061398205, -120.93872212946533`, 2 photos on R2).
- **Cloudflare R2 (`ebp-himnario-audio` → `https://audio.himnarioebp.com/`):** Hosts hymn `.m4a` audio, `verse-backgrounds/{1,2}.png`, `hymn-covers/*.png`, and `church-photos/` (`riverbank-ca-{1,2}.jpg` + user uploads under `church-photos/uploads/<uuid>.<ext>`).
- **Cloudflare Pages (`ebp-himnario` → `https://himnarioebp.com/`):** Deploy `972eec98.ebp-himnario.pages.dev`.

---

## 3. Non-Negotiable Rules & Constraints

1. **NO Crosses Anywhere (Doctrinal Rule):** IDDV El Buen Pastor **never** uses crosses on church map pins, icons, logos, or UI. Preserve the cross-free sanctuary pins (`himnario/assets/images/church-pin*.png`).
2. **Administrator Anonymity in Public Policies:** **Never** write the administrator's personal name in `docs/privacy.html`, `docs/terms.html`, or user-facing policy/moderation labels. Refer to `"El administrador designado de Himnario El Buen Pastor"` / `"The designated administrator of Himnario El Buen Pastor"`.
3. **Church Photo Limits:** Max **5 photos** for regular user church requests; max **10 photos** for Admin. Pending submissions stay hidden from `GET /churches` until admin approval; rejected/deleted/removed upload photos are auto-deleted from R2 (`env.MEDIA_BUCKET`).
4. **Never Call `ScreenOrientation.lockAsync` / `unlockAsync` on iOS:** Triggers a native `EXScreenOrientationRegistry` crash on background/foreground transitions. `ProjectorModal.tsx` uses a pure `90deg` view transform on iOS.
5. **Preserve All 3 `patch-package` Patches:** `react-native+0.81.5.patch`, `react-native-screens+4.16.0.patch`, and `react-native-track-player+4.1.2.patch` under `himnario/patches/`.
6. **Never Run Manual `eas submit` After `--auto-submit`:** Causes Apple `ITMS-90189: Redundant Binary Upload`.
7. **Keep Hymn IDs as Strings & Keep Estribillos (`E`-prefixed) Separate:** Always regenerate `docs/` with `scripts/extract-hymns.js` and `scripts/generate-hymn-pages.js` after editing `himnario/data/alabanzasPaginas.js`.

---

## 4. Exact Windows PowerShell Commands (Critical `[03]` Path Handling)

The workspace path contains square brackets (`[03]`, `[01]`), so **always use `-LiteralPath`** in PowerShell and follow these exact patterns:

### TypeScript & All Unit Tests (10 suites / 143 tests)
```powershell
Set-Location -LiteralPath "C:\Users\isaac\Desktop\[03] IDDV EL BUEN PASTOR\[01] APP\EBP APP"
npx --prefix himnario tsc -p himnario/tsconfig.json --noEmit
Get-ChildItem -LiteralPath "scripts" -Filter "test-*.cjs" | ForEach-Object {
  node --test ("scripts/" + $_.Name)
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
node scripts/test-web-search.js
```

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

# OTA update for iOS Build 30+ (runtime 2.0.0-media-3, JS/asset changes only):
eas update --branch production --platform ios --message "Your update message"

# Full native rebuild (required if native modules/app.json plugins change, or for Android 2.0.0-media-3):
eas build --platform ios --profile production --auto-submit --non-interactive
eas build --platform android --profile preview-arm64 --non-interactive
```

---

## 5. Open / Next Tasks

1. **Test iOS Build #30 on Device (TestFlight):** Confirm native Apple Maps Look Around (`MKLookAroundViewController`), Riverbank 2-photo carousel, Camera/Gallery photo uploader, QR Scanner & Church QR sharing, `"Vincular mi iglesia" → "✓ Tu iglesia"`, and YouTube Music-style comments full-sheet swipe-down + `Destacados / Más recientes` sorting.
2. **Android `2.0.0-media-3` Native Rebuild:** Run `eas build --platform android --profile preview-arm64` (and `production` `.aab` for Google Play) so Android users get Maps, Location, Camera, Photo Picker, and QR Scanner.
3. **Optional Anonymous Support Email:** If the user sets up a Cloudflare Email Routing forwarding address (e.g., `soporte@himnarioebp.com`), update the public `mailto:` links in `docs/privacy.html`, `docs/terms.html`, and `docs/feedback.html` and redeploy Cloudflare Pages.
