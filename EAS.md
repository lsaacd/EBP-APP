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

See [Google Play status](docs/guides/GOOGLE-PLAY-RELEASE-PLAN.md) and the [project overview](README.md). Do not reopen the resolved Android playback issue based on old troubleshooting notes.
