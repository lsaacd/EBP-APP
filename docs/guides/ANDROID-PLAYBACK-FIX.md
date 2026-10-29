# Android notification playback correction

Prepared October 29, 2026. Changes are local; no EAS Update, cloud build, store submission, or website deployment was performed.

## Reported failure

Audio played inside an older Android APK, but Android notification/lock-screen controls failed. Working browser playback does not validate this path: the static website uses HTML audio, while the APK uses native TrackPlayer 4.1.2 and a headless playback service.

## Implemented changes

- `himnario/audio/android-playback-controller.ts`: UI-independent playback state, custom queue, shuffle/repeat and serialized commands. Skip and end-of-track handling remain available after UI subscribers unsubscribe. Tracks without audio are skipped; E-prefixed collections remain distinct. Existing custom playlist wraparound is retained.
- `himnario/audio/android-player.ts`: singleton adapter for the existing native module and bundled audio. Initialization failures remain retryable; only the already-initialized error is accepted. Notification handlers register once in the service. Repeat-all is controlled over the app queue, avoiding native repeat-queue looping a single loaded hymn.
- `himnario/service.js`: Android routes directly to the shared controller instead of forwarding commands into React through DeviceEventEmitter. The unsupported destroy call is replaced with reset on the existing non-Android path as well.
- `himnario/context/NowPlayingContext.tsx`: Android subscribes to the controller rather than owning background logic. The existing iOS/web provider is retained. The obsolete Android custom-event fallback is removed.
- `himnario/components/MusicPlayer.tsx` and `context/LanguageContext.tsx`: Android loading and playback errors are surfaced in the player, including an English/Spanish retry message.

Clearing stops playback and removes the active hymn; minimizing only hides the full player. Android's existing StopPlaybackAndRemoveNotification behavior when the app is killed is preserved. This change does not promise playback after the OS terminates the process.

## Local checks

Run from the repository root:

```sh
node --test scripts/test-android-playback.cjs
```

The tests load the actual controller and native adapter with native dependencies mocked in memory. They cover detached UI playback, serialized skips, missing recordings, playlists, collection separation, retry after failed setup, audio interruptions, repeat behavior, stop during loading, and service-handler registration. They cannot establish Android MediaSession behavior on a phone.

From `himnario/`, TypeScript is checked with `npx tsc --noEmit`; use the installed ESLint executable for the changed app sources. Existing warnings in the legacy player/provider must be distinguished from errors introduced by this change.

No Android device was attached during this work. Real notification and lock-screen testing remains required before release.

## Can this go over the air?

These particular edits are JavaScript/TypeScript only. No native dependency, permissions, app configuration, Kotlin patch, or audio assets were changed. Therefore they are eligible for EAS Update **if** the installed Android binary already contains the compatible TrackPlayer native module, root service registration, and expo-updates configuration.

Current source declares Expo SDK 54, TrackPlayer 4.1.2, appVersion runtime policy and app version 1.0.0. Build profiles declare development, preview, and production channels. The old APK's actual runtime, native module versions, update URL, channel and channel-to-branch mapping have not been verified. A version string match alone is insufficient if incompatible native changes were made without a version bump.

Before any later authorized publication:

1. Identify the installed APK/build and confirm its native/runtime compatibility and update channel.
2. Use an internal compatible build to test the update. If the old APK is incompatible, lacks updates, or cannot be identified confidently, install a fresh preview APK.
3. When publishing is authorized, target Android only and the intended test channel/branch first. Do not send it to iOS or production by default.
4. Verify adoption on the phone; downloading an OTA update does not necessarily apply it until a later restart.

The older EAS guides' wording that updates apply instantly is not a guarantee. See [Expo runtime compatibility](https://docs.expo.dev/eas-update/runtime-versions/) and [downloading updates](https://docs.expo.dev/eas-update/download-updates/).

## Device acceptance checks

- Play, pause, next, previous and seek from the Android notification while the app is foregrounded, backgrounded and locked.
- One Next tap advances exactly one available recording; repeat taps do not mix title/artwork and audio.
- Automatic next-track playback works with the screen locked, including a custom playlist and missing-audio entries.
- Minimize/reopen the player and navigate between screens without restarting the current audio.
- Stop clears playback; starting a new hymn afterwards works.
- Temporarily interrupted playing audio resumes appropriately; already-paused audio stays paused.
- Recheck the existing iPhone player flow before any release that includes iOS.
