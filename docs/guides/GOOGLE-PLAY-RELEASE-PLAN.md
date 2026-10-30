# Google Play release plan (Android) — parked for later

Written October 29, 2026 (updated October 30, 2026). Android release work is paused; this file records where things stand and what remains. Read it together with `ANDROID-PLAYBACK-FIX.md`, `ANDROID-APK-TESTING.md`, `ANTIGRAVITY-APP-WEB-PARITY.md`, and the root `EAS.md`.

## 1. Where things stand

### Notification buttons: fixed and verified on a phone (Oct 29)

- Symptom (tested on a Samsung phone with an older preview APK and again after Codex's JS rewrite): audio plays, the Android media card shows the right title and artwork, but Play/Pause/Next/Previous/Stop do nothing.
- Root cause: in `react-native-track-player@4.1.2`, `MusicService.kt` sends every event to JavaScript through `reactNativeHost.reactInstanceManager.currentReactContext`. That is the old-architecture path. This app runs on the New Architecture (React Native 0.81, `newArchEnabled: true`), where that context is null, so every event is silently dropped, including `PlaybackQueueEnded` (auto-advance). JS-only fixes cannot help because the events never leave native code.
- Fix applied locally: both `emit()` and `emitList()` now use React Native's own `reactContext` property from `HeadlessJsTaskService`, which handles the New Architecture. The fix lives in `himnario/patches/react-native-track-player+4.1.2.patch`, which was rewritten to contain only source changes (the earlier coroutine fix in `MusicModule.kt` plus this one). The old 148 KB patch, which also held compiled build output, is backed up at `himnario/scratch/old-track-player.patch.bak`.
- Verified Oct 29: the `preview-arm64` EAS build was installed on a Samsung phone and the notification Play/Pause/Next/Previous buttons now work.
- Codex's playback controller (`himnario/audio/`, `service.js`, `NowPlayingContext.tsx`, `MusicPlayer.tsx`, `LanguageContext.tsx`) is kept: once native events arrive, its handlers are the ones that receive them.

### Other changes made Oct 29–30

- `himnario/eas.json`: new `preview-arm64` profile (extends `preview`, builds only `arm64-v8a`, APK, preview channel) for faster test builds. Production profile unchanged.
- `himnario/app.json`: Android microphone permission removed (`RECORD_AUDIO` taken out of `permissions`, added to `blockedPermissions`, and `expo-audio` plugin set to `recordAudioAndroid: false`). The app never records; the permission would draw questions in Play review. Takes effect on the next native build.
- `himnario/.easignore`: permanently excludes `assets/audio/` so neither Android nor iOS EAS builds upload or bundle the 1.3 GB of local `.m4a` files.
- `himnario/build-android-test.ps1` and `himnario/build-android-production.ps1`: right-click → Run with PowerShell to start a `preview-arm64` or `production` EAS build (sets `EAS_NO_VCS` and `EAS_PROJECT_ROOT`, needed because of the bracketed path).

## 2. Resuming the player fix

1. Install the `preview-arm64` APK from the EAS build page on an Android phone. It is signed with the real EAS keystore, so it should update the existing test app without losing local favorites.
2. Run the checklist in `ANDROID-APK-TESTING.md`: notification Play/Pause/Next/Previous, lock screen, auto-advance at the end of a hymn, playlists, reopening the app.
3. If native events now arrive but something behaves wrong, that is JavaScript: fix it and send `eas update --branch preview --platform android --message "..."` instead of rebuilding (restart the app twice to apply).

### Faster native builds (optional)

Android Studio (with bundled Java) and the Android SDK, NDK, CMake and platform-tools are already installed on this PC, so local builds are possible: `npx expo prebuild -p android` then `npx expo run:android --variant release` with the phone on USB. Caveats:

- A local build is signed with a debug key, so it will not install over an EAS-signed copy; uninstall the test copy first (this erases that phone's saved favorites/playlists).
- Spaces and square brackets in this folder's path are known to break native C++ builds on Windows. If that happens, build from a copy at a short path such as `C:\ebp`.
- Local builds are for testing only. Play Store builds must come from `eas build --profile production`, which uses the real signing key.

## 3. App size & streaming architecture (Android + iOS unified on `app-web-parity`)

Google Play limits the base module to **500 MB compressed download size** (individual asset packs 1.5 GB; 4 GB total for install-time content).

### Implemented and verified (Oct 29–30)

- `audio.himnarioebp.com` is connected to the `ebp-himnario-audio` R2 bucket (status Active). All 655 registered recordings answer HTTP 200 there, with range requests supported.
- `himnario/data/audioRegistry.ts` (shared by `audioRegistry.native.ts` and `audioRegistry.android.ts`): maps all 655 recording IDs to `https://audio.himnarioebp.com/hymn_{id}.m4a` (`315 A` → `hymn_315.m4a`). Neither Android nor iOS bundles `assets/audio/*`.
- `himnario/audio/offline-audio.ts`: plays the saved copy when present; otherwise streams and saves it in the background (`.part` file, renamed when complete). On iOS, recordings are stored in `FileSystem.cacheDirectory` (`Library/Caches/hymn-audio/`, excluded from iCloud backup per Apple's Data Storage Guidelines); on Android, in `FileSystem.documentDirectory`.
- `himnario/components/OfflineAudioCard.android.tsx` & `OfflineAudioCard.ios.tsx`: Settings → "Audio sin conexión" with progress, Download all (~1.3 GB, Wi-Fi recommended), Cancel/Resume and Delete downloads.
- Tests: `scripts/test-android-playback.cjs` now has 15 passing tests (playback controller, native adapter, first-play save, iOS `cacheDirectory` recovery, failed save cleanup, download all, cancel, resume label, and smart search engine). `npx tsc --noEmit` passes.
- Verified on a Samsung phone with a `preview-arm64` build: installed app size 119 MB (was about 1.4 GB), hymns stream and are saved on first play.
- `docs/privacy.html` Section 5 (Aplicación móvil / Mobile App) describes on-device data, iOS and Android streaming from Cloudflare, offline saving, Expo update checks and email feedback. It goes live when the website is deployed; Google Play needs it live at `https://himnarioebp.com/privacy`.

## 4. Google Play testing requirement

Personal developer accounts created after November 13, 2023 must run a **closed test with at least 12 testers who stay opted in for 14 consecutive days** before they can apply for production access. Testers who opt out early do not count, and rejoining restarts their 14 days. Organization accounts are exempt, but registering one requires a D-U-N-S number and longer verification. The $25 is the one-time registration fee.

Plan: collect 15–20 Gmail addresses from church members with Android phones (extra in case some drop out), add them as closed-test testers, send the opt-in link, and ask them to keep the app installed for the full two weeks.

To decide: does a Play Console account already exist, and is it personal or for the church?

## 5. Release order

1. ~~Verify and commit the notification fix (section 2).~~ Done Oct 29.
2. ~~Switch Android to streaming audio and configure the R2 custom domain (section 3).~~ Done Oct 29; deploy the website so the updated privacy policy is live.
3. Create or confirm the Play Console account ($25, identity verification).
4. Complete the store listing and policy forms: name, 512×512 icon, 1024×500 feature graphic, phone screenshots, privacy policy URL (`https://himnarioebp.com/privacy`), content rating, Data safety, target audience, ads (none).
5. Production build: right-click `himnario/build-android-production.ps1` → Run with PowerShell (runs `eas build --platform android --profile production` with the archive workarounds) → `.aab`.
6. First upload by hand in Play Console. Optionally use **Internal testing** first (instant, up to 100 testers).
7. **Closed testing**: 12+ testers for 14 consecutive days.
8. Apply for production access, answer Google's questions about the test, wait for review, publish.
9. Afterwards, set up the service account in `EAS.md` so `eas submit -p android` can upload future builds automatically.

## 6. Cloudflare costs

R2 pricing (checked Oct 29, 2026): storage $0.015/GB-month with 10 GB free; reads (Class B, e.g. GetObject) $0.36 per million with 10 million free per month; egress free. The 1.3 GB of audio is inside the free storage. An app user fetches each hymn once, so even a full Download all is about 655 reads; roughly 15,000 full downloads a month fit in the free tier. Website listeners fetch on each play but remain far below paid levels for a church audience. Safeguards: enable a billing notification, glance at R2 → Metrics monthly, and disable the `r2.dev` public URL once the website and preview pages use `audio.himnarioebp.com` (`scripts/generate-hymn-pages.js` still hardcodes the `r2.dev` address).

## 7. Keep live iOS 1.0.x untouched until iOS 1.1.0 store build ships

- `eas build --platform android ...` builds only Android. It does not change the App Store app.
- The iOS app and the Android app both listen on the `production` EAS Update channel. An `eas update --branch production` without `--platform android` also sends the new JavaScript to iPhones.
- **Critical (`app-web-parity` branch):** On `app-web-parity`, iOS has been unified onto streaming `audioRegistry.ts`, `native-player.ts`, and `offline-audio.ts`, plus `expo-glass-effect` and `expo-keep-awake`. Because the currently live App Store `1.0.x` binary expects bundled `require()` audio assets, **do not** push `app-web-parity` via `eas update` to `1.0.x` iPhones—ship it as a new `1.1.0` App Store build first.

## Sources

- [Google Play: app testing requirements for new personal developer accounts](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- [Google Play: maximum size limits](https://support.google.com/googleplay/android-developer/answer/9859372?hl=en)
