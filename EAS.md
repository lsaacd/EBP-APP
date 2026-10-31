# Native builds and updates

Run native commands from `himnario/`. Configuration lives in `app.json` and `eas.json`; credentials belong outside source control.

## Configuration

- Expo account: `isaacduran`; project: `74ef3b4c-fe90-4c2c-8521-b52f4b6a5441`.
- iOS bundle: `com.elbuenpastor`; App Store Connect ID: `6794435414`.
- Provisioning Profile: `ZM5HK4A7JT` (has `Associated Domains` enabled for `applinks:himnarioebp.com`).
- Android package: `com.elbuenpastor.himnario`.
- Runtime policy: `appVersion`; current source version: 1.1.0.
- Profiles include development, ios-simulator, preview, preview-arm64, production. Preview-arm64 builds an Android APK; production produces the store build.
- Production submission config currently supplies the iOS App Store Connect ID. Android automated submission is not configured there.

> **Caution on duplicate uploads (`ITMS-90189`):** `build-ios-testflight.ps1` runs with `--auto-submit`. Do not run a second `eas submit` manually after an auto-submitted build completes, or Apple will reject it with `ITMS-90189: Redundant Binary Upload`.

## Build helpers

- `build-android-test.ps1`: Android test APK.
- `build-android-production.ps1`: Android production build.
- `build-ios-testflight.ps1`: iOS build and automatic submission; also offers credential management.

These scripts perform cloud operations when run. Inspect them and use the intended platform/profile. The iOS helper can modify provisioning credentials.

Manual equivalents:

```sh
eas build --platform android --profile preview-arm64
eas build --platform android --profile production
eas build --platform ios --profile production
```

For this Windows path, use PowerShell `-LiteralPath`. The helpers scope the EAS archive to the app with `EAS_NO_VCS` and `EAS_PROJECT_ROOT`; local uncommitted app changes can be included.

## Updates versus builds

JS/styles can use EAS Update only when compatible with the installed native binary. Native packages, patches, entitlements and permissions require a new native build and runtime compatibility review. The newly added PDF modules require a build.

Before an authorized update, verify the installed build, runtime and live channel-to-branch mapping. Always specify the platform and intended channel/branch. Updates download/apply according to the installed configuration; they are not guaranteed to apply instantly.

A Git commit, EAS Update, native build, store submission and website deployment are separate operations.

## Release status

Latest completed builds, October 30, 2026 (Pacific):

| Target | Result | Reference |
| --- | --- | --- |
| Android 1.1.0, preview-arm64 | Finished; download verified HTTP 200, about 61 MB | [EAS build](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/c92c755a-080f-4044-a96b-c4d458b6212f) · [APK](https://expo.dev/artifacts/eas/J6BCFEg5ZUDk-viqrDIX0GfNckgU1pYCUXC2PjJHZP8.apk) |
| iOS 1.1.0 (11), production | Build FINISHED; automatic submission FINISHED without an error | [EAS build](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/builds/f7b12c3f-41f1-4779-b0ad-c44009ebeb27) · [Submission](https://expo.dev/accounts/isaacduran/projects/ElBuenPastorHimnario/submissions/dfa52d4c-7ba5-4777-94f5-3a56e6fbf1eb) |

Android includes the final bottom-anchored icon tabs, circular ripple, restored reader labels and disabled Android haptics. iOS preserves its native tabs and haptics and includes the applicable shared PDF/share changes. Older APK links in chat represent intermediate designs.

The Android APK is an internal test build, not a Google Play publication. The iOS archive was submitted for TestFlight, not released publicly; Apple processing and availability to testers are separate from EAS submission success.

These builds used the current local app sources, including uncommitted and new files. No source commit, EAS Update, website deployment or public store release was performed as part of building them.

See [Google Play status](docs/guides/GOOGLE-PLAY-RELEASE-PLAN.md) and the [project overview](README.md). Do not reopen the resolved Android playback issue based on old troubleshooting notes.
