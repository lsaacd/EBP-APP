# Himnario El Buen Pastor

Mobile app in `himnario/`; companion website in `docs/`.

## Status — October 30, 2026

- Android playback is fixed and working, including notification controls (confirmed by Isaac). The release is waiting on the 14-day Google Play testing period, not another music-player fix.
- iOS: Isaac reports TestFlight build 10 is current. The build 7 crash report is historical.
- Source app version: 1.1.0. Recent PDF/share/UI changes are local and need a compatible new native build; do not assume build 10 contains them.
- Website PDF export includes the original one-page format and optional two-copy landscape Letter format, a center cut line, and an include-title toggle. Deployment is separate from source edits.

## Development

From `himnario/`, run `npm ci`, then `npx expo start`. Native playback requires a development or release build, rather than Expo Go.

For a website preview, run from the repository root:

```sh
python -m http.server 8765 --bind 127.0.0.1 --directory docs
```

## Guides

- [Architecture and data](ARCHITECTURE.md)
- [App editing](docs/guides/APP-EDITING-ANALYSIS.md)
- [Native builds and updates](EAS.md)
- [Google Play status](docs/guides/GOOGLE-PLAY-RELEASE-PLAN.md)
- [Website maintenance](docs/README.md)
- [Website deployment](docs/guides/CLOUDFLARE-DEPLOYMENT.md)

[Privacy](docs/privacy.html) · [Terms](docs/terms.html)
