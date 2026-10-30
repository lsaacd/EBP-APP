# Google Play release plan (Android) — parked for later

Written October 29, 2026. Android release work is paused; this file records where things stand and what remains. Read it together with `ANDROID-PLAYBACK-FIX.md`, `ANDROID-APK-TESTING.md` and the root `EAS.md`.

## 1. Where things stand

### Notification buttons: fixed and verified on a phone (Oct 29)

- Symptom (tested on a Samsung phone with an older preview APK and again after Codex's JS rewrite): audio plays, the Android media card shows the right title and artwork, but Play/Pause/Next/Previous/Stop do nothing.
- Root cause: in `react-native-track-player@4.1.2`, `MusicService.kt` sends every event to JavaScript through `reactNativeHost.reactInstanceManager.currentReactContext`. That is the old-architecture path. This app runs on the New Architecture (React Native 0.81, `newArchEnabled: true`), where that context is null, so every event is silently dropped, including `PlaybackQueueEnded` (auto-advance). JS-only fixes cannot help because the events never leave native code.
- Fix applied locally: both `emit()` and `emitList()` now use React Native's own `reactContext` property from `HeadlessJsTaskService`, which handles the New Architecture. The fix lives in `himnario/patches/react-native-track-player+4.1.2.patch`, which was rewritten to contain only source changes (the earlier coroutine fix in `MusicModule.kt` plus this one). The old 148 KB patch, which also held compiled build output, is backed up at `himnario/scratch/old-track-player.patch.bak`.
- Verified Oct 29: the `preview-arm64` EAS build was installed on a Samsung phone and the notification Play/Pause/Next/Previous buttons now work.
- Codex's Android controller rewrite (`himnario/audio/`, `service.js`, `NowPlayingContext.tsx`, `MusicPlayer.tsx`, `LanguageContext.tsx`) is kept: once native events arrive, its handlers are the ones that receive them.
- Committed on branch `android-play-release`. The native patch cannot be delivered by EAS Update; it needs a native build.

### Other changes made Oct 29 (committed on branch android-play-release)

- `himnario/eas.json`: new `preview-arm64` profile (extends `preview`, builds only `arm64-v8a`, APK, preview channel) for faster test builds. Production profile unchanged.
- `himnario/app.json`: Android microphone permission removed (`RECORD_AUDIO` taken out of `permissions`, added to `blockedPermissions`, and `expo-audio` plugin set to `recordAudioAndroid: false`). The app never records; the permission would draw questions in Play review. Takes effect on the next native build.
- `himnario/build-android-test.ps1`: right-click → Run with PowerShell to start a `preview-arm64` EAS build (sets `EAS_NO_VCS` and `EAS_PROJECT_ROOT`, needed because of the bracketed path and the website's duplicate audio).

## 2. Resuming the player fix

1. Install the `preview-arm64` APK from the EAS build page on an Android phone. It is signed with the real EAS keystore, so it should update the existing test app without losing local favorites.
2. Run the checklist in `ANDROID-APK-TESTING.md`: notification Play/Pause/Next/Previous, lock screen, auto-advance at the end of a hymn, playlists, reopening the app.
3. If native events now arrive but something behaves wrong, that is JavaScript: fix it and send `eas update --branch preview --platform android --message "..."` instead of rebuilding (restart the app twice to apply).
4. When it passes, commit the patch, Codex's player changes, `eas.json`, `app.json` and the guides. Check the iPhone player too before any iOS update, because `service.js` also changed the iOS Stop handler (`destroy()` → `reset()`).

### Faster native builds (optional)

Android Studio (with bundled Java) and the Android SDK, NDK, CMake and platform-tools are already installed on this PC, so local builds are possible: `npx expo prebuild -p android` then `npx expo run:android --variant release` with the phone on USB. Caveats:

- A local build is signed with a debug key, so it will not install over an EAS-signed copy; uninstall the test copy first (this erases that phone's saved favorites/playlists).
- Spaces and square brackets in this folder's path are known to break native C++ builds on Windows. If that happens, build from a copy at a short path such as `C:\ebp`.
- Local builds are for testing only. Play Store builds must come from `eas build --profile production`, which uses the real signing key.

## 3. Blocker: app size

Google Play limits the base module to **500 MB compressed download size** (individual asset packs 1.5 GB; 4 GB total for install-time content). The app bundles about **1.3 GB of `.m4a` audio** in `himnario/assets/audio/`, which is already compressed, so a production `.aab` will be rejected. iOS is unaffected, and sideloaded test APKs are unaffected.

Options:

1. **Recommended: stream audio on Android from Cloudflare R2, with download-on-first-play.** All 656 recordings are already uploaded to the `ebp-himnario-audio` R2 bucket for the website. Use a platform-specific registry (`data/audioRegistry.android.ts` returning remote URLs; keep the existing bundled registry for iOS) so Android stops bundling the files, and cache each hymn on the device when first played so it works offline afterward. Expected Android size is roughly 50 MB.
   - Before launch, attach a custom domain to the bucket (for example `audio.himnarioebp.com`). The current `pub-…r2.dev` address is rate-limited and meant for development. Update `scripts/generate-hymn-pages.js` and the website deploy, which also use that address.
   - Update the app's privacy text and Play's Data safety form if streaming changes what is disclosed (network requests to the audio host).
   - Test offline behavior: un-played hymns need a clear "needs internet" message.
2. Play Asset Delivery (install-time asset pack up to 1.5 GB). Not supported by Expo out of the box; needs a custom config plugin and native asset-pack loading. Harder to build and maintain.
3. Re-encoding to fit under 500 MB. Requires a large quality loss. Not recommended.

### Implemented and verified on a phone (Oct 29)

- `audio.himnarioebp.com` is connected to the `ebp-himnario-audio` R2 bucket (status Active). All 655 registered recordings answer HTTP 200 there, with range requests supported. The `r2.dev` address is still enabled because the website and preview pages use it; switch them over and then disable it.
- `himnario/data/audioRegistry.android.ts`: Android-only list of recording IDs and their stream URLs. Metro uses it instead of `audioRegistry.ts` on Android, so the 1.3 GB of audio is no longer bundled in the Android app. One file name differs from its ID (`315 A` → `hymn_315.m4a`), handled by `FILE_NAME_EXCEPTIONS`.
- `himnario/audio/offline-audio.ts`: plays the saved copy when present; otherwise streams and saves it in the background (`.part` file, renamed when complete). Also provides download all (3 at a time, resumable, cancel), refresh, and delete.
- `himnario/components/OfflineAudioCard.android.tsx`: Settings → "Audio sin conexión" with progress, Download all (~1.3 GB, Wi-Fi recommended), Cancel/Resume and Delete downloads. `OfflineAudioCard.tsx` renders nothing on iOS.
- Tests: `scripts/test-android-playback.cjs` now has 12 passing tests, including first-play save, failed save cleanup, download all and cancel. `npx tsc --noEmit` passes.
- Verified on a Samsung phone with a `preview-arm64` build: installed app size 119 MB (was about 1.4 GB), hymns stream and are saved on first play ("2 de 655 guardados").
- The Settings button reads "Descargar todo" until a full download has been started on that device (marker file `hymn-audio/.download-all-started`), then "Continuar descarga". 13 tests pass.
- `docs/privacy.html` has a new section 5 (Aplicación móvil / Mobile App) describing on-device data, Android streaming from Cloudflare, offline saving, Expo update checks and email feedback. It goes live only when the website is deployed; Google Play needs it live at `https://himnarioebp.com/privacy`.
- Downloads only progress while the app is open; leaving the app pauses them, and Download all resumes where it stopped.

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

## 7. Keep iOS untouched while Android ships

- `eas build --platform android ...` builds only Android. It does not change the App Store app.
- The iOS app and the Android app both listen on the `production` EAS Update channel. An `eas update --branch production` without `--platform android` also sends the new JavaScript to iPhones. Until the iPhone player has been retested (the `service.js` Stop change also applies to iOS), always add `--platform android` to updates.
- iOS keeps bundling all audio through `audioRegistry.ts`.

## Sources

- [Google Play: app testing requirements for new personal developer accounts](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)
- [Google Play: maximum size limits](https://support.google.com/googleplay/android-developer/answer/9859372?hl=en)
