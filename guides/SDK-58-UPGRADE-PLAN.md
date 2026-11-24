# Expo SDK 58 / Xcode 27 upgrade — deferred task

> **Status (November 24, 2026):** **iOS SDK 58 / Xcode 27.1 Build `#39` (`85ea3bf4`, `2.1.0-sdk58-2`, commit `143b1d3`) with `@expo/ui` iOS 26 Native Liquid Glass UI FINISHED & auto-submitted to TestFlight** on the `sdk-58` branch (superseding Build `#38` `4ce09aa6`). Physical iPhone TestFlight verification and the matching Android `2.1.0-sdk58-2` rebuild remain before merging `sdk-58` into `main` / `app-web-parity`.
> **Deadline:** April 2027.
> Any agent (Claude, Codex, Antigravity) may pick this up. Read this whole file first.

## Why this exists

Apple sent warning **ITMS-90725** for iOS Build 31: from April 2027, uploads to App Store Connect must be built with **Xcode 27 / the iOS 27 SDK**. Build 31 was built with Xcode 26.0 (the default image for Expo SDK 54) and was accepted; only future uploads are affected.

## Why it is not a one-line change

Checked on November 22, 2026 against the [EAS build infrastructure reference](https://docs.expo.dev/build-reference/infrastructure/):

- Xcode 27 images exist: `macos-tahoe-26.6-xcode-27.0`, `-27.1` (aliases `latest`, `sdk-58`) and `-27.2`.
- The same page warns that apps built on Xcode 27 images launch on iOS 27 **only if they use the UIKit scene life cycle**. SDK 57 needs `ios.enableSceneSupport` in `expo-build-properties`; older SDKs are told to stay on `auto` or their own `sdk-` alias.
- The app is on **Expo SDK 54**, which has no scene support. Setting `"image"` to an Xcode 27 image in `himnario/eas.json` without upgrading the SDK risks a build that does not open on iOS 27. **Do not do this.**

The fix is to upgrade Expo SDK 54 → 58 (`expo@58.0.26` was `latest` on npm on November 22, 2026), whose default image is Xcode 27.

## The one rule that must not be broken

Installed apps (iOS Builds 30 and 31) run `runtimeVersion` `2.0.0-media-3` and receive OTA updates from the main line of development. JavaScript built against SDK 58 must **never** be published to that runtime: it would crash every installed app on launch.

- Do the upgrade on its **own branch** (ideally its own worktree).
- Set a **new** `runtimeVersion` in `himnario/app.json` (for example `2.1.0-sdk58-1`) and bump `version` to `2.1.0` as the first commit of the branch.
- Do **not** run `eas update` from the upgrade branch at all until the owner has released a store build on the new runtime.

## How to do it

1. In `himnario/`, run `npm ci` and record a baseline: `npx tsc -p tsconfig.json --noEmit`, every `scripts/test-*.cjs` with `node --test`, `node scripts/test-web-search.js`, `npx expo lint` (0 errors / 50 warnings on November 22, 2026), and `npx expo export --platform ios --platform android` to a temporary folder.
2. Upgrade **one SDK at a time**: 54 → 55 → 56 → 57 → 58. For each step: `npm install expo@^NN.0.0`, `npx expo install --fix`, `npx expo-doctor`, read that SDK's release notes ([55](https://expo.dev/changelog/sdk-55), [56](https://expo.dev/changelog/sdk-56), [57](https://expo.dev/changelog/sdk-57), [58](https://expo.dev/changelog/sdk-58)) and apply their "Upgrading your app" section, then re-run the whole baseline. Commit after each SDK so a breakage is easy to locate. Look the documentation up; do not rely on memory for these releases.
3. Re-create the three patches in `himnario/patches/` for the versions the new SDK installs. Read each one first:
   - `react-native+0.81.5.patch`
   - `react-native-screens+4.16.0.patch` — iOS `NativeTabs` label position. Check whether upstream fixed it before re-applying.
   - `react-native-track-player+4.1.2.patch` — New Architecture event fix. **Highest risk:** this library has had no release since August 2025. If it cannot be made to compile on the newer React Native, stop and report the options. Do not swap the audio library on your own.
4. Areas most likely to need attention:
   - `expo-router` `NativeTabs` in `himnario/app/(tabs)/_layout.tsx`
   - `expo-glass-effect` in `himnario/components/GlassSurface.tsx` and `HomeHeaderActions.tsx`
   - `react-native-reanimated`, `react-native-worklets`, `react-native-gesture-handler`
   - `react-native-maps`
   - the local Swift module `himnario/modules/apple-look-around/`
   - config plugins in `himnario/app.json`, and UIKit scene support (see what SDK 57 and 58 require in `expo-build-properties`)
5. Compile check: when the JavaScript side is green on SDK 58, run **one** iOS simulator build with the existing `ios-simulator` profile (`eas build --platform ios --profile ios-simulator --non-interactive --no-wait`). Confirm in the build log that the image is an Xcode 27 one. Each build costs money: do not rebuild speculatively.
6. Do the Android rebuild in the same pass so both platforms land on the same runtime (Android is still on `2.0.0-securestore-1`).

## Limits for whoever does this

- No `production` profile build, `--auto-submit` or `eas submit` without the owner's explicit go-ahead.
- No redesign, restyling or refactoring. Change only what the upgrade forces, as small as possible. The owner's requirement is that the app looks and behaves exactly the same.
- Do not touch `himnario/data/alabanzasPaginas.js`, `docs/` website pages or Cloudflare.

## What "done" looks like

- The branch is on Expo SDK 58 with a new `runtimeVersion`.
- Type check, all test suites and both platform exports pass; `expo-doctor` is clean or its remaining findings are explained.
- All needed patches are regenerated.
- An iOS simulator build compiled on an Xcode 27 image.
- A short report for the owner: what changed, what could not be verified without a physical device, and the exact command for the TestFlight build.

## Device checklist for the owner (TestFlight, before release)

Audio playback and lock-screen controls · offline downloads · map, pins and Look Around · camera, QR scanner and photo upload · Liquid Glass surfaces (home header, churches controls and sheet, mini player) · tab bar labels on a narrow iPhone · projector mode rotation · account sign-in and cloud sync.
